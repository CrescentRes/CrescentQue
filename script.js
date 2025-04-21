// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwv0xOOliAnlXivDEVnndaVXPf91C5fA8",
  authDomain: "crescent-queue-system.firebaseapp.com",
  projectId: "crescent-queue-system",
  storageBucket: "crescent-queue-system.firebasestorage.app",
  messagingSenderId: "326862097681",
  appId: "1:326862097681:web:e0205177054de6f90010b0",
  measurementId: "G-ZGT8Y8V3ZC"
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
        
        // Get form values
        const name = document.getElementById('customerName').value;
        const partySize = document.getElementById('partySize').value;
        
        try {
            // Add to Firestore
            const docRef = await db.collection('queue').add({
                name: name,
                partySize: parseInt(partySize),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'waiting'
            });
            
            // Get the auto-generated ID as queue number
            const queueId = docRef.id;
            const shortId = queueId.substring(0, 6).toUpperCase();
            
            // Display results
            queueNumberDisplay.textContent = `Q-${shortId}`;
            customerInfo.textContent = `Name: ${name} (Party of ${partySize})`;
            
            // Show result and hide form
            queueForm.reset();
            queueResult.classList.remove('d-none');
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Error getting queue number. Please try again.");
        }
    });
    
    newCustomerBtn.addEventListener('click', function() {
        queueResult.classList.add('d-none');
    });
});