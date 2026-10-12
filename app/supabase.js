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
async function createProduct(data) {
  const s = await getSession();
  if (!s) throw new Error('You must be logged in.');

  // Grab seller info from their profile
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
// ---------- My products ----------
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
  const r = await db
    .from('products')
    .delete()
    .eq('id', id)
    .eq('seller_id', s.user.id);
  if (r.error) throw r.error;
  return true;
}

async function markMyProductSold(id) {
  const s = await getSession();
  if (!s) throw new Error('Not signed in');
  const r = await db
    .from('products')
    .update({ status: 'sold', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('seller_id', s.user.id)
    .select();
  if (r.error) throw r.error;
  if (!r.data || r.data.length === 0) throw new Error('Update blocked');
  return r.data[0];
}
// ---------- Reports ----------
async function createReport({ target_type, target_id, reason, details }) {
  const s = await getSession();
  if (!s) throw new Error('You must be logged in to report.');
  const row = {
    reporter_id: s.user.id,
    target_type: target_type,
    target_id: target_id,
    reason: reason,
    details: details || null,
    status: 'open'
  };
  const r = await db.from('reports').insert(row).select().single();
  if (r.error) throw r.error;
  return r.data;
}
