/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock cart repository functions
// ---------------------------
const mockFindCartItemByTicket = jest.fn();
const mockCreateCartItem = jest.fn();
const mockUpdateCartItem = jest.fn();
const mockFindCartByUser = jest.fn();
const mockFindCartItemById = jest.fn();
const mockDeleteCartItem = jest.fn();

// ---------------------------
// Create mock ticket repository functions
// ---------------------------
const mockFindTicketById = jest.fn();

// ---------------------------
// Mock cart.repository module
// ---------------------------
jest.unstable_mockModule("../../repositories/cart.repository.js", () => ({
  findCartItemByTicket: mockFindCartItemByTicket,
  createCartItem: mockCreateCartItem,
  updateCartItem: mockUpdateCartItem,
  findCartByUser: mockFindCartByUser,
  findCartItemById: mockFindCartItemById,
  deleteCartItem: mockDeleteCartItem,
}));

// ---------------------------
// Mock ticket.repository module
// ---------------------------
jest.unstable_mockModule("../../repositories/ticket.repository.js", () => ({
  findTicketById: mockFindTicketById,
}));

// ---------------------------
// Import service after mock setup
// ---------------------------
const {
  addToCart,
  getCartByUser,
  updateCartQuantity,
  removeFromCart,
  checkout,
} = await import("../../services/cart.service.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Cart Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock ticket
  const createMockTicket = (overrides = {}) => ({
    id: 1,
    name: "VIP Ticket",
    price: 500000,
    quantity: 100,
    eventId: 1,
    categoryId: 1,
    ...overrides,
  });

  // Helper function to create mock cart item
  const createMockCartItem = (overrides = {}) => ({
    id: 1,
    userId: 1,
    ticketId: 1,
    quantity: 2,
    createdAt: new Date("2025-12-01T10:00:00.000Z"),
    updatedAt: new Date("2025-12-01T10:00:00.000Z"),
    ticket: createMockTicket(),
    ...overrides,
  });

  describe("addToCart", () => {
    test("should add new item to cart successfully", async () => {
      const userId = 1;
      const cartData = { ticketId: 5, quantity: 3 };

      const mockTicket = createMockTicket({
        id: 5,
        name: "Regular Ticket",
        price: 200000,
        quantity: 100,
      });

      const mockNewCartItem = createMockCartItem({
        id: 10,
        userId: 1,
        ticketId: 5,
        quantity: 3,
        ticket: mockTicket,
      });

      mockFindTicketById.mockResolvedValue(mockTicket);
      mockFindCartItemByTicket.mockResolvedValue(null); // No existing cart item
      mockCreateCartItem.mockResolvedValue(mockNewCartItem);

      const result = await addToCart(userId, cartData);

      expect(mockFindTicketById).toHaveBeenCalledTimes(1);
      expect(mockFindTicketById).toHaveBeenCalledWith(5);

      expect(mockFindCartItemByTicket).toHaveBeenCalledTimes(1);
      expect(mockFindCartItemByTicket).toHaveBeenCalledWith(1, 5);

      expect(mockCreateCartItem).toHaveBeenCalledTimes(1);
      expect(mockCreateCartItem).toHaveBeenCalledWith({
        userId: 1,
        ticketId: 5,
        quantity: 3,
      });

      expect(result).toEqual(mockNewCartItem);
    });

    test("should throw error when ticket not found", async () => {
      const userId = 1;
      const cartData = { ticketId: 999, quantity: 2 };

      mockFindTicketById.mockResolvedValue(null);

      await expect(addToCart(userId, cartData)).rejects.toThrow(
        "Ticket not found"
      );

      expect(mockFindTicketById).toHaveBeenCalledWith(999);
      expect(mockFindCartItemByTicket).not.toHaveBeenCalled();
      expect(mockCreateCartItem).not.toHaveBeenCalled();
    });

    test("should throw error when not enough tickets available", async () => {
      const userId = 1;
      const cartData = { ticketId: 5, quantity: 150 };

      const mockTicket = createMockTicket({
        id: 5,
        quantity: 100, // Only 100 available
      });

      mockFindTicketById.mockResolvedValue(mockTicket);

      await expect(addToCart(userId, cartData)).rejects.toThrow(
        "Not enough tickets available"
      );

      expect(mockFindTicketById).toHaveBeenCalledWith(5);
      expect(mockFindCartItemByTicket).not.toHaveBeenCalled();
      expect(mockCreateCartItem).not.toHaveBeenCalled();
    });

    test("should update existing cart item when ticket already in cart", async () => {
      const userId = 1;
      const cartData = { ticketId: 5, quantity: 3 };

      const mockTicket = createMockTicket({
        id: 5,
        quantity: 100,
      });

      const existingCartItem = createMockCartItem({
        id: 20,
        userId: 1,
        ticketId: 5,
        quantity: 5, // Existing quantity
        ticket: mockTicket,
      });

      const updatedCartItem = createMockCartItem({
        id: 20,
        userId: 1,
        ticketId: 5,
        quantity: 8, // 5 + 3
        ticket: mockTicket,
      });

      mockFindTicketById.mockResolvedValue(mockTicket);
      mockFindCartItemByTicket.mockResolvedValue(existingCartItem);
      mockUpdateCartItem.mockResolvedValue(updatedCartItem);

      const result = await addToCart(userId, cartData);

      expect(mockFindCartItemByTicket).toHaveBeenCalledWith(1, 5);

      expect(mockUpdateCartItem).toHaveBeenCalledTimes(1);
      expect(mockUpdateCartItem).toHaveBeenCalledWith(20, 1, {
        quantity: 8,
      });

      expect(mockCreateCartItem).not.toHaveBeenCalled();
      expect(result).toEqual(updatedCartItem);
      expect(result.quantity).toBe(8);
    });

    test("should throw error when adding to existing cart item exceeds available quantity", async () => {
      const userId = 1;
      const cartData = { ticketId: 5, quantity: 60 };

      const mockTicket = createMockTicket({
        id: 5,
        quantity: 100,
      });

      const existingCartItem = createMockCartItem({
        id: 20,
        userId: 1,
        ticketId: 5,
        quantity: 50, // Existing quantity
        ticket: mockTicket,
      });

      // 50 + 60 = 110, but only 100 available
      mockFindTicketById.mockResolvedValue(mockTicket);
      mockFindCartItemByTicket.mockResolvedValue(existingCartItem);

      await expect(addToCart(userId, cartData)).rejects.toThrow(
        "Not enough tickets available"
      );

      expect(mockUpdateCartItem).not.toHaveBeenCalled();
      expect(mockCreateCartItem).not.toHaveBeenCalled();
    });

    test("should allow adding to cart when new quantity exactly equals available quantity", async () => {
      const userId = 1;
      const cartData = { ticketId: 5, quantity: 50 };

      const mockTicket = createMockTicket({
        id: 5,
        quantity: 100,
      });

      const existingCartItem = createMockCartItem({
        id: 20,
        userId: 1,
        ticketId: 5,
        quantity: 50,
        ticket: mockTicket,
      });

      const updatedCartItem = createMockCartItem({
        id: 20,
        quantity: 100, // 50 + 50 = 100 (exactly matches available)
      });

      mockFindTicketById.mockResolvedValue(mockTicket);
      mockFindCartItemByTicket.mockResolvedValue(existingCartItem);
      mockUpdateCartItem.mockResolvedValue(updatedCartItem);

      const result = await addToCart(userId, cartData);

      expect(mockUpdateCartItem).toHaveBeenCalledWith(20, 1, {
        quantity: 100,
      });
      expect(result.quantity).toBe(100);
    });

    test("should validate ticket quantity before checking existing cart", async () => {
      const userId = 1;
      const cartData = { ticketId: 5, quantity: 200 };

      const mockTicket = createMockTicket({
        id: 5,
        quantity: 100,
      });

      mockFindTicketById.mockResolvedValue(mockTicket);

      await expect(addToCart(userId, cartData)).rejects.toThrow(
        "Not enough tickets available"
      );

      // Should not check for existing cart item if initial quantity check fails
      expect(mockFindCartItemByTicket).not.toHaveBeenCalled();
    });
  });

  describe("getCartByUser", () => {
    test("should get cart with total calculation", async () => {
      const userId = 1;
      const mockCartItems = [
        createMockCartItem({
          id: 1,
          ticketId: 1,
          quantity: 2,
          ticket: createMockTicket({ id: 1, price: 500000 }),
        }),
        createMockCartItem({
          id: 2,
          ticketId: 2,
          quantity: 3,
          ticket: createMockTicket({ id: 2, price: 200000 }),
        }),
      ];

      mockFindCartByUser.mockResolvedValue(mockCartItems);

      const result = await getCartByUser(userId);

      expect(mockFindCartByUser).toHaveBeenCalledTimes(1);
      expect(mockFindCartByUser).toHaveBeenCalledWith(1);

      expect(result.items).toEqual(mockCartItems);
      expect(result.totalItems).toBe(2);
      // Total: (2 * 500000) + (3 * 200000) = 1000000 + 600000 = 1600000
      expect(result.total).toBe(1600000);
    });

    test("should return empty cart when user has no items", async () => {
      const userId = 5;

      mockFindCartByUser.mockResolvedValue([]);

      const result = await getCartByUser(userId);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalItems).toBe(0);
    });

    test("should calculate total correctly with single item", async () => {
      const userId = 1;
      const mockCartItems = [
        createMockCartItem({
          id: 1,
          quantity: 5,
          ticket: createMockTicket({ price: 100000 }),
        }),
      ];

      mockFindCartByUser.mockResolvedValue(mockCartItems);

      const result = await getCartByUser(userId);

      expect(result.total).toBe(500000); // 5 * 100000
      expect(result.totalItems).toBe(1);
    });

    test("should calculate total correctly with multiple items", async () => {
      const userId = 1;
      const mockCartItems = [
        createMockCartItem({
          id: 1,
          quantity: 1,
          ticket: createMockTicket({ price: 750000 }),
        }),
        createMockCartItem({
          id: 2,
          quantity: 2,
          ticket: createMockTicket({ price: 250000 }),
        }),
        createMockCartItem({
          id: 3,
          quantity: 4,
          ticket: createMockTicket({ price: 150000 }),
        }),
      ];

      mockFindCartByUser.mockResolvedValue(mockCartItems);

      const result = await getCartByUser(userId);

      // Total: (1 * 750000) + (2 * 250000) + (4 * 150000)
      //      = 750000 + 500000 + 600000 = 1850000
      expect(result.total).toBe(1850000);
      expect(result.totalItems).toBe(3);
    });

    test("should handle cart items with zero price", async () => {
      const userId = 1;
      const mockCartItems = [
        createMockCartItem({
          id: 1,
          quantity: 10,
          ticket: createMockTicket({ price: 0 }),
        }),
      ];

      mockFindCartByUser.mockResolvedValue(mockCartItems);

      const result = await getCartByUser(userId);

      expect(result.total).toBe(0);
    });
  });

  describe("updateCartQuantity", () => {
    test("should update cart item quantity successfully", async () => {
      const userId = 1;
      const cartId = 10;
      const newQuantity = 5;

      const mockCartItem = createMockCartItem({
        id: 10,
        userId: 1,
        ticketId: 3,
        quantity: 2,
      });

      const mockTicket = createMockTicket({
        id: 3,
        quantity: 50,
      });

      const updatedCartItem = createMockCartItem({
        id: 10,
        quantity: 5,
      });

      mockFindCartItemById.mockResolvedValue(mockCartItem);
      mockFindTicketById.mockResolvedValue(mockTicket);
      mockUpdateCartItem.mockResolvedValue(updatedCartItem);

      const result = await updateCartQuantity(userId, cartId, newQuantity);

      expect(mockFindCartItemById).toHaveBeenCalledTimes(1);
      expect(mockFindCartItemById).toHaveBeenCalledWith(10, 1);

      expect(mockFindTicketById).toHaveBeenCalledTimes(1);
      expect(mockFindTicketById).toHaveBeenCalledWith(3);

      expect(mockUpdateCartItem).toHaveBeenCalledTimes(1);
      expect(mockUpdateCartItem).toHaveBeenCalledWith(10, 1, {
        quantity: 5,
      });

      expect(result).toEqual(updatedCartItem);
    });

    test("should throw error when cart item not found", async () => {
      const userId = 1;
      const cartId = 999;
      const newQuantity = 5;

      mockFindCartItemById.mockResolvedValue(null);

      await expect(
        updateCartQuantity(userId, cartId, newQuantity)
      ).rejects.toThrow("Cart item not found");

      expect(mockFindCartItemById).toHaveBeenCalledWith(999, 1);
      expect(mockFindTicketById).not.toHaveBeenCalled();
      expect(mockUpdateCartItem).not.toHaveBeenCalled();
    });

    test("should throw error when not enough tickets available for new quantity", async () => {
      const userId = 1;
      const cartId = 10;
      const newQuantity = 150;

      const mockCartItem = createMockCartItem({
        id: 10,
        ticketId: 3,
        quantity: 2,
      });

      const mockTicket = createMockTicket({
        id: 3,
        quantity: 100, // Only 100 available
      });

      mockFindCartItemById.mockResolvedValue(mockCartItem);
      mockFindTicketById.mockResolvedValue(mockTicket);

      await expect(
        updateCartQuantity(userId, cartId, newQuantity)
      ).rejects.toThrow("Not enough tickets available");

      expect(mockUpdateCartItem).not.toHaveBeenCalled();
    });

    test("should allow updating to quantity that equals available tickets", async () => {
      const userId = 1;
      const cartId = 10;
      const newQuantity = 100;

      const mockCartItem = createMockCartItem({
        id: 10,
        ticketId: 3,
        quantity: 50,
      });

      const mockTicket = createMockTicket({
        id: 3,
        quantity: 100,
      });

      const updatedCartItem = createMockCartItem({
        id: 10,
        quantity: 100,
      });

      mockFindCartItemById.mockResolvedValue(mockCartItem);
      mockFindTicketById.mockResolvedValue(mockTicket);
      mockUpdateCartItem.mockResolvedValue(updatedCartItem);

      const result = await updateCartQuantity(userId, cartId, newQuantity);

      expect(mockUpdateCartItem).toHaveBeenCalledWith(10, 1, {
        quantity: 100,
      });
      expect(result.quantity).toBe(100);
    });

    test("should allow decreasing quantity", async () => {
      const userId = 1;
      const cartId = 10;
      const newQuantity = 1;

      const mockCartItem = createMockCartItem({
        id: 10,
        ticketId: 3,
        quantity: 10,
      });

      const mockTicket = createMockTicket({
        id: 3,
        quantity: 50,
      });

      const updatedCartItem = createMockCartItem({
        id: 10,
        quantity: 1,
      });

      mockFindCartItemById.mockResolvedValue(mockCartItem);
      mockFindTicketById.mockResolvedValue(mockTicket);
      mockUpdateCartItem.mockResolvedValue(updatedCartItem);

      const result = await updateCartQuantity(userId, cartId, newQuantity);

      expect(result.quantity).toBe(1);
    });

    test("should validate cart item belongs to user", async () => {
      const userId = 5;
      const cartId = 10;
      const newQuantity = 3;

      const mockCartItem = createMockCartItem({
        id: 10,
        userId: 5,
        ticketId: 3,
      });

      const mockTicket = createMockTicket({ id: 3 });

      mockFindCartItemById.mockResolvedValue(mockCartItem);
      mockFindTicketById.mockResolvedValue(mockTicket);
      mockUpdateCartItem.mockResolvedValue(mockCartItem);

      await updateCartQuantity(userId, cartId, newQuantity);

      expect(mockFindCartItemById).toHaveBeenCalledWith(10, 5);
      expect(mockUpdateCartItem).toHaveBeenCalledWith(10, 5, {
        quantity: 3,
      });
    });
  });

  describe("removeFromCart", () => {
    test("should remove cart item successfully", async () => {
      const userId = 1;
      const cartId = 10;

      const mockCartItem = createMockCartItem({
        id: 10,
        userId: 1,
      });

      const deletedCartItem = createMockCartItem({
        id: 10,
        userId: 1,
      });

      mockFindCartItemById.mockResolvedValue(mockCartItem);
      mockDeleteCartItem.mockResolvedValue(deletedCartItem);

      const result = await removeFromCart(userId, cartId);

      expect(mockFindCartItemById).toHaveBeenCalledTimes(1);
      expect(mockFindCartItemById).toHaveBeenCalledWith(10, 1);

      expect(mockDeleteCartItem).toHaveBeenCalledTimes(1);
      expect(mockDeleteCartItem).toHaveBeenCalledWith(10, 1);

      expect(result).toEqual(deletedCartItem);
    });

    test("should throw error when cart item not found", async () => {
      const userId = 1;
      const cartId = 999;

      mockFindCartItemById.mockResolvedValue(null);

      await expect(removeFromCart(userId, cartId)).rejects.toThrow(
        "Cart item not found"
      );

      expect(mockFindCartItemById).toHaveBeenCalledWith(999, 1);
      expect(mockDeleteCartItem).not.toHaveBeenCalled();
    });

    test("should validate cart item exists before deleting", async () => {
      const userId = 5;
      const cartId = 20;

      mockFindCartItemById.mockResolvedValue(null);

      await expect(removeFromCart(userId, cartId)).rejects.toThrow(
        "Cart item not found"
      );

      expect(mockDeleteCartItem).not.toHaveBeenCalled();
    });

    test("should validate cart item belongs to user", async () => {
      const userId = 3;
      const cartId = 15;

      const mockCartItem = createMockCartItem({
        id: 15,
        userId: 3,
      });

      mockFindCartItemById.mockResolvedValue(mockCartItem);
      mockDeleteCartItem.mockResolvedValue(mockCartItem);

      await removeFromCart(userId, cartId);

      expect(mockFindCartItemById).toHaveBeenCalledWith(15, 3);
      expect(mockDeleteCartItem).toHaveBeenCalledWith(15, 3);
    });
  });

  describe("checkout", () => {
    test("should checkout successfully with valid cart items", async () => {
      const userId = 1;

      const mockCartItems = [
        createMockCartItem({
          id: 1,
          ticketId: 5,
          quantity: 2,
          ticket: createMockTicket({
            id: 5,
            name: "VIP",
            price: 500000,
            quantity: 100,
          }),
        }),
        createMockCartItem({
          id: 2,
          ticketId: 6,
          quantity: 3,
          ticket: createMockTicket({
            id: 6,
            name: "Regular",
            price: 200000,
            quantity: 100,
          }),
        }),
      ];

      mockFindCartByUser.mockResolvedValue(mockCartItems);
      mockFindTicketById
        .mockResolvedValueOnce(createMockTicket({ id: 5, quantity: 100 }))
        .mockResolvedValueOnce(createMockTicket({ id: 6, quantity: 100 }));

      const result = await checkout(userId);

      expect(mockFindCartByUser).toHaveBeenCalledWith(1);
      expect(mockFindTicketById).toHaveBeenCalledTimes(2);
      expect(mockFindTicketById).toHaveBeenNthCalledWith(1, 5);
      expect(mockFindTicketById).toHaveBeenNthCalledWith(2, 6);

      expect(result).toEqual({
        userId: 1,
        items: [
          {
            ticketId: 5,
            quantity: 2,
            price: 500000,
            subtotal: 1000000,
          },
          {
            ticketId: 6,
            quantity: 3,
            price: 200000,
            subtotal: 600000,
          },
        ],
        total: 1600000,
        status: "pending",
      });
    });

    test("should throw error when cart is empty", async () => {
      const userId = 1;

      mockFindCartByUser.mockResolvedValue([]);

      await expect(checkout(userId)).rejects.toThrow("Cart is empty");

      expect(mockFindTicketById).not.toHaveBeenCalled();
    });

    test("should throw error when ticket quantity insufficient during checkout", async () => {
      const userId = 1;

      const mockCartItems = [
        createMockCartItem({
          id: 1,
          ticketId: 5,
          quantity: 50,
          ticket: createMockTicket({
            id: 5,
            name: "VIP Ticket",
            price: 500000,
          }),
        }),
      ];

      mockFindCartByUser.mockResolvedValue(mockCartItems);
      mockFindTicketById.mockResolvedValue(
        createMockTicket({ id: 5, name: "VIP Ticket", quantity: 30 }) // Only 30 available
      );

      await expect(checkout(userId)).rejects.toThrow(
        "Not enough tickets available for VIP Ticket"
      );
    });

    test("should validate all ticket quantities before creating checkout data", async () => {
      const userId = 1;

      const mockCartItems = [
        createMockCartItem({
          id: 1,
          ticketId: 5,
          quantity: 2,
          ticket: createMockTicket({ id: 5, name: "Ticket A", price: 100000 }),
        }),
        createMockCartItem({
          id: 2,
          ticketId: 6,
          quantity: 3,
          ticket: createMockTicket({ id: 6, name: "Ticket B", price: 200000 }),
        }),
        createMockCartItem({
          id: 3,
          ticketId: 7,
          quantity: 100,
          ticket: createMockTicket({ id: 7, name: "Ticket C", price: 150000 }),
        }),
      ];

      mockFindCartByUser.mockResolvedValue(mockCartItems);
      mockFindTicketById
        .mockResolvedValueOnce(
          createMockTicket({ id: 5, name: "Ticket A", quantity: 100 })
        )
        .mockResolvedValueOnce(
          createMockTicket({ id: 6, name: "Ticket B", quantity: 100 })
        )
        .mockResolvedValueOnce(
          createMockTicket({ id: 7, name: "Ticket C", quantity: 50 })
        ); // Insufficient

      await expect(checkout(userId)).rejects.toThrow(
        "Not enough tickets available for Ticket C"
      );

      expect(mockFindTicketById).toHaveBeenCalledTimes(3);
    });

    test("should calculate subtotals correctly for each item", async () => {
      const userId = 1;

      const mockCartItems = [
        createMockCartItem({
          id: 1,
          ticketId: 5,
          quantity: 4,
          ticket: createMockTicket({ id: 5, price: 250000, quantity: 100 }),
        }),
      ];

      mockFindCartByUser.mockResolvedValue(mockCartItems);
      mockFindTicketById.mockResolvedValue(
        createMockTicket({ id: 5, quantity: 100 })
      );

      const result = await checkout(userId);

      expect(result.items[0].subtotal).toBe(1000000); // 4 * 250000
      expect(result.total).toBe(1000000);
    });

    test("should set status as pending", async () => {
      const userId = 1;

      const mockCartItems = [
        createMockCartItem({
          id: 1,
          ticketId: 5,
          quantity: 1,
          ticket: createMockTicket({ id: 5, price: 100000, quantity: 100 }),
        }),
      ];

      mockFindCartByUser.mockResolvedValue(mockCartItems);
      mockFindTicketById.mockResolvedValue(
        createMockTicket({ id: 5, quantity: 100 })
      );

      const result = await checkout(userId);

      expect(result.status).toBe("pending");
    });

    test("should include userId in checkout data", async () => {
      const userId = 5;

      const mockCartItems = [
        createMockCartItem({
          id: 1,
          ticketId: 5,
          quantity: 1,
          ticket: createMockTicket({ id: 5, price: 100000, quantity: 100 }),
        }),
      ];

      mockFindCartByUser.mockResolvedValue(mockCartItems);
      mockFindTicketById.mockResolvedValue(
        createMockTicket({ id: 5, quantity: 100 })
      );

      const result = await checkout(userId);

      expect(result.userId).toBe(5);
    });

    test("should map all cart items correctly in checkout data", async () => {
      const userId = 1;

      const mockCartItems = [
        createMockCartItem({
          id: 1,
          ticketId: 10,
          quantity: 2,
          ticket: createMockTicket({ id: 10, price: 300000, quantity: 100 }),
        }),
        createMockCartItem({
          id: 2,
          ticketId: 11,
          quantity: 5,
          ticket: createMockTicket({ id: 11, price: 150000, quantity: 100 }),
        }),
      ];

      mockFindCartByUser.mockResolvedValue(mockCartItems);
      mockFindTicketById
        .mockResolvedValueOnce(createMockTicket({ id: 10, quantity: 100 }))
        .mockResolvedValueOnce(createMockTicket({ id: 11, quantity: 100 }));

      const result = await checkout(userId);

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({
        ticketId: 10,
        quantity: 2,
        price: 300000,
        subtotal: 600000,
      });
      expect(result.items[1]).toEqual({
        ticketId: 11,
        quantity: 5,
        price: 150000,
        subtotal: 750000,
      });
      expect(result.total).toBe(1350000);
    });

    test("should use getCartByUser internally for total calculation", async () => {
      const userId = 1;

      const mockCartItems = [
        createMockCartItem({
          id: 1,
          ticketId: 5,
          quantity: 2,
          ticket: createMockTicket({ id: 5, price: 500000, quantity: 100 }),
        }),
      ];

      mockFindCartByUser.mockResolvedValue(mockCartItems);
      mockFindTicketById.mockResolvedValue(
        createMockTicket({ id: 5, quantity: 100 })
      );

      const result = await checkout(userId);

      // getCartByUser is called internally
      expect(mockFindCartByUser).toHaveBeenCalledWith(1);
      expect(result.total).toBe(1000000); // Calculated by getCartByUser
    });
  });
});
