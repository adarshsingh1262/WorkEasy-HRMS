import "dotenv/config";
import "express-async-errors";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import announcementsRoutes from "./modules/announcements/announcements.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import authRoutes from "./modules/auth/auth.routes";
import departmentsRoutes from "./modules/departments/departments.routes";
import employeesRoutes from "./modules/employees/employees.routes";
import leaveRequestsRoutes from "./modules/leaveRequests/leaveRequests.routes";
import leaveTypesRoutes from "./modules/leaveTypes/leaveTypes.routes";
import organizationsRoutes from "./modules/organizations/organizations.routes";
import rolesRoutes from "./modules/roles/roles.routes";
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
