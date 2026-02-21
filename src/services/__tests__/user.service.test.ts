import * as userService from "../user.service";
import sql from "../../config/db.config";

jest.mock("../auth.service", () => ({
    toUser: jest.fn((row) => row),
}));

describe("User Service", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("updateUser", () => {
        it("should update user successfully", async () => {
            const data = { userId: "1", name: "New Name" };
            const row = { id: "1", name: "New Name", email: "test@example.com" };

            // 1. sql`NOW()`
            (sql as any).mockReturnValueOnce("NOW()");
            // 2. sql(updateData, columns)
            (sql as any).mockReturnValueOnce("UPDATE_FRAGMENT");
            // 3. await sql`UPDATE ...`
            (sql as any).mockResolvedValueOnce([row]);

            const result = await userService.updateUser(data);

            expect(result.user.name).toBe("New Name");
            expect(result.message).toBe("User updated successfully");
        });
    });

    describe("getAllUsers", () => {
        it("should return all users", async () => {
            const rows = [{ id: "1", email: "a@a.com" }, { id: "2", email: "b@b.com" }];
            (sql as any).mockResolvedValueOnce(rows);

            const result = await userService.getAllUsers();

            expect(result.length).toBe(2);
        });
    });
});
