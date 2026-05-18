// Screenshot wall — Cherry approvals, calendar bookings, iMessage, stripe
function ImessageScreenshot({ tag, them, mine }) {
  return (
    <div className="screenshot imessage">
      {tag && <div className="ss-tag">{tag}</div>}
      <div className="imsg-meta">iMessage · Today</div>
      {them && them.map((t, i) => <div key={i} className="imsg-bubble them">{t}</div>)}
      {mine.map((t, i) => <div key={i} className="imsg-bubble">{t}</div>)}
    </div>
  );
}

function CherryScreenshot({ tag, amount, term, apr, name }) {
  return (
    <div className="screenshot cherry">
      {tag && <div className="ss-tag">{tag}</div>}
      <div className="cherry-head">
        <span className="logo">cherry</span>
        <span style={{ fontSize: 10, opacity: 0.8 }}>PRE-QUALIFICATION</span>
      </div>
      <div className="cherry-body">
        <div className="approved">✓ Approved</div>
        <div className="amount">{amount}</div>
        <div className="terms">Up to {term} months · {apr} APR available</div>
        <div className="row">
          <span>Patient</span>
          <span className="v">{name}</span>
        </div>
        <div className="row">
          <span>Soft credit pull</span>
          <span className="v" style={{ color: '#1C5040' }}>No impact</span>
        </div>
      </div>
    </div>
  );
}

function CalendarScreenshot({ tag, month, booked, count, label }) {
  const days = Array.from({ length: 35 }, (_, i) => i - 2);
  return (
    <div className="screenshot calendar">
      {tag && <div className="ss-tag">{tag}</div>}
      <div className="cal-head">
        <span className="month">{month}</span>
        <span style={{ color: '#6B6B6B', fontSize: 10 }}>← →</span>
      </div>
      <div className="cal-grid">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={'h'+i} style={{ fontSize: 8, color: '#999', aspectRatio: 'auto' }}>{d}</div>
        ))}
        {days.map((d, i) => {
          if (d < 1 || d > 30) return <div key={i} className="day"></div>;
          const isBooked = booked.includes(d);
          const isToday = d === 14;
          return (
            <div key={i} className={`day${isBooked ? ' booked' : ''}${isToday ? ' today' : ''}`}>
              {d}
            </div>
          );
        })}
      </div>
      <div className="cal-foot">
        <span>{label}</span>
        <span className="num">{count}</span>
      </div>
    </div>
  );
}

