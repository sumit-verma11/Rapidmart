"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Upload, Download, CheckCircle2, XCircle, AlertCircle,
  FileSpreadsheet, ArrowLeft, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";

interface RowResult {
  row: number;
  name: string;
  status: "success" | "error" | "skipped";
  message: string;
}

interface UploadResult {
  summary: { total: number; created: number; errors: number; skipped: number };
  results: RowResult[];
}

const COLUMNS = [
  { col: "name",        req: true,  note: "Product name" },
  { col: "description", req: true,  note: "Full description" },
  { col: "category",    req: true,  note: "Must match an existing category exactly" },
  { col: "subCategory", req: false, note: "Optional sub-category label" },
  { col: "stockQty",    req: false, note: "Default: 100" },
  { col: "isOrganic",   req: false, note: "true / false" },
  { col: "isFeatured",  req: false, note: "true / false" },
  { col: "isAvailable", req: false, note: "true / false  (default: true)" },
  { col: "tags",        req: false, note: "Comma-separated: rice,organic" },
  { col: "images",      req: false, note: "Comma-separated image URLs" },
  { col: "v1_size",     req: true,  note: "Variant 1 size — e.g. 500" },
  { col: "v1_unit",     req: true,  note: "Variant 1 unit — e.g. g, kg, ml, L, pcs" },
  { col: "v1_mrp",      req: true,  note: "Variant 1 MRP (₹)" },
  { col: "v1_price",    req: false, note: "Variant 1 selling price (default = MRP)" },
  { col: "v1_sku",      req: false, note: "Auto-generated if blank" },
  { col: "v2_size …",   req: false, note: "Repeat v2_, v3_, v4_, v5_ for more variants" },
];

export default function BulkUploadPage() {
  const [file,        setFile]       = useState<File | null>(null);
  const [dragging,    setDragging]   = useState(false);
  const [uploading,   setUploading]  = useState(false);
  const [result,      setResult]     = useState<UploadResult | null>(null);
  const [showErrors,  setShowErrors] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const ok = f.name.endsWith(".csv") || f.name.endsWith(".xlsx") || f.name.endsWith(".xls");
    if (!ok) { toast.error("Please upload a .csv or .xlsx file"); return; }
    setFile(f);
    setResult(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/admin/products/bulk-upload", { method: "POST", body: form });
      const data = await res.json();
      if (!data.success) { toast.error(data.error ?? "Upload failed"); return; }
      setResult(data);
      if (data.summary.created > 0) toast.success(`${data.summary.created} product(s) created!`);
      if (data.summary.errors  > 0) toast.error(`${data.summary.errors} row(s) had errors`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setUploading(false);
    }
  };

  const statusIcon = (s: RowResult["status"]) => {
    if (s === "success") return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
    if (s === "error")   return <XCircle      className="w-4 h-4 text-red-500   shrink-0" />;
    return                      <AlertCircle  className="w-4 h-4 text-yellow-500 shrink-0" />;
  };

  const statusBg = (s: RowResult["status"]) =>
    s === "success" ? "bg-green-50 dark:bg-green-950/30"
    : s === "error" ? "bg-red-50 dark:bg-red-950/30"
    : "bg-yellow-50 dark:bg-yellow-950/30";

  return (
    <div className="max-w-4xl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark">Bulk Upload Products</h1>
          <p className="text-muted text-sm mt-0.5">Upload a CSV or Excel file to add multiple products at once</p>
        </div>
      </div>

      {/* Template download */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-center justify-between mb-6">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Download the template first</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Fill in your products and upload the same file back</p>
          </div>
        </div>
        <a
          href="/api/admin/products/bulk-upload"
          download="rapidmart-products-template.csv"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shrink-0"
        >
          <Download className="w-4 h-4" /> Template
        </a>
      </div>

      {/* Column reference */}
      <details className="mb-6 bg-white dark:bg-gray-900 border border-border rounded-2xl overflow-hidden">
        <summary className="px-5 py-3.5 flex items-center justify-between cursor-pointer text-sm font-semibold text-dark select-none">
          Column reference
          <ChevronDown className="w-4 h-4 text-muted" />
        </summary>
        <div className="border-t border-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-muted">Column</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted">Required</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COLUMNS.map(c => (
                <tr key={c.col}>
                  <td className="px-4 py-2 font-mono text-primary">{c.col}</td>
                  <td className="px-4 py-2">
                    {c.req
                      ? <span className="text-red-600 font-semibold">Yes</span>
                      : <span className="text-muted">No</span>}
                  </td>
                  <td className="px-4 py-2 text-dark">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors mb-4
          ${dragging
            ? "border-primary bg-primary/5"
            : file
              ? "border-green-400 bg-green-50 dark:bg-green-950/20"
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <>
            <FileSpreadsheet className="w-10 h-10 text-green-500 mb-3" />
            <p className="font-semibold text-dark text-sm">{file.name}</p>
            <p className="text-xs text-muted mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-muted mb-3" />
            <p className="font-semibold text-dark text-sm">Drop your file here or click to browse</p>
            <p className="text-xs text-muted mt-1">Supports .csv, .xlsx, .xls</p>
          </>
        )}
      </div>

      {/* Upload button */}
      <button
        onClick={onUpload}
        disabled={!file || uploading}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload & Import</>}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{result.summary.created}</p>
              <p className="text-xs text-green-700 dark:text-green-400 font-medium mt-0.5">Created</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{result.summary.errors}</p>
              <p className="text-xs text-red-700 dark:text-red-400 font-medium mt-0.5">Errors</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{result.summary.skipped}</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium mt-0.5">Skipped</p>
            </div>
          </div>

          {/* Row results */}
          <div className="bg-white dark:bg-gray-900 border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowErrors(v => !v)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-sm font-semibold text-dark hover:bg-accent transition-colors"
            >
              Row-by-row results
              {showErrors ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
            </button>
            {showErrors && (
              <div className="border-t border-border divide-y divide-border max-h-96 overflow-y-auto">
                {result.results.map(r => (
                  <div key={r.row} className={`flex items-center gap-3 px-5 py-3 text-sm ${statusBg(r.status)}`}>
                    {statusIcon(r.status)}
                    <span className="text-muted w-14 shrink-0">Row {r.row}</span>
                    <span className="font-medium text-dark truncate flex-1">{r.name}</span>
                    <span className="text-muted text-xs shrink-0 text-right max-w-[200px] truncate">{r.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {result.summary.created > 0 && (
            <Link href="/admin/products" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              View Products
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
