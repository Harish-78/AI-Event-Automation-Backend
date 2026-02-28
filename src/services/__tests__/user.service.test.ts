import * as userService from "../user.service";
import sql from "../../config/db.config";
import bcrypt from "bcryptjs";

// We rely on the global mock in jest.setup.ts for 'sql'
// In jest.setup.ts, sql is a jest.fn() that returns a promise.

jest.mock("../auth.service", () => ({
    toUser: jest.fn((row) => row),
}));

jest.mock("bcryptjs", () => ({
    hash: jest.fn().mockResolvedValue("hashed_password"),
}));

describe("User Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createUser", () => {
        it("should create user successfully", async () => {
            const userData = {
                email: "new@example.com",
                password: "password123",
                name: "New User",
                role: "user",
            };

            const mockUserRow = { id: "1", ...userData };

            // 1. Check existing: SELECT id FROM users WHERE email = ...
            (sql as any).mockResolvedValueOnce([]); 
            // 2. Insert user: INSERT INTO users ...
            (sql as any).mockResolvedValueOnce([mockUserRow]);

            const result = await userService.createUser(userData);

            expect(result.email).toBe(userData.email);
            expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
        });

        it("should throw error if email exists", async () => {
            const userData = {
                email: "existing@example.com",
                name: "Existing User",
            };

            (sql as any).mockResolvedValueOnce([{ id: "existing-id" }]);

            await expect(userService.createUser(userData as any)).rejects.toThrow("Email already registered");
        });
    });

    describe("updateUser", () => {
        it("should update user successfully", async () => {
            const updateData = { userId: "1", name: "Updated Name" };
            const row = { id: "1", name: "Updated Name", email: "test@example.com" };

            // 1. sql`NOW()` call inside updateUser
            (sql as any).mockReturnValueOnce("NOW_FRAGMENT");
            // 2. sql(updateData, columns) call inside updateUser
            (sql as any).mockReturnValueOnce("UPDATE_SET_CLAUSE");
            // 3. Final UPDATE query call
            (sql as any).mockResolvedValueOnce([row]);

            const result = await userService.updateUser(updateData);

            expect(result.user.name).toBe("Updated Name");
            expect(result.message).toBe("User updated successfully");
        });
    });

    describe("getAllUsers", () => {
        it("should return users", async () => {
            const rows = [{ id: "1", name: "User 1" }, { id: "2", name: "User 2" }];
            (sql as any).mockResolvedValueOnce(rows);

            const result = await userService.getAllUsers();

            expect(result.length).toBe(2);
        });
    });

    describe("deleteUserById", () => {
        it("should update is_deleted flag", async () => {
            (sql as any).mockResolvedValueOnce([]);
            await userService.deleteUserById("user-1");
            expect(sql as any).toHaveBeenCalled();
        });
    });
});
