import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the ticket service
const mockTicketService = {
  createTicketService: jest.fn(),
  getAllTicketsService: jest.fn(),
  getTicketByIdService: jest.fn(),
  updateTicketService: jest.fn(),
  deleteTicketService: jest.fn(),
  getTicketsByCategoryService: jest.fn(),
  getTicketsByEventService: jest.fn(),
};

jest.unstable_mockModule(
  "../../services/ticket.service.js",
  () => mockTicketService
);

// Mock imagekit
const mockUploadImage = jest.fn();

jest.unstable_mockModule("../../libs/imagekit.js", () => ({
  uploadImage: mockUploadImage,
}));

// Mock response utilities
const mockSuccessResponse = jest.fn();
const mockErrorResponse = jest.fn();

jest.unstable_mockModule("../../utils/response.js", () => ({
  successResponse: mockSuccessResponse,
  errorResponse: mockErrorResponse,
}));

const {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getTicketsByCategory,
  getTicketsByEvent,
} = await import("../../controllers/ticket.controller.js");

describe("Ticket Controller", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: 1, role: "admin" },
      body: {},
      params: {},
      query: {},
      file: null,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // Helper functions
  const createMockTicket = (overrides = {}) => ({
    id: 1,
    name: "VIP Ticket",
    price: 500000,
    quantity: 100,
    eventId: 1,
    categoryId: 1,
    artist: "John Doe",
    imageUrl: "https://example.com/ticket.jpg",
    userId: 1,
    createdAt: new Date("2024-12-06"),
    updatedAt: new Date("2024-12-06"),
    ...overrides,
  });

  const createMockFile = (overrides = {}) => ({
    fieldname: "image",
    originalname: "ticket-image.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    buffer: Buffer.from("fake-image-data"),
    size: 12345,
    ...overrides,
  });

  const createMockPaginatedTickets = () => ({
    data: [
      createMockTicket(),
      createMockTicket({ id: 2, name: "Regular Ticket", price: 250000 }),
    ],
    meta: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    },
  });

  describe("createTicket", () => {
    it("should create ticket successfully when user is admin", async () => {
      const mockTicket = createMockTicket();
      const mockFile = createMockFile();
      mockUploadImage.mockResolvedValue("https://example.com/uploaded.jpg");
      mockTicketService.createTicketService.mockResolvedValue(mockTicket);
      mockReq.body = {
        name: "VIP Ticket",
        price: "500000",
        quantity: "100",
        eventId: "1",
        categoryId: "1",
        artist: "John Doe",
      };
      mockReq.file = mockFile;

      await createTicket(mockReq, mockRes);

      expect(mockUploadImage).toHaveBeenCalledWith(mockFile);
      expect(mockTicketService.createTicketService).toHaveBeenCalledWith({
        name: "VIP Ticket",
        price: 500000,
        quantity: 100,
        eventId: 1,
        categoryId: 1,
        artist: "John Doe",
        imageUrl: "https://example.com/uploaded.jpg",
        userId: 1,
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockTicket,
        "Ticket created successfully",
        201
      );
    });

    it("should handle error when creating ticket fails", async () => {
      mockTicketService.createTicketService.mockRejectedValue(
        new Error("Event not found")
      );
      mockReq.body = {
        name: "VIP Ticket",
        price: "500000",
        quantity: "100",
        eventId: "999",
        categoryId: "1",
      };

      await createTicket(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Event not found"
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.body = { name: "VIP Ticket" };

      await createTicket(mockReq, mockRes);

      expect(mockTicketService.createTicketService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.body = { name: "VIP Ticket" };

      await createTicket(mockReq, mockRes);

      expect(mockTicketService.createTicketService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should return 201 status code on success", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.createTicketService.mockResolvedValue(mockTicket);
      mockReq.body = {
        name: "VIP Ticket",
        price: "500000",
        quantity: "100",
        eventId: "1",
        categoryId: "1",
      };

      await createTicket(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.any(Object),
        "Ticket created successfully",
        201
      );
    });

    it("should upload image when file is provided", async () => {
      const mockTicket = createMockTicket();
      const mockFile = createMockFile();
      mockUploadImage.mockResolvedValue("https://example.com/uploaded.jpg");
      mockTicketService.createTicketService.mockResolvedValue(mockTicket);
      mockReq.body = {
        name: "VIP Ticket",
        price: "500000",
        quantity: "100",
        eventId: "1",
        categoryId: "1",
      };
      mockReq.file = mockFile;

      await createTicket(mockReq, mockRes);

      expect(mockUploadImage).toHaveBeenCalledWith(mockFile);
      expect(mockTicketService.createTicketService).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: "https://example.com/uploaded.jpg",
        })
      );
    });

    it("should set imageUrl to null when no file is provided", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.createTicketService.mockResolvedValue(mockTicket);
      mockReq.body = {
        name: "VIP Ticket",
        price: "500000",
        quantity: "100",
        eventId: "1",
        categoryId: "1",
      };
      mockReq.file = null;

      await createTicket(mockReq, mockRes);

      expect(mockUploadImage).not.toHaveBeenCalled();
      expect(mockTicketService.createTicketService).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: null,
        })
      );
    });

    it("should convert string numbers to Number type", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.createTicketService.mockResolvedValue(mockTicket);
      mockReq.body = {
        name: "VIP Ticket",
        price: "500000",
        quantity: "100",
        eventId: "1",
        categoryId: "1",
      };

      await createTicket(mockReq, mockRes);

      expect(mockTicketService.createTicketService).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 500000,
          quantity: 100,
          eventId: 1,
          categoryId: 1,
        })
      );
    });

    it("should include userId from req.user", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.createTicketService.mockResolvedValue(mockTicket);
      mockReq.user.id = 5;
      mockReq.body = {
        name: "VIP Ticket",
        price: "500000",
        quantity: "100",
        eventId: "1",
        categoryId: "1",
      };

      await createTicket(mockReq, mockRes);

      expect(mockTicketService.createTicketService).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 5,
        })
      );
    });
  });

  describe("getAllTickets", () => {
    it("should get all tickets successfully with default pagination", async () => {
      const mockTickets = createMockPaginatedTickets();
      mockTicketService.getAllTicketsService.mockResolvedValue(mockTickets);

      await getAllTickets(mockReq, mockRes);

      expect(mockTicketService.getAllTicketsService).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        artist: undefined,
        eventId: undefined,
        categoryId: undefined,
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockTickets);
    });

    it("should handle error when getting tickets fails", async () => {
      mockTicketService.getAllTicketsService.mockRejectedValue(
        new Error("Database error")
      );

      await getAllTickets(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(mockRes, "Database error");
    });

    it("should parse query parameters correctly", async () => {
      const mockTickets = createMockPaginatedTickets();
      mockTicketService.getAllTicketsService.mockResolvedValue(mockTickets);
      mockReq.query = {
        page: "2",
        limit: "20",
        search: "VIP",
        minPrice: "100000",
        maxPrice: "1000000",
        artist: "John Doe",
        eventId: "1",
        categoryId: "2",
      };

      await getAllTickets(mockReq, mockRes);

      expect(mockTicketService.getAllTicketsService).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: "VIP",
        minPrice: 100000,
        maxPrice: 1000000,
        artist: "John Doe",
        eventId: 1,
        categoryId: 2,
      });
    });

    it("should use default values when query params are missing", async () => {
      const mockTickets = createMockPaginatedTickets();
      mockTicketService.getAllTicketsService.mockResolvedValue(mockTickets);
      mockReq.query = {};

      await getAllTickets(mockReq, mockRes);

      expect(mockTicketService.getAllTicketsService).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        artist: undefined,
        eventId: undefined,
        categoryId: undefined,
      });
    });

    it("should convert page to integer using parseInt", async () => {
      const mockTickets = createMockPaginatedTickets();
      mockTicketService.getAllTicketsService.mockResolvedValue(mockTickets);
      mockReq.query = { page: "3" };

      await getAllTickets(mockReq, mockRes);

      expect(mockTicketService.getAllTicketsService).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3 })
      );
    });

    it("should convert limit to integer using parseInt", async () => {
      const mockTickets = createMockPaginatedTickets();
      mockTicketService.getAllTicketsService.mockResolvedValue(mockTickets);
      mockReq.query = { limit: "25" };

      await getAllTickets(mockReq, mockRes);

      expect(mockTicketService.getAllTicketsService).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 25 })
      );
    });

    it("should convert minPrice to float using parseFloat", async () => {
      const mockTickets = createMockPaginatedTickets();
      mockTicketService.getAllTicketsService.mockResolvedValue(mockTickets);
      mockReq.query = { minPrice: "50000.50" };

      await getAllTickets(mockReq, mockRes);

      expect(mockTicketService.getAllTicketsService).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 50000.5 })
      );
    });

    it("should convert maxPrice to float using parseFloat", async () => {
      const mockTickets = createMockPaginatedTickets();
      mockTicketService.getAllTicketsService.mockResolvedValue(mockTickets);
      mockReq.query = { maxPrice: "500000.75" };

      await getAllTickets(mockReq, mockRes);

      expect(mockTicketService.getAllTicketsService).toHaveBeenCalledWith(
        expect.objectContaining({ maxPrice: 500000.75 })
      );
    });

    it("should convert eventId to integer using parseInt", async () => {
      const mockTickets = createMockPaginatedTickets();
      mockTicketService.getAllTicketsService.mockResolvedValue(mockTickets);
      mockReq.query = { eventId: "5" };

      await getAllTickets(mockReq, mockRes);

      expect(mockTicketService.getAllTicketsService).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 5 })
      );
    });

    it("should convert categoryId to integer using parseInt", async () => {
      const mockTickets = createMockPaginatedTickets();
      mockTicketService.getAllTicketsService.mockResolvedValue(mockTickets);
      mockReq.query = { categoryId: "3" };

      await getAllTickets(mockReq, mockRes);

      expect(mockTicketService.getAllTicketsService).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 3 })
      );
    });

    it("should pass search parameter as string", async () => {
      const mockTickets = createMockPaginatedTickets();
      mockTicketService.getAllTicketsService.mockResolvedValue(mockTickets);
      mockReq.query = { search: "concert" };

      await getAllTickets(mockReq, mockRes);

      expect(mockTicketService.getAllTicketsService).toHaveBeenCalledWith(
        expect.objectContaining({ search: "concert" })
      );
    });

    it("should pass artist parameter as string", async () => {
      const mockTickets = createMockPaginatedTickets();
      mockTicketService.getAllTicketsService.mockResolvedValue(mockTickets);
      mockReq.query = { artist: "Jane Smith" };

      await getAllTickets(mockReq, mockRes);

      expect(mockTicketService.getAllTicketsService).toHaveBeenCalledWith(
        expect.objectContaining({ artist: "Jane Smith" })
      );
    });
  });

  describe("getTicketById", () => {
    it("should get ticket by id successfully", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.getTicketByIdService.mockResolvedValue(mockTicket);
      mockReq.params = { id: "1" };

      await getTicketById(mockReq, mockRes);

      expect(mockTicketService.getTicketByIdService).toHaveBeenCalledWith(1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockTicket);
    });

    it("should handle error when getting ticket fails", async () => {
      mockTicketService.getTicketByIdService.mockRejectedValue(
        new Error("Ticket not found")
      );
      mockReq.params = { id: "999" };

      await getTicketById(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Ticket not found"
      );
    });

    it("should convert params.id to number using parseInt", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.getTicketByIdService.mockResolvedValue(mockTicket);
      mockReq.params = { id: "5" };

      await getTicketById(mockReq, mockRes);

      expect(mockTicketService.getTicketByIdService).toHaveBeenCalledWith(5);
    });

    it("should not pass status code for default success response", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.getTicketByIdService.mockResolvedValue(mockTicket);
      mockReq.params = { id: "1" };

      await getTicketById(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockTicket);
      expect(mockSuccessResponse).not.toHaveBeenCalledWith(
        mockRes,
        mockTicket,
        expect.anything(),
        expect.any(Number)
      );
    });
  });

  describe("updateTicket", () => {
    it("should update ticket successfully when user is admin", async () => {
      const mockTicket = createMockTicket({ name: "Updated VIP Ticket" });
      const mockFile = createMockFile();
      mockUploadImage.mockResolvedValue("https://example.com/new-image.jpg");
      mockTicketService.updateTicketService.mockResolvedValue(mockTicket);
      mockReq.params = { id: "1" };
      mockReq.body = {
        name: "Updated VIP Ticket",
        price: "600000",
        quantity: "150",
        artist: "Jane Doe",
      };
      mockReq.file = mockFile;

      await updateTicket(mockReq, mockRes);

      expect(mockUploadImage).toHaveBeenCalledWith(mockFile);
      expect(mockTicketService.updateTicketService).toHaveBeenCalledWith(1, {
        name: "Updated VIP Ticket",
        price: 600000,
        quantity: 150,
        artist: "Jane Doe",
        imageUrl: "https://example.com/new-image.jpg",
      });
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockTicket,
        "Ticket updated successfully"
      );
    });

    it("should handle error when updating ticket fails", async () => {
      mockTicketService.updateTicketService.mockRejectedValue(
        new Error("Ticket not found")
      );
      mockReq.params = { id: "999" };
      mockReq.body = { name: "Updated" };

      await updateTicket(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Ticket not found"
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated" };

      await updateTicket(mockReq, mockRes);

      expect(mockTicketService.updateTicketService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated" };

      await updateTicket(mockReq, mockRes);

      expect(mockTicketService.updateTicketService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should convert params.id to number using parseInt", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.updateTicketService.mockResolvedValue(mockTicket);
      mockReq.params = { id: "7" };
      mockReq.body = { name: "Updated" };

      await updateTicket(mockReq, mockRes);

      expect(mockTicketService.updateTicketService).toHaveBeenCalledWith(
        7,
        expect.any(Object)
      );
    });

    it("should upload image when file is provided", async () => {
      const mockTicket = createMockTicket();
      const mockFile = createMockFile();
      mockUploadImage.mockResolvedValue("https://example.com/new-image.jpg");
      mockTicketService.updateTicketService.mockResolvedValue(mockTicket);
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated" };
      mockReq.file = mockFile;

      await updateTicket(mockReq, mockRes);

      expect(mockUploadImage).toHaveBeenCalledWith(mockFile);
      expect(mockTicketService.updateTicketService).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          imageUrl: "https://example.com/new-image.jpg",
        })
      );
    });

    it("should not include imageUrl when no file is provided", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.updateTicketService.mockResolvedValue(mockTicket);
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated" };
      mockReq.file = null;

      await updateTicket(mockReq, mockRes);

      expect(mockUploadImage).not.toHaveBeenCalled();
      expect(mockTicketService.updateTicketService).toHaveBeenCalledWith(1, {
        name: "Updated",
      });
    });

    it("should only include fields that are provided in body", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.updateTicketService.mockResolvedValue(mockTicket);
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated", price: "600000" };

      await updateTicket(mockReq, mockRes);

      expect(mockTicketService.updateTicketService).toHaveBeenCalledWith(1, {
        name: "Updated",
        price: 600000,
      });
    });

    it("should convert price to Number when provided", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.updateTicketService.mockResolvedValue(mockTicket);
      mockReq.params = { id: "1" };
      mockReq.body = { price: "750000" };

      await updateTicket(mockReq, mockRes);

      expect(mockTicketService.updateTicketService).toHaveBeenCalledWith(1, {
        price: 750000,
      });
    });

    it("should convert quantity to Number when provided", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.updateTicketService.mockResolvedValue(mockTicket);
      mockReq.params = { id: "1" };
      mockReq.body = { quantity: "200" };

      await updateTicket(mockReq, mockRes);

      expect(mockTicketService.updateTicketService).toHaveBeenCalledWith(1, {
        quantity: 200,
      });
    });

    it("should include artist when provided", async () => {
      const mockTicket = createMockTicket();
      mockTicketService.updateTicketService.mockResolvedValue(mockTicket);
      mockReq.params = { id: "1" };
      mockReq.body = { artist: "New Artist" };

      await updateTicket(mockReq, mockRes);

      expect(mockTicketService.updateTicketService).toHaveBeenCalledWith(1, {
        artist: "New Artist",
      });
    });
  });

  describe("deleteTicket", () => {
    it("should delete ticket successfully when user is admin", async () => {
      mockTicketService.deleteTicketService.mockResolvedValue();
      mockReq.params = { id: "1" };

      await deleteTicket(mockReq, mockRes);

      expect(mockTicketService.deleteTicketService).toHaveBeenCalledWith(1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Ticket deleted successfully"
      );
    });

    it("should handle error when deleting ticket fails", async () => {
      mockTicketService.deleteTicketService.mockRejectedValue(
        new Error("Ticket not found")
      );
      mockReq.params = { id: "999" };

      await deleteTicket(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Ticket not found"
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.params = { id: "1" };

      await deleteTicket(mockReq, mockRes);

      expect(mockTicketService.deleteTicketService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should convert params.id to number using parseInt", async () => {
      mockTicketService.deleteTicketService.mockResolvedValue();
      mockReq.params = { id: "9" };

      await deleteTicket(mockReq, mockRes);

      expect(mockTicketService.deleteTicketService).toHaveBeenCalledWith(9);
    });

    it("should return null data on success", async () => {
      mockTicketService.deleteTicketService.mockResolvedValue();
      mockReq.params = { id: "1" };

      await deleteTicket(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Ticket deleted successfully"
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.params = { id: "1" };

      await deleteTicket(mockReq, mockRes);

      expect(mockTicketService.deleteTicketService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });
  });

  describe("getTicketsByCategory", () => {
    it("should get tickets by category successfully", async () => {
      const mockTickets = [createMockTicket(), createMockTicket({ id: 2 })];
      mockTicketService.getTicketsByCategoryService.mockResolvedValue(
        mockTickets
      );
      mockReq.params = { categoryId: "1" };

      await getTicketsByCategory(mockReq, mockRes);

      expect(
        mockTicketService.getTicketsByCategoryService
      ).toHaveBeenCalledWith(1);
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockTickets);
    });

    it("should handle error when getting tickets by category fails", async () => {
      mockTicketService.getTicketsByCategoryService.mockRejectedValue(
        new Error("Category not found")
      );
      mockReq.params = { categoryId: "999" };

      await getTicketsByCategory(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Category not found"
      );
    });

    it("should convert params.categoryId to number using parseInt", async () => {
      const mockTickets = [createMockTicket()];
      mockTicketService.getTicketsByCategoryService.mockResolvedValue(
        mockTickets
      );
      mockReq.params = { categoryId: "3" };

      await getTicketsByCategory(mockReq, mockRes);

      expect(
        mockTicketService.getTicketsByCategoryService
      ).toHaveBeenCalledWith(3);
    });

    it("should not require admin role", async () => {
      const mockTickets = [createMockTicket()];
      mockTicketService.getTicketsByCategoryService.mockResolvedValue(
        mockTickets
      );
      mockReq.user.role = "user";
      mockReq.params = { categoryId: "1" };

      await getTicketsByCategory(mockReq, mockRes);

      expect(mockTicketService.getTicketsByCategoryService).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockTickets);
    });
  });

  describe("getTicketsByEvent", () => {
    it("should get tickets by event successfully", async () => {
      const mockTickets = [createMockTicket(), createMockTicket({ id: 2 })];
      mockTicketService.getTicketsByEventService.mockResolvedValue(mockTickets);
      mockReq.params = { eventId: "1" };

      await getTicketsByEvent(mockReq, mockRes);

      expect(mockTicketService.getTicketsByEventService).toHaveBeenCalledWith(
        1
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockTickets);
    });

    it("should handle error when getting tickets by event fails", async () => {
      mockTicketService.getTicketsByEventService.mockRejectedValue(
        new Error("Event not found")
      );
      mockReq.params = { eventId: "999" };

      await getTicketsByEvent(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Event not found"
      );
    });

    it("should convert params.eventId to number using parseInt", async () => {
      const mockTickets = [createMockTicket()];
      mockTicketService.getTicketsByEventService.mockResolvedValue(mockTickets);
      mockReq.params = { eventId: "5" };

      await getTicketsByEvent(mockReq, mockRes);

      expect(mockTicketService.getTicketsByEventService).toHaveBeenCalledWith(
        5
      );
    });

    it("should not require admin role", async () => {
      const mockTickets = [createMockTicket()];
      mockTicketService.getTicketsByEventService.mockResolvedValue(mockTickets);
      mockReq.user.role = "user";
      mockReq.params = { eventId: "1" };

      await getTicketsByEvent(mockReq, mockRes);

      expect(mockTicketService.getTicketsByEventService).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockTickets);
    });
  });
});
