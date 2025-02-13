import { fetchWithToken } from "./auth.js";
import { populateTable, selectMember } from "./main.js";
import { showPopup } from "./utils.js";

if (window.location.pathname === "/memberlist") {
  const searchInput = document.getElementById("searchInput");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const departmentFilter = document.getElementById("departmentFilter");

  let debounceTimeout;

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (btn.dataset.filter === "paid" || btn.dataset.filter === "unpaid") {
        // Deactivate the other paid/unpaid button if it is active
        filterBtns.forEach((b) => {
          if (
            (b.dataset.filter === "paid" || b.dataset.filter === "unpaid") &&
            b !== btn
          ) {
            b.classList.remove("active");
          }
        });
      } else if (
        btn.dataset.filter === "name" ||
        btn.dataset.filter === "email" ||
        btn.dataset.filter === "number"
      ) {
        // Deactivate the other button if it is active
        filterBtns.forEach((b) => {
          if (
            (b.dataset.filter === "name" ||
              b.dataset.filter === "email" ||
              b.dataset.filter === "number") &&
            b !== btn
          ) {
            b.classList.remove("active");
          }
        });
      }
      btn.classList.toggle("active");
      if (btn.dataset.filter === "paid" || btn.dataset.filter === "unpaid") {
        filterTable();
      } else if (searchInput.value != "") {
        filterTable();
      }
    });
  });

  searchInput.addEventListener("input", () => {
    // Delay for 700ms before filtering the table
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(filterTable, 700);
  });

  departmentFilter.addEventListener("change", () => {
    if (departmentFilter.value !== "") {
      departmentFilter.classList.add("active");
    } else {
      departmentFilter.classList.remove("active");
    }
    filterTable();
  });
}
async function filterTable() {
  const searchValue = searchInput.value.toLowerCase();
  const activeFilter =
    document.querySelector(
      '.filter-btn.active[data-filter]:not([data-filter="paid"]):not([data-filter="unpaid"])'
    )?.dataset.filter || "all";
  const selectedDepartment = departmentFilter.value.toLowerCase();
  const paidFilter =
    document.querySelector(
      '.filter-btn.active[data-filter="paid"], .filter-btn.active[data-filter="unpaid"]'
    )?.dataset.filter || "";

  try {
    const response = await fetchWithToken("/api/filter_table", "json", {
      method: "POST",
      body: JSON.stringify({
        search: searchValue,
        filter: activeFilter,
        department: selectedDepartment,
        paid: paidFilter,
      }),
    });

    if (!response) {
      showPopup("error", "No response from server.");
      return;
    }

    const data = await response.json();
    if (response.ok) {
      // console.log(data);
      // showPopup("success", "filtered table")
      populateTable(data.filtered_members);
      selectMember();
    } else {
      showPopup("error", data.message || "Could not filter table.");
    }
  } catch (error) {
    console.error("Error filtering table:", error);
    showPopup("error", "An error occurred while filtering the table.");
  }
}
export { filterTable };
