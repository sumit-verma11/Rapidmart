export const revalidate = 60;
import { Suspense } from "react";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import Product from "@/models/Product";
import HeroSection from "./_components/HeroSection";
import ShopSection, { CategoryItem } from "@/components/ShopSection";
import HomepageRecentlyViewed from "@/components/HomepageRecentlyViewed";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import { IProduct } from "@/types";

async function getInitialData(): Promise<{ categories: CategoryItem[]; products: IProduct[]; total: number }> {
  await connectDB();
  const [cats, products, total] = await Promise.all([
    Category.find({ isActive: true, parentCategory: null })
      .sort({ sortOrder: 1, name: 1 }).lean(),
    Product.find({ isAvailable: true })
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Product.countDocuments({ isAvailable: true }),
  ]);

  const categories = cats.map((c) => ({
    _id: c._id.toString(), name: c.name, slug: c.slug,
    image: c.image, description: c.description,
  }));

  return { categories, products: JSON.parse(JSON.stringify(products)), total };
}

export default async function HomePage() {
  const { categories, products, total } = await getInitialData();

  return (
    <div className="bg-gray-50 dark:bg-gray-950">

      {/* 1. Thin rotating promo banner */}
      <HeroSection />

      {/* 2. Flash sale strip */}
      <FlashSaleBanner />

      {/* 3. Recently viewed (if any) */}
      <HomepageRecentlyViewed />

      {/* 4. Categories + Products — starts immediately */}
      <div id="shop">
        <Suspense fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="skeleton h-10 w-28 rounded-2xl shrink-0" />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white dark:bg-gray-900 overflow-hidden border border-gray-100 dark:border-gray-800">
                  <div className="skeleton aspect-square" />
                  <div className="p-3 space-y-2">
                    <div className="skeleton h-3 w-20 rounded" />
                    <div className="skeleton h-4 rounded" />
                    <div className="skeleton h-8 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }>
          <ShopSection initialCategories={categories} initialProducts={products} initialTotal={total} />
        </Suspense>
      </div>
    </div>
  );
}
