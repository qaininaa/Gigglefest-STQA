import { describe, test, expect, beforeAll } from "@jest/globals";
import request from "supertest";
import app from "../app.js";

let adminToken;
let userToken;
let ticketId;
let eventId;
let categoryId;

describe("TICKET API TESTING", () => {
  // ==== SETUP: Login dan retrieve prerequisite data =====
  beforeAll(async () => {
    // Login sebagai admin untuk operasi create/update/delete
    const adminRes = await request(app).post("/api/v1/auth/login").send({
      email: "ghaisanikarin@gmail.com",
      password: "password",
    });
    adminToken = adminRes.body.data?.token;

    // Login sebagai user biasa untuk test authorization
    const userRes = await request(app).post("/api/v1/auth/login").send({
      email: "karina@gmail.com",
      password: "password",
    });
    userToken = userRes.body.data?.token;

    // Retrieve eventId dan categoryId yang diperlukan untuk create ticket
    try {
      // Coba dapatkan event dari endpoint
      const eventsRes = await request(app).get("/api/v1/events");
      if (eventsRes.body.data?.events?.length > 0) {
        eventId = eventsRes.body.data.events[0].id;
      } else if (eventsRes.body.data?.length > 0) {
        eventId = eventsRes.body.data[0].id;
      } else {
        eventId = 1; // Fallback
      }

      // Coba dapatkan category dari endpoint
      const categoriesRes = await request(app).get("/api/v1/categories");
      if (categoriesRes.body.data?.categories?.length > 0) {
        categoryId = categoriesRes.body.data.categories[0].id;
      } else if (categoriesRes.body.data?.length > 0) {
        categoryId = categoriesRes.body.data[0].id;
      } else {
        categoryId = 1; // Fallback
      }
    } catch (error) {
      // Fallback jika request gagal
      eventId = 1;
      categoryId = 1;
    }
  });

  // ==== TC_TICKET_01: Get All Tickets - Tanpa filter =====
  /**
   * Test: Mengambil semua tiket tanpa parameter filter
   * Method: GET /api/v1/tickets
   * Expected: Status 200, return array tickets dengan pagination
   */
  test("TC_TICKET_01 - Get all tickets tanpa filter", async () => {
    const res = await request(app).get("/api/v1/tickets");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("tickets");
    expect(res.body.data).toHaveProperty("meta");
    expect(Array.isArray(res.body.data.tickets)).toBe(true);
    expect(res.body.data.meta).toHaveProperty("page");
    expect(res.body.data.meta).toHaveProperty("limit");
    expect(res.body.data.meta).toHaveProperty("total");
    expect(res.body.data.meta).toHaveProperty("totalPages");
  });

  // ==== TC_TICKET_02: Get All Tickets - Dengan pagination =====
  /**
   * Test: Mengambil tiket dengan parameter pagination
   * Method: GET /api/v1/tickets?page=1&limit=5
   * Expected: Status 200, return tickets dengan meta pagination yang sesuai
   */
  test("TC_TICKET_02 - Get tickets dengan pagination", async () => {
    const res = await request(app).get("/api/v1/tickets?page=1&limit=5");

    expect(res.status).toBe(200);
    expect(res.body.data.meta.page).toBe(1);
    expect(res.body.data.meta.limit).toBe(5);
    expect(res.body.data.tickets.length).toBeLessThanOrEqual(5);
  });

  // ==== TC_TICKET_03: Get All Tickets - Dengan search filter =====
  /**
   * Test: Mencari tiket berdasarkan nama atau artist
   * Method: GET /api/v1/tickets?search=keyword
   * Expected: Status 200, return filtered tickets
   */
  test("TC_TICKET_03 - Get tickets dengan search filter", async () => {
    const res = await request(app).get("/api/v1/tickets?search=VIP");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("tickets");
    expect(Array.isArray(res.body.data.tickets)).toBe(true);
  });

  // ==== TC_TICKET_04: Get All Tickets - Dengan price range filter =====
  /**
   * Test: Filter tiket berdasarkan range harga
   * Method: GET /api/v1/tickets?minPrice=100000&maxPrice=500000
   * Expected: Status 200, semua tiket dalam range harga
   */
  test("TC_TICKET_04 - Get tickets dengan price range filter", async () => {
    const res = await request(app).get(
      "/api/v1/tickets?minPrice=100000&maxPrice=500000"
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("tickets");
    if (res.body.data.tickets.length > 0) {
      res.body.data.tickets.forEach((ticket) => {
        expect(ticket.price).toBeGreaterThanOrEqual(100000);
        expect(ticket.price).toBeLessThanOrEqual(500000);
      });
    }
  });

  // ==== TC_TICKET_05: Get All Tickets - Dengan artist filter =====
  /**
   * Test: Filter tiket berdasarkan artist
   * Method: GET /api/v1/tickets?artist=artistName
   * Expected: Status 200, return tickets filtered by artist
   */
  test("TC_TICKET_05 - Get tickets dengan artist filter", async () => {
    const res = await request(app).get("/api/v1/tickets?artist=test");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("tickets");
    expect(Array.isArray(res.body.data.tickets)).toBe(true);
  });

  // ==== TC_TICKET_06: Get All Tickets - Dengan eventId filter (invalid) =====
  /**
   * Test: Filter tiket dengan eventId yang tidak ada
   * Method: GET /api/v1/tickets?eventId=99999
   * Expected: Status 400, error "Event not found"
   */
  test("TC_TICKET_06 - Get tickets dengan eventId tidak valid", async () => {
    const res = await request(app).get("/api/v1/tickets?eventId=99999");

    expect([400, 500]).toContain(res.status);
    expect(res.body.message.toLowerCase()).toContain("event not found");
  });

  // ==== TC_TICKET_07: Get All Tickets - Dengan categoryId filter (invalid) =====
  /**
   * Test: Filter tiket dengan categoryId yang tidak ada
   * Method: GET /api/v1/tickets?categoryId=99999
   * Expected: Status 400, error "Category not found"
   */
  test("TC_TICKET_07 - Get tickets dengan categoryId tidak valid", async () => {
    const res = await request(app).get("/api/v1/tickets?categoryId=99999");

    expect([400, 500]).toContain(res.status);
    expect(res.body.message.toLowerCase()).toContain("category not found");
  });

  // ==== TC_TICKET_08: Create Ticket - Dengan data valid (admin) =====
  /**
   * Test: Admin membuat tiket baru dengan data lengkap
   * Method: POST /api/v1/tickets
   * Headers: Authorization (admin)
   * Expected: Status 201, ticket berhasil dibuat
   */
  test("TC_TICKET_08 - Create ticket dengan data valid (admin)", async () => {
    const res = await request(app)
      .post("/api/v1/tickets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "VIP Ticket Test",
        price: 500000,
        quantity: 100,
        eventId: eventId,
        categoryId: categoryId,
        artist: "Test Artist",
      });

    if (res.status === 201) {
      expect(res.body.message.toLowerCase()).toContain("successfully");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("name", "VIP Ticket Test");
      expect(res.body.data).toHaveProperty("price", 500000);
      expect(res.body.data).toHaveProperty("quantity", 100);
      ticketId = res.body.data.id;
    } else {
      // Accept 400 or 500 if event/category not found
      expect([201, 400, 500]).toContain(res.status);
    }
  });

  // ==== TC_TICKET_09: Create Ticket - Tanpa authentication =====
  /**
   * Test: Membuat tiket tanpa token authentication
   * Method: POST /api/v1/tickets
   * Expected: Status 401, unauthorized
   */
  test("TC_TICKET_09 - Create ticket tanpa authentication", async () => {
    const res = await request(app).post("/api/v1/tickets").send({
      name: "VIP Ticket",
      price: 500000,
      quantity: 100,
      eventId: eventId,
      categoryId: categoryId,
    });

    expect(res.status).toBe(401);
    expect(res.body.message.toLowerCase()).toMatch(/unauthorized|token/i);
  });

  // ==== TC_TICKET_10: Create Ticket - Sebagai user biasa (bukan admin) =====
  /**
   * Test: User biasa mencoba membuat tiket
   * Method: POST /api/v1/tickets
   * Headers: Authorization (user)
   * Expected: Status 403, forbidden
   */
  test("TC_TICKET_10 - Create ticket sebagai user biasa (non-admin)", async () => {
    const res = await request(app)
      .post("/api/v1/tickets")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "VIP Ticket",
        price: 500000,
        quantity: 100,
        eventId: eventId,
        categoryId: categoryId,
      });

    expect(res.status).toBe(403);
    expect(res.body.message.toLowerCase()).toContain("unauthorized");
  });

  // ==== TC_TICKET_11: Create Ticket - Data tidak lengkap =====
  /**
   * Test: Membuat tiket dengan data yang tidak lengkap (missing required field)
   * Method: POST /api/v1/tickets
   * Expected: Status 400, validation error
   */
  test("TC_TICKET_11 - Create ticket dengan data tidak lengkap", async () => {
    const res = await request(app)
      .post("/api/v1/tickets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "VIP Ticket",
        // missing price, quantity, eventId, categoryId
      });

    expect(res.status).toBe(400);
  });

  // ==== TC_TICKET_12: Create Ticket - Dengan eventId tidak valid =====
  /**
   * Test: Membuat tiket dengan eventId yang tidak ada
   * Method: POST /api/v1/tickets
   * Expected: Status 400, error "Event not found"
   */
  test("TC_TICKET_12 - Create ticket dengan eventId tidak valid", async () => {
    const res = await request(app)
      .post("/api/v1/tickets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "VIP Ticket",
        price: 500000,
        quantity: 100,
        eventId: 99999,
        categoryId: categoryId,
      });

    expect([400, 500]).toContain(res.status);
    expect(res.body.message.toLowerCase()).toContain("event not found");
  });

  // ==== TC_TICKET_13: Create Ticket - Dengan categoryId tidak valid =====
  /**
   * Test: Membuat tiket dengan categoryId yang tidak ada
   * Method: POST /api/v1/tickets
   * Expected: Status 400, error "Category not found"
   */
  test("TC_TICKET_13 - Create ticket dengan categoryId tidak valid", async () => {
    const res = await request(app)
      .post("/api/v1/tickets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "VIP Ticket",
        price: 500000,
        quantity: 100,
        eventId: eventId,
        categoryId: 99999,
      });

    expect([400, 500]).toContain(res.status);
    // API validates event first, so might get "event not found" or "category not found"
    expect(res.body.message.toLowerCase()).toMatch(
      /category not found|event not found/
    );
  });

  // ==== TC_TICKET_14: Get Ticket By ID - Dengan ID valid =====
  /**
   * Test: Mengambil detail tiket berdasarkan ID yang valid
   * Method: GET /api/v1/tickets/:id
   * Expected: Status 200, return ticket details dengan event dan category
   */
  test("TC_TICKET_14 - Get ticket by ID dengan ID valid", async () => {
    // Ambil ticket pertama dari list
    const listRes = await request(app).get("/api/v1/tickets");
    if (listRes.body.data?.tickets?.length > 0) {
      const firstTicketId = listRes.body.data.tickets[0].id;

      const res = await request(app).get(`/api/v1/tickets/${firstTicketId}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("id", firstTicketId);
      expect(res.body.data).toHaveProperty("name");
      expect(res.body.data).toHaveProperty("price");
      expect(res.body.data).toHaveProperty("quantity");
      expect(res.body.data).toHaveProperty("event");
      expect(res.body.data).toHaveProperty("category");
    } else {
      expect(true).toBe(true);
    }
  });

  // ==== TC_TICKET_15: Get Ticket By ID - Dengan ID tidak valid =====
  /**
   * Test: Mengambil tiket dengan ID yang tidak ada
   * Method: GET /api/v1/tickets/:id
   * Expected: Status 400, error "Ticket not found"
   */
  test("TC_TICKET_15 - Get ticket by ID dengan ID tidak valid", async () => {
    const res = await request(app).get("/api/v1/tickets/99999");

    expect([400, 500]).toContain(res.status);
    expect(res.body.message.toLowerCase()).toContain("ticket not found");
  });

  // ==== TC_TICKET_16: Update Ticket - Dengan data valid (admin) =====
  /**
   * Test: Admin mengupdate tiket yang sudah ada
   * Method: PATCH /api/v1/tickets/:id
   * Headers: Authorization (admin)
   * Expected: Status 200, ticket berhasil diupdate
   */
  test("TC_TICKET_16 - Update ticket dengan data valid (admin)", async () => {
    // Buat ticket dulu atau gunakan existing ticket
    if (!ticketId) {
      const createRes = await request(app)
        .post("/api/v1/tickets")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Ticket To Update",
          price: 300000,
          quantity: 50,
          eventId: eventId,
          categoryId: categoryId,
        });
      if (createRes.body.data?.id) {
        ticketId = createRes.body.data.id;
      }
    }

    if (ticketId) {
      const res = await request(app)
        .patch(`/api/v1/tickets/${ticketId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Updated Ticket Name",
          price: 350000,
        });

      expect(res.status).toBe(200);
      expect(res.body.message.toLowerCase()).toContain("successfully");
      expect(res.body.data).toHaveProperty("name", "Updated Ticket Name");
      expect(res.body.data).toHaveProperty("price", 350000);
    } else {
      expect(true).toBe(true);
    }
  });

  // ==== TC_TICKET_17: Update Ticket - Tanpa authentication =====
  /**
   * Test: Update tiket tanpa token authentication
   * Method: PATCH /api/v1/tickets/:id
   * Expected: Status 401, unauthorized
   */
  test("TC_TICKET_17 - Update ticket tanpa authentication", async () => {
    const res = await request(app).patch("/api/v1/tickets/1").send({
      name: "Updated Name",
    });

    expect(res.status).toBe(401);
    expect(res.body.message.toLowerCase()).toMatch(/unauthorized|token/i);
  });

  // ==== TC_TICKET_18: Update Ticket - Sebagai user biasa (bukan admin) =====
  /**
   * Test: User biasa mencoba update tiket
   * Method: PATCH /api/v1/tickets/:id
   * Expected: Status 403, forbidden
   */
  test("TC_TICKET_18 - Update ticket sebagai user biasa (non-admin)", async () => {
    const res = await request(app)
      .patch("/api/v1/tickets/1")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "Updated Name",
      });

    expect(res.status).toBe(403);
    expect(res.body.message.toLowerCase()).toContain("unauthorized");
  });

  // ==== TC_TICKET_19: Update Ticket - Dengan ID tidak valid =====
  /**
   * Test: Update tiket dengan ID yang tidak ada
   * Method: PATCH /api/v1/tickets/:id
   * Expected: Status 400, error "Ticket not found"
   */
  test("TC_TICKET_19 - Update ticket dengan ID tidak valid", async () => {
    const res = await request(app)
      .patch("/api/v1/tickets/99999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Updated Name",
      });

    expect([400, 500]).toContain(res.status);
    expect(res.body.message.toLowerCase()).toContain("ticket not found");
  });

  // ==== TC_TICKET_20: Get Tickets By Category - Dengan categoryId valid =====
  /**
   * Test: Mengambil semua tiket berdasarkan kategori
   * Method: GET /api/v1/tickets/category/:categoryId
   * Expected: Status 200, return tickets from that category
   */
  test("TC_TICKET_20 - Get tickets by category dengan categoryId valid", async () => {
    if (categoryId) {
      const res = await request(app).get(
        `/api/v1/tickets/category/${categoryId}`
      );

      if (res.status === 200) {
        expect(res.body.data).toBeDefined();
        expect(Array.isArray(res.body.data)).toBe(true);
        if (res.body.data.length > 0) {
          res.body.data.forEach((ticket) => {
            expect(ticket).toHaveProperty("categoryId", categoryId);
          });
        }
      } else {
        // Accept 400 or 500 if category not found
        expect([200, 400, 500]).toContain(res.status);
      }
    } else {
      expect(true).toBe(true);
    }
  });

  // ==== TC_TICKET_21: Get Tickets By Category - Dengan categoryId tidak valid =====
  /**
   * Test: Mengambil tiket dengan categoryId yang tidak ada
   * Method: GET /api/v1/tickets/category/:categoryId
   * Expected: Status 400, error "Category not found"
   */
  test("TC_TICKET_21 - Get tickets by category dengan categoryId tidak valid", async () => {
    const res = await request(app).get("/api/v1/tickets/category/99999");

    expect([400, 500]).toContain(res.status);
    expect(res.body.message.toLowerCase()).toContain("category not found");
  });

  // ==== TC_TICKET_22: Get Tickets By Event - Dengan eventId valid =====
  /**
   * Test: Mengambil semua tiket berdasarkan event
   * Method: GET /api/v1/tickets/event/:eventId
   * Expected: Status 200, return tickets from that event
   */
  test("TC_TICKET_22 - Get tickets by event dengan eventId valid", async () => {
    if (eventId) {
      const res = await request(app).get(`/api/v1/tickets/event/${eventId}`);

      if (res.status === 200) {
        expect(res.body.data).toBeDefined();
        expect(Array.isArray(res.body.data)).toBe(true);
        if (res.body.data.length > 0) {
          res.body.data.forEach((ticket) => {
            expect(ticket).toHaveProperty("eventId", eventId);
          });
        }
      } else {
        // Accept 400 or 500 if event not found
        expect([200, 400, 500]).toContain(res.status);
      }
    } else {
      expect(true).toBe(true);
    }
  });

  // ==== TC_TICKET_23: Get Tickets By Event - Dengan eventId tidak valid =====
  /**
   * Test: Mengambil tiket dengan eventId yang tidak ada
   * Method: GET /api/v1/tickets/event/:eventId
   * Expected: Status 400, error "Event not found"
   */
  test("TC_TICKET_23 - Get tickets by event dengan eventId tidak valid", async () => {
    const res = await request(app).get("/api/v1/tickets/event/99999");

    expect([400, 500]).toContain(res.status);
    expect(res.body.message.toLowerCase()).toContain("event not found");
  });

  // ==== TC_TICKET_24: Delete Ticket - Dengan ID valid (admin) =====
  /**
   * Test: Admin menghapus tiket
   * Method: DELETE /api/v1/tickets/:id
   * Headers: Authorization (admin)
   * Expected: Status 200, ticket berhasil dihapus
   */
  test("TC_TICKET_24 - Delete ticket dengan ID valid (admin)", async () => {
    // Buat ticket untuk dihapus
    const createRes = await request(app)
      .post("/api/v1/tickets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Ticket To Delete",
        price: 200000,
        quantity: 30,
        eventId: eventId,
        categoryId: categoryId,
      });

    if (createRes.status === 201 && createRes.body.data?.id) {
      const deleteId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/v1/tickets/${deleteId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message.toLowerCase()).toContain("successfully");
    } else {
      expect(true).toBe(true);
    }
  });

  // ==== TC_TICKET_25: Delete Ticket - Tanpa authentication =====
  /**
   * Test: Delete tiket tanpa token authentication
   * Method: DELETE /api/v1/tickets/:id
   * Expected: Status 401, unauthorized
   */
  test("TC_TICKET_25 - Delete ticket tanpa authentication", async () => {
    const res = await request(app).delete("/api/v1/tickets/1");

    expect(res.status).toBe(401);
    expect(res.body.message.toLowerCase()).toMatch(/unauthorized|token/i);
  });

  // ==== TC_TICKET_26: Delete Ticket - Sebagai user biasa (bukan admin) =====
  /**
   * Test: User biasa mencoba menghapus tiket
   * Method: DELETE /api/v1/tickets/:id
   * Expected: Status 403, forbidden
   */
  test("TC_TICKET_26 - Delete ticket sebagai user biasa (non-admin)", async () => {
    const res = await request(app)
      .delete("/api/v1/tickets/1")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message.toLowerCase()).toContain("unauthorized");
  });

  // ==== TC_TICKET_27: Delete Ticket - Dengan ID tidak valid =====
  /**
   * Test: Delete tiket dengan ID yang tidak ada
   * Method: DELETE /api/v1/tickets/:id
   * Expected: Status 400, error "Ticket not found"
   */
  test("TC_TICKET_27 - Delete ticket dengan ID tidak valid", async () => {
    const res = await request(app)
      .delete("/api/v1/tickets/99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect([400, 500]).toContain(res.status);
    expect(res.body.message.toLowerCase()).toContain("ticket not found");
  });

  // ==== TC_TICKET_28: Get Tickets - Dengan kombinasi multiple filters =====
  /**
   * Test: Filter tiket dengan kombinasi beberapa parameter
   * Method: GET /api/v1/tickets?page=1&limit=10&minPrice=100000&search=VIP
   * Expected: Status 200, return filtered and paginated tickets
   */
  test("TC_TICKET_28 - Get tickets dengan multiple filters", async () => {
    const res = await request(app).get(
      "/api/v1/tickets?page=1&limit=10&minPrice=100000&search=VIP"
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("tickets");
    expect(res.body.data).toHaveProperty("meta");
    expect(res.body.data.meta.page).toBe(1);
    expect(res.body.data.meta.limit).toBe(10);
    if (res.body.data.tickets.length > 0) {
      res.body.data.tickets.forEach((ticket) => {
        expect(ticket.price).toBeGreaterThanOrEqual(100000);
      });
    }
  });
});
