/* ============================================================
   MAIN.JS — services data, nav, booking system, card tilt
   Bookings persist in localStorage on this device/browser only.
   To go fully multi-device you'd point bookingForm's submit
   handler at your own backend / Google Sheet / Firebase, etc.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. SERVICES DATA — comes from js/services-data.js, which
     merges the built-in list with any price/duration edits or
     new services added from the admin page (admin.html).
  --------------------------------------------------------- */
  const SERVICES = window.SalonServices.getAll();

  const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN");

  /* ---------------------------------------------------------
     2. RENDER SERVICE CARDS
  --------------------------------------------------------- */
  const grid = document.getElementById("serviceGrid");
  if (grid) {
    grid.innerHTML = SERVICES.map(
      (s) => `
      <div class="service-card" data-tilt>
        <div class="service-card-top">
          <span class="service-code">${s.code}</span>
          <span class="service-icon">${s.iconSvg}</span>
        </div>
        <h3>${s.name}</h3>
        <p>${s.desc}</p>
        <div class="service-meta">
          <span>${s.duration} min</span>
          <b>${fmtINR(s.price)}</b>
        </div>
        <button class="service-book" data-service-id="${s.id}">Book this</button>
      </div>`
    ).join("");
  }

  // populate the booking <select>
  const svcSelect = document.getElementById("svcSelect");
  if (svcSelect) {
    SERVICES.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.name} — ${fmtINR(s.price)} (${s.duration} min)`;
      svcSelect.appendChild(opt);
    });
  }

  // "Book this" buttons -> jump to booking, preselect service
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".service-book");
    if (!btn) return;
    const id = btn.getAttribute("data-service-id");
    if (svcSelect) {
      svcSelect.value = id;
      svcSelect.dispatchEvent(new Event("change"));
    }
    document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
  });

  /* ---------------------------------------------------------
     3. NAV — scroll state + mobile toggle
  --------------------------------------------------------- */
  const nav = document.getElementById("nav");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 30);
  });

  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => navLinks.classList.remove("open"))
  );

  document.getElementById("navChatBtn").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("chatLauncher").click();
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     4b. LOGGED-IN USER — prefill booking form if available
     (window.SalonAuth comes from js/account.js, loaded earlier)
  --------------------------------------------------------- */
  const currentUser = window.SalonAuth ? window.SalonAuth.getUser() : null;
  if (currentUser) {
    const nameEl = document.getElementById("nameInput");
    const phoneEl = document.getElementById("phoneInput");
    if (currentUser.name) nameEl.value = currentUser.name;
    if (currentUser.phone) phoneEl.value = currentUser.phone;
  }

  /* ---------------------------------------------------------
     4. SUBTLE 3D TILT ON SERVICE CARDS (mouse-driven)
  --------------------------------------------------------- */
  document.addEventListener("mousemove", (e) => {
    const card = e.target.closest("[data-tilt]");
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      if (el !== card) el.style.transform = "";
    });
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(6px)`;
  });

  /* ---------------------------------------------------------
     5. BOOKING SYSTEM
  --------------------------------------------------------- */
  const STORE_KEY = "salonBookings";
  const OPEN_HOUR = 10; // 10am
  const CLOSE_HOUR = 20; // 8pm
  const SLOT_STEP_MIN = 30;

  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
    } catch {
      return [];
    }
  }
  function saveBookings(list) {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  }

  const dateInput = document.getElementById("dateInput");
  const stylistSelect = document.getElementById("stylistSelect");
  const slotGrid = document.getElementById("slotGrid");
  const bookingForm = document.getElementById("bookingForm");
  const formError = document.getElementById("formError");

  // restrict date range: today .. +30 days
  (function setDateBounds() {
    const today = new Date();
    const max = new Date();
    max.setDate(max.getDate() + 30);
    dateInput.min = today.toISOString().slice(0, 10);
    dateInput.max = max.toISOString().slice(0, 10);
  })();

  let selectedTime = null;

  function buildSlots() {
    const slots = [];
    for (let m = OPEN_HOUR * 60; m < CLOSE_HOUR * 60; m += SLOT_STEP_MIN) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      const label = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      slots.push(label);
    }
    return slots;
  }

  function renderSlots() {
    selectedTime = null;
    updateTicket();
    const date = dateInput.value;
    if (!date) {
      slotGrid.innerHTML = '<p class="slot-hint">Pick a date to see open slots.</p>';
      return;
    }
    const stylist = stylistSelect.value;
    const taken = getBookings()
      .filter((b) => b.date === date && (stylist === "any" || b.stylist === stylist || b.stylist === "any"))
      .map((b) => b.time);

    const now = new Date();
    const isToday = date === now.toISOString().slice(0, 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const slots = buildSlots();
    slotGrid.innerHTML = slots
      .map((label) => {
        const [h, m] = label.split(":").map(Number);
        const minsFromMidnight = h * 60 + m;
        const past = isToday && minsFromMidnight <= nowMinutes;
        const isTaken = taken.includes(label);

        if (isTaken) {
          return `<button type="button" class="slot-btn booked" data-time="${label}" disabled title="This seat is already booked">
            <span class="slot-time">${label}</span><span class="slot-status">Booked</span>
          </button>`;
        }
        if (past) {
          return `<button type="button" class="slot-btn past" data-time="${label}" disabled title="This time has already passed today">
            <span class="slot-time">${label}</span><span class="slot-status">Past</span>
          </button>`;
        }
        return `<button type="button" class="slot-btn" data-time="${label}">${label}</button>`;
      })
      .join("");
  }

  dateInput.addEventListener("change", renderSlots);
  stylistSelect.addEventListener("change", renderSlots);

  slotGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".slot-btn");
    if (!btn || btn.disabled) return;
    slotGrid.querySelectorAll(".slot-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedTime = btn.getAttribute("data-time");
    updateTicket();
  });

  svcSelect.addEventListener("change", updateTicket);
  document.getElementById("nameInput").addEventListener("input", updateTicket);

  function getSelectedService() {
    return SERVICES.find((s) => s.id === svcSelect.value);
  }

  function updateTicket() {
    const svc = getSelectedService();
    document.getElementById("tkService").textContent = svc ? svc.name : "—";
    document.getElementById("tkDate").textContent = dateInput.value
      ? new Date(dateInput.value + "T00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "—";
    document.getElementById("tkTime").textContent = selectedTime || "—";
    document.getElementById("tkStylist").textContent =
      stylistSelect.value === "any" ? "Any available" : stylistSelect.value;
    document.getElementById("tkDuration").textContent = svc ? svc.duration + " min" : "—";
    document.getElementById("tkPrice").textContent = svc ? fmtINR(svc.price) : "—";
    document.getElementById("tkName").textContent = document.getElementById("nameInput").value || "—";
  }

  function genBookingId() {
    return "GC" + Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    formError.textContent = "";

    const svc = getSelectedService();
    const date = dateInput.value;
    const name = document.getElementById("nameInput").value.trim();
    const phone = document.getElementById("phoneInput").value.trim();
    const email = document.getElementById("emailInput").value.trim();
    const notes = document.getElementById("notesInput").value.trim();
    const stylist = stylistSelect.value;

    if (!svc) return showError("Pick a service first.");
    if (!date) return showError("Pick a date.");
    if (!selectedTime) return showError("Pick an open time slot.");
    if (!name) return showError("Enter your name.");
    if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, "").slice(-10))) {
      return showError("Enter a valid 10-digit phone number.");
    }

    const bookings = getBookings();
    // re-check the slot hasn't just been taken
    const clash = bookings.some(
      (b) => b.date === date && b.time === selectedTime && (stylist === "any" || b.stylist === stylist || b.stylist === "any")
    );
    if (clash) {
      showError("This seat is already booked for that time — pick another slot.");
      renderSlots();
      return;
    }

    const booking = {
      id: genBookingId(),
      serviceId: svc.id,
      serviceName: svc.name,
      price: svc.price,
      duration: svc.duration,
      date,
      time: selectedTime,
      stylist,
      name,
      phone,
      email,
      notes,
      bookedVia: currentUser ? currentUser.username : "guest",
      createdAt: new Date().toISOString(),
    };
    bookings.push(booking);
    saveBookings(bookings);

    renderMyBookings();
    renderSlots();
    bookingForm.reset();
    selectedTime = null;
    updateTicket();

    showError("");
    flashConfirmation(booking);
  });

  function showError(msg) {
    formError.textContent = msg;
  }

  function flashConfirmation(booking) {
    document.getElementById("ticketId").textContent = "#" + booking.id;
    openBookingModal(booking);
  }

  /* ---------------------------------------------------------
     5b. "THANK YOU" CONFIRMATION MODAL
  --------------------------------------------------------- */
  const bookingModal = document.getElementById("bookingModal");
  const bookingModalClose = document.getElementById("bookingModalClose");
  const bookingModalOk = document.getElementById("bookingModalOk");

  function openBookingModal(booking) {
    const niceDate = new Date(booking.date + "T00:00").toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    document.getElementById("modalName").textContent = booking.name ? booking.name.split(" ")[0] : "there";
    document.getElementById("modalService").textContent = booking.serviceName;
    document.getElementById("modalDate").textContent = niceDate;
    document.getElementById("modalTime").textContent = booking.time;
    document.getElementById("modalStylist").textContent = booking.stylist === "any" ? "Any available" : booking.stylist;
    document.getElementById("modalId").textContent = "#" + booking.id;

    bookingModal.classList.add("open");
    bookingModal.setAttribute("aria-hidden", "false");
  }
  function closeBookingModal() {
    bookingModal.classList.remove("open");
    bookingModal.setAttribute("aria-hidden", "true");
  }
  bookingModalClose.addEventListener("click", closeBookingModal);
  bookingModalOk.addEventListener("click", closeBookingModal);
  bookingModal.addEventListener("click", (e) => {
    if (e.target === bookingModal) closeBookingModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && bookingModal.classList.contains("open")) closeBookingModal();
  });

  /* ---------------------------------------------------------
     6. "BOOKINGS ON THIS DEVICE" LIST
  --------------------------------------------------------- */
  const myBookingsList = document.getElementById("myBookingsList");
  const myBookingsEmpty = document.getElementById("myBookingsEmpty");

  function renderMyBookings() {
    const all = getBookings().sort((a, b) => new Date(a.date) - new Date(b.date));
    const bookings = currentUser && currentUser.phone ? all.filter((b) => b.phone === currentUser.phone) : all;

    const heading = document.querySelector("#myBookings h3");
    if (heading) heading.textContent = currentUser ? "Your bookings" : "Bookings on this device";

    if (!bookings.length) {
      myBookingsEmpty.style.display = "block";
      myBookingsEmpty.textContent = currentUser
        ? "No bookings yet under your account. Book a slot above and it'll show up here."
        : "Nothing booked yet on this device. Once you confirm a slot above, it'll show up here.";
      myBookingsList.innerHTML = "";
      return;
    }
    myBookingsEmpty.style.display = "none";
    myBookingsList.innerHTML = bookings
      .map(
        (b) => `
      <li data-id="${b.id}">
        <span class="mb-main"><b>${b.serviceName}</b> · ${b.date} at ${b.time} · ${b.stylist === "any" ? "Any stylist" : b.stylist} · #${b.id}</span>
        <button class="mb-cancel" data-cancel="${b.id}">Cancel</button>
      </li>`
      )
      .join("");
  }

  myBookingsList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cancel]");
    if (!btn) return;
    const id = btn.getAttribute("data-cancel");
    const remaining = getBookings().filter((b) => b.id !== id);
    saveBookings(remaining);
    renderMyBookings();
    renderSlots();
  });

  renderMyBookings();
  updateTicket();
})();
