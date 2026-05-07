/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { signOut, useSession } from "next-auth/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import {
    LayoutDashboard,
    UtensilsCrossed,
    Boxes,
    BookOpen,
    Grid3x3,
    Receipt,
    Star,
    ChefHat,
    BarChart3,
    Settings,
    LogOut,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";

export default function RestaurantLayout({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const slug = params.slug as string;
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            fetchRestaurant();
        } else if (status === "unauthenticated") {
            router.push("/auth/login");
        }
    }, [status, session, slug, router]);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    const fetchRestaurant = async () => {
        try {
            const res = await fetch(`/api/restaurant/by-slug/${slug}`);
            const data = await res.json();
            if (data.success) {
                const rest = data.restaurant;
                setRestaurant(rest);
                if (session?.user.role === "restaurant" && session.user.id !== rest._id) {
                    router.push("/auth/login");
                }
            } else {
                router.push("/404");
            }
        } catch (error) {
            console.error("Failed to fetch restaurant:", error);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#324F7B]">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-2 border-[#86A6DE]/30 border-t-[#86A6DE] rounded-full animate-spin mb-3" />
                    <p className="text-white/80 text-sm">Loading…</p>
                </div>
            </div>
        );
    }

    if (!session || !restaurant) return null;

    const navItems = [
        { href: `/admin/${slug}`, label: "Dashboard", icon: LayoutDashboard },
        { href: `/admin/${slug}/orders`, label: "Orders", icon: Receipt },
        { href: `/admin/${slug}/kitchen`, label: "Kitchen", icon: ChefHat },
        { href: `/admin/${slug}/items`, label: "Items", icon: UtensilsCrossed },
        { href: `/admin/${slug}/inventory`, label: "Inventory", icon: Boxes },
        { href: `/admin/${slug}/menu`, label: "Menu", icon: BookOpen },
        { href: `/admin/${slug}/tables`, label: "Tables", icon: Grid3x3 },
        { href: `/admin/${slug}/feedback`, label: "Feedback", icon: Star },
        { href: `/admin/${slug}/analytics`, label: "Analytics", icon: BarChart3 },
        { href: `/admin/${slug}/settings`, label: "Settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-[#F8F8F8]">
            <AdminHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className="flex flex-1 relative">
                {/* Mobile backdrop */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-stone-900/40 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Sidebar — icon rail with hover-expand on desktop */}
                <aside
                    className={`
                        fixed lg:sticky lg:top-14
                        inset-y-0 left-0 lg:inset-y-auto
                        z-50 lg:z-30
                        w-56 lg:w-16 lg:hover:w-56
                        bg-white border-r border-stone-200
                        flex flex-col
                        h-screen lg:h-[calc(100vh-3.5rem)]
                        transform transition-all duration-200 ease-out
                        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                        group/rail
                        overflow-hidden
                    `}
                >
                    <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                        {navItems.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    title={label}
                                    className={`flex items-center h-11 px-3 rounded-lg transition-colors whitespace-nowrap ${
                                        active
                                            ? "bg-[#324F7B] text-white"
                                            : "text-stone-600 hover:bg-stone-100 hover:text-[#324F7B]"
                                    }`}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="ml-3 text-sm font-medium lg:opacity-0 lg:group-hover/rail:opacity-100 transition-opacity">
                                        {label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-2 border-t border-stone-200">
                        <button
                            onClick={() => signOut({ callbackUrl: "/auth/login" })}
                            title="Sign out"
                            className="flex items-center w-full h-11 px-3 rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors whitespace-nowrap"
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span className="ml-3 text-sm font-medium lg:opacity-0 lg:group-hover/rail:opacity-100 transition-opacity">
                                Sign out
                            </span>
                        </button>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 min-w-0">
                    <div className="px-4 sm:px-6 py-5">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
