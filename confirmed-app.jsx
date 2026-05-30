// Thank you / Confirmed page — modeled after LVR template structure (no hero video).
const { useState: useCfState, useEffect: useCfEffect, useMemo: useCfMemo } = React;

const CF_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "ownerName": "there",
  "callDate": "Wed, May 13",
  "callTime": "2:30 PM",
  "callTimezone": "ET",
  "duration": 45,
  "headlineVariation": 0,
  "accent": "gold"
}/*EDITMODE-END*/;

const CF_ACCENTS = {
  gold:    { 700: '#9A7E3F', 600: '#B89351', 500: '#C9A961', 400: '#D9BD7E', 200: '#EFE0BB', 50: '#FAF5E6' },
  emerald: { 700: '#1F5D3F', 600: '#2A7A55', 500: '#3A9268', 400: '#5DAE85', 200: '#A8D2BC', 50: '#E8F2EC' },
  copper:  { 700: '#8C4A2A', 600: '#A85D38', 500: '#C26F44', 400: '#D58D6A', 200: '#EBC5AE', 50: '#F8EAE0' },
  ink:     { 700: '#1B2D4A', 600: '#2A3F60', 500: '#43597A', 400: '#6B7E9C', 200: '#B5C0D2', 50: '#E8ECF3' },
};

// Hammer-Them: Ivan-on-camera answers to the 14 most common objections.
// When a recording is uploaded to Wistia, swap that entry's wistiaId from
// null to the media id. While null, the tile renders a styled placeholder
// (4:5 navy frame, gold play badge, title up top, speaker down bottom).
const CF_HAMMERTHEM = [
  { ix: 1,  q: "I haven't got enough time.",                          wistiaId: 'bfmbtvg832' },
  { ix: 2,  q: "How do we make you stand out?",                       wistiaId: 'm6169m7kzu' },
  { ix: 3,  q: "How do we know it works?",                            wistiaId: '9u2ckyrqak' },
  { ix: 4,  q: "Is it better for me to make the ads, or you?",        wistiaId: '32piq6olrt' },
  { ix: 6,  q: "How fast can I see results?",                         wistiaId: '56fd2qfcan' },
  { ix: 7,  q: "Is hiring an agency a short-term fix?",               wistiaId: 'hgbgrog83d' },
  { ix: 8,  q: "I've tried ads before, it didn't work.",              wistiaId: 'p2fzrg1hip' },
  { ix: 9,  q: "Do you have testimonials?",                           wistiaId: '71evnaexa7' },
  { ix: 10, q: "Do you guarantee results?",                           wistiaId: '38zhblnara' },
  { ix: 11, q: "Which treatment should I advertise?",                 wistiaId: 'ahhhq7v5d9' },
  { ix: 12, q: "How our patient sales team works.",                   wistiaId: 'esh8li4zt4' },
  { ix: 13, q: "Why 9 out of 10 medspas fail with agencies.",         wistiaId: 'q9gvm2tpk2' },
  { ix: 14, q: "If you've been burned before.",                       wistiaId: '253llfn0ms' },
  { ix: 15, q: "How our patient acquisition system works.",           wistiaId: 'i2wlf5j7is' },
];

function useCfHammerWistia(id) {
  useCfEffect(() => {
    if (!id) return;
    const tag = `wistia-embed-${id}`;
    if (document.getElementById(tag)) return;
    const s = document.createElement('script');
    s.id = tag;
    s.src = `https://fast.wistia.com/embed/${id}.js`;
    s.type = 'module';
    s.async = true;
    document.body.appendChild(s);
  }, [id]);
}

