// AgriLink Admin Centre — supabase.js
// Two values to fill: SUPABASE_URL and SUPABASE_ANON_KEY

const SUPABASE_URL = 'https://uwrktkusglldbmezepya.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ji1ivwRE1mtYGl9HcjKkXg_JdT4Msss';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

// ---------- Auth ----------
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
  if (!s) {
    window.location.href = 'index.html';
    return null;
  }
  return s;
}

async function isAdmin() {
  const s = await getSession();
  if (!s) return false;
  const r = await db
    .from('admin_roles')
    .select('role')
    .eq('user_id', s.user.id)
    .maybeSingle();
  if (r.error) return false;
  return !!r.data;
}

// ---------- Settings ----------
async function getSettings() {
  const r = await db.from('settings').select('*').eq('id', 1).maybeSingle();
  if (r.error) throw r.error;
  return r.data;
}

async function updateSettings(updates) {
  const s = await getSession();
  if (!s) throw new Error('Not signed in');
  const r = await db
    .from('settings')
    .update(Object.assign({}, updates, {
      updated_at: new Date().toISOString(),
      updated_by: s.user.id
    }))
    .eq('id', 1)
    .select();
  if (r.error) throw r.error;
  if (!r.data || r.data.length === 0) throw new Error('Update blocked by RLS');
  return r.data[0];
}

// ---------- Admins ----------
async function getAdmins() {
  const r = await db.from('admin_roles').select('*');
  if (r.error) throw r.error;
  return r.data;
}

// ---------- Profiles ----------
async function getProfiles() {
  const r = await db
    .from('profiles')
    .select('id, full_name, user_name, phone, email, county, roles, is_active, is_verified, is_blocked, created_at');
  if (r.error) throw r.error;
  return r.data;
}

async function updateProfile(id, updates) {
  const r = await db
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select();
  if (r.error) throw r.error;
  if (!r.data || r.data.length === 0) throw new Error('Update blocked by RLS');
  return r.data[0];
}

// ---------- Products ----------
async function getProducts() {
  const r = await db
    .from('products')
    .select('id, title, category, price, currency, quantity, unit, county, location, country, status, is_featured, created_at, seller_id, seller_name, seller_phone, image_url')
    .order('created_at', { ascending: false });
  if (r.error) throw r.error;
  return r.data;
}

async function getProduct(id) {
  const r = await db.from('products').select('*').eq('id', id).maybeSingle();
  if (r.error) throw r.error;
  return r.data;
}

async function updateProduct(id, updates) {
  const r = await db
    .from('products')
    .update(Object.assign({}, updates, { updated_at: new Date().toISOString() }))
    .eq('id', id)
    .select();
  if (r.error) throw r.error;
  if (!r.data || r.data.length === 0) throw new Error('Update blocked by RLS');
  return r.data[0];
}

async function deleteProduct(id) {
  const r = await db.from('products').delete().eq('id', id);
  if (r.error) throw r.error;
}
// ---------- Reports ----------
async function getReports(statusFilter) {
  let q = db
    .from('reports')
    .select('id, target_type, target_id, reason, details, status, admin_note, created_at, reporter_id, resolved_at')
    .order('created_at', { ascending: false });
  if (statusFilter) q = q.eq('status', statusFilter);
  const r = await q;
  if (r.error) throw r.error;
  return r.data;
}

async function updateReport(id, updates) {
  const s = await getSession();
  if (!s) throw new Error('Not signed in');
  const r = await db
    .from('reports')
    .update(Object.assign({}, updates, {
      resolved_by: s.user.id,
      resolved_at: new Date().toISOString()
    }))
    .eq('id', id)
    .select();
  if (r.error) throw r.error;
  if (!r.data || r.data.length === 0) throw new Error('Update blocked by RLS');
  return r.data[0];
}
// ---------- Advertisements (admin) ----------
async function getAds() {
  const r = await db
    .from('advertisements')
    .select('*')
    .order('position', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (r.error) throw r.error;
  return r.data;
}

async function updateAd(id, updates) {
  const r = await db
    .from('advertisements')
    .update(updates)
    .eq('id', id)
    .select();
  if (r.error) throw r.error;
  if (!r.data || r.data.length === 0) throw new Error('Update blocked by RLS');
  return r.data[0];
}

async function deleteAd(id) {
  const r = await db.from('advertisements').delete().eq('id', id);
  if (r.error) throw r.error;
}

async function createAd(data) {
  const r = await db.from('advertisements').insert(data).select().single();
  if (r.error) throw r.error;
  return r.data;
}
