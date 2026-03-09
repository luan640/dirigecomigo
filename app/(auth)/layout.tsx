import Link from 'next/link'
import { Car } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-white">
              Meu<span className="text-emerald-400">Instrutor</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {children}
        </div>

        <p className="text-center text-blue-300 text-sm mt-6">
          © {new Date().getFullYear()} MeuInstrutor — Fortaleza, CE
        </p>
      </div>
    </div>
  )
}
