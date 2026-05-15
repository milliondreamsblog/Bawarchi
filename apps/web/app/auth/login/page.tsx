"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight,
    Building2,
    CreditCard,
    LayoutDashboard,
    QrCode,
    ShieldCheck,
} from "lucide-react";
import Button from "@/components/Button";

const platformHighlights = [
    {
        icon: QrCode,
        title: "QR ordering flow",
        description: "Guests scan, order, and pay without waiting for staff intervention.",
    },
    {
        icon: LayoutDashboard,
        title: "Live operations dashboard",
        description: "Track orders, table activity, and menu changes from one place.",
    },
    {
        icon: CreditCard,
        title: "Verified payments",
        description: "Confirm paid orders instantly before they reach the kitchen.",
    },
];

const trustMetrics = [
    { value: "50+", label: "restaurants active" },
    { value: "28s", label: "avg. order flow" },
    { value: "24h", label: "typical onboarding" },
];

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                if (result.error.includes("pending")) {
                    setError("Your account is pending approval. Please wait for admin approval.");
                } else if (result.error.includes("blocked")) {
                    setError("Your account has been blocked. Please contact support.");
                } else {
                    setError("Invalid email or password");
                }
            } else {
                const sessionRes = await fetch("/api/auth/session");
                const session = await sessionRes.json();

                if (session?.user?.slug) {
                    router.push(`/admin/${session.user.slug}`);
                    router.refresh();
                } else {
                    setError("Login successful but failed to redirect. Please refresh.");
                }
            }
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.18),_transparent_35%),linear-gradient(135deg,#f8fff7_0%,#ecfdf3_45%,#ffffff_100%)]">
            <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(22,101,52,0.18)] backdrop-blur xl:grid-cols-[1.08fr_0.92fr]">
                    <section className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#14532d_0%,#166534_45%,#052e16_100%)] p-8 text-white sm:p-10 lg:p-12">
                        <div className="absolute inset-0">
                            <div className="absolute -left-12 top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                            <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-lime-300/20 blur-3xl" />
                        </div>

                        <div className="relative z-10">
                            <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/14">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                                    <Image
                                        src="/logoBawa.png"
                                        alt="Bawarchie"
                                        width={34}
                                        height={34}
                                        className="h-8 w-8 object-contain"
                                        priority
                                    />
                                </div>
                                Bawarchie Control Center
                            </Link>

                            <div className="mt-12 max-w-xl">
                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
                                    <ShieldCheck className="h-4 w-4" />
                                    Secure restaurant access
                                </span>
                                <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
                                    Manage service, menu, and payments from one faster login flow.
                                </h1>
                                <p className="mt-5 max-w-lg text-base leading-7 text-emerald-50/82 sm:text-lg">
                                    Built for restaurant teams that need clean operations during peak hours, not more admin friction.
                                </p>
                            </div>

                            <div className="mt-10 grid gap-4 sm:grid-cols-3">
                                {trustMetrics.map((metric) => (
                                    <div key={metric.label} className="rounded-2xl border border-white/12 bg-white/10 p-4">
                                        <div className="text-2xl font-semibold">{metric.value}</div>
                                        <div className="mt-1 text-sm text-emerald-50/78">{metric.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative z-10 mt-10 grid gap-4">
                            {platformHighlights.map((highlight) => {
                                const Icon = highlight.icon;

                                return (
                                    <div
                                        key={highlight.title}
                                        className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/8 p-4"
                                    >
                                        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/14">
                                            <Icon className="h-5 w-5 text-emerald-100" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold">{highlight.title}</h2>
                                            <p className="mt-1 text-sm leading-6 text-emerald-50/78">
                                                {highlight.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="flex items-center bg-white/85 p-6 sm:p-8 lg:p-12">
                        <div className="mx-auto w-full max-w-md">
                            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-emerald-700">Restaurant login</p>
                                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                                            Welcome back
                                        </h2>
                                    </div>
                                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                </div>

                                <p className="mt-4 text-sm leading-6 text-slate-600">
                                    Access your dashboard, manage live orders, and update tables in real time.
                                </p>

                                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                            Active portal
                                        </div>
                                        <div className="mt-1 font-medium text-slate-900">Restaurant operator</div>
                                    </div>
                                    <Link
                                        href="/super-admin/login"
                                        className="group rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-50/70"
                                    >
                                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Alternate access
                                        </div>
                                        <div className="mt-1 flex items-center justify-between font-medium text-slate-900">
                                            Super admin
                                            <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
                                        </div>
                                    </Link>
                                </div>

                                {error && (
                                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                            placeholder="Enter your password"
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData({ ...formData, password: e.target.value })
                                            }
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
                                                Signing in
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                Continue to dashboard
                                                <ArrowRight className="h-4 w-4" />
                                            </span>
                                        )}
                                    </Button>
                                </form>

                                <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                                    <p>
                                        Need access?{" "}
                                        <Link href="/auth/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">
                                            Register your restaurant
                                        </Link>
                                    </p>
                                    <Link href="/" className="font-medium text-slate-500 transition hover:text-emerald-700">
                                        Back to home
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
