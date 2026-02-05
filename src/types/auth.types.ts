export interface User {
  id: string;
  email: string;
  name: string | null;
  google_id: string | null;
  email_verified_at: string | null;
  role: string;
  college_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  name: string | null;
  google_id: string | null;
  email_verified_at: string | null;
  role: string;
  college_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface GoogleProfile {
  id: string;
  emails?: { value: string; verified?: boolean }[];
  displayName?: string;
  name?: { givenName?: string; familyName?: string };
}

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string | null;
      google_id: string | null;
      email_verified_at: string | null;
      role: string;
      college_id: string | null;
      created_at: string;
      updated_at: string;
    }
  }
}
