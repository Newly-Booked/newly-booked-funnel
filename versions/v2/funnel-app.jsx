// Newly Booked — Perspective-style funnel (v2).
// Full-screen, one question per screen, tappable cards auto-advance.
// Every lead completes the funnel; on the final step we evaluate the
// disqualifier rules and route to the DQ page or the schedule page.

const { useState, useEffect } = React;

// Bump when the funnel card images change, to bust browser/CDN cache.
const IMG_V = 2;

// Simple inline icons for yes/no cards (clean SVG, no busy photos).
function PfIcon({ name }) {
  const p = { width: 34, height: 34, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'check') return (<svg {...p}><path d="M5 12.5l4.3 4.3L19 7" /></svg>);
  if (name === 'x') return (<svg {...p}><path d="M17 7L7 17M7 7l10 10" /></svg>);
  return null;
}

// Render a headline with one substring highlighted in the accent color.
function renderQ(q, hl) {
  if (!hl) return q;
  const i = q.indexOf(hl);
  if (i < 0) return q;
  return (<>{q.slice(0, i)}<span className="pf-hl">{hl}</span>{q.slice(i + hl.length)}</>);
}

// Resolve a configurable URL global, ignoring unreplaced placeholders.
function nbUrl(name, def) {
  try {
    const v = window[name];
    if (typeof v === 'string' && v && !/^\[REPLACE_WITH_/.test(v)) return v;
  } catch (e) {}
  return def;
}
window.nbUrl = nbUrl;

function phoneDigits(raw) { return String(raw || '').replace(/\D/g, ''); }
function formatPhone(raw) {
  const d = phoneDigits(raw).slice(0, 10);
  if (!d) return '';
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
function isValidPhone(raw) { return phoneDigits(raw).length === 10; }
function isValidEmail(raw) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(raw).trim()); }

// ---- FUNNEL STEPS ----------------------------------------------------------
// kind: intro | cards | tiles | text | contact
// option.dq:true  → choosing it routes the lead to the DQ page at the end.
const STEPS = [
  {
    id: 'own', kind: 'cards', key: 'own', cols: 2, big: true, trust: true,
    eyebrow: 'For medspa owners',
    q: 'Add $50K–$100K/month in new patient revenue without tire kickers or retainers.',
    hl: '$50K–$100K',
    prompt: 'First — do you own a medspa?',
    options: [
      { v: 'yes', label: 'Yes, I own a medspa', icon: 'check' },
      { v: 'no', label: "No, I don't have a medspa", icon: 'x', dq: true },
    ],
  },
  {
    id: 'location', kind: 'cards', key: 'location', cols: 2,
    q: 'Do you run it out of a physical location?',
    sub: 'A studio, suite, or storefront patients can walk into.',
    options: [
      { v: 'yes', label: 'Yes, I have a location', emoji: '🏢', img: 'assets/funnel/location-yes.png' },
      { v: 'no', label: 'Not a physical location', emoji: '🚪', img: 'assets/funnel/location-no.png', dq: true },
    ],
  },
  {
    id: 'treatment', kind: 'cards', key: 'treatment', cols: 3,
    q: 'Can you perform fat-reduction treatments like Kybella or PCDC (Liquid Lipo)?',
    options: [
      { v: 'yes', label: 'Yes — Kybella / PCDC', emoji: '💉', img: 'assets/funnel/treatment-yes.png' },
      { v: 'similar', label: 'Similar treatments', emoji: '✨', img: 'assets/funnel/treatment-similar.png' },
      { v: 'no', label: 'No, I don’t', emoji: '🚫', img: 'assets/funnel/treatment-no.png', dq: true },
    ],
  },
  {
    id: 'revenue', kind: 'choices', key: 'revenue', cols: 2,
    q: 'What’s your approximate monthly revenue?',
    options: [
      { v: '<10', label: 'Under $10K', dq: true },
      { v: '10-30', label: '$10K – $30K', dq: true },
      { v: '30-100', label: '$30K – $100K' },
      { v: '100+', label: '$100K+' },
    ],
  },
  {
    id: 'frisat', kind: 'cards', key: 'frisat', cols: 2,
    q: '55% of sales happen Friday & Saturday. Can you take consults on those days?',
    sub: 'Our top spas treat the weekend as their biggest revenue window.',
    options: [
      { v: 'yes', label: 'Yes, I can', icon: 'check' },
      { v: 'no', label: 'No', icon: 'x', dq: true },
    ],
  },
  {
    id: 'tenure', kind: 'choices', key: 'tenure', cols: 2,
    q: 'How long has your medspa been in business?',
    options: [
      { v: '<1', label: 'Under 1 year' },
      { v: '1-3', label: '1 – 3 years' },
      { v: '3-5', label: '3 – 5 years' },
      { v: '5+', label: '5+ years' },
    ],
  },
  {
    id: 'city', kind: 'autocomplete', key: 'city',
    q: 'What city is your clinic in?',
  },
  {
    id: 'business', kind: 'text', key: 'business',
    q: 'What’s the name of your business?',
    placeholder: 'Your business name',
  },
  {
    id: 'contact', kind: 'contact',
    q: 'Last step — where should we send your results?',
    sub: 'We’ll review your answers and send a private invite to book your diagnostic.',
  },
];

