import { fetchWithToken, checkToken } from "./auth.js";
import { checkFiltersAndFetchMembers } from "./main.js";
import { showPopup } from "./utils.js";

async function importMembers() {
  checkToken();
  const importFileInput = document.getElementById("importFile");
  const departmentSelect = document.getElementById("departmentSelect");
  const importOptionSelect = document.getElementById("importOptionSelect");

  const file = importFileInput.files[0];
  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("department", departmentSelect.value);
    formData.append("replace_option", importOptionSelect.value);

    try {
      const response = await fetchWithToken("/api/import_members", "file", {
        method: "POST",
        body: formData,
      });

      if (!response) {
        showPopup("error", "No response from server.");
        return;
      }

      const data = await response.json();
      if (data.status === "success") {
        console.log(data.message);
        showPopup("success", data.message);
        checkFiltersAndFetchMembers();
      } else {
        console.error(data.error);
        console.error(data.message);
        showPopup("error", data.message || "An error occurred during import.");
      }
    } catch (error) {
      console.error("Error importing members:", error);
      showPopup("error", "An error occurred during import.");
    }
  } else {
    console.info("No file selected for import");
    showPopup("error", "No file selected for import.");
  }
}

if (window.location.pathname === "/memberlist") {
  const exportBtn = document.getElementById("exportBtn");
  exportBtn.addEventListener("click", async () => {
    try {
      const response = await fetchWithToken("/api/export_members", "file", {
        method: "GET",
      });

      if (!response) {
        showPopup("error", "No response from server.");
        return;
      }

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        // console.log(url);
        a.href = url;
        a.download = "members.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        showPopup("success", "Members exported successfully.");
      } else {
        const data = await response.json();
        console.error(data.message, data.error);
        showPopup("error", data.message || "An error occurred during export.");
      }
    } catch (error) {
      console.error("Error exporting members:", error);
      showPopup("error", "An error occurred during export.");
    }
  });
}

async function showImportMemberModal() {
  const importBtn = document.getElementById("importBtn");
  const importMembersFormModal = document.getElementById(
    "importMembersFormModal"
  );
  const importMembersForm = document.getElementById("importMembersForm");
  const closeModalBtn = document.getElementById("importMemberClose");

  const formSubmitBtn = document.getElementById("importFormSubmitBtn");
  const loader = formSubmitBtn.querySelector(".loader");
  const btnText = formSubmitBtn.querySelector(".btn-text");

  const importOptionSelect = document.getElementById("importOptionSelect");
  const warning = document.getElementById("importWarning");
  importOptionSelect.addEventListener("change", () => {
    if (importOptionSelect.value === "replace_all") {
      warning.classList.remove("hide-element");
    } else {
      warning.classList.add("hide-element");
    }
  });

  importBtn.addEventListener("click", () => {
    importMembersFormModal.classList.remove("hide-element");
  });

  importMembersForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Show loader and hide button text
    formSubmitBtn.disabled = true;
    loader.style.display = "inline-block";
    btnText.style.display = "none";

    await importMembers();

    // Hide loader and show button text
    formSubmitBtn.disabled = false;
    loader.style.display = "none";
    btnText.style.display = "inline-block";

    importMembersForm.reset();
    importMembersFormModal.classList.add("hide-element");
  });

  closeModalBtn.addEventListener("click", () => {
    importMembersFormModal.classList.add("hide-element");
  });

  window.addEventListener("click", (event) => {
    if (event.target == importMembersFormModal) {
      importMembersFormModal.classList.add("hide-element");
    }
  });
}

export { showImportMemberModal };
