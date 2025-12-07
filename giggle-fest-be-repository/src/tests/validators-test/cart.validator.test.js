import { describe, it, expect } from "@jest/globals";
import {
  addToCartSchema,
  updateCartSchema,
} from "../../validators/cart.validator.js";

describe("Cart Validator", () => {
  describe("addToCartSchema", () => {
    describe("ticketId field", () => {
      it("should accept valid string ticketId and transform to number", () => {
        const result = addToCartSchema.parse({
          ticketId: "123",
          quantity: 1,
        });

        expect(result.ticketId).toBe(123);
        expect(typeof result.ticketId).toBe("number");
      });

      it("should accept valid number ticketId", () => {
        const result = addToCartSchema.parse({
          ticketId: 456,
          quantity: 1,
        });

        expect(result.ticketId).toBe(456);
        expect(typeof result.ticketId).toBe("number");
      });

      it("should transform string '0' to number 0", () => {
        const result = addToCartSchema.parse({
          ticketId: "0",
          quantity: 1,
        });

        expect(result.ticketId).toBe(0);
      });

      it("should handle large number strings", () => {
        const result = addToCartSchema.parse({
          ticketId: "999999999",
          quantity: 1,
        });

        expect(result.ticketId).toBe(999999999);
      });

      it("should handle negative numbers", () => {
        const result = addToCartSchema.parse({
          ticketId: "-1",
          quantity: 1,
        });

        expect(result.ticketId).toBe(-1);
      });
    });

    describe("quantity field", () => {
      it("should accept valid string quantity and transform to number", () => {
        const result = addToCartSchema.parse({
          ticketId: 1,
          quantity: "5",
        });

        expect(result.quantity).toBe(5);
        expect(typeof result.quantity).toBe("number");
      });

      it("should accept valid number quantity", () => {
        const result = addToCartSchema.parse({
          ticketId: 1,
          quantity: 10,
        });

        expect(result.quantity).toBe(10);
        expect(typeof result.quantity).toBe("number");
      });

      it("should accept quantity of 1 (minimum valid)", () => {
        const result = addToCartSchema.parse({
          ticketId: 1,
          quantity: "1",
        });

        expect(result.quantity).toBe(1);
      });

      it("should reject quantity of 0", () => {
        expect(() =>
          addToCartSchema.parse({
            ticketId: 1,
            quantity: 0,
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should reject negative quantity", () => {
        expect(() =>
          addToCartSchema.parse({
            ticketId: 1,
            quantity: -5,
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should reject string quantity '0'", () => {
        expect(() =>
          addToCartSchema.parse({
            ticketId: 1,
            quantity: "0",
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should reject negative string quantity", () => {
        expect(() =>
          addToCartSchema.parse({
            ticketId: 1,
            quantity: "-1",
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should accept large quantities", () => {
        const result = addToCartSchema.parse({
          ticketId: 1,
          quantity: "1000",
        });

        expect(result.quantity).toBe(1000);
      });
    });

    describe("schema validation", () => {
      it("should validate complete valid object with strings", () => {
        const result = addToCartSchema.parse({
          ticketId: "123",
          quantity: "5",
        });

        expect(result).toEqual({
          ticketId: 123,
          quantity: 5,
        });
      });

      it("should validate complete valid object with numbers", () => {
        const result = addToCartSchema.parse({
          ticketId: 456,
          quantity: 10,
        });

        expect(result).toEqual({
          ticketId: 456,
          quantity: 10,
        });
      });

      it("should validate mixed types (string ticketId, number quantity)", () => {
        const result = addToCartSchema.parse({
          ticketId: "789",
          quantity: 3,
        });

        expect(result).toEqual({
          ticketId: 789,
          quantity: 3,
        });
      });

      it("should validate mixed types (number ticketId, string quantity)", () => {
        const result = addToCartSchema.parse({
          ticketId: 999,
          quantity: "7",
        });

        expect(result).toEqual({
          ticketId: 999,
          quantity: 7,
        });
      });

      it("should reject missing ticketId", () => {
        expect(() =>
          addToCartSchema.parse({
            quantity: 1,
          })
        ).toThrow();
      });

      it("should reject missing quantity", () => {
        expect(() =>
          addToCartSchema.parse({
            ticketId: 1,
          })
        ).toThrow();
      });

      it("should reject empty object", () => {
        expect(() => addToCartSchema.parse({})).toThrow();
      });

      it("should handle decimal quantities by transforming to number", () => {
        const result = addToCartSchema.parse({
          ticketId: 1,
          quantity: "5.5",
        });

        expect(result.quantity).toBe(5.5);
      });
    });
  });

  describe("updateCartSchema", () => {
    describe("quantity field", () => {
      it("should accept valid string quantity and transform to number", () => {
        const result = updateCartSchema.parse({
          quantity: "5",
        });

        expect(result.quantity).toBe(5);
        expect(typeof result.quantity).toBe("number");
      });

      it("should accept valid number quantity", () => {
        const result = updateCartSchema.parse({
          quantity: 10,
        });

        expect(result.quantity).toBe(10);
        expect(typeof result.quantity).toBe("number");
      });

      it("should accept quantity of 1 (minimum valid)", () => {
        const result = updateCartSchema.parse({
          quantity: "1",
        });

        expect(result.quantity).toBe(1);
      });

      it("should reject quantity of 0", () => {
        expect(() =>
          updateCartSchema.parse({
            quantity: 0,
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should reject negative quantity", () => {
        expect(() =>
          updateCartSchema.parse({
            quantity: -5,
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should reject string quantity '0'", () => {
        expect(() =>
          updateCartSchema.parse({
            quantity: "0",
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should reject negative string quantity", () => {
        expect(() =>
          updateCartSchema.parse({
            quantity: "-1",
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should accept large quantities", () => {
        const result = updateCartSchema.parse({
          quantity: "1000",
        });

        expect(result.quantity).toBe(1000);
      });

      it("should handle decimal quantities by transforming to number", () => {
        const result = updateCartSchema.parse({
          quantity: "3.7",
        });

        expect(result.quantity).toBe(3.7);
      });
    });

    describe("schema validation", () => {
      it("should validate complete valid object with string", () => {
        const result = updateCartSchema.parse({
          quantity: "8",
        });

        expect(result).toEqual({
          quantity: 8,
        });
      });

      it("should validate complete valid object with number", () => {
        const result = updateCartSchema.parse({
          quantity: 15,
        });

        expect(result).toEqual({
          quantity: 15,
        });
      });

      it("should reject missing quantity", () => {
        expect(() => updateCartSchema.parse({})).toThrow();
      });

      it("should reject empty object", () => {
        expect(() => updateCartSchema.parse({})).toThrow();
      });

      it("should only require quantity field", () => {
        const result = updateCartSchema.parse({
          quantity: 5,
        });

        expect(result).toEqual({
          quantity: 5,
        });
      });
    });

    describe("numberParser edge cases", () => {
      it("should handle string zero", () => {
        expect(() =>
          updateCartSchema.parse({
            quantity: "0",
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should handle number zero", () => {
        expect(() =>
          updateCartSchema.parse({
            quantity: 0,
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should transform valid string numbers correctly", () => {
        const result = updateCartSchema.parse({
          quantity: "42",
        });

        expect(result.quantity).toBe(42);
        expect(typeof result.quantity).toBe("number");
      });

      it("should pass through valid number values", () => {
        const result = updateCartSchema.parse({
          quantity: 42,
        });

        expect(result.quantity).toBe(42);
        expect(typeof result.quantity).toBe("number");
      });
    });
  });

  describe("numberParser transformation", () => {
    it("should transform string to number in addToCartSchema", () => {
      const result = addToCartSchema.parse({
        ticketId: "100",
        quantity: "50",
      });

      expect(typeof result.ticketId).toBe("number");
      expect(typeof result.quantity).toBe("number");
    });

    it("should preserve number type in addToCartSchema", () => {
      const result = addToCartSchema.parse({
        ticketId: 200,
        quantity: 75,
      });

      expect(typeof result.ticketId).toBe("number");
      expect(typeof result.quantity).toBe("number");
    });

    it("should transform string to number in updateCartSchema", () => {
      const result = updateCartSchema.parse({
        quantity: "25",
      });

      expect(typeof result.quantity).toBe("number");
    });

    it("should preserve number type in updateCartSchema", () => {
      const result = updateCartSchema.parse({
        quantity: 30,
      });

      expect(typeof result.quantity).toBe("number");
    });
  });

  describe("error messages", () => {
    it("should provide correct error message for quantity less than 1 in addToCartSchema", () => {
      try {
        addToCartSchema.parse({
          ticketId: 1,
          quantity: 0,
        });
      } catch (error) {
        expect(error.errors[0].message).toBe("Quantity must be at least 1");
      }
    });

    it("should provide correct error message for quantity less than 1 in updateCartSchema", () => {
      try {
        updateCartSchema.parse({
          quantity: -3,
        });
      } catch (error) {
        expect(error.errors[0].message).toBe("Quantity must be at least 1");
      }
    });

    it("should throw ZodError for invalid addToCartSchema data", () => {
      expect(() =>
        addToCartSchema.parse({
          ticketId: 1,
          quantity: 0,
        })
      ).toThrow();
    });

    it("should throw ZodError for invalid updateCartSchema data", () => {
      expect(() =>
        updateCartSchema.parse({
          quantity: 0,
        })
      ).toThrow();
    });
  });
});
