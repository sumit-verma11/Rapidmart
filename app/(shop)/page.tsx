export const revalidate = 300;
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import Product from "@/models/Product";
import HeroSection from "./_components/HeroSection";
import ShopSection, { CategoryItem } from "@/components/ShopSection";
import HomepageRecentlyViewed from "@/components/HomepageRecentlyViewed";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import { IProduct } from "@/types";

const getInitialData = unstable_cache(
  async (): Promise<{ categories: CategoryItem[]; products: IProduct[]; total: number }> => {
    await connectDB();
    const [cats, products, total] = await Promise.all([
      Category.find({ isActive: true, parentCategory: null })
        .sort({ sortOrder: 1, name: 1 })
        .select("name slug image description")
        .lean(),
      Product.find({ isAvailable: true })
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .select("name slug images variants stockQty isAvailable isOrganic isFeatured category flashSale")
        .limit(20)
        .lean(),
      Product.countDocuments({ isAvailable: true }),
    ]);

    const categories = cats.map((c) => ({
      _id: c._id.toString(), name: c.name, slug: c.slug,
      image: c.image, description: c.description,
    }));

    return { categories, products: JSON.parse(JSON.stringify(products)), total };
  },
  ["homepage-initial-data"],
  { revalidate: 300 }
);

// No searchParams prop — keeps this page ISR-cacheable (revalidate=300).
// URL param sync happens client-side via SearchParamsSync inside ShopSection.
export default async function HomePage() {
  const { categories, products, total } = await getInitialData();

  return (
    <div className="bg-gray-50 dark:bg-gray-950">
      <HeroSection />
      <FlashSaleBanner />
      <HomepageRecentlyViewed />
      <div id="shop">
        <ShopSection
          initialCategories={categories}
          initialProducts={products}
          initialTotal={total}
        />
      </div>
    </div>
  );
}
