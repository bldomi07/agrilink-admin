// AgriLink — location engine (web port of APK)

const COUNTRIES = [
  { c:'ke', n:'Kenya' },{ c:'af', n:'Afghanistan' },
  { c:'ug', n:'Uganda' },{ c:'tz', n:'Tanzania' },{ c:'rw', n:'Rwanda' },
  { c:'bi', n:'Burundi' },{ c:'ss', n:'South Sudan' },{ c:'et', n:'Ethiopia' },
  { c:'so', n:'Somalia' },{ c:'sd', n:'Sudan' },{ c:'dj', n:'Djibouti' },
  { c:'er', n:'Eritrea' },{ c:'eg', n:'Egypt' },{ c:'ly', n:'Libya' },
  { c:'tn', n:'Tunisia' },{ c:'dz', n:'Algeria' },{ c:'ma', n:'Morocco' },
  { c:'ng', n:'Nigeria' },{ c:'gh', n:'Ghana' },{ c:'za', n:'South Africa' },
  { c:'sn', n:'Senegal' },{ c:'ml', n:'Mali' },{ c:'bf', n:'Burkina Faso' },
  { c:'ne', n:'Niger' },{ c:'td', n:'Chad' },{ c:'cm', n:'Cameroon' },
  { c:'ci', n:"Cote d'Ivoire" },{ c:'gn', n:'Guinea' },{ c:'bj', n:'Benin' },
  { c:'tg', n:'Togo' },{ c:'sl', n:'Sierra Leone' },{ c:'lr', n:'Liberia' },
  { c:'mr', n:'Mauritania' },{ c:'gm', n:'Gambia' },{ c:'gw', n:'Guinea-Bissau' },
  { c:'cv', n:'Cabo Verde' },{ c:'st', n:'Sao Tome' },{ c:'ga', n:'Gabon' },
  { c:'cg', n:'Congo' },{ c:'cd', n:'DR Congo' },{ c:'cf', n:'Central African Rep.' },
  { c:'gq', n:'Equatorial Guinea' },{ c:'ao', n:'Angola' },{ c:'zm', n:'Zambia' },
  { c:'zw', n:'Zimbabwe' },{ c:'mw', n:'Malawi' },{ c:'mz', n:'Mozambique' },
  { c:'mg', n:'Madagascar' },{ c:'mu', n:'Mauritius' },{ c:'sc', n:'Seychelles' },
  { c:'km', n:'Comoros' },{ c:'bw', n:'Botswana' },{ c:'na', n:'Namibia' },
  { c:'ls', n:'Lesotho' },{ c:'sz', n:'Eswatini' },
  { c:'us', n:'United States' },{ c:'gb', n:'United Kingdom' },{ c:'ca', n:'Canada' },
  { c:'au', n:'Australia' },{ c:'in', n:'India' },{ c:'cn', n:'China' },
  { c:'jp', n:'Japan' },{ c:'kr', n:'South Korea' },{ c:'ae', n:'United Arab Emirates' },
  { c:'sa', n:'Saudi Arabia' },{ c:'qa', n:'Qatar' },{ c:'tr', n:'Turkey' },
  { c:'de', n:'Germany' },{ c:'fr', n:'France' },{ c:'it', n:'Italy' },
  { c:'es', n:'Spain' },{ c:'nl', n:'Netherlands' },{ c:'be', n:'Belgium' },
  { c:'ch', n:'Switzerland' },{ c:'se', n:'Sweden' },{ c:'no', n:'Norway' },
  { c:'dk', n:'Denmark' },{ c:'ie', n:'Ireland' },{ c:'pt', n:'Portugal' },
  { c:'gr', n:'Greece' },{ c:'pl', n:'Poland' },{ c:'ru', n:'Russia' },
  { c:'br', n:'Brazil' },{ c:'ar', n:'Argentina' },{ c:'mx', n:'Mexico' },
  { c:'cl', n:'Chile' }
];

const KENYA_URL = 'https://raw.githubusercontent.com/open-admin-data/kenya-administrative-divisions/master/data/hierarchy.json';
const AF_URL = 'https://raw.githubusercontent.com/open-admin-data/afghanistan-administrative-divisions/main/data/hierarchy.json';
const GEONAMES_USER = 'agrilink';
const CACHE_DAYS = 30;

async function httpJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Network error ' + r.status);
  return r.json();
}

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o && o.t && (Date.now() - o.t) < CACHE_DAYS * 86400000) return o.d;
  } catch (e) {}
  return null;
}
function cacheSet(key, d) {
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
}

async function loadKenyaHierarchy() {
  const c = cacheGet('agrilink_ke_v1');
  if (c) return c;
  const j = await httpJson(KENYA_URL);
  const counties = Array.isArray(j) ? j : (j.data || j.counties || []);
  cacheSet('agrilink_ke_v1', counties);
  return counties;
}

async function loadAfghanistanHierarchy() {
  const c = cacheGet('agrilink_af_v1');
  if (c) return c;
  const j = await httpJson(AF_URL);
  const provinces = Array.isArray(j) ? j : (j.data || j.provinces || []);
  cacheSet('agrilink_af_v1', provinces);
  return provinces;
}

function geoName(o) {
  if (!o) return '';
  const n = o.name;
  if (n && typeof n === 'object') return n.en || n.local || '';
  if (typeof n === 'string') return n;
  return o.name_en || '';
}

function geoChildrenOf(county) {
  if (!county) return [];
  return county.subcounty || county.sub_county || county.subcounties || [];
}
function wardListOf(sub) {
  if (!sub) return [];
  return sub.ward || sub.wards || [];
}

// GeoNames
async function geoChildren(geonameId) {
  const j = await httpJson('https://secure.geonames.org/childrenJSON?geonameId=' + geonameId + '&username=' + GEONAMES_USER);
  return j.geonames || [];
}
async function geoCountryInfo(code) {
  const j = await httpJson('https://secure.geonames.org/countryInfoJSON?country=' + code + '&username=' + GEONAMES_USER);
  return (j.geonames || [])[0] || null;
}

function populateCountries(selectEl, selectedCode) {
  let html = '<option value="">— choose country —</option>';
  COUNTRIES.forEach(c => {
    html += '<option value="' + c.c + '"' + (c.c === selectedCode ? ' selected' : '') + '>' + escHtml(c.n) + '</option>';
  });
  selectEl.innerHTML = html;
}

function fillSelect(selectEl, items, selected, placeholder) {
  let html = '<option value="">' + (placeholder || '— choose —') + '</option>';
  items.forEach(x => {
    const v = x.value != null ? x.value : x;
    const l = x.label != null ? x.label : x;
    html += '<option value="' + escAttr(v) + '"' + (v === selected ? ' selected' : '') + '>' + escHtml(l) + '</option>';
  });
  selectEl.innerHTML = html;
}

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) { return escHtml(s); }
