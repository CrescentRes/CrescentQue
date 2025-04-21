// Replace your entire admin.js with this code:

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
        debugDiv.innerHTML = `Last update: ${new Date().toLocaleTimeString()}<br>Documents: ${
          snapshot.size
        }`;

        queueTable.innerHTML = "";
        let waitingCount = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status !== "completed") waitingCount++;

          const row = document.createElement("tr");
          row.innerHTML = `
                        <td>Q-${doc.id.substring(0, 6).toUpperCase()}</td>
                        <td>${data.name || "N/A"}</td>
                        <td>${data.partySize || "N/A"}</td>
                        <td>${formatTime(data.timestamp?.toDate())}</td>
                        <td><span class="badge ${getStatusClass(
                          data.status
                        )}">${data.status || "waiting"}</span></td>
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

    // Display debug info
    const debugEl = document.getElementById("firebase-debug") || document.body;
    debugEl.innerHTML = `
    <div style="position:fixed;bottom:10px;right:10px;background:#f8f9fa;padding:10px;border:1px solid #ddd;border-radius:5px;z-index:1000">
      <h5>Firestore Debug</h5>
      <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  `;
  }

  debugFirestoreConnection();

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
});
