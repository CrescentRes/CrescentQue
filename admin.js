// Initialize Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    const queueTable = document.getElementById('queueTable');
    const refreshBtn = document.getElementById('refreshBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const totalCount = document.getElementById('totalCount');
    
    // Real-time listener for queue changes
    let unsubscribe = db.collection('queue')
        .orderBy('timestamp')
        .onSnapshot(snapshot => {
            queueTable.innerHTML = '';
            let count = 0;
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const timeArrived = data.timestamp?.toDate() || new Date();
                const waitingTime = calculateWaitingTime(timeArrived);
                
                const row = document.createElement('tr');
                row.className = data.status === 'completed' ? 'table-secondary' : '';
                row.innerHTML = `
                    <td>Q-${doc.id.substring(0, 6).toUpperCase()}</td>
                    <td>${data.name}</td>
                    <td>${data.partySize}</td>
                    <td>${waitingTime}</td>
                    <td>
                        <span class="badge ${getStatusBadgeClass(data.status)}">
                            ${data.status || 'waiting'}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-success complete-btn" data-id="${doc.id}">
                                Complete
                            </button>
                            <button class="btn btn-danger remove-btn" data-id="${doc.id}">
                                Remove
                            </button>
                        </div>
                    </td>
                `;
                queueTable.appendChild(row);
                if (data.status !== 'completed') count++;
            });
            
            totalCount.textContent = count;
            
            // Add event listeners to buttons
            document.querySelectorAll('.complete-btn').forEach(btn => {
                btn.addEventListener('click', () => completeCustomer(btn.getAttribute('data-id')));
            });
            
            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', () => removeCustomer(btn.getAttribute('data-id')));
            });
        });
    
    function calculateWaitingTime(arrivalTime) {
        const now = new Date();
        const diffMs = now - arrivalTime;
        const diffMins = Math.round(diffMs / 60000);
        
        if (diffMins < 1) return 'Just arrived';
        if (diffMins < 60) return `${diffMins} min ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        return `${diffHours}h ${remainingMins}m ago`;
    }
    
    function getStatusBadgeClass(status) {
        switch(status) {
            case 'completed': return 'bg-secondary';
            case 'serving': return 'bg-primary';
            default: return 'bg-success';
        }
    }
    
    async function completeCustomer(id) {
        try {
            await db.collection('queue').doc(id).update({
                status: 'completed',
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Error completing customer: ", error);
            alert("Error updating status");
        }
    }
    
    async function removeCustomer(id) {
        if (confirm('Are you sure you want to remove this customer from the queue?')) {
            try {
                await db.collection('queue').doc(id).delete();
            } catch (error) {
                console.error("Error removing customer: ", error);
                alert("Error removing customer");
            }
        }
    }
    
    async function clearCompleted() {
        if (confirm('Clear all completed customers?')) {
            try {
                const snapshot = await db.collection('queue')
                    .where('status', '==', 'completed')
                    .get();
                
                const batch = db.batch();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            } catch (error) {
                console.error("Error clearing completed: ", error);
                alert("Error clearing completed customers");
            }
        }
    }
    
    async function clearAll() {
        if (confirm('Clear ALL customers from queue?')) {
            try {
                const snapshot = await db.collection('queue').get();
                
                const batch = db.batch();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            } catch (error) {
                console.error("Error clearing all: ", error);
                alert("Error clearing queue");
            }
        }
    }
    
    refreshBtn.addEventListener('click', () => {
        // Our real-time listener automatically refreshes
        alert('Queue refreshed');
    });
    
    clearCompletedBtn.addEventListener('click', clearCompleted);
    clearAllBtn.addEventListener('click', clearAll);
    
    // Clean up listener when page unloads
    window.addEventListener('beforeunload', () => {
        if (unsubscribe) unsubscribe();
    });
});