# WorkEasy360 — Organization Workflows Guide

This document describes, workflow by workflow, how an organization actually uses WorkEasy360 day to day. For system architecture see [`ARCHITECTURE.md`](./ARCHITECTURE.md); for setup/install steps see [`README.md`](./README.md). This guide assumes the app is already running.

## Roles at a glance

Every user has one or more Roles, each made of `resource:action` permissions. Four system roles are auto-created for every new organization:

| Role | Can do |
|---|---|
| **Admin** | Everything, including organization settings and role management |
| **HR** | Everything except organization settings and role management |
| **Manager** | Read department/employee data, view announcements, approve requests from their direct reports |
| **Employee** | Self-service only: their own records, and read-only department/announcement visibility |

Admin/HR can also create custom roles under **Settings → Organization** (v0 RBAC is role-based, not per-user).

## The approval-routing pattern (used everywhere)

Leave, Timesheet, Expense, and Loan requests all use the same routing rule, so it's worth understanding once:

- A request is first routed to the requester's **direct manager** (the `managerId` set on their Employee record).
- **Anyone with the relevant `*:manage` permission** (normally HR/Admin) can also see and act on it, regardless of the reporting line — this is the escape hatch when a manager is unavailable or for org-wide oversight.
- All of these requests surface together on the **Approvals** page, grouped by type.

---

## 1. Getting started — organization registration

**Actor:** the first person setting up the company (becomes Admin).

1. Go to `/register`.
2. Fill in organization name, a URL-safe slug (used to identify the tenant), and the admin's name/email/password.
3. Submitting creates, in one transaction: the Organization, the four system Roles with their permissions, an Admin User, and a matching Employee record for that admin.
4. The user is logged in immediately and lands on the Home dashboard.

**Outcome:** a fully isolated tenant — every later record (employees, leave, payroll, etc.) is scoped to this `organizationId` and invisible to any other organization.

## 2. Logging in (and 2FA)

1. Go to `/login`, enter email + password.
2. If the user has 2FA enabled (see §17 Security), the server issues a short-lived MFA challenge token instead of a session; the UI prompts for a 6-digit TOTP code from their authenticator app before completing login.
3. On success, the client stores an access token (15 min) and refresh token (7 days); the client silently refreshes the access token in the background so the session doesn't drop mid-use.

## 3. Organization setup (Admin/HR, one-time or occasional)

Before adding employees day-to-day, an Admin typically configures:

- **Organization profile** (`Settings → Organization`): name and org-level details.
- **Departments** (`People → + Department` or similar): a flat list employees are assigned to; used for directory filtering and headcount reports.
- **Leave types** (configured wherever leave types are managed): e.g. Annual, Sick, Casual — each with a default number of days allocated per year.
- **Shift templates** (`Shifts`): named work schedules (e.g. "9–6 General Shift") that get assigned to employees.
- **HR Guide articles** (`HR Guide`): policy documents HR authors for all employees to reference.
- **Automation rules** (`Automation`): optional `when <trigger> then <action>` rules — see §16.

## 4. Adding an employee directly

**Actor:** Admin/HR (requires `employee:write`).

1. Go to **People → Add employee**.
2. Fill in personal details, department, designation, manager (sets `managerId` for approval routing), and hire date.
3. Submitting creates, in one transaction: a User with a generated temporary password, an Employee record, a default Role (Employee, or another chosen role), a starter set of Onboarding tasks, and (if an automation rule matches `EMPLOYEE_ONBOARDED`) triggers that rule.
4. HR shares the temporary password with the new hire out-of-band; the employee logs in and should change their password.

**Outcome:** the employee immediately has self-service access — My Profile, My Attendance, My Leave, etc. — and shows up in the People directory and in reports.

## 5. Employee directory & profile

- **People**: searchable list of all employees in the org — name, department, designation, status. Click through to a full profile (contact info, employment details, manager, department).
- **My Profile**: the logged-in user's own version of that profile, self-view (and self-edit for editable fields).
- **Exit**: when an employee leaves, HR/Admin marks them inactive with an exit date on their profile; this feeds the Attrition report (§15) and stops future payroll/onboarding actions for them, while preserving their historical records.

## 6. Onboarding checklist

**Actors:** HR/Admin (defines tasks), new employee (completes them).

1. When an employee is created (directly or via a recruitment hire), a default checklist of onboarding tasks is auto-generated (e.g. "Complete profile", "Read HR policies").
2. HR/Admin can add more tasks for a specific employee under **Onboarding**.
3. The employee sees their checklist under **My Tasks** and checks off items themselves as they complete them.
4. HR can see overall completion status per employee under **Onboarding**.

## 7. Attendance

**Actor:** every employee, self-service.

1. **My Attendance**: employee clicks **Check in** at the start of the day and **Check out** at the end.
2. The page shows their attendance history (dates, check-in/out times, computed hours).
3. There's no manager approval step for attendance itself — it's a log, consumed later by Reports and (in principle) payroll attendance-based deductions.

