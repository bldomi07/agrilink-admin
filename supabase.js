// ============================================
// AgriLink Admin Centre — Supabase Connection
// ============================================
// ⚠️ These two values are SAFE to be in the browser
// as long as Row Level Security (RLS) is ON — which it is.
// NEVER paste your service_role key here.

const SUPABASE_URL = 'https://uwrktkusglldbmezepya.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ji1ivwRE1mtYGl9HcjKkXg_JdT4Msss';

// Load Supabase client from CDN
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// ---------- Auth helpers ----------
async function login(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function logout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}

async function getSession() {
  const { data } = await db.auth.getSession();
  return data.session;
}

// Redirect to login if not signed in
async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

// ---------- Admin check ----------
async function isAdmin() {
  const session = await getSession();
  if (!session) return false;
  const { data, error } = await db
    .from('admin_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

// ---------- Data helpers ----------
async function getSettings() {
  const { data, error } = await db.from('settings').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  return data;
}

async function getAdmins() {
  const { data, error } = await db.from('admin_roles').select('*');
  if (error) throw error;
  return data;
}

async function getProfiles() {
  const { data, error } = await db
    .from('profiles')
    .select('id, full_name, user_name, phone, email, county, roles, is_active, created_at');
  if (error) throw error;
  return data;
}
