"use client"

import { usePathname } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

// Routes whose pages render their own chrome (or are app-internal) and
// should NOT be wrapped with the landing-page Header + Footer.
//
// Legal pages (/terms, /privacy, /refund, /shipping, /contact, /about) ship
// their own light-theme header + branded footer via apps/web/app/(legal)/layout.tsx —
// adding the landing chrome on top of that would render both stacked.
const NO_LANDING_CHROME_PREFIXES = [
    "/admin",
    "/super-admin",
    "/auth",
    "/r",
    "/order-success",
    "/terms",
    "/privacy",
    "/refund",
    "/shipping",
    "/contact",
    "/about",
    "/chat",
];

export default function RootLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const skipLandingChrome = NO_LANDING_CHROME_PREFIXES.some((p) =>
        pathname?.startsWith(p)
    );

    if (skipLandingChrome) {
        return <>{children}</>;
    }

    return (
        <ThemeProvider>
            <Header />
            {children}
            <Footer />
        </ThemeProvider>
    );
}
