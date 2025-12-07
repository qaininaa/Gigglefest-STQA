import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the category service
const mockCategoryService = {
  createCategoryService: jest.fn(),
  getAllCategoriesService: jest.fn(),
  getCategoryByIdService: jest.fn(),
  updateCategoryService: jest.fn(),
  deleteCategoryService: jest.fn(),
};

jest.unstable_mockModule(
  "../../services/category.service.js",
  () => mockCategoryService
);

// Mock response utilities
const mockSuccessResponse = jest.fn();
const mockErrorResponse = jest.fn();

jest.unstable_mockModule("../../utils/response.js", () => ({
  successResponse: mockSuccessResponse,
  errorResponse: mockErrorResponse,
}));

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = await import("../../controllers/category.controller.js");

describe("Category Controller", () => {
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
  const createMockCategory = (overrides = {}) => ({
    id: 1,
    name: "Music",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  const createMockPaginatedCategories = () => ({
    data: [createMockCategory(), createMockCategory({ id: 2, name: "Sports" })],
    meta: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    },
  });

  describe("createCategory", () => {
    it("should create category successfully when user is admin", async () => {
      const mockCategory = createMockCategory();
      mockCategoryService.createCategoryService.mockResolvedValue(mockCategory);
      mockReq.body = { name: "Music" };

      await createCategory(mockReq, mockRes);

      expect(mockCategoryService.createCategoryService).toHaveBeenCalledWith({
        name: "Music",
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockCategory,
        "Category created successfully",
        201
      );
    });

    it("should handle error when creating category fails", async () => {
      mockCategoryService.createCategoryService.mockRejectedValue(
        new Error("Database error")
      );
      mockReq.body = { name: "Music" };

      await createCategory(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(mockRes, "Database error");
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.body = { name: "Music" };

      await createCategory(mockReq, mockRes);

      expect(mockCategoryService.createCategoryService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.body = { name: "Music" };

      await createCategory(mockReq, mockRes);

      expect(mockCategoryService.createCategoryService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should return 201 status code on success", async () => {
      const mockCategory = createMockCategory();
      mockCategoryService.createCategoryService.mockResolvedValue(mockCategory);
      mockReq.body = { name: "Music" };

      await createCategory(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.any(Object),
        "Category created successfully",
        201
      );
    });

    it("should handle validation errors", async () => {
      mockCategoryService.createCategoryService.mockRejectedValue(
        new Error("Category name is required")
      );
      mockReq.body = {};

      await createCategory(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Category name is required"
      );
    });
  });

  describe("getAllCategories", () => {
    it("should get all categories successfully with default pagination", async () => {
      const mockCategories = createMockPaginatedCategories();
      mockCategoryService.getAllCategoriesService.mockResolvedValue(
        mockCategories
      );

      await getAllCategories(mockReq, mockRes);

      expect(mockCategoryService.getAllCategoriesService).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockCategories);
    });

    it("should handle error when getting categories fails", async () => {
      mockCategoryService.getAllCategoriesService.mockRejectedValue(
        new Error("Database error")
      );

      await getAllCategories(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(mockRes, "Database error");
    });

    it("should parse query parameters correctly", async () => {
      const mockCategories = createMockPaginatedCategories();
      mockCategoryService.getAllCategoriesService.mockResolvedValue(
        mockCategories
      );
      mockReq.query = { page: "2", limit: "20", search: "music" };

      await getAllCategories(mockReq, mockRes);

      expect(mockCategoryService.getAllCategoriesService).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: "music",
      });
    });

    it("should use default values when query params are missing", async () => {
      const mockCategories = createMockPaginatedCategories();
      mockCategoryService.getAllCategoriesService.mockResolvedValue(
        mockCategories
      );
      mockReq.query = {};

      await getAllCategories(mockReq, mockRes);

      expect(mockCategoryService.getAllCategoriesService).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
      });
    });

    it("should convert page to integer", async () => {
      const mockCategories = createMockPaginatedCategories();
      mockCategoryService.getAllCategoriesService.mockResolvedValue(
        mockCategories
      );
      mockReq.query = { page: "3" };

      await getAllCategories(mockReq, mockRes);

      expect(mockCategoryService.getAllCategoriesService).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3 })
      );
    });

    it("should convert limit to integer", async () => {
      const mockCategories = createMockPaginatedCategories();
      mockCategoryService.getAllCategoriesService.mockResolvedValue(
        mockCategories
      );
      mockReq.query = { limit: "25" };

      await getAllCategories(mockReq, mockRes);

      expect(mockCategoryService.getAllCategoriesService).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 25 })
      );
    });

    it("should pass search parameter when provided", async () => {
      const mockCategories = createMockPaginatedCategories();
      mockCategoryService.getAllCategoriesService.mockResolvedValue(
        mockCategories
      );
      mockReq.query = { search: "sports" };

      await getAllCategories(mockReq, mockRes);

      expect(mockCategoryService.getAllCategoriesService).toHaveBeenCalledWith(
        expect.objectContaining({ search: "sports" })
      );
    });
  });

  describe("getCategoryById", () => {
    it("should get category by id successfully", async () => {
      const mockCategory = createMockCategory();
      mockCategoryService.getCategoryByIdService.mockResolvedValue(
        mockCategory
      );
      mockReq.params = { id: "1" };

      await getCategoryById(mockReq, mockRes);

      expect(mockCategoryService.getCategoryByIdService).toHaveBeenCalledWith(
        1
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockCategory);
    });

    it("should handle error when getting category fails", async () => {
      mockCategoryService.getCategoryByIdService.mockRejectedValue(
        new Error("Category not found")
      );
      mockReq.params = { id: "1" };

      await getCategoryById(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Category not found"
      );
    });

    it("should convert params.id to number", async () => {
      const mockCategory = createMockCategory();
      mockCategoryService.getCategoryByIdService.mockResolvedValue(
        mockCategory
      );
      mockReq.params = { id: "5" };

      await getCategoryById(mockReq, mockRes);

      expect(mockCategoryService.getCategoryByIdService).toHaveBeenCalledWith(
        5
      );
    });

    it("should handle non-existent category", async () => {
      mockCategoryService.getCategoryByIdService.mockRejectedValue(
        new Error("Category with id 999 not found")
      );
      mockReq.params = { id: "999" };

      await getCategoryById(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Category with id 999 not found"
      );
    });

    it("should not pass status code for default success response", async () => {
      const mockCategory = createMockCategory();
      mockCategoryService.getCategoryByIdService.mockResolvedValue(
        mockCategory
      );
      mockReq.params = { id: "1" };

      await getCategoryById(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockCategory);
      expect(mockSuccessResponse).not.toHaveBeenCalledWith(
        mockRes,
        mockCategory,
        expect.anything(),
        expect.any(Number)
      );
    });
  });

  describe("updateCategory", () => {
    it("should update category successfully when user is admin", async () => {
      const mockCategory = createMockCategory({ name: "Updated Music" });
      mockCategoryService.updateCategoryService.mockResolvedValue(mockCategory);
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated Music" };

      await updateCategory(mockReq, mockRes);

      expect(mockCategoryService.updateCategoryService).toHaveBeenCalledWith(
        1,
        { name: "Updated Music" }
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockCategory,
        "Category updated successfully"
      );
    });

    it("should handle error when updating category fails", async () => {
      mockCategoryService.updateCategoryService.mockRejectedValue(
        new Error("Database error")
      );
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated Music" };

      await updateCategory(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(mockRes, "Database error");
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated Music" };

      await updateCategory(mockReq, mockRes);

      expect(mockCategoryService.updateCategoryService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should convert params.id to number", async () => {
      const mockCategory = createMockCategory();
      mockCategoryService.updateCategoryService.mockResolvedValue(mockCategory);
      mockReq.params = { id: "5" };
      mockReq.body = { name: "Updated" };

      await updateCategory(mockReq, mockRes);

      expect(mockCategoryService.updateCategoryService).toHaveBeenCalledWith(
        5,
        expect.any(Object)
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated" };

      await updateCategory(mockReq, mockRes);

      expect(mockCategoryService.updateCategoryService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should handle category not found error", async () => {
      mockCategoryService.updateCategoryService.mockRejectedValue(
        new Error("Category not found")
      );
      mockReq.params = { id: "999" };
      mockReq.body = { name: "Updated" };

      await updateCategory(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Category not found"
      );
    });

    it("should pass request body to service", async () => {
      const mockCategory = createMockCategory();
      mockCategoryService.updateCategoryService.mockResolvedValue(mockCategory);
      mockReq.params = { id: "1" };
      mockReq.body = { name: "New Name", description: "New Description" };

      await updateCategory(mockReq, mockRes);

      expect(mockCategoryService.updateCategoryService).toHaveBeenCalledWith(
        1,
        { name: "New Name", description: "New Description" }
      );
    });
  });

  describe("deleteCategory", () => {
    it("should delete category successfully when user is admin", async () => {
      mockCategoryService.deleteCategoryService.mockResolvedValue();
      mockReq.params = { id: "1" };

      await deleteCategory(mockReq, mockRes);

      expect(mockCategoryService.deleteCategoryService).toHaveBeenCalledWith(1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Category deleted successfully"
      );
    });

    it("should handle error when deleting category fails", async () => {
      mockCategoryService.deleteCategoryService.mockRejectedValue(
        new Error("Category not found")
      );
      mockReq.params = { id: "1" };

      await deleteCategory(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Category not found"
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.params = { id: "1" };

      await deleteCategory(mockReq, mockRes);

      expect(mockCategoryService.deleteCategoryService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should convert params.id to number", async () => {
      mockCategoryService.deleteCategoryService.mockResolvedValue();
      mockReq.params = { id: "5" };

      await deleteCategory(mockReq, mockRes);

      expect(mockCategoryService.deleteCategoryService).toHaveBeenCalledWith(5);
    });

    it("should return null data on success", async () => {
      mockCategoryService.deleteCategoryService.mockResolvedValue();
      mockReq.params = { id: "1" };

      await deleteCategory(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Category deleted successfully"
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.params = { id: "1" };

      await deleteCategory(mockReq, mockRes);

      expect(mockCategoryService.deleteCategoryService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should handle category with associated events error", async () => {
      mockCategoryService.deleteCategoryService.mockRejectedValue(
        new Error("Cannot delete category with associated events")
      );
      mockReq.params = { id: "1" };

      await deleteCategory(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Cannot delete category with associated events"
      );
    });
  });
});
