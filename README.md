# The Gentlemen's Chair — Men's Salon Website

A complete, ready-to-use website for a men's salon/barbershop with an interactive
3D hero (Three.js), a full services menu, a working booking system, and a live
chat widget. Pure HTML/CSS/JS — no build step, no server required.

## How to run it

**Option 1 — just open it**
Double-click `index.html` and it'll redirect you to the login page (an account is
required to view the site now). Tap "Sign up", create any username/password, and
you'll land on the homepage — everything works, including booking and chat.

**Option 2 — local server (recommended)**
Some browsers restrict things slightly when opened via `file://`. To be safe:

```bash
# Python 3
python -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`.

**Option 3 — go live**
Upload the whole folder as-is to any static host: Netlify, Vercel, GitHub Pages,
Cloudflare Pages, or your existing hosting via FTP. No build step needed.

## What's inside

```
salon-website/
├── index.html             → public site (requires login — see below)
├── auth.html               → customer login / signup (username + password)
├── admin.html               → owner-only dashboard (separate passcode login)
├── css/style.css, auth.css, admin.css
├── js/
│   ├── services-data.js     → shared service list (admin edits live here)
│   ├── account.js           → shared logged-in-customer state
│   ├── auth.js              → auth.html logic (signup/login, password hashing)
│   ├── admin.js              → admin.html logic
│   ├── main.js, chat.js, three-hero.js
└── README.md
```

## Two separate login systems, and login is now required

- **Customers** sign up / log in on `auth.html` with a username and password.
  `index.html` checks for a logged-in customer the instant it loads and bounces
  straight to `auth.html` if nobody's logged in — so the booking page never shows
  before someone has an account. Once logged in, the nav greets them by name,
  the booking form pre-fills their name/phone, and "Your bookings" only shows
  bookings made under their account.
- **Owner/staff** use `admin.html` — a single shared passcode (`chair2026` by
  default, change it in `js/admin.js`). It already shows the passcode screen
  first and only reveals the dashboard after it's entered — same idea, kept as
  a completely separate system from customer accounts on purpose.

## Why no Google/Facebook/SMS login

Real Google or Facebook sign-in needs an app registered with Google/Meta (a
Client ID / App ID tied to your live domain), and real SMS OTP needs a paid
provider like Twilio or Firebase Phone Auth — both require a backend and
credentials only you can create. Since this is a plain front-end site with
no server, those can't be made to "just work" out of the box, so — as
requested — they've been replaced with a standard username + password login
that works completely on its own, no third-party setup required.

If you later add a backend and want real Google/Facebook/SMS login back,
that logic plugs into the same `loginSuccess()` function in `js/auth.js`.

### A note on password storage

Account passwords are run through a simple scrambling hash in `js/auth.js`
before being saved (so they're not sitting in plain text), but this is **not**
real cryptographic security — there's no server here to keep anything truly
secret. Fine for a small site's basic gate; for anything sensitive, move
accounts to a real backend with proper password hashing (bcrypt/argon2) and
sessions.

## "This seat is already booked"

Time slots that clash with an existing booking are shown struck-through with a small
"Booked" tag and a tooltip reading "This seat is already booked"; past times for today are
labelled "Past". The form also re-checks for a clash at the moment of submission, in case two
people were booking the same slot at once.


## Things you'll want to customize

- **Salon name** — search for "The Gentlemen's Chair" across the HTML files and replace it.
- **Services, prices, names & descriptions** — edit them live from `admin.html` (no code
  needed), or change the defaults in `js/services-data.js`.
- **Admin passcode** — `ADMIN_PASSCODE` in `js/admin.js`.
- **Address / phone / email / hours / map** — edit the "Visit Us" section in `index.html`.
- **Stylist names** — edit the `<select id="stylistSelect">` options in `index.html`
  (and nothing else needs to change, the booking logic reads from there).
- **Colors / fonts** — edit the `:root` variables at the top of `css/style.css`.
- **Chat auto-replies** — edit `craftReply()` in `js/chat.js`.

## How the booking system works (important)

This is a **front-end-only** site, so bookings are saved in the visitor's own
browser using `localStorage`. That means:

- ✅ It fully works for demoing, testing, and even running a small single-device
  setup (e.g. a tablet at the front desk that customers use to book, and you
  check the "Bookings on this device" list).
- ❌ It does **not** sync bookings across different visitors' phones/computers
  to one central list you can see from your own laptop — each device only sees
  bookings made on itself.

**To get real, cross-device bookings**, connect `js/main.js`'s `bookingForm`
submit handler to a backend of your choice, for example:
- A free **Google Form** or **Google Sheet** (via Apps Script web app)
- **Firebase** (Firestore) — a few lines of JS, free tier is generous
- **Airtable** API
- Your own small backend (Node/Express, PHP, etc.)

The form already validates everything (service, date, time slot, name, 10-digit
phone) — you'd just swap the `localStorage` save for a `fetch()` call to your API.

## How the chat widget works

Same idea — it's a self-contained simulated chat with keyword-based auto-replies
(price, timing, location, booking, etc.), stored in `localStorage` so the
conversation survives a page reload. To make it a **real** live chat with your
staff, the simplest options are:
- Swap it for a WhatsApp Business "click to chat" link
- Plug in a free widget like Tawk.to or Crisp
- Or wire `chat.js`'s `form` submit handler to your own backend / Firebase

## Browser support

Modern Chrome, Edge, Firefox, Safari (desktop & mobile). The 3D hero needs WebGL,
which all of those support; if WebGL is somehow unavailable the rest of the site
still works fine, the hero just shows the background gradient without the 3D scene.

## Credits

Fonts: Fraunces, Inter, JetBrains Mono (Google Fonts).
3D: Three.js (loaded via CDN — `js/three-hero.js`).
No other dependencies.
