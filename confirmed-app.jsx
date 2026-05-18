// Thank you / Confirmed page — modeled after LVR template structure (no hero video).
const { useState: useCfState, useEffect: useCfEffect, useMemo: useCfMemo } = React;

const CF_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "spaName": "Allure Aesthetics",
  "ownerName": "Dana",
  "callDate": "Wed, May 13",
  "callTime": "2:30 PM",
  "callTimezone": "ET",
  "duration": 45,
  "hostName": "Marcus Whitfield",
  "hostRole": "Senior Partner, Newly Booked",
  "phone": "(800) 939-0807",
  "headlineVariation": 0,
  "accent": "gold"
}/*EDITMODE-END*/;

const CF_ACCENTS = {
  gold:    { 700: '#9A7E3F', 600: '#B89351', 500: '#C9A961', 400: '#D9BD7E', 200: '#EFE0BB', 50: '#FAF5E6' },
  emerald: { 700: '#1F5D3F', 600: '#2A7A55', 500: '#3A9268', 400: '#5DAE85', 200: '#A8D2BC', 50: '#E8F2EC' },
  copper:  { 700: '#8C4A2A', 600: '#A85D38', 500: '#C26F44', 400: '#D58D6A', 200: '#EBC5AE', 50: '#F8EAE0' },
  ink:     { 700: '#1B2D4A', 600: '#2A3F60', 500: '#43597A', 400: '#6B7E9C', 200: '#B5C0D2', 50: '#E8ECF3' },
};

// Video FAQ — short, partnership-call themed, mirrors the template's video grid
const CF_VFAQ = [
  { ix: '01', q: '"Is this just another agency pitch?"', a: "Why this isn't a retainer pitch — and the one thing we sell that other agencies can't.", time: '1:12' },
  { ix: '02', q: '"Who actually closes the consult?"', a: "How the consult flow works — owner vs. team member — and how daily training keeps your close rate accountable.", time: '2:38' },
  { ix: '03', q: '"Will Newly Booked own my patient list?"', a: "You own every lead, every phone number, every record — full export at any time.", time: '0:54' },
  { ix: '04', q: '"How fast do I actually go live?"', a: "What the first 14 days look like, week-by-week, from contract to first booked consult.", time: '2:04' },
  { ix: '05', q: '"What if my close rate is bad right now?"', a: "Why the pre-qualification system mostly fixes this before the patient is in your chair.", time: '1:46' },
  { ix: '06', q: '"What happens after the 60 days?"', a: "Month-over-month performance bands, where most owners land, and how scale works.", time: '1:58' },
  { ix: '07', q: '"How is your model different from CMOs and ad agencies?"', a: "Plain-English breakdown of who eats the risk, who eats the upside, and where margin lives.", time: '2:22' },
  { ix: '08', q: '"What if it doesn\'t work for my market?"', a: "How we screen for fit before partnering — and the markets where we currently can't operate.", time: '1:30' },
  { ix: '09', q: '"What do I need ready for the call?"', a: "The three numbers to bring, plus what we'll pull live so you don't have to prep slides.", time: '1:08' },
];

const CF_TFAQ = [
  {
    q: "I've never heard of Newly Booked. How do I know this is real?",
    a: "We've partnered with 25+ medspas across the U.S. since 2023 and added more than $12M in tracked partner revenue last year alone. The video testimonials and screenshots on our landing page are unedited — names, spas, and revenue numbers are real (with their permission). Your senior partner will walk you through case studies live on the call."
  },
  {
    q: "What if we're not a fit?",
    a: "You'll know on the call. We pre-qualified you because the math looked right based on your form responses. If we dig into your numbers and the model doesn't pencil — or your market is already saturated for our system — we'll tell you, on the call, with reasons. No follow-up sequence, no 'nurture' emails."
  },
  {
    q: "How does your team interact with my staff day-to-day?",
    a: "Light touch. Our setter team handles outreach and qualifies leads through Cherry before they hit your calendar — your front desk doesn't get bombarded or need to chase. The only daily touch is the morning training call, which you (or your closer) join by Zoom for 30 minutes."
  },
  {
    q: "What if I need to reschedule?",
    a: "Use the link in your confirmation email or hit the reschedule button on this page. We'd rather you show up at the right time than burn a slot at the wrong one. Just don't ghost — these slots fill fast and another owner is waiting on yours."
  },
];

