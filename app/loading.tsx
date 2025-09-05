import { Shimmer } from "@/components/ui/shimmer"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="w-full max-w-4xl space-y-6">
        {/* Header shimmer */}
        <div className="space-y-4">
          <Shimmer className="h-8 bg-gray-200 rounded w-1/3" />
          <Shimmer className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        
        {/* Content cards shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
              <Shimmer className="h-6 bg-gray-200 rounded w-3/4" />
              <Shimmer className="h-4 bg-gray-200 rounded w-full" />
              <Shimmer className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="flex gap-2">
                <Shimmer className="h-8 bg-gray-200 rounded w-16" />
                <Shimmer className="h-8 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom section shimmer */}
        <div className="space-y-4">
          <Shimmer className="h-64 bg-gray-200 rounded-lg w-full" />
        </div>
      </div>
    </div>
  )
}
