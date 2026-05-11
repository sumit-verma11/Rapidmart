import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { slugify } from "@/lib/utils";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return null;
  return session;
}

interface RowResult {
  row: number;
  name: string;
  status: "success" | "error" | "skipped";
  message: string;
}

function parseBoolean(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  const s = String(val ?? "").toLowerCase().trim();
  return s === "true" || s === "yes" || s === "1";
}

function parseNumber(val: unknown, fallback = 0): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function parseTags(val: unknown): string[] {
  if (!val) return [];
  return String(val).split(",").map(t => t.trim()).filter(Boolean);
}

function parseImages(val: unknown): string[] {
  if (!val) return [];
  return String(val).split(",").map(u => u.trim()).filter(Boolean);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: "File is empty or has no data rows" }, { status: 400 });
  }

  await connectDB();

  // Build category name → _id map
  const allCategories = await Category.find({}, { name: 1 }).lean();
  const categoryMap = new Map<string, string>(
    allCategories.map(c => [c.name.toLowerCase().trim(), String(c._id)])
  );

  const results: RowResult[] = [];
  let successCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2: header row + 1-indexed
    const name = String(row["name"] ?? "").trim();

    if (!name) {
      results.push({ row: rowNum, name: "-", status: "skipped", message: "Empty name — row skipped" });
      continue;
    }

    const description = String(row["description"] ?? "").trim();
    const categoryName = String(row["category"] ?? "").trim();

    if (!description) {
      results.push({ row: rowNum, name, status: "error", message: "Missing description" });
      continue;
    }
    if (!categoryName) {
      results.push({ row: rowNum, name, status: "error", message: "Missing category" });
      continue;
    }

    const categoryId = categoryMap.get(categoryName.toLowerCase());
    if (!categoryId) {
      results.push({ row: rowNum, name, status: "error", message: `Category "${categoryName}" not found` });
      continue;
    }

    // Build variants (up to 5)
    const variants = [];
    for (let v = 1; v <= 5; v++) {
      const size = String(row[`v${v}_size`] ?? "").trim();
      const unit = String(row[`v${v}_unit`] ?? "").trim();
      const mrp  = parseNumber(row[`v${v}_mrp`]);
      if (!size || !unit || mrp <= 0) break;
      const sellingPrice = parseNumber(row[`v${v}_price`], mrp);
      const sku = String(row[`v${v}_sku`] ?? "").trim()
        || `${slugify(name).toUpperCase().slice(0, 8)}-${size.toUpperCase()}${unit.toUpperCase()}`;
      variants.push({ size, unit, mrp, sellingPrice, sku });
    }

    if (variants.length === 0) {
      results.push({ row: rowNum, name, status: "error", message: "At least one variant (v1_size, v1_unit, v1_mrp) required" });
      continue;
    }

    const slug = slugify(name);
    const existing = await Product.findOne({ slug }).lean();
    if (existing) {
      results.push({ row: rowNum, name, status: "skipped", message: "Product already exists — skipped" });
      continue;
    }

    try {
      await Product.create({
        name,
        slug,
        description,
        subCategory:  String(row["subCategory"] ?? "").trim() || undefined,
        category:     categoryId,
        variants,
        images:       parseImages(row["images"]),
        tags:         parseTags(row["tags"]),
        stockQty:     parseNumber(row["stockQty"], 100),
        isOrganic:    parseBoolean(row["isOrganic"]),
        isFeatured:   parseBoolean(row["isFeatured"]),
        isAvailable:  row["isAvailable"] === "" ? true : parseBoolean(row["isAvailable"]),
      });
      successCount++;
      results.push({ row: rowNum, name, status: "success", message: "Created successfully" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      results.push({ row: rowNum, name, status: "error", message: msg });
    }
  }

  return NextResponse.json({
    success: true,
    summary: { total: rows.length, created: successCount, errors: results.filter(r => r.status === "error").length, skipped: results.filter(r => r.status === "skipped").length },
    results,
  });
}

// GET — return a CSV template
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const headers = [
    "name", "description", "category", "subCategory",
    "stockQty", "isOrganic", "isFeatured", "isAvailable",
    "tags", "images",
    "v1_size", "v1_unit", "v1_mrp", "v1_price", "v1_sku",
    "v2_size", "v2_unit", "v2_mrp", "v2_price", "v2_sku",
    "v3_size", "v3_unit", "v3_mrp", "v3_price", "v3_sku",
  ];

  const sample = [
    "Organic Basmati Rice", "Premium long-grain organic basmati rice", "Grains & Staples", "",
    "200", "true", "false", "true",
    "rice,organic,basmati", "",
    "1kg", "kg", "180", "160", "BASRICE-1KGKG",
    "5kg", "kg", "850", "800", "BASRICE-5KGKG",
    "", "", "", "", "",
  ];

  const csv = [headers.join(","), sample.join(",")].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="rapidmart-products-template.csv"',
    },
  });
}
