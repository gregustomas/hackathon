export default function SettingsLoading() {
  return (
    <div className="space-y-6 py-8 cs-container">
      <div>
        <div className="bg-muted rounded w-48 h-8 animate-pulse" />
        <div className="bg-muted mt-2 rounded w-64 h-4 animate-pulse" />
      </div>

      <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
        <div className="bg-muted rounded-lg h-64 animate-pulse" />
        <div className="bg-muted rounded-lg h-64 animate-pulse" />
        <div className="md:col-span-2 bg-muted rounded-lg h-80 animate-pulse" />
      </div>
    </div>
  );
}
