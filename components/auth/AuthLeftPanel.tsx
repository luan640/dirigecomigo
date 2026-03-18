import Link from 'next/link'
import BrandLogo from '@/components/layout/BrandLogo'

/** Driver's-seat POV scene — green-night sky, road vanishing point, dashboard, steering wheel */
function CarScene() {
  return (
    <svg
      viewBox="0 0 480 700"
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Sky — deep green-black night */}
        <linearGradient id="lp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#020d04" />
          <stop offset="40%"  stopColor="#031006" />
          <stop offset="62%"  stopColor="#071a09" />
          <stop offset="78%"  stopColor="#0a1e0c" />
          <stop offset="100%" stopColor="#040c05" />
        </linearGradient>

        {/* Horizon glow — green city lights */}
        <radialGradient id="lp-hglow" cx="50%" cy="100%" r="85%">
          <stop offset="0%"   stopColor="#21a637" stopOpacity="0.55" />
          <stop offset="30%"  stopColor="#21a637" stopOpacity="0.22" />
          <stop offset="60%"  stopColor="#21a637" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#21a637" stopOpacity="0"    />
        </radialGradient>

        {/* Road surface */}
        <linearGradient id="lp-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#050d06" />
          <stop offset="100%" stopColor="#030804" />
        </linearGradient>

        {/* Steering-wheel glow */}
        <radialGradient id="lp-wglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#21a637" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#21a637" stopOpacity="0"    />
        </radialGradient>
      </defs>

      {/* ── Sky ── */}
      <rect width="480" height="700" fill="url(#lp-sky)" />

      {/* Horizon city-light glow */}
      <ellipse cx="240" cy="368" rx="290" ry="110" fill="url(#lp-hglow)" />

      {/* Thin horizon line */}
      <line
        x1="36" y1="368" x2="444" y2="368"
        stroke="#21a637" strokeWidth="1" strokeOpacity="0.30"
      />

      {/* ── City silhouette ── */}
      <g fill="#040c05" fillOpacity="0.94">
        {/* Left cluster */}
        <rect x="5"   y="340" width="18" height="28" />
        <rect x="20"  y="323" width="15" height="45" />
        <rect x="32"  y="344" width="11" height="24" />
        <rect x="40"  y="328" width="19" height="40" />
        <rect x="56"  y="341" width="13" height="27" />
        <rect x="66"  y="332" width="16" height="36" />
        <rect x="79"  y="347" width="10" height="21" />
        <rect x="87"  y="336" width="14" height="32" />
        <rect x="98"  y="349" width="9"  height="19" />
        {/* Antennae */}
        <rect x="26"  y="315" width="2"  height="8"  />
        <rect x="45"  y="320" width="2"  height="8"  />
        {/* Right cluster */}
        <rect x="367" y="343" width="13" height="25" />
        <rect x="377" y="325" width="19" height="43" />
        <rect x="393" y="341" width="11" height="27" />
        <rect x="401" y="321" width="21" height="47" />
        <rect x="419" y="337" width="15" height="31" />
        <rect x="431" y="329" width="17" height="39" />
        <rect x="445" y="345" width="10" height="23" />
        <rect x="452" y="335" width="14" height="33" />
        {/* Antennae */}
        <rect x="382" y="317" width="2"  height="8"  />
        <rect x="406" y="313" width="2"  height="8"  />
      </g>

      {/* ── Road ── */}
      <polygon points="240,368 -220,700 700,700" fill="url(#lp-road)" />

      {/* Road shoulder glow lines */}
      <line x1="240" y1="368" x2="-60"  y2="700"
        stroke="#21a637" strokeWidth="1.5" strokeOpacity="0.16" />
      <line x1="240" y1="368" x2="540"  y2="700"
        stroke="#21a637" strokeWidth="1.5" strokeOpacity="0.16" />

      {/* Centre lane dashes — perspective scaled */}
      <rect x="237" y="376" width="6"  height="12" rx="1" fill="white" fillOpacity="0.15" />
      <rect x="234" y="403" width="12" height="19" rx="1" fill="white" fillOpacity="0.18" />
      <rect x="229" y="440" width="22" height="28" rx="1" fill="white" fillOpacity="0.20" />

      {/* ── Dashboard ── */}
      <path d="M 0 432 Q 240 390 480 432 L 480 710 L 0 710 Z" fill="#020704" />
      <path d="M 0 432 Q 240 390 480 432" stroke="#0d2010" strokeWidth="1.5" fill="none" />

      {/* Instrument cluster housing */}
      <rect x="148" y="412" width="184" height="44" rx="8" fill="#030a05" fillOpacity="0.7" />

      {/* Indicator lights — realistic car colours */}
      <circle cx="195" cy="434" r="3" fill="#f6c400" fillOpacity="0.45" />
      <circle cx="210" cy="434" r="3" fill="#21a637" fillOpacity="0.50" />
      <circle cx="225" cy="434" r="3" fill="#21a637" fillOpacity="0.40" />
      <circle cx="240" cy="434" r="3" fill="#f6c400" fillOpacity="0.35" />
      <circle cx="255" cy="434" r="3" fill="#60b8ff" fillOpacity="0.38" />
      <circle cx="270" cy="434" r="3" fill="#21a637" fillOpacity="0.40" />
      <circle cx="285" cy="434" r="3" fill="#ff4040" fillOpacity="0.30" />

      {/* ── Steering wheel ──
           Centre: (240, 450) | outer-rim r=92 | hub r=26
           Spoke 1 — 12 o'clock: inner (240,424) → outer (240,358)
           Spoke 2 — 4  o'clock: inner (263,463) → outer (320,496)
           Spoke 3 — 8  o'clock: inner (217,463) → outer (160,496)
      */}

      {/* Ambient glow */}
      <circle cx="240" cy="450" r="130" fill="url(#lp-wglow)" />

      {/* Outer rim — dark base + bright green edge */}
      <circle cx="240" cy="450" r="92"
        stroke="#0d4a18" strokeWidth="12" strokeOpacity="0.35" />
      <circle cx="240" cy="450" r="92"
        stroke="#21a637" strokeWidth="3"  strokeOpacity="0.30" />

      {/* Yellow grip marks (like the logo) */}
      {/* Top grip */}
      <path d="M 220 362 A 92 92 0 0 1 260 362"
        stroke="#f6c400" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.55" fill="none" />
      {/* Bottom-left grip */}
      <path d="M 168 490 A 92 92 0 0 1 148 470"
        stroke="#f6c400" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.55" fill="none" />
      {/* Bottom-right grip */}
      <path d="M 312 490 A 92 92 0 0 0 332 470"
        stroke="#f6c400" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.55" fill="none" />

      {/* Spoke 12 o'clock */}
      <line x1="240" y1="424" x2="240" y2="358"
        stroke="#0d4a18" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1="240" y1="424" x2="240" y2="358"
        stroke="#21a637" strokeWidth="3"  strokeLinecap="round" strokeOpacity="0.28" />

      {/* Spoke 4 o'clock */}
      <line x1="263" y1="463" x2="320" y2="496"
        stroke="#0d4a18" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1="263" y1="463" x2="320" y2="496"
        stroke="#21a637" strokeWidth="3"  strokeLinecap="round" strokeOpacity="0.28" />

      {/* Spoke 8 o'clock */}
      <line x1="217" y1="463" x2="160" y2="496"
        stroke="#0d4a18" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1="217" y1="463" x2="160" y2="496"
        stroke="#21a637" strokeWidth="3"  strokeLinecap="round" strokeOpacity="0.28" />

      {/* Hub ring */}
      <circle cx="240" cy="450" r="26"
        stroke="#0d4a18" strokeWidth="9"  strokeOpacity="0.35" />
      <circle cx="240" cy="450" r="26"
        stroke="#21a637" strokeWidth="3"  strokeOpacity="0.28" />

      {/* Hub centre — white like logo */}
      <circle cx="240" cy="450" r="9" fill="#21a637" fillOpacity="0.30" />
      <circle cx="240" cy="450" r="4" fill="white"   fillOpacity="0.20" />

      {/* Steering column */}
      <line x1="240" y1="462" x2="240" y2="505"
        stroke="#21a637" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.14" />

      {/* ── Rearview mirror ── */}
      <rect x="180" y="8" width="120" height="40" rx="6" fill="#020704" />
      <rect x="182" y="10" width="116" height="36" rx="5" fill="#051209" fillOpacity="0.9" />
      <rect x="182" y="10" width="116" height="12" rx="5" fill="white" fillOpacity="0.03" />

      {/* ── A-pillars ── */}
      <polygon points="0,0 72,0 38,368 0,368"   fill="#010503" fillOpacity="0.93" />
      <polygon points="480,0 408,0 442,368 480,368" fill="#010503" fillOpacity="0.93" />

      {/* Windshield header strip */}
      <rect x="0" y="0" width="480" height="20" fill="#010503" fillOpacity="0.80" />
    </svg>
  )
}

