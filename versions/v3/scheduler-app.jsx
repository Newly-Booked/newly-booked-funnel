// Scheduling page — composes the post-form flow.

// GHL booking widget. Loads the per-calendar iframe + the embed script that
// auto-resizes the iframe to the widget's actual content height. The lead's
// name/email/phone come in via URL params from the qualifier and get
// forwarded to GHL so the form starts pre-filled.
// Calendar BGNQmAzoXkDO1ZTo90c0 served from GHL's default
// api.leadconnectorhq.com host instead of the custom
// link.newlybooked.com — the custom domain's SSL cert has been flaky
// (Chrome ERR_SSL_PROTOCOL_ERROR, Safari renders blank). Switch back to
// the branded URL once GHL's auto-issued cert on the custom domain is
// confirmed working in Safari (the strictest browser for SSL).
const NB_GHL_CALENDAR_ID = 'BGNQmAzoXkDO1ZTo90c0';
const NB_GHL_BOOKING_URL = `https://api.leadconnectorhq.com/widget/booking/${NB_GHL_CALENDAR_ID}`;
const NB_GHL_EMBED_SCRIPT = 'https://api.leadconnectorhq.com/js/form_embed.js';

function GhlBookingWidget() {
  React.useEffect(() => {
    if (document.getElementById('ghl-form-embed-script')) return;
    const s = document.createElement('script');
    s.id = 'ghl-form-embed-script';
    s.src = NB_GHL_EMBED_SCRIPT;
    s.async = true;
    document.body.appendChild(s);
  }, []);

  // GHL's form_embed.js auto-resizes iframes whose id matches the pattern
  // {calendarId}_{anything}. If the id doesn't start with the calendar id,
  // the resize never fires and the iframe stays at minHeight — which on
  // mobile clips the entire calendar UI. Locking the id to that pattern
  // and computing it once with useMemo so re-renders don't generate a new
  // id that breaks the running auto-resize.
  const iframeId = React.useMemo(
    () => `${NB_GHL_CALENDAR_ID}_${Date.now()}`,
    []
  );

  const src = React.useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    const fullName = (p.get('name') || '').trim();
    const [firstName, ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(' ');
    const out = new URLSearchParams();
    if (firstName) out.set('first_name', firstName);
    if (lastName) out.set('last_name', lastName);
    const email = p.get('email');
    if (email) out.set('email', email);
    const phone = p.get('phone');
    if (phone) out.set('phone', phone);
    const qs = out.toString();
    return qs ? `${NB_GHL_BOOKING_URL}?${qs}` : NB_GHL_BOOKING_URL;
  }, []);

  return (
    <iframe
      src={src}
      className="ghl-booking-iframe"
      style={{ width: '100%', border: 'none', overflow: 'hidden', display: 'block' }}
      scrolling="no"
      id={iframeId}
      title="Book your Newly Booked Strategy Call"
    />
  );
}

const { useState: useSchAppState, useEffect: useSchAppEffect } = React;

const SCH_FAQ = [
  {
    q: "What happens on the call?",
    a: "Forty-five minutes, video. We walk you through how we'd add $50K–$100K/month to your spa: the pre-qualification system, the commission structure, and the first 90 days of revenue we'd expect. If we're a fit, you'll know on the call. If we're not, we'll tell you on the call."
  },
  {
    q: "Is this a sales call?",
    a: "Yes. We pre-qualified you because we think we can add real revenue to your spa. The call is where we lay out exactly how, and where you decide if you want to partner with us over the next 45 days. No retainer pitch. No 12-month lock. Commission only."
  },
  {
    q: "Why do I need to be on a call instead of email?",
    a: "Because we hand-pick the spas we partner with. The reason owners in our program scale so fast is that we only bring on spas with the team, capacity, and operational maturity to grow with us. Forty-five minutes face-to-face is the only honest way to confirm fit on both sides."
  },
  {
    q: "What if I need to reschedule?",
    a: "You'll get a confirmation email with a one-click reschedule link. Move it as many times as you need. We'd rather you show up at the right time than burn a slot."
  },
  {
    q: "Do I need anything ready for the call?",
    a: "Three numbers in your head: monthly revenue, average package price, and rough close rate. If you don't know one of them, that's also useful information. We'll pull the rest live on the call."
  },
  {
    q: "Who's actually on the call?",
    a: "A senior partner who has personally worked with 25+ medspas. Not an SDR. Not a 'discovery rep.' The same person who would scope and run your engagement if we partnered."
  }
];

