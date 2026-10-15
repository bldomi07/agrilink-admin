/* ============================================================
   AgriLink — First-time tour
   Shows arrows/highlights pointing at key buttons on each page.
   Runs once per page (per device). Stored in localStorage.
   ============================================================ */

(function () {

  const VERSION = 'v1';

  const TOURS = {
    'index.html': [
      { selector: '#authLink',         title: 'Your account',        text: 'Tap here to log in, sign up or view your profile.',           pos: 'bottom' },
      { selector: '#sellLink',         title: 'Post a listing',      text: 'Sell produce, offer a service or post a job.',                pos: 'bottom' },
      { selector: '#tabs',             title: 'Browse by type',      text: 'Switch between Products, Services, Jobs, Machinery and Farms.', pos: 'bottom' },
      { selector: '#searchInput',      title: 'Search',              text: 'Search by product, category or a place name.',                pos: 'bottom' },
      { selector: '#locFilterSummary', title: 'Location filter',     text: 'Narrow results by country, county, sub-county, ward or town.', pos: 'bottom' }
    ],
    'login.html': [
      { selector: '#email',     title: 'Email',     text: 'Enter the email you used to register.', pos: 'bottom' },
      { selector: '#password',  title: 'Password',  text: 'Your account password.',                 pos: 'bottom' },
      { selector: '#submitBtn', title: 'Log in',    text: 'Tap here to log in.',                    pos: 'bottom' },
      { selector: '.switch',    title: 'New here?', text: 'Tap “Sign up” to create a free account.', pos: 'top' }
    ],
    'signup.html': [
      { selector: '#full_name',  title: 'Your name',      text: 'Farmers and buyers will see this name.',                pos: 'bottom' },
      { selector: '#phone',      title: 'Phone',          text: 'Buyers will call or WhatsApp you on this number.',     pos: 'bottom' },
      { selector: '#country',    title: 'Country',        text: 'Pick your country.',                                     pos: 'bottom' },
      { selector: '.role-box',   title: 'Your roles',     text: 'Tick everything that applies — you can have several.', pos: 'bottom' },
      { selector: '#submitBtn',  title: 'Create account', text: 'Once you tap this, you can log in.',                    pos: 'top' }
    ],
    'post.html': [
      { selector: '#type',         title: 'What are you posting?', text: 'Product, service, job, machinery or farm.',              pos: 'bottom' },
      { selector: '#title_select', title: 'What is it?',           text: 'Pick from the list, or choose “Other” to type your own.', pos: 'bottom' },
      { selector: '#photoBox',     title: 'Photo',                 text: 'Add a photo so buyers can see it.',                       pos: 'bottom' },
      { selector: '#price',        title: 'Price',                 text: 'Your asking price. Choose the right unit.',               pos: 'bottom' },
      { selector: '#country',      title: 'Location',              text: 'Pick country → county → sub-county → ward → town.',       pos: 'bottom' },
      { selector: '#submitBtn',    title: 'Publish',               text: 'Your listing goes live right after you tap this.',        pos: 'top' }
    ],
    'me.html': [
      { selector: '#editBtn',    title: 'Edit profile',  text: 'Change your name, phone, location or roles.',       pos: 'bottom' },
      { selector: '#itemsBox',   title: 'Your listings', text: 'Everything you have posted — mark sold or delete.', pos: 'top' },
      { selector: '#logoutBtn',  title: 'Log out',       text: 'Sign out of your account.',                         pos: 'bottom' }
    ],
    'product.html': [
      { selector: '.contact-bar', title: 'Contact the seller', text: 'Call or WhatsApp the seller directly.', pos: 'top' }
    ],
    'listing.html': [
      { selector: '.contact-bar', title: 'Contact', text: 'Call or WhatsApp the poster directly.', pos: 'top' }
    ]
  };

  function pageName() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || 'index.html';
    return last.split('?')[0];
  }

  function seenKey() {
    return 'agrilink_tour_' + VERSION + '_' + pageName();
  }

  function hasSeen() {
    try { return localStorage.getItem(seenKey()) === '1'; } catch (e) { return true; }
  }

  function markSeen() {
    try { localStorage.setItem(seenKey(), '1'); } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById('agriTourStyles')) return;
    const s = document.createElement('style');
    s.id = 'agriTourStyles';
    s.textContent = `
      .agri-tour-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.55);
        z-index: 9998;
        animation: agriFadeIn 0.2s ease;
      }
      .agri-tour-highlight {
        position: fixed;
        z-index: 9999;
        border: 3px solid #2ea15a;
        border-radius: 12px;
        box-shadow: 0 0 0 4px rgba(46,161,90,0.35), 0 0 20px 4px rgba(46,161,90,0.6);
        pointer-events: none;
        animation: agriPulse 1.6s infinite ease-in-out;
        transition: all 0.25s ease;
      }
      @keyframes agriPulse {
        0%, 100% { box-shadow: 0 0 0 4px rgba(46,161,90,0.35), 0 0 20px 4px rgba(46,161,90,0.6); }
        50%      { box-shadow: 0 0 0 8px rgba(46,161,90,0.15), 0 0 28px 8px rgba(46,161,90,0.85); }
      }
      @keyframes agriFadeIn { from { opacity: 0; } to { opacity: 1; } }

      .agri-tour-tip {
        position: fixed;
        z-index: 10000;
        max-width: 300px;
        background: #fff;
        color: #1c1c1c;
        border-radius: 14px;
        padding: 14px 16px;
        box-shadow: 0 10px 32px rgba(0,0,0,0.25);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        animation: agriFadeIn 0.25s ease;
      }
      .agri-tour-tip h3 {
        margin: 0 0 6px;
        font-size: 15px;
        color: #1e7a3c;
        font-weight: 700;
      }
      .agri-tour-tip p {
        margin: 0 0 12px;
        font-size: 13px;
        color: #333;
        line-height: 1.45;
      }
      .agri-tour-tip .agri-tour-arrow {
        position: absolute;
        width: 14px; height: 14px;
        background: #fff;
        transform: rotate(45deg);
      }
      .agri-tour-tip.pos-bottom .agri-tour-arrow { top: -7px; left: 24px; }
      .agri-tour-tip.pos-top .agri-tour-arrow    { bottom: -7px; left: 24px; }
      .agri-tour-tip.pos-left .agri-tour-arrow   { top: 24px; right: -7px; }
      .agri-tour-tip.pos-right .agri-tour-arrow  { top: 24px; left: -7px; }
      .agri-tour-tip .agri-tour-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .agri-tour-tip .agri-tour-step {
        font-size: 11px;
        color: #888;
      }
      .agri-tour-tip .agri-tour-actions {
        display: flex;
        gap: 6px;
      }
      .agri-tour-tip button {
        border: 0;
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
      }
      .agri-tour-tip .skip { background: #eee; color: #555; }
      .agri-tour-tip .next { background: #1e7a3c; color: #fff; }
    `;
    document.head.appendChild(s);
  }

  /* ============================================================
     RENDER STEP
     ============================================================ */

  let overlay, highlight, tip;
  let steps = [];
  let current = 0;

  function end() {
    markSeen();
    if (overlay)   overlay.remove();
    if (highlight) highlight.remove();
    if (tip)       tip.remove();
    overlay = highlight = tip = null;
  }

  function positionTip(target, position) {
    const rect = target.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tipW = tip.offsetWidth;
    const tipH = tip.offsetHeight;
    const gap = 14;

    let top, left, arrow = position;

    /* Auto-flip if not enough room */
    if (position === 'bottom' && rect.bottom + gap + tipH > vh - 10) position = 'top';
    if (position === 'top'    && rect.top    - gap - tipH < 10)     position = 'bottom';

    if (position === 'bottom') {
      top  = rect.bottom + gap;
      left = Math.max(10, Math.min(rect.left, vw - tipW - 10));
    } else if (position === 'top') {
      top  = rect.top - tipH - gap;
      left = Math.max(10, Math.min(rect.left, vw - tipW - 10));
    } else if (position === 'left') {
      top  = Math.max(10, Math.min(rect.top, vh - tipH - 10));
      left = rect.left - tipW - gap;
    } else {
      top  = Math.max(10, Math.min(rect.top, vh - tipH - 10));
      left = rect.right + gap;
    }

    tip.style.top  = top + 'px';
    tip.style.left = left + 'px';

    tip.classList.remove('pos-top','pos-bottom','pos-left','pos-right');
    tip.classList.add('pos-' + position);
  }

  function showStep() {
    if (tip) tip.remove();
    if (highlight) highlight.remove();

    if (current >= steps.length) { end(); return; }

    const step = steps[current];
    const target = document.querySelector(step.selector);

    if (!target) { current++; showStep(); return; }

    /* Scroll into view */
    try {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {
      target.scrollIntoView();
    }

    setTimeout(() => {

      const rect = target.getBoundingClientRect();

      /* Highlight */
      highlight = document.createElement('div');
      highlight.className = 'agri-tour-highlight';
      highlight.style.top    = (rect.top - 4) + 'px';
      highlight.style.left   = (rect.left - 4) + 'px';
      highlight.style.width  = (rect.width + 8) + 'px';
      highlight.style.height = (rect.height + 8) + 'px';
      document.body.appendChild(highlight);

      /* Tooltip */
      tip = document.createElement('div');
      tip.className = 'agri-tour-tip';
      const isLast = (current === steps.length - 1);

      tip.innerHTML =
        '<div class="agri-tour-arrow"></div>' +
        '<h3>' + esc(step.title) + '</h3>' +
        '<p>' + esc(step.text) + '</p>' +
        '<div class="agri-tour-row">' +
          '<span class="agri-tour-step">' + (current + 1) + ' / ' + steps.length + '</span>' +
          '<div class="agri-tour-actions">' +
            '<button class="skip" type="button">Skip</button>' +
            '<button class="next" type="button">' + (isLast ? 'Got it!' : 'Next') + '</button>' +
          '</div>' +
        '</div>';

      document.body.appendChild(tip);

      tip.querySelector('.skip').onclick = end;
      tip.querySelector('.next').onclick = () => { current++; showStep(); };

      positionTip(target, step.pos || 'bottom');

    }, 300);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ============================================================
     BOOT
     ============================================================ */

  function start() {
    if (hasSeen()) return;

    steps = TOURS[pageName()];
    if (!steps || !steps.length) return;

    injectStyles();

    overlay = document.createElement('div');
    overlay.className = 'agri-tour-overlay';
    document.body.appendChild(overlay);

    current = 0;
    showStep();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(start, 900));
  } else {
    setTimeout(start, 900);
  }

})();
