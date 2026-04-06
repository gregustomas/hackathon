export default function ChildDashboardLoading() {
  return (
    <div className="space-y-8 py-8 cs-container">
      <div className="flex md:flex-row flex-col justify-between gap-4">
        <div className="space-y-2">
          <div className="bg-muted rounded w-40 h-8 animate-pulse" />
          <div className="bg-muted rounded w-52 h-4 animate-pulse" />
        </div>
        <div className="bg-muted rounded-full w-56 h-8 animate-pulse" />
      </div>

      <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
        {/* Levý sloupec skeletony */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-muted rounded-xl h-40 animate-pulse" />
          <div className="bg-muted rounded-xl h-56 animate-pulse" />
          <div className="bg-muted rounded-xl h-36 animate-pulse" />
        </div>

        {/* Pravý sloupec skeletony */}
        <div className="space-y-6 lg:col-span-2">
          <div className="bg-muted rounded-xl h-40 animate-pulse" />
          <div className="bg-muted rounded-xl h-64 animate-pulse" />
          <div className="bg-muted rounded-xl h-40 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
