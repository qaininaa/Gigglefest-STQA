import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  validateRequest,
  validateZodRequest,
} from "../../middlewares/validation.middleware.js";
import { z } from "zod";

describe("Validation Middleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Mock request object
    mockReq = {
      body: {},
      params: {},
      query: {},
      headers: {},
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock next function
    mockNext = jest.fn();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("validateRequest (Joi/general validation)", () => {
    describe("function structure", () => {
      it("should be defined", () => {
        expect(validateRequest).toBeDefined();
      });

      it("should be a function", () => {
        expect(typeof validateRequest).toBe("function");
      });

      it("should return a middleware function", () => {
        const mockSchema = { validate: jest.fn() };
        const middleware = validateRequest(mockSchema);
        expect(typeof middleware).toBe("function");
      });

      it("should return middleware with 3 parameters (req, res, next)", () => {
        const mockSchema = { validate: jest.fn() };
        const middleware = validateRequest(mockSchema);
        expect(middleware.length).toBe(3);
      });
    });

    describe("successful validation", () => {
      it("should call next() when validation passes", () => {
        const mockSchema = {
          validate: jest.fn().mockReturnValue({ error: null }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
      });

      it("should not call res.status or res.json when validation passes", () => {
        const mockSchema = {
          validate: jest.fn().mockReturnValue({ error: null }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).not.toHaveBeenCalled();
        expect(mockRes.json).not.toHaveBeenCalled();
      });

      it("should validate req.body", () => {
        mockReq.body = { name: "Test", email: "test@example.com" };
        const mockSchema = {
          validate: jest.fn().mockReturnValue({ error: null }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockSchema.validate).toHaveBeenCalledWith(mockReq.body, {
          abortEarly: false,
        });
      });

      it("should pass validation options with abortEarly: false", () => {
        const mockSchema = {
          validate: jest.fn().mockReturnValue({ error: null }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockSchema.validate).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ abortEarly: false })
        );
      });
    });

    describe("validation errors", () => {
      it("should return error response when validation fails", () => {
        const mockSchema = {
          validate: jest.fn().mockReturnValue({
            error: {
              details: [{ message: "Name is required" }],
            },
          }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalled();
      });

      it("should not call next() when validation fails", () => {
        const mockSchema = {
          validate: jest.fn().mockReturnValue({
            error: {
              details: [{ message: "Name is required" }],
            },
          }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should format single error message", () => {
        const mockSchema = {
          validate: jest.fn().mockReturnValue({
            error: {
              details: [{ message: "Email is invalid" }],
            },
          }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: "error",
          message: "Email is invalid",
        });
      });

      it("should format multiple error messages with comma separation", () => {
        const mockSchema = {
          validate: jest.fn().mockReturnValue({
            error: {
              details: [
                { message: "Name is required" },
                { message: "Email is invalid" },
                { message: "Age must be a number" },
              ],
            },
          }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: "error",
          message: "Name is required, Email is invalid, Age must be a number",
        });
      });

      it("should map all error details to messages", () => {
        const errorDetails = [
          { message: "Error 1" },
          { message: "Error 2" },
          { message: "Error 3" },
          { message: "Error 4" },
        ];

        const mockSchema = {
          validate: jest.fn().mockReturnValue({
            error: { details: errorDetails },
          }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith({
          status: "error",
          message: "Error 1, Error 2, Error 3, Error 4",
        });
      });

      it("should return 400 status code for validation errors", () => {
        const mockSchema = {
          validate: jest.fn().mockReturnValue({
            error: {
              details: [{ message: "Validation failed" }],
            },
          }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });

      it("should handle empty error details array", () => {
        const mockSchema = {
          validate: jest.fn().mockReturnValue({
            error: { details: [] },
          }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: "error",
          message: "",
        });
      });
    });

    describe("error response format", () => {
      it("should use errorResponse utility for consistent format", () => {
        const mockSchema = {
          validate: jest.fn().mockReturnValue({
            error: {
              details: [{ message: "Test error" }],
            },
          }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "error",
            message: expect.any(String),
          })
        );
      });

      it("should call res.status before res.json", () => {
        const mockSchema = {
          validate: jest.fn().mockReturnValue({
            error: {
              details: [{ message: "Error" }],
            },
          }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status.mock.invocationCallOrder[0]).toBeLessThan(
          mockRes.json.mock.invocationCallOrder[0]
        );
      });
    });

    describe("edge cases", () => {
      it("should handle validation with complex body data", () => {
        mockReq.body = {
          user: {
            name: "John",
            email: "john@example.com",
            address: {
              street: "123 Main St",
              city: "New York",
            },
          },
          items: [1, 2, 3],
        };

        const mockSchema = {
          validate: jest.fn().mockReturnValue({ error: null }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockSchema.validate).toHaveBeenCalledWith(mockReq.body, {
          abortEarly: false,
        });
        expect(mockNext).toHaveBeenCalled();
      });

      it("should handle empty req.body", () => {
        mockReq.body = {};
        const mockSchema = {
          validate: jest.fn().mockReturnValue({ error: null }),
        };

        const middleware = validateRequest(mockSchema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockSchema.validate).toHaveBeenCalledWith(
          {},
          {
            abortEarly: false,
          }
        );
      });
    });
  });

  describe("validateZodRequest (Zod validation)", () => {
    describe("function structure", () => {
      it("should be defined", () => {
        expect(validateZodRequest).toBeDefined();
      });

      it("should be a function", () => {
        expect(typeof validateZodRequest).toBe("function");
      });

      it("should return a middleware function", () => {
        const middleware = validateZodRequest({});
        expect(typeof middleware).toBe("function");
      });

      it("should return middleware with 3 parameters (req, res, next)", () => {
        const middleware = validateZodRequest({});
        expect(middleware.length).toBe(3);
      });

      it("should return an async middleware function", () => {
        const middleware = validateZodRequest({});
        const result = middleware(mockReq, mockRes, mockNext);
        expect(result).toBeInstanceOf(Promise);
      });
    });

    describe("successful validation - body", () => {
      it("should call next() when body validation passes", async () => {
        const bodySchema = z.object({
          name: z.string(),
          email: z.string().email(),
        });

        mockReq.body = {
          name: "John Doe",
          email: "john@example.com",
        };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
      });

      it("should parse and set req.body when validation passes", async () => {
        const bodySchema = z.object({
          name: z.string(),
          age: z.number(),
        });

        mockReq.body = {
          name: "John",
          age: 30,
        };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockReq.body).toEqual({
          name: "John",
          age: 30,
        });
        expect(mockNext).toHaveBeenCalled();
      });

      it("should not call res.status or res.json when body validation passes", async () => {
        const bodySchema = z.object({
          title: z.string(),
        });

        mockReq.body = { title: "Test" };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).not.toHaveBeenCalled();
        expect(mockRes.json).not.toHaveBeenCalled();
      });
    });

    describe("successful validation - params", () => {
      it("should call next() when params validation passes", async () => {
        const paramsSchema = z.object({
          id: z.string(),
        });

        mockReq.params = { id: "123" };

        const middleware = validateZodRequest({ params: paramsSchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it("should parse and set req.params when validation passes", async () => {
        const paramsSchema = z.object({
          id: z.string(),
          slug: z.string(),
        });

        mockReq.params = {
          id: "456",
          slug: "test-slug",
        };

        const middleware = validateZodRequest({ params: paramsSchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockReq.params).toEqual({
          id: "456",
          slug: "test-slug",
        });
      });
    });

    describe("successful validation - query", () => {
      it("should call next() when query validation passes", async () => {
        const querySchema = z.object({
          page: z.string(),
          limit: z.string(),
        });

        mockReq.query = { page: "1", limit: "10" };

        const middleware = validateZodRequest({ query: querySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it("should parse and set req.query when validation passes", async () => {
        const querySchema = z.object({
          search: z.string(),
          filter: z.string().optional(),
        });

        mockReq.query = {
          search: "test",
          filter: "active",
        };

        const middleware = validateZodRequest({ query: querySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockReq.query).toEqual({
          search: "test",
          filter: "active",
        });
      });
    });

    describe("successful validation - multiple schemas", () => {
      it("should validate params, query, and body together", async () => {
        const schemas = {
          params: z.object({ id: z.string() }),
          query: z.object({ sort: z.string() }),
          body: z.object({ name: z.string() }),
        };

        mockReq.params = { id: "123" };
        mockReq.query = { sort: "asc" };
        mockReq.body = { name: "Test" };

        const middleware = validateZodRequest(schemas);
        await middleware(mockReq, mockRes, mockNext);

        expect(mockReq.params).toEqual({ id: "123" });
        expect(mockReq.query).toEqual({ sort: "asc" });
        expect(mockReq.body).toEqual({ name: "Test" });
        expect(mockNext).toHaveBeenCalled();
      });

      it("should validate only provided schemas", async () => {
        const schemas = {
          body: z.object({ title: z.string() }),
        };

        mockReq.body = { title: "Test" };
        mockReq.params = { id: "123" }; // Not validated
        mockReq.query = { page: "1" }; // Not validated

        const middleware = validateZodRequest(schemas);
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe("validation errors - body", () => {
      it("should return error response when body validation fails", async () => {
        const bodySchema = z.object({
          email: z.string().email(),
        });

        mockReq.body = { email: "invalid-email" };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalled();
      });

      it("should not call next() when body validation fails", async () => {
        const bodySchema = z.object({
          name: z.string().min(3),
        });

        mockReq.body = { name: "ab" };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should format Zod error messages", async () => {
        const bodySchema = z.object({
          age: z.number(),
        });

        mockReq.body = { age: "not a number" };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "error",
            message: expect.any(String),
          })
        );
      });

      it("should join multiple Zod error messages with comma", async () => {
        const bodySchema = z.object({
          name: z.string().min(3),
          email: z.string().email(),
          age: z.number().min(18),
        });

        mockReq.body = {
          name: "ab",
          email: "invalid",
          age: 15,
        };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        const jsonCall = mockRes.json.mock.calls[0][0];
        expect(jsonCall.message).toContain(",");
      });
    });

    describe("validation errors - params", () => {
      it("should return error response when params validation fails", async () => {
        const paramsSchema = z.object({
          id: z.string().uuid(),
        });

        mockReq.params = { id: "not-a-uuid" };

        const middleware = validateZodRequest({ params: paramsSchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe("validation errors - query", () => {
      it("should return error response when query validation fails", async () => {
        const querySchema = z.object({
          page: z.string().regex(/^\d+$/),
        });

        mockReq.query = { page: "invalid" };

        const middleware = validateZodRequest({ query: querySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe("error response format", () => {
      it("should return 400 status code for validation errors", async () => {
        const bodySchema = z.object({
          name: z.string(),
        });

        mockReq.body = { name: 123 };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });

      it("should use errorResponse format with status and message", async () => {
        const bodySchema = z.object({
          email: z.string().email(),
        });

        mockReq.body = { email: "invalid" };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith({
          status: "error",
          message: expect.any(String),
        });
      });

      it("should call res.status before res.json on error", async () => {
        const bodySchema = z.object({
          name: z.string(),
        });

        mockReq.body = {};

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status.mock.invocationCallOrder[0]).toBeLessThan(
          mockRes.json.mock.invocationCallOrder[0]
        );
      });
    });

    describe("error handling - errors without error.errors property", () => {
      it("should handle generic errors with fallback message", async () => {
        const throwingSchema = {
          parseAsync: jest.fn().mockRejectedValue(new Error("Generic error")),
        };

        const middleware = validateZodRequest({ body: throwingSchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: "error",
          message: "Validation failed",
        });
      });

      it("should not call next() on generic error", async () => {
        const throwingSchema = {
          parseAsync: jest.fn().mockRejectedValue(new Error("Generic error")),
        };

        const middleware = validateZodRequest({ body: throwingSchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should handle errors without errors property", async () => {
        const customError = new Error("Custom validation error");
        const throwingSchema = {
          parseAsync: jest.fn().mockRejectedValue(customError),
        };

        const middleware = validateZodRequest({ body: throwingSchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith({
          status: "error",
          message: "Validation failed",
        });
      });
    });

    describe("data transformation", () => {
      it("should transform data with Zod transform", async () => {
        const bodySchema = z.object({
          name: z.string().transform((val) => val.toUpperCase()),
        });

        mockReq.body = { name: "john" };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockReq.body.name).toBe("JOHN");
        expect(mockNext).toHaveBeenCalled();
      });

      it("should coerce types with Zod coercion", async () => {
        const querySchema = z.object({
          page: z.coerce.number(),
          limit: z.coerce.number(),
        });

        mockReq.query = { page: "5", limit: "20" };

        const middleware = validateZodRequest({ query: querySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockReq.query.page).toBe(5);
        expect(mockReq.query.limit).toBe(20);
      });

      it("should apply default values", async () => {
        const bodySchema = z.object({
          name: z.string(),
          role: z.string().default("user"),
        });

        mockReq.body = { name: "John" };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockReq.body.role).toBe("user");
      });
    });

    describe("async validation", () => {
      it("should handle async parseAsync correctly", async () => {
        const bodySchema = z.object({
          username: z.string(),
        });

        mockReq.body = { username: "testuser" };

        const middleware = validateZodRequest({ body: bodySchema });
        const result = await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it("should wait for all schemas to validate", async () => {
        const schemas = {
          params: z.object({ id: z.string() }),
          query: z.object({ filter: z.string() }),
          body: z.object({ data: z.string() }),
        };

        mockReq.params = { id: "1" };
        mockReq.query = { filter: "active" };
        mockReq.body = { data: "test" };

        const middleware = validateZodRequest(schemas);
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe("edge cases", () => {
      it("should handle empty schemas object", async () => {
        const middleware = validateZodRequest({});
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it("should skip validation for undefined schema properties", async () => {
        const schemas = {
          body: z.object({ name: z.string() }),
          params: undefined,
          query: undefined,
        };

        mockReq.body = { name: "Test" };

        const middleware = validateZodRequest(schemas);
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it("should handle complex nested objects", async () => {
        const bodySchema = z.object({
          user: z.object({
            profile: z.object({
              name: z.string(),
              age: z.number(),
            }),
          }),
        });

        mockReq.body = {
          user: {
            profile: {
              name: "John",
              age: 30,
            },
          },
        };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it("should handle arrays in validation", async () => {
        const bodySchema = z.object({
          tags: z.array(z.string()),
        });

        mockReq.body = {
          tags: ["tag1", "tag2", "tag3"],
        };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it("should handle optional fields", async () => {
        const bodySchema = z.object({
          name: z.string(),
          description: z.string().optional(),
        });

        mockReq.body = { name: "Test" };

        const middleware = validateZodRequest({ body: bodySchema });
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe("validation order", () => {
      it("should validate params before query before body", async () => {
        const callOrder = [];

        const schemas = {
          params: {
            parseAsync: jest.fn().mockImplementation(async (data) => {
              callOrder.push("params");
              return data;
            }),
          },
          query: {
            parseAsync: jest.fn().mockImplementation(async (data) => {
              callOrder.push("query");
              return data;
            }),
          },
          body: {
            parseAsync: jest.fn().mockImplementation(async (data) => {
              callOrder.push("body");
              return data;
            }),
          },
        };

        mockReq.params = { id: "1" };
        mockReq.query = { page: "1" };
        mockReq.body = { name: "Test" };

        const middleware = validateZodRequest(schemas);
        await middleware(mockReq, mockRes, mockNext);

        expect(callOrder).toEqual(["params", "query", "body"]);
      });

      it("should stop validation on first error", async () => {
        const paramsSchema = z.object({
          id: z.string().uuid(),
        });

        const bodySchema = {
          parseAsync: jest.fn().mockResolvedValue({ name: "Test" }),
        };

        mockReq.params = { id: "invalid-uuid" };
        mockReq.body = { name: "Test" };

        const middleware = validateZodRequest({
          params: paramsSchema,
          body: bodySchema,
        });
        await middleware(mockReq, mockRes, mockNext);

        // Body schema should not be called because params validation failed
        expect(bodySchema.parseAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe("middleware comparison", () => {
    it("both middlewares should return 400 status on error", async () => {
      // validateRequest (Joi)
      const joiSchema = {
        validate: jest.fn().mockReturnValue({
          error: { details: [{ message: "Error" }] },
        }),
      };
      const joiMiddleware = validateRequest(joiSchema);
      joiMiddleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);

      // Reset mocks
      mockRes.status.mockClear();
      mockRes.json.mockClear();

      // validateZodRequest
      const zodSchema = z.object({ name: z.string() });
      mockReq.body = { name: 123 };
      const zodMiddleware = validateZodRequest({ body: zodSchema });
      await zodMiddleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("both middlewares should call next() on success", async () => {
      mockNext.mockClear();

      // validateRequest (Joi)
      const joiSchema = {
        validate: jest.fn().mockReturnValue({ error: null }),
      };
      const joiMiddleware = validateRequest(joiSchema);
      joiMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      mockNext.mockClear();

      // validateZodRequest
      const zodSchema = z.object({ name: z.string() });
      mockReq.body = { name: "Test" };
      const zodMiddleware = validateZodRequest({ body: zodSchema });
      await zodMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
