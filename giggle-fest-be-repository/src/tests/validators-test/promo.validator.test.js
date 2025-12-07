import { describe, it, expect } from "@jest/globals";
import {
  createPromoSchema,
  updatePromoSchema,
  getPromoQuerySchema,
} from "../../validators/promo.validator.js";

describe("Promo Validator", () => {
  describe("createPromoSchema", () => {
    describe("code field", () => {
      it("should accept valid code string", () => {
        const result = createPromoSchema.parse({
          code: "SAVE20",
          discount: 20,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.code).toBe("SAVE20");
      });

      it("should accept code with minimum length of 3", () => {
        const result = createPromoSchema.parse({
          code: "ABC",
          discount: 10,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.code).toBe("ABC");
      });

      it("should accept code with maximum length of 20", () => {
        const longCode = "A".repeat(20);
        const result = createPromoSchema.parse({
          code: longCode,
          discount: 15,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.code).toBe(longCode);
      });

      it("should accept code with special characters", () => {
        const result = createPromoSchema.parse({
          code: "SUMMER-2024",
          discount: 25,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.code).toBe("SUMMER-2024");
      });

      it("should accept code with numbers", () => {
        const result = createPromoSchema.parse({
          code: "CODE123",
          discount: 30,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.code).toBe("CODE123");
      });

      it("should reject code shorter than 3 characters", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "AB",
            discount: 10,
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow();
      });

      it("should reject code longer than 20 characters", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "A".repeat(21),
            discount: 10,
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow();
      });

      it("should reject empty code", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "",
            discount: 10,
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow();
      });

      it("should reject missing code", () => {
        expect(() =>
          createPromoSchema.parse({
            discount: 10,
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow();
      });

      it("should reject number as code", () => {
        expect(() =>
          createPromoSchema.parse({
            code: 123,
            discount: 10,
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow();
      });

      it("should reject null as code", () => {
        expect(() =>
          createPromoSchema.parse({
            code: null,
            discount: 10,
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow();
      });
    });

    describe("discount field", () => {
      it("should accept valid number discount", () => {
        const result = createPromoSchema.parse({
          code: "SAVE20",
          discount: 20,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.discount).toBe(20);
      });

      it("should accept valid string discount and transform to number", () => {
        const result = createPromoSchema.parse({
          code: "SAVE30",
          discount: "30",
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.discount).toBe(30);
        expect(typeof result.discount).toBe("number");
      });

      it("should accept discount value of 1 (just above 0)", () => {
        const result = createPromoSchema.parse({
          code: "MIN",
          discount: 1,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.discount).toBe(1);
      });

      it("should accept discount value of 100 (maximum)", () => {
        const result = createPromoSchema.parse({
          code: "MAX",
          discount: 100,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.discount).toBe(100);
      });

      it("should accept decimal discount values", () => {
        const result = createPromoSchema.parse({
          code: "DECIMAL",
          discount: 15.5,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.discount).toBe(15.5);
      });

      it("should accept string decimal discount and transform to number", () => {
        const result = createPromoSchema.parse({
          code: "DECIMAL2",
          discount: "25.75",
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.discount).toBe(25.75);
      });

      it("should reject discount of 0", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "ZERO",
            discount: 0,
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow("Discount must be between 0 and 100");
      });

      it("should reject negative discount", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "NEG",
            discount: -10,
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow("Discount must be between 0 and 100");
      });

      it("should reject discount greater than 100", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "OVER",
            discount: 101,
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow("Discount must be between 0 and 100");
      });

      it("should reject string discount of '0'", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "ZERO2",
            discount: "0",
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow("Discount must be between 0 and 100");
      });

      it("should reject missing discount", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "MISSING",
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow();
      });
    });

    describe("validFrom field", () => {
      it("should accept valid ISO datetime string", () => {
        const result = createPromoSchema.parse({
          code: "TEST",
          discount: 20,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.validFrom).toBe("2024-01-01T00:00:00.000Z");
      });

      it("should accept datetime with milliseconds", () => {
        const result = createPromoSchema.parse({
          code: "TEST",
          discount: 20,
          validFrom: "2024-06-15T14:30:45.123Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.validFrom).toBe("2024-06-15T14:30:45.123Z");
      });

      it("should accept datetime without milliseconds", () => {
        const result = createPromoSchema.parse({
          code: "TEST",
          discount: 20,
          validFrom: "2024-01-15T10:30:00Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.validFrom).toBe("2024-01-15T10:30:00Z");
      });

      it("should reject invalid datetime format", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "TEST",
            discount: 20,
            validFrom: "2024-01-01",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow();
      });

      it("should reject non-datetime string", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "TEST",
            discount: 20,
            validFrom: "not-a-date",
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow();
      });

      it("should reject number as validFrom", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "TEST",
            discount: 20,
            validFrom: 1234567890,
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow();
      });

      it("should reject missing validFrom", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "TEST",
            discount: 20,
            validTo: "2024-12-31T23:59:59.000Z",
          })
        ).toThrow();
      });
    });

    describe("validTo field", () => {
      it("should accept valid ISO datetime string", () => {
        const result = createPromoSchema.parse({
          code: "TEST",
          discount: 20,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.validTo).toBe("2024-12-31T23:59:59.000Z");
      });

      it("should accept datetime with milliseconds", () => {
        const result = createPromoSchema.parse({
          code: "TEST",
          discount: 20,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.999Z",
        });

        expect(result.validTo).toBe("2024-12-31T23:59:59.999Z");
      });

      it("should accept datetime without milliseconds", () => {
        const result = createPromoSchema.parse({
          code: "TEST",
          discount: 20,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59Z",
        });

        expect(result.validTo).toBe("2024-12-31T23:59:59Z");
      });

      it("should reject invalid datetime format", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "TEST",
            discount: 20,
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "2024-12-31",
          })
        ).toThrow();
      });

      it("should reject non-datetime string", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "TEST",
            discount: 20,
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: "invalid-date",
          })
        ).toThrow();
      });

      it("should reject number as validTo", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "TEST",
            discount: 20,
            validFrom: "2024-01-01T00:00:00.000Z",
            validTo: 1234567890,
          })
        ).toThrow();
      });

      it("should reject missing validTo", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "TEST",
            discount: 20,
            validFrom: "2024-01-01T00:00:00.000Z",
          })
        ).toThrow();
      });
    });

    describe("schema validation", () => {
      it("should validate complete valid object", () => {
        const result = createPromoSchema.parse({
          code: "SUMMER2024",
          discount: 25,
          validFrom: "2024-06-01T00:00:00.000Z",
          validTo: "2024-08-31T23:59:59.000Z",
        });

        expect(result).toEqual({
          code: "SUMMER2024",
          discount: 25,
          validFrom: "2024-06-01T00:00:00.000Z",
          validTo: "2024-08-31T23:59:59.000Z",
        });
      });

      it("should validate with string discount", () => {
        const result = createPromoSchema.parse({
          code: "WINTER2024",
          discount: "30",
          validFrom: "2024-12-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.discount).toBe(30);
        expect(typeof result.discount).toBe("number");
      });

      it("should reject empty object", () => {
        expect(() => createPromoSchema.parse({})).toThrow();
      });

      it("should strip unknown fields", () => {
        const result = createPromoSchema.parse({
          code: "TEST",
          discount: 20,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
          unknownField: "value",
        });

        expect(result.unknownField).toBeUndefined();
      });

      it("should require all fields", () => {
        expect(() =>
          createPromoSchema.parse({
            code: "TEST",
            discount: 20,
          })
        ).toThrow();
      });
    });
  });

  describe("updatePromoSchema", () => {
    describe("optional fields behavior", () => {
      it("should accept empty object (all fields optional)", () => {
        const result = updatePromoSchema.parse({});

        expect(result).toEqual({});
      });

      it("should accept only code field", () => {
        const result = updatePromoSchema.parse({
          code: "NEWCODE",
        });

        expect(result).toEqual({
          code: "NEWCODE",
        });
      });

      it("should accept only discount field", () => {
        const result = updatePromoSchema.parse({
          discount: 15,
        });

        expect(result).toEqual({
          discount: 15,
        });
      });

      it("should accept only validFrom field", () => {
        const result = updatePromoSchema.parse({
          validFrom: "2024-01-01T00:00:00.000Z",
        });

        expect(result).toEqual({
          validFrom: "2024-01-01T00:00:00.000Z",
        });
      });

      it("should accept only validTo field", () => {
        const result = updatePromoSchema.parse({
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result).toEqual({
          validTo: "2024-12-31T23:59:59.000Z",
        });
      });

      it("should accept partial combination of fields", () => {
        const result = updatePromoSchema.parse({
          code: "PARTIAL",
          discount: 20,
        });

        expect(result).toEqual({
          code: "PARTIAL",
          discount: 20,
        });
      });

      it("should accept all fields", () => {
        const result = updatePromoSchema.parse({
          code: "COMPLETE",
          discount: 50,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result).toEqual({
          code: "COMPLETE",
          discount: 50,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });
      });
    });

    describe("code field when provided", () => {
      it("should validate code with minimum length of 3", () => {
        const result = updatePromoSchema.parse({
          code: "ABC",
        });

        expect(result.code).toBe("ABC");
      });

      it("should validate code with maximum length of 20", () => {
        const longCode = "A".repeat(20);
        const result = updatePromoSchema.parse({
          code: longCode,
        });

        expect(result.code).toBe(longCode);
      });

      it("should reject code shorter than 3 when provided", () => {
        expect(() =>
          updatePromoSchema.parse({
            code: "AB",
          })
        ).toThrow();
      });

      it("should reject code longer than 20 when provided", () => {
        expect(() =>
          updatePromoSchema.parse({
            code: "A".repeat(21),
          })
        ).toThrow();
      });

      it("should reject empty code when provided", () => {
        expect(() =>
          updatePromoSchema.parse({
            code: "",
          })
        ).toThrow();
      });
    });

    describe("discount field when provided", () => {
      it("should validate discount between 0 and 100", () => {
        const result = updatePromoSchema.parse({
          discount: 50,
        });

        expect(result.discount).toBe(50);
      });

      it("should transform string discount to number", () => {
        const result = updatePromoSchema.parse({
          discount: "75",
        });

        expect(result.discount).toBe(75);
        expect(typeof result.discount).toBe("number");
      });

      it("should reject discount of 0 when provided", () => {
        expect(() =>
          updatePromoSchema.parse({
            discount: 0,
          })
        ).toThrow("Discount must be between 0 and 100");
      });

      it("should reject discount greater than 100 when provided", () => {
        expect(() =>
          updatePromoSchema.parse({
            discount: 101,
          })
        ).toThrow("Discount must be between 0 and 100");
      });

      it("should reject negative discount when provided", () => {
        expect(() =>
          updatePromoSchema.parse({
            discount: -5,
          })
        ).toThrow("Discount must be between 0 and 100");
      });

      it("should accept discount of 1 when provided", () => {
        const result = updatePromoSchema.parse({
          discount: 1,
        });

        expect(result.discount).toBe(1);
      });

      it("should accept discount of 100 when provided", () => {
        const result = updatePromoSchema.parse({
          discount: 100,
        });

        expect(result.discount).toBe(100);
      });
    });

    describe("validFrom field when provided", () => {
      it("should validate ISO datetime string", () => {
        const result = updatePromoSchema.parse({
          validFrom: "2024-01-01T00:00:00.000Z",
        });

        expect(result.validFrom).toBe("2024-01-01T00:00:00.000Z");
      });

      it("should reject invalid datetime format when provided", () => {
        expect(() =>
          updatePromoSchema.parse({
            validFrom: "2024-01-01",
          })
        ).toThrow();
      });

      it("should reject non-datetime string when provided", () => {
        expect(() =>
          updatePromoSchema.parse({
            validFrom: "invalid",
          })
        ).toThrow();
      });
    });

    describe("validTo field when provided", () => {
      it("should validate ISO datetime string", () => {
        const result = updatePromoSchema.parse({
          validTo: "2024-12-31T23:59:59.000Z",
        });

        expect(result.validTo).toBe("2024-12-31T23:59:59.000Z");
      });

      it("should reject invalid datetime format when provided", () => {
        expect(() =>
          updatePromoSchema.parse({
            validTo: "2024-12-31",
          })
        ).toThrow();
      });

      it("should reject non-datetime string when provided", () => {
        expect(() =>
          updatePromoSchema.parse({
            validTo: "invalid",
          })
        ).toThrow();
      });
    });

    describe("schema validation", () => {
      it("should strip unknown fields", () => {
        const result = updatePromoSchema.parse({
          code: "TEST",
          unknownField: "value",
        });

        expect(result.unknownField).toBeUndefined();
        expect(result).toEqual({
          code: "TEST",
        });
      });

      it("should handle partial updates", () => {
        const result = updatePromoSchema.parse({
          discount: 35,
        });

        expect(result).toEqual({
          discount: 35,
        });
      });
    });
  });

  describe("getPromoQuerySchema", () => {
    describe("optional fields", () => {
      it("should accept all query parameters", () => {
        const result = getPromoQuerySchema.parse({
          page: "1",
          limit: "10",
        });

        expect(result).toEqual({
          page: 1,
          limit: 10,
        });
      });

      it("should accept empty object (all fields optional)", () => {
        const result = getPromoQuerySchema.parse({});

        expect(result).toEqual({});
      });

      it("should accept only page parameter", () => {
        const result = getPromoQuerySchema.parse({
          page: "2",
        });

        expect(result.page).toBe(2);
      });

      it("should accept only limit parameter", () => {
        const result = getPromoQuerySchema.parse({
          limit: "20",
        });

        expect(result.limit).toBe(20);
      });

      it("should accept undefined page", () => {
        const result = getPromoQuerySchema.parse({
          page: undefined,
        });

        expect(result.page).toBeUndefined();
      });

      it("should accept undefined limit", () => {
        const result = getPromoQuerySchema.parse({
          limit: undefined,
        });

        expect(result.limit).toBeUndefined();
      });
    });

    describe("page field transformation", () => {
      it("should transform string page to number", () => {
        const result = getPromoQuerySchema.parse({
          page: "5",
        });

        expect(result.page).toBe(5);
        expect(typeof result.page).toBe("number");
      });

      it("should accept number page directly", () => {
        const result = getPromoQuerySchema.parse({
          page: 3,
        });

        expect(result.page).toBe(3);
        expect(typeof result.page).toBe("number");
      });

      it("should transform string '0' to number 0", () => {
        const result = getPromoQuerySchema.parse({
          page: "0",
        });

        expect(result.page).toBe(0);
      });

      it("should handle large page numbers", () => {
        const result = getPromoQuerySchema.parse({
          page: "999",
        });

        expect(result.page).toBe(999);
      });

      it("should handle negative page numbers", () => {
        const result = getPromoQuerySchema.parse({
          page: "-1",
        });

        expect(result.page).toBe(-1);
      });
    });

    describe("limit field transformation", () => {
      it("should transform string limit to number", () => {
        const result = getPromoQuerySchema.parse({
          limit: "50",
        });

        expect(result.limit).toBe(50);
        expect(typeof result.limit).toBe("number");
      });

      it("should accept number limit directly", () => {
        const result = getPromoQuerySchema.parse({
          limit: 25,
        });

        expect(result.limit).toBe(25);
        expect(typeof result.limit).toBe("number");
      });

      it("should transform string '0' to number 0", () => {
        const result = getPromoQuerySchema.parse({
          limit: "0",
        });

        expect(result.limit).toBe(0);
      });

      it("should handle large limit numbers", () => {
        const result = getPromoQuerySchema.parse({
          limit: "1000",
        });

        expect(result.limit).toBe(1000);
      });

      it("should handle negative limit numbers", () => {
        const result = getPromoQuerySchema.parse({
          limit: "-5",
        });

        expect(result.limit).toBe(-5);
      });
    });

    describe("numberParser transformation", () => {
      it("should transform both page and limit from strings to numbers", () => {
        const result = getPromoQuerySchema.parse({
          page: "2",
          limit: "15",
        });

        expect(typeof result.page).toBe("number");
        expect(typeof result.limit).toBe("number");
        expect(result.page).toBe(2);
        expect(result.limit).toBe(15);
      });

      it("should preserve number types for page and limit", () => {
        const result = getPromoQuerySchema.parse({
          page: 4,
          limit: 30,
        });

        expect(typeof result.page).toBe("number");
        expect(typeof result.limit).toBe("number");
      });

      it("should handle mixed string and number inputs", () => {
        const result = getPromoQuerySchema.parse({
          page: "6",
          limit: 40,
        });

        expect(result.page).toBe(6);
        expect(result.limit).toBe(40);
      });
    });

    describe("schema validation", () => {
      it("should validate complete query object", () => {
        const result = getPromoQuerySchema.parse({
          page: "1",
          limit: "10",
        });

        expect(result).toEqual({
          page: 1,
          limit: 10,
        });
      });

      it("should strip unknown query fields", () => {
        const result = getPromoQuerySchema.parse({
          page: "1",
          unknownField: "value",
        });

        expect(result.unknownField).toBeUndefined();
        expect(result.page).toBe(1);
      });

      it("should handle missing all fields", () => {
        const result = getPromoQuerySchema.parse({});

        expect(result).toEqual({});
      });
    });
  });

  describe("error messages", () => {
    it("should provide correct error message for discount validation in createPromoSchema", () => {
      try {
        createPromoSchema.parse({
          code: "TEST",
          discount: 0,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        });
      } catch (error) {
        expect(error.errors[0].message).toBe(
          "Discount must be between 0 and 100"
        );
      }
    });

    it("should provide correct error message for discount validation in updatePromoSchema", () => {
      try {
        updatePromoSchema.parse({
          discount: 150,
        });
      } catch (error) {
        expect(error.errors[0].message).toBe(
          "Discount must be between 0 and 100"
        );
      }
    });

    it("should throw ZodError for invalid createPromoSchema", () => {
      expect(() =>
        createPromoSchema.parse({
          code: "AB",
          discount: 10,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        })
      ).toThrow();
    });

    it("should throw ZodError for invalid updatePromoSchema", () => {
      expect(() =>
        updatePromoSchema.parse({
          code: "A",
        })
      ).toThrow();
    });

    it("should throw ZodError for missing required fields in createPromoSchema", () => {
      expect(() =>
        createPromoSchema.parse({
          code: "TEST",
        })
      ).toThrow();
    });
  });

  describe("schema relationships", () => {
    it("should have updatePromoSchema with same validation rules as createPromoSchema", () => {
      // Both should reject code less than 3 characters when provided
      expect(() =>
        createPromoSchema.parse({
          code: "AB",
          discount: 10,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        })
      ).toThrow();

      expect(() =>
        updatePromoSchema.parse({
          code: "AB",
        })
      ).toThrow();
    });

    it("should require all fields in create but not in update", () => {
      expect(() =>
        createPromoSchema.parse({
          code: "TEST",
        })
      ).toThrow();

      expect(() =>
        updatePromoSchema.parse({
          code: "TEST",
        })
      ).not.toThrow();
    });

    it("should validate same discount rules in both schemas when provided", () => {
      expect(() =>
        createPromoSchema.parse({
          code: "TEST",
          discount: 0,
          validFrom: "2024-01-01T00:00:00.000Z",
          validTo: "2024-12-31T23:59:59.000Z",
        })
      ).toThrow("Discount must be between 0 and 100");

      expect(() =>
        updatePromoSchema.parse({
          discount: 0,
        })
      ).toThrow("Discount must be between 0 and 100");
    });
  });
});
