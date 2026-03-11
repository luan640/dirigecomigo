import Link from 'next/link'

import BrandLogo from '@/components/layout/BrandLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#03122f_0%,#041f4b_52%,#0b3163_100%)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center">
            <BrandLogo className="h-16 w-auto rounded-md" priority />
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-[0_24px_70px_rgba(2,12,36,0.45)]">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-[#d6e2f3]">
          Copyright {new Date().getFullYear()} DirecaoFacil - Fortaleza e região metropolitana.
        </p>
      </div>
    </div>
  )
}
