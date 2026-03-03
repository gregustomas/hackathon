import { getUsers } from "./actions";
import ClientsTable from "@/components/admin/clients-table";

export default async function AdminPage() {
  const [clients, bankers] = await Promise.all([
    getUsers("CLIENT"),
    getUsers("BANKER")
  ]);

  return (
    <div className="cs-container">
      {/* Sekce Klienti */}
      <ClientsTable clients={clients} title="Správa klientů" />

      {/* Vizuální oddělení */}
      <div className="px-4 md:px-8">
        <hr className="border-border opacity-50" />
      </div>

      {/* Sekce Bankéři */}
      <ClientsTable clients={bankers} title="Správa bankéřů" />
    </div>
  );
}