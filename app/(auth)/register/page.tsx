"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Leaf, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

// ─── Client-side validation rules (mirrors the Zod registerSchema) ────────────

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0)  return { label: "",        color: "bg-border",   width: "w-0"    };
  if (pw.length < 6)   return { label: "Too short", color: "bg-danger",  width: "w-1/4"  };
  if (pw.length < 8)   return { label: "Weak",      color: "bg-amber-400", width: "w-2/4" };
  if (/[^a-zA-Z0-9]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw))
                        return { label: "Strong",    color: "bg-success",  width: "w-full" };
  return               { label: "Fair",            color: "bg-yellow-400", width: "w-3/4" };
}

function validate(form: {
  name: string; email: string; password: string; confirmPassword: string; phone: string;
}): string | null {
  if (form.name.trim().length < 2)   return "Name must be at least 2 characters";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address";
  if (form.password.length < 6)      return "Password must be at least 6 characters";
  if (form.password !== form.confirmPassword) return "Passwords do not match";
  if (form.phone && !/^[6-9]\d{9}$/.test(form.phone))
    return "Enter a valid 10-digit Indian mobile number";
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name:            "",
    email:           "",
    password:        "",
    confirmPassword: "",
    phone:           "",
  });
  const [showPw,        setShowPw]        = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  }

  const strength       = getPasswordStrength(form.password);
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsMiss  = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const error = validate(form);
    if (error) { toast.error(error); return; }

    setLoading(true);
    try {
      // 1. Register
      const res  = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     form.name.trim(),
          email:    form.email.trim().toLowerCase(),
          password: form.password,
          phone:    form.phone || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed. Please try again.");
        return;
      }

      // 2. Auto-login
      const loginRes = await signIn("credentials", {
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      });

      if (loginRes?.ok) {
        toast.success("Account created! Welcome to RapidMart 🎉");
        router.push("/");
        router.refresh();
      } else {
        // Registration succeeded but auto-login failed → send to login page
        toast.success("Account created! Please sign in.");
        router.push("/login");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-modal border border-border">

        {/* ── Logo ────────────────────────────────────────────────────────── */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-primary rounded-xl p-2">
              <Leaf className="w-5 h-5 text-white" />
            </span>
            <span className="text-xl font-extrabold text-dark">
              Fresh<span className="text-primary">Cart</span>
            </span>
          </Link>
        </div>

        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-dark">Create account</h1>
          <p className="text-muted text-sm mt-1">Join RapidMart and shop fresh today</p>
        </div>

        {/* Google sign-up */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 border border-border
                     rounded-2xl py-2.5 px-4 text-sm font-semibold text-dark
                     hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed mb-5"
        >
          {googleLoading ? (
            <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted font-medium">or sign up with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Arjun Mehta"
                className="input pl-10"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Email address *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="input pl-10"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Phone number{" "}
              <span className="font-normal text-muted">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="tel"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                }
                placeholder="9876543210"
                className="input pl-10"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Password *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type={showPw ? "text" : "password"}
                required
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters"
                className="input pl-10 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2
                           text-muted hover:text-dark transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength bar */}
            {form.password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                  />
                </div>
                <p className="text-xs text-muted">{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Confirm Password *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type={showConfirmPw ? "text" : "password"}
                required
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className={`input pl-10 pr-11 transition-colors
                            ${passwordsMatch ? "border-success focus:ring-success/20"
                            : passwordsMiss  ? "border-danger  focus:ring-danger/20"
                                             : ""}`}
              />
              {/* Show/hide toggle */}
              <button
                type="button"
                onClick={() => setShowConfirmPw((v) => !v)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2
                           text-muted hover:text-dark transition-colors"
                aria-label={showConfirmPw ? "Hide password" : "Show password"}
              >
                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {/* Match indicator */}
              {passwordsMatch && (
                <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2
                                         w-4 h-4 text-success" />
              )}
              {passwordsMiss && (
                <XCircle className="absolute right-10 top-1/2 -translate-y-1/2
                                    w-4 h-4 text-danger" />
              )}
            </div>
            {passwordsMiss && (
              <p className="text-xs text-danger mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || passwordsMiss}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white
                              rounded-full animate-spin" />
            ) : (
              <>Create Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
