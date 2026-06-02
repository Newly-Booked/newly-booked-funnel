// Scheduler — calendar + time picker
const { useState: useSchedState, useMemo: useSchedMemo, useEffect: useSchedEffect } = React;

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

// Generate availability — weekdays only, varying open slots
function buildAvailability(year, month) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const map = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Deterministic-ish slot generator
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // closed weekends
    if (date < today) continue;            // past
    const key = `${year}-${month}-${d}`;
    // Number of slots varies by day
    const seed = (d * 13 + month * 7) % 6;
    const slotCounts = [3, 4, 5, 2, 4, 3];
    const n = slotCounts[seed];
    const startTimes = [
      { h: 9, m: 0 },
      { h: 10, m: 30 },
      { h: 13, m: 0 },
      { h: 14, m: 30 },
      { h: 16, m: 0 },
      { h: 17, m: 30 },
    ];
    const slots = startTimes.slice(0, n).map((s, i) => ({
      h: s.h, m: s.m,
      remaining: ((d + i) % 4 === 0) ? 1 : (((d + i) % 3 === 0) ? 2 : 3),
    }));
    map[key] = slots;
  }
  return map;
}

function formatTime(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  const mm = m.toString().padStart(2, '0');
  return { time: `${hh}:${mm}`, ampm };
}

