"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Menu, Bell } from "lucide-react";

export default function AdminHeader({ onMenuClick }: { onMenuClick?: () => void }) {
    const { data: session } = useSession();
    const params = useParams();
    const pathname = usePathname();
    const slug = params?.slug as string | undefined;

    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [restaurantName, setRestaurantName] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState(0);

    // Resolve slug → restaurant id (only on admin pages)
    useEffect(() => {
        if (!slug) return;
        fetch(`/api/restaurant/by-slug/${slug}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.success) {
                    setRestaurantId(d.restaurant._id);
                    setRestaurantName(d.restaurant.name);
                }
            })
            .catch(() => {});
    }, [slug]);

    // Poll pending-order count every 8s
    useEffect(() => {
        if (!restaurantId) return;
        let cancelled = false;
        const fetchPending = async () => {
            try {
                const res = await fetch(`/api/orders?restaurantId=${restaurantId}`);
                const data = await res.json();
                if (!cancelled && data.success) {
                    setPendingCount(
                        (data.orders || []).filter((o: any) => o.status === "pending").length
                    );
                }
            } catch {}
        };
        fetchPending();
        const id = setInterval(fetchPending, 8000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [restaurantId, pathname]);

    return (
        <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
            <div className="flex items-center justify-between h-14 px-4 sm:px-5">
                {/* Left: menu + brand */}
                <div className="flex items-center gap-3 min-w-0">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-stone-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            <Menu className="w-5 h-5 text-stone-700" />
                        </button>
                    )}
                    <Link href="/" className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#324F7B] flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-serif italic text-sm">B</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 leading-none">Bawarchie</p>
                            {restaurantName && (
                                <p className="text-sm font-semibold text-stone-900 truncate leading-tight mt-0.5">
                                    {restaurantName}
                                </p>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Right: live ping + user + signout */}
                <div className="flex items-center gap-2">
                    {slug && (
                        <Link
                            href={`/admin/${slug}/orders`}
                            className="relative p-2 rounded-lg hover:bg-stone-100 transition-colors"
                            aria-label="Pending orders"
                            title={`${pendingCount} pending order${pendingCount === 1 ? "" : "s"}`}
                        >
                            <Bell className="w-5 h-5 text-stone-600" />
                            {pendingCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                    {pendingCount}
                                </span>
                            )}
                        </Link>
                    )}

                    {session?.user && (
                        <span className="hidden sm:inline-block text-xs text-stone-500 px-2">
                            {session.user.name}
                        </span>
                    )}

                    <button
                        onClick={() => signOut({ callbackUrl: "/auth/login" })}
                        className="p-2 rounded-lg hover:bg-red-50 text-stone-500 hover:text-red-600 transition-colors"
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
