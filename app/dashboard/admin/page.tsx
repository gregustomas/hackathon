import { Separator } from "@/components/ui/separator";
import { getUsers, getAdminLogs } from "./actions";
import ClientsTable from "@/components/admin/clients-table";
import AuditLogs from "@/components/admin/audit-logs";
import { generateMockData } from "./generate-mock"; // Pomocný mock generator
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  // Načteme všechny potřebné kolekce dat najednou, aby byla stránka rychlá
  const [clients, bankers, logs] = await Promise.all([
    getUsers("CLIENT"),
    getUsers("BANKER"),
    getAdminLogs()
  ]);

  // Pomocná serverová akce pro tlačítko generátoru
  async function handleGenerateMock() {
    "use server";
    await generateMockData();
  }

  return (
    <div className="space-y-12 py-8 cs-container">
        
      {/* ------------------------------------------- */}
      {/* TOOLBAR PRO DEVELOPERA (Lze pak smazat)   */}
      {/* ------------------------------------------- */}
      <div className="flex justify-end px-4 md:px-10">
         <form action={handleGenerateMock}>
             <Button type="submit" variant="outline" size="sm" className="text-xs">
                + Vygenerovat Mock Data
             </Button>
         </form>
      </div>

      {/* ------------------------------------------- */}
      {/* SEKCE: KLIENTI                              */}
      {/* ------------------------------------------- */}
      <ClientsTable clients={clients} title="Správa klientů" />

      {/* Vizuální oddělení */}
      <div className="px-4 md:px-8">
        <Separator />
      </div>

      {/* ------------------------------------------- */}
      {/* SEKCE: BANKÉŘI                              */}
      {/* ------------------------------------------- */}
      <ClientsTable clients={bankers} title="Správa bankéřů" />

      {/* Vizuální oddělení */}
      <div className="px-4 md:px-8">
        <Separator />
      </div>

      {/* ------------------------------------------- */}
      {/* SEKCE: AUDITNÍ LOGY                         */}
      {/* ------------------------------------------- */}
      <div className="px-4 md:px-10 pb-12">
          <AuditLogs logs={logs} />
      </div>
      
    </div>
  );
}