function HammerThemTile({ item }) {
  useCfHammerWistia(item.wistiaId);
  const playerRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);

  // Click our small overlay → tell Wistia to play. Wait for the
  // custom element to register if the loader script hasn't run yet.
  const handlePlay = React.useCallback(() => {
    setPlaying(true);
    const el = playerRef.current;
    if (!el) return;
    const tryPlay = () => {
      try {
        if (typeof el.play === 'function') {
          const p = el.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      } catch (_) { /* ignore */ }
    };
    if (window.customElements && typeof el.play !== 'function') {
      window.customElements.whenDefined('wistia-player').then(tryPlay).catch(() => {});
    } else {
      tryPlay();
    }
  }, []);

  useCfEffect(() => {
    const el = playerRef.current;
    if (!el) return undefined;
    const onPlay = () => setPlaying(true);
    el.addEventListener('play', onPlay);
    return () => el.removeEventListener('play', onPlay);
  }, [item.wistiaId]);

  return (
    <article
      className={`cf-ht-card${item.wistiaId ? ' has-wistia' : ' pending'}${playing ? ' is-playing' : ''}`}
    >
      <div className="cf-ht-frame">
        {item.wistiaId ? (
          <>
            <wistia-player ref={playerRef} media-id={item.wistiaId} aspect="0.8"></wistia-player>
            {!playing && (
              <button
                type="button"
                className="nb-play-btn"
                aria-label={`Play: ${item.q}`}
                onClick={handlePlay}
              >
                <svg
                  className="nb-play-btn__icon"
                  viewBox="0 0 12 14"
                  aria-hidden="true"
                  focusable="false"
                >
                  <polygon points="1,0.5 12,7 1,13.5" fill="currentColor" />
                </svg>
              </button>
            )}
          </>
        ) : (
          <div className="cf-ht-placeholder" aria-hidden="true">
            <div className="cf-ht-pending-title">{item.q}</div>
            <span className="cf-ht-play">▸</span>
          </div>
        )}
      </div>
    </article>
  );
}

const CF_TFAQ = [
  {
    q: "I've never heard of Newly Booked. How do I know this is real?",
    a: "We've partnered with 25+ medspas across the U.S. since 2023 and added more than $12M in tracked partner revenue last year alone. The video testimonials and screenshots on our landing page are unedited. Names, spas, and revenue numbers are real (with their permission). Your senior partner will walk you through case studies live on the call."
  },
  {
    q: "What if we're not a fit?",
    a: "You'll know on the call. We pre-qualified you because the math looked right based on your form responses. If we dig into your numbers and the model doesn't pencil, or your market is already saturated for our system, we'll tell you on the call, with reasons. No follow-up sequence, no 'nurture' emails."
  },
  {
    q: "How does your team interact with my staff day-to-day?",
    a: "Light touch. Our setter team handles outreach and qualifies leads through Cherry before they hit your calendar, so your front desk doesn't get bombarded or need to chase. The only daily touch is the morning training call, which you (or your closer) join by Zoom for 30 minutes."
  },
  {
    q: "What if I need to reschedule?",
    a: "Use the link in your confirmation email or hit the reschedule button on this page. We'd rather you show up at the right time than burn a slot at the wrong one. Just don't ghost. These slots fill fast and another owner is waiting on yours."
  },
];

