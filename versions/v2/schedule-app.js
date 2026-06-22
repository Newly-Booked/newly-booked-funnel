/* Newly Booked — schedule page, streamed from the repo.
   Injects the markup + styles, then renders the iClosed INLINE calendar
   prefilled from the lead's details (URL params first, then the localStorage the
   funnel wrote). A tiny shell on the GHL page loads this file, so every edit
   here goes live on push — no re-paste of the schedule page ever again. */
(function () {
  var BASE = 'https://artzy22.github.io/newly-booked-funnel/versions/v2/';
  var v = Date.now();

  // --- fonts + styles ---
  function addLink(href) {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }
  addLink('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Source+Serif+4:opsz,wght@8..60,500..600&display=swap');

  // Inline the styles instead of an external stylesheet: a <link> loads async,
  // so the markup paints unstyled (oversized SVG icons) for a split second
  // first. A <style> injected here applies synchronously with the markup.
  var style = document.createElement('style');
  style.textContent = [
    ':root{--navy-900:#0A1628;--navy-500:#43597A;--navy-300:#8A9AB3;--blue-700:#1C3CB8;--blue-600:#2348D4;--blue-500:#2B54E8;--blue-400:#5C79F2;--blue-50:#EDF1FE;--line:#E5E9F1;--green:#149E55}',
    '#nb-schedule *{box-sizing:border-box;margin:0;padding:0}',
    'body{font-family:"Inter",sans-serif;color:var(--navy-900);-webkit-font-smoothing:antialiased;background:radial-gradient(135% 72% at 50% -10%,#E7EEFF 0%,#F4F7FE 44%,#fff 80%);min-height:100vh;min-height:100svh}',
    '#nb-schedule .wrap{min-height:100vh;min-height:100svh;display:flex;flex-direction:column;max-width:680px;margin:0 auto}',
    '#nb-schedule .top{display:flex;align-items:center;justify-content:space-between;padding:22px 24px}',
    '#nb-schedule .logo{display:inline-flex;align-items:center;gap:10px;font-weight:700;font-size:16px;color:var(--navy-900)}',
    '#nb-schedule .mark{display:inline-flex;align-items:center;gap:3px;background:var(--navy-900);color:#fff;font-family:"Source Serif 4",Georgia,serif;font-weight:600;font-size:15px;line-height:1;letter-spacing:.5px;padding:7px 9px 8px;border-radius:6px}',
    '#nb-schedule .mark i{width:1px;height:13px;background:rgba(255,255,255,.55);display:inline-block}',
    '#nb-schedule .secure{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:var(--navy-500)}',
    '#nb-schedule .secure .dot{width:7px;height:7px;border-radius:999px;background:var(--green);box-shadow:0 0 0 0 rgba(20,158,85,.5);animation:nbpulse 2s infinite}',
    '@keyframes nbpulse{0%{box-shadow:0 0 0 0 rgba(20,158,85,.5)}70%{box-shadow:0 0 0 7px rgba(20,158,85,0)}100%{box-shadow:0 0 0 0 rgba(20,158,85,0)}}',
    '#nb-schedule .stage{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:10px 22px 40px}',
    '#nb-schedule .eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(20,158,85,.1);color:#0E7C42;font-weight:700;font-size:12.5px;letter-spacing:.04em;padding:8px 15px;border-radius:999px;margin-bottom:18px}',
    '#nb-schedule .eyebrow svg{width:14px;height:14px}',
    '#nb-schedule h1{font-weight:800;font-size:clamp(28px,6.4vw,42px);line-height:1.12;letter-spacing:-.025em;max-width:16ch}',
    '#nb-schedule .sub{margin-top:14px;font-size:16px;font-weight:500;color:var(--navy-500);line-height:1.5;max-width:42ch}',
    '#nb-schedule .meta{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 18px;margin-top:18px}',
    '#nb-schedule .meta span{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--navy-500)}',
    '#nb-schedule .meta svg{width:15px;height:15px;color:var(--blue-500)}',
    '#nb-schedule .cal{width:100%;max-width:640px;margin:22px auto 0;background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:0 26px 60px -30px rgba(10,22,40,.34);padding:8px;overflow:hidden}',
    '#nb-schedule .cal .iclosed-widget{display:block;width:100%;border-radius:13px;overflow:hidden}',
    '#nb-schedule .cal .ic{width:64px;height:64px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#2B54E8,#1E3FC9);color:#fff;box-shadow:0 16px 30px -12px rgba(43,84,232,.5);margin-bottom:8px}',
    '#nb-schedule .cal .ic svg{width:30px;height:30px}',
    '#nb-schedule .cal h2{font-weight:800;font-size:20px;letter-spacing:-.01em}',
    '#nb-schedule .cal p{font-size:14px;color:var(--navy-500);line-height:1.5;max-width:34ch;margin-top:2px}',
    '#nb-schedule .book-btn{margin-top:16px;width:100%;max-width:360px;cursor:pointer;background:linear-gradient(160deg,#2B54E8,#1E3FC9);color:#fff;border:none;border-radius:15px;font-family:inherit;font-weight:800;font-size:17px;padding:18px 24px;display:inline-flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 18px 36px -10px rgba(43,84,232,.55);transition:transform .12s ease,box-shadow .12s ease}',
    '#nb-schedule .book-btn:hover{transform:translateY(-2px);box-shadow:0 22px 42px -10px rgba(43,84,232,.7)}',
    '#nb-schedule .book-btn:active{transform:translateY(0)}',
    '#nb-schedule .foot{padding:8px 24px 26px;text-align:center;font-size:12px;color:var(--navy-300)}',
    '#nb-schedule .foot a{color:var(--navy-500);text-decoration:none;font-weight:600}',
    '@media (max-width:560px){#nb-schedule .secure{display:none}}'
  ].join('');
  document.head.appendChild(style);

  // --- markup ---
  var host = document.getElementById('nb-schedule');
  if (!host) { host = document.createElement('div'); host.id = 'nb-schedule'; document.body.appendChild(host); }
  host.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div class="logo"><span class="mark">N<i></i>B</span>Newly Booked</div>
        <div class="secure"><span class="dot"></span>Your spot is held</div>
      </div>

      <div class="stage">
        <div class="eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.3 4.3L19 7"/></svg>
          You qualify
        </div>
        <h1 id="sch-h1">Pick your time.</h1>
        <p class="sub">A quick <b style="color:var(--navy-900);font-weight:700">15-minute intro call</b> with a patient generation specialist. We’ll look at your local market, your current offerings, and your experience, then estimate how many new patients you should be seeing, and whether Newly Booked is the right fit. No pressure, just a conversation.</p>
        <div class="meta">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>15 minutes</span>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>Phone call</span>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>No pressure</span>
        </div>

        <div class="cal">
          <div class="iclosed-widget" id="sch-cal" data-url="https://app.iclosed.io/e/newlybooked/setter-call" title="INTRO CALL" style="width:100%;height:680px"></div>
        </div>
      </div>

      <div class="foot">Newly Booked · We only get paid when patients pay you · <a href="https://newlybooked.com/apply">Back to start</a></div>
    </div>
  `;

  // --- prefill the iClosed popup link ---
  // Read the lead's details from the URL first, then fall back to the
  // localStorage the funnel wrote (the GHL form redirect carries no params).
  var ICLOSED = 'https://app.iclosed.io/e/newlybooked/setter-call';
  var p = new URLSearchParams(location.search);
  var ls = function (k) { try { return (localStorage.getItem(k) || '').trim(); } catch (e) { return ''; } };
  var name = (p.get('name') || ls('nb_name') || '').trim();
  var email = (p.get('email') || ls('nb_email') || '').trim();
  var phone = (p.get('phone') || ls('nb_phone') || '').trim();

  if (name) {
    var first = name.split(/\s+/)[0].replace(/[<>&]/g, '');
    var h1 = document.getElementById('sch-h1');
    if (h1) h1.textContent = 'Pick your time, ' + first + '.';
    try { sessionStorage.setItem('nb_name', name); } catch (e) {}
  }

  // iClosed reads these exact keys — iclosedName (full name), iclosedEmail,
  // iclosedPhone (digits only). https://docs.iclosed.io/en/articles/9830929
  var pre = new URLSearchParams();
  if (name) pre.set('iclosedName', name);
  if (email) pre.set('iclosedEmail', email);
  // iClosed's phone widget reads the country code from the leading digits, so a
  // bare US 10-digit number gets misread (e.g. "516..." → Peru +51). Prepend
  // the US country code "1": 1 + 10 digits, matching iClosed's docs.
  var digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = '1' + digits;
  if (digits) pre.set('iclosedPhone', digits);
  // iClosed's docs want spaces as %20, not the + that URLSearchParams emits.
  // (A literal + inside a value stays %2B, so emails like a+b@x.com survive.)
  var qs = pre.toString().replace(/\+/g, '%20');
  // Set the prefilled URL on the inline widget BEFORE widget.js runs below, so
  // the embedded calendar opens with name/email/phone already filled in.
  var cal = document.getElementById('sch-cal');
  if (cal) cal.setAttribute('data-url', ICLOSED + (qs ? ('?' + qs) : ''));

  // --- iClosed widget script — renders the inline calendar from the div above ---
  var w = document.createElement('script');
  w.type = 'text/javascript';
  w.src = 'https://app.iclosed.io/assets/widget.js';
  w.async = true;
  document.body.appendChild(w);

  // Fallback: if iClosed's script never injected anything into the widget div a
  // few seconds out (blocked, offline, or iClosed down), the lead would be left
  // staring at an empty box. Collapse it and show a direct booking link — same
  // prefilled URL — so they can still book their call instead of dropping off.
  setTimeout(function () {
    var c = document.getElementById('sch-cal');
    if (!c || c.querySelector('iframe') || c.children.length > 0) return; // rendered fine
    c.style.height = 'auto';
    c.innerHTML =
      '<div style="padding:30px 20px;text-align:center">' +
      '<p style="font-size:15px;line-height:1.5;color:var(--navy-500);margin-bottom:16px">' +
      'Tap below to pick your time and lock in your call.</p></div>';
    var a = document.createElement('a');
    a.href = ICLOSED + (qs ? ('?' + qs) : '');
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'book-btn';
    a.textContent = 'Book your call →';
    c.firstChild.appendChild(a);
  }, 6000);
})();
