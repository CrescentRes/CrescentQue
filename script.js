// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwv0xOOliAnlXivDEVnndaVXPf91C5fA8",
  authDomain: "crescent-queue-system.firebaseapp.com",
  projectId: "crescent-queue-system",
  storageBucket: "crescent-queue-system.firebasestorage.app",
  messagingSenderId: "326862097681",
  appId: "1:326862097681:web:e0205177054de6f90010b0",
  measurementId: "G-ZGT8Y8V3ZC",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function () {
  const queueForm = document.getElementById("queueForm");
  const queueResult = document.getElementById("queueResult");
  const queueNumberDisplay = document.getElementById("queueNumberDisplay");
  const customerInfo = document.getElementById("customerInfo");
  const newCustomerBtn = document.getElementById("newCustomerBtn");

  // In script.js - replace the form submit handler with this:

  queueForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("customerName").value;
    const partySize = document.getElementById("partySize").value;

    try {
      // Show loading state
      const submitBtn = queueForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

      // Add to Firestore
      const docRef = await db.collection("queue").add({
        name: name,
        partySize: parseInt(partySize),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: "waiting",
      });

      console.log("Document written with ID: ", docRef.id); // Debug log

      // Display results
      const shortId = docRef.id.substring(0, 6).toUpperCase();
      queueNumberDisplay.textContent = `Q-${shortId}`;
      customerInfo.textContent = `Name: ${name} (Party of ${partySize})`;
      queueForm.reset();
      queueResult.classList.remove("d-none");
    } catch (error) {
      console.error("Error adding document: ", error);
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
