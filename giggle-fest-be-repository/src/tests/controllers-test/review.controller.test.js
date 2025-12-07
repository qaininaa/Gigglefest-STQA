import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the review service
const mockReviewService = {
  createReview: jest.fn(),
  getAllReviews: jest.fn(),
  getReviewById: jest.fn(),
  getReviewsByTicket: jest.fn(),
  getReviewsByUser: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
};

jest.unstable_mockModule(
  "../../services/review.service.js",
  () => mockReviewService
);

// Mock response utilities
const mockSuccessResponse = jest.fn();
const mockErrorResponse = jest.fn();

jest.unstable_mockModule("../../utils/response.js", () => ({
  successResponse: mockSuccessResponse,
  errorResponse: mockErrorResponse,
}));

const {
  createReview,
  getAllReviews,
  getReviewById,
  getReviewsByTicket,
  getReviewsByUser,
  updateReview,
  deleteReview,
} = await import("../../controllers/review.controller.js");

describe("Review Controller", () => {
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
    };
  });

  // Helper functions
  const createMockReview = (overrides = {}) => ({
    id: 1,
    userId: 1,
    ticketId: 1,
    rating: 5,
    comment: "Great event!",
    createdAt: new Date("2024-12-06"),
    updatedAt: new Date("2024-12-06"),
    ...overrides,
  });

  const createMockPaginatedReviews = () => ({
    data: [
      createMockReview(),
      createMockReview({ id: 2, rating: 4, comment: "Good event" }),
    ],
    meta: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    },
  });

  describe("createReview", () => {
    it("should create review successfully", async () => {
      const mockReview = createMockReview();
      mockReviewService.createReview.mockResolvedValue(mockReview);
      mockReq.body = {
        ticketId: 1,
        rating: 5,
        comment: "Great event!",
      };

      await createReview(mockReq, mockRes);

      expect(mockReviewService.createReview).toHaveBeenCalledWith({
        ticketId: 1,
        rating: 5,
        comment: "Great event!",
        userId: 1,
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockReview,
        "Review created successfully",
        201
      );
    });

    it("should handle error when creating review fails", async () => {
      mockReviewService.createReview.mockRejectedValue(
        new Error("Review already exists for this ticket")
      );
      mockReq.body = { ticketId: 1, rating: 5 };

      await createReview(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Review already exists for this ticket",
        400
      );
    });

    it("should inject userId from req.user into review data", async () => {
      const mockReview = createMockReview();
      mockReviewService.createReview.mockResolvedValue(mockReview);
      mockReq.user.id = 5;
      mockReq.body = {
        ticketId: 1,
        rating: 4,
        comment: "Nice!",
      };

      await createReview(mockReq, mockRes);

      expect(mockReviewService.createReview).toHaveBeenCalledWith({
        ticketId: 1,
        rating: 4,
        comment: "Nice!",
        userId: 5,
      });
    });

    it("should return 201 status code on success", async () => {
      const mockReview = createMockReview();
      mockReviewService.createReview.mockResolvedValue(mockReview);
      mockReq.body = { ticketId: 1, rating: 5 };

      await createReview(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.any(Object),
        "Review created successfully",
        201
      );
    });

    it("should spread request body and add userId", async () => {
      const mockReview = createMockReview();
      mockReviewService.createReview.mockResolvedValue(mockReview);
      mockReq.body = {
        ticketId: 2,
        rating: 3,
        comment: "Average event",
      };

      await createReview(mockReq, mockRes);

      expect(mockReviewService.createReview).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 2,
          rating: 3,
          comment: "Average event",
          userId: 1,
        })
      );
    });

    it("should handle validation errors with 400 status", async () => {
      mockReviewService.createReview.mockRejectedValue(
        new Error("Rating must be between 1 and 5")
      );
      mockReq.body = { ticketId: 1, rating: 10 };

      await createReview(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Rating must be between 1 and 5",
        400
      );
    });

    it("should handle ticket not found error", async () => {
      mockReviewService.createReview.mockRejectedValue(
        new Error("Ticket not found")
      );
      mockReq.body = { ticketId: 999, rating: 5 };

      await createReview(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Ticket not found",
        400
      );
    });

    it("should return 400 status on error", async () => {
      mockReviewService.createReview.mockRejectedValue(
        new Error("Validation error")
      );
      mockReq.body = {};

      await createReview(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Validation error",
        400
      );
    });
  });

  describe("getAllReviews", () => {
    it("should get all reviews successfully", async () => {
      const mockReviews = createMockPaginatedReviews();
      mockReviewService.getAllReviews.mockResolvedValue(mockReviews);

      await getAllReviews(mockReq, mockRes);

      expect(mockReviewService.getAllReviews).toHaveBeenCalledWith(
        mockReq.query
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockReviews);
    });

    it("should handle error when getting reviews fails", async () => {
      mockReviewService.getAllReviews.mockRejectedValue(
        new Error("Database error")
      );

      await getAllReviews(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });

    it("should pass query parameters to service", async () => {
      const mockReviews = createMockPaginatedReviews();
      mockReviewService.getAllReviews.mockResolvedValue(mockReviews);
      mockReq.query = { page: "1", limit: "10", rating: "5" };

      await getAllReviews(mockReq, mockRes);

      expect(mockReviewService.getAllReviews).toHaveBeenCalledWith({
        page: "1",
        limit: "10",
        rating: "5",
      });
    });

    it("should handle empty query parameters", async () => {
      const mockReviews = createMockPaginatedReviews();
      mockReviewService.getAllReviews.mockResolvedValue(mockReviews);
      mockReq.query = {};

      await getAllReviews(mockReq, mockRes);

      expect(mockReviewService.getAllReviews).toHaveBeenCalledWith({});
    });

    it("should not require admin role", async () => {
      const mockReviews = createMockPaginatedReviews();
      mockReviewService.getAllReviews.mockResolvedValue(mockReviews);
      mockReq.user.role = "user";

      await getAllReviews(mockReq, mockRes);

      expect(mockReviewService.getAllReviews).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockReviews);
    });

    it("should return 400 status on error", async () => {
      mockReviewService.getAllReviews.mockRejectedValue(
        new Error("Failed to fetch reviews")
      );

      await getAllReviews(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Failed to fetch reviews",
        400
      );
    });
  });

  describe("getReviewById", () => {
    it("should get review by id successfully", async () => {
      const mockReview = createMockReview();
      mockReviewService.getReviewById.mockResolvedValue(mockReview);
      mockReq.params = { id: "1" };

      await getReviewById(mockReq, mockRes);

      expect(mockReviewService.getReviewById).toHaveBeenCalledWith(1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockReview);
    });

    it("should handle error when getting review fails", async () => {
      mockReviewService.getReviewById.mockRejectedValue(
        new Error("Review not found")
      );
      mockReq.params = { id: "999" };

      await getReviewById(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Review not found",
        404
      );
    });

    it("should convert params.id to number", async () => {
      const mockReview = createMockReview();
      mockReviewService.getReviewById.mockResolvedValue(mockReview);
      mockReq.params = { id: "5" };

      await getReviewById(mockReq, mockRes);

      expect(mockReviewService.getReviewById).toHaveBeenCalledWith(5);
    });

    it("should return 404 status on error", async () => {
      mockReviewService.getReviewById.mockRejectedValue(
        new Error("Review not found")
      );
      mockReq.params = { id: "999" };

      await getReviewById(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Review not found",
        404
      );
    });

    it("should not pass status code for default success response", async () => {
      const mockReview = createMockReview();
      mockReviewService.getReviewById.mockResolvedValue(mockReview);
      mockReq.params = { id: "1" };

      await getReviewById(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockReview);
      expect(mockSuccessResponse).not.toHaveBeenCalledWith(
        mockRes,
        mockReview,
        expect.anything(),
        expect.any(Number)
      );
    });
  });

  describe("getReviewsByTicket", () => {
    it("should get reviews by ticket successfully", async () => {
      const mockReviews = createMockPaginatedReviews();
      mockReviewService.getReviewsByTicket.mockResolvedValue(mockReviews);
      mockReq.params = { ticketId: "1" };

      await getReviewsByTicket(mockReq, mockRes);

      expect(mockReviewService.getReviewsByTicket).toHaveBeenCalledWith(
        1,
        mockReq.query
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockReviews);
    });

    it("should handle error when getting reviews by ticket fails", async () => {
      mockReviewService.getReviewsByTicket.mockRejectedValue(
        new Error("Ticket not found")
      );
      mockReq.params = { ticketId: "999" };

      await getReviewsByTicket(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Ticket not found",
        404
      );
    });

    it("should convert params.ticketId to number", async () => {
      const mockReviews = createMockPaginatedReviews();
      mockReviewService.getReviewsByTicket.mockResolvedValue(mockReviews);
      mockReq.params = { ticketId: "3" };

      await getReviewsByTicket(mockReq, mockRes);

      expect(mockReviewService.getReviewsByTicket).toHaveBeenCalledWith(
        3,
        expect.any(Object)
      );
    });

    it("should pass query parameters to service", async () => {
      const mockReviews = createMockPaginatedReviews();
      mockReviewService.getReviewsByTicket.mockResolvedValue(mockReviews);
      mockReq.params = { ticketId: "1" };
      mockReq.query = { page: "1", limit: "10" };

      await getReviewsByTicket(mockReq, mockRes);

      expect(mockReviewService.getReviewsByTicket).toHaveBeenCalledWith(1, {
        page: "1",
        limit: "10",
      });
    });

    it("should handle empty query parameters", async () => {
      const mockReviews = createMockPaginatedReviews();
      mockReviewService.getReviewsByTicket.mockResolvedValue(mockReviews);
      mockReq.params = { ticketId: "1" };
      mockReq.query = {};

      await getReviewsByTicket(mockReq, mockRes);

      expect(mockReviewService.getReviewsByTicket).toHaveBeenCalledWith(1, {});
    });

    it("should return 404 status on error", async () => {
      mockReviewService.getReviewsByTicket.mockRejectedValue(
        new Error("No reviews found for this ticket")
      );
      mockReq.params = { ticketId: "1" };

      await getReviewsByTicket(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "No reviews found for this ticket",
        404
      );
    });
  });

  describe("getReviewsByUser", () => {
    it("should get reviews by user successfully", async () => {
      const mockReviews = createMockPaginatedReviews();
      mockReviewService.getReviewsByUser.mockResolvedValue(mockReviews);
      mockReq.params = { userId: "1" };

      await getReviewsByUser(mockReq, mockRes);

      expect(mockReviewService.getReviewsByUser).toHaveBeenCalledWith(
        1,
        mockReq.query
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockReviews);
    });

    it("should handle error when getting reviews by user fails", async () => {
      mockReviewService.getReviewsByUser.mockRejectedValue(
        new Error("User not found")
      );
      mockReq.params = { userId: "999" };

      await getReviewsByUser(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "User not found",
        404
      );
    });

    it("should convert params.userId to number", async () => {
      const mockReviews = createMockPaginatedReviews();
      mockReviewService.getReviewsByUser.mockResolvedValue(mockReviews);
      mockReq.params = { userId: "7" };

      await getReviewsByUser(mockReq, mockRes);

      expect(mockReviewService.getReviewsByUser).toHaveBeenCalledWith(
        7,
        expect.any(Object)
      );
    });

    it("should pass query parameters to service", async () => {
      const mockReviews = createMockPaginatedReviews();
      mockReviewService.getReviewsByUser.mockResolvedValue(mockReviews);
      mockReq.params = { userId: "1" };
      mockReq.query = { page: "2", limit: "20" };

      await getReviewsByUser(mockReq, mockRes);

      expect(mockReviewService.getReviewsByUser).toHaveBeenCalledWith(1, {
        page: "2",
        limit: "20",
      });
    });

    it("should handle empty query parameters", async () => {
      const mockReviews = createMockPaginatedReviews();
      mockReviewService.getReviewsByUser.mockResolvedValue(mockReviews);
      mockReq.params = { userId: "1" };
      mockReq.query = {};

      await getReviewsByUser(mockReq, mockRes);

      expect(mockReviewService.getReviewsByUser).toHaveBeenCalledWith(1, {});
    });

    it("should return 404 status on error", async () => {
      mockReviewService.getReviewsByUser.mockRejectedValue(
        new Error("No reviews found for this user")
      );
      mockReq.params = { userId: "1" };

      await getReviewsByUser(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "No reviews found for this user",
        404
      );
    });
  });

  describe("updateReview", () => {
    it("should update review successfully", async () => {
      const mockReview = createMockReview({ rating: 4, comment: "Updated" });
      mockReviewService.updateReview.mockResolvedValue(mockReview);
      mockReq.params = { id: "1" };
      mockReq.body = { rating: 4, comment: "Updated" };

      await updateReview(mockReq, mockRes);

      expect(mockReviewService.updateReview).toHaveBeenCalledWith(1, 1, {
        rating: 4,
        comment: "Updated",
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockReview,
        "Review updated successfully"
      );
    });

    it("should handle error when updating review fails", async () => {
      mockReviewService.updateReview.mockRejectedValue(
        new Error("Review not found")
      );
      mockReq.params = { id: "999" };
      mockReq.body = { rating: 4 };

      await updateReview(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Review not found",
        400
      );
    });

    it("should convert params.id to number", async () => {
      const mockReview = createMockReview();
      mockReviewService.updateReview.mockResolvedValue(mockReview);
      mockReq.params = { id: "5" };
      mockReq.body = { rating: 3 };

      await updateReview(mockReq, mockRes);

      expect(mockReviewService.updateReview).toHaveBeenCalledWith(
        5,
        expect.any(Number),
        expect.any(Object)
      );
    });

    it("should pass user ID to service for authorization", async () => {
      const mockReview = createMockReview();
      mockReviewService.updateReview.mockResolvedValue(mockReview);
      mockReq.params = { id: "1" };
      mockReq.user.id = 3;
      mockReq.body = { rating: 5 };

      await updateReview(mockReq, mockRes);

      expect(mockReviewService.updateReview).toHaveBeenCalledWith(
        1,
        3,
        expect.any(Object)
      );
    });

    it("should pass request body to service", async () => {
      const mockReview = createMockReview();
      mockReviewService.updateReview.mockResolvedValue(mockReview);
      mockReq.params = { id: "1" };
      mockReq.body = { rating: 2, comment: "Not good" };

      await updateReview(mockReq, mockRes);

      expect(mockReviewService.updateReview).toHaveBeenCalledWith(1, 1, {
        rating: 2,
        comment: "Not good",
      });
    });

    it("should handle unauthorized update error", async () => {
      mockReviewService.updateReview.mockRejectedValue(
        new Error("Unauthorized to update this review")
      );
      mockReq.params = { id: "1" };
      mockReq.body = { rating: 5 };

      await updateReview(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized to update this review",
        400
      );
    });

    it("should return 400 status on error", async () => {
      mockReviewService.updateReview.mockRejectedValue(
        new Error("Validation error")
      );
      mockReq.params = { id: "1" };
      mockReq.body = {};

      await updateReview(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Validation error",
        400
      );
    });
  });

  describe("deleteReview", () => {
    it("should delete review successfully", async () => {
      mockReviewService.deleteReview.mockResolvedValue();
      mockReq.params = { id: "1" };

      await deleteReview(mockReq, mockRes);

      expect(mockReviewService.deleteReview).toHaveBeenCalledWith(1, 1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Review deleted successfully"
      );
    });

    it("should handle error when deleting review fails", async () => {
      mockReviewService.deleteReview.mockRejectedValue(
        new Error("Review not found")
      );
      mockReq.params = { id: "999" };

      await deleteReview(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Review not found",
        400
      );
    });

    it("should convert params.id to number", async () => {
      mockReviewService.deleteReview.mockResolvedValue();
      mockReq.params = { id: "7" };

      await deleteReview(mockReq, mockRes);

      expect(mockReviewService.deleteReview).toHaveBeenCalledWith(
        7,
        expect.any(Number)
      );
    });

    it("should pass user ID to service for authorization", async () => {
      mockReviewService.deleteReview.mockResolvedValue();
      mockReq.params = { id: "1" };
      mockReq.user.id = 4;

      await deleteReview(mockReq, mockRes);

      expect(mockReviewService.deleteReview).toHaveBeenCalledWith(1, 4);
    });

    it("should return null data on success", async () => {
      mockReviewService.deleteReview.mockResolvedValue();
      mockReq.params = { id: "1" };

      await deleteReview(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Review deleted successfully"
      );
    });

    it("should handle unauthorized delete error", async () => {
      mockReviewService.deleteReview.mockRejectedValue(
        new Error("Unauthorized to delete this review")
      );
      mockReq.params = { id: "1" };

      await deleteReview(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized to delete this review",
        400
      );
    });

    it("should return 400 status on error", async () => {
      mockReviewService.deleteReview.mockRejectedValue(
        new Error("Database error")
      );
      mockReq.params = { id: "1" };

      await deleteReview(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });
  });
});
