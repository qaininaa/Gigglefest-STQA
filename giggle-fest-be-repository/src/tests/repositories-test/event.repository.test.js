/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock functions
// ---------------------------
const mockEvent = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

const mockPrisma = {
  event: mockEvent,
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
  createEvent,
  findAllEvents,
  countEvents,
  findEventById,
  updateEvent,
  deleteEvent,
} = await import("../../repositories/event.repository.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Event Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock event
  const createMockEvent = (overrides = {}) => ({
    id: 1,
    name: "GiggleFest 2025",
    description: "Annual comedy festival with international comedians",
    date: new Date("2025-12-31T19:00:00.000Z"),
    time: "19:00",
    location: "Jakarta Convention Center",
    image: "https://example.com/gigglefest.jpg",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
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
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    ...overrides,
  });

  // Helper function to create mock event with tickets
  const createMockEventWithTickets = (overrides = {}) => ({
    ...createMockEvent(overrides),
    tickets: [
      createMockTicket({ id: 1, name: "VIP Ticket", price: 500000 }),
      createMockTicket({ id: 2, name: "Regular Ticket", price: 250000 }),
    ],
  });

  describe("createEvent", () => {
    test("should create an event successfully", async () => {
      const eventData = {
        name: "Comedy Night 2025",
        description: "Stand-up comedy event",
        date: new Date("2025-06-15T20:00:00.000Z"),
        time: "20:00",
        location: "Balai Sarbini",
        image: "https://example.com/comedy-night.jpg",
      };

      const expectedEvent = createMockEvent({
        id: 5,
        ...eventData,
      });

      mockEvent.create.mockResolvedValue(expectedEvent);

      const result = await createEvent(eventData);

      expect(mockEvent.create).toHaveBeenCalledTimes(1);
      expect(mockEvent.create).toHaveBeenCalledWith({
        data: eventData,
      });
      expect(result).toEqual(expectedEvent);
      expect(result.name).toBe(eventData.name);
      expect(result.location).toBe(eventData.location);
    });

    test("should create event with minimal required data", async () => {
      const eventData = {
        name: "Simple Event",
        date: new Date("2025-07-01T18:00:00.000Z"),
        location: "Local Venue",
      };

      const expectedEvent = createMockEvent({
        id: 10,
        ...eventData,
        description: null,
        time: null,
        image: null,
      });

      mockEvent.create.mockResolvedValue(expectedEvent);

      const result = await createEvent(eventData);

      expect(mockEvent.create).toHaveBeenCalledTimes(1);
      expect(result.name).toBe("Simple Event");
    });

    test("should create event with all fields", async () => {
      const eventData = {
        name: "Full Event",
        description: "Complete event description",
        date: new Date("2025-08-20T21:00:00.000Z"),
        time: "21:00",
        location: "Grand Stadium",
        image: "https://example.com/full-event.jpg",
      };

      const expectedEvent = createMockEvent(eventData);

      mockEvent.create.mockResolvedValue(expectedEvent);

      const result = await createEvent(eventData);

      expect(result).toEqual(expectedEvent);
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });
  });

  describe("findAllEvents", () => {
    test("should return all events without filters", async () => {
      const skip = 0;
      const take = 10;
      const where = {};
      const mockEvents = [
        createMockEventWithTickets({ id: 1, name: "Event 1" }),
        createMockEventWithTickets({ id: 2, name: "Event 2" }),
        createMockEventWithTickets({ id: 3, name: "Event 3" }),
      ];

      mockEvent.findMany.mockResolvedValue(mockEvents);

      const result = await findAllEvents(skip, take, where);

      expect(mockEvent.findMany).toHaveBeenCalledTimes(1);
      expect(mockEvent.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        include: {
          tickets: true,
        },
      });
      expect(result).toEqual(mockEvents);
      expect(result).toHaveLength(3);
      expect(result[0].tickets).toBeDefined();
      expect(result[0].tickets).toHaveLength(2);
    });

    test("should return events with pagination", async () => {
      const skip = 10;
      const take = 5;
      const where = {};
      const mockEvents = [
        createMockEventWithTickets({ id: 11, name: "Event 11" }),
        createMockEventWithTickets({ id: 12, name: "Event 12" }),
      ];

      mockEvent.findMany.mockResolvedValue(mockEvents);

      const result = await findAllEvents(skip, take, where);

      expect(mockEvent.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 5,
        where: {},
        include: {
          tickets: true,
        },
      });
      expect(result).toEqual(mockEvents);
    });

    test("should return events with where filter", async () => {
      const skip = 0;
      const take = 10;
      const where = {
        location: {
          contains: "Jakarta",
          mode: "insensitive",
        },
      };
      const mockEvents = [
        createMockEventWithTickets({
          id: 1,
          name: "Jakarta Event",
          location: "Jakarta Convention Center",
        }),
      ];

      mockEvent.findMany.mockResolvedValue(mockEvents);

      const result = await findAllEvents(skip, take, where);

      expect(mockEvent.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          location: {
            contains: "Jakarta",
            mode: "insensitive",
          },
        },
        include: {
          tickets: true,
        },
      });
      expect(result).toEqual(mockEvents);
      expect(result[0].location).toContain("Jakarta");
    });

    test("should return empty array when no events found", async () => {
      const skip = 0;
      const take = 10;
      const where = { name: { contains: "NonExistent" } };

      mockEvent.findMany.mockResolvedValue([]);

      const result = await findAllEvents(skip, take, where);

      expect(mockEvent.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test("should include tickets in response", async () => {
      const skip = 0;
      const take = 1;
      const where = {};
      const mockEvents = [createMockEventWithTickets({ id: 1 })];

      mockEvent.findMany.mockResolvedValue(mockEvents);

      const result = await findAllEvents(skip, take, where);

      expect(result[0]).toHaveProperty("tickets");
      expect(Array.isArray(result[0].tickets)).toBe(true);
      expect(mockEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            tickets: true,
          },
        })
      );
    });

    test("should handle complex where conditions", async () => {
      const skip = 0;
      const take = 10;
      const where = {
        AND: [
          {
            date: {
              gte: new Date("2025-01-01"),
            },
          },
          {
            location: {
              contains: "Jakarta",
            },
          },
        ],
      };

      mockEvent.findMany.mockResolvedValue([]);

      await findAllEvents(skip, take, where);

      expect(mockEvent.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where,
        include: {
          tickets: true,
        },
      });
    });
  });

  describe("countEvents", () => {
    test("should count all events without filter", async () => {
      const where = {};
      const totalCount = 25;

      mockEvent.count.mockResolvedValue(totalCount);

      const result = await countEvents(where);

      expect(mockEvent.count).toHaveBeenCalledTimes(1);
      expect(mockEvent.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(result).toBe(25);
    });

    test("should count events with where filter", async () => {
      const where = {
        location: {
          contains: "Jakarta",
          mode: "insensitive",
        },
      };
      const totalCount = 5;

      mockEvent.count.mockResolvedValue(totalCount);

      const result = await countEvents(where);

      expect(mockEvent.count).toHaveBeenCalledWith({
        where,
      });
      expect(result).toBe(5);
    });

    test("should return zero when no events match filter", async () => {
      const where = { name: { contains: "NonExistent" } };

      mockEvent.count.mockResolvedValue(0);

      const result = await countEvents(where);

      expect(mockEvent.count).toHaveBeenCalledTimes(1);
      expect(result).toBe(0);
    });

    test("should count events with date filter", async () => {
      const where = {
        date: {
          gte: new Date("2025-06-01"),
        },
      };

      mockEvent.count.mockResolvedValue(10);

      const result = await countEvents(where);

      expect(mockEvent.count).toHaveBeenCalledWith({ where });
      expect(result).toBe(10);
    });
  });

  describe("findEventById", () => {
    test("should return event with tickets when found", async () => {
      const eventId = 1;
      const expectedEvent = createMockEventWithTickets({ id: eventId });

      mockEvent.findUnique.mockResolvedValue(expectedEvent);

      const result = await findEventById(eventId);

      expect(mockEvent.findUnique).toHaveBeenCalledTimes(1);
      expect(mockEvent.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        include: {
          tickets: true,
        },
      });
      expect(result).toEqual(expectedEvent);
      expect(result.id).toBe(eventId);
      expect(result.tickets).toBeDefined();
      expect(result.tickets).toHaveLength(2);
    });

    test("should parse string id to integer", async () => {
      const eventId = "5";
      const expectedEvent = createMockEventWithTickets({ id: 5 });

      mockEvent.findUnique.mockResolvedValue(expectedEvent);

      const result = await findEventById(eventId);

      expect(mockEvent.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
        include: {
          tickets: true,
        },
      });
      expect(result.id).toBe(5);
    });

    test("should return null when event not found", async () => {
      const eventId = 999;

      mockEvent.findUnique.mockResolvedValue(null);

      const result = await findEventById(eventId);

      expect(mockEvent.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test("should handle numeric string id", async () => {
      const eventId = "123";

      mockEvent.findUnique.mockResolvedValue(
        createMockEventWithTickets({ id: 123 })
      );

      await findEventById(eventId);

      expect(mockEvent.findUnique).toHaveBeenCalledWith({
        where: { id: 123 },
        include: {
          tickets: true,
        },
      });
    });

    test("should include tickets in the response", async () => {
      const eventId = 1;
      const mockEventData = createMockEventWithTickets({ id: eventId });

      mockEvent.findUnique.mockResolvedValue(mockEventData);

      const result = await findEventById(eventId);

      expect(result.tickets).toBeDefined();
      expect(Array.isArray(result.tickets)).toBe(true);
      expect(result.tickets[0]).toHaveProperty("name");
      expect(result.tickets[0]).toHaveProperty("price");
    });
  });

  describe("updateEvent", () => {
    test("should update event successfully", async () => {
      const eventId = 1;
      const updateData = {
        name: "Updated Event Name",
        location: "New Location",
      };
      const updatedEvent = createMockEvent({
        id: eventId,
        ...updateData,
        updatedAt: new Date("2025-12-06T00:00:00.000Z"),
      });

      mockEvent.update.mockResolvedValue(updatedEvent);

      const result = await updateEvent(eventId, updateData);

      expect(mockEvent.update).toHaveBeenCalledTimes(1);
      expect(mockEvent.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: updateData,
      });
      expect(result).toEqual(updatedEvent);
      expect(result.name).toBe("Updated Event Name");
      expect(result.location).toBe("New Location");
    });

    test("should parse string id to integer when updating", async () => {
      const eventId = "10";
      const updateData = { name: "Updated Name" };
      const updatedEvent = createMockEvent({
        id: 10,
        name: "Updated Name",
      });

      mockEvent.update.mockResolvedValue(updatedEvent);

      const result = await updateEvent(eventId, updateData);

      expect(mockEvent.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: updateData,
      });
      expect(result.id).toBe(10);
    });

    test("should update single field", async () => {
      const eventId = 2;
      const updateData = { description: "Updated description only" };
      const updatedEvent = createMockEvent({
        id: eventId,
        description: "Updated description only",
      });

      mockEvent.update.mockResolvedValue(updatedEvent);

      const result = await updateEvent(eventId, updateData);

      expect(mockEvent.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: updateData,
      });
      expect(result.description).toBe("Updated description only");
    });

    test("should update multiple fields at once", async () => {
      const eventId = 3;
      const updateData = {
        name: "New Name",
        description: "New Description",
        date: new Date("2025-12-25T20:00:00.000Z"),
        time: "20:00",
        location: "New Venue",
        image: "https://example.com/new-image.jpg",
      };
      const updatedEvent = createMockEvent({
        id: eventId,
        ...updateData,
      });

      mockEvent.update.mockResolvedValue(updatedEvent);

      const result = await updateEvent(eventId, updateData);

      expect(mockEvent.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: updateData,
      });
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.location).toBe(updateData.location);
    });

    test("should update event date and time", async () => {
      const eventId = 4;
      const updateData = {
        date: new Date("2026-01-01T22:00:00.000Z"),
        time: "22:00",
      };
      const updatedEvent = createMockEvent({
        id: eventId,
        ...updateData,
      });

      mockEvent.update.mockResolvedValue(updatedEvent);

      const result = await updateEvent(eventId, updateData);

      expect(result.date).toEqual(updateData.date);
      expect(result.time).toBe(updateData.time);
    });
  });

  describe("deleteEvent", () => {
    test("should delete event successfully", async () => {
      const eventId = 1;
      const deletedEvent = createMockEvent({ id: eventId });

      mockEvent.delete.mockResolvedValue(deletedEvent);

      const result = await deleteEvent(eventId);

      expect(mockEvent.delete).toHaveBeenCalledTimes(1);
      expect(mockEvent.delete).toHaveBeenCalledWith({
        where: { id: eventId },
      });
      expect(result).toEqual(deletedEvent);
      expect(result.id).toBe(eventId);
    });

    test("should parse string id to integer when deleting", async () => {
      const eventId = "15";
      const deletedEvent = createMockEvent({
        id: 15,
        name: "Deleted Event",
      });

      mockEvent.delete.mockResolvedValue(deletedEvent);

      const result = await deleteEvent(eventId);

      expect(mockEvent.delete).toHaveBeenCalledWith({
        where: { id: 15 },
      });
      expect(result.id).toBe(15);
    });

    test("should handle deleting different events", async () => {
      const event1 = createMockEvent({ id: 1, name: "Event 1" });
      const event2 = createMockEvent({ id: 2, name: "Event 2" });

      mockEvent.delete
        .mockResolvedValueOnce(event1)
        .mockResolvedValueOnce(event2);

      const result1 = await deleteEvent(1);
      const result2 = await deleteEvent(2);

      expect(result1).toEqual(event1);
      expect(result2).toEqual(event2);
      expect(mockEvent.delete).toHaveBeenCalledTimes(2);
    });

    test("should delete event with numeric id", async () => {
      const eventId = 100;
      const deletedEvent = createMockEvent({ id: eventId });

      mockEvent.delete.mockResolvedValue(deletedEvent);

      await deleteEvent(eventId);

      expect(mockEvent.delete).toHaveBeenCalledWith({
        where: { id: 100 },
      });
    });
  });
});
