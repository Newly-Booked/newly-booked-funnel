// Newly Booked — Perspective-style funnel (v2).
// Full-screen, one question per screen, tappable cards auto-advance.
// Every lead completes the funnel; on the final step we evaluate the
// disqualifier rules and route to the DQ page or the schedule page.

const { useState, useEffect } = React;

/* ── PostHog analytics — Newly Booked B2B funnel v2 (/apply). Project "B2B
   Acquisition Funnel" 481523. Loads from this file so a repo push ships it
   (no GHL re-paste). Session replay on, input VALUES masked. Idempotent guard
   composes with any other PostHog init on the page. Events mirror the existing
   Meta-pixel QuizStep hook (per-question drop-off), tagged version:'v2'. */
(function () {
  if (window.__nbPHInit) return;
  window.__nbPHInit = true;
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  window.posthog.init('phc_uC7ziZakJ7qhBZUbaqG88ZCorG3VCmzzFh3T5bQbo7k8', {
    api_host: 'https://us.i.posthog.com', ui_host: 'https://us.posthog.com',
    person_profiles: 'identified_only', capture_pageview: true, capture_pageleave: true,
    autocapture: true, session_recording: { maskAllInputs: true },
  });
})();
window.nbTrack = window.nbTrack || function (e, p) { try { if (window.posthog) window.posthog.capture(e, p || {}); } catch (x) {} };
window.nbIdentify = window.nbIdentify || function (i, p) { try { if (window.posthog && i) window.posthog.identify(String(i), p || {}); } catch (x) {} };

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
// collapse whitespace AND any spaces around a dash, lowercase. Lets answer labels
// match GHL option values regardless of dash style or spacing — e.g. the funnel's
// "1 – 3 years" / "$10K – $30K" match GHL's "1-3 years" / "$10K-$30K".
function nbNorm(s) {
  return String(s || '')
    .replace(/[‒-―−]/g, '-')
    .replace(/\s*-\s*/g, '-')
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
  // Tenure sends the raw bucket ("1 – 3 years" / "3 – 5 years" / "5+ years"),
  // which now match the GHL "Business Experience" radio options directly.
  const radios = Array.from(form.querySelectorAll('input[type="radio"]'));
  [d.own, d.location, d.treatment, d.revenue, d.frisat, d.tenure, d.sales, d.ads].forEach((val) => {
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
    // Skip empty too, not just null/undefined: removed steps (e.g. the dropped
    // "tenure" question) now resolve to '' via labelFor's `value || ''`, and we
    // never want to WRITE a blank into a live GHL text field — that would touch
    // (and on a resubmit/upsert, erase) the matching field. Matches the radio
    // loop's `if (!val) return` and setSelect's `if (!v) return`.
    if (v == null || v === '') return;
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
  // Landing / hero: just the headline + a big red "Check availability" button
  // (Byron/Ivan: replace the Yes/No injectable cards with a single CTA). The
  // injectable "Do you have an injector?" question is being reworked separately
  // per the call's Wistia walkthrough, so it is intentionally not here yet.
  {
    id: 'hero', kind: 'intro', big: true, trust: true,
    eyebrow: 'For medspa owners doing $50K+/month',
    rating: '4.9',
    q: 'Add $150K–$300K in new patient revenue without tire kickers or retainers.',
    hl: '$150K–$300K',
    sub: 'We take on 4 new spas a month, one medspa per area.',
    subStrong: 'See if yours is still open.',
    cta: 'Check availability',
  },
  // Q1 (carries the framing lead): monthly revenue — under $50K disqualifies.
  {
    id: 'revenue', kind: 'choices', key: 'revenue', cols: 2,
    lead: "Before we see if your area's open, let's answer a few quick questions.",
    q: 'What does your spa currently bring in per month?',
    options: [
      { v: '<15', label: 'Under $15K', dq: true },
      { v: '15-50', label: '$15K – $50K', dq: true },
      { v: '50-150', label: '$50K – $150K' },
      { v: '150-250', label: '$150K – $250K' },
      { v: '250+', label: '$250K & above' },
    ],
  },
  // Q2: injector on staff. "No" does NOT disqualify (Ivan) — it just skips the
  // offerings question below. id/key 'own' keeps the existing GHL injectables
  // field fill working ("Yes, we can inject those treatments").
  {
    id: 'own', kind: 'choices', key: 'own', cols: 2,
    // Answered in the exit-intent popup → don't ask twice. The marker is set
    // ONLY by the popup, so normal flow (and back-nav) is untouched.
    skipIf: (a) => !!a.exitOwn,
    q: 'Do you have an injector on staff?',
    options: [
      { v: 'yes', label: 'Yes', fill: 'Yes, we can inject those treatments' },
      { v: 'no', label: 'No', fill: 'No, we do not have an injector on staff' },
    ],
  },
  // Q3: current offerings — only shown when they HAVE an injector (skipped
  // otherwise). "No, but we have injectors" option dropped (Byron) since the
  // injector question above now covers that.
  {
    id: 'treatment', kind: 'choices', key: 'treatment', cols: 1,
    skipIf: (a) => a.own === 'no',
    q: 'Do you currently offer Kybella, PCDC, Liquid Lipo, or Lemon Bottle?',
    options: [
      { v: 'yes', label: 'Yes, we offer it', fill: 'Yes, we already offer it' },
      { v: 'no', label: "No, we don't currently", fill: "No, and we can't or do not plan on offering it" },
    ],
  },
  {
    id: 'frisat', kind: 'choices', key: 'frisat', cols: 1,
    q: '55% of sales happen Friday & Saturday. Are you willing to take consultations on those days every week?',
    sub: 'This program has generated over $8M for our spas, and the weekend is the biggest revenue window.',
    options: [
      { v: 'yes', label: 'Yes, I am ready to do whatever it takes to grow my business' },
      { v: 'no', label: 'No, I am not willing to make Fridays and Saturdays available for consultations', dq: true },
    ],
  },
  {
    id: 'sales', kind: 'choices', key: 'sales', cols: 1,
    q: 'How confident are you in your sales abilities?',
    sub: 'No wrong answer here. Every owner gets trained on the exact script our top spas close with.',
    options: [
      { v: 'very', label: 'Very confident' },
      { v: 'somewhat', label: 'Somewhat confident' },
      { v: 'dislike', label: "I don't like to sell" },
    ],
  },
  {
    id: 'ads', kind: 'choices', key: 'ads', cols: 1,
    q: 'Have you worked with an agency or run ads before?',
    options: [
      { v: 'yes', label: 'Yes' },
      { v: 'no', label: 'No' },
    ],
  },
  {
    id: 'city', kind: 'autocomplete', key: 'city',
    q: 'What city or metro is your spa in?',
  },
  {
    id: 'business', kind: 'text', key: 'business',
    q: 'What’s the name of your business?',
    placeholder: 'Your business name',
  },
  {
    id: 'contact', kind: 'contact',
    q: 'Last step: add your details.',
    sub: 'We’ll check if you qualify and take you right to your available times.',
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
// Value sent to the GHL form for a chosen option. Prefer an option's `fill` (the
// exact text GHL's radio/dropdown matches on) so the visible `label` can be
// reworded freely without breaking the form fill. Falls back to `label`.
const labelFor = (stepId, value) => {
  const s = STEPS.find((x) => x.id === stepId);
  if (!s || !s.options) return value || '';
  const o = s.options.find((x) => x.v === value);
  return o ? (o.fill || o.label) : (value || '');
};

function Funnel({ embedded, inExitPopup, initialAnswers, initialIdx, onExit } = {}) {
  const NB_SRC = inExitPopup ? 'exit_popup' : 'page';
  const [idx, setIdx] = useState(initialIdx ?? 0);
  const [answers, setAnswers] = useState(initialAnswers ?? {});
  const [picked, setPicked] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tries, setTries] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [otherMode, setOtherMode] = useState(false);
  const [showCity, setShowCity] = useState(false);
  // Exit-intent popup: catches a leaver with the money question. The answer
  // seeds the funnel (revenue screen skipIf's itself; DQ rules still apply).
  const [exitOpen, setExitOpen] = useState(false);
  const [exitPicked, setExitPicked] = useState(null);
  // After the injector answer, the popup hosts the FULL quiz (an embedded
  // Funnel seeded with that answer) — the lead finishes everything, contact
  // step included, without leaving the modal.
  const [exitQuiz, setExitQuiz] = useState(null);
  useEffect(() => { setOtherMode(false); setShowCity(false); }, [idx]);

  // Fire a Meta Pixel event each time a step is shown, so per-question drop-off
  // appears in Events Manager (break down "QuizStep" by the `step` param) and you
  // can retarget people who started the quiz (fired QuizStep) but never converted.
  // Guarded by window.fbq — no-op anywhere the pixel isn't loaded.
  useEffect(() => {
    try {
      const s = STEPS[idx];
      if (s && typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackCustom', 'QuizStep', { step: idx + 1, step_name: s.id, total_steps: STEPS.length });
      }
    } catch (e) {}
    // PostHog: same per-question signal, for the drop-off funnel + session replay.
    try {
      const s = STEPS[idx];
      if (s && window.nbTrack) {
        window.nbTrack('qualifier_step_viewed', {
          step_index: idx, step_number: idx + 1, step_key: s.id, question: s.q,
          total_steps: STEPS.length, version: 'v2', source: NB_SRC,
        });
      }
    } catch (e) {}
  }, [idx]);

  // PostHog: fire once when the quiz mounts (entry to the funnel).
  useEffect(() => {
    try { if (window.nbTrack) window.nbTrack('qualifier_started', { total_steps: STEPS.length, version: 'v2', source: NB_SRC }); } catch (e) {}
  }, []);

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
  const counted = STEPS.filter((s) => QUESTION_KINDS.includes(s.kind) && !s.eyebrow && !(s.skipIf && s.skipIf(answers)));
  const qTotal = counted.length;
  const qNum = counted.indexOf(step) + 1;
  const progress = Math.round((idx / last) * 100);

  // Conditional steps: walk over any step whose skipIf(answers) is true (e.g. the
  // offerings question is skipped when they have no injector). Pass an explicit
  // answers snapshot so a just-picked answer is taken into account.
  const nextIndexFrom = (from, ans) => {
    let n = from + 1;
    while (n < STEPS.length && STEPS[n].skipIf && STEPS[n].skipIf(ans)) n++;
    return Math.min(n, last);
  };
  // Wherever the quiz starts (exit popup, or the in-card embed on the new
  // landing that skips the intro step), Back must never walk below that start —
  // it used to reach the hero screen INSIDE the modal. Page default (no
  // initialIdx) is unchanged: floor stays 0.
  const minIdx = initialIdx ?? 0;
  const prevIndexFrom = (from, ans) => {
    let n = from - 1;
    while (n > minIdx && STEPS[n].skipIf && STEPS[n].skipIf(ans)) n--;
    return Math.max(n, minIdx);
  };
  const goNext = () => setIdx((i) => nextIndexFrom(i, answers));
  const goBack = () => setIdx((i) => prevIndexFrom(i, answers));

  // Exit intent: fire once per session, only while the injector question is
  // still unanswered. Desktop signal = cursor leaving through the top of the
  // viewport. Mobile signal = the first Back press (we arm a history entry;
  // the popup absorbs that Back, a second Back really leaves).
  useEffect(() => {
    if (inExitPopup) return; // the popup's own quiz never re-arms the popup
    const fire = () => {
      if (sessionStorage.getItem('nbExitShown')) return false;
      if (submitting || answers.own != null) return false;
      sessionStorage.setItem('nbExitShown', '1');
      setExitOpen(true);
      try { if (window.fbq) window.fbq('trackCustom', 'ExitPopupShown', {}); } catch (e) {}
      try { if (window.nbTrack) window.nbTrack('exit_popup_shown', { step_index: idx, version: 'v2', source: NB_SRC }); } catch (e) {}
      return true;
    };
    const onMouseOut = (e) => { if (!e.relatedTarget && e.clientY <= 0) fire(); };
    document.addEventListener('mouseout', onMouseOut);
    // Mobile: arm one history entry and intercept the first Back press.
    const touch = 'ontouchstart' in window;
    const onPop = () => {
      if (fire()) {
        try { history.pushState({ nbExit: 1 }, ''); } catch (e) {} // stay on page
      } else {
        try { history.back(); } catch (e) {} // popup already had its shot — really leave
      }
    };
    // Phones give no exit signal beyond Back, so also fire after 30s of NO
    // interaction — a true IDLE timer. Any touch, scroll, or tap RESETS the
    // countdown, so a visitor who is reading, scrolling, or answering is never
    // interrupted mid-engagement; only someone genuinely parked for a quiet 30s
    // gets the popup. Still gated to the quiz's entry step (idx === minIdx):
    // once they advance past the first question the timer can never fire.
    let idleTimer;
    const armIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { if (idx === minIdx) fire(); }, 30000);
    };
    if (touch && !sessionStorage.getItem('nbExitShown')) {
      try { history.pushState({ nbExit: 1 }, ''); } catch (e) {}
      window.addEventListener('popstate', onPop);
      armIdle();
      window.addEventListener('touchstart', armIdle, { passive: true });
      window.addEventListener('scroll', armIdle, { passive: true });
      window.addEventListener('pointerdown', armIdle, { passive: true });
    }
    // manual trigger for QA (?exitpreview=1 auto-fires it after load)
    window.nbFireExitPopup = () => { sessionStorage.removeItem('nbExitShown'); fire(); };
    let t;
    if (/[?&]exitpreview=(1|quiz)/.test(window.location.search)) t = setTimeout(() => { window.nbFireExitPopup(); if (/exitpreview=quiz/.test(window.location.search)) setTimeout(() => { const b = document.querySelector('.pf-exit .pf-choice'); if (b) b.click(); }, 700); }, 1200);
    return () => {
      document.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('popstate', onPop);
      if (t) clearTimeout(t);
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener('touchstart', armIdle);
      window.removeEventListener('scroll', armIdle);
      window.removeEventListener('pointerdown', armIdle);
    };
  }, [submitting, answers.own, idx]);

  const exitDismiss = (how) => {
    setExitOpen(false);
    try { if (window.nbTrack) window.nbTrack('exit_popup_dismissed', { how, version: 'v2', source: NB_SRC }); } catch (e) {}
  };
  // Answering the popup's injector question = entering the quiz: record the
  // answer, mark the injector step to be skipped, and start the questions
  // exactly as if they pressed "Check availability".
  const exitPick = (opt) => {
    const seed = { own: opt.v, exitOwn: true };
    setExitPicked(opt.v);
    try { if (window.fbq) window.fbq('trackCustom', 'ExitPopupAnswered', { value: opt.v }); } catch (e) {}
    try { if (window.nbTrack) window.nbTrack('exit_popup_answered', { value: opt.v, label: opt.label, version: 'v2', source: NB_SRC }); } catch (e) {}
    try { if (window.nbTrack) window.nbTrack('qualifier_answered', { step_key: 'own', step_index: OWN_STEP, value: opt.v, label: opt.label, source: 'exit_popup', version: 'v2', source: NB_SRC }); } catch (e) {}
    setTimeout(() => {
      setExitPicked(null);
      // swap the WAIT screen for the full quiz, injector already answered —
      // it opens on the revenue question and runs through contact + submit.
      setExitQuiz({ answers: seed, startIdx: nextIndexFrom(0, seed) });
    }, 230);
  };

  const pick = (opt) => {
    const nextAns = step.key ? { ...answers, [step.key]: opt.v } : answers;
    if (step.key) setAnswers(nextAns);
    try { if (window.nbTrack) window.nbTrack('qualifier_answered', { step_key: step.id, step_index: idx, value: opt.v, label: opt.label, version: 'v2', source: NB_SRC }); } catch (e) {}
    setPicked(opt.v);
    setTimeout(() => { setPicked(null); setIdx(nextIndexFrom(idx, nextAns)); }, 230);
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
    // Which question disqualified them — drives the /dq page's tailored "why"
    // (passed as ?reason=) and the PostHog dq_step/value below.
    const dqStep = dq ? STEPS.find((s) => s.key && s.options && s.options.find((o) => o.v === answers[s.key] && o.dq)) : null;
    const dqReason = dqStep ? dqStep.id : '';

    // PostHog: identify the lead + fire the terminal event (disqualified vs
    // submitted) before the GHL submit/redirect so it sends first.
    try {
      if (window.nbIdentify) window.nbIdentify(email.trim(), {
        name: name.trim(), email: email.trim(), phone: phone.trim(),
        city: (answers.city || '').trim(), business: (answers.business || '').trim(),
        // Tag the PERSON with their outcome so any event can be segmented
        // qualified vs disqualified in PostHog.
        funnel_outcome: dq ? 'disqualified' : 'qualified',
      });
      // Everyone who reaches here COMPLETED the qualifier — a disqualified lead
      // answered every question and submitted, they just didn't qualify. They
      // fire qualifier_disqualified (not qualifier_submitted), so a funnel built
      // on "started -> submitted" miscounts them as a DROP-OFF when they're really
      // a filtered-out completion. Fire ONE qualifier_completed for every finisher,
      // tagged with `outcome`, so PostHog can tell abandoned vs disqualified vs
      // qualified apart. Keep the existing events so current funnels don't break.
      if (window.nbTrack) {
        window.nbTrack('qualifier_completed', {
          outcome: dq ? 'disqualified' : 'qualified',
          dq_step: dqStep ? dqStep.id : null,
          dq_value: dqStep ? answers[dqStep.key] : null,
          revenue: answers.revenue || '', city: (answers.city || '').trim(),
          version: 'v2', source: NB_SRC,
        });
        if (dq) {
          window.nbTrack('qualifier_disqualified', { step_key: dqStep ? dqStep.id : null, value: dqStep ? answers[dqStep.key] : null, version: 'v2', source: NB_SRC });
        } else {
          window.nbTrack('qualifier_submitted', {
            city: (answers.city || '').trim(), revenue: answers.revenue || '', treatment: answers.treatment || '', version: 'v2', source: NB_SRC,
          });
        }
      }
    } catch (e) {}

    // Consent record → n8n (fire-and-forget), BEFORE the lead-delivery branches:
    // the hidden-GHL-form paths below return early and must not skip this.
    // Submission-based consent — the CTA sits directly under the full disclosure
    // line, so the submit click itself is the consent act. The n8n side adds
    // IP + user-agent from the request headers and writes consent_logs_b2b.
    const consentHook = nbUrl('__NB_CONSENT_WEBHOOK', '');
    if (consentHook) {
      try {
        // Counsel's evidence requirements for submission-based consent:
        // a unique id per submission, and proof the disclosure was actually
        // rendered (in the DOM and laid out) on the page at the moment of
        // submit — not merely implied by the code version.
        const consentEl = document.querySelector('.pf-root .pf-consent');
        const submissionId = (window.crypto && window.crypto.randomUUID)
          ? window.crypto.randomUUID()
          : 'sub-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        fetch(consentHook, {
          method: 'POST', mode: 'no-cors', keepalive: true,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify({
            submission_id: submissionId,
            name: name.trim(), email: email.trim(), phone: phone.trim(),
            business: (answers.business || '').trim(), city: (answers.city || '').trim(),
            owns_medspa: labelFor('own', answers.own),
            physical_location: labelFor('location', answers.location),
            fat_reduction: labelFor('treatment', answers.treatment),
            monthly_revenue: labelFor('revenue', answers.revenue),
            weekend_consults: labelFor('frisat', answers.frisat),
            years_in_business: labelFor('tenure', answers.tenure),
            status: dq ? 'disqualified' : 'qualified',
            consent: {
              agreed: true, method: 'submit-click', text_version: 'nb-b2b-2026-07-24',
              disclosure_rendered: !!(consentEl && consentEl.offsetParent !== null),
            },
            page_url: window.location.pathname,
          }),
        });
      } catch (e) {}
    }

    // Qualified + a hidden GHL form on the page ("nb-hidden-form" element
    // dropped on the GHL funnel page) → fill it and click its submit. GHL
    // creates the contact and runs the form's On-Submit redirect to the
    // schedule page. DQ leads skip this and go to the DQ page below (the funnel
    // owns the disqualify decision).
    const ghlForm = document.querySelector('.nb-hidden-form');
    // Telemetry: a qualified lead with no hidden form to fill never reaches GHL
    // (no webhook configured) — they still book via iClosed, creating a contact
    // with no business name and no Submission row. Surface it so it's diagnosable.
    if (!ghlForm && !dq) { try { if (window.nbTrack) window.nbTrack('ghl_form_missing', { version: 'v2', source: NB_SRC }); } catch (e) {} }
    if (ghlForm && !dq) {
      // The vue-multiselect dropdowns fill asynchronously (open → render → click),
      // so submit only AFTER fillGhlForm signals it's done — with a 2.5s fallback
      // in case that chain stalls. The guard keeps it to a single submit.
      let submitted = false;
      // Safety net for the hop to the schedule page. GHL's own On-Submit redirect
      // normally carries the lead there within ~1-2s of the submit click and
      // navigates away before the timer below ever fires. But that redirect lives
      // in the GHL form settings — if it's ever removed or misconfigured, a
      // qualified lead would otherwise sit on the "Reviewing…" spinner forever.
      // This guarantees they still reach /schedule and can book (localStorage
      // already holds name/email/phone for the iClosed prefill).
      const goSchedule = () => {
        const params = new URLSearchParams({
          name: name.trim(), email: email.trim(), phone: phone.trim(),
          business: (answers.business || '').trim(), city: (answers.city || '').trim(),
        });
        const dest = nbUrl('__NB_SCHEDULE_URL', 'https://newlybooked.com/schedule-822049');
        window.location.href = `${dest}${dest.includes('?') ? '&' : '?'}${params.toString()}`;
      };
      const doSubmit = () => {
        if (submitted) return;
        submitted = true;
        // A leftover Required field the funnel doesn't fill (an old "physical
        // location" / "Business Experience" question, or a still-blank dropdown)
        // makes GHL silently REJECT the whole submit — the lead's business name +
        // answers are lost, yet they're still redirected to /schedule and book via
        // iClosed (a contact with no business name, no Submission row). We own this
        // hidden form and already collect name/email/phone, so drop stray required
        // flags (keep email/phone) so a forgotten question can't void the submit.
        try {
          ghlForm.querySelectorAll('[required],[aria-required="true"]').forEach((el) => {
            const t = (el.getAttribute('type') || '').toLowerCase();
            const n = (el.getAttribute('name') || '').toLowerCase();
            if (t === 'email' || t === 'tel' || n === 'email' || n === 'phone') return;
            el.removeAttribute('required'); el.removeAttribute('aria-required');
          });
        } catch (e) {}
        try { if (window.nbTrack) window.nbTrack('ghl_submit_attempt', { version: 'v2', source: NB_SRC }); } catch (e) {}
        const btn = ghlForm.querySelector('button[type="submit"]') || ghlForm.querySelector('button');
        if (btn) btn.click();
        setTimeout(goSchedule, 6000);
      };
      // Fallback submit if the async dropdown fill stalls. Set LONG (6s) and
      // cleared the moment fill completes, so the real onComplete-driven submit
      // (which waits for the vue-multiselect dropdowns) wins on a normal load.
      // Was 2.5s — that raced the ~2.5s dropdown fill and submitted half-filled
      // forms, leaving Sales/Treatment/Fri-Sat blank. (Best fix is GHL-side: make
      // those fields Radio, not Dropdown — then they fill synchronously, no race.)
      const fillTimer = setTimeout(doSubmit, 6000);
      try {
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
        }, () => { clearTimeout(fillTimer); setTimeout(doSubmit, 120); });
      } catch (e) {
        try { if (window.nbTrack) window.nbTrack('ghl_fill_error', { message: String((e && e.message) || e), version: 'v2', source: NB_SRC }); } catch (_) {}
      }
      return;
    }

    // DQ leads: if a dedicated DQ-capture form ("nb-hidden-form-dq") is on the
    // page, fill + submit it so the lead still becomes a GHL contact (tag it
    // "Disqualified" in GHL and point that form's On-Submit redirect at /dq).
    // Same mechanics as the qualified form above; with no DQ form present it
    // falls through to the webhook/redirect below, unchanged.
    const dqForm = dq ? document.querySelector('.nb-hidden-form-dq') : null;
    if (dqForm) {
      let dqDone = false;
      const submitDq = () => {
        if (dqDone) return;
        dqDone = true;
        const b = dqForm.querySelector('button[type="submit"]') || dqForm.querySelector('button');
        if (b) b.click();
      };
      fillGhlForm(dqForm, {
        name: name.trim(), email: email.trim(), phone: phone.trim(),
        city: (answers.city || '').trim(),
        own: labelFor('own', answers.own),
        treatment: labelFor('treatment', answers.treatment),
        revenue: labelFor('revenue', answers.revenue),
        frisat: labelFor('frisat', answers.frisat),
        tenure: labelFor('tenure', answers.tenure),
        sales: labelFor('sales', answers.sales),
        ads: labelFor('ads', answers.ads),
        business: (answers.business || '').trim(),
      }, () => setTimeout(submitDq, 120));
      setTimeout(submitDq, 2500);
      // Safety net if the DQ form has no On-Submit redirect of its own: send the
      // lead to /dq once the contact has had time to save.
      setTimeout(() => {
        const d = nbUrl('__NB_DQ_URL', 'https://newlybooked.com/dq');
        const qp = new URLSearchParams({ status: 'dq', name: name.trim(), business: (answers.business || '').trim() });
        if (dqReason) qp.set('reason', dqReason);
        window.location.href = d + (d.indexOf('?') > -1 ? '&' : '?') + qp.toString();
      }, 4500);
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
    if (dq && dqReason) params.set('reason', dqReason);
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
        {idx === minIdx && !inExitPopup && !submitting ? (
          onExit ? (
            // Hosted in the hero takeover: Back at the first question leaves
            // the form and restores the landing hero (matches the old funnel,
            // where Back at Q1 returned to the intro screen).
            <button className="pf-back" onClick={onExit}>← Back</button>
          ) : (
            <div className="pf-slots"><span className="pf-pulse"></span>4 spots left this month</div>
          )
        ) : (
          <button className="pf-back" hidden={submitting || idx <= minIdx} onClick={goBack}>← Back</button>
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
              {!step.lead && <div className="pf-eyebrow">{eyebrow}</div>}
              {step.lead && (
                <div className="pf-lead">
                  <span className="pf-lead-ic" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.3 4.3L19 7" /></svg>
                  </span>
                  <span>{step.lead}</span>
                </div>
              )}
              <h1 className={`pf-q${step.big ? ' lg' : ''}`}>{renderQ(step.q, step.hl)}</h1>
              {step.sub && <p className="pf-sub">{step.sub}</p>}
              {step.subStrong && <p className="pf-substrong">{renderQ(step.subStrong, step.subHl)}</p>}
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

              {step.kind === 'intro' && (
                <div className="pf-form pf-intro">
                  <button type="button" className="pf-btn pf-btn-block pf-btn-lg" onClick={goNext}>{step.cta} →</button>
                  <div className="pf-fineprint">60-second qualifier · No retainer · No 12-month lock</div>
                </div>
              )}

              {step.kind === 'choices' && !otherMode && (
                <div className={`pf-choices cols-${step.cols || 2}`}>
                  {step.options.map((o, oi) => (
                    <button
                      key={o.v}
                      className={`pf-choice${o.other ? ' other' : ''}${picked === o.v ? ' selected' : ''}`}
                      onClick={() => (o.other ? setOtherMode(true) : pick(o))}
                    >
                      <span className="pf-choice-badge" aria-hidden="true">{String.fromCharCode(65 + oi)}</span>
                      <span className="pf-choice-text">{o.label}{o.other ? ' →' : ''}</span>
                      <span className="pf-choice-chev" aria-hidden="true">›</span>
                    </button>
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
                      placeholder="e.g. Plano, TX"
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
                  <div className="pf-consent">By submitting this form, I agree to the <a href={nbUrl('__NB_TERMS_URL', 'terms.html')} target="_blank" rel="noopener noreferrer">Terms</a> &amp; <a href={nbUrl('__NB_PRIVACY_URL', 'privacy.html')} target="_blank" rel="noopener noreferrer">Privacy Policy</a>, consent to receive calls and texts (including automated) from Newly Booked, and authorize a pre-qualification check to see which program best fits my budget. Consent isn’t a condition of purchase; msg/data rates may apply; reply STOP to opt out.</div>
                  <div className="pf-fineprint">No retainer pitch · No 12-month contract</div>
                </form>
              )}

              {step.rating && (
                <div className="pf-rating" aria-label={`Rated ${step.rating} out of 5 stars by 53 medspa owners`}>
                  <span className="pf-rating-stars" aria-hidden="true">★★★★★</span>
                  <span className="pf-rating-score"><b>{step.rating}</b>/5</span>
                  <span className="pf-rating-label">rated by 53 medspa owners</span>
                </div>
              )}

              {step.trust && (
                <div className="pf-trust">
                  <div className="pf-trust-label">The system behind it</div>
                  <div className="pf-stats">
                    <div className="pf-stat"><span className="pf-stat-num">$8M+</span><span className="pf-stat-cap">package sales</span></div>
                    <div className="pf-stat"><span className="pf-stat-num">80%+</span><span className="pf-stat-cap">approved for financing</span></div>
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

      {exitOpen && !submitting && ReactDOM.createPortal(
        <div className={`pf-exit-veil${exitQuiz ? ' quiz' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) exitDismiss('backdrop'); }}>
          <div className={`pf-exit${exitQuiz ? ' pf-exit-quiz' : ''}`} role="dialog" aria-modal="true" aria-label="Before you go">
            <button className="pf-exit-x" aria-label="Close" onClick={() => exitDismiss('x')}>✕</button>
            {!exitQuiz ? (
              <>
                <h2 className="pf-exit-wait">Wait. Before you go.</h2>
                <p className="pf-sub">Answer these quick questions and see if your area is still open.</p>
                <p className="pf-exit-q2">{STEPS[OWN_STEP].q}</p>
                <div className="pf-choices cols-2">
                  {STEPS[OWN_STEP].options.map((o) => (
                    <button
                      key={o.v}
                      className={`pf-choice${exitPicked === o.v ? ' selected' : ''}`}
                      onClick={() => exitPick(o)}
                    >{o.label}</button>
                  ))}
                </div>
              </>
            ) : (
              <div className="pf-exit-scroll">
                <Funnel embedded inExitPopup initialAnswers={exitQuiz.answers} initialIdx={exitQuiz.startIdx} />
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const OWN_STEP = STEPS.findIndex((s) => s.id === 'own');

window.Funnel = Funnel;
