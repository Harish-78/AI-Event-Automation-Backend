import * as departmentService from "../department.service";
import sql from "../../config/db.config";
import { describe } from "node:test";

describe("Department Service", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getAllDepartments", () => {
        it("should return departments and total count", async () => {
            // Correcting the call sequence
            // 1. sql`is_deleted = FALSE`
            (sql as any).mockResolvedValueOnce([]);
            // 2. sql`college_id = ${college_id}`
            (sql as any).mockResolvedValueOnce([]);
            // 3. sql` AND `
            (sql as any).mockResolvedValueOnce([]);
            // 4. sql`WHERE ...`
            (sql as any).mockResolvedValueOnce([]);
            // 5. sql`SELECT COUNT(*) ...`
            (sql as any).mockResolvedValueOnce([{ count: "2" }]);
            // 6. sql`SELECT * FROM departments ...`
            (sql as any).mockResolvedValueOnce([{ id: "1" }, { id: "2" }]);

            const result = await departmentService.getAllDepartments({ college_id: "1" });

            expect(result.total).toBe(2);
            expect(result.departments.length).toBe(2);
        });
    });
});
