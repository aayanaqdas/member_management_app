import { fetchWithToken, checkToken, logout } from "./auth.js";
import { showPopup } from "./utils.js";

function validatePasswords() {
  const password = document.getElementById("psw").value;
  const confirmPassword = document.getElementById("confirmPsw").value;
  const submitBtn = document.getElementById("registerFormSubmitBtn");
  const pswMessage = document.getElementById("confirmPswMessage");

  if (password !== confirmPassword) {
    document
      .getElementById("confirmPsw")
      .setCustomValidity("Password do not match.");
    submitBtn.disabled = true;
    pswMessage.style.display = "block";
    pswMessage.innerHTML = "Passwords do not match.";
  } else {
    document.getElementById("confirmPsw").setCustomValidity("");
    submitBtn.disabled = false;
    pswMessage.style.display = "none";
  }
}

async function registerUser() {
  checkToken();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("psw").value;
  const confirmPassword = document.getElementById("confirmPsw").value;
  const role = document.getElementById("selectRole").value;

  if (password !== confirmPassword) {
    showPopup("error", "Passwords do not match.");
  } else {
    try {
      const response = await fetchWithToken("/api/dashboard/register", "json", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        console.log(data.message);
        showPopup(data.status, data.message);
        getUsers();
      } else if (data.status === "error") {
        console.error(data.message);
        showPopup(data.status, data.message);
      }
    } catch (error) {
      console.error(error);
      showPopup("error", "An error occurred during registration.");
    }
  }
}

async function showRegisterModal() {
  // const modalText = document.getElementById("modalText");
  const addBtn = document.getElementById("addBtn");
  const registerFormModal = document.getElementById("addUserModal");
  const registerForm = document.getElementById("registerForm");
  const closeModalBtn = document.querySelector(".forms-modal .close");

  const formSubmitBtn = document.getElementById("registerFormSubmitBtn");
  const loader = formSubmitBtn.querySelector(".loader");
  const btnText = formSubmitBtn.querySelector(".btn-text");

  addBtn.addEventListener("click", () => {
    registerFormModal.classList.remove("hide-element");
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Show loader and hide button text
    formSubmitBtn.disabled = true;
    loader.style.display = "inline-block";
    btnText.style.display = "none";

    await registerUser();

    // Hide loader and show button text
    formSubmitBtn.disabled = false;
    loader.style.display = "none";
    btnText.style.display = "inline-block";

    registerForm.reset();
    registerFormModal.classList.add("hide-element");

    formSubmitBtn.disabled = true;
  });

  closeModalBtn.addEventListener("click", () => {
    registerFormModal.classList.add("hide-element");
  });

  window.addEventListener("click", (event) => {
    if (event.target == registerFormModal) {
      registerFormModal.classList.add("hide-element");
    }
  });

  document.getElementById("psw").addEventListener("input", validatePasswords);
  document
    .getElementById("confirmPsw")
    .addEventListener("input", validatePasswords);
}

async function getUsers() {
  try {
    const response = await fetchWithToken("/api/dashboard/users", "json", {
      method: "GET",
    });
    if (!response) return;

    const data = await response.json();
    populateUsersTable(data.users);
  } catch (error) {
    console.error(error);
    showPopup("error", "Failed to retrieve users.");
  }
}

function populateUsersTable(users) {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  users.forEach((user) => {
    const { id, name, email, role, untouchable } = user;

    const row = document.createElement("tr");
    row.classList.add("table-row");

    row.innerHTML = `
                <td>${name}</td>
                <td>${email}</td>
                <td class="role-group-table">
                  <select name="role" class="select-role-table" required ${
                    untouchable ? "disabled" : ""
                  }>
                    <option value="" disabled selected hidden>Velg rolle</option>
                    <option value="Guest">Guest</option>
                    <option value="Editor">Editor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td>
                <button class="delete-user-btn" data-userid="${id}" ${
      untouchable ? "disabled" : ""
    }>
                  <img src="/static/images/delete.svg" alt="delete user" />
                </button>
                </td>
          `;

    tableBody.appendChild(row);
    row.querySelector(".select-role-table").value = role;
  });
}

function changeUserRole() {
  const tableBody = document.getElementById("tableBody");
  tableBody.addEventListener("change", async (e) => {
    if (e.target.classList.contains("select-role-table")) {
      const userId = e.target
        .closest(".table-row")
        .querySelector(".delete-user-btn").dataset.userid;
      const role = e.target.value;
      try {
        const response = await fetchWithToken(
          "/api/dashboard/users/change_role",
          "json",
          {
            method: "PUT",
            body: JSON.stringify({ userId, role }),
          }
        );
        const data = await response.json();
        if (data.status === "success") {
          console.log(data.message);
          showPopup(data.status, data.message);
        } else if (data.status === "error") {
          console.error(data.message);
          showPopup(data.status, data.message);
        }
      } catch (error) {
        console.error(error);
        showPopup("error", "An error occurred while updating the user role.");
      }
    }
  });
}

function deleteUser() {
  const tableBody = document.getElementById("tableBody");
  tableBody.addEventListener("click", (e) => {
    if (e.target.closest(".delete-user-btn")) {
      const userId = e.target.closest(".delete-user-btn").dataset.userid;
      confirmDelete(userId);
    }
  });
}

function confirmDelete(userId) {
  const modalText = document.getElementById("modalText");
  const deleteModal = document.getElementById("deleteModal");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const closeModalBtn = document.querySelector(".modal .close");

  deleteModal.style.display = "block";
  modalText.innerHTML = `Are you sure you want to delete this user?`;

  confirmDeleteBtn.onclick = async () => {
    try {
      const response = await fetchWithToken(
        "/api/dashboard/users/delete",
        "json",
        {
          method: "DELETE",
          body: JSON.stringify({ userId }),
        }
      );
      const data = await response.json();
      if (data.status === "success") {
        console.log(data.message);
        showPopup(data.status, data.message);
        getUsers();
      } else if (data.status === "error") {
        console.error(data.message);
        showPopup(data.status, data.message);
      }
    } catch (error) {
      console.error(error);
      showPopup("error", "An error occurred while deleting the user.");
    } finally {
      deleteModal.style.display = "none";
    }
  };

  cancelDeleteBtn.onclick = () => {
    deleteModal.style.display = "none";
  };

  closeModalBtn.onclick = () => {
    deleteModal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target == deleteModal) {
      deleteModal.style.display = "none";
    }
  };
}

const logOutBtn = document.getElementById("logoutBtn");
if (window.location.pathname !== "/login") {
  logOutBtn.addEventListener("click", logout);
}

document.addEventListener("DOMContentLoaded", () => {
  getUsers();
  showRegisterModal();
  changeUserRole();
  deleteUser();
});
