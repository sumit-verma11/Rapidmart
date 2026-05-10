export const dynamic = "force-dynamic";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Leaf, Shield, Clock, Star, Truck } from "lucide-react";
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
    .sort({ sortOrder: 1, name: 1 }).lean();
  return cats.map((c) => ({
    _id: c._id.toString(), name: c.name, slug: c.slug,
    image: c.image, description: c.description,
  }));
}

const CATEGORY_SHOWCASE = [
  { emoji: "🥦", name: "Fruits & Veggies", desc: "Farm fresh daily",   gradient: "from-emerald-500 to-green-600",   slug: "fruits-vegetables" },
  { emoji: "🥛", name: "Dairy & Eggs",     desc: "Cold chain assured", gradient: "from-sky-500 to-blue-600",        slug: "dairy-eggs"        },
  { emoji: "🍞", name: "Bakery & Breads",  desc: "Baked this morning", gradient: "from-amber-500 to-orange-500",    slug: "bakery"            },
  { emoji: "🧃", name: "Beverages",        desc: "Refresh yourself",   gradient: "from-violet-500 to-purple-600",   slug: "beverages"         },
  { emoji: "🍿", name: "Snacks",           desc: "Guilt-free bites",   gradient: "from-rose-500 to-pink-600",       slug: "snacks"            },
  { emoji: "🐟", name: "Meat & Seafood",   desc: "Catch of the day",   gradient: "from-cyan-500 to-teal-600",       slug: "meat-seafood"      },
];

const BENTO_STATS = [
  { icon: Truck,  val: "2hr",   label: "Avg Delivery",    color: "text-emerald-400", bg: "bg-emerald-950/60" },
  { icon: Star,   val: "4.8",   label: "App Rating",      color: "text-yellow-400",  bg: "bg-yellow-950/60"  },
  { icon: Leaf,   val: "100%",  label: "Freshness",       color: "text-green-400",   bg: "bg-green-950/60"   },
  { icon: Zap,    val: "50K+",  label: "Happy Customers", color: "text-violet-400",  bg: "bg-violet-950/60"  },
];

const FEATURES = [
  { icon: Zap,    title: "2-Hour Delivery",  desc: "Same-day guaranteed",      gradient: "from-amber-400 to-orange-500"  },
  { icon: Leaf,   title: "100% Fresh",       desc: "Farm-to-doorstep",         gradient: "from-emerald-400 to-green-600" },
  { icon: Shield, title: "Safe & Hygienic",  desc: "Packed with care",         gradient: "from-sky-400 to-blue-600"      },
  { icon: Clock,  title: "24/7 Support",     desc: "Always here for you",      gradient: "from-violet-400 to-purple-600" },
];

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div className="bg-gray-50 dark:bg-gray-950">

      {/* ── Hero (compact banner) ─────────────────────────── */}
      <HeroSection />

      {/* ── Flash sale ───────────────────────────────────── */}
      <FlashSaleBanner />

      {/* ── Category Showcase ────────────────────────────── */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Shop by Category</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Fresh picks across every aisle</p>
            </div>
            <Link href="#shop"
              className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORY_SHOWCASE.map(({ emoji, name, desc, gradient }, i) => (
              <Link href={`#shop`} key={name}
                className="group relative overflow-hidden rounded-2xl aspect-square flex flex-col
                           items-center justify-center gap-2 cursor-pointer
                           bg-gradient-to-br shadow-md hover:shadow-xl
                           hover:-translate-y-1 transition-all duration-300 "
                style={{
                  animationDelay: `${i * 60}ms`,
                  background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)" }} />
                <span className="relative z-10 text-4xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{emoji}</span>
                <div className="relative z-10 text-center px-2">
                  <p className="text-xs font-black text-white leading-tight">{name.split(" & ")[0]}</p>
                  <p className="text-[10px] text-white/70">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* ── Bento stats + offer grid ─────────────────────── */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Offer card — spans 2 cols on large */}
            <div className="col-span-2 relative overflow-hidden rounded-3xl bg-[#070f09] p-6 flex flex-col justify-between min-h-[160px]">
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full bg-yellow-400/10 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <p className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-2">Limited Offer</p>
                <p className="text-3xl font-black text-white leading-tight">Get ₹100 Off<br />Your First Order</p>
                <p className="text-sm text-white/50 mt-1">Code: <span className="font-mono font-bold text-emerald-400">FRESH100</span> · Min ₹299</p>
              </div>
              <ClaimOfferButton />
            </div>

            {/* Stat cards */}
            {BENTO_STATS.map(({ icon: Icon, val, label, color, bg }) => (
              <div key={label} className={`rounded-3xl ${bg} border border-white/5 p-5 flex flex-col justify-between min-h-[120px]`}>
                <Icon className={`w-6 h-6 ${color}`} />
                <div>
                  <p className={`text-3xl font-black ${color}`}>{val}</p>
                  <p className="text-sm text-white/50 font-medium mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* ── Feature strip ────────────────────────────────── */}
      <AnimatedSection>
        <div className="bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {FEATURES.map(({ icon: Icon, title, desc, gradient }) => (
                <div key={title}
                  className="group flex items-center gap-3 rounded-2xl p-3
                             hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                  <div className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${gradient}
                                   flex items-center justify-center shadow-sm
                                   group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Promo ticker ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20
                      border-b border-amber-100 dark:border-amber-900/20 py-2">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm font-medium text-amber-800 dark:text-amber-300">
          🎉 New user? Get <span className="font-extrabold text-amber-600 dark:text-amber-400">₹100 OFF</span> with code{" "}
          <code className="rounded-lg bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 font-mono font-bold text-amber-700 dark:text-amber-300">FRESH100</code>
          {" "}· Min ₹299 <ClaimOfferLink />
        </div>
      </div>

      {/* ── Recently viewed ──────────────────────────────── */}
      <HomepageRecentlyViewed />

      {/* ── Shop section ─────────────────────────────────── */}
      <div id="shop" className="pt-2">
        <Suspense fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex gap-2 mb-8 overflow-x-auto">
              {Array.from({ length: 7 }).map((_, i) => <div key={i} className="skeleton h-10 w-32 rounded-2xl shrink-0" />)}
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
        }>
          <ShopSection initialCategories={categories} />
        </Suspense>
      </div>

      {/* ── Just For You ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <JustForYou />
      </div>

      {/* ── Bottom promo ─────────────────────────────────── */}
      <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="relative overflow-hidden rounded-3xl bg-[#070f09] shadow-2xl">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-8 bottom-0 h-48 w-48 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-8 lg:p-10">
              <div className="text-white">
                <p className="mb-1 text-xs font-black uppercase tracking-widest text-yellow-400">✦ Limited Time</p>
                <h2 className="text-3xl font-black leading-tight lg:text-4xl">
                  Get ₹100 Off<br />Your First Order!
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  Code: <span className="font-mono font-bold text-emerald-400">FRESH100</span> · Min ₹299 · New users only
                </p>
              </div>
              <div className="flex flex-col gap-2.5 shrink-0">
                <ClaimOfferButton />
                <Link href="#shop" className="inline-flex items-center justify-center gap-1.5 text-white/50 hover:text-white text-sm font-medium transition-colors">
                  Browse first <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
