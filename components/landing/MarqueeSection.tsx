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
    <div className="relative overflow-hidden py-3.5" style={{ background: '#1B5E20' }}>
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #1B5E20, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #1B5E20, transparent)' }} />

      <div className="animate-marquee whitespace-nowrap" style={{ willChange: 'transform' }}>
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-6 text-sm font-bold tracking-wide"
            style={{ color: 'rgba(255,255,255,0.9)', fontFamily: "'Outfit', sans-serif" }}>
            {item}
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400/60 mx-2" />
          </span>
        ))}
      </div>
    </div>
  )
}
