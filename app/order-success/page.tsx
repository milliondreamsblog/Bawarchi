import { Suspense } from "react";
import OrderSuccessPage from "./order-success";
import AdminHeader from "../auth/AuthHeader";
import AdminFooter from "@/components/admin/AdminFooter";

export default function Page() {
  return (
    <Suspense>
      <OrderSuccessPage />
      <AdminFooter/>
    </Suspense>
  );
}
