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
- Approvals: manager-chain approval (a request routes to the employee's manager) plus org-wide approval for HR/Admin; approving a leave request increments a per-employee/per-leave-type/per-year balance
- Announcements: publish (HR/Admin) and view (everyone), surfaced on the Home dashboard

**Phase 2 — talent + payroll basics**
- Talent: Onboarding checklists (default tasks auto-created per new hire, HR/Admin can add more; employee self-checks off their own tasks)
- Time & Attendance: Shifts (HR/Admin define shift templates and assign employees; everyone sees their own current shift)
- Time & Attendance: Timesheets (self log daily hours; manager-chain or HR/Admin approval, surfaced on the same Approvals page as leave)
- Payroll: Compensation (HR/Admin set annual CTC per employee, effective-dated), Payroll Processing (create a monthly run, process it to generate payslips from each active employee's current compensation), My Payslips (self view)
  - Payroll deductions use a flat placeholder rate for v0 — real statutory calculations (PF/ESI/TDS) are deferred to v1, see `ARCHITECTURE.md` §10.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) §8 for the rest of the v0 roadmap (Performance & Goals, Help Desk, Reports, Automation, HR Guide) and §10 for features deferred to v1.