// Real partners — revenue before/after, not photos
const CF_RESULTS = [
  { market: 'Austin, TX', before: '$62K/mo', after: '$148K/mo', visits: 'After 90 days on system' },
  { market: 'Scottsdale, AZ', before: '$84K/mo', after: '$201K/mo', visits: 'After 120 days on system' },
  { market: 'Tampa, FL', before: '$48K/mo', after: '$112K/mo', visits: 'After 60 days on system' },
  { market: 'Charlotte, NC', before: '$95K/mo', after: '$224K/mo', visits: 'After 90 days on system' },
  { market: 'Denver, CO', before: '$71K/mo', after: '$163K/mo', visits: 'After 75 days on system' },
  { market: 'Nashville, TN', before: '$58K/mo', after: '$129K/mo', visits: 'After 60 days on system' },
];

const CF_TESTIMONIALS = [
  { name: 'Jessica M.', role: 'Owner, RefineMed', quote: '"I was skeptical it would work this fast."', stat: '$128K · 90d' },
  { name: 'Nicole R.', role: 'Owner, Glow & Co.', quote: '"Three months in. Best hire I\'ve ever made."', stat: '$94K · 60d' },
  { name: 'Maria L.', role: 'Owner, Allure Aesthetics', quote: '"Wish I\'d done this two years ago."', stat: '$167K · 120d' },
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
    const name = p.get('name');
    if (name && name.trim()) out.ownerName = name.trim().split(' ')[0];
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

  const HEADLINES = [
    {
      h: <>You're locked in, <em>{v.ownerName}</em>.</>,
      sub: <>We've blocked {v.duration} minutes with a senior partner to map out the next 60 days of revenue inside <em>{v.spaName}</em>. A calendar invite plus the Zoom link are on the way to your inbox right now.</>,
    },
    {
      h: <>Your seat is <em>held</em>.</>,
      sub: <>Save the time. Block the calendar. Forty-five minutes from now, <em>{tweaks.spaName}</em> will have a written 60-day revenue plan in hand — or a clear no, with reasons.</>,
    },
    {
      h: <>Booked. <em>Now we get to work.</em></>,
      sub: <>The next move is yours. Show up on time, bring three numbers (we list them below), and walk away with a model for how Newly Booked would add <em>$50K–$100K/month</em> to your spa.</>,
    },
  ];
  const head = HEADLINES[tweaks.headlineVariation] || HEADLINES[0];

  const phoneTel = tweaks.phone.replace(/[^\d+]/g, '');

  return (
    <>
      {/* UTILITY BAR */}
      <div className="cf-utility">
        <div className="cf-utility-inner">
          <div className="lhs">
            <a href="index.html" className="brand" style={{ textDecoration: 'none', fontSize: 18 }}>
              <span className="dot"></span>Newly Booked
            </a>
            <span className="partners">
              Partnership Desk &nbsp;<em>×</em>&nbsp; Senior Team
            </span>
          </div>
          <a className="phone" href={`tel:${phoneTel}`}>{tweaks.phone}</a>
        </div>
      </div>

      {/* HERO — no video, just confirmation */}
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
              <div className="lbl">When</div>
              <div className="val"><em>{v.callDate}</em></div>
              <div className="sub">{v.callTime} {v.callTimezone}</div>
            </div>
            <div className="cell">
              <div className="lbl">Format</div>
              <div className="val">Zoom video</div>
              <div className="sub">Link in calendar invite</div>
            </div>
            <div className="cell">
              <div className="lbl">Length</div>
              <div className="val">{tweaks.duration} minutes</div>
              <div className="sub">One decision · Yes / No / Reasons</div>
            </div>
            <div className="cell">
              <div className="lbl">Cost</div>
              <div className="val">$0</div>
              <div className="sub">No obligation, no retainer</div>
            </div>
          </div>
        </div>
      </section>

      {/* SMS CALLOUT — mirrors "Check your phone" */}
      <section className="cf-sms" data-screen-label="02 SMS Callout">
        <div className="container">
          <div className="icon" aria-hidden="true">@</div>
          <div className="body">
            <div className="h"><strong>Check your inbox now.</strong> A confirmation from <em>Newly Booked</em> with the Zoom link should hit in the next 2 minutes.</div>
            <div className="p">
              Didn't see it? Check spam, then call us at <a href={`tel:${phoneTel}`}>{tweaks.phone}</a> — a real human picks up during business hours.
            </div>
          </div>
        </div>
      </section>

      {/* ADD TO CALENDAR */}
      <section className="cf-cal" data-screen-label="03 Add to Calendar">
        <div className="container">
          <div className="head">
            <div className="label">Don't let life get in the way</div>
            <h2>Add the call to your calendar <em>now</em>.</h2>
            <div className="sub">Owners who add the invite in the first five minutes are 3× more likely to show up. Pick your tool — we'll handle the rest.</div>
          </div>
          <div className="cf-cal-row">
            <a className="cf-cal-btn primary" href="#" onClick={(e) => e.preventDefault()}>
              <span className="glyph">G</span>Google Calendar
            </a>
            <a className="cf-cal-btn" href="#" onClick={(e) => e.preventDefault()}>
              <span className="glyph"></span>Apple Calendar
            </a>
            <a className="cf-cal-btn" href="#" onClick={(e) => e.preventDefault()}>
              <span className="glyph">O</span>Outlook
            </a>
            <a className="cf-cal-btn" href="#" onClick={(e) => e.preventDefault()}>
              <span className="glyph">.ics</span>Download
            </a>
          </div>
          <div className="cf-cal-stat">3× show-up rate when you save the invite within 5 minutes.</div>
        </div>
      </section>

      {/* VIDEO FAQ GRID */}
      <section className="cf-vfaq" data-screen-label="04 Video FAQ">
        <div className="container">
          <div className="head">
            <div className="label">Still have questions?</div>
            <div>
              <h2>Everything you're <em>wondering</em> — but haven't asked yet.</h2>
              <div className="lede">Sixty-second answers from the partner who'll be on your call. Watch the ones that apply, skip the rest.</div>
            </div>
          </div>
          <div className="cf-vfaq-grid">
            {CF_VFAQ.map((item, i) => (
              <article key={i} className="cf-vfaq-card">
                <div className="cf-vfaq-thumb">
                  <span className="ix">{item.ix}</span>
                  <span className="timecode">{item.time}</span>
                  <button className="play" aria-label={`Play ${item.q}`}>▶</button>
                  <div className="quote">{item.q}</div>
                </div>
                <div className="cf-vfaq-meta">
                  <div className="q">{item.q}</div>
                  <div className="a">{item.a}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TEXT FAQ */}
      <section className="cf-tfaq" data-screen-label="05 Text FAQ">
        <div className="container-narrow">
          <div className="head">
            <div className="label">Still on the fence?</div>
            <h2>The four we get most often.</h2>
          </div>
          <CfTextFAQ />
        </div>
      </section>

      {/* RESULTS — revenue before/after (not photos) */}
      <section className="cf-results" data-screen-label="07 Real Results">
        <div className="container">
          <div className="head">
            <div className="label">This is what's waiting for you</div>
            <h2>Real partners. <em>Real revenue.</em></h2>
            <div className="sub">Every owner here walked in asking the same thing you are right now: <em>"Will this actually work?"</em></div>
          </div>
          <div className="cf-results-grid">
            {CF_RESULTS.map((r, i) => (
              <div key={i} className="cf-result">
                <div className="market">{r.market}</div>
                <div className="ba">
                  <div className="col before">
                    <div className="lbl">Before</div>
                    <div className="val">{r.before}</div>
                  </div>
                  <div className="arr">→</div>
                  <div className="col after">
                    <div className="lbl">After</div>
                    <div className="val">{r.after}</div>
                  </div>
                </div>
                <div className="visits">{r.visits}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="cf-testimonials" data-screen-label="08 Hear It From Them">
        <div className="container">
          <div className="head">
            <div className="label">Hear it from them</div>
            <h2>Three owners. One model. Same answer.</h2>
          </div>
          <div className="cf-test-grid">
            {CF_TESTIMONIALS.map((t, i) => (
              <article key={i} className="cf-test-card">
                <div className="cf-test-thumb">
                  <button className="play" aria-label={`Play ${t.name}`}>▶</button>
                  <div className="quote">{t.quote}</div>
                </div>
                <div className="cf-test-meta">
                  <div>
                    <div className="name">{t.name}</div>
                    <div className="role">{t.role}</div>
                  </div>
                  <div className="stat">{t.stat}</div>
                </div>
              </article>
            ))}
          </div>

          <div className="cf-quote-pair">
            <div className="cf-quote">
              <div className="body">"I'd tried CMOs and a fractional sales agency — neither one moved the needle. Two months in with Newly Booked and we're <em>already past last year's best quarter</em>. I only wish I'd done this sooner."</div>
              <div className="author">
                <span className="who">Sarah M.</span>
                <span className="where">Verified Partner · Google Review</span>
              </div>
            </div>
            <div className="cf-quote">
              <div className="body">"A friend told me about Newly Booked and I thought it was a scam — performance-only, no retainer? It's not. The team is real, the system works, and the numbers <em>speak for themselves</em>."</div>
              <div className="author">
                <span className="who">Jessica R.</span>
                <span className="where">Verified Partner · Google Review</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — 3 steps */}
      <section className="cf-how" data-screen-label="09 How It Works">
        <div className="container">
          <div className="head">
            <div className="label">How it works</div>
            <h2>From first call to first revenue — in <em>three steps</em>.</h2>
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
      <section className="cf-prep" data-screen-label="10 How to Prepare">
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
                <p>Top-line, not net. Inside your POS or PMS. Doesn't need to be exact — within a 10% band gets us where we need to go. We use this to size <em>the 60-day revenue model</em>.</p>
              </div>
            </div>
            <div className="cf-prep-row">
              <div className="when">24–48 hours before</div>
              <div>
                <h4>Note your average package price + close rate</h4>
                <p>Across your top 3 services. If you've never measured close rate, ballpark it — we'll show you what <em>pre-qualified, financing-approved</em> traffic does to that number.</p>
              </div>
            </div>
            <div className="cf-prep-row">
              <div className="when">Day of</div>
              <div>
                <h4>Be on a real computer, somewhere quiet</h4>
                <p>We'll share screen and walk through the model live. Phones work, but it's harder to read the numbers. Block the full {tweaks.duration} minutes — most calls run a few minutes long.</p>
              </div>
            </div>
          </div>
          <div className="cf-prep-callout">
            <strong>These small steps make the difference.</strong> Owners who show up prepared walk away with a written model. Owners who don't usually need a second call. Either way — show up.
          </div>
        </div>
      </section>

      {/* BIG FOOTER */}
      <footer className="cf-bigfoot">
        <div className="container">
          <div className="row">
            <div className="partners">
              Newly Booked &nbsp;<em>×</em>&nbsp; <em>{tweaks.spaName}</em>
            </div>
            <div className="contact">
              <a href={`tel:${phoneTel}`}>{tweaks.phone}</a>
              <div>Partnership Desk · 9–6 ET, Mon–Fri</div>
            </div>
          </div>
          <p className="micro">
            © 2026 Newly Booked. All rights reserved. Results may vary. Individual outcomes depend on multiple factors including market saturation, operational maturity, in-spa staffing, and adherence to playbook recommendations. Testimonials reflect individual partner experiences and are not a guarantee of results. We only get paid when your patients pay you.
          </p>
          <div className="legal">
            <span>© 2026 Newly Booked · We Only Make Money When You Do</span>
            <div style={{ display: 'flex', gap: 22 }}>
              <a href="#">Terms</a>
              <a href="#">Privacy</a>
              <a href="index.html">← Back to site</a>
            </div>
          </div>
        </div>
      </footer>

      {/* TWEAKS */}
      <TweaksPanel>
        <TweakSection label="Booking details">
          <TweakText label="Owner first name" value={tweaks.ownerName}
            onChange={(v) => setTweak('ownerName', v)} />
          <TweakText label="Spa name" value={tweaks.spaName}
            onChange={(v) => setTweak('spaName', v)} />
          <TweakText label="Call date" value={tweaks.callDate}
            onChange={(v) => setTweak('callDate', v)} />
          <TweakText label="Call time" value={tweaks.callTime}
            onChange={(v) => setTweak('callTime', v)} />
          <TweakText label="Timezone" value={tweaks.callTimezone}
            onChange={(v) => setTweak('callTimezone', v)} />
          <TweakSlider label="Duration (min)" value={tweaks.duration} min={30} max={90} step={15}
            onChange={(v) => setTweak('duration', v)} />
        </TweakSection>
        <TweakSection label="Partner">
          <TweakText label="Host name" value={tweaks.hostName}
            onChange={(v) => setTweak('hostName', v)} />
          <TweakText label="Host role" value={tweaks.hostRole}
            onChange={(v) => setTweak('hostRole', v)} />
          <TweakText label="Phone" value={tweaks.phone}
            onChange={(v) => setTweak('phone', v)} />
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
