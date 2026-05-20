"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SlidersHorizontal, X, ChevronRight, Leaf, RotateCcw, MapPin, Loader2, ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { usePincodeStore } from "@/store/pincode";
import { useUserActivity } from "@/store/userActivity";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { IProduct } from "@/types";
import { formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface Props {
  initialCategories: CategoryItem[];
  initialProducts?:  IProduct[];
  initialTotal?:     number;
  initialSearch?:    string;
  initialCategory?:  string;
}

// Isolated so only this tiny component triggers the Suspense boundary,
// not the entire ShopSection.
function SearchParamsSync({ onSync }: { onSync: (search: string, category: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onSync(searchParams.get("search") ?? "", searchParams.get("category") ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  return null;
}

const CATEGORY_EMOJI: Record<string, string> = {
  "Fruits & Vegetables": "🥦",
  "Dairy & Eggs":        "🥛",
  "Bakery":              "🍞",
  "Beverages":           "🧃",
  "Snacks":              "🍿",
  "Meat & Seafood":      "🐟",
};

// Color palette per category — [activeBg, activeText, inactiveBg, inactiveText, dot]
const CATEGORY_COLORS: Record<string, [string, string, string, string, string]> = {
  "Fresh Fruits":        ["bg-orange-500",  "text-white", "bg-orange-50  dark:bg-orange-950/40", "text-orange-700 dark:text-orange-300", "bg-orange-400"],
  "Fresh Vegetables":    ["bg-emerald-500", "text-white", "bg-emerald-50 dark:bg-emerald-950/40","text-emerald-700 dark:text-emerald-300","bg-emerald-400"],
  "Herbs & Seasonings":  ["bg-lime-500",    "text-white", "bg-lime-50    dark:bg-lime-950/40",   "text-lime-700 dark:text-lime-300",    "bg-lime-400"],
  "Milk":                ["bg-sky-500",     "text-white", "bg-sky-50     dark:bg-sky-950/40",    "text-sky-700 dark:text-sky-300",      "bg-sky-400"],
  "Paneer & Tofu":       ["bg-yellow-500",  "text-white", "bg-yellow-50  dark:bg-yellow-950/40", "text-yellow-700 dark:text-yellow-300","bg-yellow-400"],
  "Curd & Buttermilk":   ["bg-cyan-500",    "text-white", "bg-cyan-50    dark:bg-cyan-950/40",   "text-cyan-700 dark:text-cyan-300",    "bg-cyan-400"],
  "Butter & Cheese":     ["bg-amber-500",   "text-white", "bg-amber-50   dark:bg-amber-950/40",  "text-amber-700 dark:text-amber-300",  "bg-amber-400"],
  "Eggs":                ["bg-yellow-600",  "text-white", "bg-yellow-50  dark:bg-yellow-950/40", "text-yellow-700 dark:text-yellow-300","bg-yellow-500"],
  "Breads":              ["bg-amber-600",   "text-white", "bg-amber-50   dark:bg-amber-950/40",  "text-amber-700 dark:text-amber-300",  "bg-amber-500"],
  "Cakes & Pastries":    ["bg-pink-500",    "text-white", "bg-pink-50    dark:bg-pink-950/40",   "text-pink-700 dark:text-pink-300",    "bg-pink-400"],
  "Biscuits & Cookies":  ["bg-rose-500",    "text-white", "bg-rose-50    dark:bg-rose-950/40",   "text-rose-700 dark:text-rose-300",    "bg-rose-400"],
  "Juices":              ["bg-orange-500",  "text-white", "bg-orange-50  dark:bg-orange-950/40", "text-orange-700 dark:text-orange-300","bg-orange-400"],
  "Cold Drinks":         ["bg-blue-500",    "text-white", "bg-blue-50    dark:bg-blue-950/40",   "text-blue-700 dark:text-blue-300",    "bg-blue-400"],
  "Tea & Coffee":        ["bg-stone-600",   "text-white", "bg-stone-50   dark:bg-stone-950/40",  "text-stone-700 dark:text-stone-300",  "bg-stone-500"],
  "Water & Soda":        ["bg-teal-500",    "text-white", "bg-teal-50    dark:bg-teal-950/40",   "text-teal-700 dark:text-teal-300",    "bg-teal-400"],
  "Chips & Namkeen":     ["bg-red-500",     "text-white", "bg-red-50     dark:bg-red-950/40",    "text-red-700 dark:text-red-300",      "bg-red-400"],
  "Instant Noodles":     ["bg-yellow-500",  "text-white", "bg-yellow-50  dark:bg-yellow-950/40", "text-yellow-700 dark:text-yellow-300","bg-yellow-400"],
  "Ready to Eat":        ["bg-violet-500",  "text-white", "bg-violet-50  dark:bg-violet-950/40", "text-violet-700 dark:text-violet-300","bg-violet-400"],
  "Chicken":             ["bg-orange-600",  "text-white", "bg-orange-50  dark:bg-orange-950/40", "text-orange-700 dark:text-orange-300","bg-orange-500"],
  "Fish":                ["bg-blue-600",    "text-white", "bg-blue-50    dark:bg-blue-950/40",   "text-blue-700 dark:text-blue-300",    "bg-blue-500"],
  "Grains & Staples":    ["bg-amber-700",   "text-white", "bg-amber-50   dark:bg-amber-950/40",  "text-amber-700 dark:text-amber-300",  "bg-amber-600"],
  "Dry Fruits":          ["bg-brown-600",   "text-white", "bg-amber-50   dark:bg-amber-950/40",  "text-amber-800 dark:text-amber-300",  "bg-amber-600"],
  "Pantry":              ["bg-gray-600",    "text-white", "bg-gray-100   dark:bg-gray-800",      "text-gray-700 dark:text-gray-300",    "bg-gray-500"],
};

const DEFAULT_CHIP_COLORS: [string, string, string, string, string] = [
  "bg-primary", "text-white", "bg-gray-100 dark:bg-gray-800", "text-gray-700 dark:text-gray-300", "bg-primary",
];

// ─── Category Chip Strip ───────────────────────────────────────────────────────

function CategoryChipStrip({
  categories,
  activeId,
  onSelect,
}: {
  categories: CategoryItem[];
  activeId:   string;
  onSelect:   (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 mb-4">
      {/* All chip */}
      <button
        onClick={() => onSelect("")}
        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold
                    transition-all duration-200 cursor-pointer whitespace-nowrap
                    ${!activeId
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
      >
        <span className="text-sm leading-none">🛒</span>
        All
      </button>

      {categories.map((cat) => {
        const isActive = activeId === cat._id;
        const [activeBg, activeText, inactiveBg, inactiveText] = CATEGORY_COLORS[cat.name] ?? DEFAULT_CHIP_COLORS;
        return (
          <motion.button
            key={cat._id}
            onClick={() => onSelect(isActive ? "" : cat._id)}
            whileTap={{ scale: 0.93 }}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold
                        transition-all duration-200 cursor-pointer whitespace-nowrap
                        ${isActive
                          ? `${activeBg} ${activeText} shadow-md`
                          : `${inactiveBg} ${inactiveText} hover:opacity-90`
                        }`}
          >
            {cat.image ? (
              <span className="w-4 h-4 rounded-full overflow-hidden shrink-0 relative">
                <Image src={cat.image} alt="" fill sizes="16px" className="object-cover" />
              </span>
            ) : (
              <span className="text-sm leading-none">{CATEGORY_EMOJI[cat.name] ?? "🛒"}</span>
            )}
            {cat.name}
          </motion.button>
        );
      })}
    </div>
  );
}

// Curated Unsplash images per category name (fallback when DB has no image)
const CATEGORY_IMAGES: Record<string, string> = {
  "Fresh Fruits":        "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80",
  "Fresh Vegetables":    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80",
  "Herbs & Seasonings":  "https://images.unsplash.com/photo-1615485500834-bc10199bc727?w=600&q=80",
  "Milk":                "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80",
  "Paneer & Tofu":       "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
  "Curd & Buttermilk":   "https://images.unsplash.com/photo-1571210862729-78a52d3779a2?w=600&q=80",
  "Butter & Cheese":     "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80",
  "Eggs":                "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80",
  "Breads":              "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
  "Cakes & Pastries":    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80",
  "Biscuits & Cookies":  "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80",
  "Juices":              "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&q=80",
  "Cold Drinks":         "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=600&q=80",
  "Tea & Coffee":        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=80",
  "Water & Soda":        "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80",
  "Chips & Namkeen":     "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&q=80",
  "Instant Noodles":     "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
  "Ready to Eat":        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
  "Chicken":             "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80",
  "Fish":                "https://images.unsplash.com/photo-1535234780-1c571b79d21b?w=600&q=80",
  "Grains & Staples":    "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80",
  "Dry Fruits":          "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80",
  "Pantry":              "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
};

// ─── Category Cards Grid ──────────────────────────────────────────────────────

function CategoryCardsSection({ categories }: { categories: CategoryItem[] }) {
  return (
    <section className="mt-14 mb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-dark dark:text-white">Shop by Category</h2>
          <p className="text-sm text-muted mt-0.5">Browse all {categories.length} categories</p>
        </div>
        <Link
          href="/categories"
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline shrink-0"
        >
          See all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {categories.map((cat) => {
          const imgSrc = cat.image || CATEGORY_IMAGES[cat.name] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80";
          return (
            <Link
              key={cat._id}
              href={`/category/${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] block shadow-sm
                         hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <Image
                src={imgSrc}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                <p className="text-white font-bold text-sm leading-tight drop-shadow">{cat.name}</p>
                <span className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center
                                 group-hover:bg-white/40 transition-colors shrink-0">
                  <ArrowRight className="w-3 h-3 text-white" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

const SORT_OPTIONS = [
  { value: "createdAt", label: "Newest First" },
  { value: "sellingPrice-asc", label: "Price: Low to High" },
  { value: "sellingPrice-desc", label: "Price: High to Low" },
  { value: "name", label: "Name A–Z" },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 skeleton-shimmer rounded w-16" />
        <div className="h-3.5 skeleton-shimmer rounded w-full" />
        <div className="h-3.5 skeleton-shimmer rounded w-3/4" />
        <div className="h-2.5 skeleton-shimmer rounded w-12" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 skeleton-shimmer rounded w-20" />
          <div className="w-8 h-8 skeleton-shimmer rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── FilterPanel (shared between sidebar and bottom sheet) ────────────────────

interface FilterPanelProps {
  categories:       CategoryItem[];
  subcategories:    CategoryItem[];
  filters:          FilterState;
  onFilterChange:   (patch: Partial<FilterState>) => void;
  onReset:          () => void;
}

function FilterPanel({ categories, subcategories, filters, onFilterChange, onReset }: FilterPanelProps) {
  return (
    <div className="space-y-6">
      {/* Reset */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-dark">Filters</h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary
                     hover:underline"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset all
        </button>
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Sort by</p>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="sort"
                value={opt.value}
                checked={filters.sortBy === opt.value}
                onChange={() => onFilterChange({ sortBy: opt.value })}
                className="accent-primary"
              />
              <span className="text-sm text-dark group-hover:text-primary transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Category</p>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="category"
              checked={!filters.category}
              onChange={() => onFilterChange({ category: "", subcategory: "" })}
              className="accent-primary"
            />
            <span className="text-sm text-dark group-hover:text-primary transition-colors">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label
              key={cat._id}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="category"
                checked={filters.category === cat._id}
                onChange={() => onFilterChange({ category: cat._id, subcategory: "" })}
                className="accent-primary"
              />
              <span className="text-sm text-dark group-hover:text-primary transition-colors flex items-center gap-1.5">
                <span>{CATEGORY_EMOJI[cat.name] ?? "🛒"}</span>
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Subcategory */}
      {subcategories.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Subcategory</p>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="subcategory"
                checked={!filters.subcategory}
                onChange={() => onFilterChange({ subcategory: "" })}
                className="accent-primary"
              />
              <span className="text-sm text-dark group-hover:text-primary transition-colors">All</span>
            </label>
            {subcategories.map((sub) => (
              <label key={sub._id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="subcategory"
                  checked={filters.subcategory === sub._id}
                  onChange={() => onFilterChange({ subcategory: sub._id })}
                  className="accent-primary"
                />
                <span className="text-sm text-dark group-hover:text-primary transition-colors">
                  {sub.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price range */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
          Max Price: <span className="text-primary font-bold">{formatPrice(filters.maxPrice)}</span>
        </p>
        <input
          type="range"
          min={50}
          max={5000}
          step={50}
          value={filters.maxPrice}
          onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
          className="w-full accent-primary"
          style={{
            background: `linear-gradient(to right, #1A6B3A ${((filters.maxPrice - 50) / (5000 - 50)) * 100}%, #E5E7EB ${((filters.maxPrice - 50) / (5000 - 50)) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>₹50</span>
          <span>₹5,000</span>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Dietary</p>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-dark flex items-center gap-2">
            <span>📦</span> In Stock Only
          </span>
          <button
            role="switch"
            aria-checked={filters.inStockOnly}
            onClick={() => onFilterChange({ inStockOnly: !filters.inStockOnly })}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none
                        ${filters.inStockOnly ? "bg-primary" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                          ${filters.inStockOnly ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-dark flex items-center gap-2">
            <Leaf className="w-4 h-4 text-success" /> Organic Only
          </span>
          <button
            role="switch"
            aria-checked={filters.organicOnly}
            onClick={() => onFilterChange({ organicOnly: !filters.organicOnly })}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none
                        ${filters.organicOnly ? "bg-primary" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                          ${filters.organicOnly ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}

// ─── Filter state ─────────────────────────────────────────────────────────────

interface FilterState {
  sortBy:      string;
  category:    string;
  subcategory: string;
  maxPrice:    number;
  inStockOnly: boolean;
  organicOnly: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  sortBy:      "createdAt",
  category:    "",
  subcategory: "",
  maxPrice:    5000,
  inStockOnly: false,
  organicOnly: false,
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function ShopSection({ initialCategories, initialProducts = [], initialTotal = 0, initialSearch = "", initialCategory = "" }: Props) {
  const router = useRouter();
  const { info: pincodeInfo } = usePincodeStore();
  const { preferredCategoryIds } = useUserActivity();

  const [searchInput, setSearchInput]   = useState(initialSearch);
  const [debouncedSearch, setDSearch]   = useState(initialSearch);
  const [filters, setFilters]           = useState<FilterState>({
    ...DEFAULT_FILTERS,
    category: initialCategory,
  });
  const [page, setPage]                 = useState(1);
  const [products, setProducts]         = useState<IProduct[]>(initialProducts);
  const [totalPages, setTotalPages]     = useState(Math.max(1, Math.ceil(initialTotal / 50)));
  const [total, setTotal]               = useState(initialTotal);
  const [loading, setLoading]           = useState(initialProducts.length === 0);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [subcategories, setSubcategories] = useState<CategoryItem[]>([]);
  const [refreshKey, setRefreshKey]     = useState(0);

  const searchTimer    = useRef<ReturnType<typeof setTimeout>>();
  const sentinelRef    = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(initialProducts.length > 0);

  const { isPulling, pullProgress, isRefreshing } = usePullToRefresh({
    onRefresh: () => setRefreshKey((k) => k + 1),
  });

  // Debounce search input → debouncedSearch
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  // Called by SearchParamsSync when URL params change (Navbar category links, search bar)
  const handleParamsSync = useCallback((q: string, cat: string) => {
    setSearchInput(q);
    setDSearch(q);
    setFilters((f) => ({ ...f, category: cat, subcategory: "" }));
    setPage(1);
    setProducts([]);
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (!filters.category) { setSubcategories([]); return; }
    fetch(`/api/categories?parent=${filters.category}&active=true`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setSubcategories(d.data); })
      .catch(() => {});
  }, [filters.category]);

  // Fetch products when any filter/search/page changes
  const fetchProducts = useCallback(async () => {
    // Skip the very first fetch when server already provided initialProducts
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    const isFirstPage = page === 1;
    if (isFirstPage) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      const defaultView = !debouncedSearch && !filters.category && !filters.subcategory
        && !filters.inStockOnly && !filters.organicOnly && filters.maxPrice >= 5000;
      params.set("page", String(page));
      params.set("limit", defaultView ? "50" : "12");

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filters.category)    params.set("category", filters.category);
      if (filters.subcategory) params.set("subcategory", filters.subcategory);
      if (filters.maxPrice < 5000) params.set("maxPrice", String(filters.maxPrice));
      if (filters.inStockOnly) params.set("available", "true");
      if (filters.organicOnly) params.set("organic", "true");
      if (pincodeInfo?.pincode) params.set("pincode", pincodeInfo.pincode);

      // Sort
      const [sortField, sortOrder] = filters.sortBy.includes("-")
        ? filters.sortBy.split("-")
        : [filters.sortBy, "desc"];
      params.set("sort", sortField);
      if (sortOrder === "asc") params.set("order", "asc");

      const res  = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (isFirstPage) {
          setProducts(data.data);
        } else {
          setProducts((prev) => [...prev, ...data.data]);
        }
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      // keep existing products on error
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters, page, pincodeInfo?.pincode, refreshKey]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // IntersectionObserver — load next page when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && page < totalPages) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, loadingMore, page, totalPages]);

  function updateFilter(patch: Partial<FilterState>) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setProducts([]);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
    setDSearch("");
    setPage(1);
    router.replace("/");
  }

  const activeFilterCount = [
    filters.category,
    filters.subcategory,
    filters.maxPrice < 5000,
    filters.inStockOnly,
    filters.organicOnly,
  ].filter(Boolean).length;

  // Default view: no active filter, no search — show 50 products then category cards
  const isDefaultView =
    !debouncedSearch &&
    !filters.category &&
    !filters.subcategory &&
    !filters.inStockOnly &&
    !filters.organicOnly &&
    filters.maxPrice >= 5000;

  // Reorder categories: preferred ones float to the front
  const orderedCategories = preferredCategoryIds.length > 0
    ? [
        ...initialCategories.filter((c) => preferredCategoryIds.includes(c._id)),
        ...initialCategories.filter((c) => !preferredCategoryIds.includes(c._id)),
      ]
    : initialCategories;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

      {/* Sync URL search/category params without blocking SSR */}
      <Suspense fallback={null}>
        <SearchParamsSync onSync={handleParamsSync} />
      </Suspense>

      {/* Pull-to-refresh indicator */}
      <div
        className="flex justify-center overflow-hidden transition-all duration-300 lg:hidden"
        style={{ height: (isPulling || isRefreshing) ? 40 : 0, opacity: isPulling ? pullProgress : isRefreshing ? 1 : 0 }}
      >
        <Loader2 className="w-6 h-6 text-primary animate-spin mt-2" />
      </div>

      {/* Pincode banner */}
      {pincodeInfo?.isServiceable && (
        <div className="flex items-center gap-3 bg-accent border border-primary/20 rounded-2xl
                        px-5 py-3 mb-6 text-sm animate-fade-in">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="text-dark font-medium">
            Showing products available in{" "}
            <span className="text-primary font-bold">
              {pincodeInfo.area}, {pincodeInfo.city}
            </span>
          </span>
          {pincodeInfo.estimatedDelivery && (
            <span className="ml-auto text-muted text-xs font-medium shrink-0">
              ⚡ {pincodeInfo.estimatedDelivery.min}–{pincodeInfo.estimatedDelivery.max}h delivery
            </span>
          )}
        </div>
      )}

      {/* ── Category chip strip ─────────────────────────────────────────────── */}
      <CategoryChipStrip
        categories={orderedCategories}
        activeId={filters.category}
        onSelect={(id) => { updateFilter({ category: id, subcategory: "" }); }}
      />

      {/* Section header + mobile filter button */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-dark dark:text-white">
          {debouncedSearch
            ? `Results for "${debouncedSearch}"`
            : filters.category
              ? (initialCategories.find((c) => c._id === filters.category)?.name ?? "Products")
              : "All Products"}
        </h2>

        {/* Mobile filter button */}
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden flex items-center gap-2 btn-outline py-2 text-sm shrink-0 relative"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-secondary text-white text-xs
                             font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-8">
        {/* ── Desktop filter sidebar ───────────────────────────────────────── */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="card p-5 sticky top-28">
            <FilterPanel
              categories={initialCategories}
              subcategories={subcategories}
              filters={filters}
              onFilterChange={updateFilter}
              onReset={resetFilters}
            />
          </div>
        </aside>

        {/* ── Product grid ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card p-12 text-center flex flex-col items-center">
              {/* Animated magnifying glass SVG */}
              <motion.div
                animate={{ rotate: [0, -8, 8, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                className="mb-5"
              >
                <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24" aria-hidden="true">
                  {/* Circle of magnifier */}
                  <circle cx="42" cy="42" r="26" stroke="#1A6B3A" strokeWidth="5" fill="#E8F5E9" />
                  {/* Lens glare */}
                  <path
                    d="M30 30 Q35 26 42 26"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                  {/* Handle */}
                  <line x1="61" y1="61" x2="80" y2="80" stroke="#1A6B3A" strokeWidth="5" strokeLinecap="round" />
                  {/* Question mark */}
                  <text x="34" y="52" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="700" fill="#1A6B3A">
                    ?
                  </text>
                </svg>
              </motion.div>
              <h3 className="text-lg font-bold text-dark dark:text-white mb-2">No products found</h3>
              <p className="text-muted text-sm mb-6 max-w-xs">
                {debouncedSearch
                  ? `No results for "${debouncedSearch}". Try a different keyword.`
                  : "No products match the selected filters."}
              </p>
              <button onClick={resetFilters} className="btn-primary mx-auto w-fit">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <motion.div
                key={`${debouncedSearch}-${filters.category}-${filters.subcategory}`}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                variants={{
                  visible: { transition: { staggerChildren: 0.04 } },
                }}
                initial="hidden"
                animate="visible"
              >
                {products.map((product, idx) => (
                  <motion.div
                    key={product._id.toString()}
                    variants={{
                      hidden:   { opacity: 0, y: 20 },
                      visible:  { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
                    }}
                  >
                    <ProductCard product={product} priority={idx < 4} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Infinite scroll sentinel — hidden in default view */}
              {!isDefaultView && (
                <div ref={sentinelRef} className="mt-8">
                  {loadingMore && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
                    </div>
                  )}
                  {!loadingMore && page >= totalPages && products.length > 0 && (
                    <p className="text-center text-sm text-muted py-6">
                      🎉 You&apos;ve seen all {total} products
                    </p>
                  )}
                </div>
              )}

              {/* Category cards — shown after 50 products in default view */}
              {isDefaultView && !loading && (
                <CategoryCardsSection categories={orderedCategories} />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Mobile Filter Bottom Sheet ───────────────────────────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-dark/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl
                          max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-dark">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-muted hover:text-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-5">
              <FilterPanel
                categories={initialCategories}
                subcategories={subcategories}
                filters={filters}
                onFilterChange={(patch) => { updateFilter(patch); }}
                onReset={resetFilters}
              />
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-border p-4">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Show {loading ? "..." : total} Products <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
