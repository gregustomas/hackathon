"use client"

import { useState, useMemo } from "react"
import { Client } from "@/interfaces/admin"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toggleUserStatus } from "@/app/dashboard/admin/actions"


interface Props {
  clients: Client[]
  title: string
}

export default function ClientsTable({ clients: initialData, title }: Props) {
  const [clients, setClients] = useState<Client[]>(initialData)
  const [pendingAction, setPendingAction] = useState<{ client: Client, type: "block" | "unblock" } | null>(null)
  const [globalFilter, setGlobalFilter] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Pomocná logika pro skloňování v textech
  const isBanker = title.toLowerCase().includes("bankéř")
  const entityLabel = isBanker ? "bankéře" : "klienta"
  const entityName = isBanker ? "Bankéř" : "Klient"

    async function handleStatusToggle() {
    if (!pendingAction) return;
    
    // Uložíme si data, abychom mohli hned zavřít modal
    const { client, type } = pendingAction;
    setPendingAction(null); // Zavře modal hned po kliknutí pro lepší pocit odezvy
    
    const currentStatus = type === "block" ? "active" : "blocked";

    // Můžeme udělat i tzv. Optimistic Update (hned si změnit lokální stav, ať nečekáme na DB)
    setClients((prev) =>
      prev.map((c) =>
        c.id === client.id ? { ...c, status: type === "block" ? "blocked" : "active" } : c
      )
    );

    // Volaání na pozadí do Supabase
    const result = await toggleUserStatus(client.id, currentStatus);
    
    if (!result.success) {
        // Pokud se to náhodou nepovedlo, vrátíme lokální state zpět a můžeme ukázat třeba toast notifikaci
        setClients((prev) =>
          prev.map((c) =>
            c.id === client.id ? { ...c, status: currentStatus } : c
          )
        );
        alert("Nepodařilo se změnit stav: " + result.message);
    }
  }

  const filteredByTab = useMemo(() => {
    return clients.filter((c) => {
      if (activeTab === "all") return true
      return c.status === activeTab
    })
  }, [clients, activeTab])

  const columns = useMemo<ColumnDef<Client>[]>(() => [
    {
      id: "name",
      header: entityName,
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: ({ row, getValue }) => (
        <span className={`font-medium ${row.original.status === "blocked" ? "text-muted-foreground line-through" : ""}`}>
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row, getValue }) => (
        <span className={`font-mono text-sm ${row.original.status === "blocked" ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue() as string
        return (
          <Badge variant={status === "active" ? "success" : "destructive"} className="capitalize">
            {status === "active" ? "Aktivní" : "Blokovaný"}
          </Badge>
        )
      },
    },
    {  
      id: "balance", 
      header: "Zůstatek",
      accessorFn: (row) => {
        // Linter teď ví, že 'row' je 'Client' a že 'Client' obsahuje 'accounts'
        if (row.accounts && row.accounts.length > 0) {
            return row.accounts[0].balance;
        }
        return null;
      },
      cell: ({ getValue }) => {
        const val = getValue() as number | null
        return (
          <span className="font-mono font-semibold text-sm">
            {val !== null && val !== undefined
              ? val.toLocaleString("cs-CZ") + " CZK"
              : "0 CZK"}
          </span>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Registrace",
      cell: ({ getValue }) => (
        <span className="font-mono text-muted-foreground text-xs">
          {new Date(getValue() as string).toLocaleDateString("cs-CZ")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const isBlocked = row.original.status === "blocked"
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className={isBlocked 
                ? "text-primary hover:bg-primary/10" 
                : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}
              onClick={() => setPendingAction({ 
                client: row.original, 
                type: isBlocked ? "unblock" : "block" 
              })}
            >
              {isBlocked ? "Odblokovat" : "Blokovat"}
            </Button>
          </div>
        )
      },
    },
  ], [entityName])

  const table = useReactTable({
    data: filteredByTab,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  return (
    <div className="px-4 md:px-10 py-12 w-full">
      {/* Header section */}
      <div className="mb-7">
        <h1 className="font-bold text-3xl tracking-tight">{title}</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {clients.length} registrovaných profilů v roli {entityName}
        </p>
      </div>

      {/* Controls section */}
      <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">Všichni</TabsTrigger>
            <TabsTrigger value="active">Aktivní</TabsTrigger>
            <TabsTrigger value="blocked">Blokovaní</TabsTrigger>
          </TabsList>
        </Tabs>

        <Input
          placeholder={`Hledat ${entityLabel}...`}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="bg-card max-w-sm"
        />
      </div>

      {/* Table section - Full Width */}
      <div className="bg-card shadow-sm border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-4 font-bold text-[10px] uppercase tracking-widest">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-20 text-muted-foreground text-center italic">
                  Nenalezeni žádní {isBanker ? "bankéři" : "klienti"} odpovídající výběru
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id} 
                  className={`transition-colors ${row.original.status === "blocked" ? "bg-muted/20 opacity-75" : "hover:bg-muted/10"}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination section */}
      <div className="flex justify-between items-center mt-6">
        <p className="text-muted-foreground text-sm">
          Strana <span className="font-medium text-foreground">{table.getState().pagination.pageIndex + 1}</span> z <span className="font-medium text-foreground">{table.getPageCount()}</span>
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => table.previousPage()} 
            disabled={!table.getCanPreviousPage()}
            className="px-4"
          >
            Předchozí
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => table.nextPage()} 
            disabled={!table.getCanNextPage()}
            className="px-4"
          >
            Další
          </Button>
        </div>
      </div>

      {/* Dialog for blocking/unblocking */}
      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "block" ? "Zablokovat účet" : "Aktivovat účet"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete {pendingAction?.type === "block" ? "zablokovat" : "odblokovat"} {entityLabel}{" "}
              <span className="font-semibold text-foreground">
                {pendingAction?.client.first_name} {pendingAction?.client.last_name}
              </span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusToggle}
              className={pendingAction?.type === "block" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              Potvrdit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}