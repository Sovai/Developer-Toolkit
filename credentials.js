// UAT Credentials Manager
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");
  const addBtn = document.getElementById("addBtn");
  const clearFormBtn = document.getElementById("clearFormBtn");
  const credentialsTable = document.getElementById("credentialsTable");
  const showFormBtn = document.getElementById("showFormBtn");
  const hideFormBtn = document.getElementById("hideFormBtn");
  const credentialForm = document.getElementById("credentialForm");
  const formTitle = document.querySelector(".form-header h2");
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");

  // Store current editing state
  let editingCredentialId = null;

  // Initialize credentials from storage
  loadCredentials();

  // Event Listeners
  addBtn.addEventListener("click", addOrUpdateCredential);
  clearFormBtn.addEventListener("click", clearForm);
  showFormBtn.addEventListener("click", showForm);
  hideFormBtn.addEventListener("click", hideForm);
  searchInput.addEventListener("input", filterCredentials);
  clearSearchBtn.addEventListener("click", clearSearch);

  // Functions
  function loadCredentials() {
    const credentials = getCredentialsFromStorage();
    renderCredentialsTable(credentials);
  }

  function getCredentialsFromStorage() {
    const storedCredentials = localStorage.getItem("uatCredentials");
    return storedCredentials ? JSON.parse(storedCredentials) : [];
  }

  function saveCredentialsToStorage(credentials) {
    localStorage.setItem("uatCredentials", JSON.stringify(credentials));
  }

  function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  function showForm() {
    credentialForm.classList.remove("hidden");
    showFormBtn.classList.add("hidden");

    // Set appropriate title based on whether we're editing or adding
    if (editingCredentialId) {
      formTitle.textContent = "Update Credential";
    } else {
      formTitle.textContent = "New Credential";
    }

    usernameInput.focus();
  }

  function hideForm() {
    credentialForm.classList.add("hidden");
    showFormBtn.classList.remove("hidden");
    clearForm();

    // If there was a search filter, maintain it
    filterCredentials();
  }

  function clearForm() {
    usernameInput.value = "";
    passwordInput.value = "";
    editingCredentialId = null;
    addBtn.textContent = "Add Credential";
    formTitle.textContent = "New Credential";
  }

  function addOrUpdateCredential() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    const credentials = getCredentialsFromStorage();

    if (editingCredentialId) {
      // Update existing credential
      const index = credentials.findIndex(
        (cred) => cred.id === editingCredentialId
      );
      if (index !== -1) {
        credentials[index] = {
          id: editingCredentialId,
          username,
          password,
        };
      }
    } else {
      // Add new credential
      credentials.push({
        id: generateUniqueId(),
        username,
        password,
      });
    }

    saveCredentialsToStorage(credentials);
    clearForm();
    hideForm();

    // The hideForm function will call filterCredentials to apply any existing search filter
  }

  function deleteCredential(id) {
    if (confirm("Are you sure you want to delete this credential?")) {
      const credentials = getCredentialsFromStorage();
      const updatedCredentials = credentials.filter((cred) => cred.id !== id);
      saveCredentialsToStorage(updatedCredentials);

      // Maintain the search filter if any
      filterCredentials();

      // If we were editing this credential, clear the form
      if (editingCredentialId === id) {
        clearForm();
      }
    }
  }
  function editCredential(id) {
    const credentials = getCredentialsFromStorage();
    const credential = credentials.find((cred) => cred.id === id);

    if (credential) {
      // Show the form if it's hidden
      showForm();

      // Update form title and button text for editing mode
      formTitle.textContent = "Update Credential";
      addBtn.textContent = "Update Credential";

      usernameInput.value = credential.username;
      passwordInput.value = credential.password;
      editingCredentialId = id;

      // Scroll to top to see the form
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Show a temporary feedback
        const tempDiv = document.createElement("div");
        tempDiv.textContent = "Copied!";
        tempDiv.style.position = "fixed";
        tempDiv.style.top = "10px";
        tempDiv.style.left = "50%";
        tempDiv.style.transform = "translateX(-50%)";
        tempDiv.style.padding = "8px 16px";
        tempDiv.style.backgroundColor = "var(--fg-primary)";
        tempDiv.style.color = "white";
        tempDiv.style.borderRadius = "var(--radius)";
        tempDiv.style.zIndex = "1000";
        document.body.appendChild(tempDiv);

        setTimeout(() => {
          document.body.removeChild(tempDiv);
        }, 1500);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  }

  function togglePasswordVisibility(passwordElement, toggleBtn) {
    const isPasswordVisible = passwordElement.classList.contains("visible");

    if (isPasswordVisible) {
      // Hide password
      passwordElement.classList.remove("visible");
      passwordElement.innerHTML = "••••••••";
      toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    } else {
      // Show password
      const credentials = getCredentialsFromStorage();
      const row = passwordElement.closest(".credential-row");
      const id = row.getAttribute("data-id");
      const credential = credentials.find((cred) => cred.id === id);

      if (credential) {
        passwordElement.classList.add("visible");
        passwordElement.textContent = credential.password;
        toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>`;
      }
    }
  }

  function clearSearch() {
    searchInput.value = "";
    filterCredentials();
    searchInput.focus();
  }

  function filterCredentials() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const credentials = getCredentialsFromStorage();

    if (searchTerm === "") {
      renderCredentialsTable(credentials);
      return;
    }

    const filteredCredentials = credentials.filter((credential) =>
      credential.username.toLowerCase().includes(searchTerm)
    );

    renderCredentialsTable(filteredCredentials, searchTerm);
  }

  function renderCredentialsTable(credentials, searchTerm = "") {
    credentialsTable.innerHTML = "";

    if (credentials.length === 0) {
      if (searchTerm) {
        credentialsTable.innerHTML = `<div class="no-credentials">No credentials matching "${searchTerm}" found.</div>`;
      } else {
        credentialsTable.innerHTML =
          '<div class="no-credentials">No credentials saved yet. Add some above!</div>';
      }
      return;
    }

    credentials.forEach((credential) => {
      const row = document.createElement("div");
      row.className = "credential-row";
      row.setAttribute("data-id", credential.id);

      // Set edit mode class if this is the credential being edited
      if (editingCredentialId === credential.id) {
        row.classList.add("edit-mode");
      }

      // Username column with copy button
      const usernameCol = document.createElement("div");
      usernameCol.className = "username-col";

      const usernameText = document.createElement("span");

      // If there's a search term active, highlight it in the username
      if (
        searchTerm &&
        credential.username.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        const username = credential.username;
        const lowerUsername = username.toLowerCase();
        const lowerSearchTerm = searchTerm.toLowerCase();
        const index = lowerUsername.indexOf(lowerSearchTerm);

        // Create highlighted HTML
        usernameText.innerHTML =
          username.substring(0, index) +
          `<span class="highlight">${username.substring(
            index,
            index + searchTerm.length
          )}</span>` +
          username.substring(index + searchTerm.length);
      } else {
        usernameText.textContent = credential.username;
      }

      usernameCol.appendChild(usernameText);

      const copyUsernameBtn = document.createElement("button");
      copyUsernameBtn.className = "action-btn copy-btn";
      copyUsernameBtn.title = "Copy username";
      copyUsernameBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.998 10c-.012-2.175-.108-3.353-.877-4.121C19.243 5 17.828 5 15 5h-3c-2.828 0-4.243 0-5.121.879C6 6.757 6 8.172 6 11v5c0 2.828 0 4.243.879 5.121C7.757 22 9.172 22 12 22h3c2.828 0 4.243 0 5.121-.879C21 20.243 21 18.828 21 16v-1"></path><path d="M3 10v6a3 3 0 0 0 3 3M18 5a3 3 0 0 0-3-3h-4C7.229 2 5.343 2 4.172 3.172C3.518 3.825 3.229 4.7 3.102 6"></path></svg>`;
      copyUsernameBtn.addEventListener("click", () =>
        copyToClipboard(credential.username)
      );
      usernameCol.appendChild(copyUsernameBtn);

      // Password column with toggle visibility and copy buttons
      const passwordCol = document.createElement("div");
      passwordCol.className = "password-col";

      const passwordText = document.createElement("span");
      passwordText.className = "password-mask";
      passwordText.innerHTML = "••••••••";
      passwordCol.appendChild(passwordText);

      const togglePasswordBtn = document.createElement("button");
      togglePasswordBtn.className = "toggle-password";
      togglePasswordBtn.title = "Show/hide password";
      togglePasswordBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      togglePasswordBtn.addEventListener("click", () =>
        togglePasswordVisibility(passwordText, togglePasswordBtn)
      );
      passwordCol.appendChild(togglePasswordBtn);

      const copyPasswordBtn = document.createElement("button");
      copyPasswordBtn.className = "action-btn copy-btn";
      copyPasswordBtn.title = "Copy password";
      copyPasswordBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.998 10c-.012-2.175-.108-3.353-.877-4.121C19.243 5 17.828 5 15 5h-3c-2.828 0-4.243 0-5.121.879C6 6.757 6 8.172 6 11v5c0 2.828 0 4.243.879 5.121C7.757 22 9.172 22 12 22h3c2.828 0 4.243 0 5.121-.879C21 20.243 21 18.828 21 16v-1"></path><path d="M3 10v6a3 3 0 0 0 3 3M18 5a3 3 0 0 0-3-3h-4C7.229 2 5.343 2 4.172 3.172C3.518 3.825 3.229 4.7 3.102 6"></path></svg>`;
      copyPasswordBtn.addEventListener("click", () =>
        copyToClipboard(credential.password)
      );
      passwordCol.appendChild(copyPasswordBtn);

      // Actions column
      const actionsCol = document.createElement("div");
      actionsCol.className = "actions-col";

      const editBtn = document.createElement("button");
      editBtn.className = "action-btn edit-btn";
      editBtn.title = "Edit";
      editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
      editBtn.addEventListener("click", () => editCredential(credential.id));
      actionsCol.appendChild(editBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "action-btn delete-btn";
      deleteBtn.title = "Delete";
      deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>`;
      deleteBtn.addEventListener("click", () =>
        deleteCredential(credential.id)
      );
      actionsCol.appendChild(deleteBtn);

      // Add all columns to the row
      row.appendChild(usernameCol);
      row.appendChild(passwordCol);
      row.appendChild(actionsCol);

      // Add row to the table
      credentialsTable.appendChild(row);
    });
  }
});
