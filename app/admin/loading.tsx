export default function AdminLoading() {
  return (
    <div className="min-h-screen">
      {/* Top progress bar */}
      <div className="fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden bg-brand-soft">
        <div
          className="h-full w-1/3 rounded-full bg-brand"
          style={{
            animation: "admin-loading-slide 1.2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Admin content skeleton */}
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        {/* Page header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-white/80" />
          <div className="h-4 w-72 animate-pulse rounded bg-white/60" />
        </div>

        {/* Stats row skeleton */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-line bg-white p-5"
            >
              <div className="h-3 w-20 animate-pulse rounded bg-mist" />
              <div className="mt-3 h-7 w-16 animate-pulse rounded-lg bg-mist" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="mt-8 overflow-hidden rounded-xl border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <div className="h-5 w-32 animate-pulse rounded bg-mist" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-line/50 px-5 py-4 last:border-0"
            >
              <div className="h-9 w-9 animate-pulse rounded-full bg-mist" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 animate-pulse rounded bg-mist" />
                <div className="h-3 w-1/5 animate-pulse rounded bg-mist" />
              </div>
              <div className="h-7 w-20 animate-pulse rounded-full bg-mist" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes admin-loading-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
