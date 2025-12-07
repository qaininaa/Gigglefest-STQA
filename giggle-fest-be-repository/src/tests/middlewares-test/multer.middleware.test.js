import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { upload } from "../../middlewares/multer.middleware.js";

describe("Multer Middleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Mock request object
    mockReq = {
      file: null,
      files: null,
      body: {},
      headers: {},
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe("upload configuration", () => {
    it("should be defined", () => {
      expect(upload).toBeDefined();
    });

    it("should be a multer instance", () => {
      expect(upload).toHaveProperty("single");
      expect(upload).toHaveProperty("array");
      expect(upload).toHaveProperty("fields");
      expect(upload).toHaveProperty("any");
      expect(upload).toHaveProperty("none");
    });

    it("should have storage configuration", () => {
      expect(upload.storage).toBeDefined();
    });
  });

  describe("fileFilter - image validation", () => {
    it("should accept image/jpeg files", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake image data"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should accept image/png files", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "test.png",
        encoding: "7bit",
        mimetype: "image/png",
        buffer: Buffer.from("fake image data"),
        size: 2048,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should accept image/gif files", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "test.gif",
        encoding: "7bit",
        mimetype: "image/gif",
        buffer: Buffer.from("fake image data"),
        size: 1500,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should accept image/webp files", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "test.webp",
        encoding: "7bit",
        mimetype: "image/webp",
        buffer: Buffer.from("fake image data"),
        size: 3000,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should accept image/svg+xml files", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "test.svg",
        encoding: "7bit",
        mimetype: "image/svg+xml",
        buffer: Buffer.from("fake svg data"),
        size: 800,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should accept image/bmp files", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "test.bmp",
        encoding: "7bit",
        mimetype: "image/bmp",
        buffer: Buffer.from("fake image data"),
        size: 4096,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should reject non-image files (application/pdf)", (done) => {
      const mockFile = {
        fieldname: "document",
        originalname: "test.pdf",
        encoding: "7bit",
        mimetype: "application/pdf",
        buffer: Buffer.from("fake pdf data"),
        size: 2048,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Only images are allowed");
        expect(result).toBeUndefined();
        done();
      });
    });

    it("should reject text files", (done) => {
      const mockFile = {
        fieldname: "file",
        originalname: "test.txt",
        encoding: "7bit",
        mimetype: "text/plain",
        buffer: Buffer.from("text content"),
        size: 512,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Only images are allowed");
        done();
      });
    });

    it("should reject video files", (done) => {
      const mockFile = {
        fieldname: "video",
        originalname: "test.mp4",
        encoding: "7bit",
        mimetype: "video/mp4",
        buffer: Buffer.from("fake video data"),
        size: 10240,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Only images are allowed");
        done();
      });
    });

    it("should reject audio files", (done) => {
      const mockFile = {
        fieldname: "audio",
        originalname: "test.mp3",
        encoding: "7bit",
        mimetype: "audio/mpeg",
        buffer: Buffer.from("fake audio data"),
        size: 5120,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Only images are allowed");
        done();
      });
    });

    it("should reject application/json files", (done) => {
      const mockFile = {
        fieldname: "data",
        originalname: "data.json",
        encoding: "7bit",
        mimetype: "application/json",
        buffer: Buffer.from('{"key": "value"}'),
        size: 256,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Only images are allowed");
        done();
      });
    });

    it("should reject application/octet-stream files", (done) => {
      const mockFile = {
        fieldname: "file",
        originalname: "binary.bin",
        encoding: "7bit",
        mimetype: "application/octet-stream",
        buffer: Buffer.from("binary data"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Only images are allowed");
        done();
      });
    });

    it("should reject files with empty mimetype", (done) => {
      const mockFile = {
        fieldname: "file",
        originalname: "unknown",
        encoding: "7bit",
        mimetype: "",
        buffer: Buffer.from("data"),
        size: 512,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Only images are allowed");
        done();
      });
    });

    it("should use startsWith for mimetype checking", (done) => {
      // Test that any mimetype starting with "image/" is accepted
      const mockFile = {
        fieldname: "image",
        originalname: "test.custom",
        encoding: "7bit",
        mimetype: "image/x-custom-format",
        buffer: Buffer.from("fake image data"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should handle mimetype case sensitivity", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "IMAGE/JPEG", // uppercase
        buffer: Buffer.from("fake image data"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        // Should fail because startsWith is case-sensitive
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Only images are allowed");
        done();
      });
    });
  });

  describe("fileSize limits", () => {
    it("should have fileSize limit configured", () => {
      expect(upload.limits).toBeDefined();
      expect(upload.limits.fileSize).toBeDefined();
    });

    it("should set fileSize limit to 5MB (5 * 1024 * 1024 bytes)", () => {
      const expectedLimit = 5 * 1024 * 1024; // 5MB in bytes
      expect(upload.limits.fileSize).toBe(expectedLimit);
      expect(upload.limits.fileSize).toBe(5242880);
    });

    it("should accept files under 5MB", () => {
      const fileSize = 4 * 1024 * 1024; // 4MB
      expect(fileSize).toBeLessThan(upload.limits.fileSize);
    });

    it("should accept files exactly at 5MB", () => {
      const fileSize = 5 * 1024 * 1024; // 5MB
      expect(fileSize).toBeLessThanOrEqual(upload.limits.fileSize);
    });

    it("should have limit for files over 5MB", () => {
      const fileSize = 6 * 1024 * 1024; // 6MB
      expect(fileSize).toBeGreaterThan(upload.limits.fileSize);
    });
  });

  describe("storage configuration", () => {
    it("should use memory storage", () => {
      expect(upload.storage).toBeDefined();
      // Memory storage stores files in memory as Buffer objects
      expect(upload.storage.getDestination).toBeUndefined();
      expect(upload.storage.getFilename).toBeUndefined();
    });

    it("should store files in memory (not disk)", () => {
      // Memory storage doesn't have destination or filename functions
      // Files are stored as req.file.buffer or req.files[].buffer
      expect(upload.storage.getDestination).toBeUndefined();
    });
  });

  describe("middleware methods", () => {
    it("should have single() method for single file upload", () => {
      expect(typeof upload.single).toBe("function");
      const singleUpload = upload.single("image");
      expect(typeof singleUpload).toBe("function");
    });

    it("should have array() method for multiple files upload", () => {
      expect(typeof upload.array).toBe("function");
      const arrayUpload = upload.array("images", 5);
      expect(typeof arrayUpload).toBe("function");
    });

    it("should have fields() method for multiple fields upload", () => {
      expect(typeof upload.fields).toBe("function");
      const fieldsUpload = upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "gallery", maxCount: 8 },
      ]);
      expect(typeof fieldsUpload).toBe("function");
    });

    it("should have any() method for any files upload", () => {
      expect(typeof upload.any).toBe("function");
      const anyUpload = upload.any();
      expect(typeof anyUpload).toBe("function");
    });

    it("should have none() method for no files upload", () => {
      expect(typeof upload.none).toBe("function");
      const noneUpload = upload.none();
      expect(typeof noneUpload).toBe("function");
    });
  });

  describe("error messages", () => {
    it("should return specific error message for non-image files", (done) => {
      const mockFile = {
        fieldname: "file",
        originalname: "document.docx",
        encoding: "7bit",
        mimetype:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("fake document data"),
        size: 2048,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Only images are allowed");
        expect(error.message).not.toBe("File too large");
        expect(error.message).not.toBe("Invalid file");
        done();
      });
    });

    it("should provide Error object (not string) when rejecting files", (done) => {
      const mockFile = {
        fieldname: "file",
        originalname: "test.txt",
        encoding: "7bit",
        mimetype: "text/plain",
        buffer: Buffer.from("text"),
        size: 100,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(typeof error).toBe("object");
        expect(error).toBeInstanceOf(Error);
        expect(typeof error.message).toBe("string");
        done();
      });
    });
  });

  describe("callback behavior", () => {
    it("should call callback with (null, true) for valid image files", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "photo.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake image"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        expect(result).not.toBe(false);
        done();
      });
    });

    it("should call callback with (Error, undefined) for invalid files", (done) => {
      const mockFile = {
        fieldname: "file",
        originalname: "script.js",
        encoding: "7bit",
        mimetype: "application/javascript",
        buffer: Buffer.from("console.log('test')"),
        size: 512,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).not.toBeNull();
        expect(error).toBeInstanceOf(Error);
        expect(result).toBeUndefined();
        done();
      });
    });

    it("should execute callback function", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "test.png",
        encoding: "7bit",
        mimetype: "image/png",
        buffer: Buffer.from("fake image"),
        size: 2048,
      };

      const mockCallback = jest.fn((error, result) => {
        expect(mockCallback).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalledTimes(1);
        done();
      });

      upload.fileFilter(mockReq, mockFile, mockCallback);
    });
  });

  describe("edge cases", () => {
    it("should handle file with no extension in filename", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "photonoextension",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake image"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should handle file with multiple dots in filename", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "my.photo.image.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake image"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should handle file with very long filename", (done) => {
      const longFilename = "a".repeat(200) + ".jpg";
      const mockFile = {
        fieldname: "image",
        originalname: longFilename,
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake image"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should handle file with special characters in filename", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "photo-2024_01@test!.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake image"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should handle file with Unicode characters in filename", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "照片_фото_사진.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake image"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should validate based on mimetype, not filename extension", (done) => {
      // File has .txt extension but image mimetype
      const mockFile = {
        fieldname: "image",
        originalname: "fake.txt",
        encoding: "7bit",
        mimetype: "image/png",
        buffer: Buffer.from("fake image"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should reject based on mimetype, not filename extension", (done) => {
      // File has .jpg extension but non-image mimetype
      const mockFile = {
        fieldname: "file",
        originalname: "malicious.jpg",
        encoding: "7bit",
        mimetype: "application/x-executable",
        buffer: Buffer.from("fake executable"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Only images are allowed");
        done();
      });
    });

    it("should handle empty file buffer", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "empty.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from(""),
        size: 0,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should handle file with spaces in mimetype (if any)", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: " image/jpeg ", // with spaces
        buffer: Buffer.from("fake image"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        // Should fail because " image/jpeg " doesn't start with "image/"
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Only images are allowed");
        done();
      });
    });
  });

  describe("mimetype validation logic", () => {
    it("should use startsWith method for mimetype checking", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake image"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        // Verify it accepts because mimetype starts with "image/"
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it("should reject if mimetype contains 'image/' but doesn't start with it", (done) => {
      const mockFile = {
        fieldname: "file",
        originalname: "test.file",
        encoding: "7bit",
        mimetype: "application/image/custom", // contains but doesn't start with
        buffer: Buffer.from("fake data"),
        size: 1024,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Only images are allowed");
        done();
      });
    });

    it("should accept any subtype under image/ mimetype", (done) => {
      const mockFile = {
        fieldname: "image",
        originalname: "test.img",
        encoding: "7bit",
        mimetype: "image/vnd.adobe.photoshop",
        buffer: Buffer.from("fake psd"),
        size: 2048,
      };

      upload.fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe("integration with multer", () => {
    it("should export a configured multer instance", () => {
      expect(upload).toBeDefined();
      expect(typeof upload).toBe("object");
    });

    it("should have all required multer properties", () => {
      expect(upload).toHaveProperty("storage");
      expect(upload).toHaveProperty("fileFilter");
      expect(upload).toHaveProperty("limits");
    });

    it("should have limits object with fileSize property", () => {
      expect(upload.limits).toBeInstanceOf(Object);
      expect(upload.limits).toHaveProperty("fileSize");
      expect(typeof upload.limits.fileSize).toBe("number");
    });

    it("should be usable as Express middleware", () => {
      const middleware = upload.single("image");
      expect(typeof middleware).toBe("function");
      expect(middleware.length).toBe(3); // Express middleware signature (req, res, next)
    });
  });
});
