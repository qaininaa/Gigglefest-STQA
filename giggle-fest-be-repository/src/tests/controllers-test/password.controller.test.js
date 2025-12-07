import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the password service
const mockPasswordService = {
  initPasswordReset: jest.fn(),
  generateAndSendOTP: jest.fn(),
  verifyOTP: jest.fn(),
  resetPassword: jest.fn(),
};

jest.unstable_mockModule(
  "../../services/password.service.js",
  () => mockPasswordService
);

// Mock response utilities
const mockSuccessResponse = jest.fn();
const mockErrorResponse = jest.fn();

jest.unstable_mockModule("../../utils/response.js", () => ({
  successResponse: mockSuccessResponse,
  errorResponse: mockErrorResponse,
}));

const { initPasswordReset, generateOTP, verifyOTP, resetPassword } =
  await import("../../controllers/password.controller.js");

describe("Password Controller", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("initPasswordReset", () => {
    it("should initiate password reset successfully", async () => {
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      mockPasswordService.initPasswordReset.mockResolvedValue(mockToken);
      mockReq.body = { email: "user@example.com" };

      await initPasswordReset(mockReq, mockRes);

      expect(mockPasswordService.initPasswordReset).toHaveBeenCalledWith(
        "user@example.com"
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        { token: mockToken },
        "Password reset initiated. Please check your email for next steps."
      );
    });

    it("should handle error when initiating password reset fails", async () => {
      mockPasswordService.initPasswordReset.mockRejectedValue(
        new Error("User not found")
      );
      mockReq.body = { email: "nonexistent@example.com" };

      await initPasswordReset(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "User not found",
        400
      );
    });

    it("should extract email from request body", async () => {
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      mockPasswordService.initPasswordReset.mockResolvedValue(mockToken);
      mockReq.body = { email: "test@example.com" };

      await initPasswordReset(mockReq, mockRes);

      expect(mockPasswordService.initPasswordReset).toHaveBeenCalledWith(
        "test@example.com"
      );
    });

    it("should return token in response data", async () => {
      const mockToken = "test-token-123";
      mockPasswordService.initPasswordReset.mockResolvedValue(mockToken);
      mockReq.body = { email: "user@example.com" };

      await initPasswordReset(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        { token: mockToken },
        expect.any(String)
      );
    });

    it("should return 400 status on error", async () => {
      mockPasswordService.initPasswordReset.mockRejectedValue(
        new Error("Invalid email format")
      );
      mockReq.body = { email: "invalid-email" };

      await initPasswordReset(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Invalid email format",
        400
      );
    });

    it("should handle validation errors", async () => {
      mockPasswordService.initPasswordReset.mockRejectedValue(
        new Error("Email is required")
      );
      mockReq.body = {};

      await initPasswordReset(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Email is required",
        400
      );
    });

    it("should not require authentication", async () => {
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      mockPasswordService.initPasswordReset.mockResolvedValue(mockToken);
      mockReq.body = { email: "user@example.com" };
      // No req.user set

      await initPasswordReset(mockReq, mockRes);

      expect(mockPasswordService.initPasswordReset).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalled();
    });
  });

  describe("generateOTP", () => {
    it("should generate and send OTP successfully", async () => {
      mockPasswordService.generateAndSendOTP.mockResolvedValue();
      mockReq.body = { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" };

      await generateOTP(mockReq, mockRes);

      expect(mockPasswordService.generateAndSendOTP).toHaveBeenCalledWith(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "OTP has been sent to your email"
      );
    });

    it("should handle error when generating OTP fails", async () => {
      mockPasswordService.generateAndSendOTP.mockRejectedValue(
        new Error("Invalid or expired token")
      );
      mockReq.body = { token: "invalid-token" };

      await generateOTP(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Invalid or expired token",
        400
      );
    });

    it("should extract token from request body", async () => {
      mockPasswordService.generateAndSendOTP.mockResolvedValue();
      mockReq.body = { token: "test-token-123" };

      await generateOTP(mockReq, mockRes);

      expect(mockPasswordService.generateAndSendOTP).toHaveBeenCalledWith(
        "test-token-123"
      );
    });

    it("should return null data on success", async () => {
      mockPasswordService.generateAndSendOTP.mockResolvedValue();
      mockReq.body = { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" };

      await generateOTP(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "OTP has been sent to your email"
      );
    });

    it("should return 400 status on error", async () => {
      mockPasswordService.generateAndSendOTP.mockRejectedValue(
        new Error("Token is required")
      );
      mockReq.body = {};

      await generateOTP(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Token is required",
        400
      );
    });

    it("should handle email sending errors", async () => {
      mockPasswordService.generateAndSendOTP.mockRejectedValue(
        new Error("Failed to send email")
      );
      mockReq.body = { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" };

      await generateOTP(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Failed to send email",
        400
      );
    });

    it("should not require authentication", async () => {
      mockPasswordService.generateAndSendOTP.mockResolvedValue();
      mockReq.body = { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" };
      // No req.user set

      await generateOTP(mockReq, mockRes);

      expect(mockPasswordService.generateAndSendOTP).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalled();
    });
  });

  describe("verifyOTP", () => {
    it("should verify OTP successfully", async () => {
      mockPasswordService.verifyOTP.mockResolvedValue();
      mockReq.body = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        otp: "123456",
      };

      await verifyOTP(mockReq, mockRes);

      expect(mockPasswordService.verifyOTP).toHaveBeenCalledWith(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        "123456"
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "OTP verified successfully"
      );
    });

    it("should handle error when verifying OTP fails", async () => {
      mockPasswordService.verifyOTP.mockRejectedValue(new Error("Invalid OTP"));
      mockReq.body = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        otp: "000000",
      };

      await verifyOTP(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Invalid OTP",
        400
      );
    });

    it("should extract token and otp from request body", async () => {
      mockPasswordService.verifyOTP.mockResolvedValue();
      mockReq.body = {
        token: "test-token-123",
        otp: "654321",
      };

      await verifyOTP(mockReq, mockRes);

      expect(mockPasswordService.verifyOTP).toHaveBeenCalledWith(
        "test-token-123",
        "654321"
      );
    });

    it("should return null data on success", async () => {
      mockPasswordService.verifyOTP.mockResolvedValue();
      mockReq.body = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        otp: "123456",
      };

      await verifyOTP(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "OTP verified successfully"
      );
    });

    it("should return 400 status on error", async () => {
      mockPasswordService.verifyOTP.mockRejectedValue(new Error("OTP expired"));
      mockReq.body = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        otp: "123456",
      };

      await verifyOTP(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "OTP expired",
        400
      );
    });

    it("should handle validation errors", async () => {
      mockPasswordService.verifyOTP.mockRejectedValue(
        new Error("Token and OTP are required")
      );
      mockReq.body = {};

      await verifyOTP(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Token and OTP are required",
        400
      );
    });

    it("should handle incorrect OTP format", async () => {
      mockPasswordService.verifyOTP.mockRejectedValue(
        new Error("OTP must be 6 digits")
      );
      mockReq.body = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        otp: "12",
      };

      await verifyOTP(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "OTP must be 6 digits",
        400
      );
    });

    it("should not require authentication", async () => {
      mockPasswordService.verifyOTP.mockResolvedValue();
      mockReq.body = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        otp: "123456",
      };
      // No req.user set

      await verifyOTP(mockReq, mockRes);

      expect(mockPasswordService.verifyOTP).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      mockPasswordService.resetPassword.mockResolvedValue();
      mockReq.body = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        otp: "123456",
        password: "newSecurePassword123!",
      };

      await resetPassword(mockReq, mockRes);

      expect(mockPasswordService.resetPassword).toHaveBeenCalledWith(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        "123456",
        "newSecurePassword123!"
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Password has been reset successfully"
      );
    });

    it("should handle error when resetting password fails", async () => {
      mockPasswordService.resetPassword.mockRejectedValue(
        new Error("Invalid OTP")
      );
      mockReq.body = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        otp: "000000",
        password: "newPassword123!",
      };

      await resetPassword(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Invalid OTP",
        400
      );
    });

    it("should extract token, otp, and password from request body", async () => {
      mockPasswordService.resetPassword.mockResolvedValue();
      mockReq.body = {
        token: "test-token-123",
        otp: "654321",
        password: "myNewPassword456!",
      };

      await resetPassword(mockReq, mockRes);

      expect(mockPasswordService.resetPassword).toHaveBeenCalledWith(
        "test-token-123",
        "654321",
        "myNewPassword456!"
      );
    });

    it("should return null data on success", async () => {
      mockPasswordService.resetPassword.mockResolvedValue();
      mockReq.body = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        otp: "123456",
        password: "newPassword123!",
      };

      await resetPassword(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Password has been reset successfully"
      );
    });

    it("should return 400 status on error", async () => {
      mockPasswordService.resetPassword.mockRejectedValue(
        new Error("Password too weak")
      );
      mockReq.body = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        otp: "123456",
        password: "123",
      };

      await resetPassword(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Password too weak",
        400
      );
    });

    it("should handle validation errors", async () => {
      mockPasswordService.resetPassword.mockRejectedValue(
        new Error("All fields are required")
      );
      mockReq.body = {};

      await resetPassword(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "All fields are required",
        400
      );
    });

    it("should handle expired OTP error", async () => {
      mockPasswordService.resetPassword.mockRejectedValue(
        new Error("OTP has expired")
      );
      mockReq.body = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        otp: "123456",
        password: "newPassword123!",
      };

      await resetPassword(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "OTP has expired",
        400
      );
    });

    it("should handle invalid token error", async () => {
      mockPasswordService.resetPassword.mockRejectedValue(
        new Error("Invalid or expired token")
      );
      mockReq.body = {
        token: "invalid-token",
        otp: "123456",
        password: "newPassword123!",
      };

      await resetPassword(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Invalid or expired token",
        400
      );
    });

    it("should not require authentication", async () => {
      mockPasswordService.resetPassword.mockResolvedValue();
      mockReq.body = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        otp: "123456",
        password: "newPassword123!",
      };
      // No req.user set

      await resetPassword(mockReq, mockRes);

      expect(mockPasswordService.resetPassword).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalled();
    });
  });
});
