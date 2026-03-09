import Link from 'next/link'

import BrandLogo from '@/components/layout/BrandLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center">
            <BrandLogo className="h-16 w-auto rounded-md" priority />
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-2xl">{children}</div>

        <p className="mt-6 text-center text-sm text-blue-300">
          Copyright {new Date().getFullYear()} Direcao Facil - Fortaleza, CE
        </p>
      </div>
    </div>
  )
}
