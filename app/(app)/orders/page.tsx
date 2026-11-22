import { Page } from "@/components/page";
import { SectionsSkeleton } from "@/components/states";
import { getCurrentUser } from "@/lib/session";
import { getOrders } from "@/lib/trading/orders";
import { OrdersList } from "./orders-list";

// Strona zleceń.
const OrdersPage = () => (
  <Page
    title="Zlecenia"
    description="Zlecenia warunkowe i automatyczne zakupy są sprawdzane w tle co kilkanaście sekund — nawet gdy zamkniesz kartę przeglądarki."
    fallback={<SectionsSkeleton count={2} />}
  >
    <Orders />
  </Page>
);

export default OrdersPage;

// Komponent pobierający i wyświetlający wszystkie zlecenia użytkownika.
const Orders = async () => {
  const user = await getCurrentUser();
  return <OrdersList orders={await getOrders(user.id)} showMarket />;
};
