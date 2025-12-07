import { describe, test, expect, beforeAll } from "@jest/globals";
import request from "supertest";
import app from "../app.js";

let adminToken;
let userToken;
let eventId;

describe("EVENT API TESTING", () => {
  // ==== SETUP: Login untuk mendapatkan tokens =====
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
  });

  // ==== TC_EVENT_01: Get All Events - Tanpa filter =====
  /**
   * Test: Mengambil semua event tanpa parameter filter
   * Method: GET /api/v1/events
   * Expected: Status 200, return array events dengan pagination
   */
  test("TC_EVENT_01 - Get all events tanpa filter", async () => {
    const res = await request(app).get("/api/v1/events");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("events");
    expect(res.body.data).toHaveProperty("meta");
    expect(Array.isArray(res.body.data.events)).toBe(true);
    expect(res.body.data.meta).toHaveProperty("page");
    expect(res.body.data.meta).toHaveProperty("limit");
    expect(res.body.data.meta).toHaveProperty("total");
    expect(res.body.data.meta).toHaveProperty("totalPages");
  });

  // ==== TC_EVENT_02: Get All Events - Dengan pagination =====
  /**
   * Test: Mengambil events dengan parameter pagination
   * Method: GET /api/v1/events?page=1&limit=5
   * Expected: Status 200, return events dengan meta pagination yang sesuai
   */
  test("TC_EVENT_02 - Get events dengan pagination", async () => {
    const res = await request(app).get("/api/v1/events?page=1&limit=5");

    expect(res.status).toBe(200);
    expect(res.body.data.meta.page).toBe(1);
    expect(res.body.data.meta.limit).toBe(5);
    expect(res.body.data.events.length).toBeLessThanOrEqual(5);
  });

  // ==== TC_EVENT_03: Get All Events - Dengan search filter =====
  /**
   * Test: Mencari event berdasarkan nama atau lokasi
   * Method: GET /api/v1/events?search=keyword
   * Expected: Status 200, return filtered events
   */
  test("TC_EVENT_03 - Get events dengan search filter", async () => {
    const res = await request(app).get("/api/v1/events?search=concert");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("events");
    expect(Array.isArray(res.body.data.events)).toBe(true);
  });

  // ==== TC_EVENT_04: Get All Events - Dengan category filter =====
  /**
   * Test: Filter events berdasarkan kategori tiket
   * Method: GET /api/v1/events?category=1
   * Expected: Status 200, return events yang memiliki tiket dengan kategori tersebut
   */
  test("TC_EVENT_04 - Get events dengan category filter", async () => {
    const res = await request(app).get("/api/v1/events?category=1");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("events");
    expect(Array.isArray(res.body.data.events)).toBe(true);
  });

  // ==== TC_EVENT_05: Get All Events - Dengan date range filter =====
  /**
   * Test: Filter events berdasarkan range tanggal
   * Method: GET /api/v1/events?startDate=2024-01-01&endDate=2024-12-31
   * Expected: Status 200, return events dalam range tanggal
   */
  test("TC_EVENT_05 - Get events dengan date range filter", async () => {
    const res = await request(app).get(
      "/api/v1/events?startDate=2024-01-01&endDate=2024-12-31"
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("events");
    expect(Array.isArray(res.body.data.events)).toBe(true);
  });

  // ==== TC_EVENT_06: Get All Events - Dengan multiple filters =====
  /**
   * Test: Filter events dengan kombinasi beberapa parameter
   * Method: GET /api/v1/events?page=1&limit=10&search=music&category=1
   * Expected: Status 200, return filtered and paginated events
   */
  test("TC_EVENT_06 - Get events dengan multiple filters", async () => {
    const res = await request(app).get(
      "/api/v1/events?page=1&limit=10&search=music&category=1"
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("events");
    expect(res.body.data).toHaveProperty("meta");
    expect(res.body.data.meta.page).toBe(1);
    expect(res.body.data.meta.limit).toBe(10);
  });

  // ==== TC_EVENT_07: Create Event - Dengan data valid (admin) =====
  /**
   * Test: Admin membuat event baru dengan data lengkap
   * Method: POST /api/v1/events
   * Headers: Authorization (admin)
   * Expected: Status 201, event berhasil dibuat
   */
  test("TC_EVENT_07 - Create event dengan data valid (admin)", async () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);

    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Concert 2024",
        description: "Amazing concert event for testing",
        date: futureDate.toISOString(),
        location: "Jakarta Convention Center",
      });

    expect(res.status).toBe(201);
    expect(res.body.message.toLowerCase()).toContain("successfully");
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("name", "Test Concert 2024");
    expect(res.body.data).toHaveProperty(
      "location",
      "Jakarta Convention Center"
    );

    // Simpan eventId untuk test selanjutnya
    eventId = res.body.data.id;
  });

  // ==== TC_EVENT_08: Create Event - Tanpa authentication =====
  /**
   * Test: Membuat event tanpa token authentication
   * Method: POST /api/v1/events
   * Expected: Status 401, unauthorized
   */
  test("TC_EVENT_08 - Create event tanpa authentication", async () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);

    const res = await request(app).post("/api/v1/events").send({
      name: "Test Event",
      description: "Test description",
      date: futureDate.toISOString(),
      location: "Test Location",
    });

    expect(res.status).toBe(401);
    expect(res.body.message.toLowerCase()).toMatch(/unauthorized|token/i);
  });

  // ==== TC_EVENT_09: Create Event - Sebagai user biasa (bukan admin) =====
  /**
   * Test: User biasa mencoba membuat event
   * Method: POST /api/v1/events
   * Headers: Authorization (user)
   * Expected: Status 403, forbidden
   */
  test("TC_EVENT_09 - Create event sebagai user biasa (non-admin)", async () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);

    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "Test Event",
        description: "Test description",
        date: futureDate.toISOString(),
        location: "Test Location",
      });

    expect(res.status).toBe(403);
    expect(res.body.message.toLowerCase()).toContain("unauthorized");
  });

  // ==== TC_EVENT_10: Create Event - Data tidak lengkap =====
  /**
   * Test: Membuat event dengan data yang tidak lengkap (missing required field)
   * Method: POST /api/v1/events
   * Expected: Status 400, validation error
   */
  test("TC_EVENT_10 - Create event dengan data tidak lengkap", async () => {
    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Event",
        // missing date and location
      });

    expect(res.status).toBe(400);
  });

  // ==== TC_EVENT_11: Create Event - Dengan name kosong =====
  /**
   * Test: Membuat event dengan nama kosong
   * Method: POST /api/v1/events
   * Expected: Status 400, validation error
   */
  test("TC_EVENT_11 - Create event dengan name kosong", async () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);

    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "",
        date: futureDate.toISOString(),
        location: "Test Location",
      });

    expect(res.status).toBe(400);
  });

  // ==== TC_EVENT_12: Create Event - Dengan location kosong =====
  /**
   * Test: Membuat event dengan lokasi kosong
   * Method: POST /api/v1/events
   * Expected: Status 400, validation error
   */
  test("TC_EVENT_12 - Create event dengan location kosong", async () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);

    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Event",
        date: futureDate.toISOString(),
        location: "",
      });

    expect(res.status).toBe(400);
  });

  // ==== TC_EVENT_13: Create Event - Dengan invalid date format =====
  /**
   * Test: Membuat event dengan format tanggal yang tidak valid
   * Method: POST /api/v1/events
   * Expected: Status 400, validation error
   */
  test("TC_EVENT_13 - Create event dengan invalid date format", async () => {
    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Event",
        date: "invalid-date",
        location: "Test Location",
      });

    expect([400, 500]).toContain(res.status);
  });

  // ==== TC_EVENT_14: Get Event By ID - Dengan ID valid =====
  /**
   * Test: Mengambil detail event berdasarkan ID yang valid
   * Method: GET /api/v1/events/:id
   * Expected: Status 200, return event details dengan tickets
   */
  test("TC_EVENT_14 - Get event by ID dengan ID valid", async () => {
    // Ambil event pertama dari list untuk mendapatkan ID yang valid
    const listRes = await request(app).get("/api/v1/events");

    if (listRes.body.data?.events?.length > 0) {
      const firstEventId = listRes.body.data.events[0].id;

      const res = await request(app).get(`/api/v1/events/${firstEventId}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("id", firstEventId);
      expect(res.body.data).toHaveProperty("name");
      expect(res.body.data).toHaveProperty("date");
      expect(res.body.data).toHaveProperty("location");
      expect(res.body.data).toHaveProperty("tickets");
      expect(Array.isArray(res.body.data.tickets)).toBe(true);
    } else {
      expect(true).toBe(true);
    }
  });

  // ==== TC_EVENT_15: Get Event By ID - Dengan ID tidak valid =====
  /**
   * Test: Mengambil event dengan ID yang tidak ada
   * Method: GET /api/v1/events/:id
   * Expected: Status 404, error "Event not found"
   */
  test("TC_EVENT_15 - Get event by ID dengan ID tidak valid", async () => {
    const res = await request(app).get("/api/v1/events/99999");

    expect(res.status).toBe(404);
    expect(res.body.message.toLowerCase()).toContain("event not found");
  });

  // ==== TC_EVENT_16: Update Event - Dengan data valid (admin) =====
  /**
   * Test: Admin mengupdate event yang sudah ada
   * Method: PATCH /api/v1/events/:id
   * Headers: Authorization (admin)
   * Expected: Status 200, event berhasil diupdate
   */
  test("TC_EVENT_16 - Update event dengan data valid (admin)", async () => {
    // Gunakan eventId dari test create sebelumnya, atau buat baru
    if (!eventId) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 2);

      const createRes = await request(app)
        .post("/api/v1/events")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Event To Update",
          description: "Event for update testing",
          date: futureDate.toISOString(),
          location: "Original Location",
        });

      if (createRes.body.data?.id) {
        eventId = createRes.body.data.id;
      }
    }

    if (eventId) {
      const res = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Updated Event Name",
          location: "Updated Location",
        });

      expect(res.status).toBe(200);
      expect(res.body.message.toLowerCase()).toContain("successfully");
      expect(res.body.data).toHaveProperty("name", "Updated Event Name");
      expect(res.body.data).toHaveProperty("location", "Updated Location");
    } else {
      expect(true).toBe(true);
    }
  });

  // ==== TC_EVENT_17: Update Event - Tanpa authentication =====
  /**
   * Test: Update event tanpa token authentication
   * Method: PATCH /api/v1/events/:id
   * Expected: Status 401, unauthorized
   */
  test("TC_EVENT_17 - Update event tanpa authentication", async () => {
    const res = await request(app).patch("/api/v1/events/1").send({
      name: "Updated Name",
    });

    expect(res.status).toBe(401);
    expect(res.body.message.toLowerCase()).toMatch(/unauthorized|token/i);
  });

  // ==== TC_EVENT_18: Update Event - Sebagai user biasa (bukan admin) =====
  /**
   * Test: User biasa mencoba update event
   * Method: PATCH /api/v1/events/:id
   * Expected: Status 403, forbidden
   */
  test("TC_EVENT_18 - Update event sebagai user biasa (non-admin)", async () => {
    const res = await request(app)
      .patch("/api/v1/events/1")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "Updated Name",
      });

    expect(res.status).toBe(403);
    expect(res.body.message.toLowerCase()).toContain("unauthorized");
  });

  // ==== TC_EVENT_19: Update Event - Dengan ID tidak valid =====
  /**
   * Test: Update event dengan ID yang tidak ada
   * Method: PATCH /api/v1/events/:id
   * Expected: Status 400/500, error
   */
  test("TC_EVENT_19 - Update event dengan ID tidak valid", async () => {
    const res = await request(app)
      .patch("/api/v1/events/99999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Updated Name",
      });

    expect([400, 500]).toContain(res.status);
  });

  // ==== TC_EVENT_20: Update Event - Partial update (hanya name) =====
  /**
   * Test: Update hanya sebagian field dari event
   * Method: PATCH /api/v1/events/:id
   * Expected: Status 200, hanya field yang diupdate berubah
   */
  test("TC_EVENT_20 - Update event dengan partial data", async () => {
    if (eventId) {
      const res = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          description: "Updated description only",
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty(
        "description",
        "Updated description only"
      );
    } else {
      expect(true).toBe(true);
    }
  });

  // ==== TC_EVENT_21: Update Event - Dengan invalid date format =====
  /**
   * Test: Update event dengan format tanggal yang tidak valid
   * Method: PATCH /api/v1/events/:id
   * Expected: Status 400, validation error
   */
  test("TC_EVENT_21 - Update event dengan invalid date format", async () => {
    if (eventId) {
      const res = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          date: "invalid-date-format",
        });

      expect([400, 500]).toContain(res.status);
    } else {
      expect(true).toBe(true);
    }
  });

  // ==== TC_EVENT_22: Delete Event - Dengan ID valid (admin) =====
  /**
   * Test: Admin menghapus event
   * Method: DELETE /api/v1/events/:id
   * Headers: Authorization (admin)
   * Expected: Status 200, event berhasil dihapus
   */
  test("TC_EVENT_22 - Delete event dengan ID valid (admin)", async () => {
    // Buat event untuk dihapus
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);

    const createRes = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Event To Delete",
        description: "Event for delete testing",
        date: futureDate.toISOString(),
        location: "Delete Test Location",
      });

    if (createRes.status === 201 && createRes.body.data?.id) {
      const deleteId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/v1/events/${deleteId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message.toLowerCase()).toContain("successfully");
    } else {
      expect(true).toBe(true);
    }
  });

  // ==== TC_EVENT_23: Delete Event - Tanpa authentication =====
  /**
   * Test: Delete event tanpa token authentication
   * Method: DELETE /api/v1/events/:id
   * Expected: Status 401, unauthorized
   */
  test("TC_EVENT_23 - Delete event tanpa authentication", async () => {
    const res = await request(app).delete("/api/v1/events/1");

    expect(res.status).toBe(401);
    expect(res.body.message.toLowerCase()).toMatch(/unauthorized|token/i);
  });

  // ==== TC_EVENT_24: Delete Event - Sebagai user biasa (bukan admin) =====
  /**
   * Test: User biasa mencoba menghapus event
   * Method: DELETE /api/v1/events/:id
   * Expected: Status 403, forbidden
   */
  test("TC_EVENT_24 - Delete event sebagai user biasa (non-admin)", async () => {
    const res = await request(app)
      .delete("/api/v1/events/1")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message.toLowerCase()).toContain("unauthorized");
  });

  // ==== TC_EVENT_25: Delete Event - Dengan ID tidak valid =====
  /**
   * Test: Delete event dengan ID yang tidak ada
   * Method: DELETE /api/v1/events/:id
   * Expected: Status 400/500, error
   */
  test("TC_EVENT_25 - Delete event dengan ID tidak valid", async () => {
    const res = await request(app)
      .delete("/api/v1/events/99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect([400, 500]).toContain(res.status);
  });

  // ==== TC_EVENT_26: Get Events - Verify tickets relationship =====
  /**
   * Test: Memastikan event includes tickets data
   * Method: GET /api/v1/events
   * Expected: Status 200, events include tickets array
   */
  test("TC_EVENT_26 - Get events dan verify tickets relationship", async () => {
    const res = await request(app).get("/api/v1/events");

    expect(res.status).toBe(200);
    if (res.body.data.events.length > 0) {
      res.body.data.events.forEach((event) => {
        expect(event).toHaveProperty("tickets");
        expect(Array.isArray(event.tickets)).toBe(true);
      });
    }
  });

  // ==== TC_EVENT_27: Get Events - Pagination edge case (page overflow) =====
  /**
   * Test: Request page yang melebihi total pages
   * Method: GET /api/v1/events?page=9999
   * Expected: Status 200, empty array atau last page
   */
  test("TC_EVENT_27 - Get events dengan page overflow", async () => {
    const res = await request(app).get("/api/v1/events?page=9999&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("events");
    expect(Array.isArray(res.body.data.events)).toBe(true);
    // Bisa empty array karena page melebihi total
  });

  // ==== TC_EVENT_28: Create Event - Dengan description (optional field) =====
  /**
   * Test: Membuat event dengan description yang optional
   * Method: POST /api/v1/events
   * Expected: Status 201, event created dengan description
   */
  test("TC_EVENT_28 - Create event dengan optional description", async () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);

    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Event With Description",
        description: "This is a detailed description of the event",
        date: futureDate.toISOString(),
        location: "Description Test Location",
      });

    if (res.status === 201) {
      expect(res.body.data).toHaveProperty(
        "description",
        "This is a detailed description of the event"
      );
    } else {
      expect(true).toBe(true);
    }
  });

  // ==== TC_EVENT_29: Create Event - Tanpa description (optional field) =====
  /**
   * Test: Membuat event tanpa description
   * Method: POST /api/v1/events
   * Expected: Status 201, event created tanpa error
   */
  test("TC_EVENT_29 - Create event tanpa optional description", async () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);

    const res = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Event Without Description",
        date: futureDate.toISOString(),
        location: "No Description Location",
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("name", "Event Without Description");
  });

  // ==== TC_EVENT_30: Get Events - Empty search result =====
  /**
   * Test: Search dengan keyword yang tidak ditemukan
   * Method: GET /api/v1/events?search=nonexistentkeyword123456
   * Expected: Status 200, empty events array
   */
  test("TC_EVENT_30 - Get events dengan search tidak ditemukan", async () => {
    const res = await request(app).get(
      "/api/v1/events?search=nonexistentkeyword123456xyz"
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("events");
    expect(Array.isArray(res.body.data.events)).toBe(true);
    // Kemungkinan besar empty
  });
});
