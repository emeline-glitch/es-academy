export default function PlatformLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg" />
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-2 bg-gray-100 rounded-full" />
            <div className="h-10 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
