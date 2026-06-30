/* ============================================================
   AUTH.JS — login / signup page logic (username + password)
   Customer accounts are stored in localStorage on this browser.
   Passwords are run through a simple obfuscating hash before
   being stored — this is NOT real cryptographic security (there's
   no server here to keep secrets on), just a step up from storing
   plain text. For a real production login system, move this
   logic to a backend with proper password hashing (bcrypt/argon2)
   and sessions/JWTs. See README for notes on upgrading.
   ============================================================ */
(function () {
  "use strict";

  const USERS_KEY = "salonUsers"; // { [usernameLower]: { name, username, phone, passwordHash, createdAt } }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    } catch {
      return {};
    }
  }
  function saveUsers(obj) {
    localStorage.setItem(USERS_KEY, JSON.stringify(obj));
  }

  // Simple, dependency-free string hash (NOT cryptographically secure).
  // Works everywhere, including file:// and older browsers — unlike the
  // Web Crypto API, which requires a "secure context" and can silently
  // fail when the site isn't served over https.
  function simpleHash(str) {
    let h1 = 0xdeadbeef,
      h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = (Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)) >>> 0;
    h2 = (Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)) >>> 0;
    return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
  }

  function cleanPhone(v) {
    return (v || "").replace(/\D/g, "").slice(-10);
  }
  function normalizeUsername(v) {
    return (v || "").trim().toLowerCase();
  }

  /* ---------------------------------------------------------
     TAB SWITCHING
  --------------------------------------------------------- */
  const tabs = document.querySelectorAll(".auth-tab");
  const panels = document.querySelectorAll(".auth-panel");

  function switchTab(name) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    panels.forEach((p) => p.classList.toggle("active", p.dataset.panel === name));
  }
  tabs.forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));
  document.querySelectorAll("[data-switch]").forEach((btn) =>
    btn.addEventListener("click", () => switchTab(btn.dataset.switch))
  );

  /* ---------------------------------------------------------
     LOGIN
  --------------------------------------------------------- */
  const loginForm = document.getElementById("loginPanel");
  const loginError = document.getElementById("loginError");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    loginError.textContent = "";

    const username = normalizeUsername(document.getElementById("loginUsername").value);
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) {
      loginError.textContent = "Enter your username and password.";
      return;
    }

    const users = getUsers();
    const account = users[username];
    if (!account) {
      loginError.textContent = "No account with that username — sign up instead?";
      return;
    }
    if (account.passwordHash !== simpleHash(password)) {
      loginError.textContent = "Incorrect password — try again.";
      return;
    }

    loginSuccess({ name: account.name, username: account.username, phone: account.phone || "" });
  });

  /* ---------------------------------------------------------
     SIGNUP
  --------------------------------------------------------- */
  const signupForm = document.getElementById("signupPanel");
  const signupError = document.getElementById("signupError");

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    signupError.textContent = "";

    const name = document.getElementById("signupName").value.trim();
    const phone = cleanPhone(document.getElementById("signupPhone").value);
    const usernameRaw = document.getElementById("signupUsername").value.trim();
    const username = normalizeUsername(usernameRaw);
    const password = document.getElementById("signupPassword").value;
    const password2 = document.getElementById("signupPassword2").value;

    if (!name) return (signupError.textContent = "Enter your full name.");
    if (username.length < 3) return (signupError.textContent = "Username needs to be at least 3 characters.");
    if (!/^[a-z0-9_.]+$/.test(username))
      return (signupError.textContent = "Username can only contain letters, numbers, underscores and dots.");
    if (password.length < 6) return (signupError.textContent = "Password needs to be at least 6 characters.");
    if (password !== password2) return (signupError.textContent = "Passwords don't match.");

    const users = getUsers();
    if (users[username]) {
      signupError.textContent = "That username is already taken — pick another, or log in instead.";
      return;
    }

    users[username] = {
      name,
      username: usernameRaw,
      phone,
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
    };
    saveUsers(users);

    loginSuccess({ name, username: usernameRaw, phone });
  });

  /* ---------------------------------------------------------
     SHARED SUCCESS HANDLER
  --------------------------------------------------------- */
  function loginSuccess(user) {
    window.SalonAuth.setUser({ ...user, loggedInAt: new Date().toISOString() });
    document.querySelectorAll(".auth-panel").forEach((p) => p.classList.remove("active"));
    document.querySelector(".auth-tabs").style.display = "none";
    document.getElementById("successHeading").textContent = `Welcome, ${user.name.split(" ")[0]}!`;
    document.getElementById("authSuccess").classList.add("show");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  }
})();
