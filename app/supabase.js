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
