document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorBox = document.getElementById("signupError");

  errorBox.textContent = "";
  errorBox.classList.add("d-none");

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      window.location.href = "/login";
    } else {
      const errorText = await res.text();
      showError("Signup failed: " + errorText);
      console.error("Signup error response:", errorText);
    }
  } catch (err) {
    console.error("Signup error:", err);
    showError("Something went wrong. Please try again.");
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove("d-none");
  }
});
