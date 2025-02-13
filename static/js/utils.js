function scrollToTop() {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
  
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        scrollToTopBtn.classList.add("show");
      } else {
        scrollToTopBtn.classList.remove("show");
      }
    });
  
    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
  
  function showPopup(status, message) {
    const popupContainerEl = document.getElementById("toastPopupContainer");
    const popupHTML = `
          <div class="toast active">
            <div class="toast-content">
              <i class="fa-solid ${
                status === "success" ? "fa-check check" : "fa-xmark x-mark"
              }"></i>
              <div class="message">
                <span class="text text-1">${status}</span>
                <span class="text text-2">${message}</span>
              </div>
            </div>
            <i class="fa-solid fa-xmark close"></i>
    
          </div>
        `;
  
    popupContainerEl.insertAdjacentHTML("beforeend", popupHTML);
  
    const newToast = popupContainerEl.lastElementChild;
    const closeButton = newToast.querySelector(".close");
  
    // Add event listener to close button
    closeButton.addEventListener("click", () => {
      newToast.classList.remove("active");
      setTimeout(() => newToast.remove(), 500); // Remove the element after the transition
    });
    setTimeout(() => {
      newToast.classList.remove("active");
      setTimeout(() => newToast.remove(), 500); // Remove the element after the transition
    }, 2000);
  }

export { scrollToTop, showPopup };