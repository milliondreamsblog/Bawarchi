"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Button from "@/components/Button";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Something went wrong.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="mt-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          Invalid reset link. Please request a new one from the login page.
        </div>
        <Link
          href="/auth/forgot-password"
          className="mt-4 block text-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm leading-6 text-emerald-800">
            Your password has been reset successfully. You can now sign in with
            your new password.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="mt-6 block text-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        Choose a new password for your restaurant account.
      </p>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            New password
          </label>
          <input
            type="password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <input
            type="password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
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
              Resetting
            </span>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
              New password
            </h1>
          </div>

          <Suspense
            fallback={
              <div className="mt-8 flex justify-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
