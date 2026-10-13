// AgriLink — permanent app download banner
(function () {
  const style = document.createElement('style');
  style.textContent = `
    #appBanner { margin: 12px 12px 0; padding: 14px 16px; background: linear-gradient(135deg, #1e7a3c, #2ea15a); color: #fff; border-radius: 14px; box-shadow: 0 4px 16px rgba(30,122,60,0.25); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #appBanner .row { display: flex; align-items: center; gap: 12px; }
    #appBanner .icon { font-size: 32px; flex-shrink: 0; }
    #appBanner .text { flex: 1; min-width: 0; }
    #appBanner .title { font-size: 14px; font-weight: 700; margin: 0 0 2px; }
    #appBanner .sub { font-size: 12px; opacity: 0.9; margin: 0; line-height: 1.3; }
    #appBanner .cta { background: #fff; color: #1e7a3c; border: 0; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    #appBanner .more { display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.25); font-size: 13px; line-height: 1.55; }
    #appBanner .more.show { display: block; }
    #appBanner .more ul { margin: 6px 0 12px; padding-left: 20px; }
    #appBanner .more li { margin: 3px 0; }
    #appBanner .actions { display: flex; gap: 8px; margin-top: 10px; }
    #appBanner .actions button { flex: 1; padding: 10px 12px; border-radius: 8px; border: 0; font-size: 13px; font-weight: 700; cursor: pointer; }
    #appBanner .notify { background: #fff; color: #1e7a3c; }
    #appBanner .back { background: rgba(255,255,255,0.18); color: #fff; }
  `;
  document.head.appendChild(style);

  function inject() {
    if (document.getElementById('appBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'appBanner';
    banner.innerHTML =
      '<div class="row">' +
        '<div class="icon">📱</div>' +
        '<div class="text">' +
          '<p class="title">Get the AgriLink app</p>' +
          '<p class="sub">Buy, sell &amp; manage your farm on the go</p>' +
        '</div>' +
        '<button class="cta" id="appBannerLearnBtn">Learn more</button>' +
      '</div>' +
      '<div class="more" id="appBannerMore">' +
        '<strong>Coming soon on Android:</strong>' +
        '<ul>' +
          '<li>Place &amp; track orders</li>' +
          '<li>Message buyers and sellers</li>' +
          '<li>My Farm — activities, seasons &amp; records</li>' +
          '<li>Alerts &amp; notifications</li>' +
          '<li>Post and browse, offline-friendly</li>' +
        '</ul>' +
        '<div class="actions">' +
          '<button class="notify" id="appBannerNotifyBtn">Notify me</button>' +
          '<button class="back" id="appBannerBackBtn">Back</button>' +
        '</div>' +
      '</div>';

    const anchor = document.querySelector('.app-header') || document.querySelector('.back-bar');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(banner, anchor.nextSibling);
    } else {
      document.body.insertBefore(banner, document.body.firstChild);
    }

    const more = banner.querySelector('#appBannerMore');
    banner.querySelector('#appBannerLearnBtn').addEventListener('click', function () {
      more.classList.add('show');
    });
    banner.querySelector('#appBannerBackBtn').addEventListener('click', function () {
      more.classList.remove('show');
    });
    banner.querySelector('#appBannerNotifyBtn').addEventListener('click', function () {
      alert("Thanks! We'll let you know when the AgriLink app is ready. 📱");
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
