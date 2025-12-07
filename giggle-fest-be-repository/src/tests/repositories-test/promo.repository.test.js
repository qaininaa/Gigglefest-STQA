/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock functions
// ---------------------------
const mockPromoCode = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

const mockPrisma = {
  promoCode: mockPromoCode,
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
  createPromoCode,
  findAllPromoCodes,
  findPromoCodeByCode,
  findPromoCodeById,
  updatePromoCode,
  deletePromoCode,
} = await import("../../repositories/promo.repository.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Promo Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock promo code
  const createMockPromoCode = (overrides = {}) => ({
    id: 1,
    code: "WELCOME2025",
    discount: 50000,
    validFrom: new Date("2025-01-01T00:00:00.000Z"),
    validTo: new Date("2025-12-31T23:59:59.000Z"),
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    ...overrides,
  });

  describe("createPromoCode", () => {
    test("should create promo code with uppercase code", async () => {
      const promoData = {
        code: "summer2025",
        discount: 100000,
        validFrom: "2025-06-01T00:00:00.000Z",
        validTo: "2025-08-31T23:59:59.000Z",
      };

      const expectedPromo = createMockPromoCode({
        id: 5,
        code: "SUMMER2025",
        discount: 100000,
        validFrom: new Date("2025-06-01T00:00:00.000Z"),
        validTo: new Date("2025-08-31T23:59:59.000Z"),
      });

      mockPromoCode.create.mockResolvedValue(expectedPromo);

      const result = await createPromoCode(promoData);

      expect(mockPromoCode.create).toHaveBeenCalledTimes(1);
      expect(mockPromoCode.create).toHaveBeenCalledWith({
        data: {
          code: "SUMMER2025",
          discount: 100000,
          validFrom: new Date("2025-06-01T00:00:00.000Z"),
          validTo: new Date("2025-08-31T23:59:59.000Z"),
        },
      });

      expect(result).toEqual(expectedPromo);
      expect(result.code).toBe("SUMMER2025");
    });

    test("should convert lowercase code to uppercase", async () => {
      const promoData = {
        code: "newyear",
        discount: 75000,
        validFrom: "2025-01-01T00:00:00.000Z",
        validTo: "2025-01-31T23:59:59.000Z",
      };

      const expectedPromo = createMockPromoCode({
        code: "NEWYEAR",
        discount: 75000,
      });

      mockPromoCode.create.mockResolvedValue(expectedPromo);

      const result = await createPromoCode(promoData);

      // Verify code was uppercased
      const callArgs = mockPromoCode.create.mock.calls[0][0];
      expect(callArgs.data.code).toBe("NEWYEAR");
      expect(result.code).toBe("NEWYEAR");
    });

    test("should convert string dates to Date objects", async () => {
      const promoData = {
        code: "EASTER2025",
        discount: 50000,
        validFrom: "2025-03-15T00:00:00.000Z",
        validTo: "2025-04-20T23:59:59.000Z",
      };

      mockPromoCode.create.mockResolvedValue(createMockPromoCode(promoData));

      await createPromoCode(promoData);

      const callArgs = mockPromoCode.create.mock.calls[0][0];
      expect(callArgs.data.validFrom).toBeInstanceOf(Date);
      expect(callArgs.data.validTo).toBeInstanceOf(Date);
      expect(callArgs.data.validFrom.toISOString()).toBe(
        "2025-03-15T00:00:00.000Z"
      );
      expect(callArgs.data.validTo.toISOString()).toBe(
        "2025-04-20T23:59:59.000Z"
      );
    });

    test("should handle mixed case code input", async () => {
      const promoData = {
        code: "MiXeDcAsE",
        discount: 25000,
        validFrom: "2025-01-01T00:00:00.000Z",
        validTo: "2025-12-31T23:59:59.000Z",
      };

      const expectedPromo = createMockPromoCode({
        code: "MIXEDCASE",
        discount: 25000,
      });

      mockPromoCode.create.mockResolvedValue(expectedPromo);

      const result = await createPromoCode(promoData);

      expect(result.code).toBe("MIXEDCASE");
    });

    test("should create promo code with all fields", async () => {
      const promoData = {
        code: "complete",
        discount: 150000,
        validFrom: "2025-05-01T00:00:00.000Z",
        validTo: "2025-05-31T23:59:59.000Z",
      };

      const expectedPromo = createMockPromoCode({
        code: "COMPLETE",
        discount: 150000,
        validFrom: new Date("2025-05-01T00:00:00.000Z"),
        validTo: new Date("2025-05-31T23:59:59.000Z"),
      });

      mockPromoCode.create.mockResolvedValue(expectedPromo);

      const result = await createPromoCode(promoData);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("code");
      expect(result).toHaveProperty("discount");
      expect(result).toHaveProperty("validFrom");
      expect(result).toHaveProperty("validTo");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });
  });

  describe("findAllPromoCodes", () => {
    test("should return paginated promo codes", async () => {
      const options = { page: 1, limit: 10 };
      const mockPromoCodes = [
        createMockPromoCode({ id: 1, code: "PROMO1" }),
        createMockPromoCode({ id: 2, code: "PROMO2" }),
        createMockPromoCode({ id: 3, code: "PROMO3" }),
      ];
      const totalCount = 25;

      mockPromoCode.count.mockResolvedValue(totalCount);
      mockPromoCode.findMany.mockResolvedValue(mockPromoCodes);

      const result = await findAllPromoCodes(options);

      expect(mockPromoCode.count).toHaveBeenCalledTimes(1);
      expect(mockPromoCode.count).toHaveBeenCalledWith();

      expect(mockPromoCode.findMany).toHaveBeenCalledTimes(1);
      expect(mockPromoCode.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result.promoCodes).toEqual(mockPromoCodes);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    test("should handle pagination for page 2", async () => {
      const options = { page: 2, limit: 5 };
      const mockPromoCodes = [
        createMockPromoCode({ id: 6, code: "PROMO6" }),
        createMockPromoCode({ id: 7, code: "PROMO7" }),
      ];

      mockPromoCode.count.mockResolvedValue(12);
      mockPromoCode.findMany.mockResolvedValue(mockPromoCodes);

      const result = await findAllPromoCodes(options);

      expect(mockPromoCode.findMany).toHaveBeenCalledWith({
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
      const options = {};

      mockPromoCode.count.mockResolvedValue(5);
      mockPromoCode.findMany.mockResolvedValue([]);

      const result = await findAllPromoCodes(options);

      expect(mockPromoCode.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    test("should convert string pagination values to numbers", async () => {
      const options = { page: "3", limit: "15" };

      mockPromoCode.count.mockResolvedValue(50);
      mockPromoCode.findMany.mockResolvedValue([]);

      const result = await findAllPromoCodes(options);

      expect(mockPromoCode.findMany).toHaveBeenCalledWith({
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

    test("should order promo codes by createdAt descending", async () => {
      const options = { page: 1, limit: 10 };

      mockPromoCode.count.mockResolvedValue(5);
      mockPromoCode.findMany.mockResolvedValue([]);

      await findAllPromoCodes(options);

      expect(mockPromoCode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: "desc",
          },
        })
      );
    });

    test("should return empty array when no promo codes found", async () => {
      const options = { page: 1, limit: 10 };

      mockPromoCode.count.mockResolvedValue(0);
      mockPromoCode.findMany.mockResolvedValue([]);

      const result = await findAllPromoCodes(options);

      expect(result.promoCodes).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    test("should calculate totalPages correctly", async () => {
      const options = { page: 1, limit: 7 };

      mockPromoCode.count.mockResolvedValue(20);
      mockPromoCode.findMany.mockResolvedValue([]);

      const result = await findAllPromoCodes(options);

      // Math.ceil(20 / 7) = 3
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe("findPromoCodeByCode", () => {
    test("should find promo code by uppercase code", async () => {
      const code = "SUMMER2025";
      const expectedPromo = createMockPromoCode({ code });

      mockPromoCode.findUnique.mockResolvedValue(expectedPromo);

      const result = await findPromoCodeByCode(code);

      expect(mockPromoCode.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPromoCode.findUnique).toHaveBeenCalledWith({
        where: {
          code: "SUMMER2025",
        },
      });

      expect(result).toEqual(expectedPromo);
      expect(result.code).toBe("SUMMER2025");
    });

    test("should convert lowercase code to uppercase when searching", async () => {
      const code = "winter2025";
      const expectedPromo = createMockPromoCode({ code: "WINTER2025" });

      mockPromoCode.findUnique.mockResolvedValue(expectedPromo);

      const result = await findPromoCodeByCode(code);

      // Verify code was uppercased in the query
      expect(mockPromoCode.findUnique).toHaveBeenCalledWith({
        where: {
          code: "WINTER2025",
        },
      });

      expect(result.code).toBe("WINTER2025");
    });

    test("should return null when promo code not found", async () => {
      const code = "NONEXISTENT";

      mockPromoCode.findUnique.mockResolvedValue(null);

      const result = await findPromoCodeByCode(code);

      expect(mockPromoCode.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test("should handle mixed case code input", async () => {
      const code = "MiXeDcOdE";
      const expectedPromo = createMockPromoCode({ code: "MIXEDCODE" });

      mockPromoCode.findUnique.mockResolvedValue(expectedPromo);

      await findPromoCodeByCode(code);

      expect(mockPromoCode.findUnique).toHaveBeenCalledWith({
        where: {
          code: "MIXEDCODE",
        },
      });
    });

    test("should find different promo codes", async () => {
      const codes = ["promo1", "PROMO2", "ProMo3"];
      const expectedCodes = ["PROMO1", "PROMO2", "PROMO3"];

      for (let i = 0; i < codes.length; i++) {
        mockPromoCode.findUnique.mockResolvedValue(
          createMockPromoCode({ code: expectedCodes[i] })
        );

        const result = await findPromoCodeByCode(codes[i]);

        expect(result.code).toBe(expectedCodes[i]);
      }

      expect(mockPromoCode.findUnique).toHaveBeenCalledTimes(3);
    });
  });

  describe("findPromoCodeById", () => {
    test("should find promo code by id", async () => {
      const promoId = 1;
      const expectedPromo = createMockPromoCode({ id: promoId });

      mockPromoCode.findUnique.mockResolvedValue(expectedPromo);

      const result = await findPromoCodeById(promoId);

      expect(mockPromoCode.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPromoCode.findUnique).toHaveBeenCalledWith({
        where: { id: promoId },
      });

      expect(result).toEqual(expectedPromo);
      expect(result.id).toBe(promoId);
    });

    test("should return null when promo code not found", async () => {
      const promoId = 999;

      mockPromoCode.findUnique.mockResolvedValue(null);

      const result = await findPromoCodeById(promoId);

      expect(mockPromoCode.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test("should handle different promo code IDs", async () => {
      const promo1 = createMockPromoCode({ id: 5, code: "PROMO5" });
      const promo2 = createMockPromoCode({ id: 10, code: "PROMO10" });

      mockPromoCode.findUnique
        .mockResolvedValueOnce(promo1)
        .mockResolvedValueOnce(promo2);

      const result1 = await findPromoCodeById(5);
      const result2 = await findPromoCodeById(10);

      expect(result1).toEqual(promo1);
      expect(result2).toEqual(promo2);
      expect(mockPromoCode.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe("updatePromoCode", () => {
    test("should update promo code with uppercase code", async () => {
      const promoId = 1;
      const updateData = {
        code: "updated2025",
        discount: 200000,
      };

      const updatedPromo = createMockPromoCode({
        id: promoId,
        code: "UPDATED2025",
        discount: 200000,
        updatedAt: new Date("2025-12-06T12:00:00.000Z"),
      });

      mockPromoCode.update.mockResolvedValue(updatedPromo);

      const result = await updatePromoCode(promoId, updateData);

      expect(mockPromoCode.update).toHaveBeenCalledTimes(1);
      expect(mockPromoCode.update).toHaveBeenCalledWith({
        where: { id: promoId },
        data: {
          code: "UPDATED2025",
          discount: 200000,
          validFrom: undefined,
          validTo: undefined,
        },
      });

      expect(result).toEqual(updatedPromo);
      expect(result.code).toBe("UPDATED2025");
    });

    test("should update promo code with dates", async () => {
      const promoId = 2;
      const updateData = {
        validFrom: "2025-07-01T00:00:00.000Z",
        validTo: "2025-07-31T23:59:59.000Z",
      };

      const updatedPromo = createMockPromoCode({
        id: promoId,
        validFrom: new Date("2025-07-01T00:00:00.000Z"),
        validTo: new Date("2025-07-31T23:59:59.000Z"),
      });

      mockPromoCode.update.mockResolvedValue(updatedPromo);

      const result = await updatePromoCode(promoId, updateData);

      const callArgs = mockPromoCode.update.mock.calls[0][0];
      expect(callArgs.data.validFrom).toBeInstanceOf(Date);
      expect(callArgs.data.validTo).toBeInstanceOf(Date);
      expect(result.validFrom).toEqual(new Date("2025-07-01T00:00:00.000Z"));
      expect(result.validTo).toEqual(new Date("2025-07-31T23:59:59.000Z"));
    });

    test("should update discount only", async () => {
      const promoId = 3;
      const updateData = {
        discount: 300000,
      };

      const updatedPromo = createMockPromoCode({
        id: promoId,
        discount: 300000,
      });

      mockPromoCode.update.mockResolvedValue(updatedPromo);

      const result = await updatePromoCode(promoId, updateData);

      expect(mockPromoCode.update).toHaveBeenCalledWith({
        where: { id: promoId },
        data: {
          discount: 300000,
          code: undefined,
          validFrom: undefined,
          validTo: undefined,
        },
      });

      expect(result.discount).toBe(300000);
    });

    test("should update all fields at once", async () => {
      const promoId = 4;
      const updateData = {
        code: "newcode",
        discount: 500000,
        validFrom: "2025-08-01T00:00:00.000Z",
        validTo: "2025-08-31T23:59:59.000Z",
      };

      const updatedPromo = createMockPromoCode({
        id: promoId,
        code: "NEWCODE",
        discount: 500000,
        validFrom: new Date("2025-08-01T00:00:00.000Z"),
        validTo: new Date("2025-08-31T23:59:59.000Z"),
      });

      mockPromoCode.update.mockResolvedValue(updatedPromo);

      const result = await updatePromoCode(promoId, updateData);

      expect(result.code).toBe("NEWCODE");
      expect(result.discount).toBe(500000);
      expect(result.validFrom).toEqual(new Date("2025-08-01T00:00:00.000Z"));
      expect(result.validTo).toEqual(new Date("2025-08-31T23:59:59.000Z"));
    });

    test("should handle undefined dates in update", async () => {
      const promoId = 5;
      const updateData = {
        code: "testcode",
      };

      mockPromoCode.update.mockResolvedValue(
        createMockPromoCode({ id: promoId, code: "TESTCODE" })
      );

      await updatePromoCode(promoId, updateData);

      const callArgs = mockPromoCode.update.mock.calls[0][0];
      expect(callArgs.data.validFrom).toBeUndefined();
      expect(callArgs.data.validTo).toBeUndefined();
    });

    test("should convert lowercase code to uppercase in update", async () => {
      const promoId = 6;
      const updateData = {
        code: "lowercase",
      };

      mockPromoCode.update.mockResolvedValue(
        createMockPromoCode({ id: promoId, code: "LOWERCASE" })
      );

      await updatePromoCode(promoId, updateData);

      const callArgs = mockPromoCode.update.mock.calls[0][0];
      expect(callArgs.data.code).toBe("LOWERCASE");
    });

    test("should handle mixed case code in update", async () => {
      const promoId = 7;
      const updateData = {
        code: "MiXeD",
      };

      const updatedPromo = createMockPromoCode({
        id: promoId,
        code: "MIXED",
      });

      mockPromoCode.update.mockResolvedValue(updatedPromo);

      const result = await updatePromoCode(promoId, updateData);

      expect(result.code).toBe("MIXED");
    });

    test("should spread other data properties", async () => {
      const promoId = 8;
      const updateData = {
        code: "spread",
        discount: 100000,
        customField: "value",
      };

      mockPromoCode.update.mockResolvedValue(
        createMockPromoCode({ id: promoId })
      );

      await updatePromoCode(promoId, updateData);

      const callArgs = mockPromoCode.update.mock.calls[0][0];
      expect(callArgs.data.customField).toBe("value");
    });
  });

  describe("deletePromoCode", () => {
    test("should delete promo code successfully", async () => {
      const promoId = 1;
      const deletedPromo = createMockPromoCode({ id: promoId });

      mockPromoCode.delete.mockResolvedValue(deletedPromo);

      const result = await deletePromoCode(promoId);

      expect(mockPromoCode.delete).toHaveBeenCalledTimes(1);
      expect(mockPromoCode.delete).toHaveBeenCalledWith({
        where: { id: promoId },
      });

      expect(result).toEqual(deletedPromo);
      expect(result.id).toBe(promoId);
    });

    test("should delete promo code with specific id", async () => {
      const promoId = 15;
      const deletedPromo = createMockPromoCode({
        id: promoId,
        code: "DELETED",
      });

      mockPromoCode.delete.mockResolvedValue(deletedPromo);

      const result = await deletePromoCode(promoId);

      expect(mockPromoCode.delete).toHaveBeenCalledWith({
        where: { id: 15 },
      });

      expect(result.id).toBe(15);
    });

    test("should handle deleting different promo codes", async () => {
      const promo1 = createMockPromoCode({ id: 1, code: "PROMO1" });
      const promo2 = createMockPromoCode({ id: 2, code: "PROMO2" });

      mockPromoCode.delete
        .mockResolvedValueOnce(promo1)
        .mockResolvedValueOnce(promo2);

      const result1 = await deletePromoCode(1);
      const result2 = await deletePromoCode(2);

      expect(result1).toEqual(promo1);
      expect(result2).toEqual(promo2);
      expect(mockPromoCode.delete).toHaveBeenCalledTimes(2);
    });
  });
});
