// Combined page — Bluefer-style landing (hero → results → model → founder →
// quiz → closer), tailored to Newly Booked. The qualifier quiz keeps ALL of its
// existing logic (GHL form fill, DQ routing, tracking, exit popup) and is
// mounted inside the availability card, starting at the first question.
const { useState, useEffect } = React;

// Self-sufficiency shim for the GHL embed: the loader pasted into GHL
// (ghl-pages/funnel-page.html) predates the Bluefer-style redesign and only
// links styles.css + funnel.css. Inject landing.css and the Sora display font
// here so a repo push alone fully updates the live page — relative hrefs
// resolve against the GHL page's <base> tag straight to the CDN. No-op on the
// standalone page, where index.html already links both.
(function () {
  try {
    if (!document.querySelector('link[href*="landing.css"]')) {
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'landing.css?v=' + Date.now();
      document.head.appendChild(l);
    }
    if (!document.querySelector('link[href*="family=Sora"]')) {
      var f = document.createElement('link');
      f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@600;700&display=swap';
      document.head.appendChild(f);
    }
  } catch (e) {}
})();

const CTA = 'Check availability';

function App() {

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

  // GHL renders the hidden lead-capture form (.nb-hidden-form — the one the
  // funnel fills) as position:absolute at left:-9999px, but its top sits at the
  // BOTTOM of the page, so its ~2,200px height extends the <body> past GHL's
  // fixed body height. That overflow creates a SECOND, nested scrollbar that
  // traps the page scroll partway down (you "can only go this far"). Switching it
  // to position:fixed removes it from the page's scroll height entirely while it
  // stays rendered off-screen and fully fillable. Re-run on load + a couple
  // delays since GHL may mount/re-position the form after our first paint.
  useEffect(() => {
    const fixGhlScroll = () => {
      // 1. Pin the hidden lead-form out of the page's scroll height (left:-9999px,
      // but its height was extending the <body> and spawning a 2nd nested scrollbar).
      document.querySelectorAll('.nb-hidden-form').forEach((f) => {
        if (getComputedStyle(f).position !== 'fixed') {
          f.style.setProperty('position', 'fixed', 'important');
          f.style.setProperty('top', '0', 'important');
          f.style.setProperty('left', '-9999px', 'important');
        }
      });
      // 2. GHL pins <body> to a fixed height with overflow:auto, leaving it a
      // "can't-really-scroll" container that EATS the mouse wheel over the page
      // content (only dragging the scrollbar worked). Take <body> out of the wheel
      // path so the wheel reaches the real scroller (<html>). ONLY inside the GHL
      // embed (same markers the wheel-rescue binds on): on the standalone page,
      // styles.css's body{overflow-x:hidden} makes computed overflow-y 'auto', so
      // this guard used to fire there too — and a hidden-overflow <body> TRAPS the
      // wheel (no scroll chaining) with no wheel-rescue bound to compensate,
      // killing mouse-wheel scroll on local/standalone builds.
      const inGhlEmbed = document.querySelector('.nb-hidden-form, .hl_page-preview--content') || document.getElementById('__nuxt');
      if (inGhlEmbed && document.scrollingElement && document.scrollingElement !== document.body) {
        const oy = getComputedStyle(document.body).overflowY;
        if (oy === 'auto' || oy === 'scroll') {
          document.body.style.setProperty('overflow-y', 'hidden', 'important');
        }
      }
      // 3. Full-bleed: GHL's section/row/column wrappers around our #root carry
      // padding, margins, and a max-width that frame the page in a white gutter
      // (visible now that the hero is navy). Flatten every ancestor between
      // #root and <body> so the landing truly spans edge to edge; the 100vw
      // breakout in landing.css covers left/right, this kills the top/bottom
      // padding too. GHL-embed only — standalone has no wrappers to flatten.
      if (inGhlEmbed) {
        const nb = document.getElementById('nb-landing');
        if (nb) nb.classList.add('nb-ghl'); // arms the 100vw breakout in landing.css
        let el = document.getElementById('root');
        el = el && el.parentElement;
        while (el && el !== document.body && el !== document.documentElement) {
          const s = el.style;
          s.setProperty('padding', '0', 'important');
          s.setProperty('margin', '0', 'important');
          s.setProperty('max-width', 'none', 'important');
          s.setProperty('width', '100%', 'important');
          // a white-bg wrapper taller than our content painted a white band
          // below the navy footer — let the navy html/body bg show instead
          s.setProperty('background', 'transparent', 'important');
          el = el.parentElement;
        }
      }
    };
    fixGhlScroll();
    window.addEventListener('load', fixGhlScroll);
    window.addEventListener('resize', fixGhlScroll);
    const t1 = setTimeout(fixGhlScroll, 800);
    const t2 = setTimeout(fixGhlScroll, 2500);
    // GHL may mount/re-position the form or re-pin the body after our first
    // paints, so also re-apply on any DOM change (debounced) for the first ~8s.
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; fixGhlScroll(); });
    };
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    const t3 = setTimeout(() => mo.disconnect(), 8000);
    return () => {
      window.removeEventListener('load', fixGhlScroll);
      window.removeEventListener('resize', fixGhlScroll);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); mo.disconnect();
    };
  }, []);

  // Wheel-scroll rescue for the GHL embed. GHL pins <html>/<body> to a fixed
  // height with overflow:auto, and the mouse WHEEL over the page content gets
  // eaten — it never reaches the real scroller, so only DRAGGING the scrollbar
  // worked. Inside the GHL embed, drive the page scroll ourselves on wheel so it
  // works anywhere. Inner scrollables (e.g. the city dropdown) still scroll
  // natively. No-op on the standalone page, where the native wheel is fine.
  useEffect(() => {
    const onWheel = (e) => {
      if (e.ctrlKey) return; // leave pinch-zoom alone
      // let a genuinely-scrollable inner element handle it natively
      let el = e.target;
      while (el && el.nodeType === 1 && el !== document.documentElement) {
        const cs = getComputedStyle(el);
        if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 2) {
          const atTop = el.scrollTop <= 0;
          const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
          if (!((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom))) return;
        }
        el = el.parentElement;
      }
      const se = document.scrollingElement || document.documentElement;
      const mult = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? se.clientHeight : 1);
      se.scrollTop += e.deltaY * mult;
      e.preventDefault();
    };
    let bound = false;
    const bind = () => {
      if (bound) return;
      if (document.querySelector('.nb-hidden-form, .hl_page-preview--content') || document.getElementById('__nuxt')) {
        window.addEventListener('wheel', onWheel, { passive: false, capture: true });
        bound = true;
      }
    };
    bind();
    const wt1 = setTimeout(bind, 1000);
    const wt2 = setTimeout(bind, 3000);
    return () => {
      clearTimeout(wt1); clearTimeout(wt2);
      if (bound) window.removeEventListener('wheel', onWheel, { capture: true });
    };
  }, []);

  // Mobile top bar (Bluefer behavior): slides in once the hero scrolls away,
  // and stays hidden whenever a section carrying its own CTA is on screen
  // (hero, quiz, closer) so the button never doubles up.
  useEffect(() => {
    const nav = document.querySelector('#nb-landing .bfn-nav');
    const secs = ['.bfn-hero', '#availability', '.bfn-closer']
      .map((s) => document.querySelector('#nb-landing ' + s)).filter(Boolean);
    if (!nav || !secs.length) return;
    let pending = false;
    const update = () => {
      pending = false;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const any = secs.some((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < vh; });
      nav.classList.toggle('show', !any);
    };
    const onScroll = () => { if (!pending) { pending = true; setTimeout(update, 80); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Founder photo: uses assets/founder.webp when the asset exists, falls back
  // to an initials badge until Byron drops the real photo in.
  const [founderImgOk, setFounderImgOk] = useState(true);

  // Real brand mark (white N|B lockup on navy, assets/nb-logo.png). The badge
  // form pairs the square mark with the wordmark; the hero/footer forms show
  // the lockup alone with mix-blend-mode:screen so its navy square melts into
  // the dark sections.
  const Logo = ({ white }) => (
    <a className={`bfn-logo${white ? ' white' : ''}`} href="#top">
      <img className="bfn-logo-badge" src="assets/nb-logo.png" alt="Newly Booked" />
      <span>Newly Booked</span>
    </a>
  );

  return (
    <div id="nb-landing">

      {/* ============ NAV (mobile only) ============ */}
      <div className="bfn-nav">
        <div className="bfn-nav-in">
          <Logo />
          <a className="bfn-nav-cta" href="#availability">{CTA}</a>
        </div>
      </div>

      {/* ============ HERO ============ */}
      <div className="bfn-hero" id="top">
        <div className="bfn-hero-in">
          <div className="bfn-hero-logo"><img className="bfn-logo-hero" src="assets/nb-logo.png" alt="Newly Booked" /></div>
          <div><span className="bfn-eyebrow"><i></i>Only for medspa owners doing $50K+/month</span></div>
          <h1>Add <span className="accent">$150K–$300K</span> in new patient revenue to your medspa</h1>
          <p className="bfn-pay"><em>We only get paid when patients pay you.</em></p>
          <p className="bfn-risk">Try it for 30 days, risk-free.</p>
          <a className="bfn-cta" href="#availability">{CTA}<small>See if your area is still open</small></a>
        </div>
      </div>

      {/* ============ CLIENT RESULTS ============ */}
      <section className="bfn-cases" id="results">
        <div className="wrap">
          <span className="bfn-sec-eyebrow">Client results</span>
          <h2>What medspa owners say about us</h2>
          <CaseGrid />
        </div>
      </section>

      {/* ============ THE MODEL ============ */}
      <section className="bfn-perf">
        <div className="wrap-n">
          <span className="bfn-sec-eyebrow" style={{ color: '#8FBAFF' }}>The Newly Booked model</span>
          <h2>We only get paid when patients pay you.<br />100% performance-based.</h2>
          <p className="bfn-sec-sub">If you are looking for a "brand awareness" agency — that is not us. If you are looking for an ROI machine, look no further.</p>
          <div className="bfn-perf-grid">
            <div className="bfn-perk">
              <span className="tick">✓</span>
              <h3>Pay after results</h3>
              <p>You don't pay us a retainer. You pay us when you sell — our model is 100% performance-based, so we have to perform to get paid.</p>
            </div>
            <div className="bfn-perk">
              <span className="tick">✓</span>
              <h3>No commitment</h3>
              <p>No retainer pitch and no 12-month contract. Judge us purely on the revenue the system generates for your spa.</p>
            </div>
            <div className="bfn-perk">
              <span className="tick">✓</span>
              <h3>Limited spots per area</h3>
              <p>We take on 4 new spas a month, one medspa per area, so every spa we work with gets results. Check if your area is still open before someone else claims it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOUNDER ============ */}
      <section id="founder">
        <div className="wrap">
          <div className="bfn-founder-grid">
            <div className="bfn-founder-photo">
              {founderImgOk ? (
                <img loading="lazy" src="assets/founder.webp" alt="Ivan Merlo, founder of Newly Booked" onError={() => setFounderImgOk(false)} />
              ) : (
                <div className="bfn-founder-ph" aria-label="Ivan Merlo">IM</div>
              )}
            </div>
            <div className="bfn-founder-copy">
              <span className="bfn-sec-eyebrow">Our story</span>
              <h2>Meet the founder</h2>
              <p>Ivan built Newly Booked around one job: filling medspa calendars with pre-paid, pre-financed patients. The system behind it has generated over $8M in package sales for partner spas, with 80%+ of patients approved for financing before they ever walk in.</p>
              <p>Every owner trains on the same closing script our top spas use, with live coaching from Ivan — and you only pay Newly Booked when patients pay you.</p>
              <div className="sig">Ivan Merlo<span>Founder, Newly Booked</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ AVAILABILITY / QUIZ ============ */}
      <section className="bfn-avail" id="availability">
        <div className="wrap-n">
          <span className="bfn-sec-eyebrow">Check availability</span>
          <h2>Is your area still open?</h2>
          <p className="bfn-sec-sub">Answer a few quick questions to see if your medspa qualifies. If your area is already claimed, you can join the waiting list.</p>

          <div className="bfn-avail-card nb-quiz-host">
            <Funnel embedded initialIdx={1} />
          </div>
          <div className="bfn-avail-note"><i></i>We take on 4 new spas a month — one medspa per area</div>
        </div>
      </section>

      {/* ============ CLOSER ============ */}
      <section className="bfn-closer">
        <div className="wrap-n">
          <h2>This is your defining moment.</h2>
          <p>We add <b>$150K–$300K in new patient revenue</b> — pre-qualified, pre-financed patients booked onto your calendar — and <b>we only get paid when patients pay you</b>. Try it for 30 days, risk-free.</p>
          <a className="bfn-cta" href="#availability">{CTA}<small>See if your area is still open</small></a>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer>
        <div className="wrap">
          <img className="bfn-logo-foot" src="assets/nb-logo.png" alt="Newly Booked" />
          <div className="fine">Performance-based patient acquisition — only for medspas &amp; aesthetic clinics.</div>
          <div className="fine">© 2026 Newly Booked · We Only Make Money When You Do</div>
          <div className="links">
            <a href={window.nbUrl('__NB_TERMS_URL', 'terms.html')}>Terms</a>
            <a href={window.nbUrl('__NB_PRIVACY_URL', 'privacy.html')}>Privacy</a>
            <a href="#availability">Qualify →</a>
          </div>
          <div className="disclaimer">
            Client results shown are real and verifiable, and they are top performers, not a promise. Your results depend on your market, capacity, pricing, and close rate.
          </div>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
