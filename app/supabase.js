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

// ---------- Auth ----------
async function signUp({ email, password, full_name, phone, county, role }) {
  const r = await db.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone }
    }
  });
  if (r.error) throw r.error;

  // Ensure profile row exists with full details
  if (r.data && r.data.user) {
    const uid = r.data.user.id;
    const { data: existing } = await db
      .from('profiles')
      .select('id')
      .eq('id', uid)
      .maybeSingle();

    const profileData = {
      id: uid,
      full_name,
      phone,
      email,
      county: county || null,
      country: 'Kenya',
      roles: [role || 'farmer'],
      is_active: true,
      is_blocked: false,
      is_verified: false
    };

    if (existing) {
      await db.from('profiles').update(profileData).eq('id', uid);
    } else {
      const ins = await db.from('profiles').insert(profileData);
      if (ins.error) {
        console.error('Profile insert error:', ins.error);
      }
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
  if (!s) {
    window.location.href = 'login.html';
    return null;
  }
  return s;
}

async function getMyProfile() {
  const s = await getSession();
  if (!s) return null;
  const r = await db
    .from('profiles')
    .select('*')
    .eq('id', s.user.id)
    .maybeSingle();
  if (r.error) throw r.error;
  return r.data;
}

// ---------- Public reads ----------
async function getPublicProducts() {
  const r = await db
    .from('products')
    .select('id, title, category, price, currency, quantity, unit, county, location, country, status, is_featured, created_at, seller_id, seller_name, seller_phone, image_url')
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

async function getPublicSettings() {
  const r = await db.from('settings').select('*').eq('id', 1).maybeSingle();
  if (r.error) throw r.error;
  return r.data;
}
