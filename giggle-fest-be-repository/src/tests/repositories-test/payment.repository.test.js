/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock functions
// ---------------------------
const mockPayment = {
  create: jest.fn(),
  findMany: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
};

const mockPrisma = {
  payment: mockPayment,
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
  createPayment,
  findAllPayments,
  findPaymentById,
  findPaymentByOrderId,
  updatePaymentStatus,
} = await import("../../repositories/payment.repository.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Payment Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock user
  const createMockUser = (overrides = {}) => ({
    id: 1,
    name: "John Doe",
    email: "john@example.com",
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
    eventId: 1,
    categoryId: 1,
    name: "VIP Ticket",
    price: 500000,
    stock: 100,
    event: createMockEvent(),
    category: createMockCategory(),
    ...overrides,
  });

  // Helper function to create mock payment
  const createMockPayment = (overrides = {}) => ({
    id: 1,
    userId: 1,
    ticketId: 1,
    amount: 450000,
    originalAmount: 500000,
    discount: 50000,
    status: "pending",
    orderId: "ORDER-123456",
    paymentDate: new Date("2025-12-01T10:00:00.000Z"),
    createdAt: new Date("2025-12-01T10:00:00.000Z"),
    updatedAt: new Date("2025-12-01T10:00:00.000Z"),
    user: createMockUser(),
    ticket: createMockTicket(),
    ...overrides,
  });

  describe("createPayment", () => {
    test("should create payment with user and ticket connections", async () => {
      const paymentData = {
        userId: 5,
        ticketId: 3,
        amount: 250000,
        originalAmount: 300000,
        discount: 50000,
        status: "pending",
        orderId: "ORDER-789012",
      };

      const expectedPayment = createMockPayment({
        id: 10,
        userId: 5,
        ticketId: 3,
        amount: 250000,
        originalAmount: 300000,
        discount: 50000,
        orderId: "ORDER-789012",
      });

      mockPayment.create.mockResolvedValue(expectedPayment);

      const result = await createPayment(paymentData);

      expect(mockPayment.create).toHaveBeenCalledTimes(1);
      expect(mockPayment.create).toHaveBeenCalledWith({
        data: {
          amount: 250000,
          originalAmount: 300000,
          discount: 50000,
          status: "pending",
          orderId: "ORDER-789012",
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
              email: true,
            },
          },
          ticket: {
            include: {
              event: true,
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(expectedPayment);
      expect(result.amount).toBe(250000);
      expect(result.userId).toBe(5);
      expect(result.ticketId).toBe(3);
    });

    test("should create payment with no discount", async () => {
      const paymentData = {
        userId: 2,
        ticketId: 1,
        amount: 500000,
        originalAmount: 500000,
        discount: 0,
        status: "pending",
        orderId: "ORDER-111111",
      };

      const expectedPayment = createMockPayment({
        ...paymentData,
        id: 20,
      });

      mockPayment.create.mockResolvedValue(expectedPayment);

      const result = await createPayment(paymentData);

      expect(result.discount).toBe(0);
      expect(result.amount).toBe(result.originalAmount);
    });

    test("should include user details in response", async () => {
      const paymentData = {
        userId: 1,
        ticketId: 1,
        amount: 400000,
        originalAmount: 500000,
        discount: 100000,
        status: "pending",
        orderId: "ORDER-222222",
      };

      const expectedPayment = createMockPayment({
        ...paymentData,
        user: createMockUser({
          id: 1,
          name: "Jane Doe",
          email: "jane@example.com",
        }),
      });

      mockPayment.create.mockResolvedValue(expectedPayment);

      const result = await createPayment(paymentData);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(1);
      expect(result.user.name).toBe("Jane Doe");
      expect(result.user.email).toBe("jane@example.com");
      expect(result.user).not.toHaveProperty("password");
    });

    test("should include ticket with event and category in response", async () => {
      const paymentData = {
        userId: 1,
        ticketId: 2,
        amount: 300000,
        originalAmount: 300000,
        discount: 0,
        status: "pending",
        orderId: "ORDER-333333",
      };

      const expectedPayment = createMockPayment({
        ...paymentData,
        ticket: createMockTicket({
          id: 2,
          name: "Regular Ticket",
          price: 300000,
        }),
      });

      mockPayment.create.mockResolvedValue(expectedPayment);

      const result = await createPayment(paymentData);

      expect(result.ticket).toBeDefined();
      expect(result.ticket.id).toBe(2);
      expect(result.ticket.event).toBeDefined();
      expect(result.ticket.category).toBeDefined();
      expect(result.ticket.event.name).toBe("GiggleFest 2025");
    });

    test("should use connect syntax for relations", async () => {
      const paymentData = {
        userId: 10,
        ticketId: 15,
        amount: 200000,
        originalAmount: 200000,
        discount: 0,
        status: "pending",
        orderId: "ORDER-444444",
      };

      mockPayment.create.mockResolvedValue(createMockPayment(paymentData));

      await createPayment(paymentData);

      const callArgs = mockPayment.create.mock.calls[0][0];
      expect(callArgs.data.user).toEqual({ connect: { id: 10 } });
      expect(callArgs.data.ticket).toEqual({ connect: { id: 15 } });
    });
  });

  describe("findAllPayments", () => {
    test("should return paginated payments without userId filter", async () => {
      const options = { page: 1, limit: 10 };
      const mockPayments = [
        createMockPayment({ id: 1, orderId: "ORDER-001" }),
        createMockPayment({ id: 2, orderId: "ORDER-002" }),
        createMockPayment({ id: 3, orderId: "ORDER-003" }),
      ];
      const totalCount = 25;

      mockPayment.count.mockResolvedValue(totalCount);
      mockPayment.findMany.mockResolvedValue(mockPayments);

      const result = await findAllPayments(options);

      expect(mockPayment.count).toHaveBeenCalledTimes(1);
      expect(mockPayment.count).toHaveBeenCalledWith({
        where: {},
      });

      expect(mockPayment.findMany).toHaveBeenCalledTimes(1);
      expect(mockPayment.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ticket: {
            include: {
              event: true,
              category: true,
            },
          },
        },
        orderBy: {
          paymentDate: "desc",
        },
      });

      expect(result.payments).toEqual(mockPayments);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    test("should return paginated payments filtered by userId", async () => {
      const options = { page: 1, limit: 5, userId: 3 };
      const mockPayments = [
        createMockPayment({ id: 1, userId: 3 }),
        createMockPayment({ id: 2, userId: 3 }),
      ];

      mockPayment.count.mockResolvedValue(2);
      mockPayment.findMany.mockResolvedValue(mockPayments);

      const result = await findAllPayments(options);

      expect(mockPayment.count).toHaveBeenCalledWith({
        where: { userId: 3 },
      });

      expect(mockPayment.findMany).toHaveBeenCalledWith({
        where: { userId: 3 },
        skip: 0,
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ticket: {
            include: {
              event: true,
              category: true,
            },
          },
        },
        orderBy: {
          paymentDate: "desc",
        },
      });

      expect(result.payments).toHaveLength(2);
      expect(result.payments[0].userId).toBe(3);
    });

    test("should handle pagination for page 2", async () => {
      const options = { page: 2, limit: 10 };

      mockPayment.count.mockResolvedValue(30);
      mockPayment.findMany.mockResolvedValue([]);

      const result = await findAllPayments(options);

      expect(mockPayment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10,
        })
      );

      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(3);
    });

    test("should use default pagination values", async () => {
      const options = {};

      mockPayment.count.mockResolvedValue(5);
      mockPayment.findMany.mockResolvedValue([]);

      const result = await findAllPayments(options);

      expect(mockPayment.findMany).toHaveBeenCalledWith(
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

      mockPayment.count.mockResolvedValue(50);
      mockPayment.findMany.mockResolvedValue([]);

      const result = await findAllPayments(options);

      expect(mockPayment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 30, // (3 - 1) * 15
          take: 15,
        })
      );

      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(15);
      expect(typeof result.meta.page).toBe("number");
      expect(typeof result.meta.limit).toBe("number");
    });

    test("should order payments by paymentDate descending", async () => {
      const options = { page: 1, limit: 10 };

      mockPayment.count.mockResolvedValue(5);
      mockPayment.findMany.mockResolvedValue([]);

      await findAllPayments(options);

      expect(mockPayment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            paymentDate: "desc",
          },
        })
      );
    });

    test("should return empty array when no payments found", async () => {
      const options = { page: 1, limit: 10, userId: 999 };

      mockPayment.count.mockResolvedValue(0);
      mockPayment.findMany.mockResolvedValue([]);

      const result = await findAllPayments(options);

      expect(result.payments).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    test("should include user and ticket details in response", async () => {
      const options = { page: 1, limit: 1 };
      const mockPayments = [createMockPayment()];

      mockPayment.count.mockResolvedValue(1);
      mockPayment.findMany.mockResolvedValue(mockPayments);

      const result = await findAllPayments(options);

      expect(result.payments[0].user).toBeDefined();
      expect(result.payments[0].ticket).toBeDefined();
      expect(result.payments[0].ticket.event).toBeDefined();
      expect(result.payments[0].ticket.category).toBeDefined();
    });
  });

  describe("findPaymentById", () => {
    test("should return payment by id without userId filter", async () => {
      const paymentId = 5;
      const expectedPayment = createMockPayment({ id: 5 });

      mockPayment.findFirst.mockResolvedValue(expectedPayment);

      const result = await findPaymentById(paymentId);

      expect(mockPayment.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPayment.findFirst).toHaveBeenCalledWith({
        where: { id: 5 },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ticket: {
            include: {
              event: true,
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(expectedPayment);
      expect(result.id).toBe(5);
    });

    test("should return payment by id with userId filter", async () => {
      const paymentId = 10;
      const userId = 3;
      const expectedPayment = createMockPayment({ id: 10, userId: 3 });

      mockPayment.findFirst.mockResolvedValue(expectedPayment);

      const result = await findPaymentById(paymentId, userId);

      expect(mockPayment.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPayment.findFirst).toHaveBeenCalledWith({
        where: { id: 10, userId: 3 },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ticket: {
            include: {
              event: true,
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(expectedPayment);
      expect(result.userId).toBe(3);
    });

    test("should return null when payment not found", async () => {
      const paymentId = 999;

      mockPayment.findFirst.mockResolvedValue(null);

      const result = await findPaymentById(paymentId);

      expect(mockPayment.findFirst).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test("should return null when payment exists but userId does not match", async () => {
      const paymentId = 5;
      const userId = 999;

      mockPayment.findFirst.mockResolvedValue(null);

      const result = await findPaymentById(paymentId, userId);

      expect(mockPayment.findFirst).toHaveBeenCalledWith({
        where: { id: 5, userId: 999 },
        include: expect.any(Object),
      });
      expect(result).toBeNull();
    });

    test("should include user and ticket details", async () => {
      const paymentId = 1;
      const expectedPayment = createMockPayment({ id: 1 });

      mockPayment.findFirst.mockResolvedValue(expectedPayment);

      const result = await findPaymentById(paymentId);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.name).toBeDefined();
      expect(result.user.email).toBeDefined();
      expect(result.ticket).toBeDefined();
      expect(result.ticket.event).toBeDefined();
      expect(result.ticket.category).toBeDefined();
    });

    test("should handle null userId parameter", async () => {
      const paymentId = 7;

      mockPayment.findFirst.mockResolvedValue(createMockPayment({ id: 7 }));

      await findPaymentById(paymentId, null);

      expect(mockPayment.findFirst).toHaveBeenCalledWith({
        where: { id: 7 },
        include: expect.any(Object),
      });
    });
  });

  describe("findPaymentByOrderId", () => {
    test("should return payment by orderId", async () => {
      const orderId = "ORDER-123456";
      const expectedPayment = createMockPayment({ orderId });

      mockPayment.findFirst.mockResolvedValue(expectedPayment);

      const result = await findPaymentByOrderId(orderId);

      expect(mockPayment.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPayment.findFirst).toHaveBeenCalledWith({
        where: { orderId: "ORDER-123456" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ticket: {
            include: {
              event: true,
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(expectedPayment);
      expect(result.orderId).toBe("ORDER-123456");
    });

    test("should return null when orderId not found", async () => {
      const orderId = "ORDER-NONEXISTENT";

      mockPayment.findFirst.mockResolvedValue(null);

      const result = await findPaymentByOrderId(orderId);

      expect(mockPayment.findFirst).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test("should handle different orderId formats", async () => {
      const orderIds = ["ORDER-111", "ORDER-ABC-123", "ORD123456"];

      for (const orderId of orderIds) {
        mockPayment.findFirst.mockResolvedValue(createMockPayment({ orderId }));

        const result = await findPaymentByOrderId(orderId);

        expect(result.orderId).toBe(orderId);
      }

      expect(mockPayment.findFirst).toHaveBeenCalledTimes(3);
    });

    test("should include user and ticket details", async () => {
      const orderId = "ORDER-789012";
      const expectedPayment = createMockPayment({ orderId });

      mockPayment.findFirst.mockResolvedValue(expectedPayment);

      const result = await findPaymentByOrderId(orderId);

      expect(result.user).toBeDefined();
      expect(result.ticket).toBeDefined();
      expect(result.ticket.event).toBeDefined();
      expect(result.ticket.category).toBeDefined();
    });
  });

  describe("updatePaymentStatus", () => {
    test("should update payment status to success", async () => {
      const orderId = "ORDER-123456";
      const status = "success";
      const updatedPayment = createMockPayment({
        orderId,
        status: "success",
        updatedAt: new Date("2025-12-06T15:00:00.000Z"),
      });

      mockPayment.update.mockResolvedValue(updatedPayment);

      const result = await updatePaymentStatus(orderId, status);

      expect(mockPayment.update).toHaveBeenCalledTimes(1);
      expect(mockPayment.update).toHaveBeenCalledWith({
        where: { orderId: "ORDER-123456" },
        data: { status: "success" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          ticket: {
            include: {
              event: true,
              category: true,
            },
          },
        },
      });

      expect(result).toEqual(updatedPayment);
      expect(result.status).toBe("success");
    });

    test("should update payment status to failed", async () => {
      const orderId = "ORDER-789012";
      const status = "failed";
      const updatedPayment = createMockPayment({
        orderId,
        status: "failed",
      });

      mockPayment.update.mockResolvedValue(updatedPayment);

      const result = await updatePaymentStatus(orderId, status);

      expect(mockPayment.update).toHaveBeenCalledWith({
        where: { orderId: "ORDER-789012" },
        data: { status: "failed" },
        include: expect.any(Object),
      });

      expect(result.status).toBe("failed");
    });

    test("should update payment status to cancelled", async () => {
      const orderId = "ORDER-555555";
      const status = "cancelled";
      const updatedPayment = createMockPayment({
        orderId,
        status: "cancelled",
      });

      mockPayment.update.mockResolvedValue(updatedPayment);

      const result = await updatePaymentStatus(orderId, status);

      expect(result.status).toBe("cancelled");
    });

    test("should include user and ticket details in response", async () => {
      const orderId = "ORDER-111111";
      const status = "success";
      const updatedPayment = createMockPayment({
        orderId,
        status: "success",
      });

      mockPayment.update.mockResolvedValue(updatedPayment);

      const result = await updatePaymentStatus(orderId, status);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.name).toBeDefined();
      expect(result.user.email).toBeDefined();
      expect(result.ticket).toBeDefined();
      expect(result.ticket.event).toBeDefined();
      expect(result.ticket.category).toBeDefined();
    });

    test("should update using orderId in where clause", async () => {
      const orderId = "ORDER-UNIQUE-ID";
      const status = "success";

      mockPayment.update.mockResolvedValue(
        createMockPayment({ orderId, status })
      );

      await updatePaymentStatus(orderId, status);

      const callArgs = mockPayment.update.mock.calls[0][0];
      expect(callArgs.where).toEqual({ orderId: "ORDER-UNIQUE-ID" });
      expect(callArgs.data).toEqual({ status: "success" });
    });

    test("should handle different status transitions", async () => {
      const orderId = "ORDER-MULTI";
      const statuses = [
        "pending",
        "processing",
        "success",
        "failed",
        "cancelled",
      ];

      for (const status of statuses) {
        mockPayment.update.mockResolvedValue(
          createMockPayment({ orderId, status })
        );

        const result = await updatePaymentStatus(orderId, status);

        expect(result.status).toBe(status);
      }

      expect(mockPayment.update).toHaveBeenCalledTimes(5);
    });
  });
});
