import { checkToken, fetchWithToken } from "./auth.js";
import { checkFiltersAndFetchMembers } from "./main.js";
import { showPopup } from "./utils.js";

async function addMember() {
  checkToken();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const number = document.getElementById("phone").value;
  const address = document.getElementById("address").value;
  let department = document.getElementById("department").value;
  const comment = document.getElementById("comment").value;
  const paid = document.getElementById("paid").checked;

  try {
    const response = await fetchWithToken("/api/add_member", "json", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        number,
        address,
        department,
        paid,
        comment,
      }),
    });

    if (!response) return;

    const data = await response.json();
    if (data.status === "success") {
      showPopup(data.status, data.message);
      checkFiltersAndFetchMembers();
    } else if (data.status === "error") {
      showPopup(data.status, data.message);
      console.error(data.message);
    }
  } catch (error) {
    console.error(error);
    showPopup("error", "Failed to add member.");
  }
}

async function showAddMemberModal() {
  // const modalText = document.getElementById("modalText");
  const addBtn = document.getElementById("addBtn");
  const newMemberFormModal = document.getElementById("newMemberFormModal");
  const newMemberForm = document.getElementById("newMemberForm");
  const closeModalBtn = document.querySelector(".forms-modal .close");

  const formSubmitBtn = document.getElementById("newFormSubmitBtn");
  const loader = formSubmitBtn.querySelector(".loader");
  const btnText = formSubmitBtn.querySelector(".btn-text");

  addBtn.addEventListener("click", () => {
    newMemberFormModal.classList.remove("hide-element");
  });

  newMemberForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Show loader and hide button text
    formSubmitBtn.disabled = true;
    loader.style.display = "inline-block";
    btnText.style.display = "none";

    await addMember();

    // Hide loader and show button text
    formSubmitBtn.disabled = false;
    loader.style.display = "none";
    btnText.style.display = "inline-block";

    newMemberForm.reset();
    newMemberFormModal.classList.add("hide-element");
  });

  closeModalBtn.addEventListener("click", () => {
    newMemberFormModal.classList.add("hide-element");
  });

  window.addEventListener("click", (event) => {
    if (event.target == newMemberFormModal) {
      newMemberFormModal.classList.add("hide-element");
    }
  });
}

export { showAddMemberModal };
