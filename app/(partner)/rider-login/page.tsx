"use client";

import { Suspense, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Bike, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

function RiderLoginForm() {
  const router = useRouter();

  const [form,    setForm]    = useState({ email: "", password: "" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      email:    form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    });

    if (res?.error) {
      const msg = res.error === "CredentialsSignin" ? "Invalid email or password" : res.error;
      toast.error(msg);
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role    = session?.user?.role;

    if (role !== "rider" && role !== "admin") {
      toast.error("This account is not a delivery partner account.");
      setLoading(false);
      return;
    }

    toast.success("Welcome back, Partner!");
    router.push(role === "admin" ? "/admin/dashboard" : "/rider");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm px-4">

      {/* Back link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-orange-100 hover:text-white transition-colors mb-8"
      >
        <ChevronLeft className="w-4 h-4" /> Customer login
      </Link>

      {/* Card */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">

        {/* Logo / title */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4 shadow-lg">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Delivery Partner</h1>
          <p className="text-orange-200 text-sm mt-1">RapidMart Partner Portal</p>
        </div>

        {/* Info banner */}
        <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 mb-6 text-sm text-orange-100">
          Use the credentials provided by RapidMart to access your account.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-orange-100 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300" />
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="partner@rapidmart.in"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-orange-300/60
                           rounded-2xl pl-10 pr-4 py-3 text-sm outline-none
                           focus:border-white/50 focus:ring-2 focus:ring-white/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-orange-100 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300" />
              <input
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-orange-300/60
                           rounded-2xl pl-10 pr-11 py-3 text-sm outline-none
                           focus:border-white/50 focus:ring-2 focus:ring-white/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-orange-300 hover:text-white transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 mt-2 py-3.5 rounded-2xl font-bold
                       text-orange-900 bg-white hover:bg-orange-50 transition-colors disabled:opacity-60 shadow-lg"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-orange-300 border-t-orange-700 rounded-full animate-spin" />
            ) : (
              <>Start Delivering <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-orange-200/70 mt-6">
          Don&apos;t have credentials? Contact your RapidMart admin.
        </p>
      </div>
    </div>
  );
}

export default function RiderLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500
                    flex flex-col items-center justify-center">
      <Suspense
        fallback={
          <div className="w-full max-w-sm px-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8
                            flex items-center justify-center h-64">
              <span className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          </div>
        }
      >
        <RiderLoginForm />
      </Suspense>
    </div>
  );
}
