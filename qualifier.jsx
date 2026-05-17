// Qualifier — inline 5-step. Mirrors original 5 questions.
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

  const submitContact = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const all = { ...answers, name, email, phone };
    setAnswers(all);
    const params = new URLSearchParams({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: all.city || '',
      revenue: all.revenue || '',
      treatment: all.treatment || '',
    });
    window.location.href = `schedule.html?${params.toString()}`;
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
          <input className="qualifier-input" type="tel" placeholder="Mobile number (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button type="submit" className="btn btn-gold btn-block btn-lg">Book my free diagnostic →</button>
          <div className="qualifier-fineprint">No retainer pitch · No 12-month contract · No setter callback</div>
        </form>
      )}

      <div className="qualifier-foot">
        {step > 0 ? (
          <button className="qualifier-back" onClick={goBack}>← Back</button>
        ) : <span></span>}
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--navy-300)', letterSpacing: '0.1em' }}>SECURE · 256-BIT</span>
      </div>
    </div>
  );
}

window.Qualifier = Qualifier;
