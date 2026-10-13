// AgriLink — public app connection
const SUPABASE_URL = 'https://uwrktkusglldbmezepya.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ji1ivwRE1mtYGl9HcjKkXg_JdT4Msss';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

// ============================================================
// ---------- Image upload ----------
// ============================================================
async function uploadImage(file, prefix) {
  const s = await getSession();
  if (!s) throw new Error('You must be logged in.');
  if (!file) throw new Error('No file selected.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB.');

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const filename = (prefix || 'img') + '-' + Date.now() + '.' + ext;
  const path = s.user.id + '/' + filename;

  const r = await db.storage
    .from('agrilink-images')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

  if (r.error) throw r.error;

  const { data } = db.storage.from('agrilink-images').getPublicUrl(path);
  return data.publicUrl;
}

// ============================================================
// ---------- Auth ----------
// ============================================================
async function signUp({ email, password, full_name, phone, county, role }) {
  const r = await db.auth.signUp({
    email, password,
    options: { data: { full_name, phone } }
  });
  if (r.error) throw r.error;

  if (r.data && r.data.user) {
    const uid = r.data.user.id;
    const { data: existing } = await db
      .from('profiles').select('id').eq('id', uid).maybeSingle();

    const profileData = {
      id: uid, full_name, phone, email,
      county: county || null,
      country: 'Kenya',
      roles: [role || 'farmer'],
      is_active: true, is_blocked: false, is_verified: false
    };

    if (existing) {
      await db.from('profiles').update(profileData).eq('id', uid);
    } else {
      const ins = await db.from('profiles').insert(profileData);
      if (ins.error) console.error('Profile insert error:', ins.error);
    }
  }
  return r.data;
}

async function login(email, password) {
  const r = await db.auth.signInWithPassword({ email, password });
  if (r.error) throw r.error;
  return r.data;
}

async function logout() {
  try { await db.auth.signOut(); } catch (e) {}
  window.location.href = 'index.html';
}

async function getSession() {
  const r = await db.auth.getSession();
  return r.data.session;
}

async function requireAuth() {
  const s = await getSession();
  if (!s) { window.location.href = 'login.html'; return null; }
  return s;
}

async function getMyProfile() {
  const s = await getSession();
  if (!s) return null;
  const r = await db.from('profiles').select('*').eq('id', s.user.id).maybeSingle();
  if (r.error) throw r.error;
  return r.data;
}

// ============================================================
// ---------- Products (public) ----------
// ============================================================
async function getPublicProducts() {
  const r = await db
    .from('products')
    .select('id, title, description, category, price, currency, quantity, unit, county, location, country, status, is_featured, created_at, seller_id, seller_name, seller_phone, image_url')
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });
  if (r.error) throw r.error;
  return r.data;
}

async function getPublicProduct(id) {
  const r = await db.from('products').select('*').eq('id', id).maybeSingle();
  if (r.error) throw r.error;
  return r.data;
}

// ============================================================
// ---------- Listings (public) ----------
// ============================================================
async function getPublicListings(type) {
  let q = db
    .from('listings')
    .select('id, type, title, description, category, price, currency, quantity, unit, county, location, country, status, is_featured, created_at, seller_id, seller_name, seller_phone, image_url')
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });
  if (type) q = q.eq('type', type);
  const r = await q;
  if (r.error) throw r.error;
  return r.data;
}

async function getPublicListing(id) {
  const r = await db.from('listings').select('*').eq('id', id).maybeSingle();
  if (r.error) throw r.error;
  return r.data;
}

// ============================================================
// ---------- Settings ----------
// ============================================================
async function getPublicSettings() {
  const r = await db.from('settings').select('*').eq('id', 1).maybeSingle();
  if (r.error) throw r.error;
  return r.data;
}