const SCH_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "gold",
  "showFooterCTA": true,
  "spaName": "Your Med Spa",
  "headlineVariation": 0
}/*EDITMODE-END*/;

const SCH_ACCENTS = {
  gold: { 700: '#9A7E3F', 600: '#B89351', 500: '#C9A961', 400: '#D9BD7E', 200: '#EFE0BB', 50: '#FAF5E6' },
  emerald: { 700: '#1F5D3F', 600: '#2A7A55', 500: '#3A9268', 400: '#5DAE85', 200: '#A8D2BC', 50: '#E8F2EC' },
  copper: { 700: '#8C4A2A', 600: '#A85D38', 500: '#C26F44', 400: '#D58D6A', 200: '#EBC5AE', 50: '#F8EAE0' },
  ink: { 700: '#1B2D4A', 600: '#2A3F60', 500: '#43597A', 400: '#6B7E9C', 200: '#B5C0D2', 50: '#E8ECF3' },
};

function SchedFAQ() {
  const [open, setOpen] = useSchAppState(0);
  return (
    <div className="faq-list">
      {SCH_FAQ.map((item, i) => (
        <div className="faq-item" key={i}>
          <button
            className="faq-q"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            <span>{item.q}</span>
            <span className="plus">+</span>
          </button>
          <div className="faq-a" style={{ maxHeight: open === i ? '300px' : '0' }}>
            <div className="faq-a-inner">{item.a}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SchedApp() {
  const [tweaks, setTweak] = useTweaks(SCH_TWEAK_DEFAULTS);

  useSchAppEffect(() => {
    const a = SCH_ACCENTS[tweaks.accent] || SCH_ACCENTS.gold;
    const r = document.documentElement;
    Object.entries(a).forEach(([k, v]) => r.style.setProperty(`--gold-${k}`, v));
  }, [tweaks.accent]);

  const SCH_HEADLINES = [
    {
      eyebrow: <>Step 2 of 2 · You pre-qualified</>,
      h: <>Congratulations. <em>{tweaks.spaName}</em> pre-qualifies for the program.</>,
      sub: <>Schedule a call to see if we can add up to <em>$60K in revenue</em> over your next 60 days. Forty-five minutes, video. No retainer, no 12-month lock, commission only.</>,
    },
    {
      eyebrow: <>Pre-qualified · Pick a slot</>,
      h: <>You're in. <em>{tweaks.spaName}</em> made the cut.</>,
      sub: <>Now book the call where we map out how Newly Booked would add <em>$50K–$100K/month</em> to your spa. You're live within 2 weeks of signing. 30 days later, most owners are already mid-fastest-growth-spurt of their lives.</>,
    },
    {
      eyebrow: <>Final step · Book the partnership call</>,
      h: <>Pick your time, <em>{tweaks.spaName}</em>.</>,
      sub: <>Forty-five minutes with a senior partner. We walk through how we'd add up to $60K in cash revenue over your next 60 days, and whether we have your area available this quarter.</>,
    },
  ];

  const head = SCH_HEADLINES[tweaks.headlineVariation] || SCH_HEADLINES[0];

  return (
    <>
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-inner">
          <a href={window.nbUrl('__NB_LANDING_URL', 'index.html')} className="brand" style={{ textDecoration: 'none' }}>
            <span className="dot"></span>Newly Booked
          </a>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-3)',
          }}>
            Step 2 / 2
          </span>
        </div>
      </div>

      {/* HERO — dark, compact */}
      <section className="sched-hero" data-screen-label="01 Pre-Qualified">
        <div className="container">
          <div className="crumbs">
            <span className="step done">
              <span className="dot"></span>Qualifier
            </span>
            <span className="sep"></span>
            <span className="step active">
              <span className="dot"></span>Book the call
            </span>
            <span className="sep"></span>
            <span className="step">
              <span className="dot"></span>Partnership
            </span>
          </div>
          <div className="eyebrow light" style={{ marginBottom: 18 }}>{head.eyebrow}</div>
          <h1>{head.h}</h1>
          <p className="lede">{head.sub}</p>
        </div>
      </section>

      {/* SCHEDULER — GHL booking widget */}
      <section className="sched-section" id="schedule" data-screen-label="02 Scheduler">
        <div className="container">
          <h2 className="section-title">Pick a time that works for you.</h2>
          <p className="section-sub">Forty-five minutes, video. Your name, email, and phone are pre-filled from the qualifier.</p>
          <GhlBookingWidget />
          <div className="sched-fineprint">
            ZOOM VIDEO <span className="sep">✦</span> COMMISSION ONLY
          </div>
        </div>
      </section>

      {/* WHAT'S ON THE CALL — value props */}
      <section className="sched-value" data-screen-label="04 On The Call">
        <div className="container">
          <div className="head">
            <div className="label">What we cover</div>
            <h2>Forty-five minutes. <em>One decision.</em></h2>
            <p className="sub">Whether we partner with your spa over the next 45 days.</p>
          </div>
          <div className="value-list">
            <div className="value-row">
              <div className="marker">1.</div>
              <div>
                <h4>Your numbers, on screen</h4>
                <p>Monthly revenue, average package price, close rate, ad spend. We open them together so we can scope what Newly Booked would actually generate inside <em>your</em> spa, not a hypothetical one.</p>
              </div>
            </div>
            <div className="value-row">
              <div className="marker">2.</div>
              <div>
                <h4>The 60-day revenue model</h4>
                <p>Based on your numbers, we'll show what we believe Newly Booked can add over the first 60 days. Typically $30K–$60K in cash revenue. Owners doing $80K+/month frequently see $50K–$100K/month added.</p>
              </div>
            </div>
            <div className="value-row">
              <div className="marker">3.</div>
              <div>
                <h4>The pre-qualification system, walked through</h4>
                <p>How Cherry, CareCredit, and a soft credit pull get the affordability conversation done <em>before</em> the patient sits in your chair, so 80%+ of consults arrive approved for financing.</p>
              </div>
            </div>
            <div className="value-row">
              <div className="marker">4.</div>
              <div>
                <h4>Commission structure, in plain English</h4>
                <p>What we charge per <b>showed</b> appointment, what we take on closed packages, and where every dollar lands. No retainer, no 12-month contract, no termination fee.</p>
              </div>
            </div>
            <div className="value-row">
              <div className="marker">5.</div>
              <div>
                <h4>How fast you go live</h4>
                <p>You're live within <em>2 weeks</em> of signing. Thirty days after that, most owners are already experiencing the fastest growth their spa has ever had. We walk through what that looks like, week by week, on the call.</p>
              </div>
            </div>
          </div>
          <div className="value-callout">
            <div className="lock">$</div>
            <div className="text">
              No retainer. No 12-month lock. <em>We only make money when your patients pay you.</em>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sched-faq" data-screen-label="05 FAQ">
        <div className="container-narrow">
          <div className="head">
            <div className="label">Quick answers</div>
            <h2>Before you show up.</h2>
          </div>
          <SchedFAQ />
        </div>
      </section>

      {/* THIN FOOTER CTA */}
      {tweaks.showFooterCTA && (
        <div className="sched-footer-cta">
          <div className="container">
            <div className="label">Reminder</div>
            <div className="line">Most owner-operators add <em>$30K–$60K in profit</em><br/>within their first 90 days on the system.</div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="brand"><span className="dot"></span>Newly Booked</div>
            <div>© 2026 Newly Booked · We Only Make Money When You Do</div>
            <div style={{ display: 'flex', gap: 22 }}>
              <a href={window.nbUrl('__NB_TERMS_URL', 'terms.html')} style={{ textDecoration: 'none' }}>Terms</a>
              <a href={window.nbUrl('__NB_PRIVACY_URL', 'privacy.html')} style={{ textDecoration: 'none' }}>Privacy</a>
              <a href={window.nbUrl('__NB_LANDING_URL', 'index.html')} style={{ textDecoration: 'none', color: 'var(--gold-400)' }}>← Back to site</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Tweaks */}
      <TweaksPanel>
        <TweakSection label="Personalization">
          <TweakText label="Spa name" value={tweaks.spaName}
            onChange={(v) => setTweak('spaName', v)} />
        </TweakSection>
        <TweakSection label="Hero">
          <TweakSelect label="Headline" value={tweaks.headlineVariation}
            onChange={(v) => setTweak('headlineVariation', parseInt(v))}
            options={[
              { value: 0, label: '01 · Congratulations + $60K/60d' },
              { value: 1, label: '02 · You\'re in · made the cut' },
              { value: 2, label: '03 · Final step · partnership call' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Look">
          <TweakRadio label="Accent" value={tweaks.accent}
            onChange={(v) => setTweak('accent', v)}
            options={[
              { value: 'gold', label: 'Gold' },
              { value: 'emerald', label: 'Emerald' },
              { value: 'copper', label: 'Copper' },
              { value: 'ink', label: 'Ink' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Page">
          <TweakToggle label="Footer reminder" value={tweaks.showFooterCTA}
            onChange={(v) => setTweak('showFooterCTA', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SchedApp />);
