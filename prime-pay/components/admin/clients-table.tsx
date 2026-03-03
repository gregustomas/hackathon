"use client"

import { useState, useMemo } from "react"
import type { Client } from "@/app/dashboard/admin/actions"
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

interface Props {
  clients: Client[]
}

export default function ClientsTable({ clients: initialData }: Props) {
  const [clients, setClients] = useState<Client[]>(initialData)
  const [pendingAction, setPendingAction] = useState<{ client: Client, type: "block" | "unblock" } | null>(null)
  const [globalFilter, setGlobalFilter] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Funkce pro přepnutí statusu (používá is_active logiku z DB)
  function handleStatusToggle() {
    if (!pendingAction) return
    const { client, type } = pendingAction
    const newStatus = type === "block" ? "blocked" : "active"

    setClients((prev) =>
      prev.map((c) =>
        c.id === client.id ? { ...c, status: newStatus as "active" | "blocked" } : c
      )
    )
    setPendingAction(null)
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
      header: "Klient",
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
          <Badge variant={status === "active" ? "outline" : "destructive"} className="capitalize">
            {status === "active" ? "Aktivní" : "Blokovaný"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "balance",
      header: "Zůstatek",
      cell: ({ getValue }) => {
        const val = getValue() as number | null
        return (
          <span className="font-mono text-sm">
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
        <span className="text-muted-foreground font-mono text-xs">
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
  ], [])

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
    <div className="py-12 px-4 max-w-7xl mx-auto">
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight">Správa klientů</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {clients.length} registrovaných profilů v systému
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Všichni</TabsTrigger>
            <TabsTrigger value="active">Aktivní</TabsTrigger>
            <TabsTrigger value="blocked">Blokovaní</TabsTrigger>
          </TabsList>
        </Tabs>

        <Input
          placeholder="Hledat klienta..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="uppercase tracking-widest text-[10px] font-bold">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                  Žádní klienti neodpovídají výběru
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={row.original.status === "blocked" ? "bg-muted/30" : ""}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Strana {table.getState().pagination.pageIndex + 1} z {table.getPageCount()}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Předchozí
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Další
          </Button>
        </div>
      </div>

      {/* Dynamic Action Dialog */}
      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "block" ? "Zablokovat účet" : "Aktivovat účet"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete {pendingAction?.type === "block" ? "zablokovat" : "odblokovat"} klienta{" "}
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