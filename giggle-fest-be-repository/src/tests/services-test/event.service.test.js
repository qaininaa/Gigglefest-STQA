/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock event repository functions
// ---------------------------
const mockCreateEvent = jest.fn();
const mockFindAllEvents = jest.fn();
const mockCountEvents = jest.fn();
const mockFindEventById = jest.fn();
const mockUpdateEvent = jest.fn();
const mockDeleteEvent = jest.fn();

// ---------------------------
// Create mock imagekit function
// ---------------------------
const mockUploadImage = jest.fn();

// ---------------------------
// Mock event.repository module
// ---------------------------
jest.unstable_mockModule("../../repositories/event.repository.js", () => ({
  createEvent: mockCreateEvent,
  findAllEvents: mockFindAllEvents,
  countEvents: mockCountEvents,
  findEventById: mockFindEventById,
  updateEvent: mockUpdateEvent,
  deleteEvent: mockDeleteEvent,
}));

// ---------------------------
// Mock imagekit module
// ---------------------------
jest.unstable_mockModule("../../libs/imagekit.js", () => ({
  uploadImage: mockUploadImage,
}));

// ---------------------------
// Import service after mock setup
// ---------------------------
const {
  createEventService,
  getAllEventsService,
  getEventByIdService,
  updateEventService,
  deleteEventService,
} = await import("../../services/event.service.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Event Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock event
  const createMockEvent = (overrides = {}) => ({
    id: 1,
    name: "GiggleFest 2025",
    description: "Annual comedy festival",
    date: new Date("2025-12-31T19:00:00.000Z"),
    location: "Jakarta Convention Center",
    imageUrl: "https://example.com/event.jpg",
    createdAt: new Date("2025-12-01T10:00:00.000Z"),
    updatedAt: new Date("2025-12-01T10:00:00.000Z"),
    ...overrides,
  });

  // Helper function to create mock file
  const createMockFile = (overrides = {}) => ({
    fieldname: "image",
    originalname: "event.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    buffer: Buffer.from("fake-image-data"),
    size: 12345,
    ...overrides,
  });

  describe("createEventService", () => {
    test("should create event without file upload", async () => {
      const eventData = {
        name: "Comedy Night",
        description: "Stand-up comedy event",
        date: new Date("2025-12-15T20:00:00.000Z"),
        location: "Comedy Club",
      };

      const expectedEvent = createMockEvent({
        id: 10,
        ...eventData,
      });

      mockCreateEvent.mockResolvedValue(expectedEvent);

      const result = await createEventService(eventData, null);

      expect(mockUploadImage).not.toHaveBeenCalled();
      expect(mockCreateEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateEvent).toHaveBeenCalledWith(eventData);
      expect(result).toEqual(expectedEvent);
    });

    test("should create event with file upload", async () => {
      const eventData = {
        name: "Comedy Night",
        description: "Stand-up comedy event",
        date: new Date("2025-12-15T20:00:00.000Z"),
        location: "Comedy Club",
      };

      const file = createMockFile();
      const uploadedImageUrl = "https://imagekit.io/uploaded/event123.jpg";

      const expectedEvent = createMockEvent({
        id: 10,
        ...eventData,
        imageUrl: uploadedImageUrl,
      });

      mockUploadImage.mockResolvedValue(uploadedImageUrl);
      mockCreateEvent.mockResolvedValue(expectedEvent);

      const result = await createEventService(eventData, file);

      expect(mockUploadImage).toHaveBeenCalledTimes(1);
      expect(mockUploadImage).toHaveBeenCalledWith(file);

      expect(mockCreateEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateEvent).toHaveBeenCalledWith({
        ...eventData,
        imageUrl: uploadedImageUrl,
      });

      expect(result).toEqual(expectedEvent);
      expect(result.imageUrl).toBe(uploadedImageUrl);
    });

    test("should add imageUrl to data when file is provided", async () => {
      const eventData = {
        name: "Test Event",
        location: "Test Location",
      };

      const file = createMockFile();
      const uploadedImageUrl = "https://cdn.example.com/image.jpg";

      mockUploadImage.mockResolvedValue(uploadedImageUrl);
      mockCreateEvent.mockResolvedValue(createMockEvent());

      await createEventService(eventData, file);

      const callArgs = mockCreateEvent.mock.calls[0][0];
      expect(callArgs.imageUrl).toBe(uploadedImageUrl);
    });

    test("should not modify data when file is null", async () => {
      const eventData = {
        name: "Test Event",
        location: "Test Location",
      };

      mockCreateEvent.mockResolvedValue(createMockEvent());

      await createEventService(eventData, null);

      const callArgs = mockCreateEvent.mock.calls[0][0];
      expect(callArgs).toEqual(eventData);
      expect(callArgs.imageUrl).toBeUndefined();
    });

    test("should not modify data when file is undefined", async () => {
      const eventData = {
        name: "Test Event",
        location: "Test Location",
      };

      mockCreateEvent.mockResolvedValue(createMockEvent());

      await createEventService(eventData, undefined);

      expect(mockUploadImage).not.toHaveBeenCalled();
      expect(mockCreateEvent).toHaveBeenCalledWith(eventData);
    });

    test("should propagate upload errors", async () => {
      const eventData = { name: "Test Event" };
      const file = createMockFile();
      const error = new Error("Upload failed");

      mockUploadImage.mockRejectedValue(error);

      await expect(createEventService(eventData, file)).rejects.toThrow(
        "Upload failed"
      );

      expect(mockCreateEvent).not.toHaveBeenCalled();
    });

    test("should propagate repository errors", async () => {
      const eventData = { name: "Test Event" };
      const error = new Error("Database error");

      mockCreateEvent.mockRejectedValue(error);

      await expect(createEventService(eventData, null)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getAllEventsService", () => {
    test("should get all events with default pagination", async () => {
      const query = {};
      const mockEvents = [
        createMockEvent({ id: 1, name: "Event 1" }),
        createMockEvent({ id: 2, name: "Event 2" }),
      ];
      const totalCount = 25;

      mockFindAllEvents.mockResolvedValue(mockEvents);
      mockCountEvents.mockResolvedValue(totalCount);

      const result = await getAllEventsService(query);

      expect(mockFindAllEvents).toHaveBeenCalledTimes(1);
      expect(mockFindAllEvents).toHaveBeenCalledWith(0, 10, {});

      expect(mockCountEvents).toHaveBeenCalledTimes(1);
      expect(mockCountEvents).toHaveBeenCalledWith({});

      expect(result.events).toEqual(mockEvents);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    test("should handle custom pagination parameters", async () => {
      const query = { page: 2, limit: 5 };

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(12);

      const result = await getAllEventsService(query);

      // skip = (2 - 1) * 5 = 5
      expect(mockFindAllEvents).toHaveBeenCalledWith(5, 5, {});

      expect(result.meta).toEqual({
        page: 2,
        limit: 5,
        total: 12,
        totalPages: 3,
      });
    });

    test("should filter by search term with OR condition", async () => {
      const query = { search: "comedy" };

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(5);

      await getAllEventsService(query);

      const expectedWhere = {
        OR: [
          { name: { contains: "comedy", mode: "insensitive" } },
          { location: { contains: "comedy", mode: "insensitive" } },
        ],
      };

      expect(mockFindAllEvents).toHaveBeenCalledWith(0, 10, expectedWhere);
      expect(mockCountEvents).toHaveBeenCalledWith(expectedWhere);
    });

    test("should filter by category with tickets relation", async () => {
      const query = { category: "5" };

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(8);

      await getAllEventsService(query);

      const expectedWhere = {
        tickets: {
          some: {
            categoryId: 5,
          },
        },
      };

      expect(mockFindAllEvents).toHaveBeenCalledWith(0, 10, expectedWhere);
      expect(mockCountEvents).toHaveBeenCalledWith(expectedWhere);
    });

    test("should parse category as integer", async () => {
      const query = { category: "10" };

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(3);

      await getAllEventsService(query);

      const callArgs = mockFindAllEvents.mock.calls[0][2];
      expect(callArgs.tickets.some.categoryId).toBe(10);
      expect(typeof callArgs.tickets.some.categoryId).toBe("number");
    });

    test("should filter by date range", async () => {
      const query = {
        startDate: "2025-12-01",
        endDate: "2025-12-31",
      };

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(10);

      await getAllEventsService(query);

      const expectedWhere = {
        date: {
          gte: new Date("2025-12-01"),
          lte: new Date("2025-12-31"),
        },
      };

      expect(mockFindAllEvents).toHaveBeenCalledWith(0, 10, expectedWhere);
      expect(mockCountEvents).toHaveBeenCalledWith(expectedWhere);
    });

    test("should not filter by date when only startDate provided", async () => {
      const query = { startDate: "2025-12-01" };

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(10);

      await getAllEventsService(query);

      const callArgs = mockFindAllEvents.mock.calls[0][2];
      expect(callArgs.date).toBeUndefined();
    });

    test("should not filter by date when only endDate provided", async () => {
      const query = { endDate: "2025-12-31" };

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(10);

      await getAllEventsService(query);

      const callArgs = mockFindAllEvents.mock.calls[0][2];
      expect(callArgs.date).toBeUndefined();
    });

    test("should combine multiple filters", async () => {
      const query = {
        page: 2,
        limit: 20,
        search: "giggle",
        category: "3",
        startDate: "2025-12-01",
        endDate: "2025-12-31",
      };

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(50);

      await getAllEventsService(query);

      const expectedWhere = {
        OR: [
          { name: { contains: "giggle", mode: "insensitive" } },
          { location: { contains: "giggle", mode: "insensitive" } },
        ],
        tickets: {
          some: {
            categoryId: 3,
          },
        },
        date: {
          gte: new Date("2025-12-01"),
          lte: new Date("2025-12-31"),
        },
      };

      // skip = (2 - 1) * 20 = 20
      expect(mockFindAllEvents).toHaveBeenCalledWith(20, 20, expectedWhere);
      expect(mockCountEvents).toHaveBeenCalledWith(expectedWhere);
    });

    test("should parse limit as integer in take parameter", async () => {
      const query = { limit: "15" };

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(30);

      await getAllEventsService(query);

      expect(mockFindAllEvents).toHaveBeenCalledWith(0, 15, {});
      expect(typeof mockFindAllEvents.mock.calls[0][1]).toBe("number");
    });

    test("should parse page as integer in metadata", async () => {
      const query = { page: "3", limit: "10" };

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(50);

      const result = await getAllEventsService(query);

      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(10);
      expect(typeof result.meta.page).toBe("number");
      expect(typeof result.meta.limit).toBe("number");
    });

    test("should calculate totalPages correctly", async () => {
      const query = { page: 1, limit: 7 };

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(20);

      const result = await getAllEventsService(query);

      // Math.ceil(20 / 7) = 3
      expect(result.meta.totalPages).toBe(3);
    });

    test("should return empty array when no events found", async () => {
      const query = {};

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(0);

      const result = await getAllEventsService(query);

      expect(result.events).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    test("should use Promise.all for parallel execution", async () => {
      const query = {};

      mockFindAllEvents.mockResolvedValue([]);
      mockCountEvents.mockResolvedValue(10);

      await getAllEventsService(query);

      // Both should be called
      expect(mockFindAllEvents).toHaveBeenCalled();
      expect(mockCountEvents).toHaveBeenCalled();
    });
  });

  describe("getEventByIdService", () => {
    test("should get event by id", async () => {
      const eventId = 5;
      const expectedEvent = createMockEvent({ id: eventId });

      mockFindEventById.mockResolvedValue(expectedEvent);

      const result = await getEventByIdService(eventId);

      expect(mockFindEventById).toHaveBeenCalledTimes(1);
      expect(mockFindEventById).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(expectedEvent);
    });

    test("should return null when event not found", async () => {
      const eventId = 999;

      mockFindEventById.mockResolvedValue(null);

      const result = await getEventByIdService(eventId);

      expect(mockFindEventById).toHaveBeenCalledWith(eventId);
      expect(result).toBeNull();
    });

    test("should pass id directly to repository", async () => {
      const eventId = 100;

      mockFindEventById.mockResolvedValue(createMockEvent());

      await getEventByIdService(eventId);

      expect(mockFindEventById).toHaveBeenCalledWith(100);
    });

    test("should propagate repository errors", async () => {
      const eventId = 1;
      const error = new Error("Database error");

      mockFindEventById.mockRejectedValue(error);

      await expect(getEventByIdService(eventId)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("updateEventService", () => {
    test("should update event without file upload", async () => {
      const eventId = 1;
      const updateData = {
        name: "Updated Event Name",
        description: "Updated description",
      };

      const updatedEvent = createMockEvent({
        id: eventId,
        ...updateData,
      });

      mockUpdateEvent.mockResolvedValue(updatedEvent);

      const result = await updateEventService(eventId, updateData, null);

      expect(mockUploadImage).not.toHaveBeenCalled();
      expect(mockUpdateEvent).toHaveBeenCalledTimes(1);
      expect(mockUpdateEvent).toHaveBeenCalledWith(eventId, updateData);
      expect(result).toEqual(updatedEvent);
    });

    test("should update event with file upload", async () => {
      const eventId = 1;
      const updateData = {
        name: "Updated Event Name",
        description: "Updated description",
      };

      const file = createMockFile();
      const uploadedImageUrl = "https://imagekit.io/updated/event.jpg";

      const updatedEvent = createMockEvent({
        id: eventId,
        ...updateData,
        imageUrl: uploadedImageUrl,
      });

      mockUploadImage.mockResolvedValue(uploadedImageUrl);
      mockUpdateEvent.mockResolvedValue(updatedEvent);

      const result = await updateEventService(eventId, updateData, file);

      expect(mockUploadImage).toHaveBeenCalledTimes(1);
      expect(mockUploadImage).toHaveBeenCalledWith(file);

      expect(mockUpdateEvent).toHaveBeenCalledTimes(1);
      expect(mockUpdateEvent).toHaveBeenCalledWith(eventId, {
        ...updateData,
        imageUrl: uploadedImageUrl,
      });

      expect(result).toEqual(updatedEvent);
      expect(result.imageUrl).toBe(uploadedImageUrl);
    });

    test("should add imageUrl to update data when file is provided", async () => {
      const eventId = 5;
      const updateData = { name: "Updated Name" };
      const file = createMockFile();
      const uploadedImageUrl = "https://cdn.example.com/new-image.jpg";

      mockUploadImage.mockResolvedValue(uploadedImageUrl);
      mockUpdateEvent.mockResolvedValue(createMockEvent());

      await updateEventService(eventId, updateData, file);

      const callArgs = mockUpdateEvent.mock.calls[0][1];
      expect(callArgs.imageUrl).toBe(uploadedImageUrl);
      expect(callArgs.name).toBe("Updated Name");
    });

    test("should not modify data when file is null", async () => {
      const eventId = 5;
      const updateData = { name: "Updated Name" };

      mockUpdateEvent.mockResolvedValue(createMockEvent());

      await updateEventService(eventId, updateData, null);

      const callArgs = mockUpdateEvent.mock.calls[0][1];
      expect(callArgs).toEqual(updateData);
      expect(callArgs.imageUrl).toBeUndefined();
    });

    test("should not modify data when file is undefined", async () => {
      const eventId = 5;
      const updateData = { name: "Updated Name" };

      mockUpdateEvent.mockResolvedValue(createMockEvent());

      await updateEventService(eventId, updateData, undefined);

      expect(mockUploadImage).not.toHaveBeenCalled();
      expect(mockUpdateEvent).toHaveBeenCalledWith(eventId, updateData);
    });

    test("should update only provided fields", async () => {
      const eventId = 3;
      const updateData = { location: "New Location" };

      mockUpdateEvent.mockResolvedValue(
        createMockEvent({ id: eventId, location: "New Location" })
      );

      const result = await updateEventService(eventId, updateData, null);

      expect(mockUpdateEvent).toHaveBeenCalledWith(eventId, updateData);
      expect(result.location).toBe("New Location");
    });

    test("should propagate upload errors", async () => {
      const eventId = 1;
      const updateData = { name: "Updated" };
      const file = createMockFile();
      const error = new Error("Upload failed");

      mockUploadImage.mockRejectedValue(error);

      await expect(
        updateEventService(eventId, updateData, file)
      ).rejects.toThrow("Upload failed");

      expect(mockUpdateEvent).not.toHaveBeenCalled();
    });

    test("should propagate repository errors", async () => {
      const eventId = 1;
      const updateData = { name: "Updated" };
      const error = new Error("Database error");

      mockUpdateEvent.mockRejectedValue(error);

      await expect(
        updateEventService(eventId, updateData, null)
      ).rejects.toThrow("Database error");
    });
  });

  describe("deleteEventService", () => {
    test("should delete event by id", async () => {
      const eventId = 1;
      const deletedEvent = createMockEvent({ id: eventId });

      mockDeleteEvent.mockResolvedValue(deletedEvent);

      const result = await deleteEventService(eventId);

      expect(mockDeleteEvent).toHaveBeenCalledTimes(1);
      expect(mockDeleteEvent).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(deletedEvent);
    });

    test("should pass id directly to repository", async () => {
      const eventId = 50;

      mockDeleteEvent.mockResolvedValue(createMockEvent());

      await deleteEventService(eventId);

      expect(mockDeleteEvent).toHaveBeenCalledWith(50);
    });

    test("should return deleted event data", async () => {
      const eventId = 10;
      const deletedEvent = createMockEvent({
        id: eventId,
        name: "Deleted Event",
      });

      mockDeleteEvent.mockResolvedValue(deletedEvent);

      const result = await deleteEventService(eventId);

      expect(result).toBe(deletedEvent);
      expect(result.id).toBe(eventId);
      expect(result.name).toBe("Deleted Event");
    });

    test("should propagate repository errors", async () => {
      const eventId = 1;
      const error = new Error("Database error");

      mockDeleteEvent.mockRejectedValue(error);

      await expect(deleteEventService(eventId)).rejects.toThrow(
        "Database error"
      );
    });
  });
});
