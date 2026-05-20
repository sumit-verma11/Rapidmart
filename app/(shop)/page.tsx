export const revalidate = 300;
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import Product from "@/models/Product";
import HeroSection from "./_components/HeroSection";
import GreetingBanner from "./_components/GreetingBanner";
import SocialProofTicker from "./_components/SocialProofTicker";
import TrendingNow from "./_components/TrendingNow";
import MealSection from "./_components/MealSection";
import QuickReorder from "./_components/QuickReorder";
import GamificationWidget from "./_components/GamificationWidget";
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
    <div className="bg-gray-50 dark:bg-gray-950 pb-6">
      {/* Personalised greeting — logged-in users only */}
      <GreetingBanner />

      {/* Live social proof ticker */}
      <SocialProofTicker />

      {/* Main hero / offer carousel */}
      <HeroSection />

      {/* Flash sale banner */}
      <FlashSaleBanner />

      {/* Trending products horizontal strip */}
      <TrendingNow />

      {/* Shop by meal — recipe-based search */}
      <MealSection />

      {/* Quick reorder — returning users only */}
      <QuickReorder />

      {/* Streak + savings — logged-in users only */}
      <GamificationWidget />

      {/* Recently viewed */}
      <HomepageRecentlyViewed />

      {/* Main product grid */}
      <div id="shop" className="mt-4">
        <ShopSection
          initialCategories={categories}
          initialProducts={products}
          initialTotal={total}
        />
      </div>
    </div>
  );
}
