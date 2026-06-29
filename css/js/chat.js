/* ============================================================
   CHAT.JS — front-end chat widget
   Messages persist in localStorage on this device.
   This is a self-contained simulated chat (no server). To make
   it a real live chat, point chatForm's submit handler at your
   own backend, or swap in a service like Tawk.to / WhatsApp API.
   ============================================================ */
(function () {
  "use strict";

  const STORE_KEY = "salonChatMessages";

  const launcher = document.getElementById("chatLauncher");
  const panel = document.getElementById("chatPanel");
  const closeBtn = document.getElementById("chatClose");
  const body = document.getElementById("chatBody");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const typingEl = document.getElementById("chatTyping");
  const dot = document.getElementById("chatDot");

  function getMessages() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
    } catch {
      return [];
    }
  }
  function saveMessages(list) {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  }

  function timeNow() {
    return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }

  function appendMessage(sender, text, time) {
    const div = document.createElement("div");
    div.className = "chat-msg " + (sender === "user" ? "user" : "shop");
    div.innerHTML = `${escapeHtml(text)}<span class="chat-time">${time || timeNow()}</span>`;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function loadHistory() {
    const msgs = getMessages();
    if (!msgs.length) {
      const greet = {
        sender: "shop",
        text: "Hey! 👋 Welcome to The Gentlemen's Chair. Ask me about timings, prices, or just book a slot below — happy to help.",
        time: timeNow(),
      };
      saveMessages([greet]);
      appendMessage(greet.sender, greet.text, greet.time);
      return;
    }
    msgs.forEach((m) => appendMessage(m.sender, m.text, m.time));
  }

  function pushMessage(sender, text) {
    const time = timeNow();
    const msgs = getMessages();
    msgs.push({ sender, text, time });
    saveMessages(msgs);
    appendMessage(sender, text, time);
  }

  /* ---------- open / close ---------- */
  let opened = false;
  function openChat() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    dot.classList.remove("show");
    opened = true;
    setTimeout(() => input.focus(), 150);
  }
  function closeChat() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    opened = false;
  }
  launcher.addEventListener("click", () => (opened ? closeChat() : openChat()));
  closeBtn.addEventListener("click", closeChat);

  /* ---------- canned "owner" responses ---------- */
  function craftReply(userText) {
    const t = userText.toLowerCase();
    if (/(price|cost|charge|rate|how much)/.test(t)) {
      return "Our cuts start at ₹250, beard grooming at ₹200, and massages from ₹350 — full list is in the Menu section above. Want me to hold a slot for you?";
    }
    if (/(time|hour|open|close|when)/.test(t)) {
      return "We're open 10am–8pm on weekdays, a little later on Fri/Sat, and 9am–6pm on Sundays. Full hours are in the Visit Us section.";
    }
    if (/(address|location|where|direction|map)/.test(t)) {
      return "We're on Mall Road — exact address and a phone number are in the Visit Us section near the bottom of the page.";
    }
    if (/(book|appointment|slot|reserve|available)/.test(t)) {
      return "You can grab a slot yourself in the Book a Slot section — pick a service, date and time and it locks in instantly. Want me to point you there?";
    }
    if (/(beard)/.test(t)) {
      return "Beard line-ups and grooming run about 25 minutes, ₹200, hot towel included.";
    }
    if (/(colou?r|grey|dye)/.test(t)) {
      return "Colouring (grey coverage or a full change) is about an hour, ₹800, with products that won't dry your hair out.";
    }
    if (/(massage)/.test(t)) {
      return "Head massage is ₹350 / 30 min, full body massage is ₹600 / 45 min. Both are popular for a reason!";
    }
    if (/(whatsapp|call|contact|number|phone)/.test(t)) {
      return "You can reach us directly on WhatsApp at +91 76519 18998 — tap the green button to start chatting right away.";
    }
    if (/(thank|thanks|great|cool|nice)/.test(t)) {
      return "Anytime! See you in the chair. 🪒";
    }
    if (/(hi|hello|hey)/.test(t)) {
      return "Hey there! What can I help you with — pricing, timings, or booking a slot?";
    }
    return "Got it — thanks for the message! One of our team will follow up shortly. In the meantime feel free to book directly in the section above.";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    pushMessage("user", text);
    input.value = "";

    typingEl.hidden = false;
    body.scrollTop = body.scrollHeight;

    const delay = 700 + Math.random() * 900;
    setTimeout(() => {
      typingEl.hidden = true;
      pushMessage("shop", craftReply(text));
    }, delay);
  });

  loadHistory();

  // show the little "new message" dot once after a few seconds if chat hasn't been opened,
  // just to nudge first-time visitors toward it.
  setTimeout(() => {
    if (!opened) dot.classList.add("show");
  }, 4000);
})();
