import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the event service
const mockEventService = {
  createEventService: jest.fn(),
  getAllEventsService: jest.fn(),
  getEventByIdService: jest.fn(),
  updateEventService: jest.fn(),
  deleteEventService: jest.fn(),
};

jest.unstable_mockModule(
  "../../services/event.service.js",
  () => mockEventService
);

// Mock response utilities
const mockSuccessResponse = jest.fn();
const mockErrorResponse = jest.fn();

jest.unstable_mockModule("../../utils/response.js", () => ({
  successResponse: mockSuccessResponse,
  errorResponse: mockErrorResponse,
}));

const { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent } =
  await import("../../controllers/event.controller.js");

describe("Event Controller", () => {
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
  const createMockEvent = (overrides = {}) => ({
    id: 1,
    name: "Tech Conference 2024",
    description: "Annual tech conference",
    location: "Jakarta Convention Center",
    date: new Date("2024-06-15"),
    time: "09:00:00",
    categoryId: 1,
    userId: 1,
    imageUrl: "https://example.com/image.jpg",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  const createMockFile = (overrides = {}) => ({
    fieldname: "image",
    originalname: "event-image.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    buffer: Buffer.from("fake-image-data"),
    size: 12345,
    ...overrides,
  });

  const createMockPaginatedEvents = () => ({
    data: [
      createMockEvent(),
      createMockEvent({ id: 2, name: "Music Festival 2024" }),
    ],
    meta: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    },
  });

  describe("createEvent", () => {
    it("should create event successfully when user is admin", async () => {
      const mockEvent = createMockEvent();
      const mockFile = createMockFile();
      mockEventService.createEventService.mockResolvedValue(mockEvent);
      mockReq.body = {
        name: "Tech Conference 2024",
        description: "Annual tech conference",
        location: "Jakarta Convention Center",
        date: "2024-06-15",
        time: "09:00:00",
        categoryId: 1,
      };
      mockReq.file = mockFile;

      await createEvent(mockReq, mockRes);

      expect(mockEventService.createEventService).toHaveBeenCalledWith(
        mockReq.body,
        mockFile
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockEvent,
        "Event created successfully",
        201
      );
    });

    it("should handle error when creating event fails", async () => {
      mockEventService.createEventService.mockRejectedValue(
        new Error("Database error")
      );
      mockReq.body = { name: "Tech Conference 2024" };

      await createEvent(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(mockRes, "Database error");
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.body = { name: "Tech Conference 2024" };

      await createEvent(mockReq, mockRes);

      expect(mockEventService.createEventService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.body = { name: "Tech Conference 2024" };

      await createEvent(mockReq, mockRes);

      expect(mockEventService.createEventService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should return 201 status code on success", async () => {
      const mockEvent = createMockEvent();
      mockEventService.createEventService.mockResolvedValue(mockEvent);
      mockReq.body = { name: "Tech Conference 2024" };

      await createEvent(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.any(Object),
        "Event created successfully",
        201
      );
    });

    it("should pass file to service when file is uploaded", async () => {
      const mockEvent = createMockEvent();
      const mockFile = createMockFile();
      mockEventService.createEventService.mockResolvedValue(mockEvent);
      mockReq.body = { name: "Tech Conference 2024" };
      mockReq.file = mockFile;

      await createEvent(mockReq, mockRes);

      expect(mockEventService.createEventService).toHaveBeenCalledWith(
        mockReq.body,
        mockFile
      );
    });

    it("should pass null file to service when no file is uploaded", async () => {
      const mockEvent = createMockEvent();
      mockEventService.createEventService.mockResolvedValue(mockEvent);
      mockReq.body = { name: "Tech Conference 2024" };
      mockReq.file = null;

      await createEvent(mockReq, mockRes);

      expect(mockEventService.createEventService).toHaveBeenCalledWith(
        mockReq.body,
        null
      );
    });

    it("should handle validation errors", async () => {
      mockEventService.createEventService.mockRejectedValue(
        new Error("Event name is required")
      );
      mockReq.body = {};

      await createEvent(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Event name is required"
      );
    });
  });

  describe("getAllEvents", () => {
    it("should get all events successfully", async () => {
      const mockEvents = createMockPaginatedEvents();
      mockEventService.getAllEventsService.mockResolvedValue(mockEvents);

      await getAllEvents(mockReq, mockRes);

      expect(mockEventService.getAllEventsService).toHaveBeenCalledWith(
        mockReq.query
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockEvents);
    });

    it("should handle error when getting events fails", async () => {
      mockEventService.getAllEventsService.mockRejectedValue(
        new Error("Database error")
      );

      await getAllEvents(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(mockRes, "Database error");
    });

    it("should pass query parameters to service", async () => {
      const mockEvents = createMockPaginatedEvents();
      mockEventService.getAllEventsService.mockResolvedValue(mockEvents);
      mockReq.query = {
        page: "1",
        limit: "10",
        search: "tech",
        categoryId: "1",
      };

      await getAllEvents(mockReq, mockRes);

      expect(mockEventService.getAllEventsService).toHaveBeenCalledWith({
        page: "1",
        limit: "10",
        search: "tech",
        categoryId: "1",
      });
    });

    it("should handle empty query parameters", async () => {
      const mockEvents = createMockPaginatedEvents();
      mockEventService.getAllEventsService.mockResolvedValue(mockEvents);
      mockReq.query = {};

      await getAllEvents(mockReq, mockRes);

      expect(mockEventService.getAllEventsService).toHaveBeenCalledWith({});
    });

    it("should not require authentication to get all events", async () => {
      const mockEvents = createMockPaginatedEvents();
      mockEventService.getAllEventsService.mockResolvedValue(mockEvents);
      delete mockReq.user;

      await getAllEvents(mockReq, mockRes);

      expect(mockEventService.getAllEventsService).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockEvents);
    });
  });

  describe("getEventById", () => {
    it("should get event by id successfully", async () => {
      const mockEvent = createMockEvent();
      mockEventService.getEventByIdService.mockResolvedValue(mockEvent);
      mockReq.params = { id: "1" };

      await getEventById(mockReq, mockRes);

      expect(mockEventService.getEventByIdService).toHaveBeenCalledWith("1");
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockEvent);
    });

    it("should handle error when getting event fails", async () => {
      mockEventService.getEventByIdService.mockRejectedValue(
        new Error("Database error")
      );
      mockReq.params = { id: "1" };

      await getEventById(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(mockRes, "Database error");
    });

    it("should return 404 when event is not found", async () => {
      mockEventService.getEventByIdService.mockResolvedValue(null);
      mockReq.params = { id: "999" };

      await getEventById(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Event not found",
        404
      );
    });

    it("should pass params.id as string to service", async () => {
      const mockEvent = createMockEvent();
      mockEventService.getEventByIdService.mockResolvedValue(mockEvent);
      mockReq.params = { id: "5" };

      await getEventById(mockReq, mockRes);

      expect(mockEventService.getEventByIdService).toHaveBeenCalledWith("5");
    });

    it("should not call successResponse when event is null", async () => {
      mockEventService.getEventByIdService.mockResolvedValue(null);
      mockReq.params = { id: "999" };

      await getEventById(mockReq, mockRes);

      expect(mockSuccessResponse).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Event not found",
        404
      );
    });

    it("should not require authentication to get event by id", async () => {
      const mockEvent = createMockEvent();
      mockEventService.getEventByIdService.mockResolvedValue(mockEvent);
      mockReq.params = { id: "1" };
      delete mockReq.user;

      await getEventById(mockReq, mockRes);

      expect(mockEventService.getEventByIdService).toHaveBeenCalled();
      expect(mockSuccessResponse).toHaveBeenCalledWith(mockRes, mockEvent);
    });
  });

  describe("updateEvent", () => {
    it("should update event successfully when user is admin", async () => {
      const mockEvent = createMockEvent({ name: "Updated Tech Conference" });
      const mockFile = createMockFile();
      mockEventService.updateEventService.mockResolvedValue(mockEvent);
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated Tech Conference" };
      mockReq.file = mockFile;

      await updateEvent(mockReq, mockRes);

      expect(mockEventService.updateEventService).toHaveBeenCalledWith(
        "1",
        mockReq.body,
        mockFile
      );
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        mockEvent,
        "Event updated successfully"
      );
    });

    it("should handle error when updating event fails", async () => {
      mockEventService.updateEventService.mockRejectedValue(
        new Error("Event not found")
      );
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated Tech Conference" };

      await updateEvent(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Event not found"
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated Tech Conference" };

      await updateEvent(mockReq, mockRes);

      expect(mockEventService.updateEventService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should pass params.id as string to service", async () => {
      const mockEvent = createMockEvent();
      mockEventService.updateEventService.mockResolvedValue(mockEvent);
      mockReq.params = { id: "5" };
      mockReq.body = { name: "Updated" };

      await updateEvent(mockReq, mockRes);

      expect(mockEventService.updateEventService).toHaveBeenCalledWith(
        "5",
        expect.any(Object),
        null
      );
    });

    it("should pass file to service when file is uploaded", async () => {
      const mockEvent = createMockEvent();
      const mockFile = createMockFile();
      mockEventService.updateEventService.mockResolvedValue(mockEvent);
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated Tech Conference" };
      mockReq.file = mockFile;

      await updateEvent(mockReq, mockRes);

      expect(mockEventService.updateEventService).toHaveBeenCalledWith(
        "1",
        mockReq.body,
        mockFile
      );
    });

    it("should pass null file to service when no file is uploaded", async () => {
      const mockEvent = createMockEvent();
      mockEventService.updateEventService.mockResolvedValue(mockEvent);
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated Tech Conference" };
      mockReq.file = null;

      await updateEvent(mockReq, mockRes);

      expect(mockEventService.updateEventService).toHaveBeenCalledWith(
        "1",
        mockReq.body,
        null
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated" };

      await updateEvent(mockReq, mockRes);

      expect(mockEventService.updateEventService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should pass request body to service", async () => {
      const mockEvent = createMockEvent();
      mockEventService.updateEventService.mockResolvedValue(mockEvent);
      mockReq.params = { id: "1" };
      mockReq.body = {
        name: "New Event Name",
        description: "New Description",
        location: "New Location",
      };

      await updateEvent(mockReq, mockRes);

      expect(mockEventService.updateEventService).toHaveBeenCalledWith(
        "1",
        {
          name: "New Event Name",
          description: "New Description",
          location: "New Location",
        },
        null
      );
    });
  });

  describe("deleteEvent", () => {
    it("should delete event successfully when user is admin", async () => {
      mockEventService.deleteEventService.mockResolvedValue();
      mockReq.params = { id: "1" };

      await deleteEvent(mockReq, mockRes);

      expect(mockEventService.deleteEventService).toHaveBeenCalledWith("1");
      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Event deleted successfully"
      );
    });

    it("should handle error when deleting event fails", async () => {
      mockEventService.deleteEventService.mockRejectedValue(
        new Error("Event not found")
      );
      mockReq.params = { id: "1" };

      await deleteEvent(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Event not found"
      );
    });

    it("should return 403 when user is not admin", async () => {
      mockReq.user.role = "user";
      mockReq.params = { id: "1" };

      await deleteEvent(mockReq, mockRes);

      expect(mockEventService.deleteEventService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should pass params.id as string to service", async () => {
      mockEventService.deleteEventService.mockResolvedValue();
      mockReq.params = { id: "5" };

      await deleteEvent(mockReq, mockRes);

      expect(mockEventService.deleteEventService).toHaveBeenCalledWith("5");
    });

    it("should return null data on success", async () => {
      mockEventService.deleteEventService.mockResolvedValue();
      mockReq.params = { id: "1" };

      await deleteEvent(mockReq, mockRes);

      expect(mockSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        "Event deleted successfully"
      );
    });

    it("should check authorization before calling service", async () => {
      mockReq.user.role = "organizer";
      mockReq.params = { id: "1" };

      await deleteEvent(mockReq, mockRes);

      expect(mockEventService.deleteEventService).not.toHaveBeenCalled();
      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Unauthorized",
        403
      );
    });

    it("should handle event with associated tickets error", async () => {
      mockEventService.deleteEventService.mockRejectedValue(
        new Error("Cannot delete event with associated tickets")
      );
      mockReq.params = { id: "1" };

      await deleteEvent(mockReq, mockRes);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        mockRes,
        "Cannot delete event with associated tickets"
      );
    });
  });
});
