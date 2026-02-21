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
                email_verified_at: new Date(),
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
    });

    describe("login", () => {
        it("should login successfully", async () => {
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

            (sql as any).mockResolvedValueOnce([userRow]);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue("fakeToken");

            const result = await authService.login(email, password);

            expect(result.accessToken).toBe("fakeToken");
        });
    });
});
