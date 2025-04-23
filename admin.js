

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



// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Debugging check
console.log("Firebase initialized:", firebase.app().name);

document.addEventListener("DOMContentLoaded", function () {
  const queueTable = document.getElementById("queueTable");
  const totalCount = document.getElementById("totalCount");

  // Debug element
  const debugDiv = document.createElement("div");
  debugDiv.style.position = "fixed";
  debugDiv.style.bottom = "10px";
  debugDiv.style.right = "10px";
  debugDiv.style.backgroundColor = "#f8f9fa";
  debugDiv.style.padding = "10px";
  debugDiv.style.border = "1px solid #ddd";
  debugDiv.style.borderRadius = "5px";
  debugDiv.style.zIndex = "1000";
  document.body.appendChild(debugDiv);

  // Real-time listener with error handling
  let unsubscribe = db
    .collection("queue")
    .orderBy("timestamp", "asc")
    .onSnapshot(
      (snapshot) => {
        debugDiv.innerHTML = ``;

        queueTable.innerHTML = "";
        let waitingCount = 0;

        // In your admin.js, find where you create table rows and change:
        snapshot.forEach((doc) => {
          const data = doc.data();
          const row = document.createElement("tr");
          row.innerHTML = `
      <td>Q-${data.queueNumber
        .toString()
        .padStart(3, "0")}</td> <!-- Just change this line -->
      <td>${data.name || "N/A"}</td>
      <td>${data.partySize || "N/A"}</td>
      <td>${formatTime(data.timestamp?.toDate())}</td>
      <td><span class="badge ${getStatusClass(data.status)}">${
            data.status || "waiting"
          }</span></td>
      <td>
          <button class="btn btn-sm btn-success complete-btn" data-id="${
            doc.id
          }">Complete</button>
          <button class="btn btn-sm btn-danger remove-btn" data-id="${
            doc.id
          }">Remove</button>
      </td>
  `;
          queueTable.appendChild(row);
        });

        totalCount.textContent = waitingCount;

        // Add event listeners to new buttons
        document.querySelectorAll(".complete-btn").forEach((btn) => {
          btn.addEventListener("click", () => completeCustomer(btn.dataset.id));
        });

        document.querySelectorAll(".remove-btn").forEach((btn) => {
          btn.addEventListener("click", () => removeCustomer(btn.dataset.id));
        });
      },
      (error) => {
        console.error("Firestore error:", error);
        debugDiv.innerHTML = `Error: ${error.message}`;
      }
    );

  // Ensure debug element is hidden on initialization
  document.addEventListener("DOMContentLoaded", function () {
    const debugEl = document.getElementById("firebase-debug");
    if (debugEl) {
      debugEl.style.display = "none";

      // Your existing debug code can remain
      db.collection("queue")
        .limit(1)
        .get()
        .then((snap) => {
          debugEl.textContent = `Connected: ${snap.size} docs`;
          // Message will be there if you need to inspect it
        })
        .catch((err) => {
          debugEl.textContent = `Error: ${err.message}`;
          debugEl.style.display = "block"; // Only show on error
          debugEl.classList.add("alert-danger");
        });
    }
  });

  // Helper functions
  function formatTime(date) {
    if (!date) return "N/A";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function getStatusClass(status) {
    return status === "completed"
      ? "bg-secondary"
      : status === "serving"
      ? "bg-primary"
      : "bg-success";
  }

  // Add this after Firebase initialization
  async function debugFirestoreConnection() {
    const debugInfo = {
      appName: firebase.app().name,
      projectId: firebase.app().options.projectId,
      databaseUrl: firebase.app().options.databaseURL,
      timestamp: new Date().toISOString(),
    };

    try {
      // Test with a direct query
      const snapshot = await db.collection("queue").get();

      debugInfo.documentCount = snapshot.size;
      debugInfo.firstDoc = snapshot.empty ? null : snapshot.docs[0].data();

      // List all collections (requires Firebase Admin SDK or special rules)
      // This might fail due to security rules
      try {
        const collections = await db.listCollections();
        debugInfo.collections = collections.map((col) => col.id);
      } catch (e) {
        debugInfo.collectionsError = e.message;
      }
    } catch (error) {
      debugInfo.error = error.message;
    }
  }

  debugFirestoreConnection();

  // Mobile connection monitor
  function monitorConnection() {
    const connectionInfo = document.createElement("div");
    connectionInfo.style.position = "fixed";
    connectionInfo.style.bottom = "10px";
    connectionInfo.style.left = "10px";
    connectionInfo.style.backgroundColor = "rgba(0,0,0,0.7)";
    connectionInfo.style.color = "white";
    connectionInfo.style.padding = "5px";
    connectionInfo.style.borderRadius = "5px";
    connectionInfo.style.zIndex = "10000";
    document.body.appendChild(connectionInfo);

    function updateConnectionStatus() {
      const online = navigator.onLine ? "Online" : "Offline";
      const width = window.innerWidth;
      const height = window.innerHeight;
      connectionInfo.textContent = `${online} | ${width}×${height} | ${
        isMobile() ? "Mobile" : "Desktop"
      }`;
    }

    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);
    window.addEventListener("resize", updateConnectionStatus);
    updateConnectionStatus();
  }

  monitorConnection();

  async function completeCustomer(id) {
    try {
      await db.collection("queue").doc(id).update({
        status: "completed",
        completedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error completing customer:", error);
      alert("Error updating status");
    }
  }

  async function removeCustomer(id) {
    if (confirm("Remove this customer from queue?")) {
      try {
        await db.collection("queue").doc(id).delete();
      } catch (error) {
        console.error("Error removing customer:", error);
        alert("Error removing customer");
      }
    }
  }

  // Clear buttons functionality
  document
    .getElementById("clearCompletedBtn")
    ?.addEventListener("click", clearCompleted);
  document.getElementById("clearAllBtn")?.addEventListener("click", clearAll);

  async function clearCompleted() {
    if (confirm("Clear all completed customers?")) {
      try {
        const snapshot = await db
          .collection("queue")
          .where("status", "==", "completed")
          .get();

        const batch = db.batch();
        snapshot.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      } catch (error) {
        console.error("Error clearing completed:", error);
        alert("Error clearing completed customers");
      }
    }
  }

  async function clearAll() {
    if (confirm("Clear ALL customers from queue?")) {
      try {
        const snapshot = await db.collection("queue").get();
        const batch = db.batch();
        snapshot.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      } catch (error) {
        console.error("Error clearing all:", error);
        alert("Error clearing queue");
      }
    }
  }

  // Automatic date-based reset (no server needed)
  async function checkDailyReset() {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem("lastResetDate");

    if (lastReset !== today) {
      try {
        await db
          .collection("metadata")
          .doc("queueCounter")
          .set({ lastNumber: 0 });
        localStorage.setItem("lastResetDate", today);
        console.log("Daily counter reset");
      } catch (error) {
        console.error("Reset failed:", error);
      }
    }
  }

  // Call this when admin page loads
  checkDailyReset();
});
