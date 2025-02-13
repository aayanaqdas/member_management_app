import { checkToken, fetchWithToken, logout } from "./auth.js";
import { filterTable } from "./filters.js";
import { showAddMemberModal } from "./addMember.js";
import { showEditMemberModal } from "./editMember.js";
import { showDeleteMemberModal } from "./deleteMember.js";
import { showImportMemberModal } from "./excelHandler.js";
import { scrollToTop, showPopup } from "./utils.js";

const tableBody = document.getElementById("tableBody");
const tableActionBtns = document.getElementById("editDeleteBtns");
const editBtn = document.getElementById("editBtn");
const logOutBtn = document.getElementById("logoutBtn");

const checkedChecboxesCountEl = document.getElementById("selectedCount");
let checkedCheckboxesCount = 0;

async function getMembers() {
  try {
    const response = await fetchWithToken("/api/members", "json", {
      method: "GET",
    });
    if (!response) return;

    const data = await response.json();

    if (window.location.pathname === "/memberlist") {
      populateTable(data.members);
      selectMember();
    }
  } catch (error) {
    console.error(error);
    showPopup("error", "Failed to retrieve members.");
  }
}

function checkFiltersAndFetchMembers() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const departmentFilter = document.getElementById("departmentFilter");
  const searchInput = document.getElementById("searchInput");

  let isFilterActive = false;

  filterBtns.forEach((btn) => {
    if (btn.classList.contains("active")) {
      isFilterActive = true;
    }
  });

  if (departmentFilter.value !== "") {
    isFilterActive = true;
  }

  if (searchInput.value !== "") {
    isFilterActive = true;
  }

  if (isFilterActive) {
    filterTable();
  } else {
    getMembers();
  }
  tableActionBtns.classList.add("hide-element");
}

function populateTable(members) {
  const memberCount = document.getElementById("memberCount");
  memberCount.innerHTML = `Members: ${members.length}`;
  checkedCheckboxesCount = 0; // Reset checked checkboxes count
  checkedChecboxesCountEl.innerHTML = checkedCheckboxesCount;
  tableBody.innerHTML = "";
  members.forEach((member) => {
    const {
      id,
      name,
      email,
      number,
      address,
      department,
      paid,
      comment,
    } = member;

    const row = document.createElement("tr");
    row.classList.add("table-row");

    row.innerHTML = `
            <td><input type="checkbox" name="selectBox" class="select-member-checkbox" data-id="${id}"/></td>
            <td>${name}</td>
            <td>${email === null ? "" : email}</td>
            <td>${number}</td>
            <td>${address}</td>
            <td>${department}</td>
            <td><p class="status ${paid ? "status-yes" : "status-no"}">${
      paid ? "Yes" : "No"
    }</p></td>
            <td>${comment}</td>
        `;

    tableBody.appendChild(row);
  });
}

function selectMember() {
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const checkboxes = document.querySelectorAll(".select-member-checkbox");

  // Event listener for the select all checkbox
  selectAllCheckbox.addEventListener("change", (e) => {
    const isChecked = e.target.checked;
    checkboxes.forEach((checkbox) => {
      checkbox.checked = isChecked;
      const row = checkbox.closest("tr");
      if (isChecked) {
        row.classList.add("highlight");
      } else {
        row.classList.remove("highlight");
      }
    });
    toggleTableActionBtns();
  });

  // Event listeners for individual checkboxes
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const id = e.target.getAttribute("data-id");
      const row = e.target.closest("tr");
      selectAllCheckbox.checked = false;
      if (e.target.checked) {
        // console.log(`Selected member with id: ${id}`);
        row.classList.add("highlight");
      } else {
        // console.log(`Deselected member with id: ${id}`);
        row.classList.remove("highlight");
      }
      toggleTableActionBtns();
    });
  });
}

function toggleTableActionBtns() {
  const checkboxes = document.querySelectorAll(".select-member-checkbox");
  const checkedCheckboxes = Array.from(checkboxes).filter(
    (checkbox) => checkbox.checked
  );

  checkedCheckboxesCount = checkedCheckboxes.length;
  checkedChecboxesCountEl.innerHTML = checkedCheckboxesCount;
  const anyChecked = checkedCheckboxes.length > 0;
  if (anyChecked) {
    tableActionBtns.classList.remove("hide-element");
    checkedCheckboxes.length > 1
      ? editBtn.classList.add("hide-element")
      : editBtn.classList.remove("hide-element");
  } else {
    tableActionBtns.classList.add("hide-element");
  }
}

function hideBtns() {
  const userRole = localStorage.getItem("userRole");
  if (userRole !== "Admin") {
    const dashboardBtn = document.getElementById("dashboardBtn");
    dashboardBtn.classList.add("hide-element");
  }
  if (userRole !== "Admin" && userRole !== "Editor") {
    const tableActionBtns = document.getElementById("tableActionContainer");
    const excelBtns = document.getElementById("excelBtnContainer");
    tableActionBtns.classList.add("hide-element");
    excelBtns.classList.add("hide-element");
  }
}


// initialize all the functions for the memberlist page
function init() {
  checkToken();
  if (window.location.pathname === "/memberlist") {
    hideBtns(); // hide buttons for roles
    checkFiltersAndFetchMembers();
    showEditMemberModal();
    showAddMemberModal();
    showDeleteMemberModal();
    showImportMemberModal();
    scrollToTop();
  }
}
if (window.location.pathname !== "/login") {
  logOutBtn.addEventListener("click", logout);
}

document.addEventListener("DOMContentLoaded", () => {
    init();
});

export {
  getMembers,
  populateTable,
  selectMember,
  checkFiltersAndFetchMembers,
};
