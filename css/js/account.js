/* ============================================================
   ACCOUNT.JS — shared logged-in-user state
   Used by auth.html (to set the user after login/signup) and
   index.html (to greet the user, prefill the booking form, and
   show only their own bookings). Completely separate from the
   admin passcode system in js/admin.js — these are two
   different login systems on purpose.
   ============================================================ */
window.SalonAuth = (function () {
  "use strict";
  const KEY = "salonUser";

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(KEY));
    } catch {
      return null;
    }
  }
  function setUser(user) {
    localStorage.setItem(KEY, JSON.stringify(user));
  }
  function logout() {
    localStorage.removeItem(KEY);
  }

  return { getUser, setUser, logout };
})();

/* ---------- nav UI (only runs if the page has #navAuthSlot, e.g. index.html) ---------- */
(function renderNavAuth() {
  const slot = document.getElementById("navAuthSlot");
  if (!slot) return;

  const user = window.SalonAuth.getUser();
  if (user && user.name) {
    const firstName = user.name.split(" ")[0];
    slot.innerHTML = `<span class="nav-user">Hi, ${escapeHtml(firstName)} <button type="button" class="nav-logout" id="navLogoutBtn">Log out</button></span>`;
    document.getElementById("navLogoutBtn").addEventListener("click", () => {
      window.SalonAuth.logout();
      window.location.reload();
    });
  } else {
    slot.innerHTML = `<a href="auth.html">Login / Sign up</a>`;
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }
})();
