import * as registrationService from "../registration.service";
import sql from "../../config/db.config";

jest.mock("../../config/db.config", () => {
    const mockSql = jest.fn() as any;
    mockSql.begin = jest.fn(async (cb) => cb(mockSql));
    return mockSql;
});

describe("Registration Service", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("createRegistration", () => {
        const data = { event_id: "e1", user_id: "u1" };
        const eventData = { 
            id: "e1", 
            registration_deadline: new Date(Date.now() + 100000).toISOString(), 
            max_participants: 10,
            status: 'published',
            is_deleted: false
        };

        it("should create a registration successfully", async () => {
            (sql as any).mockResolvedValueOnce([eventData]); // event lookup
            (sql as any).mockResolvedValueOnce([{ count: "5" }]); // current count
            (sql as any).mockResolvedValueOnce([]); // existing reg check
            const row = { id: "r1", ...data, status: 'registered', ticket_number: 'TKT-123' };
            (sql as any).mockResolvedValueOnce([row]); // insert

            const result = await registrationService.createRegistration(data);

            expect(result.event_id).toBe("e1");
            expect(result.ticket_number).toBeDefined();
        });

        it("should throw error if event not found or deleted", async () => {
            (sql as any).mockResolvedValueOnce([]); // event lookup returns nothing
            await expect(registrationService.createRegistration(data)).rejects.toThrow("Event not found");
        });

        it("should throw error if event is not published", async () => {
            (sql as any).mockResolvedValueOnce([{ ...eventData, status: 'draft' }]);
            await expect(registrationService.createRegistration(data)).rejects.toThrow("only allowed for published events");
        });

        it("should throw error if deadline has passed", async () => {
            (sql as any).mockResolvedValueOnce([{ ...eventData, registration_deadline: new Date(Date.now() - 10000).toISOString() }]);
            await expect(registrationService.createRegistration(data)).rejects.toThrow("deadline has passed");
        });

        it("should throw error if event is full", async () => {
            (sql as any).mockResolvedValueOnce([eventData]);
            (sql as any).mockResolvedValueOnce([{ count: "10" }]); // full
            await expect(registrationService.createRegistration(data)).rejects.toThrow("Event is already full");
        });

        it("should throw error if user already registered", async () => {
            (sql as any).mockResolvedValueOnce([eventData]);
            (sql as any).mockResolvedValueOnce([{ count: "5" }]);
            (sql as any).mockResolvedValueOnce([{ id: "existing" }]);
            await expect(registrationService.createRegistration(data)).rejects.toThrow("already registered");
        });
    });

    describe("getUserRegistrations", () => {
        it("should return user registrations", async () => {
            const rows = [{ id: "r1", event_title: "Event 1" }];
            (sql as any).mockResolvedValueOnce(rows);

            const result = await registrationService.getUserRegistrations("u1");

            expect(result.length).toBe(1);
            expect((result as any)[0]?.event_title).toBe("Event 1");
        });
    });
});
