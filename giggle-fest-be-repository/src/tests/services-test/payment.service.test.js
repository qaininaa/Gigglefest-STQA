import { jest } from "@jest/globals";

// Mock all dependencies
jest.unstable_mockModule("crypto", () => ({
  randomBytes: jest.fn(),
}));

jest.unstable_mockModule(
  "../../../src/repositories/payment.repository.js",
  () => ({
    createPayment: jest.fn(),
    findPaymentByOrderId: jest.fn(),
    findPaymentById: jest.fn(),
    updatePaymentStatus: jest.fn(),
    findAllPayments: jest.fn(),
  })
);

jest.unstable_mockModule(
  "../../../src/repositories/ticket.repository.js",
  () => ({
    findTicketById: jest.fn(),
  })
);

jest.unstable_mockModule(
  "../../../src/repositories/user.repository.js",
  () => ({
    findUserById: jest.fn(),
  })
);

jest.unstable_mockModule(
  "../../../src/repositories/promo.repository.js",
  () => ({
    findPromoCodeByCode: jest.fn(),
  })
);

jest.unstable_mockModule("../../../src/libs/midtrans.config.js", () => ({
  snap: {
    createTransaction: jest.fn(),
  },
  core: {
    transaction: {
      status: jest.fn(),
    },
  },
}));

// Import mocked modules
const { randomBytes } = await import("crypto");
const paymentRepository = await import(
  "../../../src/repositories/payment.repository.js"
);
const ticketRepository = await import(
  "../../../src/repositories/ticket.repository.js"
);
const userRepository = await import(
  "../../../src/repositories/user.repository.js"
);
const promoRepository = await import(
  "../../../src/repositories/promo.repository.js"
);
const { snap, core } = await import("../../../src/libs/midtrans.config.js");

// Import service to test
const {
  generateOrderId,
  initializePayment,
  checkAndUpdatePaymentStatus,
  getAllPayments,
  getPaymentById,
  getUserPaymentHistory,
} = await import("../../../src/services/payment.service.js");

