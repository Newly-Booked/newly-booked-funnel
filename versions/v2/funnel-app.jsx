// Newly Booked — Perspective-style funnel (v2).
// Full-screen, one question per screen, tappable cards auto-advance.
// Every lead completes the funnel; on the final step we evaluate the
// disqualifier rules and route to the DQ page or the schedule page.

const { useState, useEffect, useRef } = React;

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

// React stores input values in framework state; setting input.value directly
// is ignored. Use the native setter then fire input/change so the framework
// (GHL's form) picks it up.
function setNativeInputValue(input, value) {
  const proto = input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value');
  if (setter && setter.set) setter.set.call(input, value); else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

// Fill a hidden GHL form (rendered in the same page DOM, custom class
// "nb-hidden-form") with the lead's data. Standard fields go by name; the
// remaining single-line text inputs are custom fields, filled by builder
// order. Create the 7 custom fields in this exact order on the GHL form:
//   1 Owns medspa · 2 Physical location · 3 Top treatment · 4 Monthly revenue
//   5 Weekend consults · 6 Years in business · 7 Business name
const NB_CUSTOM_ORDER = ['own', 'location', 'treatment', 'revenue', 'frisat', 'tenure', 'business'];
function fillGhlForm(form, d) {
  const setByName = (n, v) => { const i = form.querySelector('input[name="' + n + '"]'); if (i && v != null) setNativeInputValue(i, v); };
  const parts = (d.name || '').trim().split(/\s+/);
  const first = parts.shift() || '';
  const last = parts.join(' ');
  setByName('first_name', first);
  setByName('last_name', last);
  setByName('full_name', d.name);
  setByName('name', d.name);
  setByName('email', d.email);
  setByName('phone', d.phone);
  setByName('city', d.city);
  const known = ['first_name','last_name','full_name','name','phone','email','email1','address1','address','street_address','city','state','country','postal_code','postalCode','Search'];
  const custom = Array.from(form.querySelectorAll('input[type="text"]')).filter((i) => known.indexOf(i.name) === -1);
  NB_CUSTOM_ORDER.forEach((k, idx) => { if (custom[idx]) setNativeInputValue(custom[idx], d[k] || ''); });
  form.querySelectorAll('input[type="checkbox"]').forEach((cb) => { if (!cb.checked) cb.click(); });
}

function phoneDigits(raw) { return String(raw || '').replace(/\D/g, ''); }
function isValidEmail(raw) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(raw).trim()); }

// Load intl-tel-input (flag + dial-code phone widget) on demand. The GHL
// landing page may not include it, so the funnel pulls its own copy — no
// re-paste needed. Resolves once window.intlTelInput is ready (or load failed).
let itiLoading = null;
function ensureIti(cb) {
  if (window.intlTelInput) return cb();
  if (!itiLoading) {
    itiLoading = new Promise((resolve) => {
      const base = 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/';
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = base + 'css/intlTelInput.css';
      document.head.appendChild(link);
      const s = document.createElement('script');
      s.src = base + 'js/intlTelInput.min.js';
      s.onload = resolve; s.onerror = resolve;
      document.head.appendChild(s);
    });
  }
  itiLoading.then(cb);
}

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
    q: 'Last step — then pick your time.',
    sub: 'Add your details and we’ll take you straight to the calendar to lock in your call.',
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