interface AuthLeftPanelProps {
  headline: React.ReactNode
  subtext: string
}

export default function AuthLeftPanel({ headline, subtext }: AuthLeftPanelProps) {
  return (
    <div className="hidden lg:flex flex-col w-[46%] relative overflow-hidden border-r border-white/5">
      {/* Car scene */}
      <div className="absolute inset-0">
        <CarScene />
      </div>

      {/* Readability gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            'linear-gradient(to bottom,',
            'rgba(2,13,4,0.62) 0%,',
            'rgba(2,13,4,0.20) 20%,',
            'rgba(2,13,4,0.00) 38%,',
            'rgba(2,13,4,0.00) 52%,',
            'rgba(2,13,4,0.74) 68%,',
            'rgba(2,13,4,0.95) 82%,',
            'rgba(2,13,4,0.98) 100%)',
          ].join(' '),
        }}
      />

      {/* Panel content */}
      <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
        <Link href="/" className="inline-flex">
          <BrandLogo className="h-11 w-auto rounded-md" priority />
        </Link>

        <div className="mt-auto">
          <h2
            className="text-4xl xl:text-[2.6rem] font-bold text-[#e8f5ea] leading-[1.1] mb-4"
            style={{ fontFamily: 'Syne, system-ui, sans-serif' }}
          >
            {headline}
          </h2>
          <p className="text-[#6b9675] text-sm leading-relaxed max-w-[290px]">
            {subtext}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8 pt-7 border-t border-white/[0.07]">
          {[
            { value: '500+', label: 'Instrutores' },
            { value: '10k+', label: 'Aulas dadas' },
            { value: '4.9★', label: 'Avaliação'  },
          ].map((s) => (
            <div key={s.label}>
              <p
                className="text-xl font-bold text-[#e8f5ea]"
                style={{ fontFamily: 'Syne, system-ui, sans-serif' }}
              >
                {s.value}
              </p>
              <p className="text-xs text-[#6b9675] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
