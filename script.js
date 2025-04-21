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
    const queueForm = document.getElementById('queueForm');
    const queueResult = document.getElementById('queueResult');
    const queueNumberDisplay = document.getElementById('queueNumberDisplay');
    const customerInfo = document.getElementById('customerInfo');
    const newCustomerBtn = document.getElementById('newCustomerBtn');
    
    queueForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('customerName').value;
        const partySize = document.getElementById('partySize').value;
        const submitBtn = queueForm.querySelector('button[type="submit"]');
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

            // Atomic increment of queue number
            const counterRef = db.collection('metadata').doc('queueCounter');
            const newNumber = await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(counterRef);
                const lastNumber = doc.exists ? doc.data().lastNumber : 0;
                const nextNumber = lastNumber + 1;
                transaction.set(counterRef, { lastNumber: nextNumber }, { merge: true });
                return nextNumber;
            });

            // Add customer to queue
            await db.collection('queue').add({
                queueNumber: newNumber,
                name: name,
                partySize: parseInt(partySize),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'waiting'
            });

            // Display results
            queueNumberDisplay.textContent = `Q-${newNumber.toString().padStart(3, '0')}`;
            customerInfo.textContent = `Name: ${name} (Party of ${partySize})`;
            queueForm.reset();
            queueResult.classList.remove('d-none');

        } catch (error) {
            console.error("Error:", error);
            alert("Error getting queue number. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Get Queue Number';
        }
    });
    
    newCustomerBtn.addEventListener('click', function() {
        queueResult.classList.add('d-none');
    });
});