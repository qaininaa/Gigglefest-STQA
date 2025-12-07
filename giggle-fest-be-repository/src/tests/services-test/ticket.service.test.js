import { jest } from "@jest/globals";

// Mock PrismaClient
const mockPrisma = {
  event: {
    findUnique: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

jest.unstable_mockModule("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock ticket repository
jest.unstable_mockModule(
  "../../../src/repositories/ticket.repository.js",
  () => ({
    createTicket: jest.fn(),
    findAllTickets: jest.fn(),
    findTicketById: jest.fn(),
    updateTicket: jest.fn(),
    deleteTicket: jest.fn(),
    findTicketsByCategory: jest.fn(),
    findTicketsByEvent: jest.fn(),
  })
);

// Import mocked modules
const ticketRepository = await import(
  "../../../src/repositories/ticket.repository.js"
);

// Import service to test
const {
  createTicketService,
  getAllTicketsService,
  getTicketByIdService,
  updateTicketService,
  deleteTicketService,
  getTicketsByCategoryService,
  getTicketsByEventService,
} = await import("../../../src/services/ticket.service.js");

describe("Ticket Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper functions
  const createMockEvent = (overrides = {}) => ({
    id: 1,
    name: "Music Festival",
    description: "Great music event",
    date: new Date("2025-12-31"),
    location: "Jakarta",
    ...overrides,
  });

  const createMockCategory = (overrides = {}) => ({
    id: 1,
    name: "VIP",
    ...overrides,
  });

  const createMockUser = (overrides = {}) => ({
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "organizer",
    ...overrides,
  });

  const createMockTicket = (overrides = {}) => ({
    id: 1,
    name: "VIP Ticket",
    price: 100000,
    quantity: 50,
    eventId: 1,
    categoryId: 1,
    userId: 1,
    event: createMockEvent(),
    category: createMockCategory(),
    user: createMockUser(),
    ...overrides,
  });

  describe("createTicketService", () => {
    const ticketData = {
      name: "VIP Ticket",
      price: 100000,
      quantity: 50,
      eventId: 1,
      categoryId: 1,
      userId: 1,
    };

    test("should create ticket successfully", async () => {
      const mockEvent = createMockEvent();
      const mockCategory = createMockCategory();
      const mockUser = createMockUser();
      const mockTicket = createMockTicket();

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      ticketRepository.createTicket.mockResolvedValue(mockTicket);

      const result = await createTicketService(ticketData);

      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(ticketRepository.createTicket).toHaveBeenCalledWith(ticketData);
      expect(result).toEqual(mockTicket);
    });

    test("should throw error if event not found", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(createTicketService(ticketData)).rejects.toThrow(
        "Event not found"
      );
      expect(mockPrisma.category.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(ticketRepository.createTicket).not.toHaveBeenCalled();
    });

    test("should throw error if category not found", async () => {
      const mockEvent = createMockEvent();

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(createTicketService(ticketData)).rejects.toThrow(
        "Category not found"
      );
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(ticketRepository.createTicket).not.toHaveBeenCalled();
    });

    test("should throw error if user not found", async () => {
      const mockEvent = createMockEvent();
      const mockCategory = createMockCategory();

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(createTicketService(ticketData)).rejects.toThrow(
        "User not found"
      );
      expect(ticketRepository.createTicket).not.toHaveBeenCalled();
    });

    test("should validate in order: event, category, then user", async () => {
      const mockEvent = createMockEvent();
      const mockCategory = createMockCategory();
      const mockUser = createMockUser();
      const mockTicket = createMockTicket();

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      ticketRepository.createTicket.mockResolvedValue(mockTicket);

      await createTicketService(ticketData);

      const eventCallOrder =
        mockPrisma.event.findUnique.mock.invocationCallOrder[0];
      const categoryCallOrder =
        mockPrisma.category.findUnique.mock.invocationCallOrder[0];
      const userCallOrder =
        mockPrisma.user.findUnique.mock.invocationCallOrder[0];
      const createCallOrder =
        ticketRepository.createTicket.mock.invocationCallOrder[0];

      expect(eventCallOrder).toBeLessThan(categoryCallOrder);
      expect(categoryCallOrder).toBeLessThan(userCallOrder);
      expect(userCallOrder).toBeLessThan(createCallOrder);
    });
  });

  describe("getAllTicketsService", () => {
    test("should get all tickets without filters", async () => {
      const mockTickets = {
        tickets: [createMockTicket({ id: 1 }), createMockTicket({ id: 2 })],
        pagination: { page: 1, limit: 10, total: 2 },
      };

      ticketRepository.findAllTickets.mockResolvedValue(mockTickets);

      const result = await getAllTicketsService({});

      expect(ticketRepository.findAllTickets).toHaveBeenCalledWith({});
      expect(mockPrisma.event.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.category.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(mockTickets);
    });

    test("should get all tickets with pagination", async () => {
      const params = { page: 2, limit: 5 };
      const mockTickets = {
        tickets: [createMockTicket()],
        pagination: { page: 2, limit: 5, total: 10 },
      };

      ticketRepository.findAllTickets.mockResolvedValue(mockTickets);

      const result = await getAllTicketsService(params);

      expect(ticketRepository.findAllTickets).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockTickets);
    });

    test("should validate event when eventId is provided", async () => {
      const params = { eventId: 1 };
      const mockEvent = createMockEvent();
      const mockTickets = {
        tickets: [createMockTicket({ eventId: 1 })],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      ticketRepository.findAllTickets.mockResolvedValue(mockTickets);

      const result = await getAllTicketsService(params);

      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(ticketRepository.findAllTickets).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockTickets);
    });

    test("should validate event when eventId is string", async () => {
      const params = { eventId: "5" };
      const mockEvent = createMockEvent({ id: 5 });
      const mockTickets = {
        tickets: [createMockTicket({ eventId: 5 })],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      ticketRepository.findAllTickets.mockResolvedValue(mockTickets);

      await getAllTicketsService(params);

      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
      });
    });

    test("should throw error if event not found when eventId is provided", async () => {
      const params = { eventId: 999 };

      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(getAllTicketsService(params)).rejects.toThrow(
        "Event not found"
      );
      expect(ticketRepository.findAllTickets).not.toHaveBeenCalled();
    });

    test("should validate category when categoryId is provided", async () => {
      const params = { categoryId: 1 };
      const mockCategory = createMockCategory();
      const mockTickets = {
        tickets: [createMockTicket({ categoryId: 1 })],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      ticketRepository.findAllTickets.mockResolvedValue(mockTickets);

      const result = await getAllTicketsService(params);

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(ticketRepository.findAllTickets).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockTickets);
    });

    test("should validate category when categoryId is string", async () => {
      const params = { categoryId: "3" };
      const mockCategory = createMockCategory({ id: 3 });
      const mockTickets = {
        tickets: [createMockTicket({ categoryId: 3 })],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      ticketRepository.findAllTickets.mockResolvedValue(mockTickets);

      await getAllTicketsService(params);

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
      });
    });

    test("should throw error if category not found when categoryId is provided", async () => {
      const params = { categoryId: 999 };

      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(getAllTicketsService(params)).rejects.toThrow(
        "Category not found"
      );
      expect(ticketRepository.findAllTickets).not.toHaveBeenCalled();
    });

    test("should validate both event and category when both are provided", async () => {
      const params = { eventId: 1, categoryId: 2 };
      const mockEvent = createMockEvent();
      const mockCategory = createMockCategory({ id: 2 });
      const mockTickets = {
        tickets: [createMockTicket({ eventId: 1, categoryId: 2 })],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      ticketRepository.findAllTickets.mockResolvedValue(mockTickets);

      const result = await getAllTicketsService(params);

      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(result).toEqual(mockTickets);
    });

    test("should handle search and filter parameters", async () => {
      const params = { search: "VIP", minPrice: 50000, maxPrice: 150000 };
      const mockTickets = {
        tickets: [createMockTicket()],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      ticketRepository.findAllTickets.mockResolvedValue(mockTickets);

      await getAllTicketsService(params);

      expect(ticketRepository.findAllTickets).toHaveBeenCalledWith(params);
    });
  });

  describe("getTicketByIdService", () => {
    test("should get ticket by ID successfully", async () => {
      const mockTicket = createMockTicket();

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);

      const result = await getTicketByIdService(1);

      expect(ticketRepository.findTicketById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTicket);
    });

    test("should throw error if ticket not found", async () => {
      ticketRepository.findTicketById.mockResolvedValue(null);

      await expect(getTicketByIdService(999)).rejects.toThrow(
        "Ticket not found"
      );
    });

    test("should pass correct ticket ID to repository", async () => {
      const mockTicket = createMockTicket({ id: 42 });

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);

      await getTicketByIdService(42);

      expect(ticketRepository.findTicketById).toHaveBeenCalledWith(42);
    });
  });

  describe("updateTicketService", () => {
    const ticketId = 1;

    test("should update ticket successfully", async () => {
      const updateData = { name: "Updated VIP Ticket", price: 120000 };
      const mockTicket = createMockTicket();
      const mockUpdatedTicket = createMockTicket({
        name: "Updated VIP Ticket",
        price: 120000,
      });

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      ticketRepository.updateTicket.mockResolvedValue(mockUpdatedTicket);

      const result = await updateTicketService(ticketId, updateData);

      expect(ticketRepository.findTicketById).toHaveBeenCalledWith(ticketId);
      expect(ticketRepository.updateTicket).toHaveBeenCalledWith(
        ticketId,
        updateData
      );
      expect(result).toEqual(mockUpdatedTicket);
    });

    test("should throw error if ticket not found", async () => {
      const updateData = { name: "Updated Ticket" };

      ticketRepository.findTicketById.mockResolvedValue(null);

      await expect(updateTicketService(ticketId, updateData)).rejects.toThrow(
        "Ticket not found"
      );
      expect(ticketRepository.updateTicket).not.toHaveBeenCalled();
    });

    test("should update only specific fields", async () => {
      const updateData = { quantity: 100 };
      const mockTicket = createMockTicket();
      const mockUpdatedTicket = createMockTicket({ quantity: 100 });

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      ticketRepository.updateTicket.mockResolvedValue(mockUpdatedTicket);

      const result = await updateTicketService(ticketId, updateData);

      expect(ticketRepository.updateTicket).toHaveBeenCalledWith(
        ticketId,
        updateData
      );
      expect(result).toEqual(mockUpdatedTicket);
    });

    test("should verify ticket exists before updating", async () => {
      const updateData = { price: 90000 };
      const mockTicket = createMockTicket();
      const mockUpdatedTicket = createMockTicket({ price: 90000 });

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      ticketRepository.updateTicket.mockResolvedValue(mockUpdatedTicket);

      await updateTicketService(ticketId, updateData);

      const findCallOrder =
        ticketRepository.findTicketById.mock.invocationCallOrder[0];
      const updateCallOrder =
        ticketRepository.updateTicket.mock.invocationCallOrder[0];

      expect(findCallOrder).toBeLessThan(updateCallOrder);
    });
  });

  describe("deleteTicketService", () => {
    const ticketId = 1;

    test("should delete ticket successfully", async () => {
      const mockTicket = createMockTicket();

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      ticketRepository.deleteTicket.mockResolvedValue(mockTicket);

      const result = await deleteTicketService(ticketId);

      expect(ticketRepository.findTicketById).toHaveBeenCalledWith(ticketId);
      expect(ticketRepository.deleteTicket).toHaveBeenCalledWith(ticketId);
      expect(result).toEqual(mockTicket);
    });

    test("should throw error if ticket not found", async () => {
      ticketRepository.findTicketById.mockResolvedValue(null);

      await expect(deleteTicketService(ticketId)).rejects.toThrow(
        "Ticket not found"
      );
      expect(ticketRepository.deleteTicket).not.toHaveBeenCalled();
    });

    test("should verify ticket exists before deleting", async () => {
      const mockTicket = createMockTicket();

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      ticketRepository.deleteTicket.mockResolvedValue(mockTicket);

      await deleteTicketService(ticketId);

      const findCallOrder =
        ticketRepository.findTicketById.mock.invocationCallOrder[0];
      const deleteCallOrder =
        ticketRepository.deleteTicket.mock.invocationCallOrder[0];

      expect(findCallOrder).toBeLessThan(deleteCallOrder);
    });

    test("should pass correct ticket ID to repository", async () => {
      const mockTicket = createMockTicket({ id: 99 });

      ticketRepository.findTicketById.mockResolvedValue(mockTicket);
      ticketRepository.deleteTicket.mockResolvedValue(mockTicket);

      await deleteTicketService(99);

      expect(ticketRepository.findTicketById).toHaveBeenCalledWith(99);
      expect(ticketRepository.deleteTicket).toHaveBeenCalledWith(99);
    });
  });

  describe("getTicketsByCategoryService", () => {
    const categoryId = 1;

    test("should get tickets by category successfully", async () => {
      const mockCategory = createMockCategory();
      const mockTickets = [
        createMockTicket({ id: 1, categoryId }),
        createMockTicket({ id: 2, categoryId }),
      ];

      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      ticketRepository.findTicketsByCategory.mockResolvedValue(mockTickets);

      const result = await getTicketsByCategoryService(categoryId);

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(ticketRepository.findTicketsByCategory).toHaveBeenCalledWith(
        categoryId
      );
      expect(result).toEqual(mockTickets);
    });

    test("should throw error if category not found", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(getTicketsByCategoryService(999)).rejects.toThrow(
        "Category not found"
      );
      expect(ticketRepository.findTicketsByCategory).not.toHaveBeenCalled();
    });

    test("should return empty array if category has no tickets", async () => {
      const mockCategory = createMockCategory();

      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      ticketRepository.findTicketsByCategory.mockResolvedValue([]);

      const result = await getTicketsByCategoryService(categoryId);

      expect(result).toEqual([]);
    });

    test("should verify category before fetching tickets", async () => {
      const mockCategory = createMockCategory();
      const mockTickets = [createMockTicket()];

      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      ticketRepository.findTicketsByCategory.mockResolvedValue(mockTickets);

      await getTicketsByCategoryService(categoryId);

      const categoryCallOrder =
        mockPrisma.category.findUnique.mock.invocationCallOrder[0];
      const ticketsCallOrder =
        ticketRepository.findTicketsByCategory.mock.invocationCallOrder[0];

      expect(categoryCallOrder).toBeLessThan(ticketsCallOrder);
    });
  });

  describe("getTicketsByEventService", () => {
    const eventId = 1;

    test("should get tickets by event successfully", async () => {
      const mockEvent = createMockEvent();
      const mockTickets = [
        createMockTicket({ id: 1, eventId }),
        createMockTicket({ id: 2, eventId }),
      ];

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      ticketRepository.findTicketsByEvent.mockResolvedValue(mockTickets);

      const result = await getTicketsByEventService(eventId);

      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
      });
      expect(ticketRepository.findTicketsByEvent).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(mockTickets);
    });

    test("should throw error if event not found", async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(getTicketsByEventService(999)).rejects.toThrow(
        "Event not found"
      );
      expect(ticketRepository.findTicketsByEvent).not.toHaveBeenCalled();
    });

    test("should return empty array if event has no tickets", async () => {
      const mockEvent = createMockEvent();

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      ticketRepository.findTicketsByEvent.mockResolvedValue([]);

      const result = await getTicketsByEventService(eventId);

      expect(result).toEqual([]);
    });

    test("should verify event before fetching tickets", async () => {
      const mockEvent = createMockEvent();
      const mockTickets = [createMockTicket()];

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      ticketRepository.findTicketsByEvent.mockResolvedValue(mockTickets);

      await getTicketsByEventService(eventId);

      const eventCallOrder =
        mockPrisma.event.findUnique.mock.invocationCallOrder[0];
      const ticketsCallOrder =
        ticketRepository.findTicketsByEvent.mock.invocationCallOrder[0];

      expect(eventCallOrder).toBeLessThan(ticketsCallOrder);
    });

    test("should handle different event IDs", async () => {
      const mockEvent = createMockEvent({ id: 42 });
      const mockTickets = [createMockTicket({ eventId: 42 })];

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      ticketRepository.findTicketsByEvent.mockResolvedValue(mockTickets);

      await getTicketsByEventService(42);

      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
      });
      expect(ticketRepository.findTicketsByEvent).toHaveBeenCalledWith(42);
    });
  });
});
