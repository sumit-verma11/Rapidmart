export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { Zap, Leaf, Shield, Clock, ArrowRight } from "lucide-react";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import HeroSection from "./_components/HeroSection";
import { ClaimOfferButton, ClaimOfferLink } from "./_components/ClaimOfferButton";
import ShopSection, { CategoryItem } from "@/components/ShopSection";
import HomepageRecentlyViewed from "@/components/HomepageRecentlyViewed";
import JustForYou from "@/components/JustForYou";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import AnimatedSection from "./_components/AnimatedSection";

async function getCategories(): Promise<CategoryItem[]> {
  await connectDB();
  const cats = await Category.find({ isActive: true, parentCategory: null })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return cats.map((c) => ({
    _id:         c._id.toString(),
    name:        c.name,
    slug:        c.slug,
    image:       c.image,
    description: c.description,
  }));
}

const FEATURES = [
  { icon: Zap,    title: "2-Hour Delivery",  desc: "Same-day delivery guaranteed",  color: "from-amber-400 to-orange-500"  },
  { icon: Leaf,   title: "100% Fresh",       desc: "Farm-to-doorstep freshness",    color: "from-emerald-400 to-green-600" },
  { icon: Shield, title: "Safe & Hygienic",  desc: "Packed with care every time",   color: "from-sky-400 to-blue-600"      },
  { icon: Clock,  title: "24/7 Support",     desc: "Always here when you need us",  color: "from-violet-400 to-purple-600" },
];

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div className="bg-gray-50 dark:bg-gray-950">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── Flash sale ───────────────────────────────────────── */}
      <FlashSaleBanner />

      {/* ── Promo ticker ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30
                      border-b border-amber-100 dark:border-amber-900/30 py-2.5">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm font-medium text-amber-800 dark:text-amber-300">
          🎉 New user offer: Get{" "}
          <span className="font-extrabold text-amber-600 dark:text-amber-400">₹100 OFF</span>
          {" "}with code{" "}
          <code className="rounded-lg bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 font-mono font-bold text-amber-700 dark:text-amber-300">
            FRESH100
          </code>
          {" "}· Min ₹299{" "}
          <ClaimOfferLink />
        </div>
      </div>

      {/* ── Feature strip ─────────────────────────────────────── */}
      <AnimatedSection>
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
                <div
                  key={title}
                  className="group flex items-center gap-3 rounded-2xl p-3.5
                             hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 cursor-default"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${color}
                                   flex items-center justify-center shadow-sm
                                   group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Recently viewed ───────────────────────────────────── */}
      <HomepageRecentlyViewed />

      {/* ── Shop section ──────────────────────────────────────── */}
      <div id="shop" className="pt-2">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="flex gap-2 mb-8 overflow-x-auto">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="skeleton h-10 w-32 rounded-2xl shrink-0" />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card overflow-hidden">
                    <div className="skeleton aspect-square" />
                    <div className="p-3 space-y-2">
                      <div className="skeleton h-3 w-16 rounded" />
                      <div className="skeleton h-4 rounded" />
                      <div className="skeleton h-3 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <ShopSection initialCategories={categories} />
        </Suspense>
      </div>

      {/* ── Just For You ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <JustForYou />
      </div>

      {/* ── Promo banner ──────────────────────────────────────── */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b3d20] via-[#1A6B3A] to-[#2d9e58]" />
            {/* Animated orb */}
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-yellow-400/10 blur-2xl" />
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

            <div className="relative flex flex-col lg:flex-row items-start lg:items-center
                            justify-between gap-8 p-8 lg:p-12">
              <div className="text-white">
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-yellow-300">
                  ✦ Limited Time Offer
                </p>
                <h2 className="mb-3 text-3xl font-black leading-tight lg:text-4xl">
                  Get ₹100 Off
                  <br />Your First Order!
                </h2>
                <p className="max-w-md text-sm text-white/70 leading-relaxed">
                  Use code{" "}
                  <span className="rounded-lg bg-white/10 px-2 py-0.5 font-mono font-bold text-yellow-300">
                    FRESH100
                  </span>{" "}
                  at checkout. Min. order ₹299. New users only.
                </p>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <ClaimOfferButton />
                <a href="#shop" className="inline-flex items-center justify-center gap-2 text-white/70
                               hover:text-white text-sm font-medium transition-colors">
                  Browse products <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

    </div>
  );
}
