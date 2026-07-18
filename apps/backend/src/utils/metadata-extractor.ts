export interface ResumeMetadata {
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string;
  experience: string;
  education: string;
}

/**
 * Validates if an email address has a correct format.
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  // Robust regex enforcing boundaries and correct top-level domains.
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Extracts candidate metadata robustly from resume text.
 */
export function extractMetadata(text: string): ResumeMetadata {
  const metadata: ResumeMetadata = {
    name: "",
    email: "",
    phone: "",
    location: "",
    skills: "[]",
    experience: "[]",
    education: "[]"
  };

  if (!text) return metadata;

  // 1. Extract Email
  // Uses a regex that matches common email formats within word boundaries or spaces
  const emailRegex = /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/i;
  const emailMatch = text.match(emailRegex);
  if (emailMatch && emailMatch[1]) {
    metadata.email = emailMatch[1].trim();
  }

  // 2. Extract Phone Number
  // Matches formats like: +1 123-456-7890, (123) 456-7890, 123.456.7890, 1234567890
  const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch && phoneMatch[0]) {
    metadata.phone = phoneMatch[0].trim();
  }

  // 3. Extract Name
  // Heuristic: Looking for a "Name: " prefix, or taking the first two capitalized words.
  const namePrefixMatch = text.match(/Name:\s*([^\n\r]+)/i);
  if (namePrefixMatch && namePrefixMatch[1]) {
    metadata.name = namePrefixMatch[1].trim();
  } else {
    // Match 2-3 capitalized words at the very beginning of the string or lines
    const nameMatch = text.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}/m);
    if (nameMatch && nameMatch[0]) {
      metadata.name = nameMatch[0].trim();
    }
  }

  // 4. Extract Location
  // We'll look for common location indicators or assume remaining text on the contact line is the location.
  const locationPrefixMatch = text.match(/(?:Location|Address):\s*([^\n\r]+)/i);
  if (locationPrefixMatch && locationPrefixMatch[1]) {
    metadata.location = locationPrefixMatch[1].trim();
  } else {
    // If the email is found, let's look at the line it was found on.
    if (metadata.email) {
      const lines = text.split(/\r?\n/);
      const emailLine = lines.find(line => line.includes(metadata.email));
      if (emailLine) {
        // Remove email and phone from this line
        let remaining = emailLine.replace(metadata.email, "");
        if (metadata.phone) {
          remaining = remaining.replace(metadata.phone, "");
        }
        
        // Remove known words like "Email:", "Phone:"
        remaining = remaining.replace(/Email:?/i, "").replace(/Phone:?/i, "").replace(/Mobile:?/i, "");
        
        // Clean up punctuation
        remaining = remaining.replace(/^[|,\s-]+|[|,\s-]+$/g, "").trim();
        
        if (remaining.length > 2 && remaining.length < 50) {
          metadata.location = remaining;
        }
      }
    }
  }

  return metadata;
}
