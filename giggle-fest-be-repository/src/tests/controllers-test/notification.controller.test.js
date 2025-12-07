import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the notification service
const mockNotificationService = {
  createNotification: jest.fn(),
  getUserNotifications: jest.fn(),
  markAsRead: jest.fn(),
  markAsUnread: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
};

jest.unstable_mockModule(
  "../../services/notification.service.js",
  () => mockNotificationService
);

// Mock response utilities
const mockSuccessResponse = jest.fn();
const mockErrorResponse = jest.fn();

jest.unstable_mockModule("../../utils/response.js", () => ({
  successResponse: mockSuccessResponse,
  errorResponse: mockErrorResponse,
}));

const {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
} = await import("../../controllers/notification.controller.js");

describe("Notification Controller", () => {
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
  const createMockNotification = (overrides = {}) => ({
    id: 1,
    userId: 1,
    message: "New event available",
    type: "event",
    isRead: false,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  });

  const createMockPaginatedNotifications = () => ({
    data: [
      createMockNotification(),
      createMockNotification({ id: 2, message: "Promo code updated" }),
    ],
    meta: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    },
  });

  describe("createNotification", () => {
    it("should create notification successfully when user is admin", async () => {
      const mockNotification = createMockNotification();
      mockNotificationService.createNotification.mockResolvedValue(
        mockNotification
      );
      mockReq.body = {
        userId: 1,
        message: "New event available",
        type: "event",
      };

      await createNotification(mockReq, mockRes);

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith({
        userId: 1,
        message: "New event available",
        type: "event",
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockNotification,
        "Notification created successfully",
        201
      );
    });

    it("should handle error when creating notification fails", async () => {
      mockNotificationService.createNotification.mockRejectedValue(
        new Error("Database error")
      );
      mockReq.body = { userId: 1, message: "New event available" };

      await createNotification(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.body = { userId: 1, message: "New event available" };

      await createNotification(mockReq, mockRes);

      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.body = { userId: 1, message: "New event available" };

      await createNotification(mockReq, mockRes);

      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should return 201 status code on success", async () => {
      const mockNotification = createMockNotification();
      mockNotificationService.createNotification.mockResolvedValue(
        mockNotification
      );
      mockReq.body = { userId: 1, message: "New event available" };

      await createNotification(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.any(Object),
        "Notification created successfully",
        201
      );
    });

    it("should handle validation errors with 400 status", async () => {
      mockNotificationService.createNotification.mockRejectedValue(
        new Error("Message is required")
      );
      mockReq.body = {};

      await createNotification(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Message is required",
        400
      );
    });

    it("should pass request body to service", async () => {
      const mockNotification = createMockNotification();
      mockNotificationService.createNotification.mockResolvedValue(
        mockNotification
      );
      mockReq.body = {
        userId: "all",
        message: "System maintenance",
        type: "system",
      };

      await createNotification(mockReq, mockRes);

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith({
        userId: "all",
        message: "System maintenance",
        type: "system",
      });
    });
  });

  describe("getUserNotifications", () => {
    it("should get user notifications successfully", async () => {
      const mockNotifications = createMockPaginatedNotifications();
      mockNotificationService.getUserNotifications.mockResolvedValue(
        mockNotifications
      );

      await getUserNotifications(mockReq, mockRes);

      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith(
        1,
        mockReq.query
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockNotifications
      );
    });

    it("should handle error when getting notifications fails", async () => {
      mockNotificationService.getUserNotifications.mockRejectedValue(
        new Error("Database error")
      );

      await getUserNotifications(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });

    it("should use user ID from req.user", async () => {
      const mockNotifications = createMockPaginatedNotifications();
      mockNotificationService.getUserNotifications.mockResolvedValue(
        mockNotifications
      );
      mockReq.user.id = 5;

      await getUserNotifications(mockReq, mockRes);

      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith(
        5,
        expect.any(Object)
      );
    });

    it("should pass query parameters to service", async () => {
      const mockNotifications = createMockPaginatedNotifications();
      mockNotificationService.getUserNotifications.mockResolvedValue(
        mockNotifications
      );
      mockReq.query = { page: "1", limit: "10", isRead: "false" };

      await getUserNotifications(mockReq, mockRes);

      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith(
        1,
        { page: "1", limit: "10", isRead: "false" }
      );
    });

    it("should handle empty query parameters", async () => {
      const mockNotifications = createMockPaginatedNotifications();
      mockNotificationService.getUserNotifications.mockResolvedValue(
        mockNotifications
      );
      mockReq.query = {};

      await getUserNotifications(mockReq, mockRes);

      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith(
        1,
        {}
      );
    });

    it("should return 400 status on error", async () => {
      mockNotificationService.getUserNotifications.mockRejectedValue(
        new Error("User not found")
      );

      await getUserNotifications(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "User not found",
        400
      );
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read successfully", async () => {
      const mockNotification = createMockNotification({ isRead: true });
      mockNotificationService.markAsRead.mockResolvedValue(mockNotification);
      mockReq.params = { id: "1" };

      await markAsRead(mockReq, mockRes);

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(1, 1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockNotification
      );
    });

    it("should handle error when marking as read fails", async () => {
      mockNotificationService.markAsRead.mockRejectedValue(
        new Error("Notification not found")
      );
      mockReq.params = { id: "1" };

      await markAsRead(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Notification not found",
        400
      );
    });

    it("should convert params.id to number", async () => {
      const mockNotification = createMockNotification({ isRead: true });
      mockNotificationService.markAsRead.mockResolvedValue(mockNotification);
      mockReq.params = { id: "5" };

      await markAsRead(mockReq, mockRes);

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(
        5,
        expect.any(Number)
      );
    });

    it("should use user ID from req.user", async () => {
      const mockNotification = createMockNotification({ isRead: true });
      mockNotificationService.markAsRead.mockResolvedValue(mockNotification);
      mockReq.params = { id: "1" };
      mockReq.user.id = 3;

      await markAsRead(mockReq, mockRes);

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(1, 3);
    });

    it("should handle authorization errors with 400 status", async () => {
      mockNotificationService.markAsRead.mockRejectedValue(
        new Error("Unauthorized to mark this notification")
      );
      mockReq.params = { id: "1" };

      await markAsRead(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized to mark this notification",
        400
      );
    });

    it("should not pass status code for default success response", async () => {
      const mockNotification = createMockNotification({ isRead: true });
      mockNotificationService.markAsRead.mockResolvedValue(mockNotification);
      mockReq.params = { id: "1" };

      await markAsRead(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockNotification
      );
      expect(mockSuccessResponse).not.toHaveBeenCalledWith(
        mockRes,
        mockNotification,
        expect.anything(),
        expect.any(Number)
      );
    });
  });

  describe("markAsUnread", () => {
    it("should mark notification as unread successfully", async () => {
      const mockNotification = createMockNotification({ isRead: false });
      mockNotificationService.markAsUnread.mockResolvedValue(mockNotification);
      mockReq.params = { id: "1" };

      await markAsUnread(mockReq, mockRes);

      expect(mockNotificationService.markAsUnread).toHaveBeenCalledWith(1, 1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockNotification
      );
    });

    it("should handle error when marking as unread fails", async () => {
      mockNotificationService.markAsUnread.mockRejectedValue(
        new Error("Notification not found")
      );
      mockReq.params = { id: "1" };

      await markAsUnread(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Notification not found",
        400
      );
    });

    it("should convert params.id to number", async () => {
      const mockNotification = createMockNotification({ isRead: false });
      mockNotificationService.markAsUnread.mockResolvedValue(mockNotification);
      mockReq.params = { id: "7" };

      await markAsUnread(mockReq, mockRes);

      expect(mockNotificationService.markAsUnread).toHaveBeenCalledWith(
        7,
        expect.any(Number)
      );
    });

    it("should use user ID from req.user", async () => {
      const mockNotification = createMockNotification({ isRead: false });
      mockNotificationService.markAsUnread.mockResolvedValue(mockNotification);
      mockReq.params = { id: "1" };
      mockReq.user.id = 4;

      await markAsUnread(mockReq, mockRes);

      expect(mockNotificationService.markAsUnread).toHaveBeenCalledWith(1, 4);
    });

    it("should handle authorization errors with 400 status", async () => {
      mockNotificationService.markAsUnread.mockRejectedValue(
        new Error("Unauthorized to mark this notification")
      );
      mockReq.params = { id: "1" };

      await markAsUnread(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized to mark this notification",
        400
      );
    });

    it("should not pass status code for default success response", async () => {
      const mockNotification = createMockNotification({ isRead: false });
      mockNotificationService.markAsUnread.mockResolvedValue(mockNotification);
      mockReq.params = { id: "1" };

      await markAsUnread(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockNotification
      );
      expect(mockSuccessResponse).not.toHaveBeenCalledWith(
        mockRes,
        mockNotification,
        expect.anything(),
        expect.any(Number)
      );
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all notifications as read successfully", async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue();

      await markAllAsRead(mockReq, mockRes);

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith(1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "All notifications marked as read"
      );
    });

    it("should handle error when marking all as read fails", async () => {
      mockNotificationService.markAllAsRead.mockRejectedValue(
        new Error("Database error")
      );

      await markAllAsRead(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });

    it("should use user ID from req.user", async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue();
      mockReq.user.id = 6;

      await markAllAsRead(mockReq, mockRes);

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith(6);
    });

    it("should return null data on success", async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue();

      await markAllAsRead(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "All notifications marked as read"
      );
    });

    it("should handle user with no notifications", async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue();

      await markAllAsRead(mockReq, mockRes);

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith(1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "All notifications marked as read"
      );
    });

    it("should return 400 status on error", async () => {
      mockNotificationService.markAllAsRead.mockRejectedValue(
        new Error("User not found")
      );

      await markAllAsRead(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "User not found",
        400
      );
    });
  });

  describe("deleteNotification", () => {
    it("should delete notification successfully when user is admin", async () => {
      mockNotificationService.deleteNotification.mockResolvedValue();
      mockReq.params = { id: "1" };

      await deleteNotification(mockReq, mockRes);

      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith(
        1
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Notification deleted successfully"
      );
    });

    it("should handle error when deleting notification fails", async () => {
      mockNotificationService.deleteNotification.mockRejectedValue(
        new Error("Notification not found")
      );
      mockReq.params = { id: "1" };

      await deleteNotification(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Notification not found",
        400
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.params = { id: "1" };

      await deleteNotification(mockReq, mockRes);

      expect(mockNotificationService.deleteNotification).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should convert params.id to number", async () => {
      mockNotificationService.deleteNotification.mockResolvedValue();
      mockReq.params = { id: "8" };

      await deleteNotification(mockReq, mockRes);

      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith(
        8
      );
    });

    it("should return null data on success", async () => {
      mockNotificationService.deleteNotification.mockResolvedValue();
      mockReq.params = { id: "1" };

      await deleteNotification(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Notification deleted successfully"
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.params = { id: "1" };

      await deleteNotification(mockReq, mockRes);

      expect(mockNotificationService.deleteNotification).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should return 400 status on service error", async () => {
      mockNotificationService.deleteNotification.mockRejectedValue(
        new Error("Database error")
      );
      mockReq.params = { id: "1" };

      await deleteNotification(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Database error",
        400
      );
    });
  });
});
