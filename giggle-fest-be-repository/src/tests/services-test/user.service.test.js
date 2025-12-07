import { jest } from "@jest/globals";

// Mock all dependencies
jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule("crypto", () => ({
  default: {
    randomBytes: jest.fn(),
  },
}));

jest.unstable_mockModule(
  "../../../src/repositories/user.repository.js",
  () => ({
    createAuth: jest.fn(),
    createUser: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    findUserByVerificationToken: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    findAllUsers: jest.fn(),
  })
);

jest.unstable_mockModule("../../../src/utils/token.js", () => ({
  generateToken: jest.fn(),
}));

jest.unstable_mockModule("../../../src/utils/email.service.js", () => ({
  sendVerificationEmail: jest.fn(),
}));

// Import mocked modules
const bcrypt = (await import("bcrypt")).default;
const crypto = (await import("crypto")).default;
const userRepository = await import(
  "../../../src/repositories/user.repository.js"
);
const { generateToken } = await import("../../../src/utils/token.js");
const { sendVerificationEmail } = await import(
  "../../../src/utils/email.service.js"
);

// Import service to test
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  updateUserById,
  deleteUserById,
  getAllUsers,
  getUserById,
} = await import("../../../src/services/user.service.js");

describe("User Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper functions
  const createMockAuth = (overrides = {}) => ({
    id: 1,
    email: "john@example.com",
    password: "hashedPassword123",
    phoneNumber: "081234567890",
    ...overrides,
  });

  const createMockUser = (overrides = {}) => ({
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    password: "hashedPassword123",
    phoneNumber: "081234567890",
    age: 25,
    role: "customer",
    authId: 1,
    verificationToken: null,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  describe("register", () => {
    const userData = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      phoneNumber: "081234567890",
      age: 25,
    };

    test("should register user successfully", async () => {
      const mockAuth = createMockAuth();
      const mockUser = createMockUser({
        verificationToken: "verification-token-123",
        isVerified: false,
      });
      const mockToken = "jwt-token-123";

      userRepository.findUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword123");
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue("verification-token-123"),
      });
      userRepository.createAuth.mockResolvedValue(mockAuth);
      userRepository.createUser.mockResolvedValue(mockUser);
      sendVerificationEmail.mockResolvedValue(undefined);
      generateToken.mockReturnValue(mockToken);

      const result = await register(userData);

      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
        "john@example.com"
      );
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(userRepository.createAuth).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "hashedPassword123",
        phoneNumber: "081234567890",
      });
      expect(userRepository.createUser).toHaveBeenCalledWith({
        ...userData,
        password: "hashedPassword123",
        authId: 1,
        verificationToken: "verification-token-123",
        isVerified: false,
      });
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        "john@example.com",
        "verification-token-123"
      );
      expect(generateToken).toHaveBeenCalledWith(mockUser);
      expect(result.user).not.toHaveProperty("password");
      expect(result.token).toBe(mockToken);
    });

    test("should throw error if email already exists", async () => {
      const existingUser = createMockUser();

      userRepository.findUserByEmail.mockResolvedValue(existingUser);

      await expect(register(userData)).rejects.toThrow("Email already exists");
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.createAuth).not.toHaveBeenCalled();
      expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    test("should remove password from returned user", async () => {
      const mockAuth = createMockAuth();
      const mockUser = createMockUser({
        password: "hashedPassword123",
        verificationToken: "token-123",
        isVerified: false,
      });
      const mockToken = "jwt-token";

      userRepository.findUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword123");
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue("token-123"),
      });
      userRepository.createAuth.mockResolvedValue(mockAuth);
      userRepository.createUser.mockResolvedValue(mockUser);
      sendVerificationEmail.mockResolvedValue(undefined);
      generateToken.mockReturnValue(mockToken);

      const result = await register(userData);

      expect(result.user).not.toHaveProperty("password");
      expect(result.user.email).toBe("john@example.com");
      expect(result.user.name).toBe("John Doe");
    });

    test("should hash password with bcrypt salt of 10", async () => {
      const mockAuth = createMockAuth();
      const mockUser = createMockUser({
        verificationToken: "token",
        isVerified: false,
      });

      userRepository.findUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword123");
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue("token"),
      });
      userRepository.createAuth.mockResolvedValue(mockAuth);
      userRepository.createUser.mockResolvedValue(mockUser);
      sendVerificationEmail.mockResolvedValue(undefined);
      generateToken.mockReturnValue("token");

      await register(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    });

    test("should generate verification token with crypto.randomBytes", async () => {
      const mockAuth = createMockAuth();
      const mockUser = createMockUser({
        verificationToken: "hex-token",
        isVerified: false,
      });

      userRepository.findUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue("hex-token"),
      });
      userRepository.createAuth.mockResolvedValue(mockAuth);
      userRepository.createUser.mockResolvedValue(mockUser);
      sendVerificationEmail.mockResolvedValue(undefined);
      generateToken.mockReturnValue("token");

      await register(userData);

      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(crypto.randomBytes().toString).toHaveBeenCalledWith("hex");
    });

    test("should create user with isVerified false", async () => {
      const mockAuth = createMockAuth();
      const mockUser = createMockUser({
        verificationToken: "token",
        isVerified: false,
      });

      userRepository.findUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue("token"),
      });
      userRepository.createAuth.mockResolvedValue(mockAuth);
      userRepository.createUser.mockResolvedValue(mockUser);
      sendVerificationEmail.mockResolvedValue(undefined);
      generateToken.mockReturnValue("token");

      await register(userData);

      expect(userRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          isVerified: false,
        })
      );
    });
  });

  describe("verifyEmail", () => {
    const verificationToken = "valid-token-123";

    test("should verify email successfully", async () => {
      const mockUser = createMockUser({
        verificationToken,
        isVerified: false,
      });
      const mockVerifiedUser = createMockUser({
        verificationToken: null,
        isVerified: true,
      });

      userRepository.findUserByVerificationToken.mockResolvedValue(mockUser);
      userRepository.updateUser.mockResolvedValue(mockVerifiedUser);

      const result = await verifyEmail(verificationToken);

      expect(userRepository.findUserByVerificationToken).toHaveBeenCalledWith(
        verificationToken
      );
      expect(userRepository.updateUser).toHaveBeenCalledWith(mockUser.id, {
        isVerified: true,
        verificationToken: null,
      });
      expect(result).toEqual(mockVerifiedUser);
    });

    test("should throw error if verification token is invalid", async () => {
      userRepository.findUserByVerificationToken.mockResolvedValue(null);

      await expect(verifyEmail("invalid-token")).rejects.toThrow(
        "Invalid verification token"
      );
      expect(userRepository.updateUser).not.toHaveBeenCalled();
    });

    test("should set verificationToken to null after verification", async () => {
      const mockUser = createMockUser({
        verificationToken: "token",
        isVerified: false,
      });
      const mockVerifiedUser = createMockUser({
        verificationToken: null,
        isVerified: true,
      });

      userRepository.findUserByVerificationToken.mockResolvedValue(mockUser);
      userRepository.updateUser.mockResolvedValue(mockVerifiedUser);

      await verifyEmail(verificationToken);

      expect(userRepository.updateUser).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          verificationToken: null,
        })
      );
    });

    test("should set isVerified to true after verification", async () => {
      const mockUser = createMockUser({
        verificationToken: "token",
        isVerified: false,
      });
      const mockVerifiedUser = createMockUser({
        verificationToken: null,
        isVerified: true,
      });

      userRepository.findUserByVerificationToken.mockResolvedValue(mockUser);
      userRepository.updateUser.mockResolvedValue(mockVerifiedUser);

      await verifyEmail(verificationToken);

      expect(userRepository.updateUser).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          isVerified: true,
        })
      );
    });
  });

  describe("resendVerification", () => {
    const email = "john@example.com";

    test("should resend verification email successfully", async () => {
      const mockUser = createMockUser({
        isVerified: false,
        verificationToken: "old-token",
      });

      userRepository.findUserByEmail.mockResolvedValue(mockUser);
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue("new-token-123"),
      });
      userRepository.updateUser.mockResolvedValue({
        ...mockUser,
        verificationToken: "new-token-123",
      });
      sendVerificationEmail.mockResolvedValue(undefined);

      const result = await resendVerification(email);

      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(email);
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(userRepository.updateUser).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          verificationToken: "new-token-123",
          updatedAt: expect.any(Date),
        })
      );
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        email,
        "new-token-123"
      );
      expect(result).toEqual({
        message: "Verification email sent successfully",
      });
    });

    test("should throw error if user not found", async () => {
      userRepository.findUserByEmail.mockResolvedValue(null);

      await expect(resendVerification(email)).rejects.toThrow("User not found");
      expect(crypto.randomBytes).not.toHaveBeenCalled();
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    test("should throw error if user is already verified", async () => {
      const mockUser = createMockUser({
        isVerified: true,
      });

      userRepository.findUserByEmail.mockResolvedValue(mockUser);

      await expect(resendVerification(email)).rejects.toThrow(
        "User is already verified"
      );
      expect(crypto.randomBytes).not.toHaveBeenCalled();
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    test("should generate new verification token", async () => {
      const mockUser = createMockUser({
        isVerified: false,
      });

      userRepository.findUserByEmail.mockResolvedValue(mockUser);
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue("new-verification-token"),
      });
      userRepository.updateUser.mockResolvedValue(mockUser);
      sendVerificationEmail.mockResolvedValue(undefined);

      await resendVerification(email);

      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(crypto.randomBytes().toString).toHaveBeenCalledWith("hex");
    });

    test("should update user with new token and timestamp", async () => {
      const mockUser = createMockUser({
        isVerified: false,
      });

      userRepository.findUserByEmail.mockResolvedValue(mockUser);
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue("token-xyz"),
      });
      userRepository.updateUser.mockResolvedValue(mockUser);
      sendVerificationEmail.mockResolvedValue(undefined);

      await resendVerification(email);

      expect(userRepository.updateUser).toHaveBeenCalledWith(mockUser.id, {
        verificationToken: "token-xyz",
        updatedAt: expect.any(Date),
      });
    });
  });

  describe("login", () => {
    const email = "john@example.com";
    const password = "password123";

    test("should login successfully", async () => {
      const mockUser = createMockUser({
        password: "hashedPassword123",
        isVerified: true,
      });
      const mockToken = "jwt-token-123";

      userRepository.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockReturnValue(mockToken);

      const result = await login(email, password);

      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        password,
        "hashedPassword123"
      );
      expect(generateToken).toHaveBeenCalledWith(mockUser);
      expect(result.user).not.toHaveProperty("password");
      expect(result.token).toBe(mockToken);
    });

    test("should throw error if user not found", async () => {
      userRepository.findUserByEmail.mockResolvedValue(null);

      await expect(login(email, password)).rejects.toThrow(
        "Invalid email or password"
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("should throw error if password is invalid", async () => {
      const mockUser = createMockUser({
        password: "hashedPassword123",
      });

      userRepository.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(login(email, password)).rejects.toThrow(
        "Invalid email or password"
      );
      expect(generateToken).not.toHaveBeenCalled();
    });

    test("should throw error if user is not verified", async () => {
      const mockUser = createMockUser({
        password: "hashedPassword123",
        isVerified: false,
      });

      userRepository.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      await expect(login(email, password)).rejects.toThrow(
        "Please verify your email before logging in. Check your email for verification link."
      );
      expect(generateToken).not.toHaveBeenCalled();
    });

    test("should remove password from returned user", async () => {
      const mockUser = createMockUser({
        password: "hashedPassword123",
        isVerified: true,
      });
      const mockToken = "jwt-token";

      userRepository.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockReturnValue(mockToken);

      const result = await login(email, password);

      expect(result.user).not.toHaveProperty("password");
      expect(result.user.email).toBe(email);
    });

    test("should validate password before checking verification", async () => {
      const mockUser = createMockUser({
        password: "hashedPassword123",
        isVerified: false,
      });

      userRepository.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(login(email, "wrongpassword")).rejects.toThrow(
        "Invalid email or password"
      );
      // Should not reach verification check
    });
  });

  describe("updateUserById", () => {
    const userId = 1;

    test("should update user successfully with allowed fields", async () => {
      const updateData = {
        name: "Jane Doe",
        age: 30,
        phoneNumber: "089876543210",
      };
      const mockUser = createMockUser();
      const mockUpdatedUser = createMockUser({
        name: "Jane Doe",
        age: 30,
        phoneNumber: "089876543210",
      });

      userRepository.findUserById.mockResolvedValue(mockUser);
      userRepository.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await updateUserById(userId, updateData);

      expect(userRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(userRepository.updateUser).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    test("should update only name field", async () => {
      const updateData = { name: "Updated Name" };
      const mockUser = createMockUser();
      const mockUpdatedUser = createMockUser({ name: "Updated Name" });

      userRepository.findUserById.mockResolvedValue(mockUser);
      userRepository.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await updateUserById(userId, updateData);

      expect(userRepository.updateUser).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    test("should update only age field", async () => {
      const updateData = { age: 35 };
      const mockUser = createMockUser();
      const mockUpdatedUser = createMockUser({ age: 35 });

      userRepository.findUserById.mockResolvedValue(mockUser);
      userRepository.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await updateUserById(userId, updateData);

      expect(userRepository.updateUser).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    test("should update only phoneNumber field", async () => {
      const updateData = { phoneNumber: "087777777777" };
      const mockUser = createMockUser();
      const mockUpdatedUser = createMockUser({ phoneNumber: "087777777777" });

      userRepository.findUserById.mockResolvedValue(mockUser);
      userRepository.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await updateUserById(userId, updateData);

      expect(userRepository.updateUser).toHaveBeenCalledWith(
        userId,
        updateData
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    test("should throw error for invalid fields", async () => {
      const updateData = { email: "newemail@example.com" };

      await expect(updateUserById(userId, updateData)).rejects.toThrow(
        "Invalid fields provided: email. Only name, age, and phoneNumber can be updated."
      );
      expect(userRepository.findUserById).not.toHaveBeenCalled();
      expect(userRepository.updateUser).not.toHaveBeenCalled();
    });

    test("should throw error for multiple invalid fields", async () => {
      const updateData = {
        email: "newemail@example.com",
        password: "newpassword",
        role: "admin",
      };

      await expect(updateUserById(userId, updateData)).rejects.toThrow(
        "Invalid fields provided: email, password, role. Only name, age, and phoneNumber can be updated."
      );
      expect(userRepository.findUserById).not.toHaveBeenCalled();
    });

    test("should throw error if user not found", async () => {
      const updateData = { name: "New Name" };

      userRepository.findUserById.mockResolvedValue(null);

      await expect(updateUserById(userId, updateData)).rejects.toThrow(
        "User not found"
      );
      expect(userRepository.updateUser).not.toHaveBeenCalled();
    });

    test("should validate fields before checking user exists", async () => {
      const updateData = { password: "newpass" };

      await expect(updateUserById(userId, updateData)).rejects.toThrow(
        "Invalid fields provided"
      );
      expect(userRepository.findUserById).not.toHaveBeenCalled();
    });

    test("should allow combination of valid and check invalid fields", async () => {
      const updateData = { name: "Valid Name", email: "invalid@field.com" };

      await expect(updateUserById(userId, updateData)).rejects.toThrow(
        "Invalid fields provided: email"
      );
    });
  });

  describe("deleteUserById", () => {
    const userId = 1;

    test("should delete user successfully", async () => {
      userRepository.deleteUser.mockResolvedValue(undefined);

      const result = await deleteUserById(userId);

      expect(userRepository.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: "User deleted successfully" });
    });

    test("should throw error if deletion fails", async () => {
      const error = new Error("Database connection failed");

      userRepository.deleteUser.mockRejectedValue(error);

      await expect(deleteUserById(userId)).rejects.toThrow(
        "Failed to delete user: Database connection failed"
      );
    });

    test("should pass correct user ID to repository", async () => {
      userRepository.deleteUser.mockResolvedValue(undefined);

      await deleteUserById(42);

      expect(userRepository.deleteUser).toHaveBeenCalledWith(42);
    });

    test("should wrap repository errors with custom message", async () => {
      const error = new Error("Prisma error");

      userRepository.deleteUser.mockRejectedValue(error);

      await expect(deleteUserById(userId)).rejects.toThrow(
        "Failed to delete user: Prisma error"
      );
    });
  });

  describe("getAllUsers", () => {
    test("should get all users with default query", async () => {
      const mockUsers = {
        users: [createMockUser({ id: 1 }), createMockUser({ id: 2 })],
        pagination: { page: 1, limit: 10, total: 2 },
      };

      userRepository.findAllUsers.mockResolvedValue(mockUsers);

      const result = await getAllUsers({});

      expect(userRepository.findAllUsers).toHaveBeenCalledWith({});
      expect(result).toEqual(mockUsers);
    });

    test("should get all users with pagination", async () => {
      const queryParams = { page: 2, limit: 5 };
      const mockUsers = {
        users: [createMockUser()],
        pagination: { page: 2, limit: 5, total: 10 },
      };

      userRepository.findAllUsers.mockResolvedValue(mockUsers);

      const result = await getAllUsers(queryParams);

      expect(userRepository.findAllUsers).toHaveBeenCalledWith(queryParams);
      expect(result).toEqual(mockUsers);
    });

    test("should get all users with filters", async () => {
      const queryParams = { role: "organizer", search: "John" };
      const mockUsers = {
        users: [createMockUser({ role: "organizer" })],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      userRepository.findAllUsers.mockResolvedValue(mockUsers);

      const result = await getAllUsers(queryParams);

      expect(userRepository.findAllUsers).toHaveBeenCalledWith(queryParams);
      expect(result).toEqual(mockUsers);
    });

    test("should return empty array when no users found", async () => {
      const mockUsers = {
        users: [],
        pagination: { page: 1, limit: 10, total: 0 },
      };

      userRepository.findAllUsers.mockResolvedValue(mockUsers);

      const result = await getAllUsers({});

      expect(result).toEqual(mockUsers);
    });
  });

  describe("getUserById", () => {
    test("should get user by ID successfully", async () => {
      const mockUser = createMockUser();

      userRepository.findUserById.mockResolvedValue(mockUser);

      const result = await getUserById(1);

      expect(userRepository.findUserById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    test("should throw error if user not found", async () => {
      userRepository.findUserById.mockResolvedValue(null);

      await expect(getUserById(999)).rejects.toThrow("User not found");
    });

    test("should pass correct user ID to repository", async () => {
      const mockUser = createMockUser({ id: 42 });

      userRepository.findUserById.mockResolvedValue(mockUser);

      await getUserById(42);

      expect(userRepository.findUserById).toHaveBeenCalledWith(42);
    });
  });
});
