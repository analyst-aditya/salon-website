/* ============================================================
   SERVICES-DATA.JS — single source of truth for services/prices
   Shared by the public site (js/main.js) and the admin dashboard
   (js/admin.js). Default services live here; price/duration/name
   edits made from the admin page are saved as "overrides" in
   localStorage, and fully custom services added from admin are
   stored separately. Both are merged together in getAll().
   ============================================================ */
window.SalonServices = (function () {
  "use strict";

  const OVERRIDE_KEY = "salonServiceOverrides"; // { [id]: { name, desc, duration, price } }
  const CUSTOM_KEY = "salonCustomServices"; // [ {id, code, name, desc, duration, price, icon} ]

  const ICONS = {
    scissors:
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 8.5 20 20M8.5 15.5 20 4M6 6 9 9M6 18 9 15" stroke-linecap="round"/></svg>',
    style:
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7c2-3 5-4 9-4s7 1 9 4M4 12c2-2 5-3 8-3s6 1 8 3M5 17c1.6-1.4 4-2 7-2s5.4.6 7 2"/></svg>',
    head:
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21v-3.2c-2.5-1-4-3.2-4-6 0-4 3.2-7 7.5-7S20 7.8 20 11.8c0 2.6-1.3 4.6-3.3 5.8L16 21"/><path d="M9 17h6"/></svg>',
    body:
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2"/><path d="M7 22l1.5-7.5L6 12l2-5h8l2 5-2.5 2.5L17 22M9 9.5h6"/></svg>',
    beard:
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7c0 5.5.5 8.5 2.2 11 1 1.5 2.4 2.5 3.8 2.5s2.8-1 3.8-2.5C17.5 15.5 18 12.5 18 7"/><path d="M6 7c0-2.8 2.7-5 6-5s6 2.2 6 5"/></svg>',
    color:
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 7 5 11 5 14.5A7 7 0 0 0 19 14.5C19 11 16 7 12 2Z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 5 0"/></svg>',
    sparkle:
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M18 18l-3-3M6 18l3-3M18 6l-3 3"/></svg>',
  };

  const DEFAULTS = [
    {
      id: "hair-cut",
      code: "01",
      name: "Hair Cutting",
      desc: "A clean, classic cut shaped to your face and how you actually style it at home.",
      duration: 30,
      price: 250,
      icon: "scissors",
      builtin: true,
    },
    {
      id: "stylish-cut",
      code: "02",
      name: "Stylish Hair Cutting",
      desc: "Skin fades, textured crops, design lines — the sharper cuts that take real practice.",
      duration: 45,
      price: 450,
      icon: "style",
      builtin: true,
    },
    {
      id: "head-massage",
      code: "03",
      name: "Head Massage",
      desc: "Warm-oil scalp and pressure-point massage to undo a week of tension in one sitting.",
      duration: 30,
      price: 350,
      icon: "head",
      builtin: true,
    },
    {
      id: "body-massage",
      code: "04",
      name: "Body Massage",
      desc: "Full back, neck and shoulder massage — the one people book just for themselves.",
      duration: 45,
      price: 600,
      icon: "body",
      builtin: true,
    },
    {
      id: "beard-cut",
      code: "05",
      name: "Beard Cutting & Grooming",
      desc: "Line-ups, shape-ups and a hot towel finish so the beard matches the haircut.",
      duration: 25,
      price: 200,
      icon: "beard",
      builtin: true,
    },
    {
      id: "hair-color",
      code: "06",
      name: "Hair Colouring",
      desc: "Grey coverage or a full colour change, done with products that don't wreck your hair.",
      duration: 60,
      price: 800,
      icon: "color",
      builtin: true,
    },
  ];

  function safeParse(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch {
      return fallback;
    }
  }

  function getOverrides() {
    return safeParse(OVERRIDE_KEY, {});
  }
  function saveOverrides(obj) {
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(obj));
  }
  function getCustom() {
    return safeParse(CUSTOM_KEY, []);
  }
  function saveCustom(arr) {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr));
  }

  function withIcon(svc) {
    return { ...svc, iconSvg: ICONS[svc.icon] || ICONS.sparkle };
  }

  function getAll() {
    const overrides = getOverrides();
    const builtins = DEFAULTS.map((s) => withIcon({ ...s, ...(overrides[s.id] || {}) }));
    const customs = getCustom().map(withIcon);
    return builtins.concat(customs);
  }

  function getById(id) {
    return getAll().find((s) => s.id === id);
  }

  // Update a service's editable fields (name/desc/duration/price/icon).
  // Works for both builtin services (stored as an override) and custom ones.
  function updateService(id, patch) {
    const isBuiltin = DEFAULTS.some((s) => s.id === id);
    if (isBuiltin) {
      const overrides = getOverrides();
      overrides[id] = { ...(overrides[id] || {}), ...patch };
      saveOverrides(overrides);
    } else {
      const customs = getCustom();
      const idx = customs.findIndex((s) => s.id === id);
      if (idx > -1) {
        customs[idx] = { ...customs[idx], ...patch };
        saveCustom(customs);
      }
    }
  }

  function addCustom(svc) {
    const customs = getCustom();
    const slug =
      "svc-" +
      svc.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 24) +
      "-" +
      Math.random().toString(36).slice(2, 6);
    customs.push({
      id: slug,
      code: String(DEFAULTS.length + customs.length + 1).padStart(2, "0"),
      name: svc.name,
      desc: svc.desc || "",
      duration: Number(svc.duration) || 30,
      price: Number(svc.price) || 0,
      icon: "sparkle",
      builtin: false,
    });
    saveCustom(customs);
  }

  function removeCustom(id) {
    saveCustom(getCustom().filter((s) => s.id !== id));
  }

  function resetOverrides() {
    localStorage.removeItem(OVERRIDE_KEY);
  }

  return {
    getAll,
    getById,
    updateService,
    addCustom,
    removeCustom,
    resetOverrides,
    isBuiltin: (id) => DEFAULTS.some((s) => s.id === id),
  };
})();
