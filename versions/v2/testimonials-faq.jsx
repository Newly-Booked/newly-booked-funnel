// Video testimonials data + component
const TESTIMONIALS = [
  {
    name: 'Isabel',
    spa: 'Issil Beauty Spa',
    market: 'Plano, TX',
    quote: '"$18K in adspend. $220K in new patient revenue. Last month."',
    stat: '$2.9M lifetime',
    time: '02:14',
    featured: true,
    wistiaId: '8t1vtmy0my',
  },
  {
    name: 'Natalie',
    spa: 'Breeze Med Spa',
    market: 'Year 1 → Year 2',
    quote: '"I paid for the storefront — $300K — in cash, 100%."',
    stat: '$2.7M lifetime',
    time: '03:08',
    wistiaId: 's6a0lg2l2b',
  },
  {
    name: 'Couzue',
    spa: 'Papillon Med Spa',
    market: 'Minnesota',
    quote: '"I made almost $300,000 my first year in business."',
    stat: '$0 → $300K',
    time: '01:52',
    wistiaId: 'krkefwptbl',
  },
  {
    name: 'Azmi',
    spa: 'Cosmetica',
    market: 'Dallas, TX',
    quote: '"First month: $43K — no medical background, no high-ticket sales experience."',
    stat: '$43K first month',
    time: '02:36',
    wistiaId: 'f0vlaj8cng',
  },
  {
    name: 'Micaela',
    spa: 'Lemelana Med Spa',
    market: 'Arlington, VA',
    quote: '"We more than doubled the business with just Ivan\'s one service."',
    stat: '2x with one simple service',
    time: '01:48',
    wistiaId: '4ft5xbenoa',
  },
  {
    name: 'Eliana',
    spa: 'Naturalness Med Spa',
    market: 'Morrera, CA',
    quote: '"$30K in pure profit within 45 days of joining."',
    stat: '$30K extra profit, first 45 days',
    time: '02:02',
    wistiaId: '69l69xocrq',
  },
];

// Wistia still-image posters, shown until the visitor taps a card. Keeping the
// live <wistia-player> embeds OUT of the initial render is what fixes the iOS
// scroll problem: all 6 players were mounting on page load, blocking the main
// thread and trapping the scroll touch as you dragged over a video. Now each
// card is just a static <img> until you tap play, then its player loads.
const WISTIA_POSTER = {
  '8t1vtmy0my': 'https://embed-ssl.wistia.com/deliveries/bd4c21916ff10c7e6f8039e7038ac140182d7764.jpg?image_crop_resized=960x540',
  's6a0lg2l2b': 'https://embed-ssl.wistia.com/deliveries/b74a629c830d9fae124a4e192fd12510b55d6841.jpg?image_crop_resized=960x540',
  'krkefwptbl': 'https://embed-ssl.wistia.com/deliveries/7dac7b2b22438ca14b70a9e431b439dadc3c3528.jpg?image_crop_resized=960x540',
  'f0vlaj8cng': 'https://embed-ssl.wistia.com/deliveries/3555837be61c0483f2853ebce441ff26ab6fb0fe.jpg?image_crop_resized=960x540',
  '4ft5xbenoa': 'https://embed-ssl.wistia.com/deliveries/c6ed6f3dd66b4f0a67f1262d225542630f5cad87.jpg?image_crop_resized=960x540',
  '69l69xocrq': 'https://embed-ssl.wistia.com/deliveries/6772043a403f34b36848499d5486a9ba0404c45e.jpg?image_crop_resized=960x540',
};

// Inject the per-media Wistia module only once a card is activated (tapped) —
// not on mount. That's what keeps the players from loading until they're wanted.
function useWistiaEmbed(id, enabled) {
  React.useEffect(() => {
    if (!id || !enabled) return;
    const tag = `wistia-embed-${id}`;
    if (document.getElementById(tag)) return;
    const s = document.createElement('script');
    s.id = tag;
    s.src = `https://fast.wistia.com/embed/${id}.js`;
    s.type = 'module';
    s.async = true;
    document.body.appendChild(s);
  }, [id, enabled]);
}

