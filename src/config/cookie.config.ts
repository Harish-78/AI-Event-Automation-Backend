const COOKIE_NAME = "token";
const MAX_AGE_DAYS = 7;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;  // 7 days in milliseconds

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE !== "false",
  sameSite: "lax" as const,
  maxAge: MAX_AGE_MS,
  path: "/",
};

export function setTokenCookie(res: import("express").Response, token: string): void {
  res.cookie(COOKIE_NAME, token, cookieOptions);
}

export function clearTokenCookie(res: import("express").Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true, secure: cookieOptions.secure, sameSite: "lax" });
}

export { COOKIE_NAME };
