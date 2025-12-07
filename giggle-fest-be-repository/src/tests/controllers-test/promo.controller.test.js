import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the promo service
const mockPromoService = {
  createPromoCode: jest.fn(),
  getAllPromoCodes: jest.fn(),
  validatePromoCode: jest.fn(),
  updatePromoCode: jest.fn(),
  deletePromoCode: jest.fn(),
};

jest.unstable_mockModule(
  "../../services/promo.service.js",
  () => mockPromoService
);

// Mock response utilities
const mockSuccessResponse = jest.fn();
const mockErrorResponse = jest.fn();

jest.unstable_mockModule("../../utils/response.js", () => ({
  successResponse: mockSuccessResponse,
  errorResponse: mockErrorResponse,
}));

const {
  createPromoCode,
  getAllPromoCodes,
  validatePromoCode,
  updatePromoCode,
  deletePromoCode,
} = await import("../../controllers/promo.controller.js");

describe("Promo Controller", () => {
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
  const createMockPromoCode = (overrides = {}) => ({
    id: 1,
    code: "EARLY2024",
    discount: 20,
    validFrom: new Date("2024-01-01"),
    validTo: new Date("2024-12-31"),
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  const createMockPaginatedPromoCodes = () => ({
    data: [
      createMockPromoCode(),
      createMockPromoCode({ id: 2, code: "SUMMER2024", discount: 30 }),
    ],
    meta: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    },
  });

  describe("createPromoCode", () => {
    it("should create promo code successfully when user is admin", async () => {
      const mockPromoCode = createMockPromoCode();
      mockPromoService.createPromoCode.mockResolvedValue(mockPromoCode);
      mockReq.body = {
        code: "EARLY2024",
        discount: 20,
        validFrom: "2024-01-01",
        validTo: "2024-12-31",
      };

      await createPromoCode(mockReq, mockRes);

      expect(mockPromoService.createPromoCode).toHaveBeenCalledWith({
        code: "EARLY2024",
        discount: 20,
        validFrom: "2024-01-01",
        validTo: "2024-12-31",
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockPromoCode,
        "Promo code created successfully",
        201
      );
    });

    it("should handle error when creating promo code fails", async () => {
      mockPromoService.createPromoCode.mockRejectedValue(
        new Error("Promo code already exists")
      );
      mockReq.body = { code: "EARLY2024", discount: 20 };

      await createPromoCode(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Promo code already exists",
        400
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.body = { code: "EARLY2024", discount: 20 };

      await createPromoCode(mockReq, mockRes);

      expect(mockPromoService.createPromoCode).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.body = { code: "EARLY2024", discount: 20 };

      await createPromoCode(mockReq, mockRes);

      expect(mockPromoService.createPromoCode).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should return 201 status code on success", async () => {
      const mockPromoCode = createMockPromoCode();
      mockPromoService.createPromoCode.mockResolvedValue(mockPromoCode);
      mockReq.body = { code: "EARLY2024", discount: 20 };

      await createPromoCode(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.any(Object),
        "Promo code created successfully",
        201
      );
    });

    it("should handle validation errors with 400 status", async () => {
      mockPromoService.createPromoCode.mockRejectedValue(
        new Error("Discount must be between 0 and 100")
      );
      mockReq.body = { code: "INVALID", discount: 150 };

      await createPromoCode(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Discount must be between 0 and 100",
        400
      );
    });

    it("should pass request body to service", async () => {
      const mockPromoCode = createMockPromoCode();
      mockPromoService.createPromoCode.mockResolvedValue(mockPromoCode);
      mockReq.body = {
        code: "WINTER2024",
        discount: 15,
        validFrom: "2024-12-01",
        validTo: "2024-12-31",
        isActive: true,
      };

      await createPromoCode(mockReq, mockRes);

      expect(mockPromoService.createPromoCode).toHaveBeenCalledWith({
        code: "WINTER2024",
        discount: 15,
        validFrom: "2024-12-01",
        validTo: "2024-12-31",
        isActive: true,
      });
    });
  });

  describe("getAllPromoCodes", () => {
    it("should get all promo codes successfully when user is admin", async () => {
      const mockPromoCodes = createMockPaginatedPromoCodes();
      mockPromoService.getAllPromoCodes.mockResolvedValue(mockPromoCodes);

      await getAllPromoCodes(mockReq, mockRes);

      expect(mockPromoService.getAllPromoCodes).toHaveBeenCalledWith(
        mockReq.query
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockPromoCodes);
    });

    it("should handle error when getting promo codes fails", async () => {
      mockPromoService.getAllPromoCodes.mockRejectedValue(
        new Error("Database error")
      );

      await getAllPromoCodes(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";

      await getAllPromoCodes(mockReq, mockRes);

      expect(mockPromoService.getAllPromoCodes).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";

      await getAllPromoCodes(mockReq, mockRes);

      expect(mockPromoService.getAllPromoCodes).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should pass query parameters to service", async () => {
      const mockPromoCodes = createMockPaginatedPromoCodes();
      mockPromoService.getAllPromoCodes.mockResolvedValue(mockPromoCodes);
      mockReq.query = { page: "1", limit: "10", isActive: "true" };

      await getAllPromoCodes(mockReq, mockRes);

      expect(mockPromoService.getAllPromoCodes).toHaveBeenCalledWith({
        page: "1",
        limit: "10",
        isActive: "true",
      });
    });

    it("should handle empty query parameters", async () => {
      const mockPromoCodes = createMockPaginatedPromoCodes();
      mockPromoService.getAllPromoCodes.mockResolvedValue(mockPromoCodes);
      mockReq.query = {};

      await getAllPromoCodes(mockReq, mockRes);

      expect(mockPromoService.getAllPromoCodes).toHaveBeenCalledWith({});
    });

    it("should return 400 status on error", async () => {
      mockPromoService.getAllPromoCodes.mockRejectedValue(
        new Error("Failed to fetch promo codes")
      );

      await getAllPromoCodes(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Failed to fetch promo codes",
        400
      );
    });
  });

  describe("validatePromoCode", () => {
    it("should validate promo code successfully", async () => {
      const mockPromoCode = createMockPromoCode();
      mockPromoService.validatePromoCode.mockResolvedValue(mockPromoCode);
      mockReq.params = { code: "EARLY2024" };

      await validatePromoCode(mockReq, mockRes);

      expect(mockPromoService.validatePromoCode).toHaveBeenCalledWith(
        "EARLY2024"
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockPromoCode);
    });

    it("should handle error when validating promo code fails", async () => {
      mockPromoService.validatePromoCode.mockRejectedValue(
        new Error("Promo code not found or expired")
      );
      mockReq.params = { code: "INVALID" };

      await validatePromoCode(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Promo code not found or expired",
        400
      );
    });

    it("should pass params.code as string to service", async () => {
      const mockPromoCode = createMockPromoCode();
      mockPromoService.validatePromoCode.mockResolvedValue(mockPromoCode);
      mockReq.params = { code: "SUMMER2024" };

      await validatePromoCode(mockReq, mockRes);

      expect(mockPromoService.validatePromoCode).toHaveBeenCalledWith(
        "SUMMER2024"
      );
    });

    it("should not require authentication", async () => {
      const mockPromoCode = createMockPromoCode();
      mockPromoService.validatePromoCode.mockResolvedValue(mockPromoCode);
      mockReq.params = { code: "EARLY2024" };
      delete mockReq.user;

      await validatePromoCode(mockReq, mockRes);

      expect(mockPromoService.validatePromoCode).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockPromoCode);
    });

    it("should handle inactive promo code error", async () => {
      mockPromoService.validatePromoCode.mockRejectedValue(
        new Error("Promo code is not active")
      );
      mockReq.params = { code: "INACTIVE" };

      await validatePromoCode(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Promo code is not active",
        400
      );
    });

    it("should return 400 status on error", async () => {
      mockPromoService.validatePromoCode.mockRejectedValue(
        new Error("Promo code expired")
      );
      mockReq.params = { code: "EXPIRED" };

      await validatePromoCode(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Promo code expired",
        400
      );
    });

    it("should not pass status code for default success response", async () => {
      const mockPromoCode = createMockPromoCode();
      mockPromoService.validatePromoCode.mockResolvedValue(mockPromoCode);
      mockReq.params = { code: "EARLY2024" };

      await validatePromoCode(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockPromoCode);
      expect(mockSuccessResponse).not.toHaveBeenCalledWith(
        mockRes,
        mockPromoCode,
        expect.anything(),
        expect.any(Number)
      );
    });
  });

  describe("updatePromoCode", () => {
    it("should update promo code successfully", async () => {
      const mockPromoCode = createMockPromoCode({ discount: 25 });
      mockPromoService.updatePromoCode.mockResolvedValue(mockPromoCode);
      mockReq.params = { id: "1" };
      mockReq.body = { discount: 25 };

      await updatePromoCode(mockReq, mockRes);

      expect(mockPromoService.updatePromoCode).toHaveBeenCalledWith(1, {
        discount: 25,
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockPromoCode,
        "Promo code updated successfully"
      );
    });

    it("should handle error when updating promo code fails", async () => {
      mockPromoService.updatePromoCode.mockRejectedValue(
        new Error("Promo code not found")
      );
      mockReq.params = { id: "999" };
      mockReq.body = { discount: 25 };

      await updatePromoCode(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Promo code not found",
        400
      );
    });

    it("should convert params.id to number", async () => {
      const mockPromoCode = createMockPromoCode();
      mockPromoService.updatePromoCode.mockResolvedValue(mockPromoCode);
      mockReq.params = { id: "5" };
      mockReq.body = { discount: 30 };

      await updatePromoCode(mockReq, mockRes);

      expect(mockPromoService.updatePromoCode).toHaveBeenCalledWith(
        5,
        expect.any(Object)
      );
    });

    it("should pass request body to service", async () => {
      const mockPromoCode = createMockPromoCode();
      mockPromoService.updatePromoCode.mockResolvedValue(mockPromoCode);
      mockReq.params = { id: "1" };
      mockReq.body = {
        discount: 35,
        validTo: "2024-12-31",
        isActive: false,
      };

      await updatePromoCode(mockReq, mockRes);

      expect(mockPromoService.updatePromoCode).toHaveBeenCalledWith(1, {
        discount: 35,
        validTo: "2024-12-31",
        isActive: false,
      });
    });

    it("should not require admin role", async () => {
      const mockPromoCode = createMockPromoCode();
      mockPromoService.updatePromoCode.mockResolvedValue(mockPromoCode);
      mockReq.user.role = "user";
      mockReq.params = { id: "1" };
      mockReq.body = { discount: 25 };

      await updatePromoCode(mockReq, mockRes);

      expect(mockPromoService.updatePromoCode).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockPromoCode,
        "Promo code updated successfully"
      );
    });

    it("should handle validation errors with 400 status", async () => {
      mockPromoService.updatePromoCode.mockRejectedValue(
        new Error("Invalid discount value")
      );
      mockReq.params = { id: "1" };
      mockReq.body = { discount: -10 };

      await updatePromoCode(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Invalid discount value",
        400
      );
    });

    it("should return 400 status on error", async () => {
      mockPromoService.updatePromoCode.mockRejectedValue(
        new Error("Update failed")
      );
      mockReq.params = { id: "1" };
      mockReq.body = {};

      await updatePromoCode(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Update failed",
        400
      );
    });
  });

  describe("deletePromoCode", () => {
    it("should delete promo code successfully", async () => {
      mockPromoService.deletePromoCode.mockResolvedValue();
      mockReq.params = { id: "1" };

      await deletePromoCode(mockReq, mockRes);

      expect(mockPromoService.deletePromoCode).toHaveBeenCalledWith(1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Promo code deleted successfully"
      );
    });

    it("should handle error when deleting promo code fails", async () => {
      mockPromoService.deletePromoCode.mockRejectedValue(
        new Error("Promo code not found")
      );
      mockReq.params = { id: "999" };

      await deletePromoCode(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Promo code not found",
        400
      );
    });

    it("should convert params.id to number", async () => {
      mockPromoService.deletePromoCode.mockResolvedValue();
      mockReq.params = { id: "7" };

      await deletePromoCode(mockReq, mockRes);

      expect(mockPromoService.deletePromoCode).toHaveBeenCalledWith(7);
    });

    it("should return null data on success", async () => {
      mockPromoService.deletePromoCode.mockResolvedValue();
      mockReq.params = { id: "1" };

      await deletePromoCode(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Promo code deleted successfully"
      );
    });

    it("should not require admin role", async () => {
      mockPromoService.deletePromoCode.mockResolvedValue();
      mockReq.user.role = "user";
      mockReq.params = { id: "1" };

      await deletePromoCode(mockReq, mockRes);

      expect(mockPromoService.deletePromoCode).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Promo code deleted successfully"
      );
    });

    it("should handle promo code in use error", async () => {
      mockPromoService.deletePromoCode.mockRejectedValue(
        new Error("Cannot delete promo code that is currently in use")
      );
      mockReq.params = { id: "1" };

      await deletePromoCode(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Cannot delete promo code that is currently in use",
        400
      );
    });

    it("should return 400 status on error", async () => {
      mockPromoService.deletePromoCode.mockRejectedValue(
        new Error("Database error")
      );
      mockReq.params = { id: "1" };

      await deletePromoCode(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });
  });
});