function VideoCard({ t }) {
  const [playing, setPlaying] = React.useState(false);
  useWistiaEmbed(t.wistiaId, playing);
  const cls = `video-card${t.featured ? ' featured' : ''}${t.wistiaId ? ' has-wistia' : ''}`;
  return (
    <div className={cls}>
      <div className="video-thumb" onClick={t.wistiaId ? () => setPlaying(true) : undefined}>
        {t.wistiaId ? (
          playing ? (
            <wistia-player media-id={t.wistiaId} aspect="1.7777777777777777" autoplay="true"></wistia-player>
          ) : (
            <>
              <img className="video-poster" src={WISTIA_POSTER[t.wistiaId]} alt={`${t.name} — ${t.spa} testimonial`} decoding="async" fetchpriority="low" />
              <button className="play-btn" aria-label="Play video">▶</button>
            </>
          )
        ) : (
          <>
            <span className="timecode">▸ {t.time}</span>
            <button className="play-btn" aria-label="Play video">▶</button>
            <div className="quote">{t.quote}</div>
          </>
        )}
      </div>
      <div className="video-meta">
        <div>
          <div className="name">{t.name}</div>
          <div className="role">{t.spa} · {t.market}</div>
        </div>
        <div className="stat">{t.stat}</div>
      </div>
    </div>
  );
}

function VideoTestimonials() {
  return (
    <div className="video-grid">
      {TESTIMONIALS.map((t, i) => <VideoCard key={i} t={t} />)}
    </div>
  );
}

window.VideoTestimonials = VideoTestimonials;

// FAQ
const FAQS = [
  {
    q: 'What does this actually cost me?',
    a: 'A small per-appointment fee plus a percentage of what we generate. We walk through the exact numbers on the diagnostic (they vary by package mix and spa size). The headline: you don\'t pay us a retainer. You pay us when you sell.',
  },
  {
    q: 'My market is different. Are you sure this works in my city?',
    a: 'The most common question we get. Honest answer: every city is different, but the operator math isn\'t. A North Texas medspa went from $50K to $300K/month in a market the owner described as "worst demographics." We\'ll look at your zip code on the diagnostic and tell you straight whether it\'s a fit.',
  },
  {
    q: "I've been burned by marketing companies before. Why are you different?",
    a: 'Because we have to perform to get paid. There\'s no retainer, no $5K/month invoice you fight to cancel. If the system doesn\'t generate revenue, we don\'t make money. That\'s not a marketing pitch. It\'s the structure.',
  },
  {
    q: "I'm not a salesperson. Will I have to do consultations?",
    a: 'For the first 30–45 days, yes. You\'ll learn our $7M+ script with daily live training from Ivan. After that, you can keep selling personally (most owners do, because the close rate is highest), or train someone on your team using the same script and live coaching rhythm. Spas where the owner sells personally for the first 6 months grow significantly faster than spas that delegate too early.',
  },
  {
    q: "I can't afford another marketing investment right now.",
    a: 'Understood. The diagnostic is free. If after 45 minutes you don\'t see how this would generate more revenue than it costs, we don\'t sign you. We can\'t afford to onboard a spa that won\'t sell, because we don\'t get paid until they do.',
  },
  {
    q: "Won't a commission cost me more than a retainer over a year?",
    a: 'Not when you run the math. Most medspa packages cost roughly $130–$150 to fulfill and sell for $3,900–$10,000. That\'s an 80%+-margin product. Our percentage comes off the top of that, and unlike a retainer, you only pay when one actually sells.',
  },
  {
    q: 'I have a wellness program / new website / staff change in flight. Is now the wrong time?',
    a: 'Cash flow is what carries you through every other change. Owners who wait for "everything in place" tend to be the same owners we talk to a year later in the same spot. The diagnostic costs you 45 minutes. Take it. Decide afterward.',
  },
];

function FAQ() {
  const [open, setOpen] = React.useState(0);
  return (
    <div className="faq-list">
      {FAQS.map((f, i) => (
        <div key={i} className="faq-item">
          <button className="faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{f.q}</span>
            <span className="plus">+</span>
          </button>
          <div className="faq-a" style={{ maxHeight: open === i ? 400 : 0 }}>
            <div className="faq-a-inner">{f.a}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

window.FAQ = FAQ;
