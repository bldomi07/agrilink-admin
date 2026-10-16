// AgriLink — public app connection
const SUPABASE_URL = 'https://uwrktkusglldbmezepya.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ji1ivwRE1mtYGl9HcjKkXg_JdT4Msss';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

async function uploadImage(file, prefix) {
  const s = await getSession();
  if (!s) throw new Error('You must be logged in.');
  if (!file) throw new Error('No file selected.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB.');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const filename = (prefix || 'img') + '-' + Date.now() + '.' + ext;
  const path = s.user.id + '/' + filename;
  const r = await db.storage.from('agrilink-images').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (r.error) throw r.error;
  const { data } = db.storage.from('agrilink-images').getPublicUrl(path);
  return data.publicUrl;
}

async function signUp({ email, password, full_name, phone, country, county, sub_county, ward, region, town, roles }) {
  const r = await db.auth.signUp({ email, password, options: { data: { full_name, phone } } });
  if (r.error) throw r.error;
  if (r.data && r.data.user) {
    const uid = r.data.user.id;
    const { data: existing } = await db.from('profiles').select('id').eq('id', uid).maybeSingle();
    const rolesArray = Array.isArray(roles) && roles.length ? roles : ['farmer'];

    /* profiles table uses `town` (not `location`) */
    const profileData = {
      id: uid,
      full_name,
      phone,
      email,
      country: country || 'Kenya',
      county: county || null,
      sub_county: sub_county || null,
      ward: ward || null,
      region: region || null,
      town: town || null,
      roles: rolesArray,
      is_active: true,
      is_blocked: false,
      is_verified: false
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
  window.location.href = 'login.html';
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

async function requireLogin() {
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

/* ---------- Products (uses `location`) ---------- */

async function getPublicProducts() {
  const r = await db.from('products')
    .select('id, title, description, category, price, currency, quantity, unit, country, county, sub_county, ward, region, location, status, is_featured, created_at, seller_id, seller_name, seller_phone, image_url')
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

/* ---------- Listings (uses `location`) ---------- */

async function getPublicListings(type) {
  let q = db.from('listings')
    .select('id, type, title, description, category, price, currency, quantity, unit, country, county, sub_county, ward, region, location, status, is_featured, created_at, seller_id, seller_name, seller_phone, image_url')
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

async function getPublicSettings() {
  const r = await db.from('settings').select('*').eq('id', 1).maybeSingle();
  if (r.error) throw r.error;
  return r.data;
}

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

async function getMyProducts() {
  const s = await getSession();
  if (!s) throw new Error('Not signed in');
  const r = await db.from('products')
    .select('id, title, category, price, currency, quantity, unit, country, county, sub_county, ward, region, location, status, is_featured, image_url, created_at')
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
  const r = await db.from('products')
    .update({ status: 'sold', updated_at: new Date().toISOString() })
    .eq('id', id).eq('seller_id', s.user.id).select();
  if (r.error) throw r.error;
  if (!r.data || r.data.length === 0) throw new Error('Update blocked');
  return r.data[0];
}

async function getMyListings() {
  const s = await getSession();
  if (!s) throw new Error('Not signed in');
  const r = await db.from('listings')
    .select('id, type, title, category, price, currency, quantity, unit, country, county, sub_county, ward, region, location, status, is_featured, image_url, created_at')
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
  const r = await db.from('listings')
    .update({ status: 'sold', updated_at: new Date().toISOString() })
    .eq('id', id).eq('seller_id', s.user.id).select();
  if (r.error) throw r.error;
  if (!r.data || r.data.length === 0) throw new Error('Update blocked');
  return r.data[0];
}

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

async function getActiveAds(position) {
  const r = await db.from('advertisements')
    .select('id, title, description, image_url, link_url, position, sort_order')
    .eq('is_active', true)
    .eq('position', position || 'home_top')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (r.error) throw r.error;
  return r.data;
}

// Auto-load banner.js
(function loadBanner() {
  try {
    const s = document.createElement('script');
    s.src = 'banner.js';
    s.async = true;
    document.head.appendChild(s);
  } catch (e) {}
})();
