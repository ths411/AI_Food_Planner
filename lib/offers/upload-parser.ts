import pdfParse from "pdf-parse";

export async function extractTextFromUpload(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());

  if (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) {
    const parsed = await pdfParse(bytes);
    return parsed.text;
  }

  return bytes.toString("utf-8");
}

