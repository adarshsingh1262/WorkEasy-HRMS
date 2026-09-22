# WorkEasy360 HRMS

Multi-tenant HRMS (Zoho People / Razorpay X–class). See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full architecture, domain model, and roadmap.

## Folder structure

```
frontend/     # Next.js app
backend/      # Node.js + Express + PostgreSQL API
README.md
```

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally (or a connection string to one)

## Backend setup

```bash
cd backend
npm install
cp .env.example .env     # edit DATABASE_URL / JWT secrets as needed
npx prisma migrate dev   # creates the schema
npm run dev               # http://localhost:4000
```

The permission catalog is seeded automatically on server boot, so no separate seed step is required after migrating.

## Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # points at http://localhost:4000/api by default
npm run dev                         # http://localhost:3000
```

## What's implemented (v0)

**Phase 0 — foundation**
- Multi-tenant org registration (creates Organization + Admin user + Employee)
- JWT auth (access + refresh tokens), login, session restore
- RBAC: system default roles (Admin, HR, Manager, Employee) with per-permission API guards
- People: Employee Directory (search, add employee), employee profile view
- My Workspace: My Profile
- Settings: Organization profile

**Phase 1 — self-service core**
- My Workspace: My Attendance (check-in/check-out, history)
- My Workspace: My Leave (leave types, request, cancel own pending request)
- Leave Approvals: manager-chain approval (a request routes to the employee's manager) plus org-wide approval for HR/Admin; approving increments a per-employee/per-leave-type/per-year balance
- Announcements: publish (HR/Admin) and view (everyone), surfaced on the Home dashboard

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) §8 for the rest of the v0 roadmap (Onboarding, Shifts, Timesheets, Payroll, etc.) and §10 for features deferred to v1.