// ============================================================
// ---------- Create product ----------
// ============================================================
async function createProduct(data) {
  const s = await getSession();
  if (!s) throw new Error('You must be logged in.');
  const profile = await getMyProfile();
  if (!profile) throw new Error('Profile not found.');

  const row = Object.assign({}, data, {
    seller_id: s.user.id,
    seller_name: profile.full_name || '',
    seller_phone: profile.phone || '',
    country: 'Kenya',
    currency: 'KES',
    status: 'active',
    is_featured: false,
    view_count: 0
  });

  const r = await db.from('products').insert(row).select().single();
  if (r.error) throw r.error;
  return r.data;
}

// ============================================================
// ---------- Create listing ----------
// ============================================================
async function createListing(data) {
  const s = await getSession();
  if (!s) throw new Error('You must be logged in.');
  const profile = await getMyProfile();
  if (!profile) throw new Error('Profile not found.');

  const row = Object.assign({}, data, {
    seller_id: s.user.id,
    seller_name: profile.full_name || '',
    seller_phone: profile.phone || '',
    country: 'Kenya',
    currency: 'KES',
    status: 'active',
    is_featured: false,
    view_count: 0
  });

  const r = await db.from('listings').insert(row).select().single();
  if (r.error) throw r.error;
  return r.data;
}

// ============================================================
// ---------- My products ----------
// ============================================================
async function getMyProducts() {
  const s = await getSession();
  if (!s) throw new Error('Not signed in');
  const r = await db
    .from('products')
    .select('id, title, category, price, currency, quantity, unit, county, location, status, is_featured, image_url, created_at')
    .eq('seller_id', s.user.id)
    .order('created_at', { ascending: false });
  if (r.error) throw r.error;
  return r.data;
}

async function deleteMyProduct(id) {
  const s = await getSession();
  if (!s) throw new Error('Not signed in');
  const r = await db.from('products').delete().eq('id', id).eq('seller_id', s.user.id);
  if (r.error) throw r.error;
  return true;
}

async function markMyProductSold(id) {
  const s = await getSession();
  if (!s) throw new Error('Not signed in');
  const r = await db
    .from('products')
    .update({ status: 'sold', updated_at: new Date().toISOString() })
    .eq('id', id).eq('seller_id', s.user.id).select();
  if (r.error) throw r.error;
  if (!r.data || r.data.length === 0) throw new Error('Update blocked');
  return r.data[0];
}

// ============================================================
// ---------- My listings ----------
// ============================================================
async function getMyListings() {
  const s = await getSession();
  if (!s) throw new Error('Not signed in');
  const r = await db
    .from('listings')
    .select('id, type, title, category, price, currency, quantity, unit, county, location, status, is_featured, image_url, created_at')
    .eq('seller_id', s.user.id)
    .order('created_at', { ascending: false });
  if (r.error) throw r.error;
  return r.data;
}

async function deleteMyListing(id) {
  const s = await getSession();
  if (!s) throw new Error('Not signed in');
  const r = await db.from('listings').delete().eq('id', id).eq('seller_id', s.user.id);
  if (r.error) throw r.error;
  return true;
}

async function markMyListingSold(id) {
  const s = await getSession();
  if (!s) throw new Error('Not signed in');
  const r = await db
    .from('listings')
    .update({ status: 'sold', updated_at: new Date().toISOString() })
    .eq('id', id).eq('seller_id', s.user.id).select();
  if (r.error) throw r.error;
  if (!r.data || r.data.length === 0) throw new Error('Update blocked');
  return r.data[0];
}

// ============================================================
// ---------- Reports ----------
// ============================================================
async function createReport({ target_type, target_id, reason, details }) {
  const s = await getSession();
  if (!s) throw new Error('You must be logged in to report.');
  const row = {
    reporter_id: s.user.id,
    target_type, target_id, reason,
    details: details || null,
    status: 'open'
  };
  const r = await db.from('reports').insert(row).select().single();
  if (r.error) throw r.error;
  return r.data;
}

// ============================================================
// ---------- Ads ----------
// ============================================================
async function getActiveAds(position) {
  const r = await db
    .from('advertisements')
    .select('id, title, description, image_url, link_url, position, sort_order')
    .eq('is_active', true)
    .eq('position', position || 'home_top')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (r.error) throw r.error;
  return r.data;
}

