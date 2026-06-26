/* Newly Booked — disqualified ("not a fit") page, streamed from the repo.
   A thin loader on the GHL page pulls this in, so edits here go live on push —
   no re-paste. Renders as a single fixed, full-viewport overlay (covers GHL's
   host page reliably) in the v2 LIGHT look that matches the landing + schedule
   pages. Reads ?reason= (which question disqualified them) and tells the owner
   WHY, in their own context, with the door left open. */
(function () {
  // Fonts
  var f = document.createElement('link');
  f.rel = 'stylesheet';
  f.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,500..600&display=swap';
  document.head.appendChild(f);

  // Styles (scoped under #nb-dq so they can't clash with GHL)
  var style = document.createElement('style');
  style.textContent = [
    '#nb-dq{position:fixed;inset:0;z-index:2147483600;color:#0A1628;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:"Inter",sans-serif;-webkit-font-smoothing:antialiased;background:radial-gradient(135% 72% at 50% -10%,#E7EEFF 0%,#F4F7FE 44%,#fff 80%)}',
    '#nb-dq *{box-sizing:border-box;margin:0;padding:0}',
    '#nb-dq .wrap{min-height:100vh;min-height:100svh;display:flex;flex-direction:column;max-width:640px;margin:0 auto}',
    '#nb-dq .top{display:flex;align-items:center;justify-content:space-between;padding:22px 24px}',
    '#nb-dq .logo{display:inline-flex;align-items:center;gap:10px;font-weight:700;font-size:16px;color:#0A1628}',
    '#nb-dq .mark{display:inline-flex;align-items:center;gap:3px;background:#0A1628;color:#fff;font-family:"Source Serif 4",Georgia,serif;font-weight:600;font-size:15px;line-height:1;letter-spacing:.5px;padding:7px 9px 8px;border-radius:6px}',
    '#nb-dq .mark i{width:1px;height:13px;background:rgba(255,255,255,.55);display:inline-block}',
    '#nb-dq .badge{font-size:12px;font-weight:600;color:#43597A}',
    '#nb-dq .stage{flex:1;display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:14px 24px 48px}',
    '#nb-dq .ring{width:54px;height:54px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #E5E9F1;color:#2B54E8;box-shadow:0 16px 34px -16px rgba(10,22,40,.22);margin-bottom:22px}',
    '#nb-dq .ring svg{width:26px;height:26px}',
    '#nb-dq .eyebrow{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#2348D4;margin-bottom:15px}',
    '#nb-dq h1{font-weight:800;font-size:clamp(28px,6vw,40px);line-height:1.13;letter-spacing:-.025em;margin-bottom:14px;color:#0A1628;max-width:18ch}',
    '#nb-dq h1 em{font-style:normal;color:#2348D4}',
    '#nb-dq .lead{font-size:16px;line-height:1.6;color:#43597A;margin-bottom:24px;max-width:46ch}',
    '#nb-dq .why{width:100%;background:#fff;border:1px solid #E5E9F1;border-radius:16px;padding:20px 22px;box-shadow:0 20px 48px -30px rgba(10,22,40,.3);margin-bottom:24px}',
    '#nb-dq .why .tag{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#2348D4;margin-bottom:11px}',
    '#nb-dq .why .tag .d{width:7px;height:7px;border-radius:999px;background:#2B54E8;display:inline-block}',
    '#nb-dq .why p{font-size:16px;line-height:1.62;color:#1B2D4A}',
    '#nb-dq .note{font-size:13.5px;line-height:1.6;color:#8A9AB3;max-width:48ch}',
    '#nb-dq .note a{color:#43597A;font-weight:600}',
    '@media (max-width:560px){#nb-dq h1{font-size:30px}#nb-dq .stage{padding-bottom:36px}}'
  ].join('');
  document.head.appendChild(style);

  // What disqualified them → why, in their own context. Keys match the funnel's
  // dqStep.id values (revenue / frisat). Anything else falls back to generic.
  var REASONS = {
    revenue: {
      h1: 'Not the right fit <em>just yet.</em>',
      tag: 'Based on your current monthly revenue',
      why: 'Newly Booked is built for spas already doing $50K+ a month — that’s the level where our system compounds the fastest and we can stand behind the results we promise. You’re not at that line yet, but the day you cross it, come back. We’d genuinely love to build with you.'
    },
    frisat: {
      h1: 'We’re not the right fit <em>right now.</em>',
      tag: 'Based on your weekend availability',
      why: 'Our entire model runs on weekend consultations — 55% of sales happen Friday & Saturday, and that’s the window we use to fill your calendar with pre-paid appointments. Without those days open, we can’t deliver the numbers we promise. If that ever changes, the door is open.'
    },
    _default: {
      h1: 'Right now, we’re <em>not the right fit.</em>',
      tag: 'Based on your answers',
      why: 'Based on your answers, your spa isn’t a match for the program today — and we’d rather tell you straight than put you on a call that wastes your time.'
    }
  };

  var p = new URLSearchParams(location.search);
  var reason = (p.get('reason') || '').trim();
  var r = REASONS[reason] || REASONS._default;
  var name = (p.get('name') || '').trim();
  var first = name ? name.split(/\s+/)[0].replace(/[<>&]/g, '') : '';
  var lead = 'Thanks for taking the time to apply' + (first ? ', ' + first : '') + '. We read every application by hand — here’s where things stand.';

  var old = document.getElementById('nb-dq');
  if (old) old.remove();
  var overlay = document.createElement('div');
  overlay.id = 'nb-dq';
  overlay.innerHTML =
    '<div class="wrap">' +
      '<div class="top">' +
        '<div class="logo"><span class="mark">N<i></i>B</span>Newly Booked</div>' +
        '<div class="badge">Application reviewed</div>' +
      '</div>' +
      '<main class="stage">' +
        '<div class="ring" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>' +
        '<div class="eyebrow">Application reviewed</div>' +
        '<h1>' + r.h1 + '</h1>' +
        '<p class="lead">' + lead + '</p>' +
        '<div class="why">' +
          '<div class="tag"><span class="d"></span>' + r.tag + '</div>' +
          '<p>' + r.why + '</p>' +
        '</div>' +
      '</main>' +
    '</div>';
  document.body.appendChild(overlay);
})();
