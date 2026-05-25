"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail } from "lucide-react";
import Button from "@/components/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Something went wrong.");
      } else {
        setSent(true);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] px-4">
      <div className="w-full max-w-md">
        <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <Link
            href="/auth/login"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <Image
                src="/logoBawa.png"
                alt="Bawarchie"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Reset password
            </h1>
          </div>

          {sent ? (
            <div className="mt-6">
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <Mail className="h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-sm leading-6 text-emerald-800">
                  If an account exists for <strong>{email}</strong>, we've sent
                  a password reset link. Check your inbox and spam folder.
                </p>
              </div>
              <Link
                href="/auth/login"
                className="mt-6 block text-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Enter the email address you used to register your restaurant.
                We'll send you a link to reset your password.
              </p>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    placeholder="manager@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-2xl bg-slate-900 py-3.5 text-base text-white shadow-none hover:bg-emerald-700"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending
                    </span>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
