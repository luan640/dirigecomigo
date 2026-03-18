import Image from 'next/image'

type BrandLogoProps = {
  className?: string
  priority?: boolean
}

export default function BrandLogo({
  className = 'h-10 w-auto',
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/logo-oficial.jpeg"
      alt="Direção Fácil"
      width={768}
      height={768}
      priority={priority}
      className={className}
    />
  )
}
