import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the payment service
const mockPaymentService = {
  initializePayment: jest.fn(),
  getAllPayments: jest.fn(),
  getPaymentById: jest.fn(),
  getUserPaymentHistory: jest.fn(),
};

jest.unstable_mockModule(
  "../../services/payment.service.js",
  () => mockPaymentService
);

// Mock response utilities
const mockSuccessResponse = jest.fn();
const mockErrorResponse = jest.fn();

jest.unstable_mockModule("../../utils/response.js", () => ({
  successResponse: mockSuccessResponse,
  errorResponse: mockErrorResponse,
}));

const {
  initializePayment,
  getAllPayments,
  getPaymentById,
  getUserPaymentHistory,
} = await import("../../controllers/payment.controller.js");

describe("Payment Controller", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: 1, role: "admin" },
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // Helper functions
  const createMockPayment = (overrides = {}) => ({
    id: 1,
    orderId: "ORDER-123-456",
    userId: 1,
    amount: 150000,
    status: "pending",
    snapToken: "snap-token-123",
    snapRedirectUrl: "https://app.midtrans.com/snap/v2/vtweb/snap-token-123",
    expiresAt: new Date("2024-12-07"),
    createdAt: new Date("2024-12-06"),
    updatedAt: new Date("2024-12-06"),
    ...overrides,
  });

  const createMockPaginatedPayments = () => ({
    data: [
      createMockPayment(),
      createMockPayment({ id: 2, orderId: "ORDER-789-012", amount: 200000 }),
    ],
    meta: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    },
  });

  describe("initializePayment", () => {
    it("should initialize payment successfully", async () => {
      const mockPaymentData = {
        payment: createMockPayment(),
        snapToken: "snap-token-123",
        snapRedirectUrl:
          "https://app.midtrans.com/snap/v2/vtweb/snap-token-123",
      };
      mockPaymentService.initializePayment.mockResolvedValue(mockPaymentData);
      mockReq.body = {
        ticketId: 1,
        quantity: 2,
        promoCode: "EARLY2024",
      };

      await initializePayment(mockReq, mockRes);

      expect(mockPaymentService.initializePayment).toHaveBeenCalledWith(1, {
        ticketId: 1,
        quantity: 2,
        promoCode: "EARLY2024",
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockPaymentData,
        "Payment initialized successfully",
        201
      );
    });

    it("should handle error when initializing payment fails", async () => {
      mockPaymentService.initializePayment.mockRejectedValue(
        new Error("Ticket not found")
      );
      mockReq.body = { ticketId: 999, quantity: 2 };

      await initializePayment(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Ticket not found",
        400
      );
    });

    it("should use user ID from req.user", async () => {
      const mockPaymentData = { payment: createMockPayment() };
      mockPaymentService.initializePayment.mockResolvedValue(mockPaymentData);
      mockReq.user.id = 5;
      mockReq.body = { ticketId: 1, quantity: 2 };

      await initializePayment(mockReq, mockRes);

      expect(mockPaymentService.initializePayment).toHaveBeenCalledWith(
        5,
        expect.any(Object)
      );
    });

    it("should return 201 status code on success", async () => {
      const mockPaymentData = { payment: createMockPayment() };
      mockPaymentService.initializePayment.mockResolvedValue(mockPaymentData);
      mockReq.body = { ticketId: 1, quantity: 2 };

      await initializePayment(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.any(Object),
        "Payment initialized successfully",
        201
      );
    });

    it("should pass request body to service", async () => {
      const mockPaymentData = { payment: createMockPayment() };
      mockPaymentService.initializePayment.mockResolvedValue(mockPaymentData);
      mockReq.body = {
        ticketId: 3,
        quantity: 5,
        promoCode: "DISCOUNT50",
      };

      await initializePayment(mockReq, mockRes);

      expect(mockPaymentService.initializePayment).toHaveBeenCalledWith(1, {
        ticketId: 3,
        quantity: 5,
        promoCode: "DISCOUNT50",
      });
    });

    it("should handle insufficient ticket quantity error", async () => {
      mockPaymentService.initializePayment.mockRejectedValue(
        new Error("Insufficient ticket quantity")
      );
      mockReq.body = { ticketId: 1, quantity: 100 };

      await initializePayment(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Insufficient ticket quantity",
        400
      );
    });

    it("should handle invalid promo code error", async () => {
      mockPaymentService.initializePayment.mockRejectedValue(
        new Error("Invalid promo code")
      );
      mockReq.body = { ticketId: 1, quantity: 2, promoCode: "INVALID" };

      await initializePayment(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Invalid promo code",
        400
      );
    });

    it("should return 400 status on error", async () => {
      mockPaymentService.initializePayment.mockRejectedValue(
        new Error("Validation error")
      );
      mockReq.body = {};

      await initializePayment(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Validation error",
        400
      );
    });
  });

  describe("getAllPayments", () => {
    it("should get all payments successfully when user is admin", async () => {
      const mockPayments = createMockPaginatedPayments();
      mockPaymentService.getAllPayments.mockResolvedValue(mockPayments);

      await getAllPayments(mockReq, mockRes);

      expect(mockPaymentService.getAllPayments).toHaveBeenCalledWith(
        mockReq.query
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockPayments);
    });

    it("should handle error when getting payments fails", async () => {
      mockPaymentService.getAllPayments.mockRejectedValue(
        new Error("Database error")
      );

      await getAllPayments(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";

      await getAllPayments(mockReq, mockRes);

      expect(mockPaymentService.getAllPayments).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";

      await getAllPayments(mockReq, mockRes);

      expect(mockPaymentService.getAllPayments).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should pass query parameters to service", async () => {
      const mockPayments = createMockPaginatedPayments();
      mockPaymentService.getAllPayments.mockResolvedValue(mockPayments);
      mockReq.query = { page: "1", limit: "10", status: "pending" };

      await getAllPayments(mockReq, mockRes);

      expect(mockPaymentService.getAllPayments).toHaveBeenCalledWith({
        page: "1",
        limit: "10",
        status: "pending",
      });
    });

    it("should handle empty query parameters", async () => {
      const mockPayments = createMockPaginatedPayments();
      mockPaymentService.getAllPayments.mockResolvedValue(mockPayments);
      mockReq.query = {};

      await getAllPayments(mockReq, mockRes);

      expect(mockPaymentService.getAllPayments).toHaveBeenCalledWith({});
    });

    it("should return 400 status on service error", async () => {
      mockPaymentService.getAllPayments.mockRejectedValue(
        new Error("Failed to fetch payments")
      );

      await getAllPayments(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Failed to fetch payments",
        400
      );
    });
  });

  describe("getPaymentById", () => {
    it("should get payment by id successfully when user is admin", async () => {
      const mockPayment = createMockPayment();
      mockPaymentService.getPaymentById.mockResolvedValue(mockPayment);
      mockReq.params = { id: "1" };

      await getPaymentById(mockReq, mockRes);

      expect(mockPaymentService.getPaymentById).toHaveBeenCalledWith(1, 1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockPayment);
    });

    it("should handle error when getting payment fails", async () => {
      mockPaymentService.getPaymentById.mockRejectedValue(
        new Error("Payment not found")
      );
      mockReq.params = { id: "999" };

      await getPaymentById(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Payment not found",
        404
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.params = { id: "1" };

      await getPaymentById(mockReq, mockRes);

      expect(mockPaymentService.getPaymentById).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should convert params.id to number", async () => {
      const mockPayment = createMockPayment();
      mockPaymentService.getPaymentById.mockResolvedValue(mockPayment);
      mockReq.params = { id: "5" };

      await getPaymentById(mockReq, mockRes);

      expect(mockPaymentService.getPaymentById).toHaveBeenCalledWith(
        5,
        expect.any(Number)
      );
    });

    it("should pass user ID to service", async () => {
      const mockPayment = createMockPayment();
      mockPaymentService.getPaymentById.mockResolvedValue(mockPayment);
      mockReq.params = { id: "1" };
      mockReq.user.id = 3;

      await getPaymentById(mockReq, mockRes);

      expect(mockPaymentService.getPaymentById).toHaveBeenCalledWith(1, 3);
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.params = { id: "1" };

      await getPaymentById(mockReq, mockRes);

      expect(mockPaymentService.getPaymentById).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should return 404 status on error", async () => {
      mockPaymentService.getPaymentById.mockRejectedValue(
        new Error("Payment not found")
      );
      mockReq.params = { id: "999" };

      await getPaymentById(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Payment not found",
        404
      );
    });

    it("should not pass status code for default success response", async () => {
      const mockPayment = createMockPayment();
      mockPaymentService.getPaymentById.mockResolvedValue(mockPayment);
      mockReq.params = { id: "1" };

      await getPaymentById(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockPayment);
      expect(mockSuccessResponse).not.toHaveBeenCalledWith(
        mockRes,
        mockPayment,
        expect.anything(),
        expect.any(Number)
      );
    });
  });

  describe("getUserPaymentHistory", () => {
    it("should get user payment history successfully", async () => {
      const mockPayments = createMockPaginatedPayments();
      mockPaymentService.getUserPaymentHistory.mockResolvedValue(mockPayments);

      await getUserPaymentHistory(mockReq, mockRes);

      expect(mockPaymentService.getUserPaymentHistory).toHaveBeenCalledWith(
        1,
        mockReq.query
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockPayments);
    });

    it("should handle error when getting payment history fails", async () => {
      mockPaymentService.getUserPaymentHistory.mockRejectedValue(
        new Error("Database error")
      );

      await getUserPaymentHistory(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });

    it("should use user ID from req.user", async () => {
      const mockPayments = createMockPaginatedPayments();
      mockPaymentService.getUserPaymentHistory.mockResolvedValue(mockPayments);
      mockReq.user.id = 7;

      await getUserPaymentHistory(mockReq, mockRes);

      expect(mockPaymentService.getUserPaymentHistory).toHaveBeenCalledWith(
        7,
        expect.any(Object)
      );
    });

    it("should pass query parameters to service", async () => {
      const mockPayments = createMockPaginatedPayments();
      mockPaymentService.getUserPaymentHistory.mockResolvedValue(mockPayments);
      mockReq.query = { page: "1", limit: "10", status: "success" };

      await getUserPaymentHistory(mockReq, mockRes);

      expect(mockPaymentService.getUserPaymentHistory).toHaveBeenCalledWith(1, {
        page: "1",
        limit: "10",
        status: "success",
      });
    });

    it("should handle empty query parameters", async () => {
      const mockPayments = createMockPaginatedPayments();
      mockPaymentService.getUserPaymentHistory.mockResolvedValue(mockPayments);
      mockReq.query = {};

      await getUserPaymentHistory(mockReq, mockRes);

      expect(mockPaymentService.getUserPaymentHistory).toHaveBeenCalledWith(
        1,
        {}
      );
    });

    it("should return 400 status on error", async () => {
      mockPaymentService.getUserPaymentHistory.mockRejectedValue(
        new Error("User not found")
      );

      await getUserPaymentHistory(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "User not found",
        400
      );
    });

    it("should handle user with no payment history", async () => {
      const emptyPayments = {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
      mockPaymentService.getUserPaymentHistory.mockResolvedValue(emptyPayments);

      await getUserPaymentHistory(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, emptyPayments);
    });

    it("should not require admin role", async () => {
      const mockPayments = createMockPaginatedPayments();
      mockPaymentService.getUserPaymentHistory.mockResolvedValue(mockPayments);
      mockReq.user.role = "user";

      await getUserPaymentHistory(mockReq, mockRes);

      expect(mockPaymentService.getUserPaymentHistory).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockPayments);
    });
  });
});
