# WorkEasy360 HRMS — Architecture & Build Plan

Multi-tenant SaaS HRMS (Zoho People / Razorpay X-Payroll class product).

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript), Tailwind CSS, shadcn/ui, TanStack Query, Zustand |
| Backend | NestJS (TypeScript), REST + selective GraphQL for reporting |
| Database | PostgreSQL (primary, row-level multi-tenancy) + Redis (cache/queues/sessions) |
| ORM | Prisma |
| Auth | JWT (access+refresh) + NestJS Guards, OAuth2 (Google/Microsoft SSO), optional SAML for enterprise |
| File storage | S3-compatible (documents, payslips, resumes) |
| Background jobs | BullMQ (Redis) — payroll runs, attendance regularization, email/notification digests |
| Search | Postgres full-text initially; Elasticsearch/Meilisearch if directory search scales |
| Infra | Docker, single monorepo, CI via GitHub Actions, deploy target: any container host (Render/Fly/ECS) |
| Monorepo tool | Turborepo (apps/web, apps/api, packages/shared-types, packages/ui) |

## 2. Multi-Tenancy Model

- **Shared DB, shared schema, `organization_id` on every tenant-scoped table** (simplest to operate at this stage; revisit schema-per-tenant only if a large enterprise customer demands hard isolation).
- Every request resolves `organization_id` from the authenticated user's JWT claims — never from client input.
- Prisma middleware auto-injects `organization_id` filters on all tenant-scoped queries (defense in depth against missing a `where` clause).
- Subdomain or custom domain per org (`acme.workeasy360.com`) resolved at the edge to attach tenant context.

## 3. Core Domain Model (high level)

```
Organization (tenant)
 └─ Department / Team (self-referencing for hierarchy)
 └─ Location / Branch
 └─ Employee (1:1 User account)
     ├─ EmploymentDetail (designation, band, manager, dates)
     ├─ CompensationRecord (CTC structure, revisions)
     ├─ Document[] (offer letter, ID proofs, contracts)
     ├─ AttendanceRecord[] (per day, source: biometric/web/mobile)
     ├─ LeaveBalance[] / LeaveRequest[]
     ├─ Shift assignment
     ├─ TimesheetEntry[]
     ├─ PerformanceReviewCycle participation, Goal[]
     ├─ OnboardingChecklist / OffboardingChecklist
     └─ HelpDeskTicket[]
Role / Permission (RBAC, org-scoped, with system default roles: Admin, HR, Manager, Employee)
PayrollRun → Payslip (per employee, per run)
Policy (leave policy, attendance policy — versioned, assignable to department/location)
Announcement, Task, Approval Workflow (generic — used by leave, expense, docs, requests)
```

## 4. Module → Feature Breakdown (mapped to your nav)

- **Home** — role-based dashboard (widgets: pending approvals, attendance today, announcements, birthdays/anniversaries).
- **My Workspace** — self-service views scoped to `req.user.employeeId`: profile, attendance, leave, documents, requests (generic approval-workflow submissions), tasks.
- **People** — directory (search/filter), profile (admin/HR edit rights via RBAC), org chart (recursive manager tree), lifecycle (onboarding → active → exit, state machine per employee).
- **Time & Attendance** — check-in/out (web + geo/IP optionally), regularization requests, leave types/policies/balances, shift templates + roster assignment, timesheets (project/task-based hours, approval flow).
- **Talent** — onboarding checklists/workflows, performance review cycles (self/manager/360), goals (OKR-style, linked to review cycle).
- **HR Services** — document repository (templates, e-sign integration later), help desk (ticket categories, SLA, assignment), announcements (audience targeting by dept/location).
- **Payroll** — compensation structures (CTC breakup, salary revision history), payroll run engine (compute gross→net, statutory deductions — PF/ESI/TDS for India as default locale, pluggable per-country rules later), payslip generation (PDF) + employee access.
- **Reports** — pre-built report library (headcount, attrition, leave liability, payroll cost) + ad-hoc report builder on top of a reporting read-model.
- **Automation** — rule engine (trigger: event e.g. "leave approved" → action: e.g. "notify manager, update balance"); reuses the generic Approval Workflow engine.
- **HR Guide** — static/CMS-backed policy & knowledge base content per org.
- **Settings** — Organization profile, Policies (leave/attendance/expense), Roles & Permissions (custom RBAC), Integrations (SSO, biometric devices, Slack/email), Security (audit log, session mgmt, IP allowlist, 2FA).

## 5. Cross-Cutting Systems (build once, reuse everywhere)

1. **RBAC engine** — permission = `resource:action` (e.g. `leave:approve`), roles are sets of permissions, org-customizable.
2. **Approval Workflow engine** — generic, used by Leave, Timesheet, Expense/Requests, Document requests. Config: steps, approvers (by role/manager-chain), escalation.
3. **Audit Log** — every mutating action on sensitive entities (payroll, compensation, roles) logged with actor, before/after diff.
4. **Notification service** — in-app + email (and later push), templated, queued via BullMQ.
5. **File/document service** — signed upload URLs to S3, virus-scan hook placeholder, access-controlled downloads.

## 6. Security & Compliance

- Row-level tenant isolation (§2) + RBAC at API layer (guards on every controller).
- Encryption at rest for PII columns that need it (bank details, national ID) — pgcrypto or app-level.
- Audit trail for payroll/compensation changes (compliance requirement in every real HRMS).
- Rate limiting + brute-force lockout on auth endpoints.
- GDPR-style data export/delete per employee (needed for enterprise sales later).

## 7. Repo Structure (proposed)

```
apps/
  web/          # Next.js frontend
  api/          # NestJS backend (modules mirror §4: attendance, leave, payroll, people, ...)
packages/
  shared-types/ # DTOs/interfaces shared FE<->BE
  ui/           # shared design-system components
prisma/
  schema.prisma
```

## 8. Phased Roadmap

- **Phase 0 (foundation):** monorepo scaffold, auth (email/password + JWT), multi-tenant org creation, RBAC skeleton, People module (directory + profile), Settings→Organization.
- **Phase 1 (self-service core):** My Workspace, Attendance (check-in/out), Leave (types, request, approval via workflow engine), Announcements.
- **Phase 2 (talent + payroll basics):** Onboarding, Shifts, Timesheets, Compensation structure, Payroll run + Payslips (single country ruleset first).
- **Phase 3 (scale features):** Performance & Goals, Help Desk, Reports library, Automation rule engine, Integrations (SSO), Security hardening (audit log, 2FA), HR Guide.
- **Phase 4 (enterprise-readiness):** Custom RBAC per org, multi-country payroll, advanced report builder, SLA'd help desk, white-labeling.

## 9. Immediate Next Step

Scaffold Phase 0: Turborepo + Next.js + NestJS + Prisma + Postgres, auth module, Organization/Employee/Role Prisma models, and the People directory as the first working vertical slice.
