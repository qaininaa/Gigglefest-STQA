/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock functions
// ---------------------------
const mockCategory = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

const mockPrisma = {
  category: mockCategory,
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
  createCategory,
  findAllCategories,
  findCategoryById,
  updateCategory,
  deleteCategory,
} = await import("../../repositories/category.repository.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Category Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock category
  const createMockCategory = (overrides = {}) => ({
    id: 1,
    name: "VIP",
    description: "VIP seating area with premium amenities",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    ...overrides,
  });

  describe("createCategory", () => {
    test("should create a category successfully", async () => {
      const categoryData = {
        name: "Regular",
        description: "Standard seating area",
      };

      const expectedCategory = createMockCategory({
        id: 5,
        ...categoryData,
      });

      mockCategory.create.mockResolvedValue(expectedCategory);

      const result = await createCategory(categoryData);

      expect(mockCategory.create).toHaveBeenCalledTimes(1);
      expect(mockCategory.create).toHaveBeenCalledWith({
        data: categoryData,
      });
      expect(result).toEqual(expectedCategory);
      expect(result.name).toBe(categoryData.name);
      expect(result.description).toBe(categoryData.description);
    });

    test("should create category with minimal data", async () => {
      const categoryData = {
        name: "Economy",
      };

      const expectedCategory = createMockCategory({
        id: 10,
        name: "Economy",
        description: null,
      });

      mockCategory.create.mockResolvedValue(expectedCategory);

      const result = await createCategory(categoryData);

      expect(mockCategory.create).toHaveBeenCalledTimes(1);
      expect(result.name).toBe("Economy");
    });

    test("should create category with all fields", async () => {
      const categoryData = {
        name: "Premium",
        description: "Premium seating with exclusive access",
      };

      const expectedCategory = createMockCategory(categoryData);

      mockCategory.create.mockResolvedValue(expectedCategory);

      const result = await createCategory(categoryData);

      expect(result).toEqual(expectedCategory);
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });
  });

  describe("findAllCategories", () => {
    test("should return paginated categories without search", async () => {
      const params = { page: 1, limit: 10, search: "" };
      const mockCategories = [
        createMockCategory({ id: 1, name: "VIP" }),
        createMockCategory({ id: 2, name: "Regular" }),
        createMockCategory({ id: 3, name: "Economy" }),
      ];
      const totalCount = 15;

      mockCategory.count.mockResolvedValue(totalCount);
      mockCategory.findMany.mockResolvedValue(mockCategories);

      const result = await findAllCategories(params);

      expect(mockCategory.count).toHaveBeenCalledTimes(1);
      expect(mockCategory.count).toHaveBeenCalledWith({
        where: {},
      });

      expect(mockCategory.findMany).toHaveBeenCalledTimes(1);
      expect(mockCategory.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result.categories).toEqual(mockCategories);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: totalCount,
        totalPages: 2,
      });
    });

    test("should return paginated categories with search filter", async () => {
      const params = { page: 1, limit: 5, search: "VIP" };
      const mockCategories = [
        createMockCategory({ id: 1, name: "VIP" }),
        createMockCategory({ id: 4, name: "VIP Plus" }),
      ];
      const totalCount = 2;

      mockCategory.count.mockResolvedValue(totalCount);
      mockCategory.findMany.mockResolvedValue(mockCategories);

      const result = await findAllCategories(params);

      expect(mockCategory.count).toHaveBeenCalledWith({
        where: {
          name: {
            contains: "VIP",
            mode: "insensitive",
          },
        },
      });

      expect(mockCategory.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: "VIP",
            mode: "insensitive",
          },
        },
        skip: 0,
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result.categories).toEqual(mockCategories);
      expect(result.categories).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });

    test("should handle pagination correctly for page 2", async () => {
      const params = { page: 2, limit: 10, search: "" };
      const mockCategories = [
        createMockCategory({ id: 11, name: "Category 11" }),
        createMockCategory({ id: 12, name: "Category 12" }),
      ];

      mockCategory.count.mockResolvedValue(25);
      mockCategory.findMany.mockResolvedValue(mockCategories);

      const result = await findAllCategories(params);

      expect(mockCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10,
        })
      );

      expect(result.meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    test("should return empty array when no categories found", async () => {
      const params = { page: 1, limit: 10, search: "NonExistent" };

      mockCategory.count.mockResolvedValue(0);
      mockCategory.findMany.mockResolvedValue([]);

      const result = await findAllCategories(params);

      expect(result.categories).toEqual([]);
      expect(result.categories).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    test("should calculate totalPages correctly", async () => {
      const params = { page: 1, limit: 7, search: "" };

      mockCategory.count.mockResolvedValue(20);
      mockCategory.findMany.mockResolvedValue([]);

      const result = await findAllCategories(params);

      // Math.ceil(20 / 7) = 3
      expect(result.meta.totalPages).toBe(3);
    });

    test("should handle search with case insensitive mode", async () => {
      const params = { page: 1, limit: 10, search: "premium" };

      mockCategory.count.mockResolvedValue(1);
      mockCategory.findMany.mockResolvedValue([
        createMockCategory({ id: 1, name: "Premium" }),
      ]);

      await findAllCategories(params);

      expect(mockCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            name: {
              contains: "premium",
              mode: "insensitive",
            },
          },
        })
      );
    });
  });

  describe("findCategoryById", () => {
    test("should return category when found", async () => {
      const categoryId = 1;
      const expectedCategory = createMockCategory({ id: categoryId });

      mockCategory.findUnique.mockResolvedValue(expectedCategory);

      const result = await findCategoryById(categoryId);

      expect(mockCategory.findUnique).toHaveBeenCalledTimes(1);
      expect(mockCategory.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(result).toEqual(expectedCategory);
      expect(result.id).toBe(categoryId);
    });

    test("should return null when category not found", async () => {
      const categoryId = 999;

      mockCategory.findUnique.mockResolvedValue(null);

      const result = await findCategoryById(categoryId);

      expect(mockCategory.findUnique).toHaveBeenCalledTimes(1);
      expect(mockCategory.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(result).toBeNull();
    });

    test("should handle different category IDs", async () => {
      const category1 = createMockCategory({ id: 5, name: "Category A" });
      const category2 = createMockCategory({ id: 10, name: "Category B" });

      mockCategory.findUnique
        .mockResolvedValueOnce(category1)
        .mockResolvedValueOnce(category2);

      const result1 = await findCategoryById(5);
      const result2 = await findCategoryById(10);

      expect(result1).toEqual(category1);
      expect(result2).toEqual(category2);
      expect(mockCategory.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe("updateCategory", () => {
    test("should update category name successfully", async () => {
      const categoryId = 1;
      const updateData = { name: "Updated VIP" };
      const updatedCategory = createMockCategory({
        id: categoryId,
        name: "Updated VIP",
        updatedAt: new Date("2025-12-06T00:00:00.000Z"),
      });

      mockCategory.update.mockResolvedValue(updatedCategory);

      const result = await updateCategory(categoryId, updateData);

      expect(mockCategory.update).toHaveBeenCalledTimes(1);
      expect(mockCategory.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: updateData,
      });
      expect(result).toEqual(updatedCategory);
      expect(result.name).toBe("Updated VIP");
    });

    test("should update category description successfully", async () => {
      const categoryId = 2;
      const updateData = { description: "New description for category" };
      const updatedCategory = createMockCategory({
        id: categoryId,
        description: "New description for category",
      });

      mockCategory.update.mockResolvedValue(updatedCategory);

      const result = await updateCategory(categoryId, updateData);

      expect(mockCategory.update).toHaveBeenCalledTimes(1);
      expect(result.description).toBe("New description for category");
    });

    test("should update multiple fields at once", async () => {
      const categoryId = 3;
      const updateData = {
        name: "Super VIP",
        description: "Exclusive super VIP seating with all amenities",
      };
      const updatedCategory = createMockCategory({
        id: categoryId,
        ...updateData,
      });

      mockCategory.update.mockResolvedValue(updatedCategory);

      const result = await updateCategory(categoryId, updateData);

      expect(mockCategory.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: updateData,
      });
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
    });

    test("should update category with partial data", async () => {
      const categoryId = 4;
      const updateData = { name: "Partial Update" };

      const updatedCategory = createMockCategory({
        id: categoryId,
        name: "Partial Update",
      });

      mockCategory.update.mockResolvedValue(updatedCategory);

      const result = await updateCategory(categoryId, updateData);

      expect(result.name).toBe("Partial Update");
      expect(mockCategory.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: { name: "Partial Update" },
      });
    });
  });

  describe("deleteCategory", () => {
    test("should delete category successfully", async () => {
      const categoryId = 1;
      const deletedCategory = createMockCategory({ id: categoryId });

      mockCategory.delete.mockResolvedValue(deletedCategory);

      const result = await deleteCategory(categoryId);

      expect(mockCategory.delete).toHaveBeenCalledTimes(1);
      expect(mockCategory.delete).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(result).toEqual(deletedCategory);
    });

    test("should delete category with specific id", async () => {
      const categoryId = 5;
      const deletedCategory = createMockCategory({
        id: categoryId,
        name: "Deleted Category",
      });

      mockCategory.delete.mockResolvedValue(deletedCategory);

      const result = await deleteCategory(categoryId);

      expect(mockCategory.delete).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(result.id).toBe(categoryId);
    });

    test("should handle deleting different categories", async () => {
      const category1 = createMockCategory({ id: 1, name: "Cat 1" });
      const category2 = createMockCategory({ id: 2, name: "Cat 2" });

      mockCategory.delete
        .mockResolvedValueOnce(category1)
        .mockResolvedValueOnce(category2);

      const result1 = await deleteCategory(1);
      const result2 = await deleteCategory(2);

      expect(result1).toEqual(category1);
      expect(result2).toEqual(category2);
      expect(mockCategory.delete).toHaveBeenCalledTimes(2);
    });
  });
});
