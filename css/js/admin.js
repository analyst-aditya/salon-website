/* ============================================================
   ADMIN.JS — staff dashboard logic
   Reads/writes the same localStorage keys main.js uses, so
   bookings made on the public site (in this browser) and price
   changes made here stay in sync.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------------------------------------------------
     CHANGE THIS to whatever passcode the salon owner wants.
     This is a simple client-side gate, not real authentication —
     fine for keeping casual visitors out, but anyone who reads
     this file (or guesses the passcode) could get in. Don't put
     anything truly sensitive behind it. See README for a real
     backend/auth upgrade path.
  --------------------------------------------------------- */
  const ADMIN_PASSCODE = "chair2026";
  const AUTH_KEY = "salonAdminAuth";
  const BOOKINGS_KEY = "salonBookings";

  const loginScreen = document.getElementById("loginScreen");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("loginForm");
  const passInput = document.getElementById("passInput");
  const loginError = document.getElementById("loginError");
  const logoutBtn = document.getElementById("logoutBtn");

  function isAuthed() {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  }
  function showDashboard() {
    loginScreen.hidden = true;
    dashboard.hidden = false;
    renderAll();
  }
  function showLogin() {
    dashboard.hidden = true;
    loginScreen.hidden = false;
    passInput.value = "";
    setTimeout(() => passInput.focus(), 50);
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (passInput.value === ADMIN_PASSCODE) {
      sessionStorage.setItem(AUTH_KEY, "1");
      loginError.textContent = "";
      showDashboard();
    } else {
      loginError.textContent = "That's not the right passcode — try again.";
    }
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_KEY);
    showLogin();
  });

  if (isAuthed()) showDashboard();
  else showLogin();

  /* ---------------------------------------------------------
     BOOKINGS
  --------------------------------------------------------- */
  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
    } catch {
      return [];
    }
  }
  function saveBookings(list) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
  }
  const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const todayStr = () => new Date().toISOString().slice(0, 10);

  function renderStats() {
    const bookings = getBookings();
    const today = todayStr();
    const todayCount = bookings.filter((b) => b.date === today).length;
    const upcomingCount = bookings.filter((b) => b.date >= today).length;
    const totalValue = bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    document.getElementById("statGrid").innerHTML = `
      <div class="stat-card"><div class="stat-label">Total bookings</div><div class="stat-value">${bookings.length}</div></div>
      <div class="stat-card"><div class="stat-label">Today</div><div class="stat-value accent">${todayCount}</div></div>
      <div class="stat-card"><div class="stat-label">Upcoming</div><div class="stat-value">${upcomingCount}</div></div>
      <div class="stat-card"><div class="stat-label">Total booked value</div><div class="stat-value accent">${fmtINR(totalValue)}</div></div>
    `;
  }

  function filteredBookings() {
    const q = document.getElementById("bookingSearch").value.trim().toLowerCase();
    const filter = document.getElementById("bookingFilter").value;
    const today = todayStr();

    return getBookings()
      .filter((b) => {
        if (filter === "today") return b.date === today;
        if (filter === "upcoming") return b.date >= today;
        if (filter === "past") return b.date < today;
        return true;
      })
      .filter((b) => {
        if (!q) return true;
        return (
          (b.name || "").toLowerCase().includes(q) ||
          (b.phone || "").toLowerCase().includes(q) ||
          (b.serviceName || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }

  function renderBookings() {
    const rows = filteredBookings();
    const body = document.getElementById("bookingsBody");
    const empty = document.getElementById("bookingsEmpty");

    if (!rows.length) {
      body.innerHTML = "";
      empty.style.display = "block";
      empty.textContent = getBookings().length
        ? "No bookings match that search/filter."
        : "No bookings yet on this device.";
      return;
    }
    empty.style.display = "none";

    body.innerHTML = rows
      .map(
        (b) => `
      <tr data-id="${b.id}">
        <td>${b.id}</td>
        <td><b>${escapeHtml(b.name)}</b><br><span style="font-size:12px;color:var(--ivory-faint)">${escapeHtml(b.phone)}</span></td>
        <td>${escapeHtml(b.serviceName)}</td>
        <td>${b.date}</td>
        <td>${b.time}</td>
        <td>${b.stylist === "any" ? "Any" : escapeHtml(b.stylist)}</td>
        <td><b>${fmtINR(b.price)}</b></td>
        <td class="cell-notes" title="${escapeHtml(b.notes || "")}">${escapeHtml(b.notes || "—")}</td>
        <td><button class="btn-icon danger" data-cancel-booking="${b.id}">Cancel</button></td>
      </tr>`
      )
      .join("");
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str == null ? "" : String(str);
    return d.innerHTML;
  }

  document.getElementById("bookingSearch").addEventListener("input", renderBookings);
  document.getElementById("bookingFilter").addEventListener("change", renderBookings);

  document.getElementById("bookingsBody").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cancel-booking]");
    if (!btn) return;
    const id = btn.getAttribute("data-cancel-booking");
    if (!confirm("Cancel this booking? This can't be undone.")) return;
    saveBookings(getBookings().filter((b) => b.id !== id));
    renderStats();
    renderBookings();
  });

  document.getElementById("exportCsvBtn").addEventListener("click", () => {
    const rows = filteredBookings();
    if (!rows.length) {
      alert("Nothing to export with the current search/filter.");
      return;
    }
    const header = ["Booking ID", "Name", "Phone", "Email", "Service", "Date", "Time", "Stylist", "Price", "Notes", "Booked at"];
    const csvRows = rows.map((b) =>
      [b.id, b.name, b.phone, b.email, b.serviceName, b.date, b.time, b.stylist, b.price, (b.notes || "").replace(/\n/g, " "), b.createdAt]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...csvRows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${todayStr()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  /* ---------------------------------------------------------
     SERVICES & PRICING
  --------------------------------------------------------- */
  function renderServices() {
    const services = window.SalonServices.getAll();
    document.getElementById("servicesBody").innerHTML = services
      .map(
        (s) => `
      <tr data-id="${s.id}">
        <td><input type="text" value="${escapeHtml(s.name)}" data-field="name">${s.builtin ? "" : ' <div style="font-size:11px;color:var(--ivory-faint);margin-top:4px;">(custom)</div>'}</td>
        <td><input type="text" value="${escapeHtml(s.desc || "")}" data-field="desc" style="width:200px;"></td>
        <td><input type="number" min="5" step="5" value="${s.duration}" data-field="duration"></td>
        <td><input type="number" min="0" step="10" value="${s.price}" data-field="price"></td>
        <td class="row-actions">
          <button class="btn-icon" data-save-service="${s.id}">Save</button>
          ${s.builtin ? "" : `<button class="btn-icon danger" data-delete-service="${s.id}">Delete</button>`}
        </td>
      </tr>`
      )
      .join("");
  }

  document.getElementById("servicesBody").addEventListener("click", (e) => {
    const saveBtn = e.target.closest("[data-save-service]");
    const delBtn = e.target.closest("[data-delete-service]");

    if (saveBtn) {
      const id = saveBtn.getAttribute("data-save-service");
      const row = saveBtn.closest("tr");
      const name = row.querySelector('[data-field="name"]').value.trim();
      const desc = row.querySelector('[data-field="desc"]').value.trim();
      const duration = Number(row.querySelector('[data-field="duration"]').value) || 30;
      const price = Number(row.querySelector('[data-field="price"]').value) || 0;
      if (!name) {
        alert("Service name can't be empty.");
        return;
      }
      window.SalonServices.updateService(id, { name, desc, duration, price });
      flashSaved(saveBtn);
    }

    if (delBtn) {
      const id = delBtn.getAttribute("data-delete-service");
      if (!confirm("Remove this service from the menu?")) return;
      window.SalonServices.removeCustom(id);
      renderServices();
    }
  });

  function flashSaved(btn) {
    const original = btn.textContent;
    btn.textContent = "Saved ✓";
    setTimeout(() => (btn.textContent = original), 1400);
  }

  document.getElementById("resetPricesBtn").addEventListener("click", () => {
    if (!confirm("Reset all built-in services back to their default prices/durations?")) return;
    window.SalonServices.resetOverrides();
    renderServices();
  });

  document.getElementById("addServiceForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("newSvcName").value.trim();
    const duration = document.getElementById("newSvcDuration").value;
    const price = document.getElementById("newSvcPrice").value;
    const desc = document.getElementById("newSvcDesc").value.trim();
    if (!name || !duration || !price) return;

    window.SalonServices.addCustom({ name, duration, price, desc });
    e.target.reset();
    renderServices();
  });

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  function renderAll() {
    renderStats();
    renderBookings();
    renderServices();
  }
})();
