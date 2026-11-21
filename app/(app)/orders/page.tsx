import { Suspense } from "react";
import { SectionsSkeleton } from "@/components/states";
import { getCurrentUser } from "@/lib/session";
import { getOrders } from "@/lib/trading/orders";
import { OrdersList } from "./orders-list";

// Wszystkie zlecenia warunkowe i plany automatycznego kupowania — aktywne i historia.
const OrdersPage = () => (
  <>
    <div>
      <h1 className="text-2xl font-semibold">Zlecenia</h1>
      <p className="text-sm text-muted">
        Zlecenia warunkowe i automatyczne zakupy są sprawdzane w tle co kilkanaście sekund — nawet gdy zamkniesz kartę przeglądarki.
      </p>
    </div>
    {/* Sesję czytamy w czasie żądania, więc treść musi być w <Suspense>. */}
    <Suspense fallback={<SectionsSkeleton count={2} />}>
      <Orders />
    </Suspense>
  </>
);

export default OrdersPage;

const Orders = async () => {
  const user = await getCurrentUser();
  return <OrdersList orders={await getOrders(user.id)} showMarket />;
};
