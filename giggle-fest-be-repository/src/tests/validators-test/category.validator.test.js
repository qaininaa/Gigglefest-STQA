import { describe, it, expect } from "@jest/globals";
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesQuerySchema,
} from "../../validators/category.validator.js";

describe("Category Validator", () => {
  describe("createCategorySchema", () => {
    describe("name field", () => {
      it("should accept valid name string", () => {
        const result = createCategorySchema.parse({
          name: "Music",
        });

        expect(result.name).toBe("Music");
      });

      it("should accept name with multiple words", () => {
        const result = createCategorySchema.parse({
          name: "Music and Entertainment",
        });

        expect(result.name).toBe("Music and Entertainment");
      });

      it("should accept name with special characters", () => {
        const result = createCategorySchema.parse({
          name: "Rock & Roll",
        });

        expect(result.name).toBe("Rock & Roll");
      });

      it("should accept name with numbers", () => {
        const result = createCategorySchema.parse({
          name: "Festival 2024",
        });

        expect(result.name).toBe("Festival 2024");
      });

      it("should accept single character name", () => {
        const result = createCategorySchema.parse({
          name: "A",
        });

        expect(result.name).toBe("A");
      });

      it("should accept long name strings", () => {
        const longName = "A".repeat(100);
        const result = createCategorySchema.parse({
          name: longName,
        });

        expect(result.name).toBe(longName);
      });

      it("should reject empty string name", () => {
        expect(() =>
          createCategorySchema.parse({
            name: "",
          })
        ).toThrow();
      });

      it("should reject missing name field", () => {
        expect(() => createCategorySchema.parse({})).toThrow();
      });

      it("should reject null name", () => {
        expect(() =>
          createCategorySchema.parse({
            name: null,
          })
        ).toThrow();
      });

      it("should reject undefined name", () => {
        expect(() =>
          createCategorySchema.parse({
            name: undefined,
          })
        ).toThrow();
      });

      it("should reject number as name", () => {
        expect(() =>
          createCategorySchema.parse({
            name: 123,
          })
        ).toThrow();
      });

      it("should reject boolean as name", () => {
        expect(() =>
          createCategorySchema.parse({
            name: true,
          })
        ).toThrow();
      });

      it("should reject array as name", () => {
        expect(() =>
          createCategorySchema.parse({
            name: ["Music"],
          })
        ).toThrow();
      });

      it("should reject object as name", () => {
        expect(() =>
          createCategorySchema.parse({
            name: { value: "Music" },
          })
        ).toThrow();
      });
    });

    describe("schema validation", () => {
      it("should validate complete valid object", () => {
        const result = createCategorySchema.parse({
          name: "Sports",
        });

        expect(result).toEqual({
          name: "Sports",
        });
      });

      it("should only require name field", () => {
        const result = createCategorySchema.parse({
          name: "Concert",
        });

        expect(Object.keys(result)).toEqual(["name"]);
      });

      it("should strip unknown fields", () => {
        const result = createCategorySchema.parse({
          name: "Music",
          unknownField: "value",
        });

        expect(result.unknownField).toBeUndefined();
        expect(result).toEqual({
          name: "Music",
        });
      });
    });
  });

  describe("updateCategorySchema", () => {
    describe("partial schema behavior", () => {
      it("should accept valid name for update", () => {
        const result = updateCategorySchema.parse({
          name: "Updated Music",
        });

        expect(result.name).toBe("Updated Music");
      });

      it("should accept empty object (all fields optional)", () => {
        const result = updateCategorySchema.parse({});

        expect(result).toEqual({});
      });

      it("should accept undefined name", () => {
        const result = updateCategorySchema.parse({
          name: undefined,
        });

        expect(result).toEqual({});
      });

      it("should accept object without name field", () => {
        const result = updateCategorySchema.parse({});

        expect(result.name).toBeUndefined();
      });
    });

    describe("name field when provided", () => {
      it("should validate name when provided", () => {
        const result = updateCategorySchema.parse({
          name: "Sports Event",
        });

        expect(result.name).toBe("Sports Event");
      });

      it("should reject empty string name when provided", () => {
        expect(() =>
          updateCategorySchema.parse({
            name: "",
          })
        ).toThrow();
      });

      it("should reject null name when provided", () => {
        expect(() =>
          updateCategorySchema.parse({
            name: null,
          })
        ).toThrow();
      });

      it("should reject number as name when provided", () => {
        expect(() =>
          updateCategorySchema.parse({
            name: 456,
          })
        ).toThrow();
      });

      it("should reject boolean as name when provided", () => {
        expect(() =>
          updateCategorySchema.parse({
            name: false,
          })
        ).toThrow();
      });

      it("should accept single character name when provided", () => {
        const result = updateCategorySchema.parse({
          name: "B",
        });

        expect(result.name).toBe("B");
      });

      it("should accept long name when provided", () => {
        const longName = "Category Name".repeat(20);
        const result = updateCategorySchema.parse({
          name: longName,
        });

        expect(result.name).toBe(longName);
      });
    });

    describe("schema validation", () => {
      it("should validate complete valid update object", () => {
        const result = updateCategorySchema.parse({
          name: "Updated Category",
        });

        expect(result).toEqual({
          name: "Updated Category",
        });
      });

      it("should strip unknown fields", () => {
        const result = updateCategorySchema.parse({
          name: "Music",
          unknownField: "value",
        });

        expect(result.unknownField).toBeUndefined();
        expect(result).toEqual({
          name: "Music",
        });
      });

      it("should handle partial updates correctly", () => {
        const result = updateCategorySchema.parse({});

        expect(result).toEqual({});
      });
    });
  });

  describe("getCategoriesQuerySchema", () => {
    describe("optional fields", () => {
      it("should accept all query parameters", () => {
        const result = getCategoriesQuerySchema.parse({
          page: "1",
          limit: "10",
          search: "music",
        });

        expect(result).toEqual({
          page: "1",
          limit: "10",
          search: "music",
        });
      });

      it("should accept empty object (all fields optional)", () => {
        const result = getCategoriesQuerySchema.parse({});

        expect(result).toEqual({});
      });

      it("should accept only page parameter", () => {
        const result = getCategoriesQuerySchema.parse({
          page: "2",
        });

        expect(result).toEqual({
          page: "2",
        });
      });

      it("should accept only limit parameter", () => {
        const result = getCategoriesQuerySchema.parse({
          limit: "20",
        });

        expect(result).toEqual({
          limit: "20",
        });
      });

      it("should accept only search parameter", () => {
        const result = getCategoriesQuerySchema.parse({
          search: "concert",
        });

        expect(result).toEqual({
          search: "concert",
        });
      });

      it("should accept page and limit only", () => {
        const result = getCategoriesQuerySchema.parse({
          page: "3",
          limit: "15",
        });

        expect(result).toEqual({
          page: "3",
          limit: "15",
        });
      });

      it("should accept page and search only", () => {
        const result = getCategoriesQuerySchema.parse({
          page: "1",
          search: "sports",
        });

        expect(result).toEqual({
          page: "1",
          search: "sports",
        });
      });

      it("should accept limit and search only", () => {
        const result = getCategoriesQuerySchema.parse({
          limit: "25",
          search: "festival",
        });

        expect(result).toEqual({
          limit: "25",
          search: "festival",
        });
      });
    });

    describe("page field", () => {
      it("should accept valid page string", () => {
        const result = getCategoriesQuerySchema.parse({
          page: "5",
        });

        expect(result.page).toBe("5");
      });

      it("should accept page value '0'", () => {
        const result = getCategoriesQuerySchema.parse({
          page: "0",
        });

        expect(result.page).toBe("0");
      });

      it("should accept large page numbers as strings", () => {
        const result = getCategoriesQuerySchema.parse({
          page: "999",
        });

        expect(result.page).toBe("999");
      });

      it("should accept undefined page", () => {
        const result = getCategoriesQuerySchema.parse({
          page: undefined,
        });

        expect(result.page).toBeUndefined();
      });

      it("should reject number as page", () => {
        expect(() =>
          getCategoriesQuerySchema.parse({
            page: 1,
          })
        ).toThrow();
      });

      it("should reject boolean as page", () => {
        expect(() =>
          getCategoriesQuerySchema.parse({
            page: true,
          })
        ).toThrow();
      });

      it("should reject null as page", () => {
        expect(() =>
          getCategoriesQuerySchema.parse({
            page: null,
          })
        ).toThrow();
      });
    });

    describe("limit field", () => {
      it("should accept valid limit string", () => {
        const result = getCategoriesQuerySchema.parse({
          limit: "50",
        });

        expect(result.limit).toBe("50");
      });

      it("should accept limit value '0'", () => {
        const result = getCategoriesQuerySchema.parse({
          limit: "0",
        });

        expect(result.limit).toBe("0");
      });

      it("should accept large limit numbers as strings", () => {
        const result = getCategoriesQuerySchema.parse({
          limit: "1000",
        });

        expect(result.limit).toBe("1000");
      });

      it("should accept undefined limit", () => {
        const result = getCategoriesQuerySchema.parse({
          limit: undefined,
        });

        expect(result.limit).toBeUndefined();
      });

      it("should reject number as limit", () => {
        expect(() =>
          getCategoriesQuerySchema.parse({
            limit: 10,
          })
        ).toThrow();
      });

      it("should reject boolean as limit", () => {
        expect(() =>
          getCategoriesQuerySchema.parse({
            limit: false,
          })
        ).toThrow();
      });

      it("should reject null as limit", () => {
        expect(() =>
          getCategoriesQuerySchema.parse({
            limit: null,
          })
        ).toThrow();
      });
    });

    describe("search field", () => {
      it("should accept valid search string", () => {
        const result = getCategoriesQuerySchema.parse({
          search: "rock music",
        });

        expect(result.search).toBe("rock music");
      });

      it("should accept empty search string", () => {
        const result = getCategoriesQuerySchema.parse({
          search: "",
        });

        expect(result.search).toBe("");
      });

      it("should accept search with special characters", () => {
        const result = getCategoriesQuerySchema.parse({
          search: "rock & roll",
        });

        expect(result.search).toBe("rock & roll");
      });

      it("should accept search with numbers", () => {
        const result = getCategoriesQuerySchema.parse({
          search: "festival 2024",
        });

        expect(result.search).toBe("festival 2024");
      });

      it("should accept long search strings", () => {
        const longSearch = "a".repeat(100);
        const result = getCategoriesQuerySchema.parse({
          search: longSearch,
        });

        expect(result.search).toBe(longSearch);
      });

      it("should accept undefined search", () => {
        const result = getCategoriesQuerySchema.parse({
          search: undefined,
        });

        expect(result.search).toBeUndefined();
      });

      it("should reject number as search", () => {
        expect(() =>
          getCategoriesQuerySchema.parse({
            search: 123,
          })
        ).toThrow();
      });

      it("should reject boolean as search", () => {
        expect(() =>
          getCategoriesQuerySchema.parse({
            search: true,
          })
        ).toThrow();
      });

      it("should reject null as search", () => {
        expect(() =>
          getCategoriesQuerySchema.parse({
            search: null,
          })
        ).toThrow();
      });

      it("should reject array as search", () => {
        expect(() =>
          getCategoriesQuerySchema.parse({
            search: ["music"],
          })
        ).toThrow();
      });
    });

    describe("schema validation", () => {
      it("should validate complete query object", () => {
        const result = getCategoriesQuerySchema.parse({
          page: "1",
          limit: "10",
          search: "test",
        });

        expect(result).toEqual({
          page: "1",
          limit: "10",
          search: "test",
        });
      });

      it("should strip unknown query fields", () => {
        const result = getCategoriesQuerySchema.parse({
          page: "1",
          unknownField: "value",
        });

        expect(result.unknownField).toBeUndefined();
        expect(result).toEqual({
          page: "1",
        });
      });

      it("should handle missing all fields", () => {
        const result = getCategoriesQuerySchema.parse({});

        expect(result).toEqual({});
      });
    });
  });

  describe("schema relationships", () => {
    it("should have updateCategorySchema as partial of createCategorySchema", () => {
      const createResult = createCategorySchema.parse({
        name: "Music",
      });

      const updateResult = updateCategorySchema.parse({
        name: "Music",
      });

      expect(createResult).toEqual(updateResult);
    });

    it("should require name in create but not in update", () => {
      expect(() => createCategorySchema.parse({})).toThrow();
      expect(() => updateCategorySchema.parse({})).not.toThrow();
    });

    it("should validate same name rules when provided in both schemas", () => {
      expect(() =>
        createCategorySchema.parse({
          name: "",
        })
      ).toThrow();

      expect(() =>
        updateCategorySchema.parse({
          name: "",
        })
      ).toThrow();
    });
  });

  describe("error handling", () => {
    it("should throw ZodError for invalid createCategorySchema", () => {
      expect(() =>
        createCategorySchema.parse({
          name: "",
        })
      ).toThrow();
    });

    it("should throw ZodError for missing required field in createCategorySchema", () => {
      expect(() => createCategorySchema.parse({})).toThrow();
    });

    it("should throw ZodError for invalid type in getCategoriesQuerySchema", () => {
      expect(() =>
        getCategoriesQuerySchema.parse({
          page: 1,
        })
      ).toThrow();
    });

    it("should throw ZodError for invalid updateCategorySchema when name is empty", () => {
      expect(() =>
        updateCategorySchema.parse({
          name: "",
        })
      ).toThrow();
    });
  });
});