// ---- DISQUALIFIER RULES (edit freely) --------------------------------------
function isDisqualified(answers) {
  return STEPS.some((s) => {
    if (!s.key || !s.options) return false;
    const opt = s.options.find((o) => o.v === answers[s.key]);
    return opt && opt.dq;
  });
}

const QUESTION_KINDS = ['cards', 'tiles', 'text', 'choices', 'autocomplete'];
const labelFor = (stepId, value) => {
  const s = STEPS.find((x) => x.id === stepId);
  if (!s || !s.options) return value || '';
  const o = s.options.find((x) => x.v === value);
  return o ? o.label : (value || '');
};

// iClosed booking widget — loads the embed script once, then renders inline.
function ScheduleCalendar() {
  useEffect(() => {
    if (document.getElementById('iclosed-widget-script')) return;
    const s = document.createElement('script');
    s.id = 'iclosed-widget-script';
    s.src = 'https://app.iclosed.io/assets/widget.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);
  return (
    <div
      className="iclosed-widget"
      data-url="https://app.iclosed.io/e/newlybooked/setter-call"
      title="INTRO CALL"
      style={{ width: '100%', height: '620px' }}
    ></div>
  );
}

function Funnel({ embedded } = {}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [picked, setPicked] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tries, setTries] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [otherMode, setOtherMode] = useState(false);
  const [showCity, setShowCity] = useState(false);
  useEffect(() => { setOtherMode(false); setShowCity(false); }, [idx]);

  // City autocomplete
  const cityList = (typeof window !== 'undefined' && window.NB_CITIES) || [];
  const cq = (answers.city || '').trim().toLowerCase();
  const cityMatches = cq.length >= 1
    ? cityList
        .filter((c) => c.toLowerCase().includes(cq))
        .sort((a, b) => (a.toLowerCase().startsWith(cq) ? 0 : 1) - (b.toLowerCase().startsWith(cq) ? 0 : 1))
        .slice(0, 7)
    : [];
  const pickCity = (c) => { setAnswers((a) => ({ ...a, city: c })); setShowCity(false); setTimeout(goNext, 180); };

  const step = STEPS[idx];
  const last = STEPS.length - 1;
  // Count question steps for the "Question X of N" label, excluding the hook
  // screen (which shows its own eyebrow instead of a counter).
  const counted = STEPS.filter((s) => QUESTION_KINDS.includes(s.kind) && !s.eyebrow);
  const qTotal = counted.length;
  const qNum = counted.indexOf(step) + 1;
  const progress = Math.round((idx / last) * 100);

  const goNext = () => setIdx((i) => Math.min(i + 1, last));
  const goBack = () => setIdx((i) => Math.max(i - 1, 0));

  const pick = (opt) => {
    if (step.key) setAnswers((a) => ({ ...a, [step.key]: opt.v }));
    setPicked(opt.v);
    setTimeout(() => { setPicked(null); goNext(); }, 230);
  };

  const eyebrow = step.eyebrow ? step.eyebrow
    : step.kind === 'contact' ? 'Final step'
    : qNum > 0 ? `Question ${qNum} of ${qTotal}` : '';

  // Text step
  const textVal = answers[step.key] || '';
  const setText = (val) => setAnswers((a) => ({ ...a, [step.key]: val }));
  const textOk = String(textVal).trim().length > 0;

  // Contact validation
  const emailBad = !isValidEmail(email);
  const phoneBad = !isValidPhone(phone);
  const contactBad = !name.trim() || emailBad || phoneBad;

  const submit = () => {
    setTries((t) => t + 1);
    if (contactBad) return;

    // Disqualified → DQ page (the only other page). DQ rules are in DQ_RULES above.
    if (isDisqualified(answers)) {
      setSubmitting(true);
      const params = new URLSearchParams({
        name: name.trim(), email: email.trim(), phone: phone.trim(),
        business: (answers.business || '').trim(), city: (answers.city || '').trim(),
        status: 'dq',
      });
      const dest = nbUrl('__NB_DQ_URL', 'dq.html');
      setTimeout(() => {
        window.location.href = `${dest}${dest.includes('?') ? '&' : '?'}${params.toString()}`;
      }, 300);
      return;
    }

    // Qualified → reveal the iClosed calendar inline on this same page.
    setShowCal(true);
    try { window.scrollTo(0, 0); } catch (e) {}
  };

  // Qualified view — the iClosed calendar revealed inline.
  if (showCal) {
    const first = name.trim().split(/\s+/)[0];
    return (
      <div className="pf-root" id="qualify">
        <div className="pf-top">
          <div className="pf-logo"><span className="pf-mark">N<i></i>B</span><span className="pf-wordmark">Newly Booked</span></div>
        </div>
        <div className="pf-stage">
          <div className="pf-inner pf-anim" key="cal">
            <div className="pf-eyebrow">You qualify</div>
            <h1 className="pf-q">Pick your time{first ? `, ${first}` : ''}.</h1>
            <p className="pf-sub">A 45-minute video call with a senior partner — we’ll map out exactly how we’d add $50K–$100K/month to your spa.</p>
            <div className="pf-cal"><ScheduleCalendar /></div>
          </div>
        </div>
        <div className="pf-progress"><div className="pf-progress-bar" style={{ width: '100%' }}></div></div>
      </div>
    );
  }

  return (
    <div className="pf-root" id="qualify">
      <div className="pf-top">
        <div className="pf-logo"><span className="pf-mark">N<i></i>B</span><span className="pf-wordmark">Newly Booked</span></div>
        {idx === 0 && !submitting ? (
          <div className="pf-slots"><span className="pf-pulse"></span>4 spots left this month</div>
        ) : (
          <button className="pf-back" hidden={submitting} onClick={goBack}>← Back</button>
        )}
      </div>

      <div className="pf-stage">
        <div className="pf-inner pf-anim" key={idx}>
          {submitting ? (
            <>
              <div className="pf-spinner"></div>
              <div className="pf-eyebrow">One moment</div>
              <h1 className="pf-q">Reviewing your answers…</h1>
            </>
          ) : (
            <>
              <div className="pf-eyebrow">{eyebrow}</div>
              <h1 className={`pf-q${step.big ? ' lg' : ''}`}>{renderQ(step.q, step.hl)}</h1>
              {step.sub && <p className="pf-sub">{step.sub}</p>}
              {step.prompt && <p className="pf-prompt">{step.prompt}</p>}

              {(step.kind === 'cards' || step.kind === 'tiles') && (
                <div className={`pf-cards cols-${step.cols || step.options.length}`}>
                  {step.options.map((o) => (
                    <button
                      key={o.v}
                      className={`pf-card${step.kind === 'tiles' ? ' tile' : ''}${o.img ? ' has-img' : ''}${picked === o.v ? ' selected' : ''}`}
                      onClick={() => pick(o)}
                    >
                      <span className="pf-card-media">
                        {o.img ? <img src={`${o.img}?v=${IMG_V}`} alt={o.label} loading="lazy" />
                          : o.icon ? <span className={`pf-cardicon pf-cardicon-${o.icon}`}><PfIcon name={o.icon} /></span>
                          : o.emoji}
                      </span>
                      <span className="pf-card-label">{o.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {step.kind === 'choices' && !otherMode && (
                <div className={`pf-choices cols-${step.cols || 2}`}>
                  {step.options.map((o) => (
                    <button
                      key={o.v}
                      className={`pf-choice${o.other ? ' other' : ''}${picked === o.v ? ' selected' : ''}`}
                      onClick={() => (o.other ? setOtherMode(true) : pick(o))}
                    >{o.label}{o.other ? ' →' : ''}</button>
                  ))}
                </div>
              )}

              {step.kind === 'choices' && otherMode && (
                <form className="pf-form" onSubmit={(e) => { e.preventDefault(); if ((answers[step.key] || '').trim()) goNext(); }}>
                  <input className="pf-input" type="text" autoFocus placeholder="Your city & state (e.g. Austin, TX)"
                    value={answers[step.key] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [step.key]: e.target.value }))} />
                  <button type="submit" className="pf-btn pf-btn-block pf-btn-lg" disabled={!(answers[step.key] || '').trim()}>Continue →</button>
                  <button type="button" className="pf-back" style={{ alignSelf: 'center' }} onClick={() => setOtherMode(false)}>← Back to the list</button>
                </form>
              )}

              {step.kind === 'autocomplete' && (
                <div className="pf-form" style={{ position: 'relative' }}>
                  <div className="pf-ac">
                    <input
                      className="pf-input" type="text" autoFocus autoComplete="off"
                      placeholder="Start typing your city…"
                      value={answers[step.key] || ''}
                      onChange={(e) => { setAnswers((a) => ({ ...a, [step.key]: e.target.value })); setShowCity(true); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if ((answers[step.key] || '').trim()) goNext(); } }}
                    />
                    {showCity && cityMatches.length > 0 && (
                      <ul className="pf-ac-list">
                        {cityMatches.map((c) => (
                          <li key={c}>
                            <button type="button" className="pf-ac-item" onClick={() => pickCity(c)}>{c}</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button" className="pf-btn pf-btn-block pf-btn-lg"
                    disabled={!(answers[step.key] || '').trim()}
                    onClick={() => { if ((answers[step.key] || '').trim()) goNext(); }}
                  >Continue →</button>
                </div>
              )}

              {step.kind === 'text' && (
                <form className="pf-form" onSubmit={(e) => { e.preventDefault(); if (textOk) goNext(); }}>
                  <input
                    className="pf-input" type="text" autoFocus
                    placeholder={step.placeholder} value={textVal}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button type="submit" className="pf-btn pf-btn-block pf-btn-lg" disabled={!textOk}>Continue →</button>
                </form>
              )}

              {step.kind === 'contact' && (
                <form className="pf-form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
                  <input className={`pf-input${tries && !name.trim() ? ' invalid' : ''}`} type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
                  <input className={`pf-input${tries && emailBad ? ' invalid' : ''}`} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input className={`pf-input${tries && phoneBad ? ' invalid' : ''}`} type="tel" inputMode="numeric" placeholder="Phone number" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
                  {tries > 0 && contactBad && <div className="pf-input-error">Enter your name, a valid email, and a 10-digit phone number.</div>}
                  <button type="submit" className="pf-btn pf-btn-block pf-btn-lg">See my results →</button>
                  <div className="pf-consent">By submitting, you agree to receive text messages from Newly Booked. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.</div>
                  <div className="pf-fineprint">No retainer pitch · No 12-month contract</div>
                </form>
              )}

              {step.trust && (
                <div className="pf-trust">
                  <div className="pf-trust-label">The system behind it</div>
                  <div className="pf-stats">
                    <div className="pf-stat"><span className="pf-stat-num">$7M+</span><span className="pf-stat-cap">package sales</span></div>
                    <div className="pf-stat"><span className="pf-stat-num">80%+</span><span className="pf-stat-cap">Cherry approval</span></div>
                    <div className="pf-stat"><span className="pf-stat-num">$0</span><span className="pf-stat-cap">retainer</span></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!submitting && !embedded && (
        <div className="pf-foot">
          <a href={nbUrl('__NB_TERMS_URL', 'terms.html')}>Terms</a>
          <span className="sep">·</span>
          <a href={nbUrl('__NB_PRIVACY_URL', 'privacy.html')}>Privacy</a>
        </div>
      )}
      <div className="pf-progress"><div className="pf-progress-bar" style={{ width: `${Math.max(progress, 4)}%` }}></div></div>
    </div>
  );
}

window.Funnel = Funnel;
