/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock repository functions
// ---------------------------
const mockCreateCategory = jest.fn();
const mockFindAllCategories = jest.fn();
const mockFindCategoryById = jest.fn();
const mockUpdateCategory = jest.fn();
const mockDeleteCategory = jest.fn();

// ---------------------------
// Mock category.repository module
// ---------------------------
jest.unstable_mockModule("../../repositories/category.repository.js", () => ({
  createCategory: mockCreateCategory,
  findAllCategories: mockFindAllCategories,
  findCategoryById: mockFindCategoryById,
  updateCategory: mockUpdateCategory,
  deleteCategory: mockDeleteCategory,
}));

// ---------------------------
// Import service after mock setup
// ---------------------------
const {
  createCategoryService,
  getAllCategoriesService,
  getCategoryByIdService,
  updateCategoryService,
  deleteCategoryService,
} = await import("../../services/category.service.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Category Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock category
  const createMockCategory = (overrides = {}) => ({
    id: 1,
    name: "VIP",
    description: "VIP seating area",
    createdAt: new Date("2025-12-01T10:00:00.000Z"),
    updatedAt: new Date("2025-12-01T10:00:00.000Z"),
    ...overrides,
  });

  describe("createCategoryService", () => {
    test("should create category successfully", async () => {
      const categoryData = {
        name: "Premium",
        description: "Premium seating area",
      };

      const expectedCategory = createMockCategory({
        id: 5,
        name: "Premium",
        description: "Premium seating area",
      });

      mockCreateCategory.mockResolvedValue(expectedCategory);

      const result = await createCategoryService(categoryData);

      expect(mockCreateCategory).toHaveBeenCalledTimes(1);
      expect(mockCreateCategory).toHaveBeenCalledWith(categoryData);
      expect(result).toEqual(expectedCategory);
      expect(result.name).toBe("Premium");
      expect(result.description).toBe("Premium seating area");
    });

    test("should create category with minimal data", async () => {
      const categoryData = {
        name: "Regular",
      };

      const expectedCategory = createMockCategory({
        id: 10,
        name: "Regular",
        description: null,
      });

      mockCreateCategory.mockResolvedValue(expectedCategory);

      const result = await createCategoryService(categoryData);

      expect(mockCreateCategory).toHaveBeenCalledWith(categoryData);
      expect(result.name).toBe("Regular");
    });

    test("should pass all data to repository", async () => {
      const categoryData = {
        name: "VIP Plus",
        description: "VIP Plus seating",
      };

      mockCreateCategory.mockResolvedValue(createMockCategory(categoryData));

      await createCategoryService(categoryData);

      expect(mockCreateCategory).toHaveBeenCalledWith(categoryData);
    });

    test("should return created category from repository", async () => {
      const categoryData = { name: "Standard" };
      const createdCategory = createMockCategory({
        id: 15,
        name: "Standard",
      });

      mockCreateCategory.mockResolvedValue(createdCategory);

      const result = await createCategoryService(categoryData);

      expect(result).toBe(createdCategory);
      expect(result.id).toBe(15);
    });

    test("should propagate repository errors", async () => {
      const categoryData = { name: "Test" };
      const error = new Error("Database error");

      mockCreateCategory.mockRejectedValue(error);

      await expect(createCategoryService(categoryData)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getAllCategoriesService", () => {
    test("should get all categories with pagination", async () => {
      const params = { page: 1, limit: 10 };
      const mockCategories = [
        createMockCategory({ id: 1, name: "VIP" }),
        createMockCategory({ id: 2, name: "Regular" }),
        createMockCategory({ id: 3, name: "Premium" }),
      ];

      const expectedResult = {
        categories: mockCategories,
        meta: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1,
        },
      };

      mockFindAllCategories.mockResolvedValue(expectedResult);

      const result = await getAllCategoriesService(params);

      expect(mockFindAllCategories).toHaveBeenCalledTimes(1);
      expect(mockFindAllCategories).toHaveBeenCalledWith(params);
      expect(result).toEqual(expectedResult);
      expect(result.categories).toHaveLength(3);
    });

    test("should get categories with search parameter", async () => {
      const params = { page: 1, limit: 10, search: "VIP" };

      const expectedResult = {
        categories: [createMockCategory({ name: "VIP" })],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockFindAllCategories.mockResolvedValue(expectedResult);

      const result = await getAllCategoriesService(params);

      expect(mockFindAllCategories).toHaveBeenCalledWith(params);
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].name).toBe("VIP");
    });

    test("should pass pagination parameters to repository", async () => {
      const params = { page: 2, limit: 5 };

      mockFindAllCategories.mockResolvedValue({
        categories: [],
        meta: { page: 2, limit: 5, total: 0, totalPages: 0 },
      });

      await getAllCategoriesService(params);

      expect(mockFindAllCategories).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
      });
    });

    test("should pass search parameter to repository", async () => {
      const params = { page: 1, limit: 10, search: "Premium" };

      mockFindAllCategories.mockResolvedValue({
        categories: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await getAllCategoriesService(params);

      expect(mockFindAllCategories).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "Premium",
      });
    });

    test("should return empty array when no categories found", async () => {
      const params = { page: 1, limit: 10 };

      const expectedResult = {
        categories: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      mockFindAllCategories.mockResolvedValue(expectedResult);

      const result = await getAllCategoriesService(params);

      expect(result.categories).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    test("should return categories with metadata", async () => {
      const params = { page: 1, limit: 10 };

      const expectedResult = {
        categories: [createMockCategory()],
        meta: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      };

      mockFindAllCategories.mockResolvedValue(expectedResult);

      const result = await getAllCategoriesService(params);

      expect(result.meta).toBeDefined();
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
    });

    test("should propagate repository errors", async () => {
      const params = { page: 1, limit: 10 };
      const error = new Error("Database connection failed");

      mockFindAllCategories.mockRejectedValue(error);

      await expect(getAllCategoriesService(params)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("getCategoryByIdService", () => {
    test("should get category by id successfully", async () => {
      const categoryId = 1;
      const expectedCategory = createMockCategory({ id: categoryId });

      mockFindCategoryById.mockResolvedValue(expectedCategory);

      const result = await getCategoryByIdService(categoryId);

      expect(mockFindCategoryById).toHaveBeenCalledTimes(1);
      expect(mockFindCategoryById).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(expectedCategory);
      expect(result.id).toBe(categoryId);
    });

    test("should throw error when category not found", async () => {
      const categoryId = 999;

      mockFindCategoryById.mockResolvedValue(null);

      await expect(getCategoryByIdService(categoryId)).rejects.toThrow(
        "Category not found"
      );

      expect(mockFindCategoryById).toHaveBeenCalledWith(categoryId);
    });

    test("should return category when found", async () => {
      const categoryId = 5;
      const category = createMockCategory({
        id: categoryId,
        name: "Premium Plus",
      });

      mockFindCategoryById.mockResolvedValue(category);

      const result = await getCategoryByIdService(categoryId);

      expect(result).toBe(category);
      expect(result.name).toBe("Premium Plus");
    });

    test("should throw error with correct message when category is null", async () => {
      const categoryId = 100;

      mockFindCategoryById.mockResolvedValue(null);

      await expect(getCategoryByIdService(categoryId)).rejects.toThrow(
        "Category not found"
      );
    });

    test("should throw error when category is undefined", async () => {
      const categoryId = 200;

      mockFindCategoryById.mockResolvedValue(undefined);

      await expect(getCategoryByIdService(categoryId)).rejects.toThrow(
        "Category not found"
      );
    });

    test("should propagate repository errors", async () => {
      const categoryId = 1;
      const error = new Error("Database error");

      mockFindCategoryById.mockRejectedValue(error);

      await expect(getCategoryByIdService(categoryId)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("updateCategoryService", () => {
    test("should update category successfully", async () => {
      const categoryId = 1;
      const updateData = {
        name: "Updated VIP",
        description: "Updated VIP description",
      };

      const existingCategory = createMockCategory({ id: categoryId });
      const updatedCategory = createMockCategory({
        id: categoryId,
        ...updateData,
        updatedAt: new Date("2025-12-06T15:00:00.000Z"),
      });

      mockFindCategoryById.mockResolvedValue(existingCategory);
      mockUpdateCategory.mockResolvedValue(updatedCategory);

      const result = await updateCategoryService(categoryId, updateData);

      expect(mockFindCategoryById).toHaveBeenCalledTimes(1);
      expect(mockFindCategoryById).toHaveBeenCalledWith(categoryId);
      expect(mockUpdateCategory).toHaveBeenCalledTimes(1);
      expect(mockUpdateCategory).toHaveBeenCalledWith(categoryId, updateData);
      expect(result).toEqual(updatedCategory);
      expect(result.name).toBe("Updated VIP");
      expect(result.description).toBe("Updated VIP description");
    });

    test("should throw error when category not found before update", async () => {
      const categoryId = 999;
      const updateData = { name: "New Name" };

      mockFindCategoryById.mockResolvedValue(null);

      await expect(
        updateCategoryService(categoryId, updateData)
      ).rejects.toThrow("Category not found");

      expect(mockFindCategoryById).toHaveBeenCalledWith(categoryId);
      expect(mockUpdateCategory).not.toHaveBeenCalled();
    });

    test("should validate category exists before updating", async () => {
      const categoryId = 5;
      const updateData = { name: "Updated" };

      mockFindCategoryById.mockResolvedValue(null);

      await expect(
        updateCategoryService(categoryId, updateData)
      ).rejects.toThrow("Category not found");

      expect(mockUpdateCategory).not.toHaveBeenCalled();
    });

    test("should update only name field", async () => {
      const categoryId = 3;
      const updateData = { name: "New Name Only" };

      const existingCategory = createMockCategory({ id: categoryId });
      const updatedCategory = createMockCategory({
        id: categoryId,
        name: "New Name Only",
      });

      mockFindCategoryById.mockResolvedValue(existingCategory);
      mockUpdateCategory.mockResolvedValue(updatedCategory);

      const result = await updateCategoryService(categoryId, updateData);

      expect(mockUpdateCategory).toHaveBeenCalledWith(categoryId, updateData);
      expect(result.name).toBe("New Name Only");
    });

    test("should update only description field", async () => {
      const categoryId = 4;
      const updateData = { description: "New Description Only" };

      const existingCategory = createMockCategory({ id: categoryId });
      const updatedCategory = createMockCategory({
        id: categoryId,
        description: "New Description Only",
      });

      mockFindCategoryById.mockResolvedValue(existingCategory);
      mockUpdateCategory.mockResolvedValue(updatedCategory);

      const result = await updateCategoryService(categoryId, updateData);

      expect(mockUpdateCategory).toHaveBeenCalledWith(categoryId, updateData);
      expect(result.description).toBe("New Description Only");
    });

    test("should call getCategoryByIdService logic", async () => {
      const categoryId = 10;
      const updateData = { name: "Test" };

      mockFindCategoryById.mockResolvedValue(
        createMockCategory({ id: categoryId })
      );
      mockUpdateCategory.mockResolvedValue(
        createMockCategory({ id: categoryId, name: "Test" })
      );

      await updateCategoryService(categoryId, updateData);

      // getCategoryByIdService is called internally
      expect(mockFindCategoryById).toHaveBeenCalledWith(categoryId);
    });

    test("should propagate repository errors from update", async () => {
      const categoryId = 1;
      const updateData = { name: "Test" };
      const error = new Error("Update failed");

      mockFindCategoryById.mockResolvedValue(
        createMockCategory({ id: categoryId })
      );
      mockUpdateCategory.mockRejectedValue(error);

      await expect(
        updateCategoryService(categoryId, updateData)
      ).rejects.toThrow("Update failed");
    });

    test("should propagate errors from getCategoryByIdService", async () => {
      const categoryId = 1;
      const updateData = { name: "Test" };
      const error = new Error("Database error");

      mockFindCategoryById.mockRejectedValue(error);

      await expect(
        updateCategoryService(categoryId, updateData)
      ).rejects.toThrow("Database error");

      expect(mockUpdateCategory).not.toHaveBeenCalled();
    });
  });

  describe("deleteCategoryService", () => {
    test("should delete category successfully", async () => {
      const categoryId = 1;
      const existingCategory = createMockCategory({ id: categoryId });
      const deletedCategory = createMockCategory({ id: categoryId });

      mockFindCategoryById.mockResolvedValue(existingCategory);
      mockDeleteCategory.mockResolvedValue(deletedCategory);

      const result = await deleteCategoryService(categoryId);

      expect(mockFindCategoryById).toHaveBeenCalledTimes(1);
      expect(mockFindCategoryById).toHaveBeenCalledWith(categoryId);
      expect(mockDeleteCategory).toHaveBeenCalledTimes(1);
      expect(mockDeleteCategory).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(deletedCategory);
      expect(result.id).toBe(categoryId);
    });

    test("should throw error when category not found before delete", async () => {
      const categoryId = 999;

      mockFindCategoryById.mockResolvedValue(null);

      await expect(deleteCategoryService(categoryId)).rejects.toThrow(
        "Category not found"
      );

      expect(mockFindCategoryById).toHaveBeenCalledWith(categoryId);
      expect(mockDeleteCategory).not.toHaveBeenCalled();
    });

    test("should validate category exists before deleting", async () => {
      const categoryId = 5;

      mockFindCategoryById.mockResolvedValue(null);

      await expect(deleteCategoryService(categoryId)).rejects.toThrow(
        "Category not found"
      );

      expect(mockDeleteCategory).not.toHaveBeenCalled();
    });

    test("should call getCategoryByIdService logic before delete", async () => {
      const categoryId = 10;

      mockFindCategoryById.mockResolvedValue(
        createMockCategory({ id: categoryId })
      );
      mockDeleteCategory.mockResolvedValue(
        createMockCategory({ id: categoryId })
      );

      await deleteCategoryService(categoryId);

      // getCategoryByIdService is called internally
      expect(mockFindCategoryById).toHaveBeenCalledWith(categoryId);
    });

    test("should return deleted category data", async () => {
      const categoryId = 7;
      const deletedCategory = createMockCategory({
        id: categoryId,
        name: "Deleted Category",
      });

      mockFindCategoryById.mockResolvedValue(deletedCategory);
      mockDeleteCategory.mockResolvedValue(deletedCategory);

      const result = await deleteCategoryService(categoryId);

      expect(result).toBe(deletedCategory);
      expect(result.name).toBe("Deleted Category");
    });

    test("should propagate repository errors from delete", async () => {
      const categoryId = 1;
      const error = new Error("Delete failed");

      mockFindCategoryById.mockResolvedValue(
        createMockCategory({ id: categoryId })
      );
      mockDeleteCategory.mockRejectedValue(error);

      await expect(deleteCategoryService(categoryId)).rejects.toThrow(
        "Delete failed"
      );
    });

    test("should propagate errors from getCategoryByIdService", async () => {
      const categoryId = 1;
      const error = new Error("Database error");

      mockFindCategoryById.mockRejectedValue(error);

      await expect(deleteCategoryService(categoryId)).rejects.toThrow(
        "Database error"
      );

      expect(mockDeleteCategory).not.toHaveBeenCalled();
    });
  });
});
