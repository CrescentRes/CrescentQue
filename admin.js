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
    const totalCount = document.getElementById('totalCount');
    
    // Real-time listener for queue changes
    let unsubscribe = db.collection('queue')
        .orderBy('queueNumber', 'asc')
        .onSnapshot(
            (snapshot) => {
                queueTable.innerHTML = '';
                let waitingCount = 0;
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.status !== 'completed') waitingCount++;
                    
                    const row = document.createElement('tr');
                    row.className = data.status === 'completed' ? 'table-secondary' : '';
                    row.innerHTML = `
                        <td>Q-${data.queueNumber.toString().padStart(3, '0')}</td>
                        <td>${data.name}</td>
                        <td>${data.partySize}</td>
                        <td>${formatTime(data.timestamp?.toDate())}</td>
                        <td><span class="badge ${getStatusClass(data.status)}">${data.status || 'waiting'}</span></td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-success complete-btn" data-id="${doc.id}">Complete</button>
                                <button class="btn btn-danger remove-btn" data-id="${doc.id}">Remove</button>
                            </div>
                        </td>
                    `;
                    queueTable.appendChild(row);
                });
                
                totalCount.textContent = waitingCount;
                
                // Add event listeners to buttons
                document.querySelectorAll('.complete-btn').forEach(btn => {
                    btn.addEventListener('click', () => completeCustomer(btn.dataset.id));
                });
                
                document.querySelectorAll('.remove-btn').forEach(btn => {
                    btn.addEventListener('click', () => removeCustomer(btn.dataset.id));
                });
            },
            (error) => {
                console.error("Firestore error:", error);
                alert("Error loading queue data");
            }
        );

    // Helper functions
    function formatTime(date) {
        if (!date) return 'N/A';
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.round(diffMs / 60000);
        
        if (diffMins < 1) return 'Just arrived';
        if (diffMins < 60) return `${diffMins} min ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        return `${diffHours}h ${remainingMins}m ago`;
    }
    
    function getStatusClass(status) {
        return status === 'completed' ? 'bg-secondary' : 
               status === 'serving' ? 'bg-primary' : 'bg-success';
    }
    
    async function completeCustomer(id) {
        try {
            await db.collection('queue').doc(id).update({
                status: 'completed',
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Error completing customer:", error);
            alert("Error updating status");
        }
    }
    
    async function removeCustomer(id) {
        if (confirm('Remove this customer from queue?')) {
            try {
                await db.collection('queue').doc(id).delete();
            } catch (error) {
                console.error("Error removing customer:", error);
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
                snapshot.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            } catch (error) {
                console.error("Error clearing completed:", error);
                alert("Error clearing completed customers");
            }
        }
    }
    
    async function clearAll() {
        if (confirm('Clear ALL customers from queue?')) {
            try {
                const snapshot = await db.collection('queue').get();
                const batch = db.batch();
                snapshot.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            } catch (error) {
                console.error("Error clearing all:", error);
                alert("Error clearing queue");
            }
        }
    }
    
    // Initialize buttons
    document.getElementById('clearCompletedBtn').addEventListener('click', clearCompleted);
    document.getElementById('clearAllBtn').addEventListener('click', clearAll);
    document.getElementById('refreshBtn').addEventListener('click', () => {
        // Real-time listener automatically refreshes
        alert('Queue refreshed');
    });
    
    // Initialize counter if not exists
    initializeCounter();
});

async function initializeCounter() {
    const counterRef = db.collection('metadata').doc('queueCounter');
    const doc = await counterRef.get();
    
    if (!doc.exists) {
        // Find the highest existing queue number
        const snapshot = await db.collection('queue')
            .orderBy('queueNumber', 'desc')
            .limit(1)
            .get();
        
        const lastNumber = snapshot.empty ? 0 : snapshot.docs[0].data().queueNumber;
        await counterRef.set({ lastNumber: lastNumber });
        console.log("Counter initialized to:", lastNumber);
    }
}