function StripeScreenshot({ tag, total, rows, period }) {
  return (
    <div className="screenshot stripe">
      {tag && <div className="ss-tag">{tag}</div>}
      <div className="stripe-head">{period} · Card payments</div>
      <div className="stripe-total">{total}</div>
      <div style={{ marginTop: 14 }}>
        {rows.map((r, i) => (
          <div key={i} className="stripe-row">
            <span style={{ color: '#1C1C1E' }}>{r.label}</span>
            <span className="amt">+{r.amt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RealReceipt({ tag, src, alt, dark, wide, title }) {
  return (
    <div className={`screenshot real${dark ? ' dark' : ''}${wide ? ' wide' : ''}`}>
      {title && <div className="real-title">{title}</div>}
      <img src={src} alt={alt} />
    </div>
  );
}

function Lightbox({ items, index, onClose, onPrev, onNext }) {
  const touchStart = React.useRef(null);
  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  if (index == null) return null;
  const item = items[index];
  if (!item) return null;

  return (
    <div
      className="lightbox"
      onClick={onClose}
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStart.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 50) { dx < 0 ? onNext() : onPrev(); }
        touchStart.current = null;
      }}
    >
      <button
        className="lb-close"
        aria-label="Close"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >×</button>
      <button
        className="lb-nav lb-prev"
        aria-label="Previous"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
      >‹</button>
      <div className="lb-stage" onClick={(e) => e.stopPropagation()}>
        <img key={item.src} src={item.src} alt={item.alt} className="lb-img" />
        <div className="lb-counter">{index + 1} / {items.length}</div>
      </div>
      <button
        className="lb-nav lb-next"
        aria-label="Next"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
      >›</button>
    </div>
  );
}

function ScreenshotWall() {
  const gridRef = React.useRef(null);
  const [items, setItems] = React.useState([]);
  const [active, setActive] = React.useState(null);

  // Collect images from the grid once mounted, and rebuild on resize/mutation
  React.useEffect(() => {
    if (!gridRef.current) return;
    function collect() {
      const imgs = Array.from(gridRef.current.querySelectorAll('.screenshot.real img'));
      setItems(imgs.map((img) => ({ src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' })));
    }
    collect();
  }, []);

  function openAt(src) {
    const i = items.findIndex((it) => it.src === src);
    if (i >= 0) setActive(i);
  }

  function onClick(e) {
    const card = e.target.closest('.screenshot.real');
    if (!card || !gridRef.current.contains(card)) return;
    const img = card.querySelector('img');
    if (img) openAt(img.getAttribute('src'));
  }

  return (
    <React.Fragment>
      <div className="screenshot-grid" ref={gridRef} onClick={onClick}>
        {/* Cherry portal — pinned full-width at top */}
        <RealReceipt wide title="One Month, One Location. 70 contracts, 42% approval rate." src="assets/receipts/cherry-stats-155k.webp" alt="Cherry portal — $155,511 gross sales, 70 contracts, 42.45% approval rate, $112,900 approved" />

      {/* Real Cherry approval — Body Sculpt */}
      <RealReceipt title="$7,500 package financed. Patient walks out the same day." src="assets/receipts/cherry-body-sculpt-7500.webp" alt="Cherry payment plan issued — Body Sculpt Laser Center, $7,500" />

      {/* Real iMessage — Issil sales chat doubling goal */}
      <RealReceipt title="Doubled their daily goal. $40K day in the books." dark src="assets/receipts/imsg-issil-double-bonus.webp" alt="Issil Sales chat — doubled our goal today, in the $40k range" />

      {/* Real Cherry approval — Sculpt Squad $10K */}
      <RealReceipt title="$10,000 single-package sale, financed at the consult." src="assets/receipts/cherry-sculpt-squad-10000.webp" alt="Cherry payment plan issued — Sculpt Squad LLC, $10,000" />

      {/* Real Telegram — Natalie / Breeze, $17.5K day */}
      <RealReceipt title="$17,500 in one day. All $3,500 packages." dark src="assets/receipts/imsg-natalie-15500.webp" alt="Telegram from Natalie — $17,500 day, $15,500 collected, all $3500 packages" />

      {/* Real Cherry approval — Breeze $7,500 */}
      <RealReceipt title="$7,500 financed. No retainer was ever paid for this lead." src="assets/receipts/cherry-breeze-7500-a.webp" alt="Cherry payment plan issued — Breeze Medspa AZ, $7,500" />

      {/* Real iMessage — $194K December */}
      <RealReceipt title="From $67K to $193K in one December. Same spa, one year apart." dark src="assets/receipts/imsg-194k-december.webp" alt="iMessage — Last December $67K. This December $193,894.90" />

      {/* Real Vagaro POS — March 2025 ($271K) */}
      <RealReceipt title="$271,737 collected in a single month. Vagaro POS, March 2025." src="assets/receipts/vagaro-mar25-271k.webp" alt="Vagaro POS — Money Earned $271,737.25 in March 2025, $247K services, $16.8K memberships" />

      {/* Real calendar — Issil/Plano packed week */}
      <RealReceipt title="A week of pre-qualified consults. Every slot booked." src="assets/receipts/calendar-issil-plano.webp" alt="Issil calendar — week of Oct 26 packed with consultations across 4 providers" />

      {/* Real Cherry approval — Lemelana */}
      <RealReceipt title="$5,367 financed before the patient sat in the chair." src="assets/receipts/cherry-lemelana-5367.webp" alt="Cherry payment plan issued — Lemelana, $5,367" />

      {/* Real Telegram — Couzue/Papillon, $600/day deposits */}
      <RealReceipt title="First $3,500 package sold. $600/day in deposits coming in." dark src="assets/receipts/imsg-couzue-deposits.webp" alt="Telegram — $600/day, all deposit appointments, Angie sold first $3.5k package" />

      {/* Real Cherry approval — Breeze $6,500 */}
      <RealReceipt title="$6,500 package financed in one consult." src="assets/receipts/cherry-breeze-6500.webp" alt="Cherry payment plan issued — Breeze Medspa AZ, $6,500" />

      {/* Real calendar — Vione fully booked */}
      <RealReceipt title="Six straight days of pre-qualified consults." src="assets/receipts/calendar-vione.webp" alt="Vione calendar — Mon 18 to Sat 23 stacked with consultations" />

      {/* Real iMessage — Eliana NMS, Sarah sold $9,100 */}
      <RealReceipt title="$9,100 package, closed by their own provider, off our script." dark src="assets/receipts/imsg-eliana-9100.webp" alt="iMessage with Eliana NMS — Sarah just sold the package for $9100" />

      {/* Real Cherry approval — Journey */}
      <RealReceipt title="$5,170 financed. Zero out-of-pocket friction at the close." src="assets/receipts/cherry-journey-5170.webp" alt="Cherry payment plan issued — Journey to Beauty and Wellness, $5,170" />

      {/* Real Vagaro POS — November 2024 ($265K) */}
      <RealReceipt title="$265,739 collected in November alone. Vagaro POS, November 2024." src="assets/receipts/vagaro-nov24-265k.webp" alt="Vagaro POS — Money Earned $265,739.69 in November 2024, $250K services, $9.8K memberships" />

      {/* Real Cherry approval — Breeze $4,900 */}
      <RealReceipt title="$4,900 package. Patient pre-qualified before walking in." src="assets/receipts/cherry-breeze-4900.webp" alt="Cherry payment plan issued — Breeze Medspa AZ, $4,900" />

      {/* Real Cherry approval — Breeze $7,500 (2nd) */}
      <RealReceipt title="Another $7,500 financed at the same spa, weeks later." src="assets/receipts/cherry-breeze-7500-b.webp" alt="Cherry payment plan issued — Breeze Medspa AZ, $7,500" />
      </div>
      <Lightbox
        items={items}
        index={active}
        onClose={() => setActive(null)}
        onPrev={() => setActive((i) => (i == null ? null : (i - 1 + items.length) % items.length))}
        onNext={() => setActive((i) => (i == null ? null : (i + 1) % items.length))}
      />
    </React.Fragment>
  );
}

window.ScreenshotWall = ScreenshotWall;
