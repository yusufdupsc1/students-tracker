export default function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-label="লোড হচ্ছে">
      <div className="h-10 w-10 rounded-full border-3 border-bd-green-200 border-t-bd-green-700 animate-spin" />
    </div>
  )
}
