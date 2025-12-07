/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock functions
// ---------------------------
const mockReview = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

const mockPrisma = {
  review: mockReview,
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
  createReview,
  findAllReviews,
  findReviewById,
  findReviewsByTicket,
  findReviewsByUser,
  updateReview,
  deleteReview,
} = await import("../../repositories/review.repository.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Review Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock user
  const createMockUser = (overrides = {}) => ({
    id: 1,
    name: "John Doe",
    ...overrides,
  });

  // Helper function to create mock event
  const createMockEvent = (overrides = {}) => ({
    id: 1,
    name: "GiggleFest 2025",
    description: "Annual comedy festival",
    date: new Date("2025-12-31T19:00:00.000Z"),
    location: "Jakarta Convention Center",
    ...overrides,
  });

  // Helper function to create mock category
  const createMockCategory = (overrides = {}) => ({
    id: 1,
    name: "VIP",
    description: "VIP seating area",
    ...overrides,
  });

  // Helper function to create mock ticket
  const createMockTicket = (overrides = {}) => ({
    id: 1,
    name: "VIP Ticket",
    event: createMockEvent(),
    category: createMockCategory(),
    ...overrides,
  });

  // Helper function to create mock review
  const createMockReview = (overrides = {}) => ({
    id: 1,
    userId: 1,
    ticketId: 1,
    rating: 5,
    comment: "Amazing event! Highly recommended.",
    createdAt: new Date("2025-12-01T10:00:00.000Z"),
    updatedAt: new Date("2025-12-01T10:00:00.000Z"),
    user: createMockUser(),
    ticket: createMockTicket(),
    ...overrides,
  });

  describe("createReview", () => {
    test("should create review with user and ticket connections", async () => {
      const reviewData = {
        userId: 5,
        ticketId: 3,
        rating: 5,
        comment: "Excellent experience!",
      };

      const expectedReview = createMockReview({
        id: 10,
        userId: 5,
        ticketId: 3,
        rating: 5,
        comment: "Excellent experience!",
      });

      mockReview.create.mockResolvedValue(expectedReview);

      const result = await createReview(reviewData);

      expect(mockReview.create).toHaveBeenCalledTimes(1);
      expect(mockReview.create).toHaveBeenCalledWith({
        data: {
          rating: 5,
          comment: "Excellent experience!",
          user: {
            connect: {
              id: 5,
            },
          },
          ticket: {
            connect: {
              id: 3,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          ticket: {
            select: {
              id: true,
              name: true,
              event: true,
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(expectedReview);
      expect(result.rating).toBe(5);
      expect(result.comment).toBe("Excellent experience!");
    });

    test("should create review with minimum rating", async () => {
      const reviewData = {
        userId: 2,
        ticketId: 1,
        rating: 1,
        comment: "Not satisfied",
      };

      const expectedReview = createMockReview({
        ...reviewData,
        id: 20,
      });

      mockReview.create.mockResolvedValue(expectedReview);

      const result = await createReview(reviewData);

      expect(result.rating).toBe(1);
    });

    test("should create review with maximum rating", async () => {
      const reviewData = {
        userId: 3,
        ticketId: 2,
        rating: 5,
        comment: "Perfect!",
      };

      const expectedReview = createMockReview({
        ...reviewData,
        id: 30,
      });

      mockReview.create.mockResolvedValue(expectedReview);

      const result = await createReview(reviewData);

      expect(result.rating).toBe(5);
    });

    test("should include user details in response", async () => {
      const reviewData = {
        userId: 1,
        ticketId: 1,
        rating: 4,
        comment: "Good event",
      };

      const expectedReview = createMockReview({
        ...reviewData,
        user: createMockUser({ id: 1, name: "Jane Doe" }),
      });

      mockReview.create.mockResolvedValue(expectedReview);

      const result = await createReview(reviewData);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(1);
      expect(result.user.name).toBe("Jane Doe");
      expect(result.user).not.toHaveProperty("email");
      expect(result.user).not.toHaveProperty("password");
    });

    test("should include ticket with event and category in response", async () => {
      const reviewData = {
        userId: 1,
        ticketId: 2,
        rating: 5,
        comment: "Great event",
      };

      const expectedReview = createMockReview({
        ...reviewData,
        ticket: createMockTicket({
          id: 2,
          name: "Regular Ticket",
        }),
      });

      mockReview.create.mockResolvedValue(expectedReview);

      const result = await createReview(reviewData);

      expect(result.ticket).toBeDefined();
      expect(result.ticket.id).toBe(2);
      expect(result.ticket.name).toBe("Regular Ticket");
      expect(result.ticket.event).toBeDefined();
      expect(result.ticket.category).toBeDefined();
    });

    test("should use connect syntax for relations", async () => {
      const reviewData = {
        userId: 10,
        ticketId: 15,
        rating: 4,
        comment: "Nice",
      };

      mockReview.create.mockResolvedValue(createMockReview(reviewData));

      await createReview(reviewData);

      const callArgs = mockReview.create.mock.calls[0][0];
      expect(callArgs.data.user).toEqual({ connect: { id: 10 } });
      expect(callArgs.data.ticket).toEqual({ connect: { id: 15 } });
    });
  });

  describe("findAllReviews", () => {
    test("should return paginated reviews", async () => {
      const options = { page: 1, limit: 10 };
      const mockReviews = [
        createMockReview({ id: 1, rating: 5 }),
        createMockReview({ id: 2, rating: 4 }),
        createMockReview({ id: 3, rating: 3 }),
      ];
      const totalCount = 25;

      mockReview.count.mockResolvedValue(totalCount);
      mockReview.findMany.mockResolvedValue(mockReviews);

      const result = await findAllReviews(options);

      expect(mockReview.count).toHaveBeenCalledTimes(1);
      expect(mockReview.count).toHaveBeenCalledWith();

      expect(mockReview.findMany).toHaveBeenCalledTimes(1);
      expect(mockReview.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          ticket: {
            select: {
              id: true,
              name: true,
              event: true,
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result.reviews).toEqual(mockReviews);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    test("should handle pagination for page 2", async () => {
      const options = { page: 2, limit: 5 };

      mockReview.count.mockResolvedValue(12);
      mockReview.findMany.mockResolvedValue([]);

      const result = await findAllReviews(options);

      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * 5
          take: 5,
        })
      );

      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(3);
    });

    test("should use default pagination values", async () => {
      const options = {};

      mockReview.count.mockResolvedValue(5);
      mockReview.findMany.mockResolvedValue([]);

      const result = await findAllReviews(options);

      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    test("should convert string pagination values to numbers", async () => {
      const options = { page: "3", limit: "15" };

      mockReview.count.mockResolvedValue(50);
      mockReview.findMany.mockResolvedValue([]);

      const result = await findAllReviews(options);

      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(15);
      expect(typeof result.meta.page).toBe("number");
      expect(typeof result.meta.limit).toBe("number");
    });

    test("should order reviews by createdAt descending", async () => {
      const options = { page: 1, limit: 10 };

      mockReview.count.mockResolvedValue(5);
      mockReview.findMany.mockResolvedValue([]);

      await findAllReviews(options);

      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: "desc",
          },
        })
      );
    });

    test("should return empty array when no reviews found", async () => {
      const options = { page: 1, limit: 10 };

      mockReview.count.mockResolvedValue(0);
      mockReview.findMany.mockResolvedValue([]);

      const result = await findAllReviews(options);

      expect(result.reviews).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    test("should calculate totalPages correctly", async () => {
      const options = { page: 1, limit: 7 };

      mockReview.count.mockResolvedValue(20);
      mockReview.findMany.mockResolvedValue([]);

      const result = await findAllReviews(options);

      // Math.ceil(20 / 7) = 3
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe("findReviewById", () => {
    test("should find review by id with user and ticket details", async () => {
      const reviewId = 1;
      const expectedReview = createMockReview({ id: reviewId });

      mockReview.findUnique.mockResolvedValue(expectedReview);

      const result = await findReviewById(reviewId);

      expect(mockReview.findUnique).toHaveBeenCalledTimes(1);
      expect(mockReview.findUnique).toHaveBeenCalledWith({
        where: { id: reviewId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          ticket: {
            select: {
              id: true,
              name: true,
              event: true,
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(expectedReview);
      expect(result.id).toBe(reviewId);
    });

    test("should return null when review not found", async () => {
      const reviewId = 999;

      mockReview.findUnique.mockResolvedValue(null);

      const result = await findReviewById(reviewId);

      expect(mockReview.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test("should include user and ticket details", async () => {
      const reviewId = 5;
      const expectedReview = createMockReview({ id: reviewId });

      mockReview.findUnique.mockResolvedValue(expectedReview);

      const result = await findReviewById(reviewId);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.name).toBeDefined();
      expect(result.ticket).toBeDefined();
      expect(result.ticket.event).toBeDefined();
      expect(result.ticket.category).toBeDefined();
    });
  });

  describe("findReviewsByTicket", () => {
    test("should return paginated reviews for a ticket", async () => {
      const ticketId = 5;
      const options = { page: 1, limit: 10 };
      const mockReviews = [
        createMockReview({ id: 1, ticketId: 5, rating: 5 }),
        createMockReview({ id: 2, ticketId: 5, rating: 4 }),
      ];
      const totalCount = 15;

      mockReview.count.mockResolvedValue(totalCount);
      mockReview.findMany.mockResolvedValue(mockReviews);

      const result = await findReviewsByTicket(ticketId, options);

      expect(mockReview.count).toHaveBeenCalledTimes(1);
      expect(mockReview.count).toHaveBeenCalledWith({
        where: { ticketId: 5 },
      });

      expect(mockReview.findMany).toHaveBeenCalledTimes(1);
      expect(mockReview.findMany).toHaveBeenCalledWith({
        where: { ticketId: 5 },
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          ticket: {
            select: {
              id: true,
              name: true,
              event: true,
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result.reviews).toEqual(mockReviews);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2,
      });
    });

    test("should handle pagination for ticket reviews", async () => {
      const ticketId = 3;
      const options = { page: 2, limit: 5 };

      mockReview.count.mockResolvedValue(12);
      mockReview.findMany.mockResolvedValue([]);

      const result = await findReviewsByTicket(ticketId, options);

      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ticketId: 3 },
          skip: 5,
          take: 5,
        })
      );

      expect(result.meta.page).toBe(2);
    });

    test("should use default pagination values for ticket reviews", async () => {
      const ticketId = 1;
      const options = {};

      mockReview.count.mockResolvedValue(3);
      mockReview.findMany.mockResolvedValue([]);

      const result = await findReviewsByTicket(ticketId, options);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    test("should return empty array when ticket has no reviews", async () => {
      const ticketId = 999;
      const options = { page: 1, limit: 10 };

      mockReview.count.mockResolvedValue(0);
      mockReview.findMany.mockResolvedValue([]);

      const result = await findReviewsByTicket(ticketId, options);

      expect(result.reviews).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    test("should filter reviews by ticketId", async () => {
      const ticketId = 10;
      const options = { page: 1, limit: 10 };

      mockReview.count.mockResolvedValue(5);
      mockReview.findMany.mockResolvedValue([]);

      await findReviewsByTicket(ticketId, options);

      expect(mockReview.count).toHaveBeenCalledWith({
        where: { ticketId: 10 },
      });

      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ticketId: 10 },
        })
      );
    });
  });

  describe("findReviewsByUser", () => {
    test("should return paginated reviews for a user", async () => {
      const userId = 3;
      const options = { page: 1, limit: 10 };
      const mockReviews = [
        createMockReview({ id: 1, userId: 3, rating: 5 }),
        createMockReview({ id: 2, userId: 3, rating: 4 }),
      ];
      const totalCount = 8;

      mockReview.count.mockResolvedValue(totalCount);
      mockReview.findMany.mockResolvedValue(mockReviews);

      const result = await findReviewsByUser(userId, options);

      expect(mockReview.count).toHaveBeenCalledTimes(1);
      expect(mockReview.count).toHaveBeenCalledWith({
        where: { userId: 3 },
      });

      expect(mockReview.findMany).toHaveBeenCalledTimes(1);
      expect(mockReview.findMany).toHaveBeenCalledWith({
        where: { userId: 3 },
        skip: 0,
        take: 10,
        include: {
          ticket: {
            select: {
              id: true,
              name: true,
              event: true,
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result.reviews).toEqual(mockReviews);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 8,
        totalPages: 1,
      });
    });

    test("should not include user details in findReviewsByUser", async () => {
      const userId = 1;
      const options = { page: 1, limit: 10 };

      mockReview.count.mockResolvedValue(5);
      mockReview.findMany.mockResolvedValue([]);

      await findReviewsByUser(userId, options);

      const callArgs = mockReview.findMany.mock.calls[0][0];
      expect(callArgs.include.user).toBeUndefined();
      expect(callArgs.include.ticket).toBeDefined();
    });

    test("should handle pagination for user reviews", async () => {
      const userId = 2;
      const options = { page: 3, limit: 5 };

      mockReview.count.mockResolvedValue(20);
      mockReview.findMany.mockResolvedValue([]);

      const result = await findReviewsByUser(userId, options);

      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 2 },
          skip: 10, // (page 3 - 1) * 5
          take: 5,
        })
      );

      expect(result.meta.page).toBe(3);
      expect(result.meta.totalPages).toBe(4);
    });

    test("should use default pagination values for user reviews", async () => {
      const userId = 5;
      const options = {};

      mockReview.count.mockResolvedValue(3);
      mockReview.findMany.mockResolvedValue([]);

      const result = await findReviewsByUser(userId, options);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    test("should return empty array when user has no reviews", async () => {
      const userId = 999;
      const options = { page: 1, limit: 10 };

      mockReview.count.mockResolvedValue(0);
      mockReview.findMany.mockResolvedValue([]);

      const result = await findReviewsByUser(userId, options);

      expect(result.reviews).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    test("should filter reviews by userId", async () => {
      const userId = 7;
      const options = { page: 1, limit: 10 };

      mockReview.count.mockResolvedValue(5);
      mockReview.findMany.mockResolvedValue([]);

      await findReviewsByUser(userId, options);

      expect(mockReview.count).toHaveBeenCalledWith({
        where: { userId: 7 },
      });

      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 7 },
        })
      );
    });
  });

  describe("updateReview", () => {
    test("should update review with user authorization", async () => {
      const reviewId = 1;
      const userId = 5;
      const updateData = {
        rating: 4,
        comment: "Updated review",
      };

      const updatedReview = createMockReview({
        id: reviewId,
        userId: userId,
        rating: 4,
        comment: "Updated review",
        updatedAt: new Date("2025-12-06T15:00:00.000Z"),
      });

      mockReview.update.mockResolvedValue(updatedReview);

      const result = await updateReview(reviewId, userId, updateData);

      expect(mockReview.update).toHaveBeenCalledTimes(1);
      expect(mockReview.update).toHaveBeenCalledWith({
        where: {
          id: reviewId,
          userId: userId,
        },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          ticket: {
            select: {
              id: true,
              name: true,
              event: true,
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(updatedReview);
      expect(result.rating).toBe(4);
      expect(result.comment).toBe("Updated review");
    });

    test("should update only rating", async () => {
      const reviewId = 2;
      const userId = 3;
      const updateData = { rating: 5 };

      const updatedReview = createMockReview({
        id: reviewId,
        userId: userId,
        rating: 5,
      });

      mockReview.update.mockResolvedValue(updatedReview);

      const result = await updateReview(reviewId, userId, updateData);

      expect(result.rating).toBe(5);
    });

    test("should update only comment", async () => {
      const reviewId = 3;
      const userId = 1;
      const updateData = { comment: "New comment only" };

      const updatedReview = createMockReview({
        id: reviewId,
        userId: userId,
        comment: "New comment only",
      });

      mockReview.update.mockResolvedValue(updatedReview);

      const result = await updateReview(reviewId, userId, updateData);

      expect(result.comment).toBe("New comment only");
    });

    test("should ensure userId matches in where clause", async () => {
      const reviewId = 5;
      const userId = 8;
      const updateData = { rating: 3 };

      mockReview.update.mockResolvedValue(
        createMockReview({ id: reviewId, userId: userId, rating: 3 })
      );

      await updateReview(reviewId, userId, updateData);

      const callArgs = mockReview.update.mock.calls[0][0];
      expect(callArgs.where).toEqual({ id: reviewId, userId: userId });
    });

    test("should include user and ticket details in response", async () => {
      const reviewId = 6;
      const userId = 2;
      const updateData = { rating: 5, comment: "Perfect!" };

      const updatedReview = createMockReview({
        id: reviewId,
        userId: userId,
        ...updateData,
      });

      mockReview.update.mockResolvedValue(updatedReview);

      const result = await updateReview(reviewId, userId, updateData);

      expect(result.user).toBeDefined();
      expect(result.ticket).toBeDefined();
      expect(result.ticket.event).toBeDefined();
      expect(result.ticket.category).toBeDefined();
    });
  });

  describe("deleteReview", () => {
    test("should delete review with user authorization", async () => {
      const reviewId = 1;
      const userId = 5;
      const deletedReview = createMockReview({
        id: reviewId,
        userId: userId,
      });

      mockReview.delete.mockResolvedValue(deletedReview);

      const result = await deleteReview(reviewId, userId);

      expect(mockReview.delete).toHaveBeenCalledTimes(1);
      expect(mockReview.delete).toHaveBeenCalledWith({
        where: {
          id: reviewId,
          userId: userId,
        },
      });

      expect(result).toEqual(deletedReview);
      expect(result.id).toBe(reviewId);
      expect(result.userId).toBe(userId);
    });

    test("should ensure userId matches when deleting", async () => {
      const reviewId = 10;
      const userId = 3;

      mockReview.delete.mockResolvedValue(
        createMockReview({ id: reviewId, userId: userId })
      );

      await deleteReview(reviewId, userId);

      const callArgs = mockReview.delete.mock.calls[0][0];
      expect(callArgs.where).toEqual({ id: reviewId, userId: userId });
    });

    test("should delete review and return deleted data", async () => {
      const reviewId = 15;
      const userId = 7;
      const deletedReview = createMockReview({
        id: reviewId,
        userId: userId,
        rating: 4,
        comment: "This will be deleted",
      });

      mockReview.delete.mockResolvedValue(deletedReview);

      const result = await deleteReview(reviewId, userId);

      expect(result.id).toBe(reviewId);
      expect(result.rating).toBe(4);
      expect(result.comment).toBe("This will be deleted");
    });

    test("should handle deleting different reviews", async () => {
      const review1 = createMockReview({ id: 1, userId: 1 });
      const review2 = createMockReview({ id: 2, userId: 2 });

      mockReview.delete
        .mockResolvedValueOnce(review1)
        .mockResolvedValueOnce(review2);

      const result1 = await deleteReview(1, 1);
      const result2 = await deleteReview(2, 2);

      expect(result1).toEqual(review1);
      expect(result2).toEqual(review2);
      expect(mockReview.delete).toHaveBeenCalledTimes(2);
    });
  });
});
