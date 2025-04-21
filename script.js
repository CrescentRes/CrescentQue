// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwv0xOOliAnlXivDEVnndaVXPf91C5fA8",
  authDomain: "crescent-queue-system.firebaseapp.com",
  projectId: "crescent-queue-system",
  storageBucket: "crescent-queue-system.appspot.com",
  messagingSenderId: "326862097681",
  appId: "1:326862097681:web:e0205177054de6f90010b0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Initialize queue counter (run once)
async function initializeCounter() {
  try {
    const counterRef = db.collection('metadata').doc('queueCounter');
    const doc = await counterRef.get();
    
    if (!doc.exists) {
      // Set initial counter to highest existing queue number or 0
      const snapshot = await db.collection('queue')
        .orderBy('queueNumber', 'desc')
        .limit(1)
        .get();
      
      const lastNumber = snapshot.empty ? 0 : snapshot.docs[0].data().queueNumber;
      await counterRef.set({ lastNumber: lastNumber });
      console.log("Counter initialized to:", lastNumber);
    }
  } catch (error) {
    console.error("Counter initialization error:", error);
  }
}

// Call this once when setting up your system
initializeCounter();

document.addEventListener("DOMContentLoaded", function () {
  const queueForm = document.getElementById("queueForm");
  const queueResult = document.getElementById("queueResult");
  const queueNumberDisplay = document.getElementById("queueNumberDisplay");
  const customerInfo = document.getElementById("customerInfo");
  const newCustomerBtn = document.getElementById("newCustomerBtn");

  queueForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("customerName").value;
    const partySize = document.getElementById("partySize").value;
    const submitBtn = queueForm.querySelector('button[type="submit"]');

    try {
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = 
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

      // Get next queue number (transactionally)
      const counterRef = db.collection('metadata').doc('queueCounter');
      const newNumber = await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(counterRef);
        const lastNumber = doc.exists ? doc.data().lastNumber : 0;
        const nextNumber = lastNumber + 1;
        transaction.set(counterRef, { lastNumber: nextNumber }, { merge: true });
        return nextNumber;
      });

      // Add customer to queue
      await db.collection("queue").add({
        queueNumber: newNumber,
        name: name,
        partySize: parseInt(partySize),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: "waiting"
      });

      // Display results
      queueNumberDisplay.textContent = `Q-${newNumber.toString().padStart(3, '0')}`;
      customerInfo.textContent = `Name: ${name} (Party of ${partySize})`;
      queueForm.reset();
      queueResult.classList.remove("d-none");

    } catch (error) {
      console.error("Error:", error);
      alert("Error getting queue number. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Get Queue Number";
    }
  });

  newCustomerBtn.addEventListener("click", function () {
    queueResult.classList.add("d-none");
  });
});