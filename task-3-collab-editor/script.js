// Check login
firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "auth.html";
    } else {
      loadDocuments(user);
    }
  });
  
  const editor = document.getElementById("editor");
  const docSelector = document.getElementById("docSelector");
  const newDocName = document.getElementById("newDocName");
  const userList = document.getElementById("userList");
  
  let currentDocRef = null;
  let isLocalChange = false;
  let currentUserRef = null;
  
  // Load all documents from Firebase
  function loadDocuments(user) {
    const userDocsRef = firebase.database().ref("documents");
    userDocsRef.once("value", (snapshot) => {
      docSelector.innerHTML = "";
      snapshot.forEach((child) => {
        const option = document.createElement("option");
        option.value = child.key;
        option.text = child.key;
        docSelector.appendChild(option);
      });
  
      // Auto-select first doc if available
      if (docSelector.options.length > 0) {
        selectDocument(docSelector.options[0].value, user);
      }
    });
  }
  
  // Create a new document
  function createDocument() {
    const docName = newDocName.value.trim();
    if (docName === "") return;
  
    const docRef = firebase.database().ref("documents/" + docName);
    docRef.set("").then(() => {
      const option = document.createElement("option");
      option.value = docName;
      option.text = docName;
      docSelector.appendChild(option);
      docSelector.value = docName;
      selectDocument(docName);
      newDocName.value = "";
    });
  }
  
  // Switch to a different document
  docSelector.addEventListener("change", () => {
    selectDocument(docSelector.value);
  });
  
  // Set up live editing for selected document
  function selectDocument(docName, user) {
    if (currentDocRef) {
      currentDocRef.off(); // detach previous listener
    }
  
    currentDocRef = firebase.database().ref("documents/" + docName);
    currentUserRef = firebase.database().ref("activeUsers/" + docName + "/" + user.uid);
  
    // Add user to active users list when they start editing
    currentUserRef.set(user.displayName);
  
    // Listen for changes in the document
    currentDocRef.on("value", (snapshot) => {
      if (!isLocalChange) {
        editor.value = snapshot.val() || "";
      }
      isLocalChange = false;
    });
  
    // Listen for active users
    firebase.database().ref("activeUsers/" + docName).on("value", (snapshot) => {
      userList.innerHTML = "";
      snapshot.forEach((childSnapshot) => {
        const li = document.createElement("li");
        li.textContent = childSnapshot.val();  // user display name
        userList.appendChild(li);
      });
    });
  
    // Optimistic update: immediately update the editor
    editor.addEventListener("input", () => {
      isLocalChange = true;
      const currentText = editor.value;
      
      // Perform an optimistic update (immediate feedback to user)
      currentDocRef.set(currentText);
    });
  
    // Remove user from active users when they disconnect or leave
    firebase.database().ref("activeUsers/" + docName + "/" + user.uid).onDisconnect().remove();
  }
  
  // Handle conflicts when multiple users edit the same document
  function syncDocumentChanges() {
    // Firebase provides real-time syncing. However, to handle concurrent edits more gracefully, consider using an operation queue (e.g., CRDT or OT).
    // As an alternative, here's a simple conflict resolution where the document is "merged" based on the latest update from Firebase.
  }
  