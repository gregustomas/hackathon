import { getClients } from "./actions";
import ClientsTable from "@/components/admin/clients-table";

export default async function AdminPage() {
  const clients = await getClients();
  return <ClientsTable clients={clients} />;
}