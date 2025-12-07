/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock functions
// ---------------------------
const mockCart = {
  findMany: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
};

const mockPrisma = {
  cart: mockCart,
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
  findCartByUser,
  findCartItemById,
  findCartItemByTicket,
  createCartItem,
  updateCartItem,
  deleteCartItem,
  clearUserCart,
} = await import("../../repositories/cart.repository.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Cart Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock cart item
  const createMockCartItem = (overrides = {}) => ({
    id: 1,
    userId: 1,
    ticketId: 1,
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    ticket: {
      id: 1,
      eventId: 1,
      categoryId: 1,
      name: "VIP Ticket",
      price: 500000,
      stock: 100,
      event: {
        id: 1,
        name: "GiggleFest 2025",
        description: "Annual comedy festival",
        date: new Date("2025-12-31"),
        location: "Jakarta",
      },
      category: {
        id: 1,
        name: "VIP",
        description: "VIP seating area",
      },
    },
    ...overrides,
  });

  describe("findCartByUser", () => {
    test("should return all cart items for a user", async () => {
      const userId = 1;
      const mockCartItems = [
        createMockCartItem({ id: 1, ticketId: 1, quantity: 2 }),
        createMockCartItem({ id: 2, ticketId: 2, quantity: 1 }),
      ];

      mockCart.findMany.mockResolvedValue(mockCartItems);

      const result = await findCartByUser(userId);

      expect(mockCart.findMany).toHaveBeenCalledTimes(1);
      expect(mockCart.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          ticket: {
            include: {
              event: true,
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      expect(result).toEqual(mockCartItems);
      expect(result).toHaveLength(2);
    });

    test("should return empty array when user has no cart items", async () => {
      const userId = 999;

      mockCart.findMany.mockResolvedValue([]);

      const result = await findCartByUser(userId);

      expect(mockCart.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("findCartItemById", () => {
    test("should return cart item when found with matching id and userId", async () => {
      const id = 1;
      const userId = 1;
      const mockCartItem = createMockCartItem({ id, userId });

      mockCart.findFirst.mockResolvedValue(mockCartItem);

      const result = await findCartItemById(id, userId);

      expect(mockCart.findFirst).toHaveBeenCalledTimes(1);
      expect(mockCart.findFirst).toHaveBeenCalledWith({
        where: {
          id,
          userId,
        },
        include: {
          ticket: {
            include: {
              event: true,
              category: true,
            },
          },
        },
      });
      expect(result).toEqual(mockCartItem);
    });

    test("should return null when cart item not found", async () => {
      const id = 999;
      const userId = 1;

      mockCart.findFirst.mockResolvedValue(null);

      const result = await findCartItemById(id, userId);

      expect(mockCart.findFirst).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test("should return null when cart item belongs to different user", async () => {
      const id = 1;
      const userId = 999;

      mockCart.findFirst.mockResolvedValue(null);

      const result = await findCartItemById(id, userId);

      expect(mockCart.findFirst).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe("findCartItemByTicket", () => {
    test("should return cart item when user has ticket in cart", async () => {
      const userId = 1;
      const ticketId = 5;
      const mockCartItem = createMockCartItem({ userId, ticketId });

      mockCart.findFirst.mockResolvedValue(mockCartItem);

      const result = await findCartItemByTicket(userId, ticketId);

      expect(mockCart.findFirst).toHaveBeenCalledTimes(1);
      expect(mockCart.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          ticketId,
        },
        include: {
          ticket: {
            include: {
              event: true,
              category: true,
            },
          },
        },
      });
      expect(result).toEqual(mockCartItem);
    });

    test("should return null when ticket not in user cart", async () => {
      const userId = 1;
      const ticketId = 999;

      mockCart.findFirst.mockResolvedValue(null);

      const result = await findCartItemByTicket(userId, ticketId);

      expect(mockCart.findFirst).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe("createCartItem", () => {
    test("should create a new cart item successfully", async () => {
      const cartData = {
        userId: 1,
        ticketId: 3,
        quantity: 2,
      };

      const expectedCartItem = createMockCartItem(cartData);

      mockCart.create.mockResolvedValue(expectedCartItem);

      const result = await createCartItem(cartData);

      expect(mockCart.create).toHaveBeenCalledTimes(1);
      expect(mockCart.create).toHaveBeenCalledWith({
        data: cartData,
        include: {
          ticket: {
            include: {
              event: true,
              category: true,
            },
          },
        },
      });
      expect(result).toEqual(expectedCartItem);
      expect(result.userId).toBe(cartData.userId);
      expect(result.ticketId).toBe(cartData.ticketId);
      expect(result.quantity).toBe(cartData.quantity);
    });

    test("should create cart item with minimum required data", async () => {
      const cartData = {
        userId: 2,
        ticketId: 1,
        quantity: 1,
      };

      const expectedCartItem = createMockCartItem({
        id: 5,
        ...cartData,
      });

      mockCart.create.mockResolvedValue(expectedCartItem);

      const result = await createCartItem(cartData);

      expect(mockCart.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedCartItem);
    });
  });

  describe("updateCartItem", () => {
    test("should update cart item quantity successfully", async () => {
      const id = 1;
      const userId = 1;
      const updateData = { quantity: 5 };

      const updatedCartItem = createMockCartItem({
        id,
        userId,
        quantity: 5,
      });

      mockCart.update.mockResolvedValue(updatedCartItem);

      const result = await updateCartItem(id, userId, updateData);

      expect(mockCart.update).toHaveBeenCalledTimes(1);
      expect(mockCart.update).toHaveBeenCalledWith({
        where: {
          id,
          userId,
        },
        data: updateData,
        include: {
          ticket: {
            include: {
              event: true,
              category: true,
            },
          },
        },
      });
      expect(result).toEqual(updatedCartItem);
      expect(result.quantity).toBe(5);
    });

    test("should update multiple fields in cart item", async () => {
      const id = 2;
      const userId = 1;
      const updateData = {
        quantity: 3,
        ticketId: 10,
      };

      const updatedCartItem = createMockCartItem({
        id,
        userId,
        ...updateData,
      });

      mockCart.update.mockResolvedValue(updatedCartItem);

      const result = await updateCartItem(id, userId, updateData);

      expect(mockCart.update).toHaveBeenCalledTimes(1);
      expect(result.quantity).toBe(updateData.quantity);
      expect(result.ticketId).toBe(updateData.ticketId);
    });
  });

  describe("deleteCartItem", () => {
    test("should delete cart item successfully", async () => {
      const id = 1;
      const userId = 1;
      const deletedCartItem = {
        id,
        userId,
        ticketId: 1,
        quantity: 2,
      };

      mockCart.delete.mockResolvedValue(deletedCartItem);

      const result = await deleteCartItem(id, userId);

      expect(mockCart.delete).toHaveBeenCalledTimes(1);
      expect(mockCart.delete).toHaveBeenCalledWith({
        where: {
          id,
          userId,
        },
      });
      expect(result).toEqual(deletedCartItem);
    });

    test("should verify userId when deleting cart item", async () => {
      const id = 5;
      const userId = 3;

      mockCart.delete.mockResolvedValue({
        id,
        userId,
        ticketId: 2,
        quantity: 1,
      });

      await deleteCartItem(id, userId);

      expect(mockCart.delete).toHaveBeenCalledWith({
        where: {
          id,
          userId,
        },
      });
    });
  });

  describe("clearUserCart", () => {
    test("should delete all cart items for a user", async () => {
      const userId = 1;
      const deleteResult = { count: 3 };

      mockCart.deleteMany.mockResolvedValue(deleteResult);

      const result = await clearUserCart(userId);

      expect(mockCart.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockCart.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toEqual(deleteResult);
      expect(result.count).toBe(3);
    });

    test("should return zero count when user has no cart items", async () => {
      const userId = 999;
      const deleteResult = { count: 0 };

      mockCart.deleteMany.mockResolvedValue(deleteResult);

      const result = await clearUserCart(userId);

      expect(mockCart.deleteMany).toHaveBeenCalledTimes(1);
      expect(result.count).toBe(0);
    });

    test("should handle clearing cart for different users", async () => {
      const userId1 = 1;
      const userId2 = 2;

      mockCart.deleteMany
        .mockResolvedValueOnce({ count: 5 })
        .mockResolvedValueOnce({ count: 2 });

      const result1 = await clearUserCart(userId1);
      const result2 = await clearUserCart(userId2);

      expect(mockCart.deleteMany).toHaveBeenCalledTimes(2);
      expect(result1.count).toBe(5);
      expect(result2.count).toBe(2);
    });
  });
});
