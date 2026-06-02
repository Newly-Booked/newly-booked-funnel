// Main App — composes all sections. Uses tweaks for hero variations, density, accent.
const { useState, useEffect } = React;

const HERO_VARIATIONS = [
  {
    eyebrow: 'For Medspa Owners Doing $30K–$200K/Month',
    headline: <>Add <em>$50K–$100K/Month</em> in cash patients<br/>without tire-kickers, retainers, or a 12-month lock.</>,
    sub: 'We book your calendar with pre-qualified patients through Cherry, train you on our $7M+ closing script, and only get paid when patients pay you. Our top clients add $30K–$60K in profit within 90 days.',
  },
  {
    eyebrow: 'Performance-based growth for medspas',
    headline: <>We only make money <em>when your patients pay</em>.</>,
    sub: 'No retainer. No 12-month contract. No dashboard of cold leads. We pre-qualify, we close, and we take a percentage only when a package sells.',
  },
  {
    eyebrow: 'Case study · North Texas',
    headline: <>From <em>$50K → $300K</em> per month.<br/>In a market the owner called "worst demographics."</>,
    sub: 'It\'s not the city. It\'s the funnel. We open yours in a free 45-minute diagnostic and show you exactly where you\'re leaking: set rate, deposit rate, close rate, package mix.',
  },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroVariation": 0,
  "ctaCopy": "See If We Have Your Area Available",
  "accent": "gold",
  "qualifierPosition": "inline",
  "socialProofLayout": "bento",
  "density": "default",
  "showStickyCta": true,
  "showMarquee": true
}/*EDITMODE-END*/;