function Funnel({ embedded } = {}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [picked, setPicked] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const phoneRef = useRef(null);
  const itiRef = useRef(null);
  const [tries, setTries] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [otherMode, setOtherMode] = useState(false);
  const [showCity, setShowCity] = useState(false);
  useEffect(() => { setOtherMode(false); setShowCity(false); }, [idx]);
  // Warm the phone widget early so it's ready by the time the contact step shows.
  useEffect(() => { ensureIti(() => {}); }, []);

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

  // International phone input on the contact step: flag + dial-code dropdown
  // (the library iClosed uses). Build the E.164 number from the selected
  // country's dial code + typed digits, so no utils module is needed. Falls
  // back to a plain US tel input if the library didn't load.
  const onContactStep = step.kind === 'contact';
  useEffect(() => {
    const el = phoneRef.current;
    if (!onContactStep || !el) return;
    let iti = null;
    let destroyed = false;
    const sync = () => {
      const nat = phoneDigits(el.value);
      const dial = iti ? (iti.getSelectedCountryData().dialCode || '1') : '1';
      setPhone(nat ? '+' + dial + nat : '');
      setPhoneValid(nat.length >= (dial === '1' ? 10 : 7));
    };
    ensureIti(() => {
      if (destroyed || !phoneRef.current) return;
      if (window.intlTelInput) {
        iti = window.intlTelInput(el, { initialCountry: 'us', separateDialCode: true, countryOrder: ['us', 'ca', 'gb', 'au'] });
        itiRef.current = iti;
      }
      el.addEventListener('input', sync);
      el.addEventListener('countrychange', sync);
      sync();
    });
    return () => {
      destroyed = true;
      el.removeEventListener('input', sync);
      el.removeEventListener('countrychange', sync);
      if (iti) { try { iti.destroy(); } catch (e) {} }
      itiRef.current = null;
    };
  }, [onContactStep]);

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
  const phoneBad = !phoneValid;
  const contactBad = !name.trim() || emailBad || phoneBad;

  const submit = () => {
    setTries((t) => t + 1);
    if (contactBad) return;
    setSubmitting(true);

    // Read the freshest phone straight from the widget (synced state can lag the
    // last keystroke) as E.164: + dial code + typed digits.
    let phoneOut = phone.trim();
    if (itiRef.current && phoneRef.current) {
      const nat = phoneDigits(phoneRef.current.value);
      if (nat) phoneOut = '+' + (itiRef.current.getSelectedCountryData().dialCode || '1') + nat;
    }

    // Persist contact info so the schedule page can prefill the iClosed popup.
    // The GHL hidden-form redirect doesn't carry URL params, so localStorage is
    // the only thing that survives the hop to the schedule page.
    try {
      localStorage.setItem('nb_name', name.trim());
      localStorage.setItem('nb_email', email.trim());
      localStorage.setItem('nb_phone', phoneOut);
    } catch (e) {}

    const dq = isDisqualified(answers);

    // Qualified + a hidden GHL form on the page ("nb-hidden-form" element
    // dropped on the GHL funnel page) → fill it and click its submit. GHL
    // creates the contact and runs the form's On-Submit redirect to the
    // schedule page. DQ leads skip this and go to the DQ page below.
    const ghlForm = document.querySelector('.nb-hidden-form');
    if (ghlForm && !dq) {
      fillGhlForm(ghlForm, {
        name: name.trim(), email: email.trim(), phone: phoneOut,
        city: (answers.city || '').trim(),
        own: labelFor('own', answers.own),
        location: labelFor('location', answers.location),
        treatment: labelFor('treatment', answers.treatment),
        revenue: labelFor('revenue', answers.revenue),
        frisat: labelFor('frisat', answers.frisat),
        tenure: labelFor('tenure', answers.tenure),
        business: (answers.business || '').trim(),
      });
      setTimeout(() => {
        const btn = ghlForm.querySelector('button[type="submit"]') || ghlForm.querySelector('button');
        if (btn) btn.click();
      }, 250);
      return;
    }

    // Otherwise: push the full lead to GHL via webhook (if __NB_GHL_WEBHOOK is
    // set) and redirect ourselves. Covers DQ leads and any page (e.g. the
    // standalone repo build) that has no hidden GHL form.
    const lead = {
      name: name.trim(), email: email.trim(), phone: phoneOut,
      business: (answers.business || '').trim(), city: (answers.city || '').trim(),
      owns_medspa: labelFor('own', answers.own),
      physical_location: labelFor('location', answers.location),
      fat_reduction: labelFor('treatment', answers.treatment),
      monthly_revenue: labelFor('revenue', answers.revenue),
      weekend_consults: labelFor('frisat', answers.frisat),
      years_in_business: labelFor('tenure', answers.tenure),
      status: dq ? 'disqualified' : 'qualified',
      source: 'Newly Booked funnel',
    };
    const hook = nbUrl('__NB_GHL_WEBHOOK', '');
    if (hook) {
      try {
        fetch(hook, {
          method: 'POST', mode: 'no-cors', keepalive: true,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(lead),
        });
      } catch (e) {}
    }

    // Disqualified → DQ page. Qualified → schedule page (page 2 of 3).
    const params = new URLSearchParams({
      name: name.trim(), email: email.trim(), phone: phoneOut,
      business: (answers.business || '').trim(), city: (answers.city || '').trim(),
    });
    if (dq) params.set('status', 'dq');
    const dest = dq ? nbUrl('__NB_DQ_URL', 'dq.html') : nbUrl('__NB_SCHEDULE_URL', 'schedule.html');
    setTimeout(() => {
      window.location.href = `${dest}${dest.includes('?') ? '&' : '?'}${params.toString()}`;
    }, 500);
  };

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
                  <div className="pf-phone">
                    <input ref={phoneRef} className={`pf-input${tries && phoneBad ? ' invalid' : ''}`} type="tel" placeholder="Phone number" />
                  </div>
                  {tries > 0 && contactBad && <div className="pf-input-error">Enter your name, a valid email, and a valid phone number.</div>}
                  <button type="submit" className="pf-btn pf-btn-block pf-btn-lg">See my times →</button>
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
