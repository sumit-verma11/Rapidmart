export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { Zap, Leaf, Shield, Clock } from "lucide-react";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import HeroSection from "./_components/HeroSection";
import { ClaimOfferButton, ClaimOfferLink } from "./_components/ClaimOfferButton";
import ShopSection, { CategoryItem } from "@/components/ShopSection";
import HomepageRecentlyViewed from "@/components/HomepageRecentlyViewed";
import JustForYou from "@/components/JustForYou";
import FlashSaleBanner from "@/components/FlashSaleBanner";

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
  { icon: Zap,    title: "2-Hour Delivery",  desc: "Order before 12 PM for same-day delivery" },
  { icon: Leaf,   title: "100% Fresh",        desc: "Farm-to-doorstep freshness guaranteed"    },
  { icon: Shield, title: "Safe & Hygienic",   desc: "Carefully handled and packed with care"   },
  { icon: Clock,  title: "24/7 Support",      desc: "We're always here when you need us"       },
];

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div className="bg-gray-50">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── Offer ticker ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100 py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm font-medium text-amber-800">
          🎉 New user offer: Get{" "}
          <span className="font-extrabold text-amber-600">₹100 OFF</span> your first order
          with code{" "}
          <code className="rounded-lg bg-amber-100 px-2 py-0.5 font-mono font-bold text-amber-700">
            FRESH100
          </code>
          {" "}· Min ₹299{" "}
          <ClaimOfferLink />
        </div>
      </div>

      {/* ── Features strip ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="group flex items-center gap-3 rounded-2xl p-3 transition-colors
                           duration-200 hover:bg-emerald-50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                                bg-emerald-50 text-primary transition-colors duration-200
                                group-hover:bg-emerald-100">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="mt-0.5 text-xs leading-tight text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Flash sale (live countdown) ───────────────────────────────────────── */}
      <FlashSaleBanner />

      {/* ── Recently viewed ───────────────────────────────────────────────────── */}
      <HomepageRecentlyViewed />

      {/* ── Shop section ──────────────────────────────────────────────────────── */}
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

      {/* ── Just For You ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <JustForYou />
      </div>

      {/* ── Promo banner ──────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br
                        from-[#0f4c2a] via-[#1A6B3A] to-[#1e7d43] p-8 lg:p-12 shadow-xl">
          {/* Orbs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64
                          rounded-full bg-white/5 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/3 h-48 w-48
                          rounded-full bg-yellow-400/10 blur-2xl" />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center
                          justify-between gap-8">
            <div className="text-white">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-yellow-300">
                ✦ Limited Time Offer
              </p>
              <h2 className="mb-3 text-3xl font-extrabold leading-tight lg:text-4xl">
                Get ₹100 Off
                <br />Your First Order!
              </h2>
              <p className="max-w-md text-sm text-white/70">
                Use code{" "}
                <span className="rounded-lg bg-white/10 px-2 py-0.5 font-mono font-bold text-yellow-300">
                  FRESH100
                </span>{" "}
                at checkout. Min. order ₹299. Valid for new users only.
              </p>
            </div>
            <ClaimOfferButton />
          </div>
        </div>
      </section>

    </div>
  );
}
