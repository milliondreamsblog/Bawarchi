"use client";

import React from "react";
import AdminFooter from "@/components/admin/AdminFooter";
import AuthHeader from "./AuthHeader";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <AuthHeader />
            <div className="flex-1 bg-gradient-to-br from-green-50 to-white">
                <div className="container max-w-7xl mx-auto py-8 px-6">
                    <main className="w-full">{children}</main>
                </div>
            </div>

            <AdminFooter />
        </div>
    );
}
