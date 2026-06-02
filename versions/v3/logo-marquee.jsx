// Logo marquee — scrolls right (opposite direction of testimonial marquee)
const LOGOS = [
  { src: 'assets/logos/aesthetic-artistry.webp', alt: 'Aesthetic Artistry', invert: false },
  { src: 'assets/logos/papillon-effect.webp', alt: 'The Papillon Effect Wellness', invert: false },
  { src: 'assets/logos/thryv.webp', alt: 'Thryv Aesthetics & Wellness', invert: false },
  { src: 'assets/logos/hwc.webp', alt: 'The Health & Wellness Center', invert: false },
  { src: 'assets/logos/sculpt-squad.webp', alt: 'Sculpt Squad', invert: false },
  { src: 'assets/logos/o-body-wellness.webp', alt: 'O Body + Wellness', invert: false },
  { src: 'assets/logos/naturalness.webp', alt: 'Naturalness Med Spa', invert: false },
  { src: 'assets/logos/mdw.webp', alt: 'MDW', invert: true },
  { src: 'assets/logos/lemelana.webp', alt: 'Lemelana Medspa', invert: false },
  { src: 'assets/logos/la-vie.webp', alt: 'La Vie Med Spas & Salon', invert: false },
  { src: 'assets/logos/journey-beauty.webp', alt: 'Journey to Beauty and Wellness', invert: true },
  { src: 'assets/logos/hello-skin.webp', alt: 'Hello Skin Medspa', invert: false },
  { src: 'assets/logos/eternal-vitality.webp', alt: 'Eternal Beauty Med Spa & Vitality Clinic', invert: false },
  { src: 'assets/logos/somabel.webp', alt: "Ericka's SomaBel Med Spa", invert: false },
  { src: 'assets/logos/emvee.webp', alt: 'Emvee by Marcella Valdes', invert: false },
  { src: 'assets/logos/crb.webp', alt: 'CRB', invert: true },
  { src: 'assets/logos/cosmetica.webp', alt: 'Cosmetica Laser & Skin', invert: false },
  { src: 'assets/logos/comprehensive-derm.webp', alt: 'Comprehensive Dermatology', invert: false },
  { src: 'assets/logos/breeze.webp', alt: 'Breeze Med Spa', invert: false },
  { src: 'assets/logos/body-sculpt.webp', alt: 'Body Sculpt', invert: false },
];

function LogoMarquee() {
  // duplicate for seamless loop
  const items = [...LOGOS, ...LOGOS];
  return (
    <div className="logo-marquee">
      <div className="logo-marquee-inner">
        {items.map((l, i) => (
          <div className="logo-cell" key={i}>
            <img
              src={l.src}
              alt={l.alt}
              style={l.invert ? { filter: 'invert(1)' } : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

window.LogoMarquee = LogoMarquee;
