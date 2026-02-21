import * as eventService from "../event.service";
import sql from "../../config/db.config";

jest.mock("../../config/db.config", () => {
    const mockSql = jest.fn() as any;
    mockSql.join = jest.fn((chunks, sep) => chunks.join(sep));
    return mockSql;
});

describe("Event Service", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("createEvent", () => {
        it("should create an event successfully", async () => {
            const data: any = {
                title: "Workshop",
                college_id: "1",
                category: "Tech",
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
                created_by: "u1"
            };
            const row = { id: "e1", ...data };
            (sql as any).mockResolvedValueOnce([row]);

            const result = await eventService.createEvent(data);

            expect(result.title).toBe("Workshop");
        });
    });
});
