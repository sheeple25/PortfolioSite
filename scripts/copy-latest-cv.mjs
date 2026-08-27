import fs from "node:fs";
import path from "node:path";

function parseVersion(filename) {
  const match = filename.match(/^v([\d.]+)\.pdf$/i);
  if (!match) return null;
  const version = match[1];
  const parts = version.split(".").map(Number);
  return parts[0] * 1000 + (parts[1] || 0);
}

function copyLatestCV() {
  const cvDir = path.join(process.cwd(), "cv");
  const publicCvDir = path.join(process.cwd(), "public", "cv");

  if (!fs.existsSync(cvDir)) {
    console.warn("CV directory not found, skipping...");
    return;
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
    console.warn("No CV files found");
    return;
  }

  const latest = pdfs[0].filename;
  const sourceFile = path.join(cvDir, latest);
  const destFile = path.join(publicCvDir, latest);

  if (!fs.existsSync(publicCvDir)) {
    fs.mkdirSync(publicCvDir, { recursive: true });
  }

  fs.copyFileSync(sourceFile, destFile);
  console.log(`Copied latest CV: ${latest}`);
}

copyLatestCV();