function Scheduler() {
  const today = useSchedMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [view, setView] = useSchedState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));
  const [selectedDate, setSelectedDate] = useSchedState(null); // {y,m,d}
  const [selectedSlot, setSelectedSlot] = useSchedState(null); // {h,m}

  const availability = useSchedMemo(() => buildAvailability(view.year, view.month), [view.year, view.month]);

  // Auto-select first available day on mount
  useSchedEffect(() => {
    if (selectedDate) return;
    const keys = Object.keys(availability).sort((a, b) => {
      const [, , da] = a.split('-').map(Number);
      const [, , db] = b.split('-').map(Number);
      return da - db;
    });
    if (keys.length) {
      const [y, m, d] = keys[0].split('-').map(Number);
      setSelectedDate({ y, m, d });
    }
  }, [availability]);

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ empty: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${view.year}-${view.month}-${d}`;
    const date = new Date(view.year, view.month, d);
    const isPast = date < today;
    const isToday = date.getTime() === today.getTime();
    const isAvailable = !!availability[key] && availability[key].length > 0;
    const isSelected = selectedDate
      && selectedDate.y === view.year
      && selectedDate.m === view.month
      && selectedDate.d === d;
    cells.push({ d, isPast, isToday, isAvailable, isSelected });
  }
  while (cells.length % 7 !== 0) cells.push({ empty: true });

  const canPrev = view.year > today.getFullYear() ||
    (view.year === today.getFullYear() && view.month > today.getMonth());

  const goPrev = () => {
    if (!canPrev) return;
    const nm = view.month === 0 ? 11 : view.month - 1;
    const ny = view.month === 0 ? view.year - 1 : view.year;
    setView({ year: ny, month: nm });
  };
  const goNext = () => {
    const nm = view.month === 11 ? 0 : view.month + 1;
    const ny = view.month === 11 ? view.year + 1 : view.year;
    setView({ year: ny, month: nm });
  };

  const selKey = selectedDate ? `${selectedDate.y}-${selectedDate.m}-${selectedDate.d}` : null;
  const slots = (selKey && availability[selKey]) || [];

  const selectedSlotLabel = (() => {
    if (!selectedDate || !selectedSlot) return null;
    const { time, ampm } = formatTime(selectedSlot.h, selectedSlot.m);
    const date = new Date(selectedDate.y, selectedDate.m, selectedDate.d);
    const dow = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
    return `${dow}, ${MONTH_NAMES[selectedDate.m]} ${selectedDate.d} · ${time} ${ampm}`;
  })();

  const selectedDateStr = (() => {
    if (!selectedDate) return null;
    const date = new Date(selectedDate.y, selectedDate.m, selectedDate.d);
    const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()];
    return { dow: dow.toUpperCase(), full: `${MONTH_NAMES[selectedDate.m]} ${selectedDate.d}` };
  })();

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';

  return (
    <div className="sched-card">
      <div className="sched-card-head">
        <div className="meeting">
          <div className="icon">i</div>
          <div>
            <div className="title">Partnership Call · 45 minutes</div>
            <div className="sub">With a senior partner · Confirm fit · Map out your first 60 days</div>
          </div>
        </div>
        <div className="stamp">
          BOOKING CONFIRMED IN 2 STEPS
          <span className="ref">REF · NB-DGNX-{new Date().getFullYear()}</span>
        </div>
      </div>

      <div className="sched-meta">
        <div className="sched-meta-cell">
          <div className="lbl">Format</div>
          <div className="val"><span className="glyph">▢</span>Zoom video call</div>
        </div>
        <div className="sched-meta-cell">
          <div className="lbl">Length</div>
          <div className="val"><span className="glyph">◷</span>45 minutes</div>
        </div>
        <div className="sched-meta-cell">
          <div className="lbl">Cost</div>
          <div className="val"><span className="glyph">$</span>Free · No retainer pitch</div>
        </div>
        <div className="sched-meta-cell">
          <div className="lbl">Timezone</div>
          <div className="val"><span className="glyph">⌖</span>{tz}</div>
        </div>
      </div>

      <div className="sched-body">
        <div className="sched-cal">
          <div className="sched-cal-head">
            <div className="month">{MONTH_NAMES[view.month]} {view.year}</div>
            <div className="nav">
              <button onClick={goPrev} disabled={!canPrev} aria-label="Previous month">‹</button>
              <button onClick={goNext} aria-label="Next month">›</button>
            </div>
          </div>
          <div className="sched-dow">
            {DOW.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="sched-grid">
            {cells.map((c, i) => {
              if (c.empty) return <div key={i} className="sched-day empty"></div>;
              const cls = ['sched-day'];
              if (c.isToday) cls.push('today');
              if (c.isAvailable && !c.isPast) cls.push('available');
              else cls.push('muted');
              if (c.isSelected) cls.push('selected');
              return (
                <button
                  key={i}
                  className={cls.join(' ')}
                  disabled={!c.isAvailable || c.isPast}
                  onClick={() => {
                    if (c.isAvailable && !c.isPast) {
                      setSelectedDate({ y: view.year, m: view.month, d: c.d });
                      setSelectedSlot(null);
                    }
                  }}
                >
                  {c.d}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sched-times">
          <div className="sched-times-head">
            <div className="picked">
              <span className="day">{selectedDateStr ? selectedDateStr.dow : 'PICK A DATE'}</span>
              {selectedDateStr ? selectedDateStr.full : '—'}
            </div>
            <div className="tz">{tz}</div>
          </div>

          {slots.length === 0 ? (
            <div className="sched-times-empty">
              No available times for this date. Try another day.
            </div>
          ) : (
            <div className="sched-times-list">
              {slots.map((s, i) => {
                const { time, ampm } = formatTime(s.h, s.m);
                const isSel = selectedSlot && selectedSlot.h === s.h && selectedSlot.m === s.m;
                const cls = ['sched-slot'];
                if (isSel) cls.push('selected');
                if (s.remaining === 1) cls.push('scarce');
                return (
                  <button
                    key={i}
                    className={cls.join(' ')}
                    onClick={() => setSelectedSlot({ h: s.h, m: s.m })}
                  >
                    <span>
                      {time} <span className="meridiem">{ampm}</span>
                    </span>
                    <span className="left-tag">
                      {s.remaining === 1 ? '1 left' : `${s.remaining} open`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="sched-foot">
        <div className="summary">
          {selectedSlotLabel
            ? <><span className="sel">{selectedSlotLabel}</span></>
            : <span className="none">Select a date and time to continue</span>
          }
        </div>
        <button
          className="btn btn-gold btn-lg btn-arrow"
          disabled={!selectedSlotLabel}
          onClick={() => {
            if (!selectedSlotLabel) return;
            const incoming = new URLSearchParams(window.location.search);
            const out = new URLSearchParams();
            for (const k of ['name', 'email', 'phone', 'city', 'revenue', 'treatment']) {
              const v = incoming.get(k);
              if (v) out.set(k, v);
            }
            out.set('slot', selectedSlotLabel);
            const base = window.nbUrl('__NB_CONFIRMED_URL', 'confirmed.html');
            window.location.href = `${base}${base.includes('?') ? '&' : '?'}${out.toString()}`;
          }}
        >
          Confirm appointment
        </button>
      </div>
    </div>
  );
}

window.Scheduler = Scheduler;
