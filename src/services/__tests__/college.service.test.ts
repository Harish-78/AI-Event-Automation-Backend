import * as collegeService from "../college.service";
import sql from "../../config/db.config";

jest.mock("../../config/db.config", () => {
    const mockSql = jest.fn() as any;
    mockSql.join = jest.fn((chunks, sep) => {
        return chunks.join(sep);
    });
    return mockSql;
});

describe("College Service", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("createCollege", () => {
        it("should create a college successfully", async () => {
            const data = { name: "Test College", city: "Test City" };
            const collegeRow = { id: "1", ...data };

            (sql as any).mockReturnValueOnce([collegeRow]);

            const result = await collegeService.createCollege(data);

            expect(result.name).toBe(data.name);
            expect(result.id).toBe("1");
        });

        it("should throw error if insert fails", async () => {
            (sql as any).mockReturnValueOnce([]);

            await expect(collegeService.createCollege({ name: "Fail" }))
                .rejects.toThrow("Insert failed");
        });
    });

    describe("getCollegeById", () => {
        it("should return college if found", async () => {
            const collegeRow = { id: "1", name: "Test College" };
            (sql as any).mockReturnValueOnce([collegeRow]);

            const result = await collegeService.getCollegeById("1");

            expect(result?.id).toBe("1");
        });

        it("should return null if not found", async () => {
            (sql as any).mockReturnValueOnce([]);

            const result = await collegeService.getCollegeById("999");

            expect(result).toBeNull();
        });
    });
});