## 8. Leave

**Actors:** employee (requests), manager or HR/Admin (approves).

1. Employee goes to **My Leave**, selects a leave type (e.g. Sick), date range, and reason, and submits.
2. The request appears on the approver's **Approvals** page under "Leave requests" (routed per the pattern in the intro).
3. Approver clicks **Approve** or **Reject**.
   - On approval: the employee's per-leave-type, per-year balance is decremented by the requested days (balance was seeded from the leave type's default allocation); if an automation rule matches `LEAVE_APPROVED`, it fires (e.g. auto-post an announcement, assign a task).
   - On rejection: no balance change.
4. Employee can cancel their own still-pending request from **My Leave**.
5. Remaining/used balances per leave type are visible to the employee and roll up into the Leave Liability report (§15).

## 9. Timesheets

**Actors:** employee (logs hours), manager or HR/Admin (approves).

1. Employee goes to **My Timesheet**, logs hours worked against a date (and optionally a project/task note).
2. Submitted entries route to the same **Approvals** page as leave, under "Timesheet entries."
3. Approval marks the entry approved; if an automation rule matches `TIMESHEET_APPROVED`, it fires.
4. Approved timesheet data is what payroll and reporting rely on for hours-based analysis.

## 10. Shifts

**Actors:** HR/Admin (defines and assigns), employee (views own).

1. HR/Admin creates **Shift templates** under `Shifts` (name + working hours pattern).
2. HR/Admin assigns a shift template to one or more employees.
3. Every employee sees their current assigned shift on their own **Shifts**/profile view.

## 11. Performance reviews & goals

**Actors:** HR/Admin (opens the cycle), employee (self-assessment), manager or HR/Admin (final assessment).

1. HR/Admin opens a **Review cycle** (e.g. "H1 2026") under **Performance**; a review record is auto-created for every active employee.
2. Employee fills in their self-assessment for the cycle.
3. Once submitted, the request routes to the employee's manager (or HR/Admin) to add their own assessment and a final rating.
4. Both self- and manager-assessment, plus the rating, remain visible on the employee's review record afterward.
5. **My Goals**: independent of review cycles, employees can create their own goals at any time and update progress (e.g. percentage complete) — useful as a running record managers can reference during reviews.

## 12. Recruitment (hiring pipeline)

**Actors:** HR/Admin end-to-end.

1. **Post a job**: HR creates a Job Posting (title, description, department) under **Recruitment**.
2. **Add candidates**: for that posting, HR adds candidates (name, email, resume notes) — they enter the pipeline at stage `APPLIED`.
3. **Move through stages**: HR advances a candidate through `APPLIED → SCREENING → INTERVIEW → OFFER → HIRED` (or marks `REJECTED` at any point) via a stage selector on the candidate card.
4. **Schedule interviews**: while a candidate is in the pipeline, HR schedules one or more interviews (interviewer = any employee, date/time); after the interview, the interviewer (or HR) records feedback notes and a rating.
5. **Hire**: once a candidate reaches `OFFER` (or is otherwise ready), HR clicks **Hire**, fills in designation/department/start details, and confirms.
   - This runs the *same* employee-creation transaction as adding an employee directly (§4): new User + Employee + default role + onboarding checklist + `EMPLOYEE_ONBOARDED` automation trigger.
   - The candidate record is linked to the new Employee, and a temporary password is shown once to hand to the new hire.

**Outcome:** a full audit trail from job posting to hired employee, with interview history preserved, and zero duplicate data entry at the hire step.

## 13. Compensation & payroll

**Actors:** HR/Admin sets pay and runs payroll; every employee views their own payslips.

1. **Set compensation**: HR/Admin sets an employee's Annual CTC effective from a given date (**Payroll → Set compensation**). Compensation is effective-dated, so a raise is a new record, not an overwrite — history is preserved.
2. **Start a payroll run**: HR/Admin picks a month/year (**Payroll → Start a payroll run**), creating a `DRAFT` run.
3. **Process the run**: clicking **Process** generates a Payslip for every active employee from their currently-effective compensation, applying:
   - A flat placeholder statutory deduction rate (v0/v1 — real PF/ESI/TDS calculation is out of scope for now, see `ARCHITECTURE.md` §10).
   - Automatic EMI deduction for any employee with an **ACTIVE** loan (§14), decrementing that loan's remaining balance and auto-closing it once it reaches zero.
   - The run status moves to `PROCESSED`.
4. **View payslips**: HR/Admin can view all payslips for a run (**View payslips**); each employee sees their own historical payslips under **My Payslips**.
5. **Expense reimbursement**: approved expense claims (§14) appear on the Payroll page for HR/Admin to **Mark reimbursed** once paid out, independent of the payroll run itself.

## 14. Expenses, Assets, and Loans

### Expense claims
**Actors:** employee (submits), manager or HR/Admin (approves), HR/Admin (marks reimbursed).

