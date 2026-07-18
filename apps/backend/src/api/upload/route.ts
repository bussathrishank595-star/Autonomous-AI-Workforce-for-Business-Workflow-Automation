import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as pdfParse from "pdf-parse-fork";
import crypto from "crypto";

function parseDocxSimple(buffer: Buffer): string {
  try {
    const text = buffer.toString("utf8");
    const cleaned = text.replace(/[^\x20-\x7E\s]/g, "");
    return cleaned;
  } catch {
    return buffer.toString("ascii");
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files found" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const parsedResumes = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Calculate file hash for duplicate detection
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");

      // Check if file hash already exists to skip duplicate ingestion
      const existing = await prisma.resume.findUnique({
        where: { hash },
      });

      if (existing) {
        parsedResumes.push({
          id: existing.id,
          filename: existing.filename,
          skipped: true,
        });
        continue;
      }

      let parsedText = "";
      if (file.name.endsWith(".pdf")) {
        try {
          const pdfData = await (pdfParse as any).default?.(buffer) || await (pdfParse as any)(buffer);
          parsedText = pdfData.text || "";
        } catch (e: any) {
          parsedText = buffer.toString("utf8");
        }
      } else if (file.name.endsWith(".docx")) {
        parsedText = parseDocxSimple(buffer);
      } else {
        parsedText = buffer.toString("utf8");
      }

      if (!parsedText.trim()) {
        parsedText = "No printable text detected in resume document.";
      }

      // Parse candidate name/email details from raw text to populate standard Resume indexing properties
      const nameMatch = parsedText.match(/Name:\s*([^\n\r]+)/i) || parsedText.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
      const emailMatch = parsedText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
      const phoneMatch = parsedText.match(/(\+?\d{1,3}[-.\s]??\d{3}[-.\s]??\d{3}[-.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-.\s]??\d{4})/);

      const resume = await prisma.resume.create({
        data: {
          filename: file.name,
          fileSize: file.size,
          parsedText,
          hash,
          userId,
          name: nameMatch ? nameMatch[1].trim() : file.name.replace(/\.[^/.]+$/, ""),
          email: emailMatch ? emailMatch[1].trim() : "",
          phone: phoneMatch ? phoneMatch[1].trim() : "",
          status: "PENDING",
        },
      });

      parsedResumes.push({
        id: resume.id,
        filename: resume.filename,
        skipped: false,
      });
    }

    return NextResponse.json({ success: true, files: parsedResumes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
