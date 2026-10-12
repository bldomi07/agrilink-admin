// ============================================
// AgriLink Admin Centre — Supabase Connection
// ============================================
// These two values are SAFE to be in the browser
// as long as Row Level Security (RLS) is ON.
// NEVER paste your service_role key here.

const SUPABASE_URL = 'https://uwrktkusglldbmezepya.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ji1ivwRE1mtYGl9HcjKkXg_JdT4Msss';

// Supabase client
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

// ---------- Auth helpers ----------
async function login(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function logout() {
  try { await db.auth.signOut(); } catch (e) {}
  window.location.href = 'index.html';
}

async function getSession() {
  const { data } = await db.auth.getSession();
  return data.session;
}

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

// ---------- Settings ----------
async function getSettings() {
  const { data, error } = await db
    .from('settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function updateSettings(updates) {
  const session = await getSession();
  if (!session) throw new Error('Not signed in');

  const { data, error } = await db
    .from('settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: session.user.id
    })
    .eq('id', 1)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Update was blocked. RLS policy may be missing.');
  }
  return data[0];
}

// ---------- Admins ----------
async function getAdmins() {
  const { data, error } = await db.from('admin_roles').select('*');
  if (error) throw error;
  return data;
}

// ---------- Profiles ----------
async function getProfiles() {
  const { data, error } = await db
    .from('profiles')
    .select('id, full_name, user_name, phone, email, county, roles, is_active, created_at');
  if (error) throw error;
  return data;
}
