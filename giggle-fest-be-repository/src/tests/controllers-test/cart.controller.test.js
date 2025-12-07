import { jest } from "@jest/globals";

// Mock dependencies
jest.unstable_mockModule("../../../src/services/cart.service.js", () => ({
  addToCart: jest.fn(),
  getCartByUser: jest.fn(),
  updateCartQuantity: jest.fn(),
  removeFromCart: jest.fn(),
  checkout: jest.fn(),
}));

jest.unstable_mockModule("../../../src/utils/response.js", () => ({
  successResponse: jest.fn(),
  errorResponse: jest.fn(),
}));

// Import mocked modules
const cartService = await import("../../../src/services/cart.service.js");
const { successResponse, errorResponse } = await import(
  "../../../src/utils/response.js"
);

// Import controller to test
const {
  addToCart,
  getCartByUser,
  updateCartQuantity,
  removeFromCart,
  checkout,
} = await import("../../../src/controllers/cart.controller.js");

describe("Cart Controller", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: 1 },
      body: {},
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // Helper functions
  const createMockCartItem = (overrides = {}) => ({
    id: 1,
    userId: 1,
    ticketId: 1,
    quantity: 2,
    ticket: {
      id: 1,
      name: "VIP Ticket",
      price: 100000,
    },
    ...overrides,
  });

  const createMockCart = (overrides = {}) => ({
    items: [
      createMockCartItem({ id: 1, quantity: 2 }),
      createMockCartItem({ id: 2, ticketId: 2, quantity: 1 }),
    ],
    totalItems: 3,
    totalPrice: 300000,
    ...overrides,
  });

  describe("addToCart", () => {
    test("should add item to cart successfully", async () => {
      const requestBody = { ticketId: 1, quantity: 2 };
      const mockCartItem = createMockCartItem();

      mockReq.body = requestBody;
      cartService.addToCart.mockResolvedValue(mockCartItem);
      successResponse.mockReturnValue(mockRes);

      await addToCart(mockReq, mockRes);

      expect(cartService.addToCart).toHaveBeenCalledWith(1, requestBody);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockCartItem,
        "Item added to cart successfully",
        201
      );
      expect(errorResponse).not.toHaveBeenCalled();
    });

    test("should handle error when adding to cart fails", async () => {
      const requestBody = { ticketId: 1, quantity: 2 };
      const errorMessage = "Ticket not found";

      mockReq.body = requestBody;
      cartService.addToCart.mockRejectedValue(new Error(errorMessage));
      errorResponse.mockReturnValue(mockRes);

      await addToCart(mockReq, mockRes);

      expect(cartService.addToCart).toHaveBeenCalledWith(1, requestBody);
      expect(errorResponse).toHaveBeenCalledWith(mockRes, errorMessage, 400);
      expect(successResponse).not.toHaveBeenCalled();
    });

    test("should use user ID from req.user", async () => {
      const requestBody = { ticketId: 5, quantity: 3 };
      mockReq.user.id = 42;
      mockReq.body = requestBody;

      cartService.addToCart.mockResolvedValue(createMockCartItem());
      successResponse.mockReturnValue(mockRes);

      await addToCart(mockReq, mockRes);

      expect(cartService.addToCart).toHaveBeenCalledWith(42, requestBody);
    });

    test("should return 201 status code on success", async () => {
      mockReq.body = { ticketId: 1, quantity: 1 };
      cartService.addToCart.mockResolvedValue(createMockCartItem());
      successResponse.mockReturnValue(mockRes);

      await addToCart(mockReq, mockRes);

      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        expect.any(Object),
        "Item added to cart successfully",
        201
      );
    });

    test("should handle validation errors", async () => {
      mockReq.body = { ticketId: 1, quantity: -1 };
      cartService.addToCart.mockRejectedValue(
        new Error("Quantity must be positive")
      );
      errorResponse.mockReturnValue(mockRes);

      await addToCart(mockReq, mockRes);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        "Quantity must be positive",
        400
      );
    });
  });

  describe("getCartByUser", () => {
    test("should get cart by user successfully", async () => {
      const mockCart = createMockCart();

      cartService.getCartByUser.mockResolvedValue(mockCart);
      successResponse.mockReturnValue(mockRes);

      await getCartByUser(mockReq, mockRes);

      expect(cartService.getCartByUser).toHaveBeenCalledWith(1);
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockCart);
      expect(errorResponse).not.toHaveBeenCalled();
    });

    test("should handle error when getting cart fails", async () => {
      const errorMessage = "Database error";

      cartService.getCartByUser.mockRejectedValue(new Error(errorMessage));
      errorResponse.mockReturnValue(mockRes);

      await getCartByUser(mockReq, mockRes);

      expect(cartService.getCartByUser).toHaveBeenCalledWith(1);
      expect(errorResponse).toHaveBeenCalledWith(mockRes, errorMessage, 400);
      expect(successResponse).not.toHaveBeenCalled();
    });

    test("should use user ID from req.user", async () => {
      mockReq.user.id = 99;
      cartService.getCartByUser.mockResolvedValue(createMockCart());
      successResponse.mockReturnValue(mockRes);

      await getCartByUser(mockReq, mockRes);

      expect(cartService.getCartByUser).toHaveBeenCalledWith(99);
    });

    test("should return empty cart when user has no items", async () => {
      const emptyCart = {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };

      cartService.getCartByUser.mockResolvedValue(emptyCart);
      successResponse.mockReturnValue(mockRes);

      await getCartByUser(mockReq, mockRes);

      expect(successResponse).toHaveBeenCalledWith(mockRes, emptyCart);
    });

    test("should not pass status code for default success response", async () => {
      cartService.getCartByUser.mockResolvedValue(createMockCart());
      successResponse.mockReturnValue(mockRes);

      await getCartByUser(mockReq, mockRes);

      expect(successResponse).toHaveBeenCalledWith(mockRes, expect.any(Object));
      expect(successResponse).toHaveBeenCalledTimes(1);
      expect(successResponse.mock.calls[0].length).toBe(2);
    });
  });

  describe("updateCartQuantity", () => {
    test("should update cart quantity successfully", async () => {
      const cartItemId = 5;
      const newQuantity = 3;
      const mockUpdatedItem = createMockCartItem({ id: 5, quantity: 3 });

      mockReq.params.id = cartItemId.toString();
      mockReq.body.quantity = newQuantity;

      cartService.updateCartQuantity.mockResolvedValue(mockUpdatedItem);
      successResponse.mockReturnValue(mockRes);

      await updateCartQuantity(mockReq, mockRes);

      expect(cartService.updateCartQuantity).toHaveBeenCalledWith(
        1,
        cartItemId,
        newQuantity
      );
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockUpdatedItem,
        "Cart updated successfully"
      );
      expect(errorResponse).not.toHaveBeenCalled();
    });

    test("should handle error when updating quantity fails", async () => {
      const errorMessage = "Cart item not found";

      mockReq.params.id = "99";
      mockReq.body.quantity = 5;

      cartService.updateCartQuantity.mockRejectedValue(new Error(errorMessage));
      errorResponse.mockReturnValue(mockRes);

      await updateCartQuantity(mockReq, mockRes);

      expect(errorResponse).toHaveBeenCalledWith(mockRes, errorMessage, 400);
      expect(successResponse).not.toHaveBeenCalled();
    });

    test("should convert params.id to number", async () => {
      mockReq.params.id = "123";
      mockReq.body.quantity = 2;

      cartService.updateCartQuantity.mockResolvedValue(createMockCartItem());
      successResponse.mockReturnValue(mockRes);

      await updateCartQuantity(mockReq, mockRes);

      expect(cartService.updateCartQuantity).toHaveBeenCalledWith(1, 123, 2);
    });

    test("should convert body.quantity to number", async () => {
      mockReq.params.id = "5";
      mockReq.body.quantity = "10";

      cartService.updateCartQuantity.mockResolvedValue(createMockCartItem());
      successResponse.mockReturnValue(mockRes);

      await updateCartQuantity(mockReq, mockRes);

      expect(cartService.updateCartQuantity).toHaveBeenCalledWith(1, 5, 10);
    });

    test("should use user ID from req.user", async () => {
      mockReq.user.id = 77;
      mockReq.params.id = "1";
      mockReq.body.quantity = 2;

      cartService.updateCartQuantity.mockResolvedValue(createMockCartItem());
      successResponse.mockReturnValue(mockRes);

      await updateCartQuantity(mockReq, mockRes);

      expect(cartService.updateCartQuantity).toHaveBeenCalledWith(77, 1, 2);
    });

    test("should handle invalid quantity error", async () => {
      mockReq.params.id = "1";
      mockReq.body.quantity = 0;

      cartService.updateCartQuantity.mockRejectedValue(
        new Error("Quantity must be positive")
      );
      errorResponse.mockReturnValue(mockRes);

      await updateCartQuantity(mockReq, mockRes);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        "Quantity must be positive",
        400
      );
    });
  });

  describe("removeFromCart", () => {
    test("should remove item from cart successfully", async () => {
      const cartItemId = 5;

      mockReq.params.id = cartItemId.toString();

      cartService.removeFromCart.mockResolvedValue(undefined);
      successResponse.mockReturnValue(mockRes);

      await removeFromCart(mockReq, mockRes);

      expect(cartService.removeFromCart).toHaveBeenCalledWith(1, cartItemId);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Item removed from cart successfully"
      );
      expect(errorResponse).not.toHaveBeenCalled();
    });

    test("should handle error when removing from cart fails", async () => {
      const errorMessage = "Cart item not found";

      mockReq.params.id = "999";

      cartService.removeFromCart.mockRejectedValue(new Error(errorMessage));
      errorResponse.mockReturnValue(mockRes);

      await removeFromCart(mockReq, mockRes);

      expect(errorResponse).toHaveBeenCalledWith(mockRes, errorMessage, 400);
      expect(successResponse).not.toHaveBeenCalled();
    });

    test("should convert params.id to number", async () => {
      mockReq.params.id = "42";

      cartService.removeFromCart.mockResolvedValue(undefined);
      successResponse.mockReturnValue(mockRes);

      await removeFromCart(mockReq, mockRes);

      expect(cartService.removeFromCart).toHaveBeenCalledWith(1, 42);
    });

    test("should use user ID from req.user", async () => {
      mockReq.user.id = 88;
      mockReq.params.id = "10";

      cartService.removeFromCart.mockResolvedValue(undefined);
      successResponse.mockReturnValue(mockRes);

      await removeFromCart(mockReq, mockRes);

      expect(cartService.removeFromCart).toHaveBeenCalledWith(88, 10);
    });

    test("should return null data on success", async () => {
      mockReq.params.id = "1";

      cartService.removeFromCart.mockResolvedValue(undefined);
      successResponse.mockReturnValue(mockRes);

      await removeFromCart(mockReq, mockRes);

      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Item removed from cart successfully"
      );
    });

    test("should handle authorization errors", async () => {
      mockReq.params.id = "1";

      cartService.removeFromCart.mockRejectedValue(
        new Error("Unauthorized to remove this item")
      );
      errorResponse.mockReturnValue(mockRes);

      await removeFromCart(mockReq, mockRes);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized to remove this item",
        400
      );
    });
  });

  describe("checkout", () => {
    test("should checkout successfully", async () => {
      const mockCheckoutData = {
        orderId: "ORDER-123",
        items: [createMockCartItem()],
        totalAmount: 200000,
        redirectUrl: "https://payment.example.com",
      };

      cartService.checkout.mockResolvedValue(mockCheckoutData);
      successResponse.mockReturnValue(mockRes);

      await checkout(mockReq, mockRes);

      expect(cartService.checkout).toHaveBeenCalledWith(1);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockCheckoutData,
        "Checkout initialized successfully"
      );
      expect(errorResponse).not.toHaveBeenCalled();
    });

    test("should handle error when checkout fails", async () => {
      const errorMessage = "Cart is empty";

      cartService.checkout.mockRejectedValue(new Error(errorMessage));
      errorResponse.mockReturnValue(mockRes);

      await checkout(mockReq, mockRes);

      expect(errorResponse).toHaveBeenCalledWith(mockRes, errorMessage, 400);
      expect(successResponse).not.toHaveBeenCalled();
    });

    test("should use user ID from req.user", async () => {
      mockReq.user.id = 55;

      cartService.checkout.mockResolvedValue({
        orderId: "ORDER-456",
        items: [],
        totalAmount: 0,
      });
      successResponse.mockReturnValue(mockRes);

      await checkout(mockReq, mockRes);

      expect(cartService.checkout).toHaveBeenCalledWith(55);
    });

    test("should handle insufficient quantity error", async () => {
      cartService.checkout.mockRejectedValue(
        new Error("Not enough tickets available")
      );
      errorResponse.mockReturnValue(mockRes);

      await checkout(mockReq, mockRes);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        "Not enough tickets available",
        400
      );
    });

    test("should handle payment gateway errors", async () => {
      cartService.checkout.mockRejectedValue(
        new Error("Payment gateway connection failed")
      );
      errorResponse.mockReturnValue(mockRes);

      await checkout(mockReq, mockRes);

      expect(errorResponse).toHaveBeenCalledWith(
        mockRes,
        "Payment gateway connection failed",
        400
      );
    });

    test("should not require request body for checkout", async () => {
      // mockReq.body is empty by default
      cartService.checkout.mockResolvedValue({
        orderId: "ORDER-789",
        items: [],
        totalAmount: 0,
      });
      successResponse.mockReturnValue(mockRes);

      await checkout(mockReq, mockRes);

      expect(cartService.checkout).toHaveBeenCalledWith(1);
      expect(successResponse).toHaveBeenCalled();
    });
  });
});
