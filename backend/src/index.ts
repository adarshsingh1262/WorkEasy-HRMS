import "dotenv/config";
import "express-async-errors";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import announcementsRoutes from "./modules/announcements/announcements.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import auditRoutes from "./modules/audit/audit.routes";
import authRoutes from "./modules/auth/auth.routes";
import automationRulesRoutes from "./modules/automationRules/automationRules.routes";
import compensationRoutes from "./modules/compensation/compensation.routes";
import departmentsRoutes from "./modules/departments/departments.routes";
import employeesRoutes from "./modules/employees/employees.routes";
import goalsRoutes from "./modules/goals/goals.routes";
import helpdeskRoutes from "./modules/helpdesk/helpdesk.routes";
import hrGuideRoutes from "./modules/hrGuide/hrGuide.routes";
import leaveRequestsRoutes from "./modules/leaveRequests/leaveRequests.routes";
import leaveTypesRoutes from "./modules/leaveTypes/leaveTypes.routes";
import onboardingRoutes from "./modules/onboarding/onboarding.routes";
import organizationsRoutes from "./modules/organizations/organizations.routes";
import payrollRoutes from "./modules/payroll/payroll.routes";
import performanceRoutes from "./modules/performance/performance.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import rolesRoutes from "./modules/roles/roles.routes";
import shiftsRoutes from "./modules/shifts/shifts.routes";
import timesheetsRoutes from "./modules/timesheets/timesheets.routes";
import { seedPermissions } from "./utils/seedPermissions";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationsRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave-types", leaveTypesRoutes);
app.use("/api/leave-requests", leaveRequestsRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/shifts", shiftsRoutes);
app.use("/api/timesheets", timesheetsRoutes);
app.use("/api/compensation", compensationRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/helpdesk", helpdeskRoutes);
app.use("/api/automation-rules", automationRulesRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/hr-guide", hrGuideRoutes);
app.use("/api/reports", reportsRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
seedPermissions()
  .then(() => {
    app.listen(port, () => {
      console.log(`WorkEasy360 API listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to seed permission catalog", err);
    process.exit(1);
  });
