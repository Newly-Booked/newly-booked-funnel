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

// Normalize a string for matching: unify dash and curly-apostrophe variants,
// collapse whitespace, lowercase. Lets answer labels with em/en dashes (e.g.
// "Yes — Kybella / PCDC", "$10K – $30K") match the GHL radio option values.
function nbNorm(s) {
  return String(s || '')
    .replace(/[‒-―−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ').trim().toLowerCase();
}
// A GHL form field's visible label (custom fields get random input names, so
// we identify text fields by label instead of name).
function fieldLabel(form, input) {
  const l = input.id ? form.querySelector('label[for="' + input.id + '"]') : null;
  if (l) return (l.textContent || '').trim();
  const c = input.closest('label');
  return c ? (c.textContent || '').trim() : '';
}
// GHL renders SINGLE_OPTIONS custom fields as a vue-multiselect dropdown widget
// (class "multiselect"), not a native radio/<select>, and with NO hidden input —
// so setByName, the radio loop, and setSelect can't fill them. GHL also mounts
// each widget's option list LAZILY (the options only exist in the DOM once the
// dropdown is opened), so we must: open the widget → wait for its options to
// render → click the match. We do this one widget at a time, because opening the
// next one collapses the previous list. Each widget is matched by its field
// label (needles = lowercase substrings unique to that question). Async, so it
// calls onDone() when every job is finished (or skipped).
function findMultiselect(form, needles) {
  return Array.from(form.querySelectorAll('.multiselect')).find((b) => {
    if (b.__nbFilled) return false;
    const inp = b.querySelector('input');
    let label = '';
    if (inp && inp.id) { const l = form.querySelector('label[for="' + inp.id + '"]'); if (l) label = l.textContent || ''; }
    if (!label) { const w = b.closest('.form-field-wrapper, .form-field-container'); const l = w && w.querySelector('label'); if (l) label = l.textContent || ''; }
    label = label.toLowerCase();
    return needles.some((n) => label.indexOf(n) !== -1);
  });
}
function fillMultiselects(form, jobs, onDone) {
  let i = 0;
  const step = () => {
    if (i >= jobs.length) return onDone && onDone();
    const job = jobs[i++];
    const box = job.value ? findMultiselect(form, job.needles) : null;
    if (!box) return step();
    box.__nbFilled = true;
    const want = nbNorm(job.value);
    const inp = box.querySelector('input');
    const opener = box.querySelector('.multiselect__select') || box.querySelector('.multiselect__tags') || box;
    const open = () => {
      opener.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      if (inp) { try { inp.focus(); } catch (e) {} }
      opener.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    };
    open();
    let tries = 0;
    const pick = () => {
      const opts = Array.from(box.querySelectorAll('.multiselect__option'));
      let opt = opts.find((o) => nbNorm(o.textContent) === want);
      if (!opt) opt = opts.find((o) => { const t = nbNorm(o.textContent); return t && (t.indexOf(want) !== -1 || want.indexOf(t) !== -1); });
      if (opt) {
        // Different vue-multiselect builds bind select to mousedown OR click — fire both.
        opt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        opt.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return setTimeout(step, 70);
      }
      if (tries++ < 10) { if (tries % 3 === 0) open(); return setTimeout(pick, 70); }
      step();
    };
    setTimeout(pick, 50);
  };
  step();
}
// Fill a hidden GHL form (rendered in the same page DOM, custom class
// "nb-hidden-form") with the lead's data, then its submit creates the contact.
//   - Standard contact fields by input name.
//   - Radio custom fields (Owns Medspa, Physical Location, Top Treatment,
//     Monthly Revenue, Weekend Consults): GHL stores the option label as the
//     radio value, so click the radio whose value matches the answer. Answer
//     strings are unique across questions, so there is no ambiguity.
//   - Text custom fields (Years in Business, Company Business Name): GHL gives
//     these random input names, so match them by their visible label.
function fillGhlForm(form, d, onComplete) {
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

  // Radio custom fields: select the option whose value matches the answer.
  // GHL hides the real <input> and styles a label, and its form engine tracks
  // its own state — so click the label (what a human clicks) AND fire
  // input/change so the framework registers the choice, not just the DOM.
  // Tenure: the funnel's buckets are finer than the GHL "Business Experience"
  // radio (which tops out at "More than 3 years"), so collapse 3–5 / 5+ onto it
  // so the radio registers. "Under 1 year" disqualifies and never reaches here.
  // (If the field is switched to Text, setByLabel below writes the exact bucket.)
  const tenureRadio = { '3 - 5 years': 'More than 3 years', '5+ years': 'More than 3 years' }[nbNorm(d.tenure)] || d.tenure;
  const radios = Array.from(form.querySelectorAll('input[type="radio"]'));
  [d.own, d.location, d.treatment, d.revenue, d.frisat, tenureRadio, d.sales, d.ads].forEach((val) => {
    if (!val) return;
    const nv = nbNorm(val);
    const r = radios.find((x) => nbNorm(x.value) === nv || nbNorm(fieldLabel(form, x)) === nv);
    if (r && !r.checked) {
      const lbl = r.closest('label') || (r.id && form.querySelector('label[for="' + r.id + '"]'));
      (lbl || r).click();
      if (!r.checked) r.click();
      r.dispatchEvent(new Event('input', { bubbles: true }));
      r.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Custom fields with random input names → match by the GHL field label, and
  // as a fallback by the input's name/id/placeholder (which often carry the
  // field slug, e.g. "what_markets_is_your_clinic_located_in").
  const setByLabel = (labelText, v) => {
    if (v == null) return;
    // Accept one substring or several alternatives — a field can be labeled more
    // than one way (e.g. tenure as "Years in Business" under the old key, or the
    // quiz wording "How long has your medspa been in business" under the new
    // how_long key) — so match if ANY alternative appears.
    const alts = (Array.isArray(labelText) ? labelText : [labelText]).map((s) => s.toLowerCase());
    const skip = ['first_name', 'last_name', 'full_name', 'name'];
    const hay = (i) => (fieldLabel(form, i) + ' ' + (i.name || '') + ' ' + (i.id || '') + ' ' + (i.placeholder || '')).toLowerCase();
    const match = Array.from(form.querySelectorAll('input[type="text"], textarea'))
      .find((i) => skip.indexOf(i.name) === -1 && !i.closest('.multiselect') && alts.some((a) => hay(i).indexOf(a) !== -1));
    if (match) setNativeInputValue(match, v);
  };
  // Native <select> dropdown custom fields → set the matching option by label.
  const setSelect = (labelText, v) => {
    if (!v) return;
    const alts = (Array.isArray(labelText) ? labelText : [labelText]).map((s) => s.toLowerCase());
    const want = nbNorm(v);
    const sel = Array.from(form.querySelectorAll('select')).find((s) => { const fl = fieldLabel(form, s).toLowerCase(); return alts.some((a) => fl.indexOf(a) !== -1); });
    if (!sel) return;
    const opt = Array.from(sel.options).find((o) => nbNorm(o.value) === want || nbNorm(o.textContent) === want);
    if (opt) setNativeInputValue(sel, opt.value);
  };
  // For each quiz answer, also try a dropdown and a text field by the GHL field
  // label, so it fills whatever type the field is (radios are handled above).
  const fillAny = (labelText, v) => { setSelect(labelText, v); setByLabel(labelText, v); };
  fillAny('priced at', d.own);
  fillAny('before we move forward', d.location);
  fillAny('kybella', d.treatment);
  fillAny('fridays', d.frisat);
  // Revenue is now a Text field keyed current_monthly_revenue ("Monthly Revenue"),
  // older copies were labeled "...per month" — match either.
  fillAny(['revenue', 'per month'], d.revenue);
  fillAny('sales abilities', d.sales);
  fillAny('run ads', d.ads);
  // Tenure text field. Verified display name is "Business Experience" (key
  // how_long_has_your_medspa_been_in_business); older copies were labeled
  // "Years in Business" / the quiz wording — match any of them. Funnel writes the
  // bucket string ("3 – 5 years") as free text, so the field MUST be Text: its
  // GHL radio options ("Just opened / 6-12 months / ...") don't match our buckets.
  setByLabel(['business experience', 'years in business', 'been in business', 'how long'], d.tenure);
  setByLabel('business name', d.business);
  setByLabel('market', d.city);
  // City / State: the funnel stores "City, ST" (e.g. "Austin, TX"). Split it
  // across the form's City and State fields, matched by name and by label so it
  // works for standalone City/State fields or the GHL Address widget's sub-fields.
  const cs = (d.city || '').trim();
  const ci = cs.lastIndexOf(',');
  const cityPart = ci > -1 ? cs.slice(0, ci).trim() : cs;
  const statePart = ci > -1 ? cs.slice(ci + 1).trim() : '';
  setByName('city', cityPart); setByLabel('city', cityPart);
  if (statePart) { setByName('state', statePart); setByLabel('state', statePart); }

  // Consent checkboxes
  form.querySelectorAll('input[type="checkbox"]').forEach((cb) => { if (!cb.checked) cb.click(); });

  // GHL single-option dropdowns (vue-multiselect) — Treatment, Weekend, Sales.
  // Done last and asynchronously (they open/render lazily); fire onComplete when
  // every one is selected so the caller submits only after they're filled.
  fillMultiselects(form, [
    { needles: ['kybella'], value: d.treatment },
    { needles: ['fridays'], value: d.frisat },
    { needles: ['sales abilities'], value: d.sales },
  ], onComplete);
}

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
    prompt: 'Do you own a medspa or aesthetic clinic with high-end devices and treatment plans priced at $1,000+?',
    options: [
      { v: 'yes', label: 'Yes, we can inject those treatments', icon: 'check' },
      { v: 'no', label: "No, I'm going to leave this page immediately", icon: 'x', dq: true },
    ],
  },
  {
    id: 'location', kind: 'choices', key: 'location', cols: 1,
    q: 'Can you confirm your business is a medical spa or aesthetic clinic with a physical location?',
    options: [
      { v: 'yes', label: 'Yes, I own a medical spa with a physical location (suite or storefront)' },
      { v: 'no-loc', label: "I don't operate out of a physical location", dq: true },
      { v: 'not-open', label: "I haven't opened yet", dq: true },
      { v: 'not-medspa', label: "I'm not a medical spa or an aesthetic clinic", dq: true },
    ],
  },
  {
    id: 'treatment', kind: 'choices', key: 'treatment', cols: 1,
    q: 'Do you own a medical spa or aesthetic clinic that currently offers fat-reduction treatments like Kybella or PCDC (Liquid Lipo)?',
    options: [
      { v: 'yes', label: 'Yes, we already offer it' },
      { v: 'open', label: 'No, BUT we have injectors and are open to offer it, if it makes sense' },
      { v: 'no', label: "No, and we can't or do not plan on offering it", dq: true },
    ],
  },
  {
    id: 'revenue', kind: 'choices', key: 'revenue', cols: 2,
    q: 'What does your spa currently bring in per month?',
    options: [
      { v: '<10', label: 'Under $10K', dq: true },
      { v: '10-30', label: '$10K – $30K' },
      { v: '30-100', label: '$30K – $100K' },
      { v: '100+', label: '$100K+' },
    ],
  },
  {
    id: 'frisat', kind: 'choices', key: 'frisat', cols: 1,
    q: '55% of sales happen Friday & Saturday. Are you willing to take consultations on those days every week?',
    sub: 'This program has generated over $5.3M for our spas, and the weekend is the biggest revenue window.',
    options: [
      { v: 'yes', label: 'Yes, I am ready to do whatever it takes to grow my business' },
      { v: 'no', label: 'No, I am not willing to make Fridays and Saturdays available for consultations', dq: true },
    ],
  },
  {
    id: 'tenure', kind: 'choices', key: 'tenure', cols: 2,
    q: 'How long has your medspa been in business?',
    options: [
      { v: '<1', label: 'Under 1 year', dq: true },
      { v: '1-3', label: '1 – 3 years' },
      { v: '3-5', label: '3 – 5 years' },
      { v: '5+', label: '5+ years' },
    ],
  },
  {
    id: 'sales', kind: 'choices', key: 'sales', cols: 1,
    q: 'How confident are you in your sales abilities?',
    sub: 'Sales experience is the common thread among our most successful spas.',
    options: [
      { v: 'experienced', label: 'I have prior sales experience or already sell 4-figure packages at my spa. I just need more appointments/opportunities.' },
      { v: 'natural', label: "I am charismatic and a natural hustler. Just tell me what to say and I'll sell it till the cows come home" },
      { v: 'not-sales', label: "I wouldn't consider myself a sales person" },
      { v: 'dislike', label: "I don't like the idea of having to actively sell patients into 4-figure treatment plans" },
    ],
  },
  {
    id: 'ads', kind: 'choices', key: 'ads', cols: 1,
    q: 'Have you worked with an agency or run ads before?',
    options: [
      { v: 'yes', label: 'Yes' },
      { v: 'no', label: 'No' },
      { v: 'never', label: "No, I've never tried any forms of paid marketing" },
    ],
  },
  {
    id: 'city', kind: 'autocomplete', key: 'city',
    q: 'Where is your medspa located?',
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
  const [tries, setTries] = useState(0);
  const [submitting, setSubmitting] = useState(false);
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
    setSubmitting(true);

    // Persist contact info so the schedule page can prefill the iClosed popup.
    // The GHL hidden-form redirect doesn't carry URL params, so localStorage is
    // the only thing that survives the hop to the schedule page.
    try {
      localStorage.setItem('nb_name', name.trim());
      localStorage.setItem('nb_email', email.trim());
      localStorage.setItem('nb_phone', phone.trim());
    } catch (e) {}

    const dq = isDisqualified(answers);

    // Qualified + a hidden GHL form on the page ("nb-hidden-form" element
    // dropped on the GHL funnel page) → fill it and click its submit. GHL
    // creates the contact and runs the form's On-Submit redirect to the
    // schedule page. DQ leads skip this and go to the DQ page below (the funnel
    // owns the disqualify decision).
    const ghlForm = document.querySelector('.nb-hidden-form');
    if (ghlForm && !dq) {
      // The vue-multiselect dropdowns fill asynchronously (open → render → click),
      // so submit only AFTER fillGhlForm signals it's done — with a 2.5s fallback
      // in case that chain stalls. The guard keeps it to a single submit.
      let submitted = false;
      const doSubmit = () => {
        if (submitted) return;
        submitted = true;
        const btn = ghlForm.querySelector('button[type="submit"]') || ghlForm.querySelector('button');
        if (btn) btn.click();
      };
      fillGhlForm(ghlForm, {
        name: name.trim(), email: email.trim(), phone: phone.trim(),
        city: (answers.city || '').trim(),
        own: labelFor('own', answers.own),
        location: labelFor('location', answers.location),
        treatment: labelFor('treatment', answers.treatment),
        revenue: labelFor('revenue', answers.revenue),
        frisat: labelFor('frisat', answers.frisat),
        tenure: labelFor('tenure', answers.tenure),
        sales: labelFor('sales', answers.sales),
        ads: labelFor('ads', answers.ads),
        business: (answers.business || '').trim(),
      }, () => setTimeout(doSubmit, 120));
      setTimeout(doSubmit, 2500);
      return;
    }

    // Otherwise: push the full lead to GHL via webhook (if __NB_GHL_WEBHOOK is
    // set) and redirect ourselves. Covers DQ leads and any page (e.g. the
    // standalone repo build) that has no hidden GHL form.
    const lead = {
      name: name.trim(), email: email.trim(), phone: phone.trim(),
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
      name: name.trim(), email: email.trim(), phone: phone.trim(),
      business: (answers.business || '').trim(), city: (answers.city || '').trim(),
    });
    if (dq) params.set('status', 'dq');
    const dest = dq
      ? nbUrl('__NB_DQ_URL', 'https://newlybooked.com/dq')
      : nbUrl('__NB_SCHEDULE_URL', 'https://newlybooked.com/schedule-822049');
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
                  <input className={`pf-input${tries && phoneBad ? ' invalid' : ''}`} type="tel" inputMode="numeric" placeholder="Phone number" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
                  {tries > 0 && contactBad && <div className="pf-input-error">Enter your name, a valid email, and a 10-digit phone number.</div>}
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
          <a href={nbUrl('__NB_TERMS_URL', 'terms.html')} target="_blank" rel="noopener noreferrer">Terms</a>
          <span className="sep">·</span>
          <a href={nbUrl('__NB_PRIVACY_URL', 'privacy.html')} target="_blank" rel="noopener noreferrer">Privacy</a>
        </div>
      )}
      <div className="pf-progress"><div className="pf-progress-bar" style={{ width: `${Math.max(progress, 4)}%` }}></div></div>
    </div>
  );
}

window.Funnel = Funnel;
