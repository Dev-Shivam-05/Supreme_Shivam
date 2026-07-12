import { type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "./auth";

/** True when the request carries a valid admin session cookie. */
export function isAdmin(req: NextRequest) {
  return verifyToken(req.cookies.get(ADMIN_COOKIE)?.value);
}
