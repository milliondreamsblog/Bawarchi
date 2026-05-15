"use client"

import { usePathname } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export default function RootLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Check if current route is an admin, super-admin, or auth route
    const isAdminRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/super-admin") || pathname?.startsWith("/auth") || pathname?.startsWith("/r") || pathname?.startsWith("/order-success"); 

    return (
        <>
            {!isAdminRoute && <Header />}
            {children}
            {!isAdminRoute && <Footer />}
        </>
    );
}
