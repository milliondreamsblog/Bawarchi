import { Suspense } from "react";
import OrderSuccessPage from "./order-success";

export default function Page() {
  return (
    <Suspense>
      <OrderSuccessPage />
    </Suspense>
  );
}
