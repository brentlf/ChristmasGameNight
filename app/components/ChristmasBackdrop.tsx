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
          className="object-cover opacity-25 saturate-125 contrast-110"
          priority={false}
        />
      </div>

      {/* Warm festive bokeh */}
      <div className="absolute inset-0 bg-festive-bokeh opacity-80" />

      {/* Subtle noise for a photographic feel */}
      <div className="absolute inset-0 bg-festive-noise opacity-[0.12] mix-blend-overlay" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-festive-vignette opacity-90" />

      {/* Soft spotlight behind main content */}
      <div className="absolute left-1/2 top-[-10%] h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute left-[10%] top-[20%] h-[420px] w-[420px] rounded-full bg-christmas-gold/10 blur-3xl" />
      <div className="absolute right-[6%] top-[35%] h-[520px] w-[520px] rounded-full bg-christmas-green/10 blur-3xl" />
    </div>
  )
}
