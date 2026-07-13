export default function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-label="লোড হচ্ছে">
      <div className="h-8 w-8 rounded-full border-2 border-maroon border-t-transparent animate-spin" />
    </div>
  )
}
