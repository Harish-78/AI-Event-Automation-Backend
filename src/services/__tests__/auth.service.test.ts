import * as authService from "../auth.service";
import sql from "../../config/db.config";
import { sendVerificationEmail } from "../email.service";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("../../config/db.config", () => {
    const mockSql = jest.fn() as any;
    mockSql.join = jest.fn();
    return mockSql;
});

jest.mock("../email.service", () => ({
    sendVerificationEmail: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
    sign: jest.fn(),
}));

describe("Auth Service", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("register", () => {
        it("should register a new user successfully", async () => {
            const email = "test@example.com";
            const password = "password123";
            const name = "Test User";
            const userRow = {
                id: "1",
                email,
                name,
                role: "user",
                email_verified_at: null,
                created_at: new Date(),
                updated_at: new Date(),
            };

            (sql as any).mockResolvedValueOnce([]); // No existing user
            (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
            (sql as any).mockResolvedValueOnce([userRow]); // Insert user result
            (sql as any).mockResolvedValueOnce([]); // Insert verification token result
            (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

            const result = await authService.register(email, password, name);

            expect(result.user.email).toBe(email);
            expect(result.message).toContain("Registration successful");
        });

        it("should throw error if email already registered", async () => {
            (sql as any).mockResolvedValueOnce([{ id: "1" }]); // Existing user
            await expect(authService.register("test@example.com", "pass", "Name"))
                .rejects.toThrow("Email already registered");
        });
    });

    describe("login", () => {
        const email = "test@example.com";
        const password = "password123";
        const userRow = {
            id: "1",
            email,
            password_hash: "hashedPassword",
            name: "Test User",
            email_verified_at: new Date(),
            role: "user",
        };

        it("should login successfully", async () => {
            (sql as any).mockResolvedValueOnce([userRow]);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue("fakeToken");

            const result = await authService.login(email, password);

            expect(result.accessToken).toBe("fakeToken");
            expect(result.user.id).toBe("1");
        });

        it("should throw error if user not found", async () => {
            (sql as any).mockResolvedValueOnce([]);
            await expect(authService.login(email, password)).rejects.toThrow("Invalid email or password");
        });

        it("should throw error if password hash is missing (Google user)", async () => {
            const googleUser = { ...userRow, password_hash: null };
            (sql as any).mockResolvedValueOnce([googleUser]);
            await expect(authService.login(email, password)).rejects.toThrow("This account uses Google login");
        });

        it("should throw error if email not verified", async () => {
            const unverifiedUser = { ...userRow, email_verified_at: null };
            (sql as any).mockResolvedValueOnce([unverifiedUser]);
            await expect(authService.login(email, password)).rejects.toThrow("Please verify your email");
        });

        it("should throw error for invalid password", async () => {
            (sql as any).mockResolvedValueOnce([userRow]);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await expect(authService.login(email, password)).rejects.toThrow("Invalid email or password");
        });
    });

    describe("verifyEmail", () => {
        it("should verify email successfully", async () => {
            const token = "valid-token";
            const tokenData = { user_id: "1", expires_at: new Date(Date.now() + 10000).toISOString() };
            const userRow = { id: "1", email: "test@example.com", role: "user" };

            (sql as any).mockResolvedValueOnce([tokenData]); // token lookup
            (sql as any).mockResolvedValueOnce([]); // update user
            (sql as any).mockResolvedValueOnce([]); // delete token
            (sql as any).mockResolvedValueOnce([userRow]); // fetch user
            (jwt.sign as jest.Mock).mockReturnValue("fakeToken");

            const result = await authService.verifyEmail(token);
            expect(result.accessToken).toBe("fakeToken");
            expect(result.user.id).toBe("1");
        });

        it("should throw error if token is missing", async () => {
            (sql as any).mockResolvedValueOnce([]);
            await expect(authService.verifyEmail("invalid")).rejects.toThrow("Invalid or expired verification token");
        });

        it("should throw error if token is expired", async () => {
            const token = "expired-token";
            const tokenData = { user_id: "1", expires_at: new Date(Date.now() - 10000).toISOString() };
            (sql as any).mockResolvedValueOnce([tokenData]);
            (sql as any).mockResolvedValueOnce([]); // delete token update

            await expect(authService.verifyEmail(token)).rejects.toThrow("Verification token has expired");
        });
    });

    describe("resendVerificationEmail", () => {
        it("should resend verification email successfully", async () => {
            const email = "test@example.com";
            const userRow = { id: "1", email, name: "Test", email_verified_at: null };

            (sql as any).mockResolvedValueOnce([userRow]);
            (sql as any).mockResolvedValueOnce([]); // delete old tokens
            (sql as any).mockResolvedValueOnce([]); // insert new token
            (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

            const result = await authService.resendVerificationEmail(email);
            expect(result.message).toContain("Verification email sent");
        });

        it("should throw error if user already verified", async () => {
            const userRow = { id: "1", email: "test@example.com", email_verified_at: new Date() };
            (sql as any).mockResolvedValueOnce([userRow]);
            await expect(authService.resendVerificationEmail("test@example.com")).rejects.toThrow("Email is already verified");
        });
    });
});
