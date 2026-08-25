import fs from "fs";
import path from "path";

function parseVersion(filename: string): number | null {
  const match = filename.match(/^v([\d.]+)\.pdf$/i);
  if (!match) return null;
  const version = match[1];
  const parts = version.split(".").map(Number);
  return parts[0] * 1000 + (parts[1] || 0);
}

export function getLatestCVPath(): string {
  const cvDir = path.join(process.cwd(), "cv");

  if (!fs.existsSync(cvDir)) {
    return "";
  }

  const files = fs.readdirSync(cvDir).filter((f) => f.endsWith(".pdf"));

  const pdfs = files
    .map((filename) => ({
      filename,
      version: parseVersion(filename),
    }))
    .filter((f) => f.version !== null)
    .sort((a, b) => (b.version ?? 0) - (a.version ?? 0));

  if (pdfs.length === 0) {
    return "";
  }

  const latest = pdfs[0].filename;
  return `/cv/${latest}`;
}