const ACCENT_PRESETS = {
  gold: { 700: '#9A7E3F', 600: '#B89351', 500: '#C9A961', 400: '#D9BD7E', 200: '#EFE0BB', 50: '#FAF5E6' },
  emerald: { 700: '#1F5D3F', 600: '#2A7A55', 500: '#3A9268', 400: '#5DAE85', 200: '#A8D2BC', 50: '#E8F2EC' },
  copper: { 700: '#8C4A2A', 600: '#A85D38', 500: '#C26F44', 400: '#D58D6A', 200: '#EBC5AE', 50: '#F8EAE0' },
  ink: { 700: '#1B2D4A', 600: '#2A3F60', 500: '#43597A', 400: '#6B7E9C', 200: '#B5C0D2', 50: '#E8ECF3' },
};

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const a = ACCENT_PRESETS[tweaks.accent] || ACCENT_PRESETS.gold;
    const r = document.documentElement;
    Object.entries(a).forEach(([k, v]) => r.style.setProperty(`--gold-${k}`, v));
  }, [tweaks.accent]);

  useEffect(() => {
    document.body.classList.remove('tight', 'airy');
    if (tweaks.density === 'tight') document.body.classList.add('tight');
    if (tweaks.density === 'airy') document.body.classList.add('airy');
  }, [tweaks.density]);

  // When this page is embedded in GHL, a <base href="https://artzy22.github.io/...">
  // tag is set so relative asset URLs resolve to the CDN. But a side-effect is
  // that hash-only anchors like href="#qualify" also resolve against the base —
  // so clicking a CTA bounces the user from newlybooked.com to artzy22.github.io.
  // This handler intercepts SAME-PAGE hash anchor clicks only and scrolls in
  // place. Cross-page URLs and modified clicks (cmd/ctrl/middle) fall through.
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#') || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { history.pushState(null, '', href); } catch (_) {}
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const hero = HERO_VARIATIONS[tweaks.heroVariation] || HERO_VARIATIONS[0];

  return (
    <>
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand"><span className="dot"></span>Newly Booked</div>
          <nav className="topnav">
            <a href="#proof">Proof</a>
            <a href="#mechanism">Mechanism</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a href="#qualify" className="btn btn-primary">{tweaks.ctaCopy} →</a>
        </div>
      </div>

      {/* HERO with inline qualifier */}
      <section className="hero" id="hero" data-screen-label="01 Hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-eyebrow-row">
                <span><span className="pulse"></span>4 partner slots open · April</span>
                <span className="pill">{hero.eyebrow}</span>
              </div>
              <h1 className="hero-headline">{hero.headline}</h1>
              <p className="hero-sub">{hero.sub}</p>
              <div className="hero-stamps">
                <span className="hero-stamp">No retainer</span>
                <span className="hero-stamp">No 12-month lock</span>
                <span className="hero-stamp">Commission only</span>
              </div>
            </div>
            <div>
              <Qualifier accent={tweaks.accent} />
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      {tweaks.showMarquee && (
        <>
        <div className="marquee">
          <div className="marquee-inner">
            <span>"Doubled the business with Ivan's one service" · Arlington VA</span>
            <span>$220K from $18K adspend · Plano TX</span>
            <span>"Almost $300K first year in business" · Minneapolis MN</span>
            <span>$2.7M lifetime · Breeze Med Spa</span>
            <span>"Increased my sales trifold" · Edinburg TX</span>
            <span>$2.9M lifetime · Issil Beauty Spa</span>
            <span>$60K/mo → $250K/mo new patient revenue</span>
            <span>"Best business decision. If you're serious about growing, this is it" · Murrieta CA</span>
            <span>$300K cash storefront · Natalie</span>
            <span>$43K our first month · Fort Worth TX</span>
            <span>$30K profit in 45 days · Naturalness Med Spa</span>
            <span>"Doubled the business with Ivan's one service" · Arlington VA</span>
            <span>$220K from $18K adspend · Plano TX</span>
            <span>"Almost $300K first year in business" · Minneapolis MN</span>
            <span>$2.7M lifetime · Breeze Med Spa</span>
            <span>"Increased my sales trifold" · Edinburg TX</span>
            <span>$2.9M lifetime · Issil Beauty Spa</span>
            <span>$60K/mo → $250K/mo new patient revenue</span>
            <span>"Best business decision. If you're serious about growing, this is it" · Murrieta CA</span>
            <span>$300K cash storefront · Natalie</span>
            <span>$43K our first month · Fort Worth TX</span>
            <span>$30K profit in 45 days · Naturalness Med Spa</span>
          </div>
        </div>
        <LogoMarquee />
        </>
      )}

      {/* VIDEO TESTIMONIALS */}
      <section className="section" id="proof" data-screen-label="02 Testimonials">
        <div className="container">
          <div className="section-head">
            <div className="label">Owner testimony</div>
            <div>
              <h2>Hear it from owners who've <em>done it.</em></h2>
              <p className="lede">Six medspa owners. Six different markets. The same playbook running underneath all of them.</p>
            </div>
          </div>
          <VideoTestimonials />
        </div>
      </section>

      {/* SCREENSHOT WALL */}
      <section className="screenshot-wall" id="screenshots" data-screen-label="03 Screenshots">
        <div className="container">
          <div className="section-head">
            <div className="label" style={{ color: 'var(--gold-400)', borderTopColor: 'var(--gold-600)' }}>Receipts, not stories</div>
            <div>
              <h2 style={{ color: 'var(--paper)' }}>Cherry sales. Calendars filling. <em>Real owner DMs.</em></h2>
              <p className="lede" style={{ color: 'var(--navy-200)' }}>
                A wall of receipts from owners running our system right now: pre-qual approvals, day-of-deposit screenshots, calendars with back-to-back pre-paid appointments, and the group chats where owners report numbers in real time.
              </p>
            </div>
          </div>
          <ScreenshotWall />
          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <a href="#qualify" className="btn btn-gold btn-lg btn-arrow">{tweaks.ctaCopy} </a>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--navy-200)', marginTop: 14, letterSpacing: '0.06em' }}>
              60-second qualifier · No retainer · No 12-month lock
            </div>
          </div>
        </div>
      </section>

      {/* NUMBERS BAND */}
      <section className="section dense cream" id="numbers" data-screen-label="04 Numbers">
        <div className="container">
          <div className="numbers-band">
            <div className="number-cell">
              <div className="lbl">Lifetime sales</div>
              <div className="num"><em>$7M+</em></div>
              <div className="sub">In medspa package sales across our partner spas.</div>
            </div>
            <div className="number-cell">
              <div className="lbl">Retainer</div>
              <div className="num"><em>$0</em></div>
              <div className="sub">Zero monthly · zero lock-in · commission only.</div>
            </div>
            <div className="number-cell">
              <div className="lbl">Approval rate</div>
              <div className="num">80<em>%+</em></div>
              <div className="sub">Patients pre-qualified for financing before the consult.</div>
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM / WHY PERFORMANCE-BASED */}
      <section className="section" id="why" data-screen-label="05 Why">
        <div className="container">
          <div className="section-head">
            <div className="label">The structure problem</div>
            <div>
              <h2>Retainer-based marketing companies are <em>structurally broken.</em></h2>
              <p className="lede">They get paid for leads. You only make money when patients pay. Those are different goals, and yours always loses.</p>
            </div>
          </div>
          <div className="comparison">
            <div className="cmp-col label">
              <div className="cmp-h">The line item</div>
              <div className="cmp-row">Pricing model</div>
              <div className="cmp-row">Paid for</div>
              <div className="cmp-row">Lead quality</div>
              <div className="cmp-row">Sales coverage</div>
              <div className="cmp-row">North-star metric</div>
              <div className="cmp-row">What it really is</div>
            </div>
            <div className="cmp-col them">
              <div className="cmp-h">Every other agency</div>
              <div className="cmp-row">Charges a retainer</div>
              <div className="cmp-row">Gets paid for leads</div>
              <div className="cmp-row">Sends tire-kickers</div>
              <div className="cmp-row">Hands you a dashboard</div>
              <div className="cmp-row">Optimizes for ad metrics</div>
              <div className="cmp-row">Calls it "growth"</div>
            </div>
            <div className="cmp-col us">
              <div className="cmp-h">Newly Booked</div>
              <div className="cmp-row">Paid only when patients pay</div>
              <div className="cmp-row">Paid only on closed packages</div>
              <div className="cmp-row">Pre-qualifies every patient</div>
              <div className="cmp-row">Books pre-qualified patients into your chair</div>
              <div className="cmp-row">Optimizes for revenue per patient</div>
              <div className="cmp-row">A new revenue department</div>
            </div>
          </div>
          <div className="comparison-mobile">
            {[
              { label: 'Pricing model', them: 'Charges a retainer', us: 'Paid only when patients pay' },
              { label: 'Paid for', them: 'Gets paid for leads', us: 'Paid only on closed packages' },
              { label: 'Lead quality', them: 'Sends tire-kickers', us: 'Pre-qualifies every patient' },
              { label: 'Sales coverage', them: 'Hands you a dashboard', us: 'Books pre-qualified patients into your chair' },
              { label: 'North-star metric', them: 'Optimizes for ad metrics', us: 'Optimizes for revenue per patient' },
              { label: 'What it really is', them: 'Calls it "growth"', us: 'A new revenue department' },
            ].map((row, i) => (
              <div key={i} className="cmp-mrow">
                <div className="cmp-mlabel">{row.label}</div>
                <div className="cmp-mpair">
                  <div className="cmp-mthem"><span className="cmp-mtag">Every other agency</span><div className="cmp-mtxt them">✕ {row.them}</div></div>
                  <div className="cmp-mus"><span className="cmp-mtag us">Newly Booked</span><div className="cmp-mtxt us">✓ {row.us}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MECHANISM — pre-qualification */}
      <section className="section cream" id="mechanism" data-screen-label="06 Mechanism">
        <div className="container">
          <div className="section-head">
            <div className="label">The mechanism</div>
            <div>
              <h2>"My patients can't afford it" is the <em>#1 thing</em> we hear from spa owners.</h2>
              <p className="lede">So we kill the affordability wall <em>before</em> the consult, not at the close.</p>
            </div>
          </div>

          <div className="mech-flow">
            {/* LEFT: the problem */}
            <div className="mech-side them">
              <div className="mech-side-label">Without pre-qualification</div>
              <div className="mech-flow-step">
                <div className="mech-flow-icon them">📞</div>
                <div className="mech-flow-txt">Lead books a consult</div>
              </div>
              <div className="mech-arrow them">↓</div>
              <div className="mech-flow-step">
                <div className="mech-flow-icon them">🪑</div>
                <div className="mech-flow-txt">Owner spends 45 min in the chair</div>
              </div>
              <div className="mech-arrow them">↓</div>
              <div className="mech-flow-step wall">
                <div className="mech-wall">💸 Affordability wall</div>
                <div className="mech-flow-sub">"Let me think about it."</div>
              </div>
              <div className="mech-flow-result them">No close. No revenue.</div>
            </div>

            {/* CENTER: the partners doing the work */}
            <div className="mech-engine">
              <div className="mech-engine-label">Three checkpoints, before they sit down</div>
              <div className="mech-checkpoint">
                <div className="mech-cp-num">01</div>
                <div className="mech-cp-body">
                  <div className="mech-cp-title">Soft credit pull</div>
                  <div className="mech-cp-sub">at the moment of booking · zero score impact</div>
                </div>
              </div>
              <div className="mech-checkpoint">
                <div className="mech-cp-num">02</div>
                <div className="mech-cp-body">
                  <div className="mech-cp-title">CareCredit visibility</div>
                  <div className="mech-cp-sub">existing balance surfaced before they arrive</div>
                  <img src="assets/cherry-logo.webp" alt="Cherry" className="mech-cp-logo" />
                </div>
              </div>
              <div className="mech-checkpoint">
                <div className="mech-cp-num">03</div>
                <div className="mech-cp-body">
                  <div className="mech-cp-title">Cherry pre-qualification</div>
                  <div className="mech-cp-sub">financing ceiling known before the consult</div>
                  <img src="assets/carecredit-logo.webp" alt="CareCredit" className="mech-cp-logo cc" />
                </div>
              </div>
            </div>

            {/* RIGHT: the result */}
            <div className="mech-side us">
              <div className="mech-side-label">With Newly Booked</div>
              <div className="mech-flow-step">
                <div className="mech-flow-icon us">📞</div>
                <div className="mech-flow-txt">Lead books a consult</div>
              </div>
              <div className="mech-arrow us">↓</div>
              <div className="mech-flow-step">
                <div className="mech-flow-icon us">✓</div>
                <div className="mech-flow-txt">Pre-qualified · ceiling known</div>
              </div>
              <div className="mech-arrow us">↓</div>
              <div className="mech-flow-step">
                <div className="mech-flow-icon us">🪑</div>
                <div className="mech-flow-txt">Owner closes with our $7M+ script</div>
              </div>
              <div className="mech-flow-result us">
                <div className="mech-result-stat">80%+</div>
                <div className="mech-result-label">approval rate</div>
              </div>
            </div>
          </div>

          <div className="mech-cta">
            <a href="#qualify" className="btn btn-gold btn-lg">Show me my funnel leaks →</a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how" data-screen-label="07 How">
        <div className="container">
          <div className="section-head">
            <div className="label">The 45-day path</div>
            <div>
              <h2>Three steps. <em>Forty-five days</em> to a pre-qualified calendar.</h2>
              <p className="lede">From the free diagnostic to a calendar full of pre-qualified patients and a script you can close on. You take home margin. We take a percentage of what we generate.</p>
            </div>
          </div>
          <div className="steps">
            <div className="step-cell">
              <div className="marker">
                <div className="num">i.</div>
                <div className="day">DAY 0 · 45 MIN</div>
              </div>
              <h4>Free diagnostic</h4>
              <p>You show us your numbers. We show you what's leaking: set rate, no-show rate, package mix, close rate. You leave with a one-page diagnosis. No pitch on the call.</p>
            </div>
            <div className="step-cell">
              <div className="marker">
                <div className="num">ii.</div>
                <div className="day">DAYS 1–14</div>
              </div>
              <h4>Onboarding</h4>
              <p>Ads launch. Pre-qualified leads start coming in. Our setter team books appointments directly into your calendar. You learn the script that's done $7M+ in sales. We record every consult.</p>
            </div>
            <div className="step-cell">
              <div className="marker">
                <div className="num">iii.</div>
                <div className="day">DAYS 30–45</div>
              </div>
              <h4>Closing rhythm locked in</h4>
              <p>By day 45 you (or whoever closes in your spa) are running consults to our $7M+ script with daily live training from Ivan. Close rate, package mix, and revenue-per-patient all move in week one.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CASE STUDIES */}
      <section className="section cream" id="cases" data-screen-label="08 Cases">
        <div className="container">
          <div className="section-head">
            <div className="label">Owner-operated, today</div>
            <div>
              <h2>Owner-operated spas running our system <em>right now.</em></h2>
              <p className="lede">Most started under $50K/month before partnering with NB. Different cities, different demographics, same playbook.</p>
            </div>
          </div>
          <div className="case-grid">
            <div className="case">
              <div className="market">North Texas · Injectables</div>
              <div className="nums">$50K<span className="arr">→</span><em>$300K</em>/m</div>
              <div className="blurb">Owner went from $50K/month to $300K/month in a market she described as "worst demographics."</div>
            </div>
            <div className="case">
              <div className="market">Breeze Med Spa · Year 1 → Year 2</div>
              <div className="nums">$0<span className="arr">→</span><em>$2.7M</em></div>
              <div className="blurb">Natalie has earned $2.7M in revenue through the program, and paid cash for her own $300K storefront with that money.</div>
            </div>
            <div className="case">
              <div className="market">California · Stuck at $50K/m for 9 months</div>
              <div className="nums"><em>$30K profit</em><span className="arr">·</span>45d</div>
              <div className="blurb">A medspa stuck at $50K/month for 9 months. First 45 days on the system: $30K profit after all expenses.</div>
            </div>
            <div className="case">
              <div className="market">Papillon Med Spa · Solo, single suite</div>
              <div className="nums">$0<span className="arr">→</span><em>$300K</em></div>
              <div className="blurb">Couzue went from zero to $300K in revenue in her first year, starting solo from a single suite in Minnesota.</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="section" id="what" data-screen-label="09 What">
        <div className="container">
          <div className="section-head">
            <div className="label">The deliverables</div>
            <div>
              <h2>What you actually get when you <em>work with us.</em></h2>
              <p className="lede">Built for owner-operators doing $50K–$200K/month who want to stop being the bottleneck.</p>
            </div>
          </div>
          <div className="feat-grid">
            <div className="feat">
              <div className="ix">01</div>
              <h4>Pre-qualified patients only</h4>
              <p>Patients with the credit and income to actually buy your $4K–$10K package. No tire-kickers, no Groupon hunters.</p>
            </div>
            <div className="feat">
              <div className="ix">02</div>
              <h4>Pay-when-you-sell pricing</h4>
              <p>A flat per-appointment fee plus a small commission. No retainer. No 12-month lock.</p>
            </div>
            <div className="feat">
              <div className="ix">03</div>
              <h4>Setter team books your calendar</h4>
              <p>Our setter team handles outreach and qualifies every lead through Cherry before the appointment hits your calendar. You walk into pre-paid, pre-approved consults, not cold leads.</p>
            </div>
            <div className="feat">
              <div className="ix">04</div>
              <h4>$7M+ tested sales script</h4>
              <p>Not a template. The actual script that's driven $7M+ in package sales, refined across 25+ owner calls and thousands of patient consults.</p>
            </div>
            <div className="feat">
              <div className="ix">05</div>
              <h4>Daily training, not quarterly</h4>
              <p>You (and whoever closes in your spa) join live training calls every weekday with Ivan.</p>
            </div>
            <div className="feat">
              <div className="ix">06</div>
              <h4>A pipeline you can measure</h4>
              <p>Real-time dashboard: set rate, deposit rate, show rate, close rate, ad spend, revenue per patient. Every metric, every appointment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section cream" id="faq" data-screen-label="10 FAQ">
        <div className="container-narrow">
          <div className="section-head" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
            <div className="label" style={{ paddingTop: 12 }}>What every owner asks</div>
            <h2>What every owner asks <em>before</em> they book.</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta" id="final-cta" data-screen-label="11 Final CTA">
        <div className="container">
          <div className="eyebrow light" style={{ marginBottom: 24 }}>The diagnostic</div>
          <h2>Forty-five minutes. <em>Zero pressure.</em><br/>Real numbers.</h2>
          <p className="lede">We open your funnel. Set rate, no-show rate, close rate, ad spend. We tell you exactly where you're leaking. One-page diagnosis, yours to keep, work with us or not.</p>
          <ul className="final-cta-list">
            <li><span className="ix">— I.</span>Funnel teardown — set rate, deposit rate, close rate</li>
            <li><span className="ix">— II.</span>What every leak in your funnel is actually costing you</li>
            <li><span className="ix">— III.</span>A 30-day plan you can run yourself, even if we don't sign</li>
          </ul>
          <div className="final-cta-row">
            <a href="#qualify" className="btn btn-gold btn-lg btn-arrow">{tweaks.ctaCopy} </a>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--navy-200)', letterSpacing: '0.06em' }}>
              No retainer pitch · No 12-month contract · Commission only
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="brand"><span className="dot"></span>Newly Booked</div>
            <div>© 2026 Newly Booked · We Only Make Money When You Do</div>
            <div style={{ display: 'flex', gap: 22 }}>
              <a href={window.nbUrl('__NB_TERMS_URL', 'terms.html')} style={{ textDecoration: 'none' }}>Terms</a>
              <a href={window.nbUrl('__NB_PRIVACY_URL', 'privacy.html')} style={{ textDecoration: 'none' }}>Privacy</a>
              <a href="#qualify" style={{ textDecoration: 'none', color: 'var(--gold-400)' }}>Qualify →</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky qualify CTA */}
      {tweaks.showStickyCta && (
        <a href="#qualify" className="sticky-cta">
          <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--navy-900)', display: 'inline-block' }}></span>
          60-second qualifier
          <span>→</span>
        </a>
      )}

      {/* Tweaks */}
      <TweaksPanel>
        <TweakSection label="Hero">
          <TweakSelect label="Headline" value={tweaks.heroVariation}
            onChange={(v) => setTweak('heroVariation', parseInt(v))}
            options={[
              { value: 0, label: '01 · Outcome + offer' },
              { value: 1, label: '02 · Pure positioning' },
              { value: 2, label: '03 · Case study lead' },
            ]}
          />
          <TweakText label="CTA copy" value={tweaks.ctaCopy}
            onChange={(v) => setTweak('ctaCopy', v)} />
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
          <TweakRadio label="Density" value={tweaks.density}
            onChange={(v) => setTweak('density', v)}
            options={[
              { value: 'tight', label: 'Tight' },
              { value: 'default', label: 'Default' },
              { value: 'airy', label: 'Airy' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Page">
          <TweakToggle label="Marquee bar" value={tweaks.showMarquee}
            onChange={(v) => setTweak('showMarquee', v)} />
          <TweakToggle label="Sticky CTA" value={tweaks.showStickyCta}
            onChange={(v) => setTweak('showStickyCta', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