// ============================================================
// ---------- App download banner (auto-injected on every page) ----------
// ============================================================
(function initAppBanner() {
  // Skip if dismissed
  if (localStorage.getItem('agrilink_banner_dismissed') === '1') return;

  // Inject styles once
  if (!document.getElementById('agriBannerStyles')) {
    const style = document.createElement('style');
    style.id = 'agriBannerStyles';
    style.textContent = `
      #appBanner {
        margin: 12px 12px 0;
        padding: 14px 16px;
        background: linear-gradient(135deg, #1e7a3c, #2ea15a);
        color: #fff;
        border-radius: 14px;
        box-shadow: 0 4px 16px rgba(30,122,60,0.25);
        position: relative;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #appBanner .row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      #appBanner .icon { font-size: 32px; flex-shrink: 0; }
      #appBanner .text { flex: 1; min-width: 0; }
      #appBanner .title { font-size: 14px; font-weight: 700; margin: 0 0 2px; }
      #appBanner .sub { font-size: 12px; opacity: 0.9; margin: 0; line-height: 1.3; }
      #appBanner .cta {
        background: #fff; color: #1e7a3c;
        border: 0; padding: 8px 14px; border-radius: 8px;
        font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap;
      }
      #appBanner .close {
        position: absolute; top: 6px; right: 8px;
        background: transparent; border: 0;
        color: rgba(255,255,255,0.85); font-size: 20px;
        cursor: pointer; padding: 2px 8px; line-height: 1;
      }
      #appBanner .more {
        display: none;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,0.25);
        font-size: 13px;
        line-height: 1.55;
      }
      #appBanner .more.show { display: block; }
      #appBanner .more ul { margin: 6px 0 12px; padding-left: 20px; }
      #appBanner .more li { margin: 3px 0; }
      #appBanner .actions { display: flex; gap: 8px; margin-top: 10px; }
      #appBanner .actions button {
        flex: 1; padding: 10px 12px; border-radius: 8px; border: 0;
        font-size: 13px; font-weight: 700; cursor: pointer;
      }
      #appBanner .notify { background: #fff; color: #1e7a3c; }
      #appBanner .learn-back { background: rgba(255,255,255,0.18); color: #fff; }
    `;
    document.head.appendChild(style);
  }

  function inject() {
    if (document.getElementById('appBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'appBanner';
    banner.innerHTML = `
      <button class="close" aria-label="Close">×</button>
      <div class="row">
        <div class="icon">📱</div>
        <div class="text">
          <p class="title">Get the AgriLink app</p>
          <p class="sub">Buy, sell &amp; manage your farm on the go</p>
        </div>
        <button class="cta" id="appBannerLearnBtn">Learn more</button>
      </div>
      <div class="more" id="appBannerMore">
        <strong>Coming soon on Android:</strong>
        <ul>
          <li>Place &amp; track orders</li>
          <li>Message buyers and sellers</li>
          <li>My Farm — activities, seasons &amp; records</li>
          <li>Alerts &amp; notifications</li>
          <li>Post and browse, offline-friendly</li>
        </ul>
        <div class="actions">
          <button class="notify" id="appBannerNotifyBtn">Notify me</button>
          <button class="learn-back" id="appBannerBackBtn">Back</button>
        </div>
      </div>
    `;

    const anchor = document.querySelector('.app-header') || document.querySelector('.back-bar');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(banner, anchor.nextSibling);
    } else {
      document.body.insertBefore(banner, document.body.firstChild);
    }

    banner.querySelector('.close').addEventListener('click', () => {
      banner.remove();
      try { localStorage.setItem('agrilink_banner_dismissed', '1'); } catch (e) {}
    });

    const more = banner.querySelector('#appBannerMore');
    banner.querySelector('#appBannerLearnBtn').addEventListener('click', () => {
      more.classList.add('show');
    });
    banner.querySelector('#appBannerBackBtn').addEventListener('click', () => {
      more.classList.remove('show');
    });
    banner.querySelector('#appBannerNotifyBtn').addEventListener('click', () => {
      alert('Thanks! We\\'ll let you know when the AgriLink app is ready. 📱');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
