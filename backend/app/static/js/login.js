document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorBox = document.getElementById("loginError");

  // Clear previous error
  errorBox.textContent = "";
  errorBox.classList.add("d-none");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      const error = await res.json();
      showError(error.message || "Login failed. Please check your credentials.");
    }
  } catch (err) {
    console.error("Login error:", err);
    showError("Something went wrong. Please try again.");
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove("d-none");
  }
});
