import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "../../middlewares/error.middleware.js";

describe("Error Middleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let consoleErrorSpy;

  beforeEach(() => {
    // Mock request object
    mockReq = {
      method: "GET",
      path: "/test",
      url: "/test",
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock next function
    mockNext = jest.fn();

    // Spy on console.error
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  describe("errorMiddleware", () => {
    it("should call console.error with error stack", () => {
      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at TestFile.js:10:5";

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
    });

    it("should call res.status with 500 (default status)", () => {
      const error = new Error("Test error message");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should call res.json with error response structure", () => {
      const error = new Error("Test error message");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Test error message",
      });
    });

    it("should return the response object", () => {
      const error = new Error("Some error");

      const result = errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(result).toBe(mockRes);
    });

    it("should handle errors with empty messages", () => {
      const error = new Error("");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "",
      });
    });

    it("should handle errors with complex messages", () => {
      const complexMessage =
        "Database connection failed: Connection timeout after 30000ms";
      const error = new Error(complexMessage);

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: complexMessage,
      });
    });

    it("should handle errors with special characters in message", () => {
      const specialMessage = "Invalid JSON: Unexpected token '<' at position 0";
      const error = new Error(specialMessage);

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: specialMessage,
      });
    });

    it("should handle errors with multiline messages", () => {
      const multilineMessage = "Error occurred:\nLine 1\nLine 2\nLine 3";
      const error = new Error(multilineMessage);

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: multilineMessage,
      });
    });

    it("should not call next function", () => {
      const error = new Error("Test error");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle Error objects with undefined stack", () => {
      const error = new Error("Error without stack");
      delete error.stack;

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(undefined);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Error without stack",
      });
    });

    it("should handle Error objects with null stack", () => {
      const error = new Error("Error with null stack");
      error.stack = null;

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(null);
    });

    it("should handle custom error objects", () => {
      class CustomError extends Error {
        constructor(message, statusCode) {
          super(message);
          this.statusCode = statusCode;
          this.name = "CustomError";
        }
      }

      const customError = new CustomError("Custom error occurred", 400);

      errorMiddleware(customError, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(customError.stack);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Custom error occurred",
      });
    });

    it("should handle validation errors", () => {
      const validationError = new Error("Validation failed: email is required");

      errorMiddleware(validationError, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Validation failed: email is required",
      });
    });

    it("should handle database errors", () => {
      const dbError = new Error("Database query failed");

      errorMiddleware(dbError, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Database query failed",
      });
    });

    it("should handle authentication errors", () => {
      const authError = new Error("Invalid token");

      errorMiddleware(authError, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Invalid token",
      });
    });

    it("should work with different request methods", () => {
      const error = new Error("Error on POST");
      mockReq.method = "POST";

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Error on POST",
      });
    });

    it("should work with different request paths", () => {
      const error = new Error("Error on /api/users");
      mockReq.path = "/api/users";

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Error on /api/users",
      });
    });

    it("should handle errors with very long stack traces", () => {
      const error = new Error("Test error");
      error.stack = "Error: Test error\n" + "    at line\n".repeat(100);

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
    });

    it("should handle errors with numeric-like messages", () => {
      const error = new Error("404");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "404",
      });
    });

    it("should handle errors with JSON-like messages", () => {
      const jsonMessage = '{"error": "Something went wrong"}';
      const error = new Error(jsonMessage);

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: jsonMessage,
      });
    });

    it("should handle TypeError instances", () => {
      const typeError = new TypeError(
        "Cannot read property 'name' of undefined"
      );

      errorMiddleware(typeError, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Cannot read property 'name' of undefined",
      });
    });

    it("should handle ReferenceError instances", () => {
      const refError = new ReferenceError("variable is not defined");

      errorMiddleware(refError, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "variable is not defined",
      });
    });

    it("should handle SyntaxError instances", () => {
      const syntaxError = new SyntaxError("Unexpected token");

      errorMiddleware(syntaxError, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Unexpected token",
      });
    });

    it("should log to console before responding", () => {
      const error = new Error("Test order");
      const callOrder = [];

      consoleErrorSpy.mockImplementation(() => {
        callOrder.push("console");
      });

      mockRes.status.mockImplementation(() => {
        callOrder.push("response");
        return mockRes;
      });

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(callOrder).toEqual(["console", "response"]);
    });

    it("should handle errors with Unicode characters in message", () => {
      const unicodeMessage = "Error: 用户未找到 🚫";
      const error = new Error(unicodeMessage);

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: unicodeMessage,
      });
    });

    it("should chain status and json calls correctly", () => {
      const error = new Error("Chaining test");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      // Verify both methods were called
      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
      // Verify status was called first by checking the order
      const statusCall = mockRes.status.mock.invocationCallOrder[0];
      const jsonCall = mockRes.json.mock.invocationCallOrder[0];
      expect(statusCall).toBeLessThan(jsonCall);
    });

    it("should use default 500 status for all errors", () => {
      const errors = [
        new Error("Error 1"),
        new TypeError("Error 2"),
        new ReferenceError("Error 3"),
      ];

      errors.forEach((error) => {
        jest.clearAllMocks();
        errorMiddleware(error, mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(500);
      });
    });
  });

  describe("notFoundMiddleware", () => {
    it("should call res.status with 404", () => {
      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should call res.json with 'Route not found' message", () => {
      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Route not found",
      });
    });

    it("should return the response object", () => {
      const result = notFoundMiddleware(mockReq, mockRes);

      expect(result).toBe(mockRes);
    });

    it("should work with GET requests", () => {
      mockReq.method = "GET";
      mockReq.path = "/api/nonexistent";

      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Route not found",
      });
    });

    it("should work with POST requests", () => {
      mockReq.method = "POST";
      mockReq.path = "/api/unknown";

      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should work with PUT requests", () => {
      mockReq.method = "PUT";
      mockReq.path = "/api/missing";

      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should work with DELETE requests", () => {
      mockReq.method = "DELETE";
      mockReq.path = "/api/nothere";

      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should work with PATCH requests", () => {
      mockReq.method = "PATCH";
      mockReq.path = "/api/invalid";

      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle root path requests", () => {
      mockReq.path = "/";

      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle deeply nested paths", () => {
      mockReq.path = "/api/v1/users/123/posts/456/comments/789";

      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle paths with query parameters", () => {
      mockReq.url = "/api/users?page=1&limit=10";
      mockReq.path = "/api/users";

      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle paths with special characters", () => {
      mockReq.path = "/api/users/@john-doe";

      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle paths with trailing slashes", () => {
      mockReq.path = "/api/users/";

      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should not accept or use next parameter", () => {
      // notFoundMiddleware only takes req and res, not next
      const result = notFoundMiddleware(mockReq, mockRes);

      expect(result).toBe(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should always use 404 status code", () => {
      // Call multiple times to ensure consistent 404 status
      notFoundMiddleware(mockReq, mockRes);
      notFoundMiddleware(mockReq, mockRes);
      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledTimes(3);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should always use 'Route not found' message", () => {
      // Call with different request configurations
      mockReq.path = "/different/path";
      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Route not found",
      });

      jest.clearAllMocks();

      mockReq.path = "/another/path";
      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Route not found",
      });
    });

    it("should handle OPTIONS requests", () => {
      mockReq.method = "OPTIONS";
      mockReq.path = "/api/unknown";

      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should handle HEAD requests", () => {
      mockReq.method = "HEAD";
      mockReq.path = "/api/missing";

      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should chain status and json calls correctly", () => {
      notFoundMiddleware(mockReq, mockRes);

      // Verify both methods were called
      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
      // Verify status was called first by checking the order
      const statusCall = mockRes.status.mock.invocationCallOrder[0];
      const jsonCall = mockRes.json.mock.invocationCallOrder[0];
      expect(statusCall).toBeLessThan(jsonCall);
    });
  });

  describe("middleware integration", () => {
    it("should handle errorMiddleware and notFoundMiddleware independently", () => {
      // Test errorMiddleware
      const error = new Error("Server error");
      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Server error",
      });

      jest.clearAllMocks();

      // Test notFoundMiddleware
      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Route not found",
      });
    });

    it("should verify errorMiddleware uses default status 500", () => {
      const error = new Error("Internal error");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should verify notFoundMiddleware explicitly uses 404 status", () => {
      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should verify different status codes between middlewares", () => {
      const error = new Error("Error");
      errorMiddleware(error, mockReq, mockRes, mockNext);

      const errorStatus = mockRes.status.mock.calls[0][0];

      jest.clearAllMocks();

      notFoundMiddleware(mockReq, mockRes);

      const notFoundStatus = mockRes.status.mock.calls[0][0];

      expect(errorStatus).toBe(500);
      expect(notFoundStatus).toBe(404);
      expect(errorStatus).not.toBe(notFoundStatus);
    });
  });

  describe("edge cases", () => {
    it("should handle errorMiddleware with minimal error object", () => {
      const minimalError = { message: "Minimal error" };

      errorMiddleware(minimalError, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Minimal error",
      });
    });

    it("should handle errorMiddleware with error having additional properties", () => {
      const error = new Error("Error with extras");
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      error.details = { field: "email" };

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Error with extras",
      });
    });

    it("should handle notFoundMiddleware with minimal request object", () => {
      const minimalReq = {};

      notFoundMiddleware(minimalReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Route not found",
      });
    });

    it("should handle notFoundMiddleware with request having many properties", () => {
      const detailedReq = {
        method: "GET",
        path: "/api/test",
        url: "/api/test?query=1",
        headers: { "content-type": "application/json" },
        body: {},
        params: {},
        query: { query: "1" },
        ip: "127.0.0.1",
        protocol: "http",
      };

      notFoundMiddleware(detailedReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Route not found",
      });
    });

    it("should handle errorMiddleware when console.error throws", () => {
      consoleErrorSpy.mockRestore();
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {
        throw new Error("Console error failed");
      });

      const error = new Error("Original error");

      expect(() => {
        errorMiddleware(error, mockReq, mockRes, mockNext);
      }).toThrow("Console error failed");
    });

    it("should handle errorMiddleware with error message containing quotes", () => {
      const error = new Error("Error with \"quotes\" and 'apostrophes'");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Error with \"quotes\" and 'apostrophes'",
      });
    });

    it("should verify response structure includes status field", () => {
      const error = new Error("Test");
      errorMiddleware(error, mockReq, mockRes, mockNext);

      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty("status");
      expect(responseData.status).toBe("error");
    });

    it("should verify response structure includes message field", () => {
      const error = new Error("Test message");
      errorMiddleware(error, mockReq, mockRes, mockNext);

      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty("message");
      expect(responseData.message).toBe("Test message");
    });

    it("should handle multiple sequential error calls", () => {
      const error1 = new Error("Error 1");
      const error2 = new Error("Error 2");

      errorMiddleware(error1, mockReq, mockRes, mockNext);
      errorMiddleware(error2, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalledTimes(2);
    });

    it("should handle multiple sequential notFound calls", () => {
      notFoundMiddleware(mockReq, mockRes);
      notFoundMiddleware(mockReq, mockRes);
      notFoundMiddleware(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledTimes(3);
      expect(mockRes.json).toHaveBeenCalledTimes(3);
    });
  });

  describe("console logging behavior", () => {
    it("should log every error to console", () => {
      const error1 = new Error("Error 1");
      const error2 = new Error("Error 2");
      const error3 = new Error("Error 3");

      errorMiddleware(error1, mockReq, mockRes, mockNext);
      errorMiddleware(error2, mockReq, mockRes, mockNext);
      errorMiddleware(error3, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
    });

    it("should not log anything for notFoundMiddleware", () => {
      notFoundMiddleware(mockReq, mockRes);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should log full stack trace", () => {
      const error = new Error("Test");
      const fullStack = error.stack;

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(fullStack);
    });
  });
});
