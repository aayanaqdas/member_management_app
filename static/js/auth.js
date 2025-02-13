import { showPopup } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  if (
    window.location.pathname === "/login" ||
    window.location.pathname === "/"
  ) {
    const loginForm = document.getElementById("loginForm");
    const loginFormSubmitBtn = document.getElementById("loginFormSubmitBtn");
    const loader = loginFormSubmitBtn.querySelector(".loader");
    const btnText = loginFormSubmitBtn.querySelector(".btn-text");

    checkToken();
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Show loader and hide button text
        loginFormSubmitBtn.disabled = true;
        loader.style.display = "inline-block";
        btnText.style.display = "none";

        const email = document.getElementById("email").value;
        const password = document.getElementById("psw").value;

        try {
          const response = await fetch("/api/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Include cookies in the request
          });
          const data = await response.json();
          if (data.status === "success") {
            console.log(data.message);
            localStorage.setItem("userRole", data.role); // Store the user's role
            showPopup(data.status, data.message);
            setTimeout(() => {
              window.location.href = "/memberlist";
            }, 500);
          } else if (data.status === "error") {
            console.error(data.message);
            showPopup(data.status, data.message);
          }
        } catch (error) {
          console.error(error);
          showPopup("error", "An error occurred during login.");
        } finally {
          // Hide loader and show button text
          loginFormSubmitBtn.disabled = false;
          loader.style.display = "none";
          btnText.style.display = "inline-block";
        }
      });
    }
  }
});

async function fetchWithToken(url, contentType, options = {}) {
  if (contentType === "json") {
    options.headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };
  }
  options.credentials = "include"; // Include cookies in the request

  // Include the CSRF token for non-GET requests
  if (options.method && options.method !== "GET") {
    const csrfToken = getCookie("csrf_access_token");
    if (csrfToken) {
      options.headers = {
        ...options.headers,
        "X-CSRF-TOKEN": csrfToken,
      };
    } else {
      window.location.href = "/login";
    }
  }

  let response = await fetch(url, options);

  if (response.status === 401) {
    // Token is expired or invalid, logout
    logout();
    return;
  }

  return response;
}

// Helper function to get a cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
  return null; // Return null if the cookie is not found
}

// Function to check if the token is valid
async function checkToken() {
  // console.log("Checking token");

  try {
    const response = await fetch("/api/check_token", {
      method: "GET",
      credentials: "include", // Include cookies in the request
    });

    if (response.status === 200) {
      // console.log("Token is valid");
      if (
        window.location.pathname === "/login" ||
        window.location.pathname === "/"
      ) {
        window.location.href = "/memberlist";
      }
    } else if (
      response.status === 401 &&
      window.location.pathname !== "/login" &&
      window.location.pathname !== "/"
    ) {
      console.log("Token is invalid, logging out");
      logout();
    }
  } catch (error) {
    console.error("Error checking token:", error);
    logout();
  }
}

async function logout() {
  console.info("Logging out");
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.removeItem("userRole");
      console.log(data.message);
      showPopup(data.status, data.message);
    }
  } catch (error) {
    console.error("Error logging out:", error);
    showPopup("error", "An error occurred during logout.");
  } finally {
    clearCookiesAndRedirect();
  }
}

function clearCookiesAndRedirect() {
  const cookies = ["access_token_cookie", "csrf_access_token"];
  cookies.forEach((cookieName) => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
  });
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export { fetchWithToken, logout, checkToken };
