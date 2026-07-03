# Meeting QR Attendance System

A production-ready QR Code based meeting attendance web application built with **Next.js 15 (App Router) + TypeScript + Tailwind CSS**, deployable entirely on **Vercel** — no external backend required.

---

## Features

### Admin
- Secure login (HMAC-signed httpOnly cookie, protected routes via middleware)
- Dashboard: Total Meetings, Today's Meetings, Total Attendance, Present Today
- Charts: Attendance by Department, Meeting-wise, 14-day Trend
- Create unlimited meetings with unique IDs (`MTG-YYYYMMDD-001`)
- Per-meeting dynamic QR codes — old QR never works for a new meeting
- Meeting list: Search, Edit, Close/Reopen, Delete, Duplicate
- QR: view, Download PNG, Print
- Attendance: search, filter (Today/Yesterday/7d/30d/Custom), sort, delete
- **Excel export** (19 columns incl. GPS, browser, device, IP)
- **PDF export** (government-style header, summary, footer with page numbers)
- Dark mode / Light mode

### Participant (QR scan)
- Scans QR → `/attendance/MTG-xxxx` opens automatically
- Meeting details shown (name, date, time, venue)
- Form: Name, Mobile (10-digit), Designation, Department, Remarks
- Automatic capture: GPS (if required), date, time, browser, device, IP
- Validations: required fields, mobile format, duplicate prevention, attendance time window
- Meeting Closed / Invalid QR / Already Registered / Success screens

---

## Default Admin Login

| Field    | Value       |
|----------|-------------|
| Username | `admin`     |
| Password | `Admin@123` |

Override via environment variables (see below).

---

## Storage

The app uses a two-tier storage layer (`lib/storage.ts`):

1. **Upstash Redis (recommended for Vercel)** — used automatically when
   `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) are set.
2. **Local JSON file** (`data/db.json`) — automatic fallback for local development.

> ⚠️ Vercel serverless functions have a read-only filesystem, so the JSON file
> fallback does **not** persist in production. Add the free Upstash Redis
> integration (below) for persistent storage on Vercel.

---

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000 → redirects to `/login`.

---

## GitHub Setup

```bash
git init
git add .
git commit -m "Meeting QR Attendance System"
git branch -M main
git remote add origin https://github.com/<your-username>/meeting-qr-attendance.git
git push -u origin main
```

---

## Vercel Deployment

1. Go to https://vercel.com → **Add New Project** → import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Click **Deploy**.
3. **Add persistent storage (free):**
   - In the Vercel project → **Storage** tab → **Create Database** → **Upstash (Redis)** → Free plan.
   - Vercel automatically injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
   - Redeploy the project.
4. Done — your app is live at `https://<project>.vercel.app`.

---

## Environment Variables

| Variable            | Default          | Description                    |
|---------------------|------------------|--------------------------------|
| `ADMIN_USERNAME`    | `admin`          | Admin login username           |
| `ADMIN_PASSWORD`    | `Admin@123`      | Admin login password           |
| `AUTH_SECRET`       | built-in         | HMAC secret for session tokens |
| `KV_REST_API_URL`   | —                | Upstash Redis REST URL         |
| `KV_REST_API_TOKEN` | —                | Upstash Redis REST token       |

Set these in Vercel → Project → Settings → Environment Variables.

---

## Project Structure

```
app/
├── page.tsx                      # Redirect → /login
├── layout.tsx                    # Root layout + dark mode bootstrap
├── globals.css                   # Tailwind + design tokens
├── login/page.tsx                # Admin login
├── dashboard/
│   ├── page.tsx                  # Stats cards + charts
│   ├── meetings/
│   │   ├── page.tsx              # List / search / actions / QR
│   │   ├── new/page.tsx          # Create meeting
│   │   └── [id]/page.tsx         # Edit meeting
│   └── attendance/page.tsx       # Records, filters, Excel/PDF export
├── attendance/[meetingId]/page.tsx  # Public QR-scan form
└── api/
    ├── auth/login/route.ts       # POST login → cookie
    ├── meetings/route.ts         # GET list / POST create
    ├── meetings/[id]/route.ts    # GET public / PUT / DELETE
    ├── attendance/route.ts       # POST public / GET / DELETE admin
    └── stats/route.ts            # Dashboard stats
components/
├── Shell.tsx                     # Admin nav + dark mode + logout
├── MeetingForm.tsx               # Shared create/edit form
└── QRModal.tsx                   # QR view / download / print
lib/
├── types.ts                      # TypeScript interfaces
├── storage.ts                    # Upstash Redis / JSON storage layer
├── auth.ts                       # Credential check + HMAC tokens
└── utils.ts                      # Meeting ID gen, time-window logic
middleware.ts                     # Protects /dashboard/*
```

---

## Security Notes

- `/dashboard/*` routes require a valid signed cookie (middleware + per-API verification).
- QR contains only the Meeting ID; the server validates it and the attendance time window.
- Duplicate attendance blocked per mobile number per meeting.
- Change `ADMIN_PASSWORD` and `AUTH_SECRET` in production.
