import * as registrationService from "../registration.service";
import sql from "../../config/db.config";

jest.mock("../../config/db.config", () => {
    return jest.fn() as any;
});

describe("Registration Service", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("createRegistration", () => {
        it("should create a registration successfully", async () => {
            const data = { event_id: "e1", user_id: "u1" };
            const row = { id: "r1", ...data, status: 'registered', ticket_number: 'TKT-123' };
            (sql as any).mockResolvedValueOnce([row]);

            const result = await registrationService.createRegistration(data);

            expect(result.event_id).toBe("e1");
        });
    });

    describe("getUserRegistrations", () => {
        it("should return user registrations", async () => {
            const rows = [{ id: "r1", event_title: "Event 1" }] as any;
            (sql as any).mockResolvedValueOnce(rows);

            const result = await registrationService.getUserRegistrations("u1") as any;

            expect(result.length).toBe(1);
            expect(result[0].event_title).toBe("Event 1");
        });
    });
});
