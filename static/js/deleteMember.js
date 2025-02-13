import { fetchWithToken } from "./auth.js";
import { checkFiltersAndFetchMembers } from "./main.js";
import { showPopup } from "./utils.js";

const tableActionBtns = document.getElementById("editDeleteBtns");
const deleteBtn = document.getElementById("deleteBtn");
let checkedCheckboxesCount = 0;

async function deleteMembers() {
  const checkboxes = document.querySelectorAll(
    ".select-member-checkbox:checked"
  );

  const ids = Array.from(checkboxes).map((checkbox) =>
    checkbox.getAttribute("data-id")
  );

  if (ids.length === 0) {
    console.info("No members selected for deletion");
    showPopup("error", "No members selected for deletion.");
    return;
  }

  const response = await fetchWithToken("/api/delete_members", "json", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });

  if (!response) return;

  const data = await response.json();

  if (data.status === "success") {
    checkFiltersAndFetchMembers();
    showPopup(data.status, data.message);
    tableActionBtns.classList.add("hide-element");
  } else {
    showPopup(data.status, data.message);
    console.error(data.message);
  }
}

function showDeleteMemberModal() {
  const modalText = document.getElementById("modalText");
  const deleteModal = document.getElementById("deleteModal");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const closeModalBtn = document.querySelector(".modal .close");

  deleteBtn.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(
      ".select-member-checkbox:checked"
    );

    checkedCheckboxesCount = checkboxes.length;
    deleteModal.style.display = "block";
    modalText.innerHTML = `Are you sure you want to delete ${checkedCheckboxesCount} member(s)?`;
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    await deleteMembers();
    deleteModal.style.display = "none";
    checkedCheckboxesCount = 0;
  });

  cancelDeleteBtn.addEventListener("click", () => {
    deleteModal.style.display = "none";
  });

  closeModalBtn.addEventListener("click", () => {
    deleteModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target == deleteModal) {
      deleteModal.style.display = "none";
    }
  });
}

export { showDeleteMemberModal };
