import { jest } from "@jest/globals";

// Mock all dependencies
jest.unstable_mockModule(
  "../../../src/repositories/promo.repository.js",
  () => ({
    createPromoCode: jest.fn(),
    findPromoCodeByCode: jest.fn(),
    findPromoCodeById: jest.fn(),
    findAllPromoCodes: jest.fn(),
    updatePromoCode: jest.fn(),
    deletePromoCode: jest.fn(),
  })
);

jest.unstable_mockModule(
  "../../../src/repositories/notification.repository.js",
  () => ({
    createNotification: jest.fn(),
  })
);

// Import mocked modules
const promoRepository = await import(
  "../../../src/repositories/promo.repository.js"
);
const notificationRepository = await import(
  "../../../src/repositories/notification.repository.js"
);

// Import service to test
const {
  createPromoCode,
  getAllPromoCodes,
  validatePromoCode,
  updatePromoCode,
  deletePromoCode,
} = await import("../../../src/services/promo.service.js");

describe("Promo Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper functions
  const createMockPromo = (overrides = {}) => ({
    id: 1,
    code: "PROMO10",
    discount: 10,
    validFrom: new Date("2025-01-01"),
    validTo: new Date("2025-12-31"),
    createdAt: new Date(),
    ...overrides,
  });

  describe("createPromoCode", () => {
    const promoData = {
      code: "NEWPROMO",
      discount: 20,
      validFrom: new Date("2025-01-01"),
      validTo: new Date("2025-12-31"),
    };

    test("should create promo code successfully and send notification", async () => {
      const mockPromo = createMockPromo({
        code: "NEWPROMO",
        discount: 20,
      });

      promoRepository.findPromoCodeByCode.mockResolvedValue(null);
      promoRepository.createPromoCode.mockResolvedValue(mockPromo);
      notificationRepository.createNotification.mockResolvedValue({
        id: 1,
        message: expect.any(String),
      });

      const result = await createPromoCode(promoData);

      expect(promoRepository.findPromoCodeByCode).toHaveBeenCalledWith(
        "NEWPROMO"
      );
      expect(promoRepository.createPromoCode).toHaveBeenCalledWith(promoData);
      expect(notificationRepository.createNotification).toHaveBeenCalledWith({
        message: `New promo code NEWPROMO is available! Get 20% discount. Valid until ${mockPromo.validTo.toLocaleDateString()}`,
        userId: "all",
      });
      expect(result).toEqual(mockPromo);
    });

    test("should throw error if promo code already exists", async () => {
      const existingPromo = createMockPromo({ code: "NEWPROMO" });

      promoRepository.findPromoCodeByCode.mockResolvedValue(existingPromo);

      await expect(createPromoCode(promoData)).rejects.toThrow(
        "Promo code already exists"
      );
      expect(promoRepository.createPromoCode).not.toHaveBeenCalled();
      expect(notificationRepository.createNotification).not.toHaveBeenCalled();
    });

    test("should create notification with correct format", async () => {
      const mockPromo = createMockPromo({
        code: "SPECIAL50",
        discount: 50,
        validTo: new Date("2025-06-15"),
      });

      promoRepository.findPromoCodeByCode.mockResolvedValue(null);
      promoRepository.createPromoCode.mockResolvedValue(mockPromo);
      notificationRepository.createNotification.mockResolvedValue({
        id: 1,
        message: expect.any(String),
      });

      await createPromoCode({
        code: "SPECIAL50",
        discount: 50,
        validFrom: new Date("2025-01-01"),
        validTo: new Date("2025-06-15"),
      });

      expect(notificationRepository.createNotification).toHaveBeenCalledWith({
        message: `New promo code SPECIAL50 is available! Get 50% discount. Valid until ${mockPromo.validTo.toLocaleDateString()}`,
        userId: "all",
      });
    });

    test("should broadcast notification to all users", async () => {
      const mockPromo = createMockPromo();

      promoRepository.findPromoCodeByCode.mockResolvedValue(null);
      promoRepository.createPromoCode.mockResolvedValue(mockPromo);
      notificationRepository.createNotification.mockResolvedValue({
        id: 1,
        message: expect.any(String),
      });

      await createPromoCode(promoData);

      const notificationCall =
        notificationRepository.createNotification.mock.calls[0][0];
      expect(notificationCall.userId).toBe("all");
    });
  });

  describe("getAllPromoCodes", () => {
    test("should get all promo codes with default query", async () => {
      const mockPromoCodes = {
        promoCodes: [
          createMockPromo({ id: 1, code: "PROMO1" }),
          createMockPromo({ id: 2, code: "PROMO2" }),
        ],
        pagination: { page: 1, limit: 10, total: 2 },
      };

      promoRepository.findAllPromoCodes.mockResolvedValue(mockPromoCodes);

      const result = await getAllPromoCodes({});

      expect(promoRepository.findAllPromoCodes).toHaveBeenCalledWith({});
      expect(result).toEqual(mockPromoCodes);
    });

    test("should get all promo codes with pagination", async () => {
      const query = { page: 2, limit: 5 };
      const mockPromoCodes = {
        promoCodes: [createMockPromo()],
        pagination: { page: 2, limit: 5, total: 10 },
      };

      promoRepository.findAllPromoCodes.mockResolvedValue(mockPromoCodes);

      const result = await getAllPromoCodes(query);

      expect(promoRepository.findAllPromoCodes).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPromoCodes);
    });

    test("should get all promo codes with search query", async () => {
      const query = { search: "WINTER" };
      const mockPromoCodes = {
        promoCodes: [createMockPromo({ code: "WINTER2025" })],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      promoRepository.findAllPromoCodes.mockResolvedValue(mockPromoCodes);

      const result = await getAllPromoCodes(query);

      expect(promoRepository.findAllPromoCodes).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPromoCodes);
    });

    test("should return empty array when no promo codes found", async () => {
      const mockPromoCodes = {
        promoCodes: [],
        pagination: { page: 1, limit: 10, total: 0 },
      };

      promoRepository.findAllPromoCodes.mockResolvedValue(mockPromoCodes);

      const result = await getAllPromoCodes({});

      expect(result).toEqual(mockPromoCodes);
    });
  });

  describe("validatePromoCode", () => {
    test("should validate promo code successfully when valid", async () => {
      const now = new Date();
      const mockPromo = createMockPromo({
        code: "VALID",
        validFrom: new Date(now.getTime() - 86400000), // 1 day ago
        validTo: new Date(now.getTime() + 86400000), // 1 day from now
      });

      promoRepository.findPromoCodeByCode.mockResolvedValue(mockPromo);

      const result = await validatePromoCode("VALID");

      expect(promoRepository.findPromoCodeByCode).toHaveBeenCalledWith("VALID");
      expect(result).toEqual(mockPromo);
    });

    test("should throw error if promo code not found", async () => {
      promoRepository.findPromoCodeByCode.mockResolvedValue(null);

      await expect(validatePromoCode("NONEXISTENT")).rejects.toThrow(
        "Invalid promo code"
      );
    });

    test("should throw error if promo code has expired", async () => {
      const now = new Date();
      const mockPromo = createMockPromo({
        code: "EXPIRED",
        validFrom: new Date(now.getTime() - 172800000), // 2 days ago
        validTo: new Date(now.getTime() - 86400000), // 1 day ago
      });

      promoRepository.findPromoCodeByCode.mockResolvedValue(mockPromo);

      await expect(validatePromoCode("EXPIRED")).rejects.toThrow(
        "Promo code has expired or not yet valid"
      );
    });

    test("should throw error if promo code is not yet valid", async () => {
      const now = new Date();
      const mockPromo = createMockPromo({
        code: "FUTURE",
        validFrom: new Date(now.getTime() + 86400000), // 1 day from now
        validTo: new Date(now.getTime() + 172800000), // 2 days from now
      });

      promoRepository.findPromoCodeByCode.mockResolvedValue(mockPromo);

      await expect(validatePromoCode("FUTURE")).rejects.toThrow(
        "Promo code has expired or not yet valid"
      );
    });

    test("should validate promo code on exact validFrom date", async () => {
      const now = new Date();
      const mockPromo = createMockPromo({
        code: "EXACT",
        validFrom: now,
        validTo: new Date(now.getTime() + 86400000),
      });

      promoRepository.findPromoCodeByCode.mockResolvedValue(mockPromo);

      const result = await validatePromoCode("EXACT");

      expect(result).toEqual(mockPromo);
    });

    test("should validate promo code on exact validTo date", async () => {
      const now = new Date();
      const mockPromo = createMockPromo({
        code: "EXACT",
        validFrom: new Date(now.getTime() - 86400000),
        validTo: now,
      });

      promoRepository.findPromoCodeByCode.mockResolvedValue(mockPromo);

      const result = await validatePromoCode("EXACT");

      expect(result).toEqual(mockPromo);
    });
  });

  describe("updatePromoCode", () => {
    const promoId = 1;

    test("should update promo code and send notification when code is changed", async () => {
      const promoData = { code: "UPDATED" };
      const mockUpdatedPromo = createMockPromo({
        code: "UPDATED",
        discount: 10,
      });

      promoRepository.updatePromoCode.mockResolvedValue(mockUpdatedPromo);
      notificationRepository.createNotification.mockResolvedValue({
        id: 1,
        message: expect.any(String),
      });

      const result = await updatePromoCode(promoId, promoData);

      expect(promoRepository.updatePromoCode).toHaveBeenCalledWith(
        promoId,
        promoData
      );
      expect(notificationRepository.createNotification).toHaveBeenCalledWith({
        message: `Promo code UPDATED has been updated! Now offering 10% discount. Valid until ${mockUpdatedPromo.validTo.toLocaleDateString()}`,
        userId: "all",
      });
      expect(result).toEqual(mockUpdatedPromo);
    });

    test("should update promo code and send notification when discount is changed", async () => {
      const promoData = { discount: 30 };
      const mockUpdatedPromo = createMockPromo({
        code: "PROMO10",
        discount: 30,
      });

      promoRepository.updatePromoCode.mockResolvedValue(mockUpdatedPromo);
      notificationRepository.createNotification.mockResolvedValue({
        id: 1,
        message: expect.any(String),
      });

      const result = await updatePromoCode(promoId, promoData);

      expect(notificationRepository.createNotification).toHaveBeenCalledWith({
        message: `Promo code PROMO10 has been updated! Now offering 30% discount. Valid until ${mockUpdatedPromo.validTo.toLocaleDateString()}`,
        userId: "all",
      });
      expect(result).toEqual(mockUpdatedPromo);
    });

    test("should update promo code and send notification when validTo is changed", async () => {
      const newDate = new Date("2026-06-30");
      const promoData = { validTo: newDate };
      const mockUpdatedPromo = createMockPromo({
        code: "PROMO10",
        discount: 10,
        validTo: newDate,
      });

      promoRepository.updatePromoCode.mockResolvedValue(mockUpdatedPromo);
      notificationRepository.createNotification.mockResolvedValue({
        id: 1,
        message: expect.any(String),
      });

      const result = await updatePromoCode(promoId, promoData);

      expect(notificationRepository.createNotification).toHaveBeenCalledWith({
        message: `Promo code PROMO10 has been updated! Now offering 10% discount. Valid until ${mockUpdatedPromo.validTo.toLocaleDateString()}`,
        userId: "all",
      });
      expect(result).toEqual(mockUpdatedPromo);
    });

    test("should update promo code and send notification when multiple fields are changed", async () => {
      const promoData = {
        code: "NEWCODE",
        discount: 25,
        validTo: new Date("2026-12-31"),
      };
      const mockUpdatedPromo = createMockPromo({
        code: "NEWCODE",
        discount: 25,
        validTo: new Date("2026-12-31"),
      });

      promoRepository.updatePromoCode.mockResolvedValue(mockUpdatedPromo);
      notificationRepository.createNotification.mockResolvedValue({
        id: 1,
        message: expect.any(String),
      });

      const result = await updatePromoCode(promoId, promoData);

      expect(notificationRepository.createNotification).toHaveBeenCalledWith({
        message: `Promo code NEWCODE has been updated! Now offering 25% discount. Valid until ${mockUpdatedPromo.validTo.toLocaleDateString()}`,
        userId: "all",
      });
      expect(result).toEqual(mockUpdatedPromo);
    });

    test("should update promo code without notification when only validFrom is changed", async () => {
      const promoData = { validFrom: new Date("2025-02-01") };
      const mockUpdatedPromo = createMockPromo({
        validFrom: new Date("2025-02-01"),
      });

      promoRepository.updatePromoCode.mockResolvedValue(mockUpdatedPromo);

      const result = await updatePromoCode(promoId, promoData);

      expect(promoRepository.updatePromoCode).toHaveBeenCalledWith(
        promoId,
        promoData
      );
      expect(notificationRepository.createNotification).not.toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedPromo);
    });

    test("should update promo code without notification when unrelated fields are changed", async () => {
      const promoData = { description: "Updated description" };
      const mockUpdatedPromo = createMockPromo({
        description: "Updated description",
      });

      promoRepository.updatePromoCode.mockResolvedValue(mockUpdatedPromo);

      const result = await updatePromoCode(promoId, promoData);

      expect(promoRepository.updatePromoCode).toHaveBeenCalledWith(
        promoId,
        promoData
      );
      expect(notificationRepository.createNotification).not.toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedPromo);
    });

    test("should broadcast notification to all users when updating", async () => {
      const promoData = { code: "BROADCAST" };
      const mockUpdatedPromo = createMockPromo({ code: "BROADCAST" });

      promoRepository.updatePromoCode.mockResolvedValue(mockUpdatedPromo);
      notificationRepository.createNotification.mockResolvedValue({
        id: 1,
        message: expect.any(String),
      });

      await updatePromoCode(promoId, promoData);

      const notificationCall =
        notificationRepository.createNotification.mock.calls[0][0];
      expect(notificationCall.userId).toBe("all");
    });
  });

  describe("deletePromoCode", () => {
    const promoId = 1;

    test("should delete promo code and send notification", async () => {
      const mockPromo = createMockPromo({ code: "TODELETE" });

      promoRepository.findPromoCodeById.mockResolvedValue(mockPromo);
      promoRepository.deletePromoCode.mockResolvedValue(mockPromo);
      notificationRepository.createNotification.mockResolvedValue({
        id: 1,
        message: expect.any(String),
      });

      const result = await deletePromoCode(promoId);

      expect(promoRepository.findPromoCodeById).toHaveBeenCalledWith(promoId);
      expect(notificationRepository.createNotification).toHaveBeenCalledWith({
        message: "Promo code TODELETE is no longer available",
        userId: "all",
      });
      expect(promoRepository.deletePromoCode).toHaveBeenCalledWith(promoId);
      expect(result).toEqual(mockPromo);
    });

    test("should throw error if promo code not found", async () => {
      promoRepository.findPromoCodeById.mockResolvedValue(null);

      await expect(deletePromoCode(promoId)).rejects.toThrow(
        "Promo code not found"
      );
      expect(promoRepository.deletePromoCode).not.toHaveBeenCalled();
      expect(notificationRepository.createNotification).not.toHaveBeenCalled();
    });

    test("should send notification before deleting", async () => {
      const mockPromo = createMockPromo();
      const callOrder = [];

      promoRepository.findPromoCodeById.mockResolvedValue(mockPromo);
      notificationRepository.createNotification.mockImplementation(() => {
        callOrder.push("notification");
        return Promise.resolve({ id: 1, message: expect.any(String) });
      });
      promoRepository.deletePromoCode.mockImplementation(() => {
        callOrder.push("delete");
        return Promise.resolve(mockPromo);
      });

      await deletePromoCode(promoId);

      expect(callOrder).toEqual(["notification", "delete"]);
    });

    test("should broadcast notification to all users when deleting", async () => {
      const mockPromo = createMockPromo();

      promoRepository.findPromoCodeById.mockResolvedValue(mockPromo);
      promoRepository.deletePromoCode.mockResolvedValue(mockPromo);
      notificationRepository.createNotification.mockResolvedValue({
        id: 1,
        message: expect.any(String),
      });

      await deletePromoCode(promoId);

      const notificationCall =
        notificationRepository.createNotification.mock.calls[0][0];
      expect(notificationCall.userId).toBe("all");
    });

    test("should include promo code in deletion notification message", async () => {
      const mockPromo = createMockPromo({ code: "SPECIAL25" });

      promoRepository.findPromoCodeById.mockResolvedValue(mockPromo);
      promoRepository.deletePromoCode.mockResolvedValue(mockPromo);
      notificationRepository.createNotification.mockResolvedValue({
        id: 1,
        message: expect.any(String),
      });

      await deletePromoCode(promoId);

      expect(notificationRepository.createNotification).toHaveBeenCalledWith({
        message: "Promo code SPECIAL25 is no longer available",
        userId: "all",
      });
    });
  });
});
