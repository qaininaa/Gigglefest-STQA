import { describe, it, expect } from "@jest/globals";
import {
  createReviewSchema,
  updateReviewSchema,
  getReviewsQuerySchema,
} from "../../validators/review.validator.js";

describe("Review Validator", () => {
  describe("createReviewSchema", () => {
    describe("rating field", () => {
      it("should accept valid number rating", () => {
        const result = createReviewSchema.parse({
          rating: 4,
          comment: "Great event!",
          ticketId: 1,
        });

        expect(result.rating).toBe(4);
        expect(typeof result.rating).toBe("number");
      });

      it("should accept valid string rating and transform to number", () => {
        const result = createReviewSchema.parse({
          rating: "5",
          comment: "Excellent!",
          ticketId: 1,
        });

        expect(result.rating).toBe(5);
        expect(typeof result.rating).toBe("number");
      });

      it("should accept rating of 1 (minimum valid)", () => {
        const result = createReviewSchema.parse({
          rating: "1",
          comment: "Not great",
          ticketId: 1,
        });

        expect(result.rating).toBe(1);
      });

      it("should accept rating of 5 (maximum valid)", () => {
        const result = createReviewSchema.parse({
          rating: "5",
          comment: "Perfect!",
          ticketId: 1,
        });

        expect(result.rating).toBe(5);
      });

      it("should accept rating of 3 (middle value)", () => {
        const result = createReviewSchema.parse({
          rating: 3,
          comment: "Average",
          ticketId: 1,
        });

        expect(result.rating).toBe(3);
      });

      it("should reject rating of 0", () => {
        expect(() =>
          createReviewSchema.parse({
            rating: 0,
            comment: "Test",
            ticketId: 1,
          })
        ).toThrow("Rating must be between 1 and 5");
      });

      it("should reject rating greater than 5", () => {
        expect(() =>
          createReviewSchema.parse({
            rating: 6,
            comment: "Test",
            ticketId: 1,
          })
        ).toThrow("Rating must be between 1 and 5");
      });

      it("should reject negative rating", () => {
        expect(() =>
          createReviewSchema.parse({
            rating: -1,
            comment: "Test",
            ticketId: 1,
          })
        ).toThrow("Rating must be between 1 and 5");
      });

      it("should reject string rating '0'", () => {
        expect(() =>
          createReviewSchema.parse({
            rating: "0",
            comment: "Test",
            ticketId: 1,
          })
        ).toThrow("Rating must be between 1 and 5");
      });

      it("should reject string rating '6'", () => {
        expect(() =>
          createReviewSchema.parse({
            rating: "6",
            comment: "Test",
            ticketId: 1,
          })
        ).toThrow("Rating must be between 1 and 5");
      });

      it("should accept decimal ratings within range", () => {
        const result = createReviewSchema.parse({
          rating: 4.5,
          comment: "Good",
          ticketId: 1,
        });

        expect(result.rating).toBe(4.5);
      });

      it("should accept string decimal ratings", () => {
        const result = createReviewSchema.parse({
          rating: "3.5",
          comment: "Decent",
          ticketId: 1,
        });

        expect(result.rating).toBe(3.5);
      });

      it("should reject missing rating", () => {
        expect(() =>
          createReviewSchema.parse({
            comment: "Test",
            ticketId: 1,
          })
        ).toThrow();
      });
    });

    describe("comment field", () => {
      it("should accept valid comment string", () => {
        const result = createReviewSchema.parse({
          rating: 4,
          comment: "Great event, highly recommend!",
          ticketId: 1,
        });

        expect(result.comment).toBe("Great event, highly recommend!");
      });

      it("should accept single character comment", () => {
        const result = createReviewSchema.parse({
          rating: 5,
          comment: "A",
          ticketId: 1,
        });

        expect(result.comment).toBe("A");
      });

      it("should accept long comment strings", () => {
        const longComment = "A".repeat(1000);
        const result = createReviewSchema.parse({
          rating: 4,
          comment: longComment,
          ticketId: 1,
        });

        expect(result.comment).toBe(longComment);
      });

      it("should accept comment with special characters", () => {
        const result = createReviewSchema.parse({
          rating: 5,
          comment: "Amazing event! Best experience ever!!!",
          ticketId: 1,
        });

        expect(result.comment).toBe("Amazing event! Best experience ever!!!");
      });

      it("should accept comment with numbers", () => {
        const result = createReviewSchema.parse({
          rating: 4,
          comment: "Attended 3 times, always great!",
          ticketId: 1,
        });

        expect(result.comment).toBe("Attended 3 times, always great!");
      });

      it("should reject empty comment string", () => {
        expect(() =>
          createReviewSchema.parse({
            rating: 4,
            comment: "",
            ticketId: 1,
          })
        ).toThrow("Comment is required");
      });

      it("should reject missing comment", () => {
        expect(() =>
          createReviewSchema.parse({
            rating: 4,
            ticketId: 1,
          })
        ).toThrow();
      });

      it("should reject number as comment", () => {
        expect(() =>
          createReviewSchema.parse({
            rating: 4,
            comment: 123,
            ticketId: 1,
          })
        ).toThrow();
      });

      it("should reject null as comment", () => {
        expect(() =>
          createReviewSchema.parse({
            rating: 4,
            comment: null,
            ticketId: 1,
          })
        ).toThrow();
      });

      it("should reject boolean as comment", () => {
        expect(() =>
          createReviewSchema.parse({
            rating: 4,
            comment: true,
            ticketId: 1,
          })
        ).toThrow();
      });
    });

    describe("ticketId field", () => {
      it("should accept valid string ticketId and transform to number", () => {
        const result = createReviewSchema.parse({
          rating: 4,
          comment: "Good",
          ticketId: "123",
        });

        expect(result.ticketId).toBe(123);
        expect(typeof result.ticketId).toBe("number");
      });

      it("should accept valid number ticketId", () => {
        const result = createReviewSchema.parse({
          rating: 5,
          comment: "Excellent",
          ticketId: 456,
        });

        expect(result.ticketId).toBe(456);
        expect(typeof result.ticketId).toBe("number");
      });

      it("should transform string '0' to number 0", () => {
        const result = createReviewSchema.parse({
          rating: 3,
          comment: "Average",
          ticketId: "0",
        });

        expect(result.ticketId).toBe(0);
      });

      it("should handle large number strings", () => {
        const result = createReviewSchema.parse({
          rating: 4,
          comment: "Good",
          ticketId: "999999999",
        });

        expect(result.ticketId).toBe(999999999);
      });

      it("should handle negative numbers", () => {
        const result = createReviewSchema.parse({
          rating: 2,
          comment: "Poor",
          ticketId: "-1",
        });

        expect(result.ticketId).toBe(-1);
      });

      it("should reject missing ticketId", () => {
        expect(() =>
          createReviewSchema.parse({
            rating: 4,
            comment: "Good",
          })
        ).toThrow();
      });
    });

    describe("schema validation", () => {
      it("should validate complete valid object with all fields", () => {
        const result = createReviewSchema.parse({
          rating: 5,
          comment: "Absolutely amazing event!",
          ticketId: 1,
        });

        expect(result).toEqual({
          rating: 5,
          comment: "Absolutely amazing event!",
          ticketId: 1,
        });
      });

      it("should validate with string types and transform to numbers", () => {
        const result = createReviewSchema.parse({
          rating: "4",
          comment: "Great experience",
          ticketId: "123",
        });

        expect(result.rating).toBe(4);
        expect(result.ticketId).toBe(123);
        expect(result.comment).toBe("Great experience");
      });

      it("should validate with number types", () => {
        const result = createReviewSchema.parse({
          rating: 3,
          comment: "Okay",
          ticketId: 456,
        });

        expect(result).toEqual({
          rating: 3,
          comment: "Okay",
          ticketId: 456,
        });
      });

      it("should validate mixed types", () => {
        const result = createReviewSchema.parse({
          rating: "5",
          comment: "Perfect",
          ticketId: 789,
        });

        expect(result.rating).toBe(5);
        expect(result.ticketId).toBe(789);
      });

      it("should reject empty object", () => {
        expect(() => createReviewSchema.parse({})).toThrow();
      });

      it("should strip unknown fields", () => {
        const result = createReviewSchema.parse({
          rating: 4,
          comment: "Good",
          ticketId: 1,
          unknownField: "value",
        });

        expect(result.unknownField).toBeUndefined();
        expect(result).toEqual({
          rating: 4,
          comment: "Good",
          ticketId: 1,
        });
      });

      it("should require all three fields", () => {
        expect(() =>
          createReviewSchema.parse({
            rating: 4,
            comment: "Good",
          })
        ).toThrow();

        expect(() =>
          createReviewSchema.parse({
            rating: 4,
            ticketId: 1,
          })
        ).toThrow();

        expect(() =>
          createReviewSchema.parse({
            comment: "Good",
            ticketId: 1,
          })
        ).toThrow();
      });
    });

    describe("numberParser transformation", () => {
      it("should transform both rating and ticketId from strings to numbers", () => {
        const result = createReviewSchema.parse({
          rating: "5",
          comment: "Excellent",
          ticketId: "100",
        });

        expect(typeof result.rating).toBe("number");
        expect(typeof result.ticketId).toBe("number");
        expect(result.rating).toBe(5);
        expect(result.ticketId).toBe(100);
      });

      it("should preserve number types for rating and ticketId", () => {
        const result = createReviewSchema.parse({
          rating: 4,
          comment: "Good",
          ticketId: 200,
        });

        expect(typeof result.rating).toBe("number");
        expect(typeof result.ticketId).toBe("number");
      });
    });
  });

  describe("updateReviewSchema", () => {
    describe("optional fields behavior", () => {
      it("should accept empty object (all fields optional)", () => {
        const result = updateReviewSchema.parse({});

        expect(result).toEqual({});
      });

      it("should accept only rating field", () => {
        const result = updateReviewSchema.parse({
          rating: 4,
        });

        expect(result).toEqual({
          rating: 4,
        });
      });

      it("should accept only comment field", () => {
        const result = updateReviewSchema.parse({
          comment: "Updated comment",
        });

        expect(result).toEqual({
          comment: "Updated comment",
        });
      });

      it("should accept both fields", () => {
        const result = updateReviewSchema.parse({
          rating: 5,
          comment: "Updated review",
        });

        expect(result).toEqual({
          rating: 5,
          comment: "Updated review",
        });
      });

      it("should accept undefined rating", () => {
        const result = updateReviewSchema.parse({
          rating: undefined,
        });

        expect(result.rating).toBeUndefined();
      });

      it("should accept undefined comment", () => {
        const result = updateReviewSchema.parse({
          comment: undefined,
        });

        expect(result.comment).toBeUndefined();
      });
    });

    describe("rating field when provided", () => {
      it("should validate rating between 1 and 5", () => {
        const result = updateReviewSchema.parse({
          rating: 3,
        });

        expect(result.rating).toBe(3);
      });

      it("should transform string rating to number", () => {
        const result = updateReviewSchema.parse({
          rating: "4",
        });

        expect(result.rating).toBe(4);
        expect(typeof result.rating).toBe("number");
      });

      it("should accept rating of 1 when provided", () => {
        const result = updateReviewSchema.parse({
          rating: 1,
        });

        expect(result.rating).toBe(1);
      });

      it("should accept rating of 5 when provided", () => {
        const result = updateReviewSchema.parse({
          rating: 5,
        });

        expect(result.rating).toBe(5);
      });

      it("should accept decimal ratings when provided", () => {
        const result = updateReviewSchema.parse({
          rating: 4.5,
        });

        expect(result.rating).toBe(4.5);
      });

      it("should reject rating of 0 when provided", () => {
        expect(() =>
          updateReviewSchema.parse({
            rating: 0,
          })
        ).toThrow("Rating must be between 1 and 5");
      });

      it("should reject rating greater than 5 when provided", () => {
        expect(() =>
          updateReviewSchema.parse({
            rating: 6,
          })
        ).toThrow("Rating must be between 1 and 5");
      });

      it("should reject negative rating when provided", () => {
        expect(() =>
          updateReviewSchema.parse({
            rating: -2,
          })
        ).toThrow("Rating must be between 1 and 5");
      });

      it("should reject string rating '0' when provided", () => {
        expect(() =>
          updateReviewSchema.parse({
            rating: "0",
          })
        ).toThrow("Rating must be between 1 and 5");
      });

      it("should reject string rating '7' when provided", () => {
        expect(() =>
          updateReviewSchema.parse({
            rating: "7",
          })
        ).toThrow("Rating must be between 1 and 5");
      });
    });

    describe("comment field when provided", () => {
      it("should accept valid comment string", () => {
        const result = updateReviewSchema.parse({
          comment: "Updated review text",
        });

        expect(result.comment).toBe("Updated review text");
      });

      it("should accept single character comment", () => {
        const result = updateReviewSchema.parse({
          comment: "B",
        });

        expect(result.comment).toBe("B");
      });

      it("should accept long comment strings", () => {
        const longComment = "Updated ".repeat(100);
        const result = updateReviewSchema.parse({
          comment: longComment,
        });

        expect(result.comment).toBe(longComment);
      });

      it("should reject empty comment when provided", () => {
        expect(() =>
          updateReviewSchema.parse({
            comment: "",
          })
        ).toThrow("Comment is required");
      });

      it("should reject number as comment when provided", () => {
        expect(() =>
          updateReviewSchema.parse({
            comment: 456,
          })
        ).toThrow();
      });

      it("should reject null as comment when provided", () => {
        expect(() =>
          updateReviewSchema.parse({
            comment: null,
          })
        ).toThrow();
      });
    });

    describe("schema validation", () => {
      it("should validate partial update with rating only", () => {
        const result = updateReviewSchema.parse({
          rating: 5,
        });

        expect(result).toEqual({
          rating: 5,
        });
      });

      it("should validate partial update with comment only", () => {
        const result = updateReviewSchema.parse({
          comment: "New comment",
        });

        expect(result).toEqual({
          comment: "New comment",
        });
      });

      it("should validate complete update with both fields", () => {
        const result = updateReviewSchema.parse({
          rating: 4,
          comment: "Updated completely",
        });

        expect(result).toEqual({
          rating: 4,
          comment: "Updated completely",
        });
      });

      it("should strip unknown fields", () => {
        const result = updateReviewSchema.parse({
          rating: 3,
          unknownField: "value",
        });

        expect(result.unknownField).toBeUndefined();
        expect(result).toEqual({
          rating: 3,
        });
      });

      it("should handle empty object gracefully", () => {
        const result = updateReviewSchema.parse({});

        expect(result).toEqual({});
      });
    });
  });

  describe("getReviewsQuerySchema", () => {
    describe("optional fields", () => {
      it("should accept all query parameters", () => {
        const result = getReviewsQuerySchema.parse({
          page: "1",
          limit: "10",
        });

        expect(result).toEqual({
          page: "1",
          limit: "10",
        });
      });

      it("should accept empty object (all fields optional)", () => {
        const result = getReviewsQuerySchema.parse({});

        expect(result).toEqual({});
      });

      it("should accept only page parameter", () => {
        const result = getReviewsQuerySchema.parse({
          page: "2",
        });

        expect(result).toEqual({
          page: "2",
        });
      });

      it("should accept only limit parameter", () => {
        const result = getReviewsQuerySchema.parse({
          limit: "20",
        });

        expect(result).toEqual({
          limit: "20",
        });
      });

      it("should accept undefined page", () => {
        const result = getReviewsQuerySchema.parse({
          page: undefined,
        });

        expect(result.page).toBeUndefined();
      });

      it("should accept undefined limit", () => {
        const result = getReviewsQuerySchema.parse({
          limit: undefined,
        });

        expect(result.limit).toBeUndefined();
      });
    });

    describe("page field", () => {
      it("should accept valid page string", () => {
        const result = getReviewsQuerySchema.parse({
          page: "5",
        });

        expect(result.page).toBe("5");
        expect(typeof result.page).toBe("string");
      });

      it("should accept page value '0'", () => {
        const result = getReviewsQuerySchema.parse({
          page: "0",
        });

        expect(result.page).toBe("0");
      });

      it("should accept large page numbers as strings", () => {
        const result = getReviewsQuerySchema.parse({
          page: "999",
        });

        expect(result.page).toBe("999");
      });

      it("should accept negative page strings", () => {
        const result = getReviewsQuerySchema.parse({
          page: "-1",
        });

        expect(result.page).toBe("-1");
      });

      it("should accept empty page string", () => {
        const result = getReviewsQuerySchema.parse({
          page: "",
        });

        expect(result.page).toBe("");
      });

      it("should reject number as page", () => {
        expect(() =>
          getReviewsQuerySchema.parse({
            page: 1,
          })
        ).toThrow();
      });

      it("should reject boolean as page", () => {
        expect(() =>
          getReviewsQuerySchema.parse({
            page: true,
          })
        ).toThrow();
      });

      it("should reject null as page", () => {
        expect(() =>
          getReviewsQuerySchema.parse({
            page: null,
          })
        ).toThrow();
      });

      it("should reject array as page", () => {
        expect(() =>
          getReviewsQuerySchema.parse({
            page: ["1"],
          })
        ).toThrow();
      });
    });

    describe("limit field", () => {
      it("should accept valid limit string", () => {
        const result = getReviewsQuerySchema.parse({
          limit: "50",
        });

        expect(result.limit).toBe("50");
        expect(typeof result.limit).toBe("string");
      });

      it("should accept limit value '0'", () => {
        const result = getReviewsQuerySchema.parse({
          limit: "0",
        });

        expect(result.limit).toBe("0");
      });

      it("should accept large limit numbers as strings", () => {
        const result = getReviewsQuerySchema.parse({
          limit: "1000",
        });

        expect(result.limit).toBe("1000");
      });

      it("should accept negative limit strings", () => {
        const result = getReviewsQuerySchema.parse({
          limit: "-5",
        });

        expect(result.limit).toBe("-5");
      });

      it("should accept empty limit string", () => {
        const result = getReviewsQuerySchema.parse({
          limit: "",
        });

        expect(result.limit).toBe("");
      });

      it("should reject number as limit", () => {
        expect(() =>
          getReviewsQuerySchema.parse({
            limit: 10,
          })
        ).toThrow();
      });

      it("should reject boolean as limit", () => {
        expect(() =>
          getReviewsQuerySchema.parse({
            limit: false,
          })
        ).toThrow();
      });

      it("should reject null as limit", () => {
        expect(() =>
          getReviewsQuerySchema.parse({
            limit: null,
          })
        ).toThrow();
      });

      it("should reject array as limit", () => {
        expect(() =>
          getReviewsQuerySchema.parse({
            limit: ["10"],
          })
        ).toThrow();
      });
    });

    describe("schema validation", () => {
      it("should validate complete query object", () => {
        const result = getReviewsQuerySchema.parse({
          page: "3",
          limit: "25",
        });

        expect(result).toEqual({
          page: "3",
          limit: "25",
        });
      });

      it("should strip unknown query fields", () => {
        const result = getReviewsQuerySchema.parse({
          page: "1",
          unknownField: "value",
        });

        expect(result.unknownField).toBeUndefined();
        expect(result).toEqual({
          page: "1",
        });
      });

      it("should handle missing all fields", () => {
        const result = getReviewsQuerySchema.parse({});

        expect(result).toEqual({});
      });

      it("should only accept string types for page and limit", () => {
        const result = getReviewsQuerySchema.parse({
          page: "1",
          limit: "10",
        });

        expect(typeof result.page).toBe("string");
        expect(typeof result.limit).toBe("string");
      });
    });
  });

  describe("error messages", () => {
    it("should provide correct error message for rating validation in createReviewSchema", () => {
      try {
        createReviewSchema.parse({
          rating: 0,
          comment: "Test",
          ticketId: 1,
        });
      } catch (error) {
        expect(error.errors[0].message).toBe("Rating must be between 1 and 5");
      }
    });

    it("should provide correct error message for comment validation in createReviewSchema", () => {
      try {
        createReviewSchema.parse({
          rating: 4,
          comment: "",
          ticketId: 1,
        });
      } catch (error) {
        expect(error.errors[0].message).toBe("Comment is required");
      }
    });

    it("should provide correct error message for rating validation in updateReviewSchema", () => {
      try {
        updateReviewSchema.parse({
          rating: 10,
        });
      } catch (error) {
        expect(error.errors[0].message).toBe("Rating must be between 1 and 5");
      }
    });

    it("should provide correct error message for comment validation in updateReviewSchema", () => {
      try {
        updateReviewSchema.parse({
          comment: "",
        });
      } catch (error) {
        expect(error.errors[0].message).toBe("Comment is required");
      }
    });

    it("should throw ZodError for invalid createReviewSchema", () => {
      expect(() =>
        createReviewSchema.parse({
          rating: 6,
          comment: "Test",
          ticketId: 1,
        })
      ).toThrow();
    });

    it("should throw ZodError for missing required fields in createReviewSchema", () => {
      expect(() =>
        createReviewSchema.parse({
          rating: 4,
        })
      ).toThrow();
    });

    it("should throw ZodError for invalid updateReviewSchema", () => {
      expect(() =>
        updateReviewSchema.parse({
          rating: 0,
        })
      ).toThrow();
    });

    it("should throw ZodError for invalid type in getReviewsQuerySchema", () => {
      expect(() =>
        getReviewsQuerySchema.parse({
          page: 1,
        })
      ).toThrow();
    });
  });

  describe("schema relationships", () => {
    it("should have updateReviewSchema with same validation rules as createReviewSchema", () => {
      // Both should reject rating outside 1-5 range when provided
      expect(() =>
        createReviewSchema.parse({
          rating: 6,
          comment: "Test",
          ticketId: 1,
        })
      ).toThrow("Rating must be between 1 and 5");

      expect(() =>
        updateReviewSchema.parse({
          rating: 6,
        })
      ).toThrow("Rating must be between 1 and 5");
    });

    it("should require all fields in create but not in update", () => {
      expect(() =>
        createReviewSchema.parse({
          rating: 4,
        })
      ).toThrow();

      expect(() =>
        updateReviewSchema.parse({
          rating: 4,
        })
      ).not.toThrow();
    });

    it("should validate same comment rules in both schemas when provided", () => {
      expect(() =>
        createReviewSchema.parse({
          rating: 4,
          comment: "",
          ticketId: 1,
        })
      ).toThrow("Comment is required");

      expect(() =>
        updateReviewSchema.parse({
          comment: "",
        })
      ).toThrow("Comment is required");
    });

    it("should not include ticketId in updateReviewSchema", () => {
      const result = updateReviewSchema.parse({
        rating: 4,
        comment: "Good",
        ticketId: 123,
      });

      expect(result.ticketId).toBeUndefined();
    });
  });
});
