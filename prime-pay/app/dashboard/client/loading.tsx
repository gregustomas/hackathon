import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 py-8 cs-container">
      {/* Header */}
      <header className="flex md:flex-row flex-col justify-between md:items-end gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </header>

      <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-2 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-40" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-6 w-56" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
              <Skeleton className="h-8 w-40" />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="gap-4 grid grid-cols-1 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-xl" />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-48 w-full rounded-xl" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

