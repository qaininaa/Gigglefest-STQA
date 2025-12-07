import { jest } from "@jest/globals";

// Mock all dependencies
jest.unstable_mockModule(
  "../../../src/repositories/review.repository.js",
  () => ({
    createReview: jest.fn(),
    findAllReviews: jest.fn(),
    findReviewById: jest.fn(),
    findReviewsByTicket: jest.fn(),
    findReviewsByUser: jest.fn(),
    updateReview: jest.fn(),
    deleteReview: jest.fn(),
  })
);

jest.unstable_mockModule(
  "../../../src/repositories/ticket.repository.js",
  () => ({
    findTicketById: jest.fn(),
  })
);

// Import mocked modules
const reviewRepository = await import(
  "../../../src/repositories/review.repository.js"
);
const ticketRepository = await import(
  "../../../src/repositories/ticket.repository.js"
);

// Import service to test
const {
  createReview,
  getAllReviews,
  getReviewById,
  getReviewsByTicket,
  getReviewsByUser,
  updateReview,
  deleteReview,
} = await import("../../../src/services/review.service.js");

describe("Review Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper functions
  const createMockTicket = (overrides = {}) => ({
    id: 1,
    name: "VIP Ticket",
    price: 100000,
    quantity: 50,
    ...overrides,
  });

  const createMockReview = (overrides = {}) => ({
    id: 1,
    ticketId: 1,
    userId: 1,
    rating: 5,
    comment: "Great event!",
    user: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    },
    ticket: {
      id: 1,
      name: "VIP Ticket",
    },
    createdAt: new Date(),
    ...overrides,
  });

  describe("createReview", () => {
    const reviewData = {
      ticketId: 1,
      userId: 1,
      rating: 5,
      comment: "Amazing event!",
    };

    test("should create review successfully", async () => {
      const mockTicket = createMockTicket();
      const mockReview = createMockReview();
      const mockExistingReviews = {
        reviews: [],
        pagination: { page: 1, limit: 100, total: 0 },
      };

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      reviewRepository.findReviewsByTicket.mockResolvedValue(
        mockExistingReviews
      );
      reviewRepository.createReview.mockResolvedValue(mockReview);

      const result = await createReview(reviewData);

      expect(ticketRepository.findTicketById).toHaveBeenCalledWith(1);
      expect(reviewRepository.findReviewsByTicket).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 100,
      });
      expect(reviewRepository.createReview).toHaveBeenCalledWith(reviewData);
      expect(result).toEqual(mockReview);
    });

    test("should throw error if ticket not found", async () => {
      ticketRepository.findTicketById.mockResolvedValue(null);

      await expect(createReview(reviewData)).rejects.toThrow(
        "Ticket not found"
      );
      expect(reviewRepository.findReviewsByTicket).not.toHaveBeenCalled();
      expect(reviewRepository.createReview).not.toHaveBeenCalled();
    });

    test("should throw error if user has already reviewed the ticket", async () => {
      const mockTicket = createMockTicket();
      const mockExistingReviews = {
        reviews: [
          createMockReview({
            id: 1,
            userId: 1,
            user: { id: 1, name: "John Doe" },
          }),
        ],
        pagination: { page: 1, limit: 100, total: 1 },
      };

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      reviewRepository.findReviewsByTicket.mockResolvedValue(
        mockExistingReviews
      );

      await expect(createReview(reviewData)).rejects.toThrow(
        "You have already reviewed this ticket"
      );
      expect(reviewRepository.createReview).not.toHaveBeenCalled();
    });

    test("should allow review if existing reviews are from different users", async () => {
      const mockTicket = createMockTicket();
      const mockExistingReviews = {
        reviews: [
          createMockReview({
            id: 1,
            userId: 2,
            user: { id: 2, name: "Jane Doe" },
          }),
          createMockReview({
            id: 2,
            userId: 3,
            user: { id: 3, name: "Bob Smith" },
          }),
        ],
        pagination: { page: 1, limit: 100, total: 2 },
      };
      const mockReview = createMockReview();

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      reviewRepository.findReviewsByTicket.mockResolvedValue(
        mockExistingReviews
      );
      reviewRepository.createReview.mockResolvedValue(mockReview);

      const result = await createReview(reviewData);

      expect(reviewRepository.createReview).toHaveBeenCalledWith(reviewData);
      expect(result).toEqual(mockReview);
    });

    test("should throw error if rating is less than 1", async () => {
      const mockTicket = createMockTicket();
      const mockExistingReviews = {
        reviews: [],
        pagination: { page: 1, limit: 100, total: 0 },
      };

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      reviewRepository.findReviewsByTicket.mockResolvedValue(
        mockExistingReviews
      );

      await expect(createReview({ ...reviewData, rating: 0 })).rejects.toThrow(
        "Rating must be between 1 and 5"
      );
      expect(reviewRepository.createReview).not.toHaveBeenCalled();
    });

    test("should throw error if rating is greater than 5", async () => {
      const mockTicket = createMockTicket();
      const mockExistingReviews = {
        reviews: [],
        pagination: { page: 1, limit: 100, total: 0 },
      };

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      reviewRepository.findReviewsByTicket.mockResolvedValue(
        mockExistingReviews
      );

      await expect(createReview({ ...reviewData, rating: 6 })).rejects.toThrow(
        "Rating must be between 1 and 5"
      );
      expect(reviewRepository.createReview).not.toHaveBeenCalled();
    });

    test("should accept rating of 1", async () => {
      const mockTicket = createMockTicket();
      const mockExistingReviews = {
        reviews: [],
        pagination: { page: 1, limit: 100, total: 0 },
      };
      const mockReview = createMockReview({ rating: 1 });

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      reviewRepository.findReviewsByTicket.mockResolvedValue(
        mockExistingReviews
      );
      reviewRepository.createReview.mockResolvedValue(mockReview);

      const result = await createReview({ ...reviewData, rating: 1 });

      expect(reviewRepository.createReview).toHaveBeenCalledWith({
        ...reviewData,
        rating: 1,
      });
      expect(result).toEqual(mockReview);
    });

    test("should accept rating of 5", async () => {
      const mockTicket = createMockTicket();
      const mockExistingReviews = {
        reviews: [],
        pagination: { page: 1, limit: 100, total: 0 },
      };
      const mockReview = createMockReview({ rating: 5 });

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      reviewRepository.findReviewsByTicket.mockResolvedValue(
        mockExistingReviews
      );
      reviewRepository.createReview.mockResolvedValue(mockReview);

      const result = await createReview({ ...reviewData, rating: 5 });

      expect(reviewRepository.createReview).toHaveBeenCalledWith(reviewData);
      expect(result).toEqual(mockReview);
    });
  });

  describe("getAllReviews", () => {
    test("should get all reviews with default query", async () => {
      const mockReviews = {
        reviews: [createMockReview({ id: 1 }), createMockReview({ id: 2 })],
        pagination: { page: 1, limit: 10, total: 2 },
      };

      reviewRepository.findAllReviews.mockResolvedValue(mockReviews);

      const result = await getAllReviews({});

      expect(reviewRepository.findAllReviews).toHaveBeenCalledWith({});
      expect(result).toEqual(mockReviews);
    });

    test("should get all reviews with pagination", async () => {
      const query = { page: 2, limit: 5 };
      const mockReviews = {
        reviews: [createMockReview()],
        pagination: { page: 2, limit: 5, total: 10 },
      };

      reviewRepository.findAllReviews.mockResolvedValue(mockReviews);

      const result = await getAllReviews(query);

      expect(reviewRepository.findAllReviews).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockReviews);
    });

    test("should get all reviews with filters", async () => {
      const query = { rating: 5, sortBy: "createdAt", sortOrder: "desc" };
      const mockReviews = {
        reviews: [createMockReview({ rating: 5 })],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      reviewRepository.findAllReviews.mockResolvedValue(mockReviews);

      const result = await getAllReviews(query);

      expect(reviewRepository.findAllReviews).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockReviews);
    });

    test("should return empty array when no reviews found", async () => {
      const mockReviews = {
        reviews: [],
        pagination: { page: 1, limit: 10, total: 0 },
      };

      reviewRepository.findAllReviews.mockResolvedValue(mockReviews);

      const result = await getAllReviews({});

      expect(result).toEqual(mockReviews);
    });
  });

  describe("getReviewById", () => {
    test("should get review by ID successfully", async () => {
      const mockReview = createMockReview();

      reviewRepository.findReviewById.mockResolvedValue(mockReview);

      const result = await getReviewById(1);

      expect(reviewRepository.findReviewById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockReview);
    });

    test("should throw error if review not found", async () => {
      reviewRepository.findReviewById.mockResolvedValue(null);

      await expect(getReviewById(999)).rejects.toThrow("Review not found");
    });

    test("should pass correct review ID to repository", async () => {
      const mockReview = createMockReview({ id: 42 });

      reviewRepository.findReviewById.mockResolvedValue(mockReview);

      await getReviewById(42);

      expect(reviewRepository.findReviewById).toHaveBeenCalledWith(42);
    });
  });

  describe("getReviewsByTicket", () => {
    const ticketId = 1;
    const query = { page: 1, limit: 10 };

    test("should get reviews by ticket successfully", async () => {
      const mockTicket = createMockTicket();
      const mockReviews = {
        reviews: [
          createMockReview({ id: 1, ticketId }),
          createMockReview({ id: 2, ticketId }),
        ],
        pagination: { page: 1, limit: 10, total: 2 },
      };

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      reviewRepository.findReviewsByTicket.mockResolvedValue(mockReviews);

      const result = await getReviewsByTicket(ticketId, query);

      expect(ticketRepository.findTicketById).toHaveBeenCalledWith(ticketId);
      expect(reviewRepository.findReviewsByTicket).toHaveBeenCalledWith(
        ticketId,
        query
      );
      expect(result).toEqual(mockReviews);
    });

    test("should throw error if ticket not found", async () => {
      ticketRepository.findTicketById.mockResolvedValue(null);

      await expect(getReviewsByTicket(999, query)).rejects.toThrow(
        "Ticket not found"
      );
      expect(reviewRepository.findReviewsByTicket).not.toHaveBeenCalled();
    });

    test("should pass query parameters correctly", async () => {
      const mockTicket = createMockTicket();
      const customQuery = { page: 3, limit: 20, sortBy: "rating" };
      const mockReviews = {
        reviews: [],
        pagination: { page: 3, limit: 20, total: 0 },
      };

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      reviewRepository.findReviewsByTicket.mockResolvedValue(mockReviews);

      await getReviewsByTicket(ticketId, customQuery);

      expect(reviewRepository.findReviewsByTicket).toHaveBeenCalledWith(
        ticketId,
        customQuery
      );
    });

    test("should return empty reviews if ticket has no reviews", async () => {
      const mockTicket = createMockTicket();
      const mockReviews = {
        reviews: [],
        pagination: { page: 1, limit: 10, total: 0 },
      };

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      reviewRepository.findReviewsByTicket.mockResolvedValue(mockReviews);

      const result = await getReviewsByTicket(ticketId, query);

      expect(result).toEqual(mockReviews);
    });
  });

  describe("getReviewsByUser", () => {
    const userId = 1;
    const query = { page: 1, limit: 10 };

    test("should get reviews by user successfully", async () => {
      const mockReviews = {
        reviews: [
          createMockReview({ id: 1, userId }),
          createMockReview({ id: 2, userId }),
        ],
        pagination: { page: 1, limit: 10, total: 2 },
      };

      reviewRepository.findReviewsByUser.mockResolvedValue(mockReviews);

      const result = await getReviewsByUser(userId, query);

      expect(reviewRepository.findReviewsByUser).toHaveBeenCalledWith(
        userId,
        query
      );
      expect(result).toEqual(mockReviews);
    });

    test("should pass query parameters correctly", async () => {
      const customQuery = { page: 2, limit: 5, sortOrder: "asc" };
      const mockReviews = {
        reviews: [],
        pagination: { page: 2, limit: 5, total: 0 },
      };

      reviewRepository.findReviewsByUser.mockResolvedValue(mockReviews);

      await getReviewsByUser(userId, customQuery);

      expect(reviewRepository.findReviewsByUser).toHaveBeenCalledWith(
        userId,
        customQuery
      );
    });

    test("should return empty array if user has no reviews", async () => {
      const mockReviews = {
        reviews: [],
        pagination: { page: 1, limit: 10, total: 0 },
      };

      reviewRepository.findReviewsByUser.mockResolvedValue(mockReviews);

      const result = await getReviewsByUser(userId, query);

      expect(result).toEqual(mockReviews);
    });

    test("should handle different user IDs", async () => {
      const mockReviews = {
        reviews: [createMockReview({ userId: 99 })],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      reviewRepository.findReviewsByUser.mockResolvedValue(mockReviews);

      await getReviewsByUser(99, query);

      expect(reviewRepository.findReviewsByUser).toHaveBeenCalledWith(
        99,
        query
      );
    });
  });

  describe("updateReview", () => {
    const reviewId = 1;
    const userId = 1;

    test("should update review successfully", async () => {
      const reviewData = { rating: 4, comment: "Updated comment" };
      const mockUpdatedReview = createMockReview({
        rating: 4,
        comment: "Updated comment",
      });

      reviewRepository.updateReview.mockResolvedValue(mockUpdatedReview);

      const result = await updateReview(reviewId, userId, reviewData);

      expect(reviewRepository.updateReview).toHaveBeenCalledWith(
        reviewId,
        userId,
        reviewData
      );
      expect(result).toEqual(mockUpdatedReview);
    });

    test("should update only comment", async () => {
      const reviewData = { comment: "Just updating the comment" };
      const mockUpdatedReview = createMockReview({
        comment: "Just updating the comment",
      });

      reviewRepository.updateReview.mockResolvedValue(mockUpdatedReview);

      const result = await updateReview(reviewId, userId, reviewData);

      expect(reviewRepository.updateReview).toHaveBeenCalledWith(
        reviewId,
        userId,
        reviewData
      );
      expect(result).toEqual(mockUpdatedReview);
    });

    test("should not validate when rating is 0 (falsy value bypasses check)", async () => {
      const reviewData = { rating: 0 };
      const mockUpdatedReview = createMockReview({ rating: 0 });

      reviewRepository.updateReview.mockResolvedValue(mockUpdatedReview);

      const result = await updateReview(reviewId, userId, reviewData);

      expect(reviewRepository.updateReview).toHaveBeenCalledWith(
        reviewId,
        userId,
        reviewData
      );
      expect(result).toEqual(mockUpdatedReview);
    });

    test("should throw error if rating is negative", async () => {
      const reviewData = { rating: -1 };

      await expect(updateReview(reviewId, userId, reviewData)).rejects.toThrow(
        "Rating must be between 1 and 5"
      );
      expect(reviewRepository.updateReview).not.toHaveBeenCalled();
    });

    test("should throw error if rating is greater than 5", async () => {
      const reviewData = { rating: 6 };

      await expect(updateReview(reviewId, userId, reviewData)).rejects.toThrow(
        "Rating must be between 1 and 5"
      );
      expect(reviewRepository.updateReview).not.toHaveBeenCalled();
    });

    test("should accept rating of 1", async () => {
      const reviewData = { rating: 1 };
      const mockUpdatedReview = createMockReview({ rating: 1 });

      reviewRepository.updateReview.mockResolvedValue(mockUpdatedReview);

      const result = await updateReview(reviewId, userId, reviewData);

      expect(reviewRepository.updateReview).toHaveBeenCalledWith(
        reviewId,
        userId,
        reviewData
      );
      expect(result).toEqual(mockUpdatedReview);
    });

    test("should accept rating of 5", async () => {
      const reviewData = { rating: 5 };
      const mockUpdatedReview = createMockReview({ rating: 5 });

      reviewRepository.updateReview.mockResolvedValue(mockUpdatedReview);

      const result = await updateReview(reviewId, userId, reviewData);

      expect(reviewRepository.updateReview).toHaveBeenCalledWith(
        reviewId,
        userId,
        reviewData
      );
      expect(result).toEqual(mockUpdatedReview);
    });

    test("should throw error if review not found (P2025 error)", async () => {
      const reviewData = { rating: 4 };
      const prismaError = new Error("Record not found");
      prismaError.code = "P2025";

      reviewRepository.updateReview.mockRejectedValue(prismaError);

      await expect(updateReview(reviewId, userId, reviewData)).rejects.toThrow(
        "Review not found or you don't have permission to update it"
      );
    });

    test("should throw error if user doesn't have permission (P2025 error)", async () => {
      const reviewData = { comment: "Trying to update" };
      const prismaError = new Error("Record not found");
      prismaError.code = "P2025";

      reviewRepository.updateReview.mockRejectedValue(prismaError);

      await expect(updateReview(reviewId, 999, reviewData)).rejects.toThrow(
        "Review not found or you don't have permission to update it"
      );
    });

    test("should rethrow other errors", async () => {
      const reviewData = { rating: 4 };
      const otherError = new Error("Database connection failed");

      reviewRepository.updateReview.mockRejectedValue(otherError);

      await expect(updateReview(reviewId, userId, reviewData)).rejects.toThrow(
        "Database connection failed"
      );
    });

    test("should validate rating before calling repository", async () => {
      const reviewData = { rating: 10 };

      await expect(updateReview(reviewId, userId, reviewData)).rejects.toThrow(
        "Rating must be between 1 and 5"
      );
      expect(reviewRepository.updateReview).not.toHaveBeenCalled();
    });
  });

  describe("deleteReview", () => {
    const reviewId = 1;
    const userId = 1;

    test("should delete review successfully", async () => {
      const mockDeletedReview = createMockReview();

      reviewRepository.deleteReview.mockResolvedValue(mockDeletedReview);

      const result = await deleteReview(reviewId, userId);

      expect(reviewRepository.deleteReview).toHaveBeenCalledWith(
        reviewId,
        userId
      );
      expect(result).toEqual(mockDeletedReview);
    });

    test("should throw error if review not found (P2025 error)", async () => {
      const prismaError = new Error("Record not found");
      prismaError.code = "P2025";

      reviewRepository.deleteReview.mockRejectedValue(prismaError);

      await expect(deleteReview(reviewId, userId)).rejects.toThrow(
        "Review not found or you don't have permission to delete it"
      );
    });

    test("should throw error if user doesn't have permission (P2025 error)", async () => {
      const prismaError = new Error("Record not found");
      prismaError.code = "P2025";

      reviewRepository.deleteReview.mockRejectedValue(prismaError);

      await expect(deleteReview(reviewId, 999)).rejects.toThrow(
        "Review not found or you don't have permission to delete it"
      );
    });

    test("should rethrow other errors", async () => {
      const otherError = new Error("Database connection failed");

      reviewRepository.deleteReview.mockRejectedValue(otherError);

      await expect(deleteReview(reviewId, userId)).rejects.toThrow(
        "Database connection failed"
      );
    });

    test("should pass correct parameters to repository", async () => {
      const mockDeletedReview = createMockReview({ id: 42, userId: 99 });

      reviewRepository.deleteReview.mockResolvedValue(mockDeletedReview);

      await deleteReview(42, 99);

      expect(reviewRepository.deleteReview).toHaveBeenCalledWith(42, 99);
    });

    test("should handle Prisma error with different message", async () => {
      const prismaError = new Error("The record does not exist");
      prismaError.code = "P2025";

      reviewRepository.deleteReview.mockRejectedValue(prismaError);

      await expect(deleteReview(reviewId, userId)).rejects.toThrow(
        "Review not found or you don't have permission to delete it"
      );
    });
  });
});
