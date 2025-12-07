import { describe, it, expect } from "@jest/globals";
import {
  createTicketSchema,
  updateTicketSchema,
  getTicketsQuerySchema,
} from "../../validators/ticket.validator.js";

describe("Ticket Validator", () => {
  describe("createTicketSchema", () => {
    describe("name field", () => {
      it("should accept valid name string", () => {
        const result = createTicketSchema.parse({
          name: "VIP Ticket",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.name).toBe("VIP Ticket");
      });

      it("should accept single character name", () => {
        const result = createTicketSchema.parse({
          name: "A",
          price: 50000,
          quantity: 10,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.name).toBe("A");
      });

      it("should accept long name strings", () => {
        const longName = "Premium VIP Access Pass with Exclusive Benefits";
        const result = createTicketSchema.parse({
          name: longName,
          price: 200000,
          quantity: 20,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.name).toBe(longName);
      });

      it("should accept name with special characters", () => {
        const result = createTicketSchema.parse({
          name: "VIP Ticket - Early Bird!",
          price: 75000,
          quantity: 30,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.name).toBe("VIP Ticket - Early Bird!");
      });

      it("should reject empty name string", () => {
        expect(() =>
          createTicketSchema.parse({
            name: "",
            price: 100000,
            quantity: 50,
            eventId: 1,
            categoryId: 1,
          })
        ).toThrow();
      });

      it("should reject missing name", () => {
        expect(() =>
          createTicketSchema.parse({
            price: 100000,
            quantity: 50,
            eventId: 1,
            categoryId: 1,
          })
        ).toThrow();
      });

      it("should reject number as name", () => {
        expect(() =>
          createTicketSchema.parse({
            name: 123,
            price: 100000,
            quantity: 50,
            eventId: 1,
            categoryId: 1,
          })
        ).toThrow();
      });

      it("should reject null as name", () => {
        expect(() =>
          createTicketSchema.parse({
            name: null,
            price: 100000,
            quantity: 50,
            eventId: 1,
            categoryId: 1,
          })
        ).toThrow();
      });

      it("should reject boolean as name", () => {
        expect(() =>
          createTicketSchema.parse({
            name: true,
            price: 100000,
            quantity: 50,
            eventId: 1,
            categoryId: 1,
          })
        ).toThrow();
      });
    });

    describe("price field", () => {
      it("should accept valid number price", () => {
        const result = createTicketSchema.parse({
          name: "Regular Ticket",
          price: 150000,
          quantity: 100,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.price).toBe(150000);
        expect(typeof result.price).toBe("number");
      });

      it("should accept valid string price and transform to number", () => {
        const result = createTicketSchema.parse({
          name: "Regular Ticket",
          price: "150000",
          quantity: 100,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.price).toBe(150000);
        expect(typeof result.price).toBe("number");
      });

      it("should accept price of 0", () => {
        const result = createTicketSchema.parse({
          name: "Free Ticket",
          price: "0",
          quantity: 100,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.price).toBe(0);
      });

      it("should accept decimal prices", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 99.99,
          quantity: 50,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.price).toBe(99.99);
      });

      it("should accept string decimal prices", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: "199.50",
          quantity: 50,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.price).toBe(199.5);
      });

      it("should accept negative prices", () => {
        const result = createTicketSchema.parse({
          name: "Discount Ticket",
          price: "-50",
          quantity: 10,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.price).toBe(-50);
      });

      it("should accept large price values", () => {
        const result = createTicketSchema.parse({
          name: "Luxury Ticket",
          price: "999999999",
          quantity: 5,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.price).toBe(999999999);
      });

      it("should reject missing price", () => {
        expect(() =>
          createTicketSchema.parse({
            name: "Ticket",
            quantity: 50,
            eventId: 1,
            categoryId: 1,
          })
        ).toThrow();
      });
    });

    describe("quantity field", () => {
      it("should accept valid number quantity", () => {
        const result = createTicketSchema.parse({
          name: "Regular Ticket",
          price: 100000,
          quantity: 200,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.quantity).toBe(200);
        expect(typeof result.quantity).toBe("number");
      });

      it("should accept valid string quantity and transform to number", () => {
        const result = createTicketSchema.parse({
          name: "Regular Ticket",
          price: 100000,
          quantity: "200",
          eventId: 1,
          categoryId: 1,
        });

        expect(result.quantity).toBe(200);
        expect(typeof result.quantity).toBe("number");
      });

      it("should accept quantity of 0", () => {
        const result = createTicketSchema.parse({
          name: "Sold Out Ticket",
          price: 100000,
          quantity: "0",
          eventId: 1,
          categoryId: 1,
        });

        expect(result.quantity).toBe(0);
      });

      it("should accept large quantity values", () => {
        const result = createTicketSchema.parse({
          name: "Mass Ticket",
          price: 50000,
          quantity: "10000",
          eventId: 1,
          categoryId: 1,
        });

        expect(result.quantity).toBe(10000);
      });

      it("should accept negative quantities", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: "-5",
          eventId: 1,
          categoryId: 1,
        });

        expect(result.quantity).toBe(-5);
      });

      it("should reject missing quantity", () => {
        expect(() =>
          createTicketSchema.parse({
            name: "Ticket",
            price: 100000,
            eventId: 1,
            categoryId: 1,
          })
        ).toThrow();
      });
    });

    describe("eventId field", () => {
      it("should accept valid number eventId", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: 5,
          categoryId: 1,
        });

        expect(result.eventId).toBe(5);
        expect(typeof result.eventId).toBe("number");
      });

      it("should accept valid string eventId and transform to number", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: "5",
          categoryId: 1,
        });

        expect(result.eventId).toBe(5);
        expect(typeof result.eventId).toBe("number");
      });

      it("should accept eventId of 0", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: "0",
          categoryId: 1,
        });

        expect(result.eventId).toBe(0);
      });

      it("should accept large eventId values", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: "999999",
          categoryId: 1,
        });

        expect(result.eventId).toBe(999999);
      });

      it("should reject missing eventId", () => {
        expect(() =>
          createTicketSchema.parse({
            name: "Ticket",
            price: 100000,
            quantity: 50,
            categoryId: 1,
          })
        ).toThrow();
      });
    });

    describe("categoryId field", () => {
      it("should accept valid number categoryId", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: 3,
        });

        expect(result.categoryId).toBe(3);
        expect(typeof result.categoryId).toBe("number");
      });

      it("should accept valid string categoryId and transform to number", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: "3",
        });

        expect(result.categoryId).toBe(3);
        expect(typeof result.categoryId).toBe("number");
      });

      it("should accept categoryId of 0", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: "0",
        });

        expect(result.categoryId).toBe(0);
      });

      it("should accept large categoryId values", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: "888888",
        });

        expect(result.categoryId).toBe(888888);
      });

      it("should reject missing categoryId", () => {
        expect(() =>
          createTicketSchema.parse({
            name: "Ticket",
            price: 100000,
            quantity: 50,
            eventId: 1,
          })
        ).toThrow();
      });
    });

    describe("artist field (optional)", () => {
      it("should accept valid artist string", () => {
        const result = createTicketSchema.parse({
          name: "Concert Ticket",
          price: 250000,
          quantity: 100,
          eventId: 1,
          categoryId: 1,
          artist: "Taylor Swift",
        });

        expect(result.artist).toBe("Taylor Swift");
      });

      it("should accept empty artist string", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: 1,
          artist: "",
        });

        expect(result.artist).toBe("");
      });

      it("should accept long artist names", () => {
        const longArtist =
          "The Amazing Orchestra Featuring Multiple Artists and Performers";
        const result = createTicketSchema.parse({
          name: "Concert Ticket",
          price: 150000,
          quantity: 75,
          eventId: 1,
          categoryId: 1,
          artist: longArtist,
        });

        expect(result.artist).toBe(longArtist);
      });

      it("should accept artist with special characters", () => {
        const result = createTicketSchema.parse({
          name: "Concert Ticket",
          price: 120000,
          quantity: 60,
          eventId: 1,
          categoryId: 1,
          artist: "AC/DC & The Rolling Stones",
        });

        expect(result.artist).toBe("AC/DC & The Rolling Stones");
      });

      it("should accept undefined artist (optional field)", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: 1,
          artist: undefined,
        });

        expect(result.artist).toBeUndefined();
      });

      it("should work without artist field (optional)", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: 1,
        });

        expect(result.artist).toBeUndefined();
      });

      it("should reject number as artist", () => {
        expect(() =>
          createTicketSchema.parse({
            name: "Ticket",
            price: 100000,
            quantity: 50,
            eventId: 1,
            categoryId: 1,
            artist: 123,
          })
        ).toThrow();
      });

      it("should reject null as artist", () => {
        expect(() =>
          createTicketSchema.parse({
            name: "Ticket",
            price: 100000,
            quantity: 50,
            eventId: 1,
            categoryId: 1,
            artist: null,
          })
        ).toThrow();
      });

      it("should reject boolean as artist", () => {
        expect(() =>
          createTicketSchema.parse({
            name: "Ticket",
            price: 100000,
            quantity: 50,
            eventId: 1,
            categoryId: 1,
            artist: true,
          })
        ).toThrow();
      });
    });

    describe("schema validation", () => {
      it("should validate complete valid object with all required fields", () => {
        const result = createTicketSchema.parse({
          name: "VIP Pass",
          price: 300000,
          quantity: 25,
          eventId: 2,
          categoryId: 3,
        });

        expect(result).toEqual({
          name: "VIP Pass",
          price: 300000,
          quantity: 25,
          eventId: 2,
          categoryId: 3,
        });
      });

      it("should validate with all fields including optional artist", () => {
        const result = createTicketSchema.parse({
          name: "Concert Ticket",
          price: "150000",
          quantity: "50",
          eventId: "1",
          categoryId: "2",
          artist: "Ed Sheeran",
        });

        expect(result).toEqual({
          name: "Concert Ticket",
          price: 150000,
          quantity: 50,
          eventId: 1,
          categoryId: 2,
          artist: "Ed Sheeran",
        });
      });

      it("should transform string types to numbers for numeric fields", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: "100000",
          quantity: "50",
          eventId: "1",
          categoryId: "1",
        });

        expect(typeof result.price).toBe("number");
        expect(typeof result.quantity).toBe("number");
        expect(typeof result.eventId).toBe("number");
        expect(typeof result.categoryId).toBe("number");
      });

      it("should preserve number types for numeric fields", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: 1,
        });

        expect(typeof result.price).toBe("number");
        expect(typeof result.quantity).toBe("number");
        expect(typeof result.eventId).toBe("number");
        expect(typeof result.categoryId).toBe("number");
      });

      it("should strip unknown fields", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: 1,
          unknownField: "value",
          anotherUnknown: 123,
        });

        expect(result.unknownField).toBeUndefined();
        expect(result.anotherUnknown).toBeUndefined();
      });

      it("should reject empty object", () => {
        expect(() => createTicketSchema.parse({})).toThrow();
      });

      it("should require all mandatory fields", () => {
        expect(() =>
          createTicketSchema.parse({
            name: "Ticket",
            price: 100000,
            quantity: 50,
            eventId: 1,
          })
        ).toThrow();

        expect(() =>
          createTicketSchema.parse({
            name: "Ticket",
            price: 100000,
            quantity: 50,
            categoryId: 1,
          })
        ).toThrow();

        expect(() =>
          createTicketSchema.parse({
            name: "Ticket",
            price: 100000,
            eventId: 1,
            categoryId: 1,
          })
        ).toThrow();

        expect(() =>
          createTicketSchema.parse({
            name: "Ticket",
            quantity: 50,
            eventId: 1,
            categoryId: 1,
          })
        ).toThrow();

        expect(() =>
          createTicketSchema.parse({
            price: 100000,
            quantity: 50,
            eventId: 1,
            categoryId: 1,
          })
        ).toThrow();
      });
    });

    describe("numberParser transformation", () => {
      it("should transform all numeric fields from strings to numbers", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: "100000",
          quantity: "50",
          eventId: "1",
          categoryId: "2",
        });

        expect(result.price).toBe(100000);
        expect(result.quantity).toBe(50);
        expect(result.eventId).toBe(1);
        expect(result.categoryId).toBe(2);
      });

      it("should handle mixed string and number types", () => {
        const result = createTicketSchema.parse({
          name: "Ticket",
          price: "100000",
          quantity: 50,
          eventId: "1",
          categoryId: 2,
        });

        expect(typeof result.price).toBe("number");
        expect(typeof result.quantity).toBe("number");
        expect(typeof result.eventId).toBe("number");
        expect(typeof result.categoryId).toBe("number");
      });
    });
  });

  describe("updateTicketSchema", () => {
    describe("optional fields behavior", () => {
      it("should accept empty object (all fields optional)", () => {
        const result = updateTicketSchema.parse({});

        expect(result).toEqual({});
      });

      it("should accept only name field", () => {
        const result = updateTicketSchema.parse({
          name: "Updated Ticket",
        });

        expect(result).toEqual({
          name: "Updated Ticket",
        });
      });

      it("should accept only price field", () => {
        const result = updateTicketSchema.parse({
          price: 150000,
        });

        expect(result).toEqual({
          price: 150000,
        });
      });

      it("should accept only quantity field", () => {
        const result = updateTicketSchema.parse({
          quantity: 75,
        });

        expect(result).toEqual({
          quantity: 75,
        });
      });

      it("should accept only artist field", () => {
        const result = updateTicketSchema.parse({
          artist: "New Artist",
        });

        expect(result).toEqual({
          artist: "New Artist",
        });
      });

      it("should accept multiple fields", () => {
        const result = updateTicketSchema.parse({
          name: "Updated VIP",
          price: "200000",
          quantity: "30",
        });

        expect(result).toEqual({
          name: "Updated VIP",
          price: 200000,
          quantity: 30,
        });
      });

      it("should accept all fields", () => {
        const result = updateTicketSchema.parse({
          name: "Premium Ticket",
          price: "250000",
          quantity: "20",
          artist: "Coldplay",
        });

        expect(result).toEqual({
          name: "Premium Ticket",
          price: 250000,
          quantity: 20,
          artist: "Coldplay",
        });
      });

      it("should accept undefined values", () => {
        const result = updateTicketSchema.parse({
          name: undefined,
          price: undefined,
          quantity: undefined,
          artist: undefined,
        });

        expect(result.name).toBeUndefined();
        expect(result.price).toBeUndefined();
        expect(result.quantity).toBeUndefined();
        expect(result.artist).toBeUndefined();
      });
    });

    describe("name field when provided", () => {
      it("should accept valid name string", () => {
        const result = updateTicketSchema.parse({
          name: "Updated Ticket Name",
        });

        expect(result.name).toBe("Updated Ticket Name");
      });

      it("should accept single character name", () => {
        const result = updateTicketSchema.parse({
          name: "X",
        });

        expect(result.name).toBe("X");
      });

      it("should accept long name strings", () => {
        const longName = "Super Premium VIP Exclusive Access Pass";
        const result = updateTicketSchema.parse({
          name: longName,
        });

        expect(result.name).toBe(longName);
      });

      it("should reject empty name when provided", () => {
        expect(() =>
          updateTicketSchema.parse({
            name: "",
          })
        ).toThrow();
      });

      it("should reject number as name when provided", () => {
        expect(() =>
          updateTicketSchema.parse({
            name: 789,
          })
        ).toThrow();
      });

      it("should reject null as name when provided", () => {
        expect(() =>
          updateTicketSchema.parse({
            name: null,
          })
        ).toThrow();
      });
    });

    describe("price field when provided", () => {
      it("should accept valid number price", () => {
        const result = updateTicketSchema.parse({
          price: 180000,
        });

        expect(result.price).toBe(180000);
        expect(typeof result.price).toBe("number");
      });

      it("should transform string price to number", () => {
        const result = updateTicketSchema.parse({
          price: "180000",
        });

        expect(result.price).toBe(180000);
        expect(typeof result.price).toBe("number");
      });

      it("should accept price of 0 when provided", () => {
        const result = updateTicketSchema.parse({
          price: "0",
        });

        expect(result.price).toBe(0);
      });

      it("should accept decimal prices when provided", () => {
        const result = updateTicketSchema.parse({
          price: 149.99,
        });

        expect(result.price).toBe(149.99);
      });

      it("should accept negative prices when provided", () => {
        const result = updateTicketSchema.parse({
          price: "-100",
        });

        expect(result.price).toBe(-100);
      });
    });

    describe("quantity field when provided", () => {
      it("should accept valid number quantity", () => {
        const result = updateTicketSchema.parse({
          quantity: 100,
        });

        expect(result.quantity).toBe(100);
        expect(typeof result.quantity).toBe("number");
      });

      it("should transform string quantity to number", () => {
        const result = updateTicketSchema.parse({
          quantity: "100",
        });

        expect(result.quantity).toBe(100);
        expect(typeof result.quantity).toBe("number");
      });

      it("should accept quantity of 0 when provided", () => {
        const result = updateTicketSchema.parse({
          quantity: "0",
        });

        expect(result.quantity).toBe(0);
      });

      it("should accept large quantities when provided", () => {
        const result = updateTicketSchema.parse({
          quantity: "5000",
        });

        expect(result.quantity).toBe(5000);
      });
    });

    describe("artist field when provided", () => {
      it("should accept valid artist string", () => {
        const result = updateTicketSchema.parse({
          artist: "Updated Artist Name",
        });

        expect(result.artist).toBe("Updated Artist Name");
      });

      it("should accept empty artist string", () => {
        const result = updateTicketSchema.parse({
          artist: "",
        });

        expect(result.artist).toBe("");
      });

      it("should accept long artist names", () => {
        const longArtist = "The New Amazing Band with Multiple Members";
        const result = updateTicketSchema.parse({
          artist: longArtist,
        });

        expect(result.artist).toBe(longArtist);
      });

      it("should reject number as artist when provided", () => {
        expect(() =>
          updateTicketSchema.parse({
            artist: 456,
          })
        ).toThrow();
      });

      it("should reject null as artist when provided", () => {
        expect(() =>
          updateTicketSchema.parse({
            artist: null,
          })
        ).toThrow();
      });
    });

    describe("schema validation", () => {
      it("should validate partial update with single field", () => {
        const result = updateTicketSchema.parse({
          name: "New Name",
        });

        expect(result).toEqual({
          name: "New Name",
        });
      });

      it("should validate partial update with multiple fields", () => {
        const result = updateTicketSchema.parse({
          name: "Updated VIP",
          price: "300000",
        });

        expect(result).toEqual({
          name: "Updated VIP",
          price: 300000,
        });
      });

      it("should validate complete update with all fields", () => {
        const result = updateTicketSchema.parse({
          name: "Full Update",
          price: "400000",
          quantity: "10",
          artist: "New Artist",
        });

        expect(result).toEqual({
          name: "Full Update",
          price: 400000,
          quantity: 10,
          artist: "New Artist",
        });
      });

      it("should strip unknown fields", () => {
        const result = updateTicketSchema.parse({
          name: "Ticket",
          unknownField: "value",
        });

        expect(result.unknownField).toBeUndefined();
        expect(result).toEqual({
          name: "Ticket",
        });
      });

      it("should handle empty object gracefully", () => {
        const result = updateTicketSchema.parse({});

        expect(result).toEqual({});
      });

      it("should not include eventId or categoryId fields", () => {
        const result = updateTicketSchema.parse({
          name: "Ticket",
          eventId: 5,
          categoryId: 3,
        });

        expect(result.eventId).toBeUndefined();
        expect(result.categoryId).toBeUndefined();
      });
    });

    describe("numberParser transformation", () => {
      it("should transform price and quantity from strings to numbers", () => {
        const result = updateTicketSchema.parse({
          price: "200000",
          quantity: "50",
        });

        expect(typeof result.price).toBe("number");
        expect(typeof result.quantity).toBe("number");
        expect(result.price).toBe(200000);
        expect(result.quantity).toBe(50);
      });

      it("should handle mixed string and number types", () => {
        const result = updateTicketSchema.parse({
          price: "150000",
          quantity: 75,
        });

        expect(typeof result.price).toBe("number");
        expect(typeof result.quantity).toBe("number");
      });
    });
  });

  describe("getTicketsQuerySchema", () => {
    describe("optional fields", () => {
      it("should accept all query parameters", () => {
        const result = getTicketsQuerySchema.parse({
          page: "1",
          limit: "10",
          search: "VIP",
          minPrice: "50000",
          maxPrice: "500000",
          artist: "Taylor Swift",
          eventId: "5",
          categoryId: "2",
        });

        expect(result).toEqual({
          page: "1",
          limit: "10",
          search: "VIP",
          minPrice: "50000",
          maxPrice: "500000",
          artist: "Taylor Swift",
          eventId: "5",
          categoryId: "2",
        });
      });

      it("should accept empty object (all fields optional)", () => {
        const result = getTicketsQuerySchema.parse({});

        expect(result).toEqual({});
      });

      it("should accept subset of parameters", () => {
        const result = getTicketsQuerySchema.parse({
          page: "2",
          limit: "20",
          search: "Concert",
        });

        expect(result).toEqual({
          page: "2",
          limit: "20",
          search: "Concert",
        });
      });

      it("should accept undefined values", () => {
        const result = getTicketsQuerySchema.parse({
          page: undefined,
          limit: undefined,
          search: undefined,
        });

        expect(result.page).toBeUndefined();
        expect(result.limit).toBeUndefined();
        expect(result.search).toBeUndefined();
      });
    });

    describe("page field", () => {
      it("should accept valid page string", () => {
        const result = getTicketsQuerySchema.parse({
          page: "3",
        });

        expect(result.page).toBe("3");
        expect(typeof result.page).toBe("string");
      });

      it("should accept page value '0'", () => {
        const result = getTicketsQuerySchema.parse({
          page: "0",
        });

        expect(result.page).toBe("0");
      });

      it("should accept large page numbers as strings", () => {
        const result = getTicketsQuerySchema.parse({
          page: "999",
        });

        expect(result.page).toBe("999");
      });

      it("should accept negative page strings", () => {
        const result = getTicketsQuerySchema.parse({
          page: "-1",
        });

        expect(result.page).toBe("-1");
      });

      it("should accept empty page string", () => {
        const result = getTicketsQuerySchema.parse({
          page: "",
        });

        expect(result.page).toBe("");
      });

      it("should reject number as page", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            page: 1,
          })
        ).toThrow();
      });

      it("should reject boolean as page", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            page: true,
          })
        ).toThrow();
      });

      it("should reject null as page", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            page: null,
          })
        ).toThrow();
      });
    });

    describe("limit field", () => {
      it("should accept valid limit string", () => {
        const result = getTicketsQuerySchema.parse({
          limit: "25",
        });

        expect(result.limit).toBe("25");
        expect(typeof result.limit).toBe("string");
      });

      it("should accept limit value '0'", () => {
        const result = getTicketsQuerySchema.parse({
          limit: "0",
        });

        expect(result.limit).toBe("0");
      });

      it("should accept large limit numbers as strings", () => {
        const result = getTicketsQuerySchema.parse({
          limit: "1000",
        });

        expect(result.limit).toBe("1000");
      });

      it("should accept empty limit string", () => {
        const result = getTicketsQuerySchema.parse({
          limit: "",
        });

        expect(result.limit).toBe("");
      });

      it("should reject number as limit", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            limit: 10,
          })
        ).toThrow();
      });

      it("should reject boolean as limit", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            limit: false,
          })
        ).toThrow();
      });

      it("should reject null as limit", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            limit: null,
          })
        ).toThrow();
      });
    });

    describe("search field", () => {
      it("should accept valid search string", () => {
        const result = getTicketsQuerySchema.parse({
          search: "VIP Ticket",
        });

        expect(result.search).toBe("VIP Ticket");
        expect(typeof result.search).toBe("string");
      });

      it("should accept empty search string", () => {
        const result = getTicketsQuerySchema.parse({
          search: "",
        });

        expect(result.search).toBe("");
      });

      it("should accept long search strings", () => {
        const longSearch =
          "Concert Ticket with Premium Access and Special Benefits";
        const result = getTicketsQuerySchema.parse({
          search: longSearch,
        });

        expect(result.search).toBe(longSearch);
      });

      it("should accept search with special characters", () => {
        const result = getTicketsQuerySchema.parse({
          search: "VIP & Premium - Early Bird!",
        });

        expect(result.search).toBe("VIP & Premium - Early Bird!");
      });

      it("should reject number as search", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            search: 123,
          })
        ).toThrow();
      });

      it("should reject boolean as search", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            search: true,
          })
        ).toThrow();
      });

      it("should reject null as search", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            search: null,
          })
        ).toThrow();
      });
    });

    describe("minPrice field", () => {
      it("should accept valid minPrice string", () => {
        const result = getTicketsQuerySchema.parse({
          minPrice: "50000",
        });

        expect(result.minPrice).toBe("50000");
        expect(typeof result.minPrice).toBe("string");
      });

      it("should accept minPrice value '0'", () => {
        const result = getTicketsQuerySchema.parse({
          minPrice: "0",
        });

        expect(result.minPrice).toBe("0");
      });

      it("should accept large minPrice values as strings", () => {
        const result = getTicketsQuerySchema.parse({
          minPrice: "1000000",
        });

        expect(result.minPrice).toBe("1000000");
      });

      it("should accept negative minPrice strings", () => {
        const result = getTicketsQuerySchema.parse({
          minPrice: "-100",
        });

        expect(result.minPrice).toBe("-100");
      });

      it("should accept empty minPrice string", () => {
        const result = getTicketsQuerySchema.parse({
          minPrice: "",
        });

        expect(result.minPrice).toBe("");
      });

      it("should reject number as minPrice", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            minPrice: 50000,
          })
        ).toThrow();
      });

      it("should reject boolean as minPrice", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            minPrice: false,
          })
        ).toThrow();
      });

      it("should reject null as minPrice", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            minPrice: null,
          })
        ).toThrow();
      });
    });

    describe("maxPrice field", () => {
      it("should accept valid maxPrice string", () => {
        const result = getTicketsQuerySchema.parse({
          maxPrice: "500000",
        });

        expect(result.maxPrice).toBe("500000");
        expect(typeof result.maxPrice).toBe("string");
      });

      it("should accept maxPrice value '0'", () => {
        const result = getTicketsQuerySchema.parse({
          maxPrice: "0",
        });

        expect(result.maxPrice).toBe("0");
      });

      it("should accept large maxPrice values as strings", () => {
        const result = getTicketsQuerySchema.parse({
          maxPrice: "9999999",
        });

        expect(result.maxPrice).toBe("9999999");
      });

      it("should accept empty maxPrice string", () => {
        const result = getTicketsQuerySchema.parse({
          maxPrice: "",
        });

        expect(result.maxPrice).toBe("");
      });

      it("should reject number as maxPrice", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            maxPrice: 500000,
          })
        ).toThrow();
      });

      it("should reject boolean as maxPrice", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            maxPrice: true,
          })
        ).toThrow();
      });

      it("should reject null as maxPrice", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            maxPrice: null,
          })
        ).toThrow();
      });
    });

    describe("artist field", () => {
      it("should accept valid artist string", () => {
        const result = getTicketsQuerySchema.parse({
          artist: "Ed Sheeran",
        });

        expect(result.artist).toBe("Ed Sheeran");
        expect(typeof result.artist).toBe("string");
      });

      it("should accept empty artist string", () => {
        const result = getTicketsQuerySchema.parse({
          artist: "",
        });

        expect(result.artist).toBe("");
      });

      it("should accept long artist names", () => {
        const longArtist = "The Amazing Orchestra and Symphony Performers";
        const result = getTicketsQuerySchema.parse({
          artist: longArtist,
        });

        expect(result.artist).toBe(longArtist);
      });

      it("should accept artist with special characters", () => {
        const result = getTicketsQuerySchema.parse({
          artist: "AC/DC & Friends",
        });

        expect(result.artist).toBe("AC/DC & Friends");
      });

      it("should reject number as artist", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            artist: 789,
          })
        ).toThrow();
      });

      it("should reject boolean as artist", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            artist: false,
          })
        ).toThrow();
      });

      it("should reject null as artist", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            artist: null,
          })
        ).toThrow();
      });
    });

    describe("eventId field", () => {
      it("should accept valid eventId string", () => {
        const result = getTicketsQuerySchema.parse({
          eventId: "10",
        });

        expect(result.eventId).toBe("10");
        expect(typeof result.eventId).toBe("string");
      });

      it("should accept eventId value '0'", () => {
        const result = getTicketsQuerySchema.parse({
          eventId: "0",
        });

        expect(result.eventId).toBe("0");
      });

      it("should accept large eventId values as strings", () => {
        const result = getTicketsQuerySchema.parse({
          eventId: "999999",
        });

        expect(result.eventId).toBe("999999");
      });

      it("should accept empty eventId string", () => {
        const result = getTicketsQuerySchema.parse({
          eventId: "",
        });

        expect(result.eventId).toBe("");
      });

      it("should reject number as eventId", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            eventId: 10,
          })
        ).toThrow();
      });

      it("should reject boolean as eventId", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            eventId: true,
          })
        ).toThrow();
      });

      it("should reject null as eventId", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            eventId: null,
          })
        ).toThrow();
      });
    });

    describe("categoryId field", () => {
      it("should accept valid categoryId string", () => {
        const result = getTicketsQuerySchema.parse({
          categoryId: "5",
        });

        expect(result.categoryId).toBe("5");
        expect(typeof result.categoryId).toBe("string");
      });

      it("should accept categoryId value '0'", () => {
        const result = getTicketsQuerySchema.parse({
          categoryId: "0",
        });

        expect(result.categoryId).toBe("0");
      });

      it("should accept large categoryId values as strings", () => {
        const result = getTicketsQuerySchema.parse({
          categoryId: "888888",
        });

        expect(result.categoryId).toBe("888888");
      });

      it("should accept empty categoryId string", () => {
        const result = getTicketsQuerySchema.parse({
          categoryId: "",
        });

        expect(result.categoryId).toBe("");
      });

      it("should reject number as categoryId", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            categoryId: 5,
          })
        ).toThrow();
      });

      it("should reject boolean as categoryId", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            categoryId: false,
          })
        ).toThrow();
      });

      it("should reject null as categoryId", () => {
        expect(() =>
          getTicketsQuerySchema.parse({
            categoryId: null,
          })
        ).toThrow();
      });
    });

    describe("schema validation", () => {
      it("should validate complete query object with all parameters", () => {
        const result = getTicketsQuerySchema.parse({
          page: "1",
          limit: "10",
          search: "VIP",
          minPrice: "100000",
          maxPrice: "500000",
          artist: "Coldplay",
          eventId: "3",
          categoryId: "2",
        });

        expect(result).toEqual({
          page: "1",
          limit: "10",
          search: "VIP",
          minPrice: "100000",
          maxPrice: "500000",
          artist: "Coldplay",
          eventId: "3",
          categoryId: "2",
        });
      });

      it("should validate query with pagination only", () => {
        const result = getTicketsQuerySchema.parse({
          page: "2",
          limit: "20",
        });

        expect(result).toEqual({
          page: "2",
          limit: "20",
        });
      });

      it("should validate query with price filters only", () => {
        const result = getTicketsQuerySchema.parse({
          minPrice: "50000",
          maxPrice: "200000",
        });

        expect(result).toEqual({
          minPrice: "50000",
          maxPrice: "200000",
        });
      });

      it("should validate query with search and filters", () => {
        const result = getTicketsQuerySchema.parse({
          search: "Concert",
          artist: "Taylor Swift",
          eventId: "5",
        });

        expect(result).toEqual({
          search: "Concert",
          artist: "Taylor Swift",
          eventId: "5",
        });
      });

      it("should strip unknown query fields", () => {
        const result = getTicketsQuerySchema.parse({
          page: "1",
          unknownField: "value",
          anotherUnknown: 123,
        });

        expect(result.unknownField).toBeUndefined();
        expect(result.anotherUnknown).toBeUndefined();
        expect(result).toEqual({
          page: "1",
        });
      });

      it("should handle empty object gracefully", () => {
        const result = getTicketsQuerySchema.parse({});

        expect(result).toEqual({});
      });

      it("should only accept string types for all fields", () => {
        const result = getTicketsQuerySchema.parse({
          page: "1",
          limit: "10",
          search: "VIP",
          minPrice: "50000",
          maxPrice: "500000",
          artist: "Artist",
          eventId: "1",
          categoryId: "2",
        });

        expect(typeof result.page).toBe("string");
        expect(typeof result.limit).toBe("string");
        expect(typeof result.search).toBe("string");
        expect(typeof result.minPrice).toBe("string");
        expect(typeof result.maxPrice).toBe("string");
        expect(typeof result.artist).toBe("string");
        expect(typeof result.eventId).toBe("string");
        expect(typeof result.categoryId).toBe("string");
      });
    });
  });

  describe("error messages and error handling", () => {
    it("should throw ZodError for invalid createTicketSchema", () => {
      expect(() =>
        createTicketSchema.parse({
          name: "",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: 1,
        })
      ).toThrow();
    });

    it("should throw ZodError for missing required fields in createTicketSchema", () => {
      expect(() =>
        createTicketSchema.parse({
          name: "Ticket",
        })
      ).toThrow();
    });

    it("should throw ZodError for invalid updateTicketSchema", () => {
      expect(() =>
        updateTicketSchema.parse({
          name: "",
        })
      ).toThrow();
    });

    it("should throw ZodError for invalid type in getTicketsQuerySchema", () => {
      expect(() =>
        getTicketsQuerySchema.parse({
          page: 1,
        })
      ).toThrow();
    });

    it("should provide validation errors for multiple invalid fields", () => {
      try {
        createTicketSchema.parse({
          name: "",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: 1,
        });
      } catch (error) {
        expect(error.errors).toBeDefined();
        expect(error.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("schema relationships", () => {
    it("should have updateTicketSchema with same validation rules as createTicketSchema for shared fields", () => {
      // Both should reject empty name when provided
      expect(() =>
        createTicketSchema.parse({
          name: "",
          price: 100000,
          quantity: 50,
          eventId: 1,
          categoryId: 1,
        })
      ).toThrow();

      expect(() =>
        updateTicketSchema.parse({
          name: "",
        })
      ).toThrow();
    });

    it("should require all fields in create but not in update", () => {
      expect(() =>
        createTicketSchema.parse({
          name: "Ticket",
        })
      ).toThrow();

      expect(() =>
        updateTicketSchema.parse({
          name: "Ticket",
        })
      ).not.toThrow();
    });

    it("should validate same numberParser transformation in both create and update schemas", () => {
      const createResult = createTicketSchema.parse({
        name: "Ticket",
        price: "100000",
        quantity: "50",
        eventId: 1,
        categoryId: 1,
      });

      const updateResult = updateTicketSchema.parse({
        price: "100000",
        quantity: "50",
      });

      expect(typeof createResult.price).toBe("number");
      expect(typeof createResult.quantity).toBe("number");
      expect(typeof updateResult.price).toBe("number");
      expect(typeof updateResult.quantity).toBe("number");
    });

    it("should not include eventId and categoryId in updateTicketSchema", () => {
      const result = updateTicketSchema.parse({
        name: "Ticket",
        eventId: 5,
        categoryId: 3,
      });

      expect(result.eventId).toBeUndefined();
      expect(result.categoryId).toBeUndefined();
    });

    it("should have getTicketsQuerySchema accept eventId and categoryId as strings", () => {
      const result = getTicketsQuerySchema.parse({
        eventId: "5",
        categoryId: "3",
      });

      expect(typeof result.eventId).toBe("string");
      expect(typeof result.categoryId).toBe("string");
      expect(result.eventId).toBe("5");
      expect(result.categoryId).toBe("3");
    });
  });
});
