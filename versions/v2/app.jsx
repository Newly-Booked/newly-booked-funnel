// Combined page — the funnel is the hero, then editorial proof sections below.
const { useState, useEffect } = React;

const CTA = 'See if your area is open';

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
      // path so the wheel reaches the real scroller (<html>). Safe: <html> is the
      // scrollingElement, not <body>, so the page still scrolls everywhere.
      if (document.scrollingElement && document.scrollingElement !== document.body) {
        const oy = getComputedStyle(document.body).overflowY;
        if (oy === 'auto' || oy === 'scroll') {
          document.body.style.setProperty('overflow-y', 'hidden', 'important');
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

  return (
    <>
      {/* HERO = the multi-step funnel */}
      <Funnel embedded />

      {/* MARQUEE */}
      {(
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

      {/* SCREENSHOT WALL — real proof: Cherry approvals, calendars, owner DMs */}
      <section className="screenshot-wall" id="screenshots" data-screen-label="03 Proof">
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
            <a href="#qualify" className="btn btn-gold btn-lg btn-arrow">{CTA} </a>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--navy-200)', marginTop: 14, letterSpacing: '0.06em' }}>
              60-second qualifier · No retainer · No 12-month lock
            </div>
          </div>
        </div>
      </section>

      {/* BIG CTA — straight after the testimonials */}
      <section className="final-cta" id="final-cta" data-screen-label="04 Final CTA">
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
            <a href="#qualify" className="btn btn-gold btn-lg btn-arrow">{CTA} </a>
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
      <a href="#qualify" className="sticky-cta">
        <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--navy-900)', display: 'inline-block' }}></span>
        See if your area is open
        <span>→</span>
      </a>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
