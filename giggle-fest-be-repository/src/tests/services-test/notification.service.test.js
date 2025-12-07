/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock notification repository functions
// ---------------------------
const mockCreateNotification = jest.fn();
const mockFindNotificationsByUser = jest.fn();
const mockUpdateNotificationStatus = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockDeleteNotification = jest.fn();

// ---------------------------
// Mock notification.repository module
// ---------------------------
jest.unstable_mockModule(
  "../../repositories/notification.repository.js",
  () => ({
    createNotification: mockCreateNotification,
    findNotificationsByUser: mockFindNotificationsByUser,
    updateNotificationStatus: mockUpdateNotificationStatus,
    markAllAsRead: mockMarkAllAsRead,
    deleteNotification: mockDeleteNotification,
  })
);

// ---------------------------
// Import service after mock setup
// ---------------------------
const {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
} = await import("../../services/notification.service.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Notification Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock notification
  const createMockNotification = (overrides = {}) => ({
    id: 1,
    userId: 1,
    title: "New Event Available",
    message: "Check out our latest comedy event!",
    type: "event",
    isRead: false,
    createdAt: new Date("2025-12-01T10:00:00.000Z"),
    updatedAt: new Date("2025-12-01T10:00:00.000Z"),
    ...overrides,
  });

  describe("createNotification", () => {
    test("should create notification successfully", async () => {
      const notificationData = {
        userId: 5,
        title: "Payment Confirmed",
        message: "Your payment has been processed",
        type: "payment",
      };

      const expectedNotification = createMockNotification({
        id: 10,
        ...notificationData,
      });

      mockCreateNotification.mockResolvedValue(expectedNotification);

      const result = await createNotification(notificationData);

      expect(mockCreateNotification).toHaveBeenCalledTimes(1);
      expect(mockCreateNotification).toHaveBeenCalledWith(notificationData);
      expect(result).toEqual(expectedNotification);
      expect(result.userId).toBe(5);
      expect(result.title).toBe("Payment Confirmed");
    });

    test("should pass all data to repository", async () => {
      const notificationData = {
        userId: 3,
        title: "Test Title",
        message: "Test Message",
        type: "info",
      };

      mockCreateNotification.mockResolvedValue(
        createMockNotification(notificationData)
      );

      await createNotification(notificationData);

      expect(mockCreateNotification).toHaveBeenCalledWith(notificationData);
    });

    test("should create notification with userId 'all' for broadcast", async () => {
      const notificationData = {
        userId: "all",
        title: "System Announcement",
        message: "Maintenance scheduled",
        type: "system",
      };

      const expectedNotification = createMockNotification({
        id: 20,
        userId: "all",
        title: "System Announcement",
      });

      mockCreateNotification.mockResolvedValue(expectedNotification);

      const result = await createNotification(notificationData);

      expect(mockCreateNotification).toHaveBeenCalledWith(notificationData);
      expect(result.userId).toBe("all");
    });

    test("should return created notification from repository", async () => {
      const notificationData = {
        userId: 1,
        title: "Welcome",
        message: "Welcome to GiggleFest!",
        type: "welcome",
      };

      const createdNotification = createMockNotification({
        id: 15,
        ...notificationData,
      });

      mockCreateNotification.mockResolvedValue(createdNotification);

      const result = await createNotification(notificationData);

      expect(result).toBe(createdNotification);
      expect(result.id).toBe(15);
    });

    test("should propagate repository errors", async () => {
      const notificationData = {
        userId: 1,
        title: "Test",
        message: "Test",
      };
      const error = new Error("Database error");

      mockCreateNotification.mockRejectedValue(error);

      await expect(createNotification(notificationData)).rejects.toThrow(
        "Database error"
      );
    });

    test("should handle notification with minimal fields", async () => {
      const notificationData = {
        userId: 1,
        title: "Minimal Notification",
        message: "Message only",
      };

      mockCreateNotification.mockResolvedValue(
        createMockNotification(notificationData)
      );

      await createNotification(notificationData);

      expect(mockCreateNotification).toHaveBeenCalledWith(notificationData);
    });
  });

  describe("getUserNotifications", () => {
    test("should get user notifications with query parameters", async () => {
      const userId = 5;
      const query = { page: 1, limit: 10 };

      const mockNotifications = [
        createMockNotification({ id: 1, userId: 5, title: "Notification 1" }),
        createMockNotification({ id: 2, userId: 5, title: "Notification 2" }),
        createMockNotification({ id: 3, userId: 5, title: "Notification 3" }),
      ];

      const expectedResult = {
        notifications: mockNotifications,
        meta: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1,
        },
      };

      mockFindNotificationsByUser.mockResolvedValue(expectedResult);

      const result = await getUserNotifications(userId, query);

      expect(mockFindNotificationsByUser).toHaveBeenCalledTimes(1);
      expect(mockFindNotificationsByUser).toHaveBeenCalledWith(5, query);
      expect(result).toEqual(expectedResult);
      expect(result.notifications).toHaveLength(3);
    });

    test("should pass userId and query to repository", async () => {
      const userId = 3;
      const query = { page: 2, limit: 5 };

      mockFindNotificationsByUser.mockResolvedValue({
        notifications: [],
        meta: { page: 2, limit: 5, total: 0, totalPages: 0 },
      });

      await getUserNotifications(userId, query);

      expect(mockFindNotificationsByUser).toHaveBeenCalledWith(3, {
        page: 2,
        limit: 5,
      });
    });

    test("should handle empty query object", async () => {
      const userId = 1;
      const query = {};

      mockFindNotificationsByUser.mockResolvedValue({
        notifications: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await getUserNotifications(userId, query);

      expect(mockFindNotificationsByUser).toHaveBeenCalledWith(1, {});
    });

    test("should return notifications with metadata", async () => {
      const userId = 7;
      const query = { page: 1, limit: 10 };

      const expectedResult = {
        notifications: [createMockNotification()],
        meta: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      };

      mockFindNotificationsByUser.mockResolvedValue(expectedResult);

      const result = await getUserNotifications(userId, query);

      expect(result.meta).toBeDefined();
      expect(result.meta.page).toBe(1);
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
    });

    test("should return empty array when user has no notifications", async () => {
      const userId = 999;
      const query = { page: 1, limit: 10 };

      mockFindNotificationsByUser.mockResolvedValue({
        notifications: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const result = await getUserNotifications(userId, query);

      expect(result.notifications).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    test("should propagate repository errors", async () => {
      const userId = 1;
      const query = {};
      const error = new Error("Database connection failed");

      mockFindNotificationsByUser.mockRejectedValue(error);

      await expect(getUserNotifications(userId, query)).rejects.toThrow(
        "Database connection failed"
      );
    });

    test("should handle query with filter parameters", async () => {
      const userId = 5;
      const query = { page: 1, limit: 10, isRead: false };

      mockFindNotificationsByUser.mockResolvedValue({
        notifications: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await getUserNotifications(userId, query);

      expect(mockFindNotificationsByUser).toHaveBeenCalledWith(5, {
        page: 1,
        limit: 10,
        isRead: false,
      });
    });
  });

  describe("markAsRead", () => {
    test("should mark notification as read", async () => {
      const notificationId = 10;
      const userId = 5;

      const updatedNotification = createMockNotification({
        id: notificationId,
        userId: userId,
        isRead: true,
        updatedAt: new Date("2025-12-06T15:00:00.000Z"),
      });

      mockUpdateNotificationStatus.mockResolvedValue(updatedNotification);

      const result = await markAsRead(notificationId, userId);

      expect(mockUpdateNotificationStatus).toHaveBeenCalledTimes(1);
      expect(mockUpdateNotificationStatus).toHaveBeenCalledWith(10, 5, {
        isRead: true,
      });

      expect(result).toEqual(updatedNotification);
      expect(result.isRead).toBe(true);
    });

    test("should pass correct parameters to repository", async () => {
      const notificationId = 15;
      const userId = 3;

      mockUpdateNotificationStatus.mockResolvedValue(
        createMockNotification({ id: notificationId, isRead: true })
      );

      await markAsRead(notificationId, userId);

      const callArgs = mockUpdateNotificationStatus.mock.calls[0];
      expect(callArgs[0]).toBe(15);
      expect(callArgs[1]).toBe(3);
      expect(callArgs[2]).toEqual({ isRead: true });
    });

    test("should validate user ownership through repository", async () => {
      const notificationId = 20;
      const userId = 7;

      mockUpdateNotificationStatus.mockResolvedValue(
        createMockNotification({
          id: notificationId,
          userId: userId,
          isRead: true,
        })
      );

      await markAsRead(notificationId, userId);

      expect(mockUpdateNotificationStatus).toHaveBeenCalledWith(20, 7, {
        isRead: true,
      });
    });

    test("should return updated notification", async () => {
      const notificationId = 5;
      const userId = 2;

      const updatedNotification = createMockNotification({
        id: notificationId,
        userId: userId,
        isRead: true,
        title: "Updated Notification",
      });

      mockUpdateNotificationStatus.mockResolvedValue(updatedNotification);

      const result = await markAsRead(notificationId, userId);

      expect(result).toBe(updatedNotification);
      expect(result.isRead).toBe(true);
    });

    test("should propagate repository errors", async () => {
      const notificationId = 1;
      const userId = 1;
      const error = new Error("Notification not found");

      mockUpdateNotificationStatus.mockRejectedValue(error);

      await expect(markAsRead(notificationId, userId)).rejects.toThrow(
        "Notification not found"
      );
    });
  });

  describe("markAsUnread", () => {
    test("should mark notification as unread", async () => {
      const notificationId = 10;
      const userId = 5;

      const updatedNotification = createMockNotification({
        id: notificationId,
        userId: userId,
        isRead: false,
        updatedAt: new Date("2025-12-06T15:00:00.000Z"),
      });

      mockUpdateNotificationStatus.mockResolvedValue(updatedNotification);

      const result = await markAsUnread(notificationId, userId);

      expect(mockUpdateNotificationStatus).toHaveBeenCalledTimes(1);
      expect(mockUpdateNotificationStatus).toHaveBeenCalledWith(10, 5, {
        isRead: false,
      });

      expect(result).toEqual(updatedNotification);
      expect(result.isRead).toBe(false);
    });

    test("should pass correct parameters to repository", async () => {
      const notificationId = 15;
      const userId = 3;

      mockUpdateNotificationStatus.mockResolvedValue(
        createMockNotification({ id: notificationId, isRead: false })
      );

      await markAsUnread(notificationId, userId);

      const callArgs = mockUpdateNotificationStatus.mock.calls[0];
      expect(callArgs[0]).toBe(15);
      expect(callArgs[1]).toBe(3);
      expect(callArgs[2]).toEqual({ isRead: false });
    });

    test("should validate user ownership through repository", async () => {
      const notificationId = 20;
      const userId = 7;

      mockUpdateNotificationStatus.mockResolvedValue(
        createMockNotification({
          id: notificationId,
          userId: userId,
          isRead: false,
        })
      );

      await markAsUnread(notificationId, userId);

      expect(mockUpdateNotificationStatus).toHaveBeenCalledWith(20, 7, {
        isRead: false,
      });
    });

    test("should return updated notification", async () => {
      const notificationId = 8;
      const userId = 4;

      const updatedNotification = createMockNotification({
        id: notificationId,
        userId: userId,
        isRead: false,
        title: "Unread Notification",
      });

      mockUpdateNotificationStatus.mockResolvedValue(updatedNotification);

      const result = await markAsUnread(notificationId, userId);

      expect(result).toBe(updatedNotification);
      expect(result.isRead).toBe(false);
    });

    test("should propagate repository errors", async () => {
      const notificationId = 1;
      const userId = 1;
      const error = new Error("Update failed");

      mockUpdateNotificationStatus.mockRejectedValue(error);

      await expect(markAsUnread(notificationId, userId)).rejects.toThrow(
        "Update failed"
      );
    });
  });

  describe("markAllAsRead", () => {
    test("should mark all user notifications as read", async () => {
      const userId = 5;
      const updateResult = { count: 10 };

      mockMarkAllAsRead.mockResolvedValue(updateResult);

      const result = await markAllAsRead(userId);

      expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
      expect(mockMarkAllAsRead).toHaveBeenCalledWith(5);
      expect(result).toEqual(updateResult);
      expect(result.count).toBe(10);
    });

    test("should pass userId to repository", async () => {
      const userId = 3;

      mockMarkAllAsRead.mockResolvedValue({ count: 5 });

      await markAllAsRead(userId);

      expect(mockMarkAllAsRead).toHaveBeenCalledWith(3);
    });

    test("should return update count from repository", async () => {
      const userId = 7;
      const updateResult = { count: 25 };

      mockMarkAllAsRead.mockResolvedValue(updateResult);

      const result = await markAllAsRead(userId);

      expect(result.count).toBe(25);
    });

    test("should handle zero updates when no unread notifications", async () => {
      const userId = 10;
      const updateResult = { count: 0 };

      mockMarkAllAsRead.mockResolvedValue(updateResult);

      const result = await markAllAsRead(userId);

      expect(result.count).toBe(0);
    });

    test("should propagate repository errors", async () => {
      const userId = 1;
      const error = new Error("Database error");

      mockMarkAllAsRead.mockRejectedValue(error);

      await expect(markAllAsRead(userId)).rejects.toThrow("Database error");
    });

    test("should handle different user IDs", async () => {
      const userId1 = 1;
      const userId2 = 2;

      mockMarkAllAsRead
        .mockResolvedValueOnce({ count: 5 })
        .mockResolvedValueOnce({ count: 3 });

      const result1 = await markAllAsRead(userId1);
      const result2 = await markAllAsRead(userId2);

      expect(mockMarkAllAsRead).toHaveBeenCalledTimes(2);
      expect(mockMarkAllAsRead).toHaveBeenNthCalledWith(1, 1);
      expect(mockMarkAllAsRead).toHaveBeenNthCalledWith(2, 2);
      expect(result1.count).toBe(5);
      expect(result2.count).toBe(3);
    });
  });

  describe("deleteNotification", () => {
    test("should delete notification by id", async () => {
      const notificationId = 10;
      const deletedNotification = createMockNotification({
        id: notificationId,
      });

      mockDeleteNotification.mockResolvedValue(deletedNotification);

      const result = await deleteNotification(notificationId);

      expect(mockDeleteNotification).toHaveBeenCalledTimes(1);
      expect(mockDeleteNotification).toHaveBeenCalledWith(10);
      expect(result).toEqual(deletedNotification);
      expect(result.id).toBe(notificationId);
    });

    test("should pass id directly to repository", async () => {
      const notificationId = 50;

      mockDeleteNotification.mockResolvedValue(
        createMockNotification({ id: notificationId })
      );

      await deleteNotification(notificationId);

      expect(mockDeleteNotification).toHaveBeenCalledWith(50);
    });

    test("should return deleted notification data", async () => {
      const notificationId = 15;
      const deletedNotification = createMockNotification({
        id: notificationId,
        title: "Deleted Notification",
      });

      mockDeleteNotification.mockResolvedValue(deletedNotification);

      const result = await deleteNotification(notificationId);

      expect(result).toBe(deletedNotification);
      expect(result.id).toBe(notificationId);
      expect(result.title).toBe("Deleted Notification");
    });

    test("should handle deleting different notifications", async () => {
      const notification1 = createMockNotification({ id: 1, title: "First" });
      const notification2 = createMockNotification({ id: 2, title: "Second" });

      mockDeleteNotification
        .mockResolvedValueOnce(notification1)
        .mockResolvedValueOnce(notification2);

      const result1 = await deleteNotification(1);
      const result2 = await deleteNotification(2);

      expect(result1).toEqual(notification1);
      expect(result2).toEqual(notification2);
      expect(mockDeleteNotification).toHaveBeenCalledTimes(2);
      expect(mockDeleteNotification).toHaveBeenNthCalledWith(1, 1);
      expect(mockDeleteNotification).toHaveBeenNthCalledWith(2, 2);
    });

    test("should propagate repository errors", async () => {
      const notificationId = 1;
      const error = new Error("Delete failed");

      mockDeleteNotification.mockRejectedValue(error);

      await expect(deleteNotification(notificationId)).rejects.toThrow(
        "Delete failed"
      );
    });
  });
});
