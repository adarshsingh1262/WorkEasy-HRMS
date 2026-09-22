import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  sub: string; // userId
  organizationId: string;
  employeeId: string | null;
  roles: string[];
  permissions: string[];
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string };
}

// Short-lived token issued after password check when 2FA is enabled,
// exchanged for real tokens via /auth/2fa/login-verify.
export function signMfaToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: "mfa" }, ACCESS_SECRET, { expiresIn: "5m" });
}

export function verifyMfaToken(token: string): { sub: string } {
  const payload = jwt.verify(token, ACCESS_SECRET) as { sub: string; purpose?: string };
  if (payload.purpose !== "mfa") {
    throw new Error("Invalid token purpose");
  }
  return payload;
}
