import Image from 'next/image'

export default function ChristmasBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      {/* Photo layer (kept subtle) */}
      <div className="absolute inset-0 relative">
        <Image
          src="/images/detail-lights.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-20 saturate-150 contrast-120 brightness-90"
          priority={false}
        />
      </div>

      {/* Warm festive bokeh - Christmas lights twinkling */}
      <div className="absolute inset-0 bg-festive-bokeh opacity-70" />

      {/* Subtle noise for a photographic feel */}
      <div className="absolute inset-0 bg-festive-noise opacity-[0.10] mix-blend-overlay" />

      {/* Vignette - cosy room shadows */}
      <div className="absolute inset-0 bg-festive-vignette opacity-85" />

      {/* Fireplace glow - warm orange/yellow from bottom right, like a real fire */}
      <div className="absolute right-[10%] bottom-[-5%] h-[800px] w-[900px] rounded-full blur-3xl animate-fire-flicker" style={{ background: 'radial-gradient(circle, rgba(255, 140, 0, 0.3), rgba(255, 193, 7, 0.2), transparent 70%)' }} />
      <div className="absolute right-[8%] bottom-[-3%] h-[600px] w-[700px] rounded-full blur-3xl animate-fire-flicker-delayed" style={{ background: 'radial-gradient(circle, rgba(255, 140, 0, 0.25), transparent 60%)' }} />

      {/* Candlelight - warm golden spots around the room */}
      <div className="absolute left-[15%] top-[25%] h-[300px] w-[300px] rounded-full bg-fire-gold/15 blur-2xl animate-candle-flicker" />
      <div className="absolute right-[12%] top-[20%] h-[280px] w-[280px] rounded-full bg-fire-gold/12 blur-2xl animate-candle-flicker-delayed" />

      {/* Christmas tree lights glow - warm white/gold sparkles */}
      <div className="absolute left-1/2 top-[15%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white/8 blur-3xl animate-twinkle" />
      <div className="absolute left-[25%] top-[35%] h-[350px] w-[350px] rounded-full bg-fire-gold/10 blur-2xl animate-twinkle-delayed" />

      {/* Soft ambient glow around main content area - like light from a mantelpiece */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fire-gold/5 blur-3xl" />
    </div>
  )
}
