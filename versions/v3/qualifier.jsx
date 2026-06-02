// Qualifier — inline 5-step. Mirrors original 5 questions.

// React's input wrapper stores value in framework state; setting input.value
// directly is ignored. Use the native setter then dispatch the input/change
// events so the framework picks up the new value.
function setNativeInputValue(input, value) {
  const proto = input.tagName === 'TEXTAREA'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value');
  if (setter && setter.set) setter.set.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

// Phone helpers — strip everything that's not a digit, format as (xxx) xxx-xxxx
// as the lead types, and call a 10-digit string valid (US-style).
function phoneDigits(raw) {
  return String(raw || '').replace(/\D/g, '');
}
function formatPhone(raw) {
  const d = phoneDigits(raw).slice(0, 10);
  if (d.length === 0) return '';
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
function isValidPhone(raw) {
  return phoneDigits(raw).length === 10;
}

const QUALIFIER_STEPS = [
  {
    key: 'owner',
    q: 'Do you own a medspa or aesthetic clinic with treatment plans priced at $1,000+?',
    type: 'choice',
    opts: [
      { v: 'yes', label: 'Yes — I own a medspa with high-ticket packages' },
      { v: 'no', label: "No — I don't own one, or my packages are under $1,000" },
    ],
    fail: (v) => v === 'no',
    failMsg: 'This isn\'t for you. We only work with owner-operated medspas selling packages priced $1,000 or more.',
  },
  {
    key: 'revenue',
    q: 'What\'s your approximate monthly revenue today?',
    type: 'choice',
    opts: [
      { v: '<10', label: 'Under $10K / month' },
      { v: '10-30', label: '$10K – $30K / month' },
      { v: '30-50', label: '$30K – $50K / month' },
      { v: '50-100', label: '$50K – $100K / month' },
      { v: '100-200', label: '$100K – $200K / month' },
      { v: '200+', label: '$200K+ / month' },
    ],
    fail: (v) => v === '<10' || v === '10-30',
    failMsg: 'This isn\'t for you yet. We work best with spas already doing $30K+/month — there needs to be enough patient flow for our system to plug into.',
  },
  {
    key: 'city',
    q: 'What city or metro is your spa in?',
    type: 'text',
    placeholder: 'e.g. Plano, TX',
  },
  {
    key: 'treatment',
    q: 'What does your top-selling treatment look like?',
    type: 'choice',
    opts: [
      { v: 'inj', label: 'Injectables (Botox, filler, Kybella)' },
      { v: 'body', label: 'Body / fat loss / contouring' },
      { v: 'laser', label: 'Laser / skin (IPL, microneedling)' },
      { v: 'wellness', label: 'Wellness / weight loss (semaglutide, IV)' },
      { v: 'mix', label: 'Mix of all of the above' },
    ],
  },
  {
    key: 'contact',
    q: 'You qualify. Where should we send your diagnostic invitation?',
    type: 'contact',
  },
];

function Qualifier({ accent }) {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [disqualified, setDisqualified] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [textVal, setTextVal] = React.useState('');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');

  const current = QUALIFIER_STEPS[step];
  const total = QUALIFIER_STEPS.length;

  const choose = (v, opt) => {
    const next = { ...answers, [current.key]: v };
    setAnswers(next);
    if (current.fail && current.fail(v)) {
      setDisqualified(true);
      return;
    }
    if (step < total - 1) setStep(step + 1);
  };

  const submitText = (e) => {
    e.preventDefault();
    if (!textVal.trim()) return;
    setAnswers({ ...answers, [current.key]: textVal.trim() });
    setTextVal('');
    setStep(step + 1);
  };

  // Human-readable label lookup from QUALIFIER_STEPS opts, so GHL receives
  // "$50K – $100K / month" instead of the internal code "50-100".
  const labelFor = (stepKey, value) => {
    const step = QUALIFIER_STEPS.find((s) => s.key === stepKey);
    if (!step || !step.opts) return value;
    const opt = step.opts.find((o) => o.v === value);
    return opt ? opt.label : value;
  };

  const submitContact = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !isValidPhone(phone)) return;
    const all = { ...answers, name, email, phone };
    setAnswers(all);

    // If a hidden GHL form is on the page (the setup we use inside a GHL
    // funnel), fill it programmatically and click its native submit so GHL
    // handles captcha + contact creation + redirect. Otherwise fall back to
    // the URL-param redirect used on GitHub Pages / local dev.
    // GHL renders form elements as DIVs (not native <form>), so use the
    // custom-classed wrapper directly as the root for all queries.
    const ghlForm = document.querySelector('.nb-hidden-form');

    if (ghlForm) {
      const fullName = name.trim();
      const parts = fullName.split(/\s+/);
      const firstName = parts.shift() || '';
      const lastName = parts.join(' ');

      const setByName = (n, v) => {
        const inp = ghlForm.querySelector(`input[name="${n}"]`);
        if (inp && v != null) setNativeInputValue(inp, v);
      };
      // GHL forms expose the lead's name as either first_name + last_name OR
      // a single full_name field, depending on which element was dropped on
      // the form. Fill whichever exists; setByName silently no-ops on the
      // others.
      setByName('first_name', firstName);
      setByName('last_name', lastName);
      setByName('full_name', fullName);
      setByName('name', fullName);
      setByName('email', email.trim());
      setByName('phone', phone.trim());
      setByName('city', all.city || '');

      // Custom fields don't have stable names. They are the text inputs
      // that aren't one of the standard GHL fields. Match them by position
      // (form-builder order): 0 = revenue, 1 = treatment.
      const knownNames = ['first_name', 'last_name', 'full_name', 'name',
        'phone', 'email', 'email1',
        'address1', 'address', 'street_address',
        'city', 'state', 'country', 'postal_code', 'postalCode', 'Search'];
      const customInputs = Array.from(ghlForm.querySelectorAll('input[type="text"]'))
        .filter((i) => !knownNames.includes(i.name));
      if (customInputs[0]) setNativeInputValue(customInputs[0], labelFor('revenue', all.revenue));
      if (customInputs[1]) setNativeInputValue(customInputs[1], labelFor('treatment', all.treatment));

      // Consent checkboxes need a real click event for the framework's
      // change handler to run; setting .checked = true is silently ignored.
      ghlForm.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        if (!cb.checked) cb.click();
      });

      // Give the framework a moment to register the writes, then submit.
      // GHL's form handles the redirect via its On Submit Action.
      setTimeout(() => {
        const submitBtn = ghlForm.querySelector('button[type="submit"]') || ghlForm.querySelector('button');
        if (submitBtn) submitBtn.click();
      }, 200);
      return;
    }

    // Fallback: direct redirect (GitHub Pages, local dev, no GHL form on page).
    const params = new URLSearchParams({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: all.city || '',
      revenue: all.revenue || '',
      treatment: all.treatment || '',
    });
    const base = window.nbUrl('__NB_SCHEDULE_URL', 'schedule.html');
    window.location.href = `${base}${base.includes('?') ? '&' : '?'}${params.toString()}`;
  };

  const goBack = () => {
    if (disqualified) {
      setDisqualified(false);
      return;
    }
    if (step > 0) setStep(step - 1);
  };

  const restart = () => {
    setDisqualified(false);
    setStep(Math.max(0, step - 1));
  };

  if (done) {
    return (
      <div className="qualifier-card" id="qualify">
        <div className="qualifier-head">
          <div>
            <div className="label">Qualified</div>
            <div className="step" style={{ marginTop: 6 }}>Step {total} of {total}</div>
          </div>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--gold-400)', letterSpacing: '0.1em' }}>✓ APPROVED</div>
        </div>
        <div className="qualifier-q" style={{ marginBottom: 8 }}>You're in. We'll reach out within one business day.</div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'var(--navy-200)', lineHeight: 1.6, marginBottom: 22 }}>
          Check your email for the diagnostic invitation. We'll review your numbers and book a 45-minute call — no pitch on the line.
        </p>
        <div className="qualifier-success">
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--gold-400)', letterSpacing: '0.12em', marginBottom: 8 }}>NEXT STEP</div>
          <div style={{ fontFamily: 'Source Serif 4, Georgia, serif', fontSize: 18, lineHeight: 1.3 }}>
            We'll send a calendar link to <b style={{ color: 'var(--gold-400)' }}>{email}</b> within 24 hours.
          </div>
        </div>
        <div className="qualifier-fineprint">No retainer pitch · No 12-month contract · No call back from a setter</div>
      </div>
    );
  }

  if (disqualified) {
    return (
      <div className="qualifier-card" id="qualify">
        <div className="qualifier-head">
          <div>
            <div className="label">Not a fit</div>
            <div className="step" style={{ marginTop: 6 }}>We won't waste your time</div>
          </div>
        </div>
        <div className="qualifier-q">Honest answer first.</div>
        <div className="disqualified">
          {current.failMsg}
        </div>
        <div className="qualifier-foot">
          <button className="qualifier-back" onClick={restart}>← Change my answer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="qualifier-card" id="qualify">
      <div className="qualifier-head">
        <div>
          <div className="label">60-second qualifier</div>
          <div className="step" style={{ marginTop: 6 }}>Step {step + 1} of {total} · See if your area is open</div>
        </div>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--gold-400)', letterSpacing: '0.1em' }}>NB · 01</div>
      </div>
      <div className="qualifier-progress">
        {QUALIFIER_STEPS.map((_, i) => (
          <div key={i} className={`seg${i <= step ? ' on' : ''}`}></div>
        ))}
      </div>
      <div style={{ height: 22 }}></div>
      <div className="qualifier-q">{current.q}</div>

      {current.type === 'choice' && (
        <div className="qualifier-options">
          {current.opts.map((o) => (
            <button key={o.v} className="qualifier-opt" onClick={() => choose(o.v, o)}>
              <span>{o.label}</span>
              <span className="arr">→</span>
            </button>
          ))}
        </div>
      )}

      {current.type === 'text' && (
        <form onSubmit={submitText} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="qualifier-input"
            type="text"
            placeholder={current.placeholder}
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-gold btn-block">Continue →</button>
        </form>
      )}

      {current.type === 'contact' && (
        <form onSubmit={submitContact} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input className="qualifier-input" type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="qualifier-input" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className={`qualifier-input${phone && !isValidPhone(phone) ? ' invalid' : ''}`}
            type="tel"
            inputMode="numeric"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
          />
          {phone && !isValidPhone(phone) && (
            <div className="qualifier-input-error">Please enter a 10-digit phone number.</div>
          )}
          <button type="submit" className="btn btn-gold btn-block btn-lg" disabled={!isValidPhone(phone)}>Book my free diagnostic →</button>
          <div className="qualifier-consent-note">
            By clicking <b>Book my free diagnostic</b>, you agree to receive text messages from Newly Booked about programs and updates. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.
          </div>
          <div className="qualifier-fineprint">No retainer pitch · No 12-month contract · No setter callback</div>
        </form>
      )}

      <div className="qualifier-foot">
        {step > 0 ? (
          <button className="qualifier-back" onClick={goBack}>← Back</button>
        ) : <span></span>}
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--navy-300)', letterSpacing: '0.1em' }}>SECURE</span>
      </div>
    </div>
  );
}

window.Qualifier = Qualifier;
