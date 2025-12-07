import { describe, it, expect } from "@jest/globals";
import {
  initializePaymentSchema,
  getPaymentsQuerySchema,
} from "../../validators/payment.validator.js";

describe("Payment Validator", () => {
  describe("initializePaymentSchema", () => {
    describe("ticketId field", () => {
      it("should accept valid string ticketId and transform to number", () => {
        const result = initializePaymentSchema.parse({
          ticketId: "123",
          quantity: 1,
        });

        expect(result.ticketId).toBe(123);
        expect(typeof result.ticketId).toBe("number");
      });

      it("should accept valid number ticketId", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 456,
          quantity: 1,
        });

        expect(result.ticketId).toBe(456);
        expect(typeof result.ticketId).toBe("number");
      });

      it("should transform string '0' to number 0", () => {
        const result = initializePaymentSchema.parse({
          ticketId: "0",
          quantity: 1,
        });

        expect(result.ticketId).toBe(0);
      });

      it("should handle large number strings", () => {
        const result = initializePaymentSchema.parse({
          ticketId: "999999999",
          quantity: 1,
        });

        expect(result.ticketId).toBe(999999999);
      });

      it("should handle negative numbers", () => {
        const result = initializePaymentSchema.parse({
          ticketId: "-1",
          quantity: 1,
        });

        expect(result.ticketId).toBe(-1);
      });

      it("should reject missing ticketId", () => {
        expect(() =>
          initializePaymentSchema.parse({
            quantity: 1,
          })
        ).toThrow();
      });
    });

    describe("quantity field", () => {
      it("should accept valid string quantity and transform to number", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: "5",
        });

        expect(result.quantity).toBe(5);
        expect(typeof result.quantity).toBe("number");
      });

      it("should accept valid number quantity", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: 10,
        });

        expect(result.quantity).toBe(10);
        expect(typeof result.quantity).toBe("number");
      });

      it("should accept quantity of 1 (minimum valid)", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: "1",
        });

        expect(result.quantity).toBe(1);
      });

      it("should reject quantity of 0", () => {
        expect(() =>
          initializePaymentSchema.parse({
            ticketId: 1,
            quantity: 0,
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should reject negative quantity", () => {
        expect(() =>
          initializePaymentSchema.parse({
            ticketId: 1,
            quantity: -5,
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should reject string quantity '0'", () => {
        expect(() =>
          initializePaymentSchema.parse({
            ticketId: 1,
            quantity: "0",
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should reject negative string quantity", () => {
        expect(() =>
          initializePaymentSchema.parse({
            ticketId: 1,
            quantity: "-1",
          })
        ).toThrow("Quantity must be at least 1");
      });

      it("should accept large quantities", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: "1000",
        });

        expect(result.quantity).toBe(1000);
      });

      it("should handle decimal quantities by transforming to number", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: "5.5",
        });

        expect(result.quantity).toBe(5.5);
      });

      it("should reject missing quantity", () => {
        expect(() =>
          initializePaymentSchema.parse({
            ticketId: 1,
          })
        ).toThrow();
      });
    });

    describe("promoCode field", () => {
      it("should accept valid promoCode string", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: 1,
          promoCode: "SUMMER2024",
        });

        expect(result.promoCode).toBe("SUMMER2024");
      });

      it("should accept promoCode as optional (not provided)", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: 1,
        });

        expect(result.promoCode).toBeUndefined();
      });

      it("should accept undefined promoCode", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: 1,
          promoCode: undefined,
        });

        expect(result.promoCode).toBeUndefined();
      });

      it("should accept empty string promoCode", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: 1,
          promoCode: "",
        });

        expect(result.promoCode).toBe("");
      });

      it("should accept promoCode with special characters", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: 1,
          promoCode: "PROMO-2024",
        });

        expect(result.promoCode).toBe("PROMO-2024");
      });

      it("should accept promoCode with numbers", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: 1,
          promoCode: "CODE123",
        });

        expect(result.promoCode).toBe("CODE123");
      });

      it("should accept long promoCode strings", () => {
        const longCode = "A".repeat(50);
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: 1,
          promoCode: longCode,
        });

        expect(result.promoCode).toBe(longCode);
      });

      it("should reject number as promoCode", () => {
        expect(() =>
          initializePaymentSchema.parse({
            ticketId: 1,
            quantity: 1,
            promoCode: 123,
          })
        ).toThrow();
      });

      it("should reject boolean as promoCode", () => {
        expect(() =>
          initializePaymentSchema.parse({
            ticketId: 1,
            quantity: 1,
            promoCode: true,
          })
        ).toThrow();
      });

      it("should reject null as promoCode", () => {
        expect(() =>
          initializePaymentSchema.parse({
            ticketId: 1,
            quantity: 1,
            promoCode: null,
          })
        ).toThrow();
      });

      it("should reject array as promoCode", () => {
        expect(() =>
          initializePaymentSchema.parse({
            ticketId: 1,
            quantity: 1,
            promoCode: ["CODE"],
          })
        ).toThrow();
      });
    });

    describe("schema validation", () => {
      it("should validate complete valid object with all fields", () => {
        const result = initializePaymentSchema.parse({
          ticketId: "123",
          quantity: "5",
          promoCode: "DISCOUNT50",
        });

        expect(result).toEqual({
          ticketId: 123,
          quantity: 5,
          promoCode: "DISCOUNT50",
        });
      });

      it("should validate object without optional promoCode", () => {
        const result = initializePaymentSchema.parse({
          ticketId: "456",
          quantity: "3",
        });

        expect(result).toEqual({
          ticketId: 456,
          quantity: 3,
        });
      });

      it("should validate with string types", () => {
        const result = initializePaymentSchema.parse({
          ticketId: "789",
          quantity: "2",
          promoCode: "SAVE20",
        });

        expect(result.ticketId).toBe(789);
        expect(result.quantity).toBe(2);
        expect(result.promoCode).toBe("SAVE20");
      });

      it("should validate with number types for ticketId and quantity", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 999,
          quantity: 7,
          promoCode: "VIP",
        });

        expect(result.ticketId).toBe(999);
        expect(result.quantity).toBe(7);
        expect(result.promoCode).toBe("VIP");
      });

      it("should validate mixed types (string ticketId, number quantity)", () => {
        const result = initializePaymentSchema.parse({
          ticketId: "111",
          quantity: 4,
        });

        expect(result).toEqual({
          ticketId: 111,
          quantity: 4,
        });
      });

      it("should validate mixed types (number ticketId, string quantity)", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 222,
          quantity: "8",
        });

        expect(result).toEqual({
          ticketId: 222,
          quantity: 8,
        });
      });

      it("should reject empty object", () => {
        expect(() => initializePaymentSchema.parse({})).toThrow();
      });

      it("should strip unknown fields", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 1,
          quantity: 1,
          unknownField: "value",
        });

        expect(result.unknownField).toBeUndefined();
      });
    });

    describe("numberParser transformation", () => {
      it("should transform both ticketId and quantity from strings to numbers", () => {
        const result = initializePaymentSchema.parse({
          ticketId: "100",
          quantity: "50",
        });

        expect(typeof result.ticketId).toBe("number");
        expect(typeof result.quantity).toBe("number");
        expect(result.ticketId).toBe(100);
        expect(result.quantity).toBe(50);
      });

      it("should preserve number types for ticketId and quantity", () => {
        const result = initializePaymentSchema.parse({
          ticketId: 200,
          quantity: 75,
        });

        expect(typeof result.ticketId).toBe("number");
        expect(typeof result.quantity).toBe("number");
      });

      it("should handle mixed string and number inputs", () => {
        const result = initializePaymentSchema.parse({
          ticketId: "300",
          quantity: 25,
        });

        expect(result.ticketId).toBe(300);
        expect(result.quantity).toBe(25);
      });
    });
  });

  describe("getPaymentsQuerySchema", () => {
    describe("optional fields", () => {
      it("should accept all query parameters", () => {
        const result = getPaymentsQuerySchema.parse({
          page: "1",
          limit: "10",
        });

        expect(result).toEqual({
          page: "1",
          limit: "10",
        });
      });

      it("should accept empty object (all fields optional)", () => {
        const result = getPaymentsQuerySchema.parse({});

        expect(result).toEqual({});
      });

      it("should accept only page parameter", () => {
        const result = getPaymentsQuerySchema.parse({
          page: "2",
        });

        expect(result).toEqual({
          page: "2",
        });
      });

      it("should accept only limit parameter", () => {
        const result = getPaymentsQuerySchema.parse({
          limit: "20",
        });

        expect(result).toEqual({
          limit: "20",
        });
      });

      it("should accept undefined page", () => {
        const result = getPaymentsQuerySchema.parse({
          page: undefined,
        });

        expect(result.page).toBeUndefined();
      });

      it("should accept undefined limit", () => {
        const result = getPaymentsQuerySchema.parse({
          limit: undefined,
        });

        expect(result.limit).toBeUndefined();
      });
    });

    describe("page field", () => {
      it("should accept valid page string", () => {
        const result = getPaymentsQuerySchema.parse({
          page: "5",
        });

        expect(result.page).toBe("5");
        expect(typeof result.page).toBe("string");
      });

      it("should accept page value '0'", () => {
        const result = getPaymentsQuerySchema.parse({
          page: "0",
        });

        expect(result.page).toBe("0");
      });

      it("should accept large page numbers as strings", () => {
        const result = getPaymentsQuerySchema.parse({
          page: "999",
        });

        expect(result.page).toBe("999");
      });

      it("should accept negative page strings", () => {
        const result = getPaymentsQuerySchema.parse({
          page: "-1",
        });

        expect(result.page).toBe("-1");
      });

      it("should reject number as page", () => {
        expect(() =>
          getPaymentsQuerySchema.parse({
            page: 1,
          })
        ).toThrow();
      });

      it("should reject boolean as page", () => {
        expect(() =>
          getPaymentsQuerySchema.parse({
            page: true,
          })
        ).toThrow();
      });

      it("should reject null as page", () => {
        expect(() =>
          getPaymentsQuerySchema.parse({
            page: null,
          })
        ).toThrow();
      });

      it("should reject array as page", () => {
        expect(() =>
          getPaymentsQuerySchema.parse({
            page: ["1"],
          })
        ).toThrow();
      });
    });

    describe("limit field", () => {
      it("should accept valid limit string", () => {
        const result = getPaymentsQuerySchema.parse({
          limit: "50",
        });

        expect(result.limit).toBe("50");
        expect(typeof result.limit).toBe("string");
      });

      it("should accept limit value '0'", () => {
        const result = getPaymentsQuerySchema.parse({
          limit: "0",
        });

        expect(result.limit).toBe("0");
      });

      it("should accept large limit numbers as strings", () => {
        const result = getPaymentsQuerySchema.parse({
          limit: "1000",
        });

        expect(result.limit).toBe("1000");
      });

      it("should accept negative limit strings", () => {
        const result = getPaymentsQuerySchema.parse({
          limit: "-5",
        });

        expect(result.limit).toBe("-5");
      });

      it("should reject number as limit", () => {
        expect(() =>
          getPaymentsQuerySchema.parse({
            limit: 10,
          })
        ).toThrow();
      });

      it("should reject boolean as limit", () => {
        expect(() =>
          getPaymentsQuerySchema.parse({
            limit: false,
          })
        ).toThrow();
      });

      it("should reject null as limit", () => {
        expect(() =>
          getPaymentsQuerySchema.parse({
            limit: null,
          })
        ).toThrow();
      });

      it("should reject array as limit", () => {
        expect(() =>
          getPaymentsQuerySchema.parse({
            limit: ["10"],
          })
        ).toThrow();
      });
    });

    describe("schema validation", () => {
      it("should validate complete query object", () => {
        const result = getPaymentsQuerySchema.parse({
          page: "3",
          limit: "25",
        });

        expect(result).toEqual({
          page: "3",
          limit: "25",
        });
      });

      it("should strip unknown query fields", () => {
        const result = getPaymentsQuerySchema.parse({
          page: "1",
          unknownField: "value",
        });

        expect(result.unknownField).toBeUndefined();
        expect(result).toEqual({
          page: "1",
        });
      });

      it("should handle missing all fields", () => {
        const result = getPaymentsQuerySchema.parse({});

        expect(result).toEqual({});
      });

      it("should only accept string types for page and limit", () => {
        const result = getPaymentsQuerySchema.parse({
          page: "1",
          limit: "10",
        });

        expect(typeof result.page).toBe("string");
        expect(typeof result.limit).toBe("string");
      });

      it("should accept empty strings for page and limit", () => {
        const result = getPaymentsQuerySchema.parse({
          page: "",
          limit: "",
        });

        expect(result.page).toBe("");
        expect(result.limit).toBe("");
      });
    });
  });

  describe("error messages", () => {
    it("should provide correct error message for quantity less than 1 in initializePaymentSchema", () => {
      try {
        initializePaymentSchema.parse({
          ticketId: 1,
          quantity: 0,
        });
      } catch (error) {
        expect(error.errors[0].message).toBe("Quantity must be at least 1");
      }
    });

    it("should throw ZodError for invalid initializePaymentSchema data", () => {
      expect(() =>
        initializePaymentSchema.parse({
          ticketId: 1,
          quantity: -1,
        })
      ).toThrow();
    });

    it("should throw ZodError for missing required fields", () => {
      expect(() => initializePaymentSchema.parse({})).toThrow();
    });

    it("should throw ZodError for invalid type in getPaymentsQuerySchema", () => {
      expect(() =>
        getPaymentsQuerySchema.parse({
          page: 1,
        })
      ).toThrow();
    });
  });

  describe("schema comparison", () => {
    it("should have similar structure to cart validator for quantity validation", () => {
      // Both should reject quantity 0
      expect(() =>
        initializePaymentSchema.parse({
          ticketId: 1,
          quantity: 0,
        })
      ).toThrow("Quantity must be at least 1");
    });

    it("should transform ticketId and quantity using numberParser", () => {
      const result = initializePaymentSchema.parse({
        ticketId: "123",
        quantity: "5",
      });

      expect(typeof result.ticketId).toBe("number");
      expect(typeof result.quantity).toBe("number");
    });

    it("should have optional promoCode unique to payment schema", () => {
      const withPromo = initializePaymentSchema.parse({
        ticketId: 1,
        quantity: 1,
        promoCode: "CODE",
      });

      const withoutPromo = initializePaymentSchema.parse({
        ticketId: 1,
        quantity: 1,
      });

      expect(withPromo.promoCode).toBe("CODE");
      expect(withoutPromo.promoCode).toBeUndefined();
    });
  });
});
