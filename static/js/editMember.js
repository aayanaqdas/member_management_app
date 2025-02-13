import { checkToken, fetchWithToken } from "./auth.js";
import { checkFiltersAndFetchMembers } from "./main.js";
import { showPopup } from "./utils.js";

const name = document.getElementById("editName");
const email = document.getElementById("editEmail");
const number = document.getElementById("editPhone");
const address = document.getElementById("editAddress");
const department = document.getElementById("editDepartment");
const paid = document.getElementById("editPaid");
const comment = document.getElementById("editComment");

async function getMemberInfoFromDB(memberId) {
  const response = await fetchWithToken("/api/member_info", "json", {
    method: "POST",
    body: JSON.stringify({
      memberId,
    }),
  });

  if (!response) return;

  const data = await response.json();

  if (data.status === "success") {
    fillInputs(data.memberInfo);
    // showPopup(data.status, data.message)
  } else {
    console.log(data.error);
    showPopup(data.status, data.message);
  }
}

function fillInputs(memberInfo) {
  paid.checked = memberInfo.paid;
  name.value = memberInfo.name;
  email.value = memberInfo.email;
  number.value = memberInfo.number;
  address.value = memberInfo.address;
  department.value = memberInfo.department;
  comment.value = memberInfo.comment;
}

async function updateMemberInfoToDB(memberId) {
  checkToken();
  const response = await fetchWithToken("/api/update_member_info", "json", {
    method: "PUT",
    body: JSON.stringify({
      id: memberId,
      name: name.value,
      email: email.value,
      number: number.value,
      address: address.value,
      department: department.value,
      paid: paid.checked,
      comment: comment.value,
    }),
  });

  if (!response) return;

  const data = await response.json();

  if (data.status === "success") {
    showPopup(data.status, data.message);
    checkFiltersAndFetchMembers();
    console.log(data.message);
  } else {
    console.error(data.error);
    showPopup(data.status, data.message);
  }
}

async function showEditMemberModal() {
  // const modalText = document.getElementById("modalText");
  const editBtn = document.getElementById("editBtn");
  const editMemberFormModal = document.getElementById("editMemberFormModal");
  const editMemberForm = document.getElementById("editMemberForm");
  const closeModalBtn = document.getElementById("editMemberClose");

  let memberId;

  const formSubmitBtn = document.getElementById("editFormSubmitBtn");
  const loader = formSubmitBtn.querySelector(".loader");
  const btnText = formSubmitBtn.querySelector(".btn-text");

  editBtn.addEventListener("click", () => {
    editMemberFormModal.classList.remove("hide-element");
    const checkboxes = document.querySelectorAll(".select-member-checkbox");
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        const checkboxId = checkbox.getAttribute("data-id");
        memberId = checkboxId;
        getMemberInfoFromDB(memberId);
      }
    });
  });

  editMemberForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Show loader and hide button text
    formSubmitBtn.disabled = true;
    loader.style.display = "inline-block";
    btnText.style.display = "none";

    await updateMemberInfoToDB(memberId);

    // Hide loader and show button text
    formSubmitBtn.disabled = false;
    loader.style.display = "none";
    btnText.style.display = "inline-block";

    editMemberForm.reset();
    editMemberFormModal.classList.add("hide-element");
  });

  closeModalBtn.addEventListener("click", () => {
    editMemberFormModal.classList.add("hide-element");
  });

  window.addEventListener("click", (event) => {
    if (event.target == editMemberFormModal) {
      editMemberFormModal.classList.add("hide-element");
    }
  });
}

export { showEditMemberModal };
