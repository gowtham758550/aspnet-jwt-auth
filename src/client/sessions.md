# Auth Session Tester — Implementation Plan

## Overview

A single-page HTML application that renders multiple independent auth session cards side by side. Each card manages its own credentials, tokens, and state. No framework dependencies — plain HTML, CSS, and vanilla JS.

---

## Architecture

### Single File Structure

```
index.html
├── <style>         — All CSS, CSS variables, theming
├── <body>          — Top bar + session grid
└── <script>        — State management + API layer + UI renderer
```

Everything lives in one `.html` file so it can be opened directly in a browser with no build step.

---

## State Model

Each session is a plain JS object:

```js
{
  id: "session-a",
  color: "#85B7EB",          // accent color (cycles from a palette)
  email: "",
  password: "",
  status: "idle",            // idle | logged-in | expired | error
  accessToken: null,
  refreshToken: null,
  decodedAccess: null,       // parsed JWT payload
  decodedRefresh: null,
  user: null,                // response from /me
  log: []                    // activity log entries [ { time, message, type } ]
}
```

State is held in a top-level `sessions[]` array. Every API action mutates the relevant session object and triggers a re-render of that card only.

---

## Configuration (Top Bar)

| Field | Default | Notes |
|---|---|---|
| Base URL | `http://localhost:3000` | Editable input, saved to `localStorage` |
| Endpoints | Auto-derived | Shown as read-only hints beside the URL |

Endpoint paths are hardcoded as constants but easy to change:

```js
const ENDPOINTS = {
  login:      "POST /login",
  logout:     "POST /logout",
  logoutAll:  "POST /logout-all",
  refresh:    "POST /refresh",
  me:         "GET  /me"
}
```

---

## Session Card Anatomy

```
┌─────────────────────────────────┐
│  ▐ color accent strip           │  ← 4px top border in session color
│  Session A              [✕]     │  ← label + remove button
│  ● Not logged in                │  ← status indicator
├─────────────────────────────────┤
│  LOGIN FORM  (when idle)        │
│  [email input        ]          │
│  [password input     ]          │
│  [     Login         ]          │
├─────────────────────────────────┤
│  USER INFO  (when logged in)    │
│  ◉ JD  Jane Doe                 │
│       jane@example.com          │
├─────────────────────────────────┤
│  ACCESS TOKEN                   │
│  eyJhbGci…   [Valid] 14m 22s ↓  │  ← countdown tick every second
│  REFRESH TOKEN                  │
│  eyJhbGci…   [Valid] 6d 23h  ↓  │
├─────────────────────────────────┤
│  [/me]  [Refresh↑]              │
│  [Logout]  [Logout All]         │
├─────────────────────────────────┤
│  ACTIVITY LOG                   │
│  12:01:03  POST /login → 200    │
│  12:01:10  GET /me → 200        │
└─────────────────────────────────┘
```

---

## API Layer

All API calls go through a single `apiCall(session, method, path, body?)` function:

```js
async function apiCall(session, method, path, body) {
  const headers = { "Content-Type": "application/json" }

  if (session.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`
  }

  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  const data = await res.json()
  logEntry(session, `${method} ${path} → ${res.status}`, res.ok ? "success" : "error")
  return { ok: res.ok, status: res.status, data }
}
```

### Per-action handlers

| Action | Call | On success |
|---|---|---|
| **Login** | `POST /login` with `{email, password}` | Store `accessToken`, `refreshToken`, decode both, fetch `/me`, set status `logged-in` |
| **Logout** | `POST /logout` with Bearer token | Clear tokens, user, set status `idle` |
| **Logout all** | `POST /logout-all` with Bearer token | Same as logout |
| **Refresh** | `POST /refresh` with `{refreshToken}` | Replace `accessToken`, re-decode, update countdown |
| **/me** | `GET /me` with Bearer token | Update `user` object on card |

---

## JWT Decoding

Done entirely client-side — no library needed:

```js
function decodeJwt(token) {
  try {
    const payload = token.split(".")[1]
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
  } catch {
    return null
  }
}
```

Displayed fields from decoded payload: `exp`, `iat`, `sub` (or `userId`), and any extra claims.

---

## Expiry Countdown

A single global `setInterval` runs every second. It iterates all sessions, checks `decodedAccess.exp` against `Date.now() / 1000`, and updates the countdown display. When a token crosses zero it flips to `expired` status and re-renders the card's status badge.

```js
setInterval(() => {
  sessions.forEach(s => {
    if (s.decodedAccess) updateCountdown(s)
  })
}, 1000)
```

---

## Session Color Palette

Colors cycle in order as sessions are added:

```js
const PALETTE = [
  "#85B7EB",  // blue
  "#5DCAA5",  // teal
  "#F0997B",  // coral
  "#AFA9EC",  // purple
  "#FAC775",  // amber
  "#ED93B1",  // pink
]
```

The card's top accent strip, avatar background, and status dot tint all derive from this color.

---

## Activity Log

Each session has a small scrollable log at the bottom of its card showing the last 10 actions with timestamps:

```
12:01:03  ✓ POST /login → 200
12:01:10  ✓ GET /me → 200
12:03:44  ✗ GET /me → 401  (token expired)
12:03:45  ✓ POST /refresh → 200
```

Log entries are prepended so newest is always on top.

---

## Rendering Strategy

No virtual DOM or framework. Each card is rendered by `renderCard(session)` which returns an HTML string and sets `innerHTML` on the card's container div. Only the affected card re-renders on state change — other cards are untouched.

---

## Add / Remove Sessions

- **Add**: Clicking "+ Add session" pushes a new session object to `sessions[]` and appends a new card to the grid.
- **Remove**: The `✕` on each card splices it from `sessions[]` and removes its DOM node.
- Minimum 1 session always present; no maximum.

---

## What Is NOT Included

- No routing, no build tooling, no npm
- No token storage to `localStorage` (intentional — sessions are ephemeral per page load)
- No HTTPS enforcement (this is a local dev tool)
- No PKCE / OAuth flows — only direct email+password login

---

## Deliverable

A single `auth-session-tester.html` file. Open in any browser. Point at your local API. Done.