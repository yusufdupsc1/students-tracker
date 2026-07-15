import { Link } from 'react-router-dom'

const FEATURES = [
  { title: 'ড্যাশবোর্ড', desc: 'সম্পূর্ণ স্কুলের এক নজরে সারসংক্ষেপ — গড়, পাস রেট, A+ গণনা' },
  { title: 'ফলাফল ক্যार্ড', desc: 'প্রতিটি শিক্ষার্থীর প্রিন্টযোগ্য ফলাফল ক্যার্ড স্বয়ংক্রিয়ভাবে' },
  { title: 'MTR ট্র্যাকিং', desc: 'মিড টার্ম রিভিউ — বাংলা, গণিত ও ইংরেজি সাবলীল পঠন মূল্যায়ন' },
  { title: 'QR আইডি', desc: 'প্রতিটি শিক্ষার্থীর QR কোড — presence ও অ্যাক্সেস নিয়ন্ত্রণের জন্য' },
  { title: 'Excel ইমপোর্ট', desc: 'বিদ্যমান Excel শিট থেকে ডেটা আমদানি — প্রিভিউ + প্রতিস্থাপন' },
  { title: 'এনক্রিপ্টেড ব্যাকআপ', desc: 'AES-256-GCM এনক্রিপ্টেড ব্যাকআপ — ডেটা সুরক্ষা ও পুনরুদ্ধার' }
]

const PLANS = [
  { name: 'Basic', price: '৳২৯৯/মাস', students: '১০০+ শিক্ষার্থী', features: ['ড্যাশবোর্ড', 'ফলাফল ক্যার্ড', 'MTR ট্র্যাকিং', 'Excel ইমপোর্ট'] },
  { name: 'Pro', price: '৳৪৯৯/মাস', students: '৩০০+ শিক্ষার্থী', features: ['Basic-এর সব +', 'QR আইডি', 'এনক্রিপ্টেড ব্যাকআপ', 'ওফলাইন PWA'] },
  { name: 'Enterprise', price: '৳৯৯৯/মাস', students: 'অন )[সীমিত', features: ['Pro-এর সব +', 'SMS বিজ্ঞপ্তি', 'অভিভাবক পোর্টাল', 'উন্নত রিপোর্ট'] }
]

export default function Landing() {
  return (
    <div className="min-h-full">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-bd-green-900 via-bd-green-800 to-bd-green-900 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight mb-6">
            বেজখণ্ড স্কুল ট্র্যাকার
          </h1>
          <p className="text-lg md:text-xl text-bd-green-100 mb-8 max-w-2xl mx-auto">
            বাংলাদেশের সরকারি প্রাথমিক বিদ্যালয়ের জন্য অফলাইন-ফার্স্ট রেজাল্ট ম্যানেজমেন্ট সিস্টেম।
            Excel-এর唧יטה স overhaul করুন।
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup" className="rounded-xl bg-white text-bd-green-900 px-8 py-3.5 text-lg font-heading font-bold shadow-lg hover:bg-bd-green-50 transition-colors">
              বিনামূল্যে ট্রায়াল শুরু করুন
            </Link>
            <Link to="/login" className="rounded-xl border border-white/30 px-8 py-3.5 text-lg font-heading font-medium hover:bg-white/10 transition-colors">
              লগইন
            </Link>
          </div>
          <p className="mt-4 text-sm text-bd-green-200">কোনো ক্রেডিটকার্ড প্রয়োজন নেই — ১৪ দিন বিনামূল্যে</p>
        </div>
      </header>

      {/* Features */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-12 text-bd-green-900">প্রতিটি স্কুলের জন্য প্রয়োজনীয় সব কিছু</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card p-6 hover:shadow-soft-lg transition-all duration-200">
                <h3 className="text-lg font-heading font-semibold mb-2 text-bd-green-900">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24 bg-bd-green-50/50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-4 text-bd-green-900">সহজ মূল্য — স্কুলের বাজেটের মতো</h2>
          <p className="text-center text-gray-600 mb-12">সকল প্ল্যানে ১৪ দিন বিনামূল্যে ট্রায়াল</p>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.name} className="glass-card p-6 flex flex-col hover:shadow-soft-lg transition-all duration-200">
                <h3 className="text-xl font-heading font-bold text-bd-green-900">{plan.name}</h3>
                <div className="text-3xl font-heading font-bold text-bd-green-700 my-2">{plan.price}</div>
                <p className="text-sm text-gray-500 mb-4">{plan.students}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm text-gray-700 flex items-start gap-2">
                      <svg className="w-5 h-5 text-bd-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="block text-center rounded-xl border border-bd-green-700 text-bd-green-700 px-4 py-2.5 text-sm font-semibold hover:bg-bd-green-50 transition-colors">
                  শুরু করুন
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bd-green-900 text-bd-green-100 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} বেজখণ্ড স্কুল ট্র্যাকার — সব ডেটা লোকাল, নিরাপদ ও গোপনীয়</p>
        </div>
      </footer>
    </div>
  )
}
