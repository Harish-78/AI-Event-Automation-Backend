import nodemailer from "nodemailer";

const mockSendMail = jest.fn();
jest.mock("nodemailer", () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: mockSendMail,
    }),
}));

import * as emailService from "../email.service";

describe("Email Service", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("sendVerificationEmail", () => {
        it("should send email successfully", async () => {
            mockSendMail.mockResolvedValueOnce({});
            await emailService.sendVerificationEmail("test@example.com", "Test", "http://url");
            expect(mockSendMail).toHaveBeenCalled();
        });
    });
});
