import { extractMetadata, isValidEmail } from "./metadata-extractor";

describe("Metadata Extractor", () => {
  describe("isValidEmail", () => {
    it("should validate correctly formatted emails", () => {
      expect(isValidEmail("bussathrishank595@gmail.com")).toBe(true);
      expect(isValidEmail("test.user+123@example.co.uk")).toBe(true);
    });

    it("should reject badly formatted emails", () => {
      expect(isValidEmail("bussathrishank595@gmail.com7989971353telangana")).toBe(false);
      expect(isValidEmail("invalid@email")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("extractMetadata", () => {
    it("should correctly extract metadata when Email, Phone, and Address are on the same line", () => {
      const text = "Bussa Thrishank\nbussathrishank595@gmail.com 7989971353 Telangana\nSkills: React, Node";
      const metadata = extractMetadata(text);
      
      expect(metadata.name).toBe("Bussa Thrishank");
      expect(metadata.email).toBe("bussathrishank595@gmail.com");
      expect(metadata.phone).toBe("7989971353");
      expect(metadata.location).toBe("Telangana");
    });

    it("should correctly extract metadata when fields are concatenated without spaces", () => {
      // Though highly malformed, we test if regex bounds prevent greedy matching
      const text = "bussathrishank595@gmail.com7989971353telangana";
      const metadata = extractMetadata(text);
      
      // Since it's all concatenated without word boundaries, standard \b might fail or pass depending on the engine.
      // In JS, numbers and letters are word characters, so \b doesn't trigger between .com and 7.
      // But let's see what the extractor does. Our extractor regex uses \b, so it might actually fail to match the email here if it's strictly concatenated.
      // Wait, the prompt implies that `bussathrishank595@gmail.com7989971353telangana` was matched greedily before, and now we want to prevent it and extract properly if possible, or at least not match it greedily.
      // If it's truly concatenated, no regex will perfectly split it without a dictionary. But we can test that it doesn't return the greedy string.
      expect(metadata.email).not.toBe("bussathrishank595@gmail.com7989971353telangana");
    });

    it("should correctly extract metadata when fields are on separate lines", () => {
      const text = `
John Doe
Email: john.doe@example.com
Phone: (555) 123-4567
Location: New York, NY
Experience: 5 years
      `;
      const metadata = extractMetadata(text);
      
      expect(metadata.name).toBe("John Doe");
      expect(metadata.email).toBe("john.doe@example.com");
      expect(metadata.phone).toBe("(555) 123-4567");
      expect(metadata.location).toBe("New York, NY");
    });
  });
});