1. Employee submits a claim under **My Expenses**: amount, category, date, note.
2. Routes to **Approvals** ("Expense claims") using the same manager-chain pattern.
3. On approval, the claim shows `APPROVED` and appears on the **Payroll** page.
4. HR/Admin clicks **Mark reimbursed** once the employee has actually been paid out (e.g. via the next salary cycle or a separate payment).

### Assets
**Actors:** HR/Admin manage the inventory; every employee sees what's assigned to them.

1. HR/Admin adds a company asset (**Assets → New asset**): name, type, serial/tag.
2. HR/Admin assigns an asset to an employee via a selector; the asset shows as assigned with a **Return** action.
3. Returning an asset unassigns it (back into inventory) or HR can retire it entirely.
4. Employees see everything currently assigned to them under **My Assets**.

### Loans & advances
**Actors:** employee (requests), manager or HR/Admin (approves).

1. Employee requests a loan under **My Loans**: amount and EMI term (number of months).
2. Routes to **Approvals** ("Loan requests").
3. On approval, the loan becomes `ACTIVE` with a computed monthly EMI and a `remainingAmount` tracker.
4. From then on, every processed payroll run (§13) automatically deducts that month's EMI from the employee's payslip and reduces `remainingAmount`, until it hits zero and the loan auto-closes.

## 15. Reports

**Actor:** HR/Admin (requires `audit:read`/relevant `*:manage` visibility — reports are read-only aggregations, no write actions).

Available under **Reports**:
- **Headcount**: active employee counts by status and by department.
- **Attrition**: exits by month, driven by employees' exit dates (§5).
- **Leave Liability**: remaining vs. used leave days per employee per leave type — useful for understanding accrued liability.
- **Payroll Cost**: gross and net pay totals per processed payroll run.

## 16. Automation rules

**Actor:** HR/Admin.

1. Under **Automation**, HR/Admin creates a rule: pick a **trigger** (`EMPLOYEE_ONBOARDED`, `LEAVE_APPROVED`, or `TIMESHEET_APPROVED`) and an **action** (`CREATE_ANNOUNCEMENT` with templated text, or `ASSIGN_ONBOARDING_TASK` with a task name).
2. From then on, whenever that trigger fires elsewhere in the app (e.g. a leave request gets approved), the action runs automatically and inline.
3. This is best-effort: if a rule fails for any reason, it never blocks or breaks the original action (e.g. the leave approval still succeeds even if the automation itself errors).

**Example:** "When an employee is onboarded, assign them the task 'Meet your team lead'" — every new hire, whether added directly or hired via Recruitment, automatically gets that extra checklist item with zero manual HR effort.

## 17. Help Desk, Announcements, HR Guide

### Help Desk
**Actors:** any employee (raises a ticket), HR/Admin (triages).

1. Employee raises a ticket under **Help Desk**: subject, category, description.
2. HR/Admin sees all tickets, can assign one to a specific HR staffer, change status (Open → In Progress → Resolved), and respond.
3. Employee tracks their own ticket's status from the same page.

### Announcements
**Actors:** HR/Admin (publish), everyone (read).

1. HR/Admin publishes an announcement (title + body) under **Announcements**.
2. It appears on everyone's Home dashboard (latest 3) and the full **Announcements** page.
3. Announcements can also be auto-created by automation rules (§16).

### HR Guide
**Actors:** HR/Admin (author), everyone (read).

1. HR/Admin writes policy articles under **HR Guide** (e.g. "Leave Policy," "Code of Conduct").
2. Any employee can browse and read articles — a self-serve reference so HR isn't repeatedly answering the same policy questions.

## 18. Security (2FA & audit log)

**Actor:** every user for their own 2FA; HR/Admin for the audit log.

1. **Two-factor authentication** (**Settings → Security**): any user can enable TOTP 2FA — the page shows a QR code to scan with an authenticator app, then confirms with a one-time code. Once enabled, every future login requires that code (see §2). Users can disable it the same way.
2. **Audit log** (**Settings → Security**, Admin/HR only): a read-only trail of sensitive mutations — organization setting changes, role creation/assignment, compensation changes, and payroll processing — each entry showing who did what and when.

---

## Typical week in the life of the app

- **Monday–Friday**: employees check in/out (§7), log timesheets (§9), raise leave/expense/loan requests as needed (§8, §14).
- **Ongoing**: managers/HR clear the **Approvals** queue (§ intro) as requests come in.
- **Monthly**: HR/Admin starts and processes the payroll run (§13), which folds in approved expenses and active loan EMIs automatically.
- **Periodically**: HR/Admin opens a performance review cycle (§11), posts announcements (§17), and checks Reports (§15) for headcount/attrition/leave-liability/payroll-cost trends.
- **As needed**: HR runs the full recruitment pipeline (§12) from job posting to hire, and manages the company asset inventory (§14) as equipment is issued/returned.
