/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock functions
// ---------------------------
const mockTicket = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

const mockPrisma = {
  ticket: mockTicket,
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
  createTicket,
  findAllTickets,
  findTicketById,
  updateTicket,
  deleteTicket,
  findTicketsByCategory,
  findTicketsByEvent,
} = await import("../../repositories/ticket.repository.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Ticket Repository", () => {
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
    ...overrides,
  });

  // Helper function to create mock category
  const createMockCategory = (overrides = {}) => ({
    id: 1,
    name: "VIP",
    description: "VIP seating area",
    ...overrides,
  });

  // Helper function to create mock ticket
  const createMockTicket = (overrides = {}) => ({
    id: 1,
    name: "VIP Ticket",
    price: 500000,
    stock: 100,
    artist: "Comedy Legends",
    eventId: 1,
    categoryId: 1,
    createdAt: new Date("2025-12-01T10:00:00.000Z"),
    updatedAt: new Date("2025-12-01T10:00:00.000Z"),
    event: createMockEvent(),
    category: createMockCategory(),
    ...overrides,
  });

  describe("createTicket", () => {
    test("should create ticket with event and category includes", async () => {
      const ticketData = {
        name: "Regular Ticket",
        price: 200000,
        stock: 500,
        artist: "Stand-Up Stars",
        eventId: 2,
        categoryId: 2,
      };

      const expectedTicket = createMockTicket({
        id: 10,
        ...ticketData,
        event: createMockEvent({ id: 2, name: "Comedy Night" }),
        category: createMockCategory({ id: 2, name: "Regular" }),
      });

      mockTicket.create.mockResolvedValue(expectedTicket);

      const result = await createTicket(ticketData);

      expect(mockTicket.create).toHaveBeenCalledTimes(1);
      expect(mockTicket.create).toHaveBeenCalledWith({
        data: ticketData,
        include: {
          event: true,
          category: true,
        },
      });

      expect(result).toEqual(expectedTicket);
      expect(result.name).toBe("Regular Ticket");
      expect(result.price).toBe(200000);
      expect(result.stock).toBe(500);
    });

    test("should include event and category in response", async () => {
      const ticketData = {
        name: "Premium Ticket",
        price: 750000,
        stock: 50,
        artist: "Top Comedians",
        eventId: 1,
        categoryId: 1,
      };

      const expectedTicket = createMockTicket(ticketData);
      mockTicket.create.mockResolvedValue(expectedTicket);

      const result = await createTicket(ticketData);

      expect(result.event).toBeDefined();
      expect(result.event.id).toBeDefined();
      expect(result.event.name).toBeDefined();
      expect(result.category).toBeDefined();
      expect(result.category.id).toBeDefined();
      expect(result.category.name).toBeDefined();
    });

    test("should pass all data fields to Prisma create", async () => {
      const ticketData = {
        name: "Early Bird Ticket",
        price: 150000,
        stock: 1000,
        artist: "Comedy Crew",
        eventId: 3,
        categoryId: 3,
      };

      mockTicket.create.mockResolvedValue(createMockTicket(ticketData));

      await createTicket(ticketData);

      const callArgs = mockTicket.create.mock.calls[0][0];
      expect(callArgs.data).toEqual(ticketData);
    });
  });

  describe("findAllTickets", () => {
    test("should return paginated tickets with basic parameters", async () => {
      const params = { page: 1, limit: 10 };
      const mockTickets = [
        createMockTicket({ id: 1, name: "Ticket 1" }),
        createMockTicket({ id: 2, name: "Ticket 2" }),
        createMockTicket({ id: 3, name: "Ticket 3" }),
      ];
      const totalCount = 25;

      mockTicket.count.mockResolvedValue(totalCount);
      mockTicket.findMany.mockResolvedValue(mockTickets);

      const result = await findAllTickets(params);

      expect(mockTicket.count).toHaveBeenCalledTimes(1);
      expect(mockTicket.count).toHaveBeenCalledWith({ where: {} });

      expect(mockTicket.findMany).toHaveBeenCalledTimes(1);
      expect(mockTicket.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          event: true,
          category: true,
        },
      });

      expect(result.tickets).toEqual(mockTickets);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    test("should filter by search term with OR condition", async () => {
      const params = {
        page: 1,
        limit: 10,
        search: "comedy",
      };

      mockTicket.count.mockResolvedValue(5);
      mockTicket.findMany.mockResolvedValue([]);

      await findAllTickets(params);

      expect(mockTicket.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "comedy", mode: "insensitive" } },
            { artist: { contains: "comedy", mode: "insensitive" } },
          ],
        },
      });

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "comedy", mode: "insensitive" } },
              { artist: { contains: "comedy", mode: "insensitive" } },
            ],
          },
        })
      );
    });

    test("should filter by minimum price", async () => {
      const params = {
        page: 1,
        limit: 10,
        minPrice: 100000,
      };

      mockTicket.count.mockResolvedValue(10);
      mockTicket.findMany.mockResolvedValue([]);

      await findAllTickets(params);

      expect(mockTicket.count).toHaveBeenCalledWith({
        where: {
          price: {
            gte: 100000,
          },
        },
      });

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            price: {
              gte: 100000,
            },
          },
        })
      );
    });

    test("should filter by maximum price", async () => {
      const params = {
        page: 1,
        limit: 10,
        maxPrice: 500000,
      };

      mockTicket.count.mockResolvedValue(15);
      mockTicket.findMany.mockResolvedValue([]);

      await findAllTickets(params);

      expect(mockTicket.count).toHaveBeenCalledWith({
        where: {
          price: {
            lte: 500000,
          },
        },
      });

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            price: {
              lte: 500000,
            },
          },
        })
      );
    });

    test("should filter by price range (min and max)", async () => {
      const params = {
        page: 1,
        limit: 10,
        minPrice: 100000,
        maxPrice: 500000,
      };

      mockTicket.count.mockResolvedValue(20);
      mockTicket.findMany.mockResolvedValue([]);

      await findAllTickets(params);

      expect(mockTicket.count).toHaveBeenCalledWith({
        where: {
          price: {
            gte: 100000,
            lte: 500000,
          },
        },
      });

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            price: {
              gte: 100000,
              lte: 500000,
            },
          },
        })
      );
    });

    test("should filter by artist with case-insensitive mode", async () => {
      const params = {
        page: 1,
        limit: 10,
        artist: "Comedy Legends",
      };

      mockTicket.count.mockResolvedValue(8);
      mockTicket.findMany.mockResolvedValue([]);

      await findAllTickets(params);

      expect(mockTicket.count).toHaveBeenCalledWith({
        where: {
          artist: {
            contains: "Comedy Legends",
            mode: "insensitive",
          },
        },
      });

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            artist: {
              contains: "Comedy Legends",
              mode: "insensitive",
            },
          },
        })
      );
    });

    test("should filter by eventId", async () => {
      const params = {
        page: 1,
        limit: 10,
        eventId: 5,
      };

      mockTicket.count.mockResolvedValue(12);
      mockTicket.findMany.mockResolvedValue([]);

      await findAllTickets(params);

      expect(mockTicket.count).toHaveBeenCalledWith({
        where: {
          eventId: 5,
        },
      });

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            eventId: 5,
          },
        })
      );
    });

    test("should filter by categoryId", async () => {
      const params = {
        page: 1,
        limit: 10,
        categoryId: 3,
      };

      mockTicket.count.mockResolvedValue(7);
      mockTicket.findMany.mockResolvedValue([]);

      await findAllTickets(params);

      expect(mockTicket.count).toHaveBeenCalledWith({
        where: {
          categoryId: 3,
        },
      });

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            categoryId: 3,
          },
        })
      );
    });

    test("should handle multiple filters combined", async () => {
      const params = {
        page: 2,
        limit: 20,
        search: "VIP",
        minPrice: 200000,
        maxPrice: 1000000,
        artist: "Top Stars",
        eventId: 10,
        categoryId: 2,
      };

      mockTicket.count.mockResolvedValue(50);
      mockTicket.findMany.mockResolvedValue([]);

      await findAllTickets(params);

      expect(mockTicket.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "VIP", mode: "insensitive" } },
            { artist: { contains: "VIP", mode: "insensitive" } },
          ],
          price: {
            gte: 200000,
            lte: 1000000,
          },
          artist: {
            contains: "Top Stars",
            mode: "insensitive",
          },
          eventId: 10,
          categoryId: 2,
        },
      });

      expect(mockTicket.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "VIP", mode: "insensitive" } },
            { artist: { contains: "VIP", mode: "insensitive" } },
          ],
          price: {
            gte: 200000,
            lte: 1000000,
          },
          artist: {
            contains: "Top Stars",
            mode: "insensitive",
          },
          eventId: 10,
          categoryId: 2,
        },
        skip: 20, // (page 2 - 1) * 20
        take: 20,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          event: true,
          category: true,
        },
      });
    });

    test("should handle pagination for page 2", async () => {
      const params = { page: 2, limit: 5 };

      mockTicket.count.mockResolvedValue(12);
      mockTicket.findMany.mockResolvedValue([]);

      const result = await findAllTickets(params);

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * 5
          take: 5,
        })
      );

      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(3);
    });

    test("should calculate totalPages correctly", async () => {
      const params = { page: 1, limit: 7 };

      mockTicket.count.mockResolvedValue(20);
      mockTicket.findMany.mockResolvedValue([]);

      const result = await findAllTickets(params);

      // Math.ceil(20 / 7) = 3
      expect(result.meta.totalPages).toBe(3);
    });

    test("should order tickets by createdAt descending", async () => {
      const params = { page: 1, limit: 10 };

      mockTicket.count.mockResolvedValue(5);
      mockTicket.findMany.mockResolvedValue([]);

      await findAllTickets(params);

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: "desc",
          },
        })
      );
    });

    test("should return empty array when no tickets found", async () => {
      const params = { page: 1, limit: 10 };

      mockTicket.count.mockResolvedValue(0);
      mockTicket.findMany.mockResolvedValue([]);

      const result = await findAllTickets(params);

      expect(result.tickets).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    test("should include event and category in tickets", async () => {
      const params = { page: 1, limit: 10 };

      mockTicket.count.mockResolvedValue(5);
      mockTicket.findMany.mockResolvedValue([]);

      await findAllTickets(params);

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            event: true,
            category: true,
          },
        })
      );
    });
  });

  describe("findTicketById", () => {
    test("should find ticket by id with event and category", async () => {
      const ticketId = 1;
      const expectedTicket = createMockTicket({ id: ticketId });

      mockTicket.findUnique.mockResolvedValue(expectedTicket);

      const result = await findTicketById(ticketId);

      expect(mockTicket.findUnique).toHaveBeenCalledTimes(1);
      expect(mockTicket.findUnique).toHaveBeenCalledWith({
        where: { id: ticketId },
        include: {
          event: true,
          category: true,
        },
      });

      expect(result).toEqual(expectedTicket);
      expect(result.id).toBe(ticketId);
    });

    test("should return null when ticket not found", async () => {
      const ticketId = 999;

      mockTicket.findUnique.mockResolvedValue(null);

      const result = await findTicketById(ticketId);

      expect(mockTicket.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test("should include event and category details", async () => {
      const ticketId = 5;
      const expectedTicket = createMockTicket({ id: ticketId });

      mockTicket.findUnique.mockResolvedValue(expectedTicket);

      const result = await findTicketById(ticketId);

      expect(result.event).toBeDefined();
      expect(result.event.id).toBeDefined();
      expect(result.event.name).toBeDefined();
      expect(result.category).toBeDefined();
      expect(result.category.id).toBeDefined();
      expect(result.category.name).toBeDefined();
    });
  });

  describe("updateTicket", () => {
    test("should update ticket with event and category includes", async () => {
      const ticketId = 1;
      const updateData = {
        name: "Updated VIP Ticket",
        price: 600000,
        stock: 80,
      };

      const updatedTicket = createMockTicket({
        id: ticketId,
        ...updateData,
        updatedAt: new Date("2025-12-06T15:00:00.000Z"),
      });

      mockTicket.update.mockResolvedValue(updatedTicket);

      const result = await updateTicket(ticketId, updateData);

      expect(mockTicket.update).toHaveBeenCalledTimes(1);
      expect(mockTicket.update).toHaveBeenCalledWith({
        where: { id: ticketId },
        data: updateData,
        include: {
          event: true,
          category: true,
        },
      });

      expect(result).toEqual(updatedTicket);
      expect(result.name).toBe("Updated VIP Ticket");
      expect(result.price).toBe(600000);
      expect(result.stock).toBe(80);
    });

    test("should update only name", async () => {
      const ticketId = 2;
      const updateData = { name: "New Name" };

      const updatedTicket = createMockTicket({
        id: ticketId,
        name: "New Name",
      });

      mockTicket.update.mockResolvedValue(updatedTicket);

      const result = await updateTicket(ticketId, updateData);

      expect(result.name).toBe("New Name");
    });

    test("should update only price", async () => {
      const ticketId = 3;
      const updateData = { price: 350000 };

      const updatedTicket = createMockTicket({
        id: ticketId,
        price: 350000,
      });

      mockTicket.update.mockResolvedValue(updatedTicket);

      const result = await updateTicket(ticketId, updateData);

      expect(result.price).toBe(350000);
    });

    test("should update only stock", async () => {
      const ticketId = 4;
      const updateData = { stock: 200 };

      const updatedTicket = createMockTicket({
        id: ticketId,
        stock: 200,
      });

      mockTicket.update.mockResolvedValue(updatedTicket);

      const result = await updateTicket(ticketId, updateData);

      expect(result.stock).toBe(200);
    });

    test("should update multiple fields", async () => {
      const ticketId = 5;
      const updateData = {
        name: "Super VIP",
        price: 1000000,
        stock: 25,
        artist: "Mega Stars",
      };

      const updatedTicket = createMockTicket({
        id: ticketId,
        ...updateData,
      });

      mockTicket.update.mockResolvedValue(updatedTicket);

      const result = await updateTicket(ticketId, updateData);

      expect(result.name).toBe("Super VIP");
      expect(result.price).toBe(1000000);
      expect(result.stock).toBe(25);
      expect(result.artist).toBe("Mega Stars");
    });

    test("should include event and category in response", async () => {
      const ticketId = 6;
      const updateData = { price: 450000 };

      const updatedTicket = createMockTicket({
        id: ticketId,
        ...updateData,
      });

      mockTicket.update.mockResolvedValue(updatedTicket);

      const result = await updateTicket(ticketId, updateData);

      expect(result.event).toBeDefined();
      expect(result.category).toBeDefined();
    });
  });

  describe("deleteTicket", () => {
    test("should delete ticket by id", async () => {
      const ticketId = 1;
      const deletedTicket = createMockTicket({ id: ticketId });

      mockTicket.delete.mockResolvedValue(deletedTicket);

      const result = await deleteTicket(ticketId);

      expect(mockTicket.delete).toHaveBeenCalledTimes(1);
      expect(mockTicket.delete).toHaveBeenCalledWith({
        where: { id: ticketId },
      });

      expect(result).toEqual(deletedTicket);
      expect(result.id).toBe(ticketId);
    });

    test("should delete ticket and return deleted data", async () => {
      const ticketId = 10;
      const deletedTicket = createMockTicket({
        id: ticketId,
        name: "To Be Deleted",
        price: 250000,
      });

      mockTicket.delete.mockResolvedValue(deletedTicket);

      const result = await deleteTicket(ticketId);

      expect(result.id).toBe(ticketId);
      expect(result.name).toBe("To Be Deleted");
      expect(result.price).toBe(250000);
    });

    test("should handle deleting different tickets", async () => {
      const ticket1 = createMockTicket({ id: 1, name: "Ticket 1" });
      const ticket2 = createMockTicket({ id: 2, name: "Ticket 2" });

      mockTicket.delete
        .mockResolvedValueOnce(ticket1)
        .mockResolvedValueOnce(ticket2);

      const result1 = await deleteTicket(1);
      const result2 = await deleteTicket(2);

      expect(result1).toEqual(ticket1);
      expect(result2).toEqual(ticket2);
      expect(mockTicket.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe("findTicketsByCategory", () => {
    test("should find tickets by categoryId with event and category", async () => {
      const categoryId = 1;
      const mockTickets = [
        createMockTicket({ id: 1, categoryId: 1, name: "VIP 1" }),
        createMockTicket({ id: 2, categoryId: 1, name: "VIP 2" }),
        createMockTicket({ id: 3, categoryId: 1, name: "VIP 3" }),
      ];

      mockTicket.findMany.mockResolvedValue(mockTickets);

      const result = await findTicketsByCategory(categoryId);

      expect(mockTicket.findMany).toHaveBeenCalledTimes(1);
      expect(mockTicket.findMany).toHaveBeenCalledWith({
        where: { categoryId: 1 },
        include: {
          event: true,
          category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result).toEqual(mockTickets);
      expect(result.length).toBe(3);
    });

    test("should order tickets by createdAt descending", async () => {
      const categoryId = 2;

      mockTicket.findMany.mockResolvedValue([]);

      await findTicketsByCategory(categoryId);

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: "desc",
          },
        })
      );
    });

    test("should return empty array when no tickets in category", async () => {
      const categoryId = 999;

      mockTicket.findMany.mockResolvedValue([]);

      const result = await findTicketsByCategory(categoryId);

      expect(result).toEqual([]);
    });

    test("should include event and category details", async () => {
      const categoryId = 3;

      mockTicket.findMany.mockResolvedValue([]);

      await findTicketsByCategory(categoryId);

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            event: true,
            category: true,
          },
        })
      );
    });

    test("should filter by specific categoryId", async () => {
      const categoryId = 5;

      mockTicket.findMany.mockResolvedValue([]);

      await findTicketsByCategory(categoryId);

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { categoryId: 5 },
        })
      );
    });
  });

  describe("findTicketsByEvent", () => {
    test("should find tickets by eventId with event and category", async () => {
      const eventId = 1;
      const mockTickets = [
        createMockTicket({ id: 1, eventId: 1, name: "Early Bird" }),
        createMockTicket({ id: 2, eventId: 1, name: "Regular" }),
        createMockTicket({ id: 3, eventId: 1, name: "VIP" }),
      ];

      mockTicket.findMany.mockResolvedValue(mockTickets);

      const result = await findTicketsByEvent(eventId);

      expect(mockTicket.findMany).toHaveBeenCalledTimes(1);
      expect(mockTicket.findMany).toHaveBeenCalledWith({
        where: { eventId: 1 },
        include: {
          event: true,
          category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result).toEqual(mockTickets);
      expect(result.length).toBe(3);
    });

    test("should order tickets by createdAt descending", async () => {
      const eventId = 2;

      mockTicket.findMany.mockResolvedValue([]);

      await findTicketsByEvent(eventId);

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: "desc",
          },
        })
      );
    });

    test("should return empty array when no tickets for event", async () => {
      const eventId = 999;

      mockTicket.findMany.mockResolvedValue([]);

      const result = await findTicketsByEvent(eventId);

      expect(result).toEqual([]);
    });

    test("should include event and category details", async () => {
      const eventId = 3;

      mockTicket.findMany.mockResolvedValue([]);

      await findTicketsByEvent(eventId);

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            event: true,
            category: true,
          },
        })
      );
    });

    test("should filter by specific eventId", async () => {
      const eventId = 10;

      mockTicket.findMany.mockResolvedValue([]);

      await findTicketsByEvent(eventId);

      expect(mockTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: 10 },
        })
      );
    });
  });
});
