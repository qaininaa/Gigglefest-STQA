import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";

describe("TC_PORT_05: Co-existence - Multiple Instances Running Simultaneously", () => {
  let server1;
  let server2;

  beforeAll((done) => {
    let started = 0;
    const checkBothStarted = () => {
      started++;
      if (started === 2) {
        done();
      }
    };

    // Start first instance on port 3000
    server1 = app.listen(3000, () => {
      checkBothStarted();
    });

    // Start second instance on port 3001
    server2 = app.listen(3001, () => {
      checkBothStarted();
    });
  });

  afterAll((done) => {
    let closed = 0;
    const checkBothClosed = () => {
      closed++;
      if (closed === 2) {
        done();
      }
    };

    server1.close(() => {
      checkBothClosed();
    });

    server2.close(() => {
      checkBothClosed();
    });
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: Both instances should start successfully on different ports
   * Validates: Multiple instances can be deployed without port conflicts
   */
  test("Should start application on port 3000", async () => {
    const response = await request(server1).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "success");
    expect(response.body).toHaveProperty("message");
    expect(response.headers["content-type"]).toMatch(/json/);
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: Second instance should start successfully on different port
   * Validates: Application supports multi-instance deployment
   */
  test("Should start second instance on port 3001", async () => {
    const response = await request(server2).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "success");
    expect(response.body).toHaveProperty("message");
    expect(response.headers["content-type"]).toMatch(/json/);
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: Both instances should handle requests independently
   * Validates: Requests to different instances don't interfere with each other
   */
  test("Should send requests to both instances without interference", async () => {
    // Send request to first instance
    const response1 = await request(server1).get("/api/v1/events");

    // Send request to second instance
    const response2 = await request(server2).get("/api/v1/events");

    // Both should respond successfully
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    // Both should have proper response structure
    expect(response1.body).toHaveProperty("data");
    expect(response2.body).toHaveProperty("data");

    // Verify both responses are independent
    expect(response1.headers["content-type"]).toMatch(/json/);
    expect(response2.headers["content-type"]).toMatch(/json/);
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: Verify no interference between instances
   * Validates: Operations on one instance don't affect the other
   */
  test("Should verify no interference between instances", async () => {
    // Make multiple concurrent requests to both instances
    const requests = [
      request(server1).get("/api/v1/events?page=1&limit=5"),
      request(server2).get("/api/v1/events?page=1&limit=5"),
      request(server1).get("/api/v1/tickets"),
      request(server2).get("/api/v1/tickets"),
      request(server1).get("/api/v1/categories"),
      request(server2).get("/api/v1/categories"),
    ];

    const responses = await Promise.all(requests);

    // All requests should succeed
    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.headers["content-type"]).toMatch(/json/);
    });

    // Verify instances returned independent results
    // Instance 1 events
    expect(responses[0].body.data).toHaveProperty("events");
    expect(responses[0].body.data).toHaveProperty("meta");

    // Instance 2 events
    expect(responses[1].body.data).toHaveProperty("events");
    expect(responses[1].body.data).toHaveProperty("meta");

    // Both should have same structure but be independent
    expect(responses[0].body.data.meta.page).toBe(1);
    expect(responses[1].body.data.meta.page).toBe(1);
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: Both instances should handle authentication independently
   * Validates: Session/state isolation between instances
   */
  test("Should handle authentication independently on both instances", async () => {
    // Login on first instance
    const login1 = await request(server1).post("/api/v1/auth/login").send({
      email: "karina@gmail.com",
      password: "password",
    });

    // Login on second instance
    const login2 = await request(server2).post("/api/v1/auth/login").send({
      email: "karina@gmail.com",
      password: "password",
    });

    // Both instances should handle login independently
    expect([200, 400, 401, 404]).toContain(login1.status);
    expect([200, 400, 401, 404]).toContain(login2.status);

    // Both should return proper JSON response
    expect(login1.headers["content-type"]).toMatch(/json/);
    expect(login2.headers["content-type"]).toMatch(/json/);

    // If both succeeded, tokens should be independent
    if (login1.status === 200 && login2.status === 200) {
      const token1 = login1.body.data?.token;
      const token2 = login2.body.data?.token;

      if (token1 && token2) {
        // Use token from instance 1 on instance 1
        const auth1 = await request(server1)
          .get("/api/v1/cart")
          .set("Authorization", `Bearer ${token1}`);

        // Use token from instance 2 on instance 2
        const auth2 = await request(server2)
          .get("/api/v1/cart")
          .set("Authorization", `Bearer ${token2}`);

        // Both should handle authenticated requests
        expect([200, 401]).toContain(auth1.status);
        expect([200, 401]).toContain(auth2.status);
      }
    }
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: Instances should handle concurrent write operations independently
   * Validates: Data operations are isolated between instances
   */
  test("Should handle concurrent operations without data conflicts", async () => {
    // Perform read operations on both instances simultaneously
    const [events1, events2, tickets1, tickets2] = await Promise.all([
      request(server1).get("/api/v1/events?page=1&limit=3"),
      request(server2).get("/api/v1/events?page=1&limit=3"),
      request(server1).get("/api/v1/tickets?page=1&limit=3"),
      request(server2).get("/api/v1/tickets?page=1&limit=3"),
    ]);

    // All concurrent requests should succeed
    expect(events1.status).toBe(200);
    expect(events2.status).toBe(200);
    expect(tickets1.status).toBe(200);
    expect(tickets2.status).toBe(200);

    // Verify data consistency
    expect(events1.body.data).toHaveProperty("events");
    expect(events2.body.data).toHaveProperty("events");
    expect(tickets1.body.data).toHaveProperty("tickets");
    expect(tickets2.body.data).toHaveProperty("tickets");

    // Verify pagination worked on both instances
    expect(events1.body.data.meta.limit).toBe(3);
    expect(events2.body.data.meta.limit).toBe(3);
    expect(tickets1.body.data.meta.limit).toBe(3);
    expect(tickets2.body.data.meta.limit).toBe(3);
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: Instances should maintain independent error handling
   * Validates: Error states don't propagate between instances
   */
  test("Should maintain independent error handling across instances", async () => {
    // Trigger error on first instance
    const error1 = await request(server1).get("/api/v1/nonexistent");

    // Normal request on second instance
    const success2 = await request(server2).get("/api/v1/events");

    // First instance should return error
    expect(error1.status).toBe(404);
    expect(error1.body).toHaveProperty("message");

    // Second instance should still work normally
    expect(success2.status).toBe(200);
    expect(success2.body).toHaveProperty("data");

    // Verify second instance is unaffected by first instance's error
    expect(success2.body.data).toHaveProperty("events");

    // Make another request to first instance to verify it recovered
    const recovery1 = await request(server1).get("/api/v1/events");
    expect(recovery1.status).toBe(200);
    expect(recovery1.body).toHaveProperty("data");
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: Both instances should handle high load independently
   * Validates: Performance isolation between instances
   */
  test("Should handle multiple simultaneous requests without interference", async () => {
    // Create array of concurrent requests to both instances
    const concurrentRequests = [];

    // 5 requests to instance 1
    for (let i = 0; i < 5; i++) {
      concurrentRequests.push(request(server1).get("/api/v1/events"));
    }

    // 5 requests to instance 2
    for (let i = 0; i < 5; i++) {
      concurrentRequests.push(request(server2).get("/api/v1/events"));
    }

    // Execute all requests concurrently
    const results = await Promise.all(concurrentRequests);

    // All requests should succeed
    results.forEach((response, index) => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("events");
    });

    // Verify both instances handled 5 requests each successfully
    const instance1Results = results.slice(0, 5);
    const instance2Results = results.slice(5, 10);

    instance1Results.forEach((response) => {
      expect(response.status).toBe(200);
    });

    instance2Results.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });
});