function CfTextFAQ() {
  const [open, setOpen] = useCfState(0);
  return (
    <div className="faq-list">
      {CF_TFAQ.map((item, i) => (
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

function CfApp() {
  const [tweaks, setTweak] = useTweaks(CF_TWEAK_DEFAULTS);

  // Pull personalization from the URL the scheduler redirected here with.
  // We override locally instead of calling setTweak so the EDITMODE defaults
  // on disk aren't rewritten by a real lead's name/time.
  const urlVals = useCfMemo(() => {
    const p = new URLSearchParams(window.location.search);
    const out = {};
    // GHL may redirect with first_name (preferred) — fall back to a full
    // name from the qualifier flow.
    const first = p.get('first_name');
    const name = p.get('name');
    if (first && first.trim()) out.ownerName = first.trim();
    else if (name && name.trim()) out.ownerName = name.trim().split(' ')[0];
    const slot = p.get('slot');
    if (slot && slot.includes(' · ')) {
      const [d, ti] = slot.split(' · ');
      out.callDate = d.trim();
      out.callTime = ti.trim();
    }
    return out;
  }, []);
  const v = { ...tweaks, ...urlVals };

  useCfEffect(() => {
    const a = CF_ACCENTS[tweaks.accent] || CF_ACCENTS.gold;
    const r = document.documentElement;
    Object.entries(a).forEach(([k, v]) => r.style.setProperty(`--gold-${k}`, v));
  }, [tweaks.accent]);

  // When GHL passes a real name via the redirect, render it with a
  // comma (`You're locked in, Jesus.`). When it doesn't (local preview
  // or stale GHL config), drop the comma + placeholder cleanly so we
  // don't end up with `You're locked in, there.`
  const hasOwner = v.ownerName && v.ownerName !== 'there';
  const salutation = hasOwner ? <>, <em>{v.ownerName}</em></> : null;

  const HEADLINES = [
    {
      h: <>You're locked in{salutation}.</>,
      sub: <>We've blocked {v.duration} minutes with a senior partner to map out the next 60 days of revenue for your spa. A calendar invite plus the Zoom link are on the way to your inbox right now.</>,
    },
    {
      h: <>Your seat is <em>held</em>.</>,
      sub: <>Save the time. Block the calendar. Forty-five minutes from now you'll have a written 60-day revenue plan in hand, or a clear no with reasons.</>,
    },
    {
      h: <>Booked. <em>Now we get to work.</em></>,
      sub: <>The next move is yours. Show up on time, bring three numbers (we list them below), and walk away with a model for how Newly Booked would add <em>$50K–$100K/month</em> to your spa.</>,
    },
  ];
  const head = HEADLINES[tweaks.headlineVariation] || HEADLINES[0];

  return (
    <>
      {/* Top bar — unified sticky paper bar with the confirmation status
          stamp on the right so the moment of "you're booked" stays
          present as the lead scrolls. */}
      <div className="topbar">
        <div className="topbar-inner">
          <a href={window.nbUrl('__NB_LANDING_URL', 'index.html')} className="brand">
            <img className="nb-logo" src="assets/brand/nb-logo-dark.png" alt="Newly Booked" />
            <span>Newly Booked</span>
          </a>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999,
              background: 'var(--green, #1F6B3A)',
            }}></span>
            Call Confirmed
          </span>
        </div>
      </div>

      {/* HERO — confirmation + booking-details band so the owner can see
          when / where / how-long / cost without digging through email. */}
      <section className="cf-hero" data-screen-label="01 Hero · Confirmed">
        <div className="container">
          <div className="cf-pill">
            <span className="check">✓</span>
            Call Confirmed
          </div>
          <h1>{head.h}</h1>
          <p className="lede">{head.sub}</p>
          <div className="cf-hero-meta">
            <div className="cell">
              <div className="lbl">Where</div>
              <div className="val">Zoom</div>
              <div className="sub">Video link in your email</div>
            </div>
            <div className="cell">
              <div className="lbl">Length</div>
              <div className="val">{v.duration} min</div>
              <div className="sub">With a senior partner</div>
            </div>
            <div className="cell">
              <div className="lbl">Cost</div>
              <div className="val"><em>$0</em></div>
              <div className="sub">No retainer, no contract</div>
            </div>
          </div>
        </div>
      </section>

      {/* HAMMER THEM — 14 short Ivan-on-camera answers, slotted directly
          under the locked-in hero as the lead's primary pre-call homework.
          Replaces the single 'watch this' overview video — pick-your-question
          converts better than one-size-fits-all. */}
      <section className="cf-hammerthem" data-screen-label="02 Before the Call">
        <div className="container">
          <div className="head">
            <div className="label">Before the call</div>
            <h2>The 14 questions every owner asks, <em>answered</em>.</h2>
            <p className="lede">Two minutes each. On camera. Watch what applies.</p>
          </div>
          <div className="cf-ht-grid">
            {CF_HAMMERTHEM.map((item) => (
              <HammerThemTile key={item.ix} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* SMS / inbox CALLOUT — mirrors "Check your phone" pattern. */}
      <section className="cf-sms" data-screen-label="03 SMS Callout">
        <div className="container">
          <div className="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </div>
          <div className="body">
            <div className="h"><strong>Check your inbox now.</strong> A confirmation from <em>Newly Booked</em> with the Zoom link should hit in the next 2 minutes.</div>
            <div className="p">
              Didn't see it? Check spam, then reply to any previous Newly Booked email and we'll re-send it.
            </div>
          </div>
        </div>
      </section>

      {/* TEXT FAQ */}
      <section className="cf-tfaq" data-screen-label="04 Text FAQ">
        <div className="container-narrow">
          <div className="head">
            <div className="label">Still on the fence?</div>
            <h2>The four we get most often.</h2>
          </div>
          <CfTextFAQ />
        </div>
      </section>

      {/* TESTIMONIALS — same Wistia grid as the landing page */}
      <section className="cf-testimonials" data-screen-label="05 Hear It From Them">
        <div className="container">
          <div className="head">
            <div className="label">Hear it from them</div>
            <h2>Owners running this model <em>right now</em>.</h2>
          </div>
          <VideoTestimonials />
        </div>
      </section>

      {/* HOW IT WORKS — 3 steps */}
      <section className="cf-how" data-screen-label="06 How It Works">
        <div className="container">
          <div className="head">
            <div className="label">How it works</div>
            <h2>From first call to first revenue in <em>three steps</em>.</h2>
          </div>
          <div className="cf-how-grid">
            <div className="cf-how-cell">
              <div className="num">01</div>
              <h4>The 45-minute call</h4>
              <p>We pull your numbers live, walk you through the 60-day revenue model, and lay out commission terms in plain English. No retainer pitch, no 12-month lock. <em>One decision.</em></p>
            </div>
            <div className="cf-how-cell">
              <div className="num">02</div>
              <h4>You go live in 14 days</h4>
              <p>If we're a fit, we ship the playbook, turn on the Cherry pre-qualification system, and start booking your calendar with pre-approved patients. Most partners see their first <em>showed</em> consult inside two weeks of signing.</p>
            </div>
            <div className="cf-how-cell">
              <div className="num">03</div>
              <h4>Watch revenue compound</h4>
              <p>Most owners see <em>$30K–$60K</em> in cash revenue added inside the first 60 days. Owners doing $80K+/month see $50K–$100K/month added. We only get paid when your patients pay you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW TO PREPARE */}
      <section className="cf-prep" data-screen-label="07 How to Prepare">
        <div className="container">
          <div className="head">
            <div className="label">Get the most from your call</div>
            <h2>How to prepare.</h2>
          </div>
          <div className="cf-prep-list">
            <div className="cf-prep-row">
              <div className="when">1 week before</div>
              <div>
                <h4>Pull last 90 days of revenue</h4>
                <p>Top-line, not net. Inside your POS or PMS. Doesn't need to be exact. Within a 10% band gets us where we need to go. We use this to size <em>the 60-day revenue model</em>.</p>
              </div>
            </div>
            <div className="cf-prep-row">
              <div className="when">24–48 hours before</div>
              <div>
                <h4>Note your average package price + close rate</h4>
                <p>Across your top 3 services. If you've never measured close rate, ballpark it. We'll show you what <em>pre-qualified, financing-approved</em> traffic does to that number.</p>
              </div>
            </div>
            <div className="cf-prep-row">
              <div className="when">Day of</div>
              <div>
                <h4>Be on a real computer, somewhere quiet</h4>
                <p>We'll share screen and walk through the model live. Phones work, but it's harder to read the numbers. Block the full {tweaks.duration} minutes. Most calls run a few minutes long.</p>
              </div>
            </div>
          </div>
          <div className="cf-prep-callout">
            <strong>These small steps make the difference.</strong> Owners who show up prepared walk away with a written model. Owners who don't usually need a second call. Either way, show up.
          </div>
        </div>
      </section>

      {/* BIG FOOTER */}
      <footer className="cf-bigfoot">
        <div className="container">
          <div className="row">
            <div className="partners">
              <span className="dot"></span>Newly Booked
            </div>
          </div>
          <p className="micro">
            © 2026 Newly Booked. All rights reserved. Results may vary. Individual outcomes depend on multiple factors including market saturation, operational maturity, in-spa staffing, and adherence to playbook recommendations. Testimonials reflect individual partner experiences and are not a guarantee of results. We only get paid when your patients pay you.
          </p>
          <div className="legal">
            <span>© 2026 Newly Booked · We Only Make Money When You Do</span>
            <div style={{ display: 'flex', gap: 22 }}>
              <a href={window.nbUrl('__NB_TERMS_URL', 'terms.html')}>Terms</a>
              <a href={window.nbUrl('__NB_PRIVACY_URL', 'privacy.html')}>Privacy</a>
              <a href={window.nbUrl('__NB_LANDING_URL', 'index.html')}>← Back to site</a>
            </div>
          </div>
        </div>
      </footer>

      {/* TWEAKS */}
      <TweaksPanel>
        <TweakSection label="Booking details">
          <TweakText label="Owner first name" value={tweaks.ownerName}
            onChange={(v) => setTweak('ownerName', v)} />
          <TweakText label="Call date" value={tweaks.callDate}
            onChange={(v) => setTweak('callDate', v)} />
          <TweakText label="Call time" value={tweaks.callTime}
            onChange={(v) => setTweak('callTime', v)} />
          <TweakText label="Timezone" value={tweaks.callTimezone}
            onChange={(v) => setTweak('callTimezone', v)} />
          <TweakSlider label="Duration (min)" value={tweaks.duration} min={30} max={90} step={15}
            onChange={(v) => setTweak('duration', v)} />
        </TweakSection>
        <TweakSection label="Hero">
          <TweakSelect label="Headline" value={tweaks.headlineVariation}
            onChange={(v) => setTweak('headlineVariation', parseInt(v))}
            options={[
              { value: 0, label: '01 · You\'re locked in, [Owner]' },
              { value: 1, label: '02 · Your seat is held' },
              { value: 2, label: '03 · Booked · Now we get to work' },
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
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CfApp />);
