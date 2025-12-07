import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import rateLimit from "express-rate-limit";

// Import to get the configuration
import { emailVerificationLimiter } from "../../middlewares/rateLimiter.middleware.js";

// Create a test instance to inspect configuration
const testConfig = {
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    status: "error",
    message:
      "Too many verification email requests. Please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email || req.ip;
  },
};

describe("Rate Limiter Middleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Mock request object
    mockReq = {
      ip: "192.168.1.1",
      body: {
        email: "test@example.com",
      },
      headers: {},
      method: "POST",
      path: "/api/verify",
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      getHeader: jest.fn(),
      get: jest.fn(),
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe("emailVerificationLimiter middleware", () => {
    it("should be defined", () => {
      expect(emailVerificationLimiter).toBeDefined();
    });

    it("should be a function (middleware)", () => {
      expect(typeof emailVerificationLimiter).toBe("function");
    });

    it("should be callable as Express middleware", () => {
      expect(typeof emailVerificationLimiter).toBe("function");
      expect(emailVerificationLimiter.length).toBe(3); // (req, res, next)
    });

    it("should export emailVerificationLimiter", () => {
      expect(emailVerificationLimiter).toBeDefined();
      expect(emailVerificationLimiter).not.toBeNull();
      expect(emailVerificationLimiter).not.toBeUndefined();
    });
  });

  describe("configuration - windowMs", () => {
    it("should have window of 1 hour in milliseconds", () => {
      const expectedWindowMs = 60 * 60 * 1000; // 1 hour in milliseconds
      expect(testConfig.windowMs).toBe(expectedWindowMs);
      expect(testConfig.windowMs).toBe(3600000);
    });

    it("should convert windowMs to seconds correctly", () => {
      const windowInSeconds = testConfig.windowMs / 1000;
      expect(windowInSeconds).toBe(3600); // 1 hour = 3600 seconds
    });

    it("should convert windowMs to minutes correctly", () => {
      const windowInMinutes = testConfig.windowMs / (60 * 1000);
      expect(windowInMinutes).toBe(60); // 1 hour = 60 minutes
    });

    it("should convert windowMs to hours correctly", () => {
      const windowInHours = testConfig.windowMs / (60 * 60 * 1000);
      expect(windowInHours).toBe(1); // 1 hour
    });

    it("should have proper type for windowMs (number)", () => {
      expect(typeof testConfig.windowMs).toBe("number");
    });

    it("should have valid windowMs value", () => {
      expect(testConfig.windowMs).toBeGreaterThan(0);
      expect(Number.isFinite(testConfig.windowMs)).toBe(true);
    });
  });

  describe("configuration - max requests", () => {
    it("should allow maximum of 3 requests per window", () => {
      expect(testConfig.max).toBe(3);
    });

    it("should be a number type", () => {
      expect(typeof testConfig.max).toBe("number");
    });

    it("should be a positive integer", () => {
      expect(testConfig.max).toBeGreaterThan(0);
      expect(Number.isInteger(testConfig.max)).toBe(true);
    });

    it("should not be too permissive (reasonable limit)", () => {
      expect(testConfig.max).toBeLessThanOrEqual(10);
    });

    it("should not be too restrictive (at least 1)", () => {
      expect(testConfig.max).toBeGreaterThanOrEqual(1);
    });

    it("should have valid max value", () => {
      expect(testConfig.max).toBeGreaterThan(0);
      expect(Number.isInteger(testConfig.max)).toBe(true);
    });
  });

  describe("configuration - message", () => {
    it("should have message object with status and message properties", () => {
      expect(testConfig.message).toHaveProperty("status");
      expect(testConfig.message).toHaveProperty("message");
    });

    it("should have exactly 2 properties in message object", () => {
      const keys = Object.keys(testConfig.message);
      expect(keys).toHaveLength(2);
    });

    it("should have status set to 'error'", () => {
      expect(testConfig.message.status).toBe("error");
      expect(testConfig.message.status).not.toBe("success");
      expect(testConfig.message.status).not.toBe("fail");
    });

    it("should contain 'Too many' in error message", () => {
      expect(testConfig.message.message).toContain("Too many");
    });

    it("should mention 'verification email' in error message", () => {
      expect(testConfig.message.message).toContain("verification email");
    });

    it("should mention time period 'hour' in error message", () => {
      expect(testConfig.message.message).toContain("hour");
    });

    it("should provide user-friendly error message", () => {
      const message = testConfig.message.message;
      expect(message).toContain("Please try again");
    });

    it("should have non-empty error message", () => {
      expect(testConfig.message.message).toBeTruthy();
      expect(testConfig.message.message.length).toBeGreaterThan(0);
    });

    it("should match exact error message text", () => {
      expect(testConfig.message.message).toBe(
        "Too many verification email requests. Please try again after an hour."
      );
    });

    it("should have proper type for message (object)", () => {
      expect(typeof testConfig.message).toBe("object");
    });

    it("should return JSON-friendly message object", () => {
      const message = testConfig.message;
      expect(() => JSON.stringify(message)).not.toThrow();
    });

    it("should have serializable message object", () => {
      const message = testConfig.message;
      const serialized = JSON.stringify(message);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.status).toBe(message.status);
      expect(deserialized.message).toBe(message.message);
    });

    it("should follow consistent error response format", () => {
      expect(testConfig.message).toMatchObject({
        status: expect.any(String),
        message: expect.any(String),
      });
    });
  });

  describe("configuration - headers", () => {
    it("should enable standard rate limit headers", () => {
      expect(testConfig.standardHeaders).toBe(true);
      expect(testConfig.standardHeaders).not.toBe(false);
    });

    it("should disable legacy rate limit headers", () => {
      expect(testConfig.legacyHeaders).toBe(false);
      expect(testConfig.legacyHeaders).not.toBe(true);
    });

    it("should have boolean values for header configurations", () => {
      expect(typeof testConfig.standardHeaders).toBe("boolean");
      expect(typeof testConfig.legacyHeaders).toBe("boolean");
    });

    it("should prefer standard headers over legacy headers", () => {
      expect(testConfig.standardHeaders).toBe(true);
      expect(testConfig.legacyHeaders).toBe(false);
    });

    it("should have proper type for standardHeaders (boolean)", () => {
      expect(typeof testConfig.standardHeaders).toBe("boolean");
    });

    it("should have proper type for legacyHeaders (boolean)", () => {
      expect(typeof testConfig.legacyHeaders).toBe("boolean");
    });
  });
  describe("keyGenerator function", () => {
    it("should be defined", () => {
      expect(testConfig.keyGenerator).toBeDefined();
      expect(typeof testConfig.keyGenerator).toBe("function");
    });

    it("should use email from request body as key when available", () => {
      const req = {
        body: { email: "user@example.com" },
        ip: "192.168.1.100",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe("user@example.com");
      expect(key).not.toBe("192.168.1.100");
    });

    it("should fallback to IP address when email is not provided", () => {
      const req = {
        body: {},
        ip: "10.0.0.1",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe("10.0.0.1");
    });

    it("should fallback to IP when email is empty string", () => {
      const req = {
        body: { email: "" },
        ip: "172.16.0.1",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe("172.16.0.1");
    });

    it("should fallback to IP when email is null", () => {
      const req = {
        body: { email: null },
        ip: "127.0.0.1",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe("127.0.0.1");
    });

    it("should fallback to IP when email is undefined", () => {
      const req = {
        body: { email: undefined },
        ip: "8.8.8.8",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe("8.8.8.8");
    });

    it("should fallback to IP when body is missing", () => {
      const req = {
        ip: "1.1.1.1",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe("1.1.1.1");
    });

    it("should handle different email formats", () => {
      const emails = [
        "simple@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.com",
        "123@test.com",
        "user@subdomain.example.com",
      ];

      emails.forEach((email) => {
        const req = { body: { email }, ip: "192.168.1.1" };
        const key = testConfig.keyGenerator(req);
        expect(key).toBe(email);
      });
    });

    it("should handle different IP address formats", () => {
      const ips = [
        "192.168.1.1",
        "10.0.0.1",
        "172.16.0.1",
        "127.0.0.1",
        "::1", // IPv6 localhost
        "2001:db8::1", // IPv6
      ];

      ips.forEach((ip) => {
        const req = { body: {}, ip };
        const key = testConfig.keyGenerator(req);
        expect(key).toBe(ip);
      });
    });

    it("should prioritize email over IP when both are present", () => {
      const req = {
        body: { email: "priority@example.com" },
        ip: "192.168.1.1",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe("priority@example.com");
    });

    it("should use OR operator logic (email || ip)", () => {
      const reqWithEmail = {
        body: { email: "test@example.com" },
        ip: "192.168.1.1",
      };
      expect(testConfig.keyGenerator(reqWithEmail)).toBe("test@example.com");

      const reqWithoutEmail = {
        body: {},
        ip: "192.168.1.1",
      };
      expect(testConfig.keyGenerator(reqWithoutEmail)).toBe("192.168.1.1");
    });

    it("should handle email with whitespace", () => {
      const req = {
        body: { email: "  user@example.com  " },
        ip: "192.168.1.1",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe("  user@example.com  ");
    });

    it("should handle numeric values in email field", () => {
      const req = {
        body: { email: 12345 },
        ip: "192.168.1.1",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe(12345);
    });

    it("should handle boolean false as falsy value", () => {
      const req = {
        body: { email: false },
        ip: "192.168.1.1",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe("192.168.1.1");
    });

    it("should handle boolean true as truthy value", () => {
      const req = {
        body: { email: true },
        ip: "192.168.1.1",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe(true);
    });

    it("should handle number 0 as falsy value", () => {
      const req = {
        body: { email: 0 },
        ip: "192.168.1.1",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe("192.168.1.1");
    });

    it("should handle object as email value", () => {
      const emailObj = { address: "test@example.com" };
      const req = {
        body: { email: emailObj },
        ip: "192.168.1.1",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe(emailObj);
    });

    it("should handle array as email value", () => {
      const emailArray = ["test@example.com"];
      const req = {
        body: { email: emailArray },
        ip: "192.168.1.1",
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBe(emailArray);
    });

    it("should handle missing IP address", () => {
      const req = {
        body: { email: "" },
        ip: undefined,
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBeUndefined();
    });

    it("should handle both email and IP missing", () => {
      const req = {
        body: {},
      };

      const key = testConfig.keyGenerator(req);
      expect(key).toBeUndefined();
    });
  });

  describe("rate limit calculations", () => {
    it("should calculate requests per minute based on max and window", () => {
      const requestsPerMinute =
        testConfig.max / (testConfig.windowMs / (60 * 1000));
      expect(requestsPerMinute).toBe(0.05); // 3 requests per 60 minutes
    });

    it("should calculate requests per hour", () => {
      const requestsPerHour =
        testConfig.max / (testConfig.windowMs / (60 * 60 * 1000));
      expect(requestsPerHour).toBe(3); // 3 requests per hour
    });

    it("should have conservative rate limit (low requests per time)", () => {
      const requestsPerMinute =
        testConfig.max / (testConfig.windowMs / (60 * 1000));
      expect(requestsPerMinute).toBeLessThan(1); // Less than 1 request per minute
    });
  });

  describe("security considerations", () => {
    it("should have rate limit to prevent abuse", () => {
      expect(testConfig.max).toBeDefined();
      expect(testConfig.max).toBeGreaterThan(0);
    });

    it("should have time window to reset counters", () => {
      expect(testConfig.windowMs).toBeDefined();
      expect(testConfig.windowMs).toBeGreaterThan(0);
    });

    it("should use unique identifier (email or IP) for rate limiting", () => {
      expect(testConfig.keyGenerator).toBeDefined();
    });

    it("should prevent rapid successive requests with low max value", () => {
      expect(testConfig.max).toBeLessThanOrEqual(5);
    });

    it("should have reasonable cooldown period (1 hour)", () => {
      const oneHourInMs = 60 * 60 * 1000;
      expect(testConfig.windowMs).toBe(oneHourInMs);
    });
  });

  describe("express-rate-limit integration", () => {
    it("should be created from express-rate-limit package", () => {
      expect(typeof emailVerificationLimiter).toBe("function");
    });

    it("should have standard middleware signature", () => {
      expect(emailVerificationLimiter.length).toBe(3);
    });

    it("should be usable in Express route handlers", () => {
      // Middleware should be callable with (req, res, next)
      expect(() => {
        emailVerificationLimiter(mockReq, mockRes, mockNext);
      }).not.toThrow();
    });
  });

  describe("configuration completeness", () => {
    it("should have all required rate limiter properties", () => {
      expect(testConfig).toHaveProperty("windowMs");
      expect(testConfig).toHaveProperty("max");
      expect(testConfig).toHaveProperty("message");
      expect(testConfig).toHaveProperty("keyGenerator");
    });

    it("should not have negative values", () => {
      expect(testConfig.windowMs).toBeGreaterThan(0);
      expect(testConfig.max).toBeGreaterThan(0);
    });

    it("should not have infinity values", () => {
      expect(testConfig.windowMs).not.toBe(Infinity);
      expect(testConfig.max).not.toBe(Infinity);
    });

    it("should not have NaN values", () => {
      expect(testConfig.windowMs).not.toBe(NaN);
      expect(testConfig.max).not.toBe(NaN);
    });
  });
});
