export default function MarqueeSection() {
  const items = [
    '🏙️ Aldeota',
    '🌴 Meireles',
    '🏘️ Messejana',
    '🏠 Parangaba',
    '🌊 Beira-Mar',
    '🏙️ Benfica',
    '🏘️ Maracanaú',
    '🌿 Caucaia',
    '🏠 Montese',
    '🏙️ Papicu',
    '🚗 CNH primeira habilitação',
    '🎓 Sem medo de dirigir',
    '⭐ Instrutores verificados',
    '📍 Perto de você',
    '🏙️ Fátima',
    '🏘️ Itaperi',
    '🌴 Fortaleza — CE',
    '🚦 Aulas práticas',
    '💳 Pagamento seguro',
    '🗓️ Horários flexíveis',
  ]

  const doubled = [...items, ...items]

  return (
    <div className="relative overflow-hidden py-4" style={{ background: '#178a2e' }}>
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #178a2e, transparent)' }} />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #178a2e, transparent)' }} />

      <div className="animate-marquee whitespace-nowrap" style={{ willChange: 'transform' }}>
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 mx-6 text-sm font-bold tracking-wide"
            style={{ color: '#e8f5ea', fontFamily: "'Outfit', sans-serif" }}
          >
            {item}
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/30 mx-2" />
          </span>
        ))}
      </div>
    </div>
  )
}