describe("Payment Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper functions
  const createMockTicket = (overrides = {}) => ({
    id: 1,
    name: "VIP Ticket",
    price: 100000,
    quantity: 50,
    category: { name: "VIP" },
    ...overrides,
  });

  const createMockUser = (overrides = {}) => ({
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    phoneNumber: "081234567890",
    ...overrides,
  });

  const createMockPromo = (overrides = {}) => ({
    id: 1,
    code: "PROMO10",
    discount: 10,
    ...overrides,
  });

  const createMockPayment = (overrides = {}) => ({
    id: 1,
    ticketId: 1,
    userId: 1,
    amount: 90000,
    originalAmount: 100000,
    discount: 10000,
    status: "pending",
    orderId: "ORDER-ABCDEF1234",
    paymentDate: new Date(),
    ...overrides,
  });

  describe("generateOrderId", () => {
    test("should generate order ID with correct format", () => {
      randomBytes.mockReturnValue(Buffer.from([0xab, 0xcd, 0xef, 0x12, 0x34]));

      const orderId = generateOrderId();

      expect(randomBytes).toHaveBeenCalledWith(5);
      expect(orderId).toBe("ORDER-ABCDEF1234");
    });

    test("should generate unique order IDs", () => {
      randomBytes
        .mockReturnValueOnce(Buffer.from([0x11, 0x22, 0x33, 0x44, 0x55]))
        .mockReturnValueOnce(Buffer.from([0xaa, 0xbb, 0xcc, 0xdd, 0xee]));

      const orderId1 = generateOrderId();
      const orderId2 = generateOrderId();

      expect(orderId1).toBe("ORDER-1122334455");
      expect(orderId2).toBe("ORDER-AABBCCDDEE");
      expect(orderId1).not.toBe(orderId2);
    });
  });

  describe("initializePayment", () => {
    const userId = 1;
    const paymentData = {
      ticketId: 1,
      quantity: 2,
      promoCode: null,
    };

    test("should initialize payment successfully without promo code", async () => {
      const mockTicket = createMockTicket();
      const mockUser = createMockUser();
      const mockPayment = createMockPayment();
      const mockTransactionToken = {
        token: "mock-token-123",
        redirect_url: "https://midtrans.com/payment",
      };

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      userRepository.findUserById.mockResolvedValue(mockUser);
      randomBytes.mockReturnValue(Buffer.from([0xab, 0xcd, 0xef, 0x12, 0x34]));
      snap.createTransaction.mockResolvedValue(mockTransactionToken);
      paymentRepository.createPayment.mockResolvedValue(mockPayment);

      const result = await initializePayment(userId, paymentData);

      expect(ticketRepository.findTicketById).toHaveBeenCalledWith(1);
      expect(userRepository.findUserById).toHaveBeenCalledWith(1);
      expect(snap.createTransaction).toHaveBeenCalledWith({
        transaction_details: {
          order_id: "ORDER-ABCDEF1234",
          gross_amount: 200000,
        },
        customer_details: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          phone: "081234567890",
        },
        item_details: [
          {
            id: "1",
            price: 100000,
            quantity: 2,
            name: "VIP Ticket",
            category: "VIP",
          },
        ],
      });
      expect(paymentRepository.createPayment).toHaveBeenCalledWith({
        ticketId: 1,
        userId: 1,
        amount: 200000,
        originalAmount: 200000,
        discount: 0,
        status: "pending",
        orderId: "ORDER-ABCDEF1234",
      });
      expect(result).toEqual({
        payment: mockPayment,
        transactionToken: "mock-token-123",
        redirectUrl: "https://midtrans.com/payment",
      });
    });

    test("should initialize payment successfully with promo code", async () => {
      const mockTicket = createMockTicket();
      const mockUser = createMockUser();
      const mockPromo = createMockPromo({ discount: 20 });
      const mockPayment = createMockPayment();
      const mockTransactionToken = {
        token: "mock-token-456",
        redirect_url: "https://midtrans.com/payment",
      };

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      userRepository.findUserById.mockResolvedValue(mockUser);
      promoRepository.findPromoCodeByCode.mockResolvedValue(mockPromo);
      randomBytes.mockReturnValue(Buffer.from([0x11, 0x22, 0x33, 0x44, 0x55]));
      snap.createTransaction.mockResolvedValue(mockTransactionToken);
      paymentRepository.createPayment.mockResolvedValue(mockPayment);

      const result = await initializePayment(userId, {
        ...paymentData,
        promoCode: "PROMO20",
      });

      expect(promoRepository.findPromoCodeByCode).toHaveBeenCalledWith(
        "PROMO20"
      );
      expect(snap.createTransaction).toHaveBeenCalledWith({
        transaction_details: {
          order_id: "ORDER-1122334455",
          gross_amount: 160000,
        },
        customer_details: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          phone: "081234567890",
        },
        item_details: [
          {
            id: "1",
            price: 100000,
            quantity: 2,
            name: "VIP Ticket",
            category: "VIP",
          },
          {
            id: "DISCOUNT",
            price: -40000,
            quantity: 1,
            name: "Promo: PROMO20",
            category: "Discount",
          },
        ],
      });
      expect(paymentRepository.createPayment).toHaveBeenCalledWith({
        ticketId: 1,
        userId: 1,
        amount: 160000,
        originalAmount: 200000,
        discount: 40000,
        status: "pending",
        orderId: "ORDER-1122334455",
      });
    });

    test("should handle user with single name correctly", async () => {
      const mockTicket = createMockTicket();
      const mockUser = createMockUser({
        name: "Madonna",
        email: "madonna@example.com",
      });
      const mockPayment = createMockPayment();
      const mockTransactionToken = {
        token: "mock-token",
        redirect_url: "https://midtrans.com/payment",
      };

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      userRepository.findUserById.mockResolvedValue(mockUser);
      randomBytes.mockReturnValue(Buffer.from([0xaa, 0xbb, 0xcc, 0xdd, 0xee]));
      snap.createTransaction.mockResolvedValue(mockTransactionToken);
      paymentRepository.createPayment.mockResolvedValue(mockPayment);

      await initializePayment(userId, paymentData);

      expect(snap.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_details: {
            first_name: "Madonna",
            last_name: "",
            email: "madonna@example.com",
            phone: "081234567890",
          },
        })
      );
    });

    test("should throw error if ticket not found", async () => {
      ticketRepository.findTicketById.mockResolvedValue(null);
      userRepository.findUserById.mockResolvedValue(createMockUser());

      await expect(initializePayment(userId, paymentData)).rejects.toThrow(
        "Ticket not found"
      );
      expect(snap.createTransaction).not.toHaveBeenCalled();
    });

    test("should throw error if user not found", async () => {
      ticketRepository.findTicketById.mockResolvedValue(createMockTicket());
      userRepository.findUserById.mockResolvedValue(null);

      await expect(initializePayment(userId, paymentData)).rejects.toThrow(
        "User not found"
      );
      expect(snap.createTransaction).not.toHaveBeenCalled();
    });

    test("should throw error if not enough tickets available", async () => {
      const mockTicket = createMockTicket({ quantity: 1 });
      const mockUser = createMockUser();

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      userRepository.findUserById.mockResolvedValue(mockUser);

      await expect(
        initializePayment(userId, { ...paymentData, quantity: 5 })
      ).rejects.toThrow("Not enough tickets available");
      expect(snap.createTransaction).not.toHaveBeenCalled();
    });

    test("should throw error if promo code is invalid", async () => {
      const mockTicket = createMockTicket();
      const mockUser = createMockUser();

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      userRepository.findUserById.mockResolvedValue(mockUser);
      promoRepository.findPromoCodeByCode.mockResolvedValue(null);

      await expect(
        initializePayment(userId, { ...paymentData, promoCode: "INVALID" })
      ).rejects.toThrow("Invalid promo code");
      expect(snap.createTransaction).not.toHaveBeenCalled();
    });

    test("should round amounts correctly", async () => {
      const mockTicket = createMockTicket({ price: 100333.33 });
      const mockUser = createMockUser();
      const mockPromo = createMockPromo({ discount: 15 });
      const mockPayment = createMockPayment();
      const mockTransactionToken = {
        token: "mock-token",
        redirect_url: "https://midtrans.com/payment",
      };

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      userRepository.findUserById.mockResolvedValue(mockUser);
      promoRepository.findPromoCodeByCode.mockResolvedValue(mockPromo);
      randomBytes.mockReturnValue(Buffer.from([0x11, 0x22, 0x33, 0x44, 0x55]));
      snap.createTransaction.mockResolvedValue(mockTransactionToken);
      paymentRepository.createPayment.mockResolvedValue(mockPayment);

      await initializePayment(userId, {
        ticketId: 1,
        quantity: 3,
        promoCode: "PROMO15",
      });

      const originalAmount = 100333.33 * 3; // 301000
      const discount = Math.round((originalAmount * 15) / 100); // 45150
      const amount = originalAmount - discount; // 255850

      expect(snap.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction_details: {
            order_id: "ORDER-1122334455",
            gross_amount: Math.round(amount),
          },
        })
      );
      expect(paymentRepository.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: Math.round(amount),
          originalAmount: Math.round(originalAmount),
          discount: Math.round(discount),
        })
      );
    });
  });

  describe("checkAndUpdatePaymentStatus", () => {
    const orderId = "ORDER-ABCDEF1234";

    test("should return payment if already success", async () => {
      const mockPayment = createMockPayment({ status: "success" });
      paymentRepository.findPaymentByOrderId.mockResolvedValue(mockPayment);

      const result = await checkAndUpdatePaymentStatus(orderId);

      expect(paymentRepository.findPaymentByOrderId).toHaveBeenCalledWith(
        orderId
      );
      expect(core.transaction.status).not.toHaveBeenCalled();
      expect(result).toEqual(mockPayment);
    });

    test("should return payment if already failed", async () => {
      const mockPayment = createMockPayment({ status: "failed" });
      paymentRepository.findPaymentByOrderId.mockResolvedValue(mockPayment);

      const result = await checkAndUpdatePaymentStatus(orderId);

      expect(core.transaction.status).not.toHaveBeenCalled();
      expect(result).toEqual(mockPayment);
    });

    test("should throw error if payment not found", async () => {
      paymentRepository.findPaymentByOrderId.mockResolvedValue(null);

      await expect(checkAndUpdatePaymentStatus(orderId)).rejects.toThrow(
        "Payment not found"
      );
    });

    test("should update status to success for capture with accept", async () => {
      const mockPayment = createMockPayment({ status: "pending" });
      const mockUpdatedPayment = createMockPayment({ status: "success" });
      const mockMidtransStatus = {
        transaction_status: "capture",
        fraud_status: "accept",
      };

      paymentRepository.findPaymentByOrderId.mockResolvedValue(mockPayment);
      core.transaction.status.mockResolvedValue(mockMidtransStatus);
      paymentRepository.updatePaymentStatus.mockResolvedValue(
        mockUpdatedPayment
      );

      const result = await checkAndUpdatePaymentStatus(orderId);

      expect(core.transaction.status).toHaveBeenCalledWith(orderId);
      expect(paymentRepository.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        "success"
      );
      expect(result).toEqual(mockUpdatedPayment);
    });

    test("should update status to challenge for capture with challenge", async () => {
      const mockPayment = createMockPayment({ status: "pending" });
      const mockUpdatedPayment = createMockPayment({ status: "challenge" });
      const mockMidtransStatus = {
        transaction_status: "capture",
        fraud_status: "challenge",
      };

      paymentRepository.findPaymentByOrderId.mockResolvedValue(mockPayment);
      core.transaction.status.mockResolvedValue(mockMidtransStatus);
      paymentRepository.updatePaymentStatus.mockResolvedValue(
        mockUpdatedPayment
      );

      const result = await checkAndUpdatePaymentStatus(orderId);

      expect(paymentRepository.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        "challenge"
      );
      expect(result).toEqual(mockUpdatedPayment);
    });

    test("should update status to success for settlement", async () => {
      const mockPayment = createMockPayment({ status: "pending" });
      const mockUpdatedPayment = createMockPayment({ status: "success" });
      const mockMidtransStatus = {
        transaction_status: "settlement",
      };

      paymentRepository.findPaymentByOrderId.mockResolvedValue(mockPayment);
      core.transaction.status.mockResolvedValue(mockMidtransStatus);
      paymentRepository.updatePaymentStatus.mockResolvedValue(
        mockUpdatedPayment
      );

      const result = await checkAndUpdatePaymentStatus(orderId);

      expect(paymentRepository.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        "success"
      );
      expect(result).toEqual(mockUpdatedPayment);
    });

    test("should update status to failed for cancel", async () => {
      const mockPayment = createMockPayment({ status: "pending" });
      const mockUpdatedPayment = createMockPayment({ status: "failed" });
      const mockMidtransStatus = {
        transaction_status: "cancel",
      };

      paymentRepository.findPaymentByOrderId.mockResolvedValue(mockPayment);
      core.transaction.status.mockResolvedValue(mockMidtransStatus);
      paymentRepository.updatePaymentStatus.mockResolvedValue(
        mockUpdatedPayment
      );

      const result = await checkAndUpdatePaymentStatus(orderId);

      expect(paymentRepository.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        "failed"
      );
      expect(result).toEqual(mockUpdatedPayment);
    });

    test("should update status to failed for deny", async () => {
      const mockPayment = createMockPayment({ status: "pending" });
      const mockUpdatedPayment = createMockPayment({ status: "failed" });
      const mockMidtransStatus = {
        transaction_status: "deny",
      };

      paymentRepository.findPaymentByOrderId.mockResolvedValue(mockPayment);
      core.transaction.status.mockResolvedValue(mockMidtransStatus);
      paymentRepository.updatePaymentStatus.mockResolvedValue(
        mockUpdatedPayment
      );

      const result = await checkAndUpdatePaymentStatus(orderId);

      expect(paymentRepository.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        "failed"
      );
      expect(result).toEqual(mockUpdatedPayment);
    });

    test("should update status to failed for expire", async () => {
      const mockPayment = createMockPayment({ status: "pending" });
      const mockUpdatedPayment = createMockPayment({ status: "failed" });
      const mockMidtransStatus = {
        transaction_status: "expire",
      };

      paymentRepository.findPaymentByOrderId.mockResolvedValue(mockPayment);
      core.transaction.status.mockResolvedValue(mockMidtransStatus);
      paymentRepository.updatePaymentStatus.mockResolvedValue(
        mockUpdatedPayment
      );

      const result = await checkAndUpdatePaymentStatus(orderId);

      expect(paymentRepository.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        "failed"
      );
      expect(result).toEqual(mockUpdatedPayment);
    });

    test("should keep status pending for other transaction status", async () => {
      const mockPayment = createMockPayment({ status: "pending" });
      const mockUpdatedPayment = createMockPayment({ status: "pending" });
      const mockMidtransStatus = {
        transaction_status: "authorize",
      };

      paymentRepository.findPaymentByOrderId.mockResolvedValue(mockPayment);
      core.transaction.status.mockResolvedValue(mockMidtransStatus);
      paymentRepository.updatePaymentStatus.mockResolvedValue(
        mockUpdatedPayment
      );

      const result = await checkAndUpdatePaymentStatus(orderId);

      expect(paymentRepository.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        "pending"
      );
      expect(result).toEqual(mockUpdatedPayment);
    });

    test("should mark as failed if payment is older than 24 hours and Midtrans check fails", async () => {
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const mockPayment = createMockPayment({
        status: "pending",
        paymentDate: oldDate,
      });
      const mockUpdatedPayment = createMockPayment({ status: "failed" });

      paymentRepository.findPaymentByOrderId.mockResolvedValue(mockPayment);
      core.transaction.status.mockRejectedValue(new Error("Midtrans error"));
      paymentRepository.updatePaymentStatus.mockResolvedValue(
        mockUpdatedPayment
      );

      const result = await checkAndUpdatePaymentStatus(orderId);

      expect(paymentRepository.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        "failed"
      );
      expect(result).toEqual(mockUpdatedPayment);
    });

    test("should return original payment if Midtrans check fails and payment is recent", async () => {
      const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      const mockPayment = createMockPayment({
        status: "pending",
        paymentDate: recentDate,
      });

      paymentRepository.findPaymentByOrderId.mockResolvedValue(mockPayment);
      core.transaction.status.mockRejectedValue(new Error("Midtrans error"));

      const result = await checkAndUpdatePaymentStatus(orderId);

      expect(paymentRepository.updatePaymentStatus).not.toHaveBeenCalled();
      expect(result).toEqual(mockPayment);
    });

    test("should throw error with message when other errors occur", async () => {
      paymentRepository.findPaymentByOrderId.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(checkAndUpdatePaymentStatus(orderId)).rejects.toThrow(
        "Failed to check payment status: Database connection failed"
      );
    });
  });

  describe("getAllPayments", () => {
    test("should get all payments without updating pending ones", async () => {
      const mockPayments = {
        payments: [
          createMockPayment({ id: 1, status: "success" }),
          createMockPayment({ id: 2, status: "failed" }),
        ],
        pagination: { page: 1, limit: 10, total: 2 },
      };

      paymentRepository.findAllPayments.mockResolvedValue(mockPayments);

      const result = await getAllPayments({ page: 1, limit: 10 });

      expect(paymentRepository.findAllPayments).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockPayments);
    });

    test("should update pending payments and refetch", async () => {
      const pendingPayment = createMockPayment({
        id: 1,
        status: "pending",
        orderId: "ORDER-PENDING",
      });
      const mockPaymentsFirst = {
        payments: [pendingPayment],
        pagination: { page: 1, limit: 10, total: 1 },
      };
      const mockPaymentsSecond = {
        payments: [createMockPayment({ id: 1, status: "success" })],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      paymentRepository.findAllPayments
        .mockResolvedValueOnce(mockPaymentsFirst)
        .mockResolvedValueOnce(mockPaymentsSecond);
      paymentRepository.findPaymentByOrderId.mockResolvedValue(pendingPayment);
      core.transaction.status.mockResolvedValue({
        transaction_status: "settlement",
      });
      paymentRepository.updatePaymentStatus.mockResolvedValue(
        createMockPayment({ status: "success" })
      );

      const result = await getAllPayments({ page: 1, limit: 10 });

      expect(paymentRepository.findAllPayments).toHaveBeenCalledTimes(2);
      expect(paymentRepository.findPaymentByOrderId).toHaveBeenCalledWith(
        "ORDER-PENDING"
      );
      expect(result).toEqual(mockPaymentsSecond);
    });

    test("should continue if updating a pending payment fails", async () => {
      const pendingPayment = createMockPayment({
        id: 1,
        status: "pending",
        orderId: "ORDER-PENDING",
      });
      const mockPayments = {
        payments: [pendingPayment],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      paymentRepository.findAllPayments.mockResolvedValue(mockPayments);
      paymentRepository.findPaymentByOrderId.mockRejectedValue(
        new Error("Update failed")
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await getAllPayments({ page: 1, limit: 10 });

      expect(paymentRepository.findAllPayments).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to update payment status for order"),
        expect.any(Error)
      );
      expect(result).toEqual(mockPayments);

      consoleSpy.mockRestore();
    });

    test("should handle multiple pending payments", async () => {
      const mockPaymentsFirst = {
        payments: [
          createMockPayment({ id: 1, status: "pending", orderId: "ORDER-1" }),
          createMockPayment({ id: 2, status: "pending", orderId: "ORDER-2" }),
          createMockPayment({ id: 3, status: "success", orderId: "ORDER-3" }),
        ],
        pagination: { page: 1, limit: 10, total: 3 },
      };
      const mockPaymentsSecond = {
        payments: [
          createMockPayment({ id: 1, status: "success" }),
          createMockPayment({ id: 2, status: "failed" }),
          createMockPayment({ id: 3, status: "success" }),
        ],
        pagination: { page: 1, limit: 10, total: 3 },
      };

      paymentRepository.findAllPayments
        .mockResolvedValueOnce(mockPaymentsFirst)
        .mockResolvedValueOnce(mockPaymentsSecond);
      paymentRepository.findPaymentByOrderId
        .mockResolvedValueOnce(
          createMockPayment({ status: "pending", orderId: "ORDER-1" })
        )
        .mockResolvedValueOnce(
          createMockPayment({ status: "pending", orderId: "ORDER-2" })
        );
      core.transaction.status
        .mockResolvedValueOnce({ transaction_status: "settlement" })
        .mockResolvedValueOnce({ transaction_status: "cancel" });
      paymentRepository.updatePaymentStatus
        .mockResolvedValueOnce(createMockPayment({ status: "success" }))
        .mockResolvedValueOnce(createMockPayment({ status: "failed" }));

      const result = await getAllPayments({ page: 1, limit: 10 });

      expect(paymentRepository.findPaymentByOrderId).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockPaymentsSecond);
    });
  });

  describe("getPaymentById", () => {
    const paymentId = 1;

    test("should get payment by ID without userId", async () => {
      const mockPayment = createMockPayment({ status: "success" });
      paymentRepository.findPaymentById.mockResolvedValue(mockPayment);

      const result = await getPaymentById(paymentId);

      expect(paymentRepository.findPaymentById).toHaveBeenCalledWith(
        paymentId,
        null
      );
      expect(result).toEqual(mockPayment);
    });

    test("should get payment by ID with userId", async () => {
      const userId = 1;
      const mockPayment = createMockPayment({ status: "success" });
      paymentRepository.findPaymentById.mockResolvedValue(mockPayment);

      const result = await getPaymentById(paymentId, userId);

      expect(paymentRepository.findPaymentById).toHaveBeenCalledWith(
        paymentId,
        userId
      );
      expect(result).toEqual(mockPayment);
    });

    test("should throw error if payment not found", async () => {
      paymentRepository.findPaymentById.mockResolvedValue(null);

      await expect(getPaymentById(paymentId)).rejects.toThrow(
        "Payment not found"
      );
    });

    test("should update pending payment status and return updated payment", async () => {
      const pendingPayment = createMockPayment({
        status: "pending",
        orderId: "ORDER-PENDING",
      });
      const updatedPayment = createMockPayment({ status: "success" });

      paymentRepository.findPaymentById.mockResolvedValue(pendingPayment);
      paymentRepository.findPaymentByOrderId.mockResolvedValue(pendingPayment);
      core.transaction.status.mockResolvedValue({
        transaction_status: "settlement",
      });
      paymentRepository.updatePaymentStatus.mockResolvedValue(updatedPayment);

      const result = await getPaymentById(paymentId);

      expect(paymentRepository.findPaymentByOrderId).toHaveBeenCalledWith(
        "ORDER-PENDING"
      );
      expect(result).toEqual(updatedPayment);
    });

    test("should return original payment if status update fails", async () => {
      const pendingPayment = createMockPayment({
        status: "pending",
        orderId: "ORDER-PENDING",
      });

      paymentRepository.findPaymentById.mockResolvedValue(pendingPayment);
      paymentRepository.findPaymentByOrderId.mockRejectedValue(
        new Error("Update failed")
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await getPaymentById(paymentId);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to update payment status:",
        expect.any(Error)
      );
      expect(result).toEqual(pendingPayment);

      consoleSpy.mockRestore();
    });

    test("should not update non-pending payment", async () => {
      const mockPayment = createMockPayment({ status: "success" });
      paymentRepository.findPaymentById.mockResolvedValue(mockPayment);

      const result = await getPaymentById(paymentId);

      expect(paymentRepository.findPaymentByOrderId).not.toHaveBeenCalled();
      expect(result).toEqual(mockPayment);
    });
  });

  describe("getUserPaymentHistory", () => {
    const userId = 1;
    const query = { page: 1, limit: 10 };

    test("should get user payment history without updating pending ones", async () => {
      const mockPayments = {
        payments: [
          createMockPayment({ id: 1, userId, status: "success" }),
          createMockPayment({ id: 2, userId, status: "failed" }),
        ],
        pagination: { page: 1, limit: 10, total: 2 },
      };

      paymentRepository.findAllPayments.mockResolvedValue(mockPayments);

      const result = await getUserPaymentHistory(userId, query);

      expect(paymentRepository.findAllPayments).toHaveBeenCalledWith({
        ...query,
        userId,
      });
      expect(paymentRepository.findAllPayments).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockPayments);
    });

    test("should update pending payments and refetch for user", async () => {
      const pendingPayment = createMockPayment({
        id: 1,
        userId,
        status: "pending",
        orderId: "ORDER-PENDING",
      });
      const mockPaymentsFirst = {
        payments: [pendingPayment],
        pagination: { page: 1, limit: 10, total: 1 },
      };
      const mockPaymentsSecond = {
        payments: [createMockPayment({ id: 1, userId, status: "success" })],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      paymentRepository.findAllPayments
        .mockResolvedValueOnce(mockPaymentsFirst)
        .mockResolvedValueOnce(mockPaymentsSecond);
      paymentRepository.findPaymentByOrderId.mockResolvedValue(pendingPayment);
      core.transaction.status.mockResolvedValue({
        transaction_status: "settlement",
      });
      paymentRepository.updatePaymentStatus.mockResolvedValue(
        createMockPayment({ status: "success" })
      );

      const result = await getUserPaymentHistory(userId, query);

      expect(paymentRepository.findAllPayments).toHaveBeenCalledTimes(2);
      expect(paymentRepository.findAllPayments).toHaveBeenNthCalledWith(1, {
        ...query,
        userId,
      });
      expect(paymentRepository.findAllPayments).toHaveBeenNthCalledWith(2, {
        ...query,
        userId,
      });
      expect(result).toEqual(mockPaymentsSecond);
    });

    test("should continue if updating a pending payment fails for user", async () => {
      const pendingPayment = createMockPayment({
        id: 1,
        userId,
        status: "pending",
        orderId: "ORDER-PENDING",
      });
      const mockPayments = {
        payments: [pendingPayment],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      paymentRepository.findAllPayments.mockResolvedValue(mockPayments);
      paymentRepository.findPaymentByOrderId.mockRejectedValue(
        new Error("Update failed")
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await getUserPaymentHistory(userId, query);

      expect(paymentRepository.findAllPayments).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to update payment status for order"),
        expect.any(Error)
      );
      expect(result).toEqual(mockPayments);

      consoleSpy.mockRestore();
    });

    test("should handle multiple pending payments for user", async () => {
      const mockPaymentsFirst = {
        payments: [
          createMockPayment({
            id: 1,
            userId,
            status: "pending",
            orderId: "ORDER-1",
          }),
          createMockPayment({
            id: 2,
            userId,
            status: "pending",
            orderId: "ORDER-2",
          }),
        ],
        pagination: { page: 1, limit: 10, total: 2 },
      };
      const mockPaymentsSecond = {
        payments: [
          createMockPayment({ id: 1, userId, status: "success" }),
          createMockPayment({ id: 2, userId, status: "failed" }),
        ],
        pagination: { page: 1, limit: 10, total: 2 },
      };

      paymentRepository.findAllPayments
        .mockResolvedValueOnce(mockPaymentsFirst)
        .mockResolvedValueOnce(mockPaymentsSecond);
      paymentRepository.findPaymentByOrderId
        .mockResolvedValueOnce(
          createMockPayment({ status: "pending", orderId: "ORDER-1" })
        )
        .mockResolvedValueOnce(
          createMockPayment({ status: "pending", orderId: "ORDER-2" })
        );
      core.transaction.status
        .mockResolvedValueOnce({ transaction_status: "settlement" })
        .mockResolvedValueOnce({ transaction_status: "deny" });
      paymentRepository.updatePaymentStatus
        .mockResolvedValueOnce(createMockPayment({ status: "success" }))
        .mockResolvedValueOnce(createMockPayment({ status: "failed" }));

      const result = await getUserPaymentHistory(userId, query);

      expect(paymentRepository.findPaymentByOrderId).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockPaymentsSecond);
    });

    test("should pass userId in query correctly", async () => {
      const customQuery = { page: 2, limit: 5, status: "success" };
      const mockPayments = {
        payments: [],
        pagination: { page: 2, limit: 5, total: 0 },
      };

      paymentRepository.findAllPayments.mockResolvedValue(mockPayments);

      await getUserPaymentHistory(userId, customQuery);

      expect(paymentRepository.findAllPayments).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        status: "success",
        userId,
      });
    });
  });
});
