export default function Loading() {
  return (
    <div className="flex-1">
      {/* Top progress bar */}
      <div className="fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden bg-brand-soft">
        <div
          className="h-full w-1/3 rounded-full bg-brand"
          style={{
            animation: "loading-slide 1.2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Hero skeleton */}
      <div className="border-b border-line bg-mist/60">
        <div className="container-site py-14 lg:py-20">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <div className="mx-auto h-4 w-28 animate-pulse rounded-full bg-brand/10" />
            <div className="mx-auto h-9 w-3/4 animate-pulse rounded-lg bg-brand/8" />
            <div className="mx-auto h-5 w-2/3 animate-pulse rounded-lg bg-brand/6" />
          </div>
        </div>
      </div>

      {/* Content grid skeleton */}
      <div className="container-site py-12 lg:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-line bg-white"
            >
              <div className="h-40 animate-pulse bg-mist" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-mist" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-mist" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-mist" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The inline keyframes for the progress bar animation */}
      <style>{`
        @keyframes loading-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
