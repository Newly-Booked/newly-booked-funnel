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

// Curated US city autocomplete list (~330 entries) covering the top
// 200 metros by population plus affluent suburbs and known medspa
// markets (Beverly Hills, Scottsdale, Naples FL, etc.). Rendered as
// an HTML5 <datalist> on the city step so leads can pick faster and
// we get less typo-laden city data downstream. The input still
// accepts free typing — anything not in the list still saves.
const NB_US_CITIES = [
  // Alabama
  'Birmingham, AL', 'Huntsville, AL', 'Mobile, AL', 'Montgomery, AL', 'Tuscaloosa, AL', 'Auburn, AL', 'Hoover, AL',
  // Alaska
  'Anchorage, AK', 'Fairbanks, AK',
  // Arizona
  'Phoenix, AZ', 'Scottsdale, AZ', 'Tucson, AZ', 'Mesa, AZ', 'Chandler, AZ', 'Gilbert, AZ', 'Glendale, AZ', 'Tempe, AZ', 'Peoria, AZ', 'Surprise, AZ', 'Yuma, AZ', 'Sedona, AZ', 'Flagstaff, AZ', 'Prescott, AZ', 'Paradise Valley, AZ',
  // Arkansas
  'Little Rock, AR', 'Fayetteville, AR', 'Bentonville, AR', 'Fort Smith, AR', 'Rogers, AR',
  // California
  'Los Angeles, CA', 'San Diego, CA', 'San Francisco, CA', 'San Jose, CA', 'Sacramento, CA', 'Long Beach, CA', 'Oakland, CA', 'Fresno, CA', 'Bakersfield, CA', 'Anaheim, CA', 'Santa Ana, CA', 'Riverside, CA', 'Irvine, CA', 'Beverly Hills, CA', 'Newport Beach, CA', 'Pasadena, CA', 'Burbank, CA', 'Santa Monica, CA', 'Berkeley, CA', 'Walnut Creek, CA', 'Palo Alto, CA', 'Mountain View, CA', 'Sunnyvale, CA', 'Santa Clara, CA', 'Cupertino, CA', 'Fremont, CA', 'Hayward, CA', 'Concord, CA', 'Modesto, CA', 'Stockton, CA', 'Chula Vista, CA', 'Carlsbad, CA', 'Encinitas, CA', 'La Jolla, CA', 'Del Mar, CA', 'Coronado, CA', 'Costa Mesa, CA', 'Huntington Beach, CA', 'Laguna Beach, CA', 'Mission Viejo, CA', 'Tustin, CA', 'Orange, CA', 'Fullerton, CA', 'Manhattan Beach, CA', 'Hermosa Beach, CA', 'Redondo Beach, CA', 'Torrance, CA', 'Calabasas, CA', 'Malibu, CA', 'Thousand Oaks, CA', 'Westlake Village, CA', 'Sherman Oaks, CA', 'Encino, CA', 'Studio City, CA', 'Tarzana, CA', 'Woodland Hills, CA', 'Hollywood, CA', 'West Hollywood, CA', 'Brentwood, CA', 'Pacific Palisades, CA', 'Culver City, CA', 'Camarillo, CA', 'Oxnard, CA', 'Ventura, CA', 'Simi Valley, CA', 'Santa Barbara, CA', 'Monterey, CA', 'Carmel, CA', 'Santa Cruz, CA', 'Santa Rosa, CA', 'Napa, CA', 'Healdsburg, CA',
  // Colorado
  'Denver, CO', 'Colorado Springs, CO', 'Aurora, CO', 'Fort Collins, CO', 'Lakewood, CO', 'Boulder, CO', 'Centennial, CO', 'Highlands Ranch, CO', 'Castle Rock, CO', 'Parker, CO', 'Littleton, CO', 'Aspen, CO', 'Vail, CO', 'Telluride, CO', 'Steamboat Springs, CO',
  // Connecticut
  'Hartford, CT', 'New Haven, CT', 'Stamford, CT', 'Bridgeport, CT', 'Greenwich, CT', 'Westport, CT', 'Darien, CT', 'New Canaan, CT', 'Fairfield, CT',
  // Delaware
  'Wilmington, DE', 'Dover, DE',
  // DC
  'Washington, DC',
  // Florida
  'Jacksonville, FL', 'Miami, FL', 'Tampa, FL', 'Orlando, FL', 'St Petersburg, FL', 'Tallahassee, FL', 'Cape Coral, FL', 'Fort Lauderdale, FL', 'Pembroke Pines, FL', 'Hollywood, FL', 'Gainesville, FL', 'Coral Springs, FL', 'West Palm Beach, FL', 'Clearwater, FL', 'Lakeland, FL', 'Pompano Beach, FL', 'Boca Raton, FL', 'Plantation, FL', 'Palm Coast, FL', 'Boynton Beach, FL', 'Wellington, FL', 'Naples, FL', 'Bonita Springs, FL', 'Estero, FL', 'Fort Myers, FL', 'Marco Island, FL', 'Vero Beach, FL', 'Stuart, FL', 'Palm Beach Gardens, FL', 'Aventura, FL', 'Coral Gables, FL', 'Pinecrest, FL', 'Miami Beach, FL', 'Sunny Isles Beach, FL', 'Doral, FL', 'Delray Beach, FL', 'Sarasota, FL', 'Bradenton, FL', 'Pensacola, FL', 'Ponte Vedra, FL', 'St Augustine, FL', 'Jacksonville Beach, FL', 'Jupiter, FL',
  // Georgia
  'Atlanta, GA', 'Augusta, GA', 'Savannah, GA', 'Athens, GA', 'Sandy Springs, GA', 'Roswell, GA', 'Johns Creek, GA', 'Alpharetta, GA', 'Marietta, GA', 'Smyrna, GA', 'Brookhaven, GA', 'Dunwoody, GA', 'Decatur, GA', 'Cumming, GA', 'Suwanee, GA', 'Duluth, GA', 'Lawrenceville, GA', 'Peachtree City, GA', 'Newnan, GA',
  // Hawaii
  'Honolulu, HI', 'Kailua, HI', 'Lahaina, HI', 'Wailea, HI',
  // Idaho
  'Boise, ID', 'Meridian, ID', 'Coeur d\'Alene, ID', 'Eagle, ID', 'Sun Valley, ID',
  // Illinois
  'Chicago, IL', 'Aurora, IL', 'Naperville, IL', 'Rockford, IL', 'Springfield, IL', 'Schaumburg, IL', 'Evanston, IL', 'Oak Park, IL', 'Glenview, IL', 'Northbrook, IL', 'Lake Forest, IL', 'Highland Park, IL', 'Deerfield, IL', 'Buffalo Grove, IL', 'Barrington, IL', 'Hinsdale, IL', 'Oak Brook, IL', 'Wilmette, IL', 'Winnetka, IL',
  // Indiana
  'Indianapolis, IN', 'Fort Wayne, IN', 'Carmel, IN', 'Fishers, IN', 'Bloomington, IN', 'Noblesville, IN', 'Westfield, IN', 'Zionsville, IN',
  // Iowa
  'Des Moines, IA', 'Cedar Rapids, IA', 'Iowa City, IA', 'West Des Moines, IA',
  // Kansas
  'Wichita, KS', 'Overland Park, KS', 'Olathe, KS', 'Lawrence, KS', 'Leawood, KS', 'Prairie Village, KS',
  // Kentucky
  'Louisville, KY', 'Lexington, KY', 'Bowling Green, KY',
  // Louisiana
  'New Orleans, LA', 'Baton Rouge, LA', 'Shreveport, LA', 'Lafayette, LA', 'Mandeville, LA',
  // Maine
  'Portland, ME', 'Bangor, ME',
  // Maryland
  'Baltimore, MD', 'Rockville, MD', 'Annapolis, MD', 'Bethesda, MD', 'Chevy Chase, MD', 'Potomac, MD', 'Columbia, MD', 'Silver Spring, MD', 'Ellicott City, MD',
  // Massachusetts
  'Boston, MA', 'Cambridge, MA', 'Worcester, MA', 'Newton, MA', 'Brookline, MA', 'Wellesley, MA', 'Weston, MA', 'Lexington, MA', 'Concord, MA', 'Belmont, MA', 'Winchester, MA', 'Andover, MA', 'Hingham, MA', 'Marblehead, MA',
  // Michigan
  'Detroit, MI', 'Grand Rapids, MI', 'Ann Arbor, MI', 'Troy, MI', 'Birmingham, MI', 'Bloomfield Hills, MI', 'West Bloomfield, MI', 'Novi, MI', 'Northville, MI', 'Plymouth, MI', 'Rochester Hills, MI', 'Royal Oak, MI',
  // Minnesota
  'Minneapolis, MN', 'St Paul, MN', 'Rochester, MN', 'Bloomington, MN', 'Edina, MN', 'Wayzata, MN', 'Minnetonka, MN', 'Eden Prairie, MN', 'Maple Grove, MN', 'Woodbury, MN', 'Plymouth, MN',
  // Mississippi
  'Jackson, MS', 'Gulfport, MS', 'Madison, MS', 'Olive Branch, MS',
  // Missouri
  'Kansas City, MO', 'St Louis, MO', 'Springfield, MO', 'Columbia, MO', 'Chesterfield, MO', 'Clayton, MO', 'Ladue, MO',
  // Montana
  'Billings, MT', 'Bozeman, MT', 'Missoula, MT', 'Whitefish, MT', 'Big Sky, MT',
  // Nebraska
  'Omaha, NE', 'Lincoln, NE',
  // Nevada
  'Las Vegas, NV', 'Henderson, NV', 'Reno, NV', 'Summerlin, NV', 'Incline Village, NV',
  // New Hampshire
  'Manchester, NH', 'Nashua, NH', 'Portsmouth, NH',
  // New Jersey
  'Newark, NJ', 'Jersey City, NJ', 'Hoboken, NJ', 'Princeton, NJ', 'Morristown, NJ', 'Summit, NJ', 'Short Hills, NJ', 'Millburn, NJ', 'Livingston, NJ', 'Montclair, NJ', 'Tenafly, NJ', 'Saddle River, NJ', 'Alpine, NJ', 'Edgewater, NJ', 'Englewood, NJ', 'Ridgewood, NJ', 'Cherry Hill, NJ',
  // New Mexico
  'Albuquerque, NM', 'Santa Fe, NM', 'Las Cruces, NM',
  // New York
  'New York, NY', 'Brooklyn, NY', 'Queens, NY', 'Manhattan, NY', 'Bronx, NY', 'Staten Island, NY', 'Buffalo, NY', 'Rochester, NY', 'Syracuse, NY', 'Albany, NY', 'White Plains, NY', 'Scarsdale, NY', 'Bronxville, NY', 'Larchmont, NY', 'Rye, NY', 'Chappaqua, NY', 'Armonk, NY', 'Bedford, NY', 'Tarrytown, NY', 'East Hampton, NY', 'Southampton, NY', 'Bridgehampton, NY', 'Sag Harbor, NY', 'Montauk, NY', 'Saratoga Springs, NY', 'Lake Placid, NY',
  // North Carolina
  'Charlotte, NC', 'Raleigh, NC', 'Greensboro, NC', 'Durham, NC', 'Winston-Salem, NC', 'Cary, NC', 'Wilmington, NC', 'Asheville, NC', 'Apex, NC', 'Huntersville, NC', 'Davidson, NC', 'Cornelius, NC', 'Mooresville, NC', 'Matthews, NC', 'Waxhaw, NC',
  // North Dakota
  'Fargo, ND', 'Bismarck, ND',
  // Ohio
  'Columbus, OH', 'Cleveland, OH', 'Cincinnati, OH', 'Toledo, OH', 'Akron, OH', 'Dayton, OH', 'Mason, OH', 'Powell, OH', 'Dublin, OH', 'Westerville, OH', 'Worthington, OH', 'Upper Arlington, OH', 'New Albany, OH',
  // Oklahoma
  'Oklahoma City, OK', 'Tulsa, OK', 'Norman, OK', 'Edmond, OK',
  // Oregon
  'Portland, OR', 'Eugene, OR', 'Salem, OR', 'Bend, OR', 'Lake Oswego, OR', 'West Linn, OR',
  // Pennsylvania
  'Philadelphia, PA', 'Pittsburgh, PA', 'Allentown, PA', 'Lancaster, PA', 'Harrisburg, PA', 'Bryn Mawr, PA', 'Wayne, PA', 'Villanova, PA', 'Devon, PA', 'Berwyn, PA', 'Newtown Square, PA', 'West Chester, PA', 'Doylestown, PA', 'New Hope, PA', 'Bala Cynwyd, PA', 'Ardmore, PA', 'Gladwyne, PA',
  // Rhode Island
  'Providence, RI', 'Newport, RI',
  // South Carolina
  'Charleston, SC', 'Columbia, SC', 'Mount Pleasant, SC', 'Greenville, SC', 'Hilton Head Island, SC', 'Bluffton, SC', 'Myrtle Beach, SC', 'Kiawah Island, SC', 'Daniel Island, SC',
  // South Dakota
  'Sioux Falls, SD', 'Rapid City, SD',
  // Tennessee
  'Nashville, TN', 'Memphis, TN', 'Knoxville, TN', 'Chattanooga, TN', 'Franklin, TN', 'Brentwood, TN', 'Germantown, TN', 'Collierville, TN',
  // Texas
  'Houston, TX', 'San Antonio, TX', 'Dallas, TX', 'Austin, TX', 'Fort Worth, TX', 'El Paso, TX', 'Arlington, TX', 'Plano, TX', 'Lubbock, TX', 'Irving, TX', 'Garland, TX', 'Frisco, TX', 'McKinney, TX', 'Grand Prairie, TX', 'Mesquite, TX', 'Carrollton, TX', 'Midland, TX', 'Waco, TX', 'Denton, TX', 'Round Rock, TX', 'Richardson, TX', 'Lewisville, TX', 'Allen, TX', 'Sugar Land, TX', 'The Woodlands, TX', 'Conroe, TX', 'Spring, TX', 'Katy, TX', 'Pearland, TX', 'Friendswood, TX', 'Galveston, TX', 'New Braunfels, TX', 'San Marcos, TX', 'Boerne, TX', 'Fredericksburg, TX', 'Lakeway, TX', 'Westlake, TX', 'Bee Cave, TX', 'Dripping Springs, TX', 'Rockwall, TX', 'Prosper, TX', 'Celina, TX', 'Flower Mound, TX', 'Highland Village, TX', 'Trophy Club, TX', 'Southlake, TX', 'Colleyville, TX', 'Grapevine, TX', 'Keller, TX', 'North Richland Hills, TX', 'Bedford, TX', 'Euless, TX', 'Hurst, TX',
  // Utah
  'Salt Lake City, UT', 'Provo, UT', 'Park City, UT', 'St George, UT', 'Lehi, UT', 'Draper, UT', 'South Jordan, UT', 'American Fork, UT',
  // Vermont
  'Burlington, VT', 'Stowe, VT',
  // Virginia
  'Virginia Beach, VA', 'Norfolk, VA', 'Richmond, VA', 'Alexandria, VA', 'Arlington, VA', 'Charlottesville, VA', 'Reston, VA', 'Fairfax, VA', 'McLean, VA', 'Vienna, VA', 'Great Falls, VA', 'Leesburg, VA', 'Williamsburg, VA',
  // Washington
  'Seattle, WA', 'Spokane, WA', 'Tacoma, WA', 'Vancouver, WA', 'Bellevue, WA', 'Kirkland, WA', 'Bellingham, WA', 'Redmond, WA', 'Sammamish, WA', 'Mercer Island, WA', 'Bothell, WA', 'Issaquah, WA', 'Woodinville, WA',
  // West Virginia
  'Charleston, WV', 'Morgantown, WV',
  // Wisconsin
  'Milwaukee, WI', 'Madison, WI', 'Green Bay, WI', 'Brookfield, WI', 'Mequon, WI', 'Whitefish Bay, WI',
  // Wyoming
  'Cheyenne, WY', 'Jackson, WY',
];

const QUALIFIER_STEPS = [
  {
    key: 'owner',
    q: 'Do you own a medspa or aesthetic clinic with treatment plans priced at $1,000+?',
    type: 'choice',
    opts: [
      { v: 'yes', label: 'Yes, I own a medspa with high-ticket packages' },
      { v: 'no', label: "No, I don't own one, or my packages are under $1,000" },
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
    failMsg: 'This isn\'t for you yet. We work best with spas already doing $30K+/month. There needs to be enough patient flow for our system to plug into.',
  },
  {
    key: 'city',
    q: 'What city or metro is your spa in?',
    type: 'text',
    placeholder: 'e.g. Plano, TX',
    suggestions: NB_US_CITIES,
    suggestionsId: 'nb-cities',
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
          Check your email for the diagnostic invitation. We'll review your numbers and book a 45-minute call. No pitch on the line.
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
            list={current.suggestionsId || undefined}
            autoComplete="address-level2"
            autoFocus
          />
          {current.suggestions && current.suggestionsId && (
            <datalist id={current.suggestionsId}>
              {current.suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
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
