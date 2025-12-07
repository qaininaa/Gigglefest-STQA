/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock functions
// ---------------------------
const mockUser = {
  create: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
};

const mockAuth = {
  create: jest.fn(),
  delete: jest.fn(),
};

const mockNotification = {
  deleteMany: jest.fn(),
};

const mockReview = {
  deleteMany: jest.fn(),
};

const mockCart = {
  deleteMany: jest.fn(),
};

const mockPayment = {
  deleteMany: jest.fn(),
};

const mockPrisma = {
  user: mockUser,
  auth: mockAuth,
  notification: mockNotification,
  review: mockReview,
  cart: mockCart,
  payment: mockPayment,
  $transaction: jest.fn(),
};

// ---------------------------
// Mock @prisma/client module
// ---------------------------
jest.unstable_mockModule("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// ---------------------------
// Import repository after mock setup
// ---------------------------
const {
  createUser,
  createAuth,
  findUserByEmail,
  findUserById,
  updateUser,
  deleteUser,
  findAllUsers,
  findUserByVerificationToken,
  findUserByResetToken,
} = await import("../../repositories/user.repository.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("User Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    test("should create a user successfully", async () => {
      const userData = {
        email: "test@mail.com",
        password: "hashedPassword123",
        name: "karina",
        phoneNumber: "086752553678",
        age: 22,
      };

      const expectedUser = {
        id: 1,
        ...userData,
        role: "user",
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        authId: null,
      };

      mockUser.create.mockResolvedValue(expectedUser);

      const result = await createUser(userData);

      expect(mockUser.create).toHaveBeenCalledTimes(1);
      expect(mockUser.create).toHaveBeenCalledWith({ data: userData });
      expect(result).toEqual(expectedUser);
    });
  });

  describe("createAuth", () => {
    test("should create auth data successfully", async () => {
      const authData = {
        email: "test@mail.com",
        token: "google-oauth-token-abc123",
      };

      const expectedAuth = {
        id: 1,
        ...authData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuth.create.mockResolvedValue(expectedAuth);

      const result = await createAuth(authData);

      expect(mockAuth.create).toHaveBeenCalledTimes(1);
      expect(mockAuth.create).toHaveBeenCalledWith({ data: authData });
      expect(result).toEqual(expectedAuth);
    });
  });

  describe("findUserByEmail", () => {
    test("should return user when email exists", async () => {
      const email = "test@mail.com";
      const expectedUser = {
        id: 1,
        email: email,
        password: "hashedPassword",
        name: "karina",
        age: 22,
        phoneNumber: "086752553678",
        role: "user",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        authId: null,
      };

      mockUser.findUnique.mockResolvedValue(expectedUser);

      const result = await findUserByEmail(email);

      expect(mockUser.findUnique).toHaveBeenCalledTimes(1);
      expect(mockUser.findUnique).toHaveBeenCalledWith({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          age: true,
          phoneNumber: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          authId: true,
        },
      });
      expect(result).toEqual(expectedUser);
    });

    test("should return null when email does not exist", async () => {
      const email = "nonexistent@mail.com";

      mockUser.findUnique.mockResolvedValue(null);

      const result = await findUserByEmail(email);

      expect(mockUser.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe("findUserById", () => {
    test("should return user when id exists", async () => {
      const userId = 1;
      const expectedUser = {
        id: userId,
        email: "test@mail.com",
        name: "karina",
        age: 22,
        phoneNumber: "086752553678",
        role: "user",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        authId: null,
      };

      mockUser.findUnique.mockResolvedValue(expectedUser);

      const result = await findUserById(userId);

      expect(mockUser.findUnique).toHaveBeenCalledTimes(1);
      expect(mockUser.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          age: true,
          phoneNumber: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          authId: true,
        },
      });
      expect(result).toEqual(expectedUser);
    });

    test("should return null when id does not exist", async () => {
      const userId = 999;

      mockUser.findUnique.mockResolvedValue(null);

      const result = await findUserById(userId);

      expect(mockUser.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe("updateUser", () => {
    test("should update user successfully", async () => {
      const userId = 1;
      const updateData = { name: "updated name", age: 23 };
      const updatedUser = {
        id: userId,
        email: "test@mail.com",
        name: "updated name",
        age: 23,
        phoneNumber: "086752553678",
        role: "user",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        authId: null,
      };

      mockUser.update.mockResolvedValue(updatedUser);

      const result = await updateUser(userId, updateData);

      expect(mockUser.update).toHaveBeenCalledTimes(1);
      expect(mockUser.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe("deleteUser", () => {
    test("should delete user and related data successfully", async () => {
      const userId = 1;
      const authId = 10;
      const userToDelete = {
        id: userId,
        authId: authId,
      };

      // Mock finding the user
      mockUser.findUnique.mockResolvedValue(userToDelete);

      // Mock transaction to execute callback with transaction context
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        // Execute the callback with the transaction context (mockPrisma)
        return await callback(mockPrisma);
      });

      // Mock all deletion operations
      mockNotification.deleteMany.mockResolvedValue({ count: 2 });
      mockReview.deleteMany.mockResolvedValue({ count: 1 });
      mockCart.deleteMany.mockResolvedValue({ count: 3 });
      mockPayment.deleteMany.mockResolvedValue({ count: 1 });
      mockUser.delete.mockResolvedValue(userToDelete);
      mockAuth.delete.mockResolvedValue({ id: authId });

      await deleteUser(userId);

      // Verify user lookup
      expect(mockUser.findUnique).toHaveBeenCalledTimes(1);
      expect(mockUser.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          authId: true,
        },
      });

      // Verify transaction was called
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      // Verify all deletions happened in order
      expect(mockNotification.deleteMany).toHaveBeenCalledWith({
        where: { userId: userId },
      });
      expect(mockReview.deleteMany).toHaveBeenCalledWith({
        where: { userId: userId },
      });
      expect(mockCart.deleteMany).toHaveBeenCalledWith({
        where: { userId: userId },
      });
      expect(mockPayment.deleteMany).toHaveBeenCalledWith({
        where: { userId: userId },
      });
      expect(mockUser.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockAuth.delete).toHaveBeenCalledWith({
        where: { id: authId },
      });
    });

    test("should delete user without authId", async () => {
      const userId = 2;
      const userToDelete = {
        id: userId,
        authId: null,
      };

      mockUser.findUnique.mockResolvedValue(userToDelete);

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      mockNotification.deleteMany.mockResolvedValue({ count: 0 });
      mockReview.deleteMany.mockResolvedValue({ count: 0 });
      mockCart.deleteMany.mockResolvedValue({ count: 0 });
      mockPayment.deleteMany.mockResolvedValue({ count: 0 });
      mockUser.delete.mockResolvedValue(userToDelete);

      await deleteUser(userId);

      expect(mockUser.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockAuth.delete).not.toHaveBeenCalled();
    });

    test("should throw error when user not found", async () => {
      const userId = 999;

      mockUser.findUnique.mockResolvedValue(null);

      await expect(deleteUser(userId)).rejects.toThrow("User not found");

      expect(mockUser.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("findAllUsers", () => {
    test("should return paginated users with metadata", async () => {
      const params = { page: 1, limit: 10, search: "" };
      const mockUsers = [
        {
          id: 1,
          email: "user1@mail.com",
          name: "User One",
          age: 25,
          phoneNumber: "123456789",
          role: "user",
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          authId: null,
        },
        {
          id: 2,
          email: "user2@mail.com",
          name: "User Two",
          age: 30,
          phoneNumber: "987654321",
          role: "user",
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          authId: 5,
        },
      ];

      const totalCount = 25;

      mockUser.findMany.mockResolvedValue(mockUsers);
      mockUser.count.mockResolvedValue(totalCount);

      const result = await findAllUsers(params);

      expect(mockUser.findMany).toHaveBeenCalledTimes(1);
      expect(mockUser.findMany).toHaveBeenCalledWith({
        where: {
          email: {
            contains: "",
            mode: "insensitive",
          },
        },
        skip: 0,
        take: 10,
        select: {
          id: true,
          email: true,
          name: true,
          age: true,
          phoneNumber: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          authId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(mockUser.count).toHaveBeenCalledTimes(1);
      expect(mockUser.count).toHaveBeenCalledWith({
        where: {
          email: {
            contains: "",
            mode: "insensitive",
          },
        },
      });

      expect(result.users).toEqual(mockUsers);
      expect(result.metadata).toEqual({
        total: totalCount,
        totalPages: 3,
        currentPage: 1,
        limit: 10,
      });
    });

    test("should filter users by search term", async () => {
      const params = { page: 1, limit: 5, search: "karina" };
      const mockUsers = [
        {
          id: 7,
          email: "karina@mail.com",
          name: "Karina",
          age: 22,
          phoneNumber: "086752553678",
          role: "user",
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          authId: null,
        },
      ];

      mockUser.findMany.mockResolvedValue(mockUsers);
      mockUser.count.mockResolvedValue(1);

      const result = await findAllUsers(params);

      expect(mockUser.findMany).toHaveBeenCalledWith({
        where: {
          email: {
            contains: "karina",
            mode: "insensitive",
          },
        },
        skip: 0,
        take: 5,
        select: {
          id: true,
          email: true,
          name: true,
          age: true,
          phoneNumber: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          authId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result.users).toEqual(mockUsers);
      expect(result.metadata.total).toBe(1);
      expect(result.metadata.totalPages).toBe(1);
    });

    test("should handle pagination correctly", async () => {
      const params = { page: 2, limit: 5, search: "" };

      mockUser.findMany.mockResolvedValue([]);
      mockUser.count.mockResolvedValue(12);

      const result = await findAllUsers(params);

      expect(mockUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * 5
          take: 5,
        })
      );

      expect(result.metadata).toEqual({
        total: 12,
        totalPages: 3,
        currentPage: 2,
        limit: 5,
      });
    });
  });

  describe("findUserByVerificationToken", () => {
    test("should return user when verification token exists", async () => {
      const token = "verification-token-123";
      const expectedUser = {
        id: 1,
        email: "test@mail.com",
        verificationToken: token,
        isVerified: false,
      };

      mockUser.findUnique.mockResolvedValue(expectedUser);

      const result = await findUserByVerificationToken(token);

      expect(mockUser.findUnique).toHaveBeenCalledTimes(1);
      expect(mockUser.findUnique).toHaveBeenCalledWith({
        where: { verificationToken: token },
      });
      expect(result).toEqual(expectedUser);
    });

    test("should return null when verification token does not exist", async () => {
      const token = "invalid-token";

      mockUser.findUnique.mockResolvedValue(null);

      const result = await findUserByVerificationToken(token);

      expect(mockUser.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe("findUserByResetToken", () => {
    test("should return user when reset token exists", async () => {
      const token = "reset-token-456";
      const expectedUser = {
        id: 1,
        email: "test@mail.com",
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 3600000),
      };

      mockUser.findFirst.mockResolvedValue(expectedUser);

      const result = await findUserByResetToken(token);

      expect(mockUser.findFirst).toHaveBeenCalledTimes(1);
      expect(mockUser.findFirst).toHaveBeenCalledWith({
        where: { resetToken: token },
      });
      expect(result).toEqual(expectedUser);
    });

    test("should return null when reset token does not exist", async () => {
      const token = "invalid-reset-token";

      mockUser.findFirst.mockResolvedValue(null);

      const result = await findUserByResetToken(token);

      expect(mockUser.findFirst).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });
});
