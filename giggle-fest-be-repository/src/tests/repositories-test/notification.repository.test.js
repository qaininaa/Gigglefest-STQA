/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock functions
// ---------------------------
const mockNotification = {
  create: jest.fn(),
  createMany: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

const mockUser = {
  findMany: jest.fn(),
};

const mockPrisma = {
  notification: mockNotification,
  user: mockUser,
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
  createNotification,
  findNotificationsByUser,
  updateNotificationStatus,
  findNotificationById,
  deleteNotification,
  markAllAsRead,
} = await import("../../repositories/notification.repository.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Notification Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock notification
  const createMockNotification = (overrides = {}) => ({
    id: 1,
    userId: 1,
    message: "New event available: GiggleFest 2025",
    isRead: false,
    createdAt: new Date("2025-12-01T10:00:00.000Z"),
    updatedAt: new Date("2025-12-01T10:00:00.000Z"),
    ...overrides,
  });

  describe("createNotification", () => {
    test("should create notification for single user", async () => {
      const notificationData = {
        userId: 5,
        message: "Your ticket purchase was successful",
      };

      const expectedNotification = createMockNotification({
        id: 10,
        userId: 5,
        message: "Your ticket purchase was successful",
      });

      mockNotification.create.mockResolvedValue(expectedNotification);

      const result = await createNotification(notificationData);

      expect(mockNotification.create).toHaveBeenCalledTimes(1);
      expect(mockNotification.create).toHaveBeenCalledWith({
        data: notificationData,
      });
      expect(result).toEqual(expectedNotification);
      expect(result.userId).toBe(5);
      expect(result.message).toBe("Your ticket purchase was successful");
    });

    test("should create notifications for all users when userId is 'all'", async () => {
      const notificationData = {
        userId: "all",
        message: "New event announced: Comedy Night 2025",
      };

      const mockUsers = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

      const expectedCreateManyResult = { count: 5 };

      mockUser.findMany.mockResolvedValue(mockUsers);
      mockNotification.createMany.mockResolvedValue(expectedCreateManyResult);

      const result = await createNotification(notificationData);

      // Verify users were fetched
      expect(mockUser.findMany).toHaveBeenCalledTimes(1);
      expect(mockUser.findMany).toHaveBeenCalledWith({
        select: { id: true },
      });

      // Verify createMany was called with correct data
      expect(mockNotification.createMany).toHaveBeenCalledTimes(1);
      expect(mockNotification.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 1, message: "New event announced: Comedy Night 2025" },
          { userId: 2, message: "New event announced: Comedy Night 2025" },
          { userId: 3, message: "New event announced: Comedy Night 2025" },
          { userId: 4, message: "New event announced: Comedy Night 2025" },
          { userId: 5, message: "New event announced: Comedy Night 2025" },
        ],
      });

      expect(result).toEqual(expectedCreateManyResult);
      expect(result.count).toBe(5);
      expect(mockNotification.create).not.toHaveBeenCalled();
    });

    test("should create zero notifications when userId is 'all' but no users exist", async () => {
      const notificationData = {
        userId: "all",
        message: "System notification",
      };

      mockUser.findMany.mockResolvedValue([]);
      mockNotification.createMany.mockResolvedValue({ count: 0 });

      const result = await createNotification(notificationData);

      expect(mockUser.findMany).toHaveBeenCalledTimes(1);
      expect(mockNotification.createMany).toHaveBeenCalledWith({
        data: [],
      });
      expect(result.count).toBe(0);
    });

    test("should create notification with minimal data", async () => {
      const notificationData = {
        userId: 3,
        message: "Simple notification",
      };

      const expectedNotification = createMockNotification({
        userId: 3,
        message: "Simple notification",
      });

      mockNotification.create.mockResolvedValue(expectedNotification);

      const result = await createNotification(notificationData);

      expect(mockNotification.create).toHaveBeenCalledWith({
        data: notificationData,
      });
      expect(result).toEqual(expectedNotification);
    });

    test("should handle large number of users when userId is 'all'", async () => {
      const notificationData = {
        userId: "all",
        message: "Important announcement",
      };

      const mockUsers = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));

      mockUser.findMany.mockResolvedValue(mockUsers);
      mockNotification.createMany.mockResolvedValue({ count: 100 });

      const result = await createNotification(notificationData);

      expect(mockUser.findMany).toHaveBeenCalledTimes(1);
      expect(mockNotification.createMany).toHaveBeenCalledTimes(1);
      expect(result.count).toBe(100);

      const callArgs = mockNotification.createMany.mock.calls[0][0];
      expect(callArgs.data).toHaveLength(100);
      expect(callArgs.data[0].userId).toBe(1);
      expect(callArgs.data[99].userId).toBe(100);
    });
  });

  describe("findNotificationsByUser", () => {
    test("should return paginated notifications for a user", async () => {
      const userId = 1;
      const options = { page: 1, limit: 10 };

      const mockNotifications = [
        createMockNotification({ id: 1, userId: 1 }),
        createMockNotification({ id: 2, userId: 1 }),
        createMockNotification({ id: 3, userId: 1 }),
      ];

      const totalCount = 25;

      mockNotification.count.mockResolvedValue(totalCount);
      mockNotification.findMany.mockResolvedValue(mockNotifications);

      const result = await findNotificationsByUser(userId, options);

      expect(mockNotification.count).toHaveBeenCalledTimes(1);
      expect(mockNotification.count).toHaveBeenCalledWith({
        where: { userId: 1 },
      });

      expect(mockNotification.findMany).toHaveBeenCalledTimes(1);
      expect(mockNotification.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result.notifications).toEqual(mockNotifications);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    test("should handle pagination for page 2", async () => {
      const userId = 5;
      const options = { page: 2, limit: 5 };

      const mockNotifications = [
        createMockNotification({ id: 6, userId: 5 }),
        createMockNotification({ id: 7, userId: 5 }),
      ];

      mockNotification.count.mockResolvedValue(12);
      mockNotification.findMany.mockResolvedValue(mockNotifications);

      const result = await findNotificationsByUser(userId, options);

      expect(mockNotification.findMany).toHaveBeenCalledWith({
        where: { userId: 5 },
        skip: 5, // (page 2 - 1) * 5
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result.meta).toEqual({
        page: 2,
        limit: 5,
        total: 12,
        totalPages: 3,
      });
    });

    test("should use default pagination values", async () => {
      const userId = 3;
      const options = {};

      mockNotification.count.mockResolvedValue(10);
      mockNotification.findMany.mockResolvedValue([]);

      const result = await findNotificationsByUser(userId, options);

      expect(mockNotification.findMany).toHaveBeenCalledWith({
        where: { userId: 3 },
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    test("should return empty array when user has no notifications", async () => {
      const userId = 999;
      const options = { page: 1, limit: 10 };

      mockNotification.count.mockResolvedValue(0);
      mockNotification.findMany.mockResolvedValue([]);

      const result = await findNotificationsByUser(userId, options);

      expect(result.notifications).toEqual([]);
      expect(result.notifications).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    test("should convert string pagination values to numbers", async () => {
      const userId = 2;
      const options = { page: "3", limit: "15" };

      mockNotification.count.mockResolvedValue(50);
      mockNotification.findMany.mockResolvedValue([]);

      const result = await findNotificationsByUser(userId, options);

      expect(mockNotification.findMany).toHaveBeenCalledWith({
        where: { userId: 2 },
        skip: 30, // (3 - 1) * 15
        take: 15,
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(15);
      expect(typeof result.meta.page).toBe("number");
      expect(typeof result.meta.limit).toBe("number");
    });

    test("should order notifications by createdAt descending", async () => {
      const userId = 1;
      const options = { page: 1, limit: 10 };

      mockNotification.count.mockResolvedValue(2);
      mockNotification.findMany.mockResolvedValue([]);

      await findNotificationsByUser(userId, options);

      expect(mockNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: "desc",
          },
        })
      );
    });

    test("should calculate totalPages correctly", async () => {
      const userId = 1;
      const options = { page: 1, limit: 7 };

      mockNotification.count.mockResolvedValue(20);
      mockNotification.findMany.mockResolvedValue([]);

      const result = await findNotificationsByUser(userId, options);

      // Math.ceil(20 / 7) = 3
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe("updateNotificationStatus", () => {
    test("should update notification status successfully", async () => {
      const id = 1;
      const userId = 5;
      const updateData = { isRead: true };

      const updatedNotification = createMockNotification({
        id: 1,
        userId: 5,
        isRead: true,
        updatedAt: new Date("2025-12-06T12:00:00.000Z"),
      });

      mockNotification.update.mockResolvedValue(updatedNotification);

      const result = await updateNotificationStatus(id, userId, updateData);

      expect(mockNotification.update).toHaveBeenCalledTimes(1);
      expect(mockNotification.update).toHaveBeenCalledWith({
        where: { id, userId },
        data: updateData,
      });
      expect(result).toEqual(updatedNotification);
      expect(result.isRead).toBe(true);
    });

    test("should mark notification as read", async () => {
      const id = 10;
      const userId = 3;
      const updateData = { isRead: true };

      const updatedNotification = createMockNotification({
        id: 10,
        userId: 3,
        isRead: true,
      });

      mockNotification.update.mockResolvedValue(updatedNotification);

      const result = await updateNotificationStatus(id, userId, updateData);

      expect(mockNotification.update).toHaveBeenCalledWith({
        where: { id: 10, userId: 3 },
        data: { isRead: true },
      });
      expect(result.isRead).toBe(true);
    });

    test("should ensure userId matches when updating", async () => {
      const id = 5;
      const userId = 8;
      const updateData = { isRead: true };

      mockNotification.update.mockResolvedValue(
        createMockNotification({ id: 5, userId: 8, isRead: true })
      );

      await updateNotificationStatus(id, userId, updateData);

      // Verify that both id and userId are in the where clause
      expect(mockNotification.update).toHaveBeenCalledWith({
        where: { id: 5, userId: 8 },
        data: updateData,
      });
    });

    test("should update notification with custom data", async () => {
      const id = 2;
      const userId = 1;
      const updateData = { isRead: false, message: "Updated message" };

      const updatedNotification = createMockNotification({
        id: 2,
        userId: 1,
        isRead: false,
        message: "Updated message",
      });

      mockNotification.update.mockResolvedValue(updatedNotification);

      const result = await updateNotificationStatus(id, userId, updateData);

      expect(result.message).toBe("Updated message");
      expect(result.isRead).toBe(false);
    });
  });

  describe("findNotificationById", () => {
    test("should return notification when found", async () => {
      const notificationId = 1;
      const expectedNotification = createMockNotification({
        id: notificationId,
      });

      mockNotification.findUnique.mockResolvedValue(expectedNotification);

      const result = await findNotificationById(notificationId);

      expect(mockNotification.findUnique).toHaveBeenCalledTimes(1);
      expect(mockNotification.findUnique).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
      expect(result).toEqual(expectedNotification);
      expect(result.id).toBe(notificationId);
    });

    test("should return null when notification not found", async () => {
      const notificationId = 999;

      mockNotification.findUnique.mockResolvedValue(null);

      const result = await findNotificationById(notificationId);

      expect(mockNotification.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test("should handle different notification IDs", async () => {
      const notification1 = createMockNotification({
        id: 5,
        message: "Notification 1",
      });
      const notification2 = createMockNotification({
        id: 10,
        message: "Notification 2",
      });

      mockNotification.findUnique
        .mockResolvedValueOnce(notification1)
        .mockResolvedValueOnce(notification2);

      const result1 = await findNotificationById(5);
      const result2 = await findNotificationById(10);

      expect(result1).toEqual(notification1);
      expect(result2).toEqual(notification2);
      expect(mockNotification.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe("deleteNotification", () => {
    test("should delete notification successfully", async () => {
      const notificationId = 1;
      const deletedNotification = createMockNotification({
        id: notificationId,
      });

      mockNotification.delete.mockResolvedValue(deletedNotification);

      const result = await deleteNotification(notificationId);

      expect(mockNotification.delete).toHaveBeenCalledTimes(1);
      expect(mockNotification.delete).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
      expect(result).toEqual(deletedNotification);
      expect(result.id).toBe(notificationId);
    });

    test("should delete notification with specific id", async () => {
      const notificationId = 15;
      const deletedNotification = createMockNotification({
        id: 15,
        message: "Deleted notification",
      });

      mockNotification.delete.mockResolvedValue(deletedNotification);

      const result = await deleteNotification(notificationId);

      expect(mockNotification.delete).toHaveBeenCalledWith({
        where: { id: 15 },
      });
      expect(result.id).toBe(15);
    });

    test("should handle deleting different notifications", async () => {
      const notification1 = createMockNotification({ id: 1 });
      const notification2 = createMockNotification({ id: 2 });

      mockNotification.delete
        .mockResolvedValueOnce(notification1)
        .mockResolvedValueOnce(notification2);

      const result1 = await deleteNotification(1);
      const result2 = await deleteNotification(2);

      expect(result1).toEqual(notification1);
      expect(result2).toEqual(notification2);
      expect(mockNotification.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe("markAllAsRead", () => {
    test("should mark all unread notifications as read for a user", async () => {
      const userId = 1;
      const updateResult = { count: 5 };

      mockNotification.updateMany.mockResolvedValue(updateResult);

      const result = await markAllAsRead(userId);

      expect(mockNotification.updateMany).toHaveBeenCalledTimes(1);
      expect(mockNotification.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, isRead: false },
        data: { isRead: true },
      });
      expect(result).toEqual(updateResult);
      expect(result.count).toBe(5);
    });

    test("should only update unread notifications", async () => {
      const userId = 3;

      mockNotification.updateMany.mockResolvedValue({ count: 3 });

      await markAllAsRead(userId);

      const callArgs = mockNotification.updateMany.mock.calls[0][0];
      expect(callArgs.where.isRead).toBe(false);
      expect(callArgs.data.isRead).toBe(true);
    });

    test("should return zero count when no unread notifications exist", async () => {
      const userId = 10;
      const updateResult = { count: 0 };

      mockNotification.updateMany.mockResolvedValue(updateResult);

      const result = await markAllAsRead(userId);

      expect(mockNotification.updateMany).toHaveBeenCalledTimes(1);
      expect(result.count).toBe(0);
    });

    test("should handle marking all as read for different users", async () => {
      const userId1 = 1;
      const userId2 = 2;

      mockNotification.updateMany
        .mockResolvedValueOnce({ count: 10 })
        .mockResolvedValueOnce({ count: 3 });

      const result1 = await markAllAsRead(userId1);
      const result2 = await markAllAsRead(userId2);

      expect(mockNotification.updateMany).toHaveBeenCalledTimes(2);
      expect(result1.count).toBe(10);
      expect(result2.count).toBe(3);

      expect(mockNotification.updateMany).toHaveBeenNthCalledWith(1, {
        where: { userId: 1, isRead: false },
        data: { isRead: true },
      });

      expect(mockNotification.updateMany).toHaveBeenNthCalledWith(2, {
        where: { userId: 2, isRead: false },
        data: { isRead: true },
      });
    });

    test("should only target specific userId", async () => {
      const userId = 5;

      mockNotification.updateMany.mockResolvedValue({ count: 2 });

      await markAllAsRead(userId);

      const callArgs = mockNotification.updateMany.mock.calls[0][0];
      expect(callArgs.where.userId).toBe(5);
    });
  });
});
