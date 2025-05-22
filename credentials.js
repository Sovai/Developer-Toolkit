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
    // Temporarily removing confirm dialog to test if that's causing the issue
    const credentials = getCredentialsFromStorage();
    const updatedCredentials = credentials.filter((cred) => cred.id !== id);
    saveCredentialsToStorage(updatedCredentials);

    // Maintain the search filter if any
    filterCredentials();

    // If we were editing this credential, clear the form
    if (editingCredentialId === id) {
      clearForm();
    }

    // Log to console for debugging
    console.log("Credential deleted:", id);
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

      // Username column (clickable to copy)
      const usernameCol = document.createElement("div");
      usernameCol.className = "username-col clickable";
      usernameCol.title = "Click to copy username";

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

      // Add click event to copy the username
      usernameCol.addEventListener("click", () =>
        copyToClipboard(credential.username)
      );

      // Password column with toggle visibility (clickable to copy)
      const passwordCol = document.createElement("div");
      passwordCol.className = "password-col";

      const passwordContainer = document.createElement("div");
      passwordContainer.className = "password-container clickable";
      passwordContainer.title = "Click to copy password";
      passwordCol.appendChild(passwordContainer);

      const passwordText = document.createElement("span");
      passwordText.className = "password-mask";
      passwordText.innerHTML = "••••••••";
      passwordContainer.appendChild(passwordText);

      // Add click event to copy the password
      passwordContainer.addEventListener("click", () =>
        copyToClipboard(credential.password)
      );

      const togglePasswordBtn = document.createElement("button");
      togglePasswordBtn.className = "toggle-password";
      togglePasswordBtn.title = "Show/hide password";
      togglePasswordBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      togglePasswordBtn.addEventListener("click", () =>
        togglePasswordVisibility(passwordText, togglePasswordBtn)
      );
      passwordCol.appendChild(togglePasswordBtn);

      // Actions column
      const actionsCol = document.createElement("div");
      actionsCol.className = "actions-col";

      // Add autofill button
      const autofillBtn = document.createElement("button");
      autofillBtn.className = "action-btn autofill-btn";
      autofillBtn.title = "Autofill in current tab";
      autofillBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 11 4-7 4 7"/><path d="M9 4v16"/><path d="M5 20h8"/><path d="M16 16h6m-3-3v6"/></svg>`;
      autofillBtn.addEventListener("click", () =>
        autofillCredential(credential.username, credential.password)
      );
      actionsCol.appendChild(autofillBtn);

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

      // Use more explicit event binding with a variable to hold the ID
      const credentialIdToDelete = credential.id;
      deleteBtn.onclick = function () {
        console.log("Delete button clicked for ID:", credentialIdToDelete);
        deleteCredential(credentialIdToDelete);
      };

      actionsCol.appendChild(deleteBtn);

      // Add all columns to the row
      row.appendChild(usernameCol);
      row.appendChild(passwordCol);
      row.appendChild(actionsCol);

      // Add row to the table
      credentialsTable.appendChild(row);
    });
  }

  // Autofill function to fill username and password in active tab
  function autofillCredential(username, password) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length === 0) {
        alert("No active tab found");
        return;
      }

      const activeTab = tabs[0];

      // Inject script to fill the form fields
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          func: (username, password) => {
            // Find username input fields by common attributes
            const usernameFields = document.querySelectorAll(
              'input[type="text"][name="username"], input[type="email"][name="username"], input[name="email"], input[type="text"][id="username"], input[type="email"][id="username"], input[id="email"], input[name="user"], input[id="user"]'
            );

            // Find password input fields - include both type="password" and inputs with "password" in name/id even if they're type="text"
            const passwordFields = document.querySelectorAll(
              'input[type="password"], input[name="password"], input[id="password"], input[name*="password" i], input[id*="password" i]'
            );

            let usernameField = null;

            // Try to find username field
            if (usernameFields.length > 0) {
              usernameField = usernameFields[0]; // Take the first match
            } else {
              // As a fallback, look for any visible input that might be username
              const visibleTextInputs = Array.from(
                document.querySelectorAll(
                  'input[type="text"], input[type="email"]'
                )
              ).filter((input) => {
                const rect = input.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
              });
              if (visibleTextInputs.length > 0) {
                usernameField = visibleTextInputs[0];
              }
            }

            // Fill username if found
            if (usernameField) {
              usernameField.value = username;
              // Trigger input event for modern frameworks
              usernameField.dispatchEvent(
                new Event("input", { bubbles: true })
              );
              usernameField.dispatchEvent(
                new Event("change", { bubbles: true })
              );
            }

            // Fill password if found
            if (passwordFields.length > 0) {
              const passwordField = passwordFields[0]; // Take the first password field
              passwordField.value = password;
              // Trigger input event for modern frameworks
              passwordField.dispatchEvent(
                new Event("input", { bubbles: true })
              );
              passwordField.dispatchEvent(
                new Event("change", { bubbles: true })
              );
            }

            return {
              usernameFound: !!usernameField,
              passwordFound: passwordFields.length > 0,
            };
          },
          args: [username, password],
        },
        (results) => {
          if (chrome.runtime.lastError) {
            alert(`Error: ${chrome.runtime.lastError.message}`);
            return;
          }

          const result = results[0]?.result;
          if (!result?.usernameFound && !result?.passwordFound) {
            alert("No login fields found on the page");
          } else if (!result?.usernameFound) {
            alert("Username field not found, but password was filled");
          } else if (!result?.passwordFound) {
            alert("Password field not found, but username was filled");
          } else {
            // Show a temporary feedback
            const tempDiv = document.createElement("div");
            tempDiv.textContent = "Autofill complete!";
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
          }
        }
      );
    });
  }
});
