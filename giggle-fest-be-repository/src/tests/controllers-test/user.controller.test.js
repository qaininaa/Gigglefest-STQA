import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the user service
const mockUserService = {
  register: jest.fn(),
  resendVerification: jest.fn(),
  login: jest.fn(),
  updateUserById: jest.fn(),
  deleteUserById: jest.fn(),
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  verifyEmail: jest.fn(),
};

jest.unstable_mockModule(
  "../../services/user.service.js",
  () => mockUserService
);

// Mock response utilities
const mockSuccessResponse = jest.fn();
const mockErrorResponse = jest.fn();

jest.unstable_mockModule("../../utils/response.js", () => ({
  successResponse: mockSuccessResponse,
  errorResponse: mockErrorResponse,
}));

const {
  registerUser,
  resendVerificationEmail,
  loginUser,
  updateUserDetails,
  deleteUserDetails,
  getAllUserDetails,
  getUserDetails,
  verifyEmail,
} = await import("../../controllers/user.controller.js");

describe("User Controller", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: 1, role: "user" },
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  // Helper functions
  const createMockUser = (overrides = {}) => ({
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    isVerified: true,
    phoneNumber: "1234567890",
    referralCode: "REF123",
    createdAt: new Date("2024-12-06"),
    updatedAt: new Date("2024-12-06"),
    ...overrides,
  });

  const createMockUserWithPassword = (overrides = {}) => ({
    ...createMockUser(),
    password: "hashedPassword",
    resetToken: null,
    resetOTP: null,
    resetOTPExpires: null,
    verificationToken: null,
    ...overrides,
  });

  const createMockPaginatedUsers = () => ({
    users: [
      createMockUser(),
      createMockUser({ id: 2, name: "Jane Doe", email: "jane@example.com" }),
    ],
    metadata: {
      currentPage: 1,
      totalPages: 1,
      totalUsers: 2,
      limit: 10,
    },
  });

  describe("registerUser", () => {
    it("should register user successfully", async () => {
      const mockResult = {
        user: createMockUser(),
        token: "verification-token",
      };
      mockUserService.register.mockResolvedValue(mockResult);
      mockReq.body = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      await registerUser(mockReq, mockRes);

      expect(mockUserService.register).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockResult,
        "User registered successfully",
        201
      );
    });

    it("should handle error when registration fails", async () => {
      mockUserService.register.mockRejectedValue(
        new Error("Email already exists")
      );
      mockReq.body = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      await registerUser(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Email already exists",
        400
      );
    });

    it("should return 201 status code on success", async () => {
      const mockResult = { user: createMockUser() };
      mockUserService.register.mockResolvedValue(mockResult);
      mockReq.body = {
        name: "John",
        email: "john@example.com",
        password: "pass",
      };

      await registerUser(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.any(Object),
        "User registered successfully",
        201
      );
    });

    it("should return 400 status code on error", async () => {
      mockUserService.register.mockRejectedValue(new Error("Validation error"));
      mockReq.body = {};

      await registerUser(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Validation error",
        400
      );
    });
  });

  describe("resendVerificationEmail", () => {
    it("should resend verification email successfully", async () => {
      const mockResult = { message: "Email sent" };
      mockUserService.resendVerification.mockResolvedValue(mockResult);
      mockReq.body = { email: "john@example.com" };

      await resendVerificationEmail(mockReq, mockRes);

      expect(mockUserService.resendVerification).toHaveBeenCalledWith(
        "john@example.com"
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockResult,
        "Verification email resent successfully"
      );
    });

    it("should handle error when resending fails", async () => {
      mockUserService.resendVerification.mockRejectedValue(
        new Error("User not found")
      );
      mockReq.body = { email: "invalid@example.com" };

      await resendVerificationEmail(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "User not found",
        400
      );
    });

    it("should extract email from request body", async () => {
      mockUserService.resendVerification.mockResolvedValue({});
      mockReq.body = { email: "test@example.com" };

      await resendVerificationEmail(mockReq, mockRes);

      expect(mockUserService.resendVerification).toHaveBeenCalledWith(
        "test@example.com"
      );
    });

    it("should return 400 status code on error", async () => {
      mockUserService.resendVerification.mockRejectedValue(
        new Error("Already verified")
      );
      mockReq.body = { email: "john@example.com" };

      await resendVerificationEmail(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Already verified",
        400
      );
    });
  });

  describe("loginUser", () => {
    it("should login user successfully", async () => {
      const mockResult = {
        user: createMockUser(),
        token: "jwt-token",
      };
      mockUserService.login.mockResolvedValue(mockResult);
      mockReq.body = { email: "john@example.com", password: "password123" };

      await loginUser(mockReq, mockRes);

      expect(mockUserService.login).toHaveBeenCalledWith(
        "john@example.com",
        "password123"
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockResult,
        "Login successful"
      );
    });

    it("should handle error when login fails with invalid credentials", async () => {
      mockUserService.login.mockRejectedValue(new Error("Invalid credentials"));
      mockReq.body = { email: "john@example.com", password: "wrong" };

      await loginUser(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Invalid credentials",
        401
      );
    });

    it("should return 403 when email is not verified", async () => {
      mockUserService.login.mockRejectedValue(
        new Error("Please verify your email first")
      );
      mockReq.body = { email: "john@example.com", password: "password123" };

      await loginUser(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Please verify your email first",
        403
      );
    });

    it("should extract email and password from request body", async () => {
      mockUserService.login.mockResolvedValue({ token: "token" });
      mockReq.body = { email: "test@example.com", password: "testpass" };

      await loginUser(mockReq, mockRes);

      expect(mockUserService.login).toHaveBeenCalledWith(
        "test@example.com",
        "testpass"
      );
    });

    it("should return 401 for general login errors", async () => {
      mockUserService.login.mockRejectedValue(new Error("User not found"));
      mockReq.body = { email: "john@example.com", password: "password123" };

      await loginUser(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "User not found",
        401
      );
    });

    it("should return 403 only when error message contains 'verify your email'", async () => {
      mockUserService.login.mockRejectedValue(
        new Error("You must verify your email before logging in")
      );
      mockReq.body = { email: "john@example.com", password: "password123" };

      await loginUser(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "You must verify your email before logging in",
        403
      );
    });
  });

  describe("updateUserDetails", () => {
    it("should update user details successfully when user updates own profile", async () => {
      const mockUpdatedUser = createMockUserWithPassword({
        name: "John Updated",
      });
      mockUserService.updateUserById.mockResolvedValue(mockUpdatedUser);
      mockReq.params = { id: "1" };
      mockReq.user.id = 1;
      mockReq.body = { name: "John Updated" };

      await updateUserDetails(mockReq, mockRes);

      expect(mockUserService.updateUserById).toHaveBeenCalledWith(1, {
        name: "John Updated",
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.not.objectContaining({
          password: expect.anything(),
          resetToken: expect.anything(),
          resetOTP: expect.anything(),
          resetOTPExpires: expect.anything(),
          verificationToken: expect.anything(),
        }),
        "User updated successfully"
      );
    });

    it("should handle error when update fails", async () => {
      mockUserService.updateUserById.mockRejectedValue(
        new Error("Update failed")
      );
      mockReq.params = { id: "1" };
      mockReq.user.id = 1;
      mockReq.body = { name: "Updated" };

      await updateUserDetails(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Update failed",
        400
      );
    });

    it("should return 403 when user tries to update another user's profile", async () => {
      mockReq.params = { id: "2" };
      mockReq.user.id = 1;
      mockReq.body = { name: "Updated" };

      await updateUserDetails(mockReq, mockRes);

      expect(mockUserService.updateUserById).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized - Can only update own profile",
        403
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.params = { id: "5" };
      mockReq.user.id = 1;
      mockReq.body = { name: "Updated" };

      await updateUserDetails(mockReq, mockRes);

      expect(mockUserService.updateUserById).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized - Can only update own profile",
        403
      );
    });

    it("should convert params.id to number using parseInt", async () => {
      const mockUpdatedUser = createMockUserWithPassword();
      mockUserService.updateUserById.mockResolvedValue(mockUpdatedUser);
      mockReq.params = { id: "7" };
      mockReq.user.id = 7;
      mockReq.body = { name: "Updated" };

      await updateUserDetails(mockReq, mockRes);

      expect(mockUserService.updateUserById).toHaveBeenCalledWith(
        7,
        expect.any(Object)
      );
    });

    it("should filter out sensitive fields from response", async () => {
      const mockUpdatedUser = createMockUserWithPassword({
        password: "hashed",
        resetToken: "token123",
        resetOTP: "123456",
        resetOTPExpires: new Date(),
        verificationToken: "verify123",
      });
      mockUserService.updateUserById.mockResolvedValue(mockUpdatedUser);
      mockReq.params = { id: "1" };
      mockReq.user.id = 1;
      mockReq.body = { name: "Updated" };

      await updateUserDetails(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          id: 1,
          name: expect.any(String),
          email: expect.any(String),
        }),
        "User updated successfully"
      );
      const responseData = mockSuccessResponse.mock.calls[0][1];
      expect(responseData.password).toBeUndefined();
      expect(responseData.resetToken).toBeUndefined();
      expect(responseData.resetOTP).toBeUndefined();
      expect(responseData.resetOTPExpires).toBeUndefined();
      expect(responseData.verificationToken).toBeUndefined();
    });

    it("should handle ZodError with custom error message", async () => {
      const zodError = {
        name: "ZodError",
        errors: [
          { message: "Invalid email format" },
          { message: "Name is required" },
        ],
      };
      mockUserService.updateUserById.mockRejectedValue(zodError);
      mockReq.params = { id: "1" };
      mockReq.user.id = 1;
      mockReq.body = { email: "invalid" };

      await updateUserDetails(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Invalid email format, Name is required",
        400
      );
    });

    it("should handle non-ZodError with regular error handling", async () => {
      mockUserService.updateUserById.mockRejectedValue(
        new Error("Database error")
      );
      mockReq.params = { id: "1" };
      mockReq.user.id = 1;
      mockReq.body = { name: "Updated" };

      await updateUserDetails(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });
  });

  describe("deleteUserDetails", () => {
    it("should delete user successfully when user is admin", async () => {
      mockUserService.deleteUserById.mockResolvedValue();
      mockReq.user.role = "admin";
      mockReq.params = { id: "1" };

      await deleteUserDetails(mockReq, mockRes);

      expect(mockUserService.deleteUserById).toHaveBeenCalledWith(1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "User deleted successfully"
      );
    });

    it("should handle error when delete fails", async () => {
      mockUserService.deleteUserById.mockRejectedValue(
        new Error("User not found")
      );
      mockReq.user.role = "admin";
      mockReq.params = { id: "999" };

      await deleteUserDetails(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "User not found",
        400
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.params = { id: "1" };

      await deleteUserDetails(mockReq, mockRes);

      expect(mockUserService.deleteUserById).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.params = { id: "1" };

      await deleteUserDetails(mockReq, mockRes);

      expect(mockUserService.deleteUserById).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should convert params.id to number using parseInt", async () => {
      mockUserService.deleteUserById.mockResolvedValue();
      mockReq.user.role = "admin";
      mockReq.params = { id: "9" };

      await deleteUserDetails(mockReq, mockRes);

      expect(mockUserService.deleteUserById).toHaveBeenCalledWith(9);
    });

    it("should return null data on success", async () => {
      mockUserService.deleteUserById.mockResolvedValue();
      mockReq.user.role = "admin";
      mockReq.params = { id: "1" };

      await deleteUserDetails(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "User deleted successfully"
      );
    });
  });

  describe("getAllUserDetails", () => {
    it("should get all users successfully when user is admin", async () => {
      const mockResult = createMockPaginatedUsers();
      mockUserService.getAllUsers.mockResolvedValue(mockResult);
      mockReq.user.role = "admin";
      mockReq.query = { page: "1", limit: "10", search: "" };

      await getAllUserDetails(mockReq, mockRes);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "",
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        {
          users: mockResult.users,
          metadata: mockResult.metadata,
        },
        "Users retrieved successfully"
      );
    });

    it("should handle error when getting users fails", async () => {
      mockUserService.getAllUsers.mockRejectedValue(
        new Error("Database error")
      );
      mockReq.user.role = "admin";
      mockReq.query = {};

      await getAllUserDetails(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.query = {};

      await getAllUserDetails(mockReq, mockRes);

      expect(mockUserService.getAllUsers).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should use default values when query params are missing", async () => {
      const mockResult = createMockPaginatedUsers();
      mockUserService.getAllUsers.mockResolvedValue(mockResult);
      mockReq.user.role = "admin";
      mockReq.query = {};

      await getAllUserDetails(mockReq, mockRes);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "",
      });
    });

    it("should parse query parameters correctly", async () => {
      const mockResult = createMockPaginatedUsers();
      mockUserService.getAllUsers.mockResolvedValue(mockResult);
      mockReq.user.role = "admin";
      mockReq.query = { page: "2", limit: "20", search: "john" };

      await getAllUserDetails(mockReq, mockRes);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: "john",
      });
    });

    it("should convert page to integer using parseInt", async () => {
      const mockResult = createMockPaginatedUsers();
      mockUserService.getAllUsers.mockResolvedValue(mockResult);
      mockReq.user.role = "admin";
      mockReq.query = { page: "3" };

      await getAllUserDetails(mockReq, mockRes);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3 })
      );
    });

    it("should convert limit to integer using parseInt", async () => {
      const mockResult = createMockPaginatedUsers();
      mockUserService.getAllUsers.mockResolvedValue(mockResult);
      mockReq.user.role = "admin";
      mockReq.query = { limit: "25" };

      await getAllUserDetails(mockReq, mockRes);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 25 })
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.query = {};

      await getAllUserDetails(mockReq, mockRes);

      expect(mockUserService.getAllUsers).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });
  });

  describe("getUserDetails", () => {
    it("should get user by id successfully", async () => {
      const mockUser = createMockUser();
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockReq.params = { id: "1" };

      await getUserDetails(mockReq, mockRes);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockUser,
        "User retrieved successfully"
      );
    });

    it("should handle error when getting user fails", async () => {
      mockUserService.getUserById.mockRejectedValue(
        new Error("Database error")
      );
      mockReq.params = { id: "1" };

      await getUserDetails(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });

    it("should return 404 when user is not found", async () => {
      mockUserService.getUserById.mockResolvedValue(null);
      mockReq.params = { id: "999" };

      await getUserDetails(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "User not found",
        404
      );
    });

    it("should convert params.id to number using parseInt", async () => {
      const mockUser = createMockUser();
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockReq.params = { id: "5" };

      await getUserDetails(mockReq, mockRes);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(5);
    });

    it("should check for null user before returning success", async () => {
      mockUserService.getUserById.mockResolvedValue(null);
      mockReq.params = { id: "1" };

      await getUserDetails(mockReq, mockRes);

      expect(mockSuccessResponse).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "User not found",
        404
      );
    });
  });

  describe("verifyEmail", () => {
    it("should verify email successfully and return HTML response", async () => {
      const mockUser = createMockUser({ isVerified: true });
      mockUserService.verifyEmail.mockResolvedValue(mockUser);
      mockReq.params = { token: "verification-token-123" };
      process.env.FRONTEND_URL = "http://localhost:3000";

      await verifyEmail(mockReq, mockRes);

      expect(mockUserService.verifyEmail).toHaveBeenCalledWith(
        "verification-token-123"
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("Email Verified Successfully!")
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("http://localhost:3000/login")
      );
    });

    it("should handle error when verification fails", async () => {
      mockUserService.verifyEmail.mockRejectedValue(new Error("Invalid token"));
      mockReq.params = { token: "invalid-token" };

      await verifyEmail(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Invalid token",
        400
      );
    });

    it("should extract token from params", async () => {
      const mockUser = createMockUser();
      mockUserService.verifyEmail.mockResolvedValue(mockUser);
      mockReq.params = { token: "test-token-456" };

      await verifyEmail(mockReq, mockRes);

      expect(mockUserService.verifyEmail).toHaveBeenCalledWith(
        "test-token-456"
      );
    });

    it("should include frontend URL in HTML response", async () => {
      const mockUser = createMockUser();
      mockUserService.verifyEmail.mockResolvedValue(mockUser);
      mockReq.params = { token: "token" };
      process.env.FRONTEND_URL = "https://example.com";

      await verifyEmail(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("https://example.com/login")
      );
    });

    it("should send HTML with success icon and styling", async () => {
      const mockUser = createMockUser();
      mockUserService.verifyEmail.mockResolvedValue(mockUser);
      mockReq.params = { token: "token" };

      await verifyEmail(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("<!DOCTYPE html>")
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("<style>")
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("success-icon")
      );
    });

    it("should include login button in HTML response", async () => {
      const mockUser = createMockUser();
      mockUserService.verifyEmail.mockResolvedValue(mockUser);
      mockReq.params = { token: "token" };

      await verifyEmail(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("Go to Login")
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("button")
      );
    });

    it("should return 400 status code on error", async () => {
      mockUserService.verifyEmail.mockRejectedValue(new Error("Token expired"));
      mockReq.params = { token: "expired-token" };

      await verifyEmail(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Token expired",
        400
      );
    });
  });
});
