// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwv0xOOliAnlXivDEVnndaVXPf91C5fA8",
  authDomain: "crescent-queue-system.firebaseapp.com",
  projectId: "crescent-queue-system",
  storageBucket: "crescent-queue-system.appspot.com",
  messagingSenderId: "326862097681",
  appId: "1:326862097681:web:e0205177054de6f90010b0",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function getNextQueueNumber() {
  const counterRef = db.collection("metadata").doc("queueCounter");

  try {
    return await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(counterRef);

      // Initialize counter if it doesn't exist
      if (!doc.exists) {
        // Find highest existing queue number
        const snapshot = await db
          .collection("queue")
          .orderBy("queueNumber", "desc")
          .limit(1)
          .get();

        const lastNumber = snapshot.empty
          ? 0
          : snapshot.docs[0].data().queueNumber;
        transaction.set(counterRef, { lastNumber: lastNumber });
        return lastNumber + 1;
      }

      // Normal increment
      const lastNumber = doc.data().lastNumber;
      const nextNumber = lastNumber + 1;
      transaction.update(counterRef, { lastNumber: nextNumber });
      return nextNumber;
    });
  } catch (error) {
    console.error("Transaction error:", error);
    throw error;
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

    // Mobile-friendly input handling
    const nameInput = document.getElementById("customerName");
    const partyInput = document.getElementById("partySize");

    // Blur inputs to dismiss mobile keyboards
    nameInput.blur();
    partyInput.blur();

    const name = nameInput.value.trim();
    const partySize = partyInput.value;
    const submitBtn = queueForm.querySelector('button[type="submit"]');

    // Mobile validation
    if (!name) {
      alert("Please enter your name");
      nameInput.focus();
      return;
    }

    try {
      // Show loading state with mobile-optimized spinner
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Loading...</span>
            </span> Processing...
        `;

      // Add slight delay for mobile UI to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get next queue number with mobile network resilience
      const queueNumber = await withRetry(getNextQueueNumber, 3);

      // Add customer to queue with timestamp
      await withRetry(async () => {
        await db.collection("queue").add({
          queueNumber: queueNumber,
          name: name,
          partySize: parseInt(partySize),
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          status: "waiting",
          deviceType: isMobile() ? "mobile" : "desktop",
        });
      }, 2);

      // Mobile-optimized result display
      queueNumberDisplay.textContent = `Q-${queueNumber
        .toString()
        .padStart(3, "0")}`;
      customerInfo.textContent = `Name: ${name}\nParty of ${partySize}`;
      queueForm.reset();

      // Scroll to results on mobile
      queueResult.classList.remove("d-none");
      queueResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      console.error("Mobile submission error:", error);
      alert("Please check your connection and try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Get Queue Number";
    }
  });

  // Mobile helper functions
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  async function withRetry(fn, retries = 2, delay = 1000) {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      await new Promise((res) => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
  }

  newCustomerBtn.addEventListener("click", function () {
    queueResult.classList.add("d-none");
  });
});
