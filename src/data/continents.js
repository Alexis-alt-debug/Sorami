// alpha2 ISO code → continent name
export const ALPHA2_CONTINENT = {
  // ── Africa ──────────────────────────────────────────────────────────────────
  DZ:'Africa', AO:'Africa', BJ:'Africa', BW:'Africa', BF:'Africa', BI:'Africa',
  CM:'Africa', CV:'Africa', CF:'Africa', TD:'Africa', KM:'Africa', CG:'Africa',
  CD:'Africa', CI:'Africa', DJ:'Africa', EG:'Africa', GQ:'Africa', ER:'Africa',
  ET:'Africa', GA:'Africa', GM:'Africa', GH:'Africa', GN:'Africa', GW:'Africa',
  KE:'Africa', LS:'Africa', LR:'Africa', LY:'Africa', MG:'Africa', MW:'Africa',
  ML:'Africa', MR:'Africa', MU:'Africa', MA:'Africa', MZ:'Africa', NA:'Africa',
  NE:'Africa', NG:'Africa', RW:'Africa', ST:'Africa', SN:'Africa', SL:'Africa',
  SO:'Africa', ZA:'Africa', SS:'Africa', SD:'Africa', SZ:'Africa', TZ:'Africa',
  TG:'Africa', TN:'Africa', UG:'Africa', ZM:'Africa', ZW:'Africa',
  EH:'Africa', YT:'Africa', RE:'Africa', SC:'Africa',

  // ── Asia ─────────────────────────────────────────────────────────────────────
  AF:'Asia', AM:'Asia', AZ:'Asia', BH:'Asia', BD:'Asia', BT:'Asia', BN:'Asia',
  KH:'Asia', CN:'Asia', GE:'Asia', IN:'Asia', ID:'Asia', IR:'Asia', IQ:'Asia',
  IL:'Asia', JP:'Asia', JO:'Asia', KZ:'Asia', KW:'Asia', KG:'Asia', LA:'Asia',
  LB:'Asia', MY:'Asia', MV:'Asia', MN:'Asia', MM:'Asia', NP:'Asia', KP:'Asia',
  OM:'Asia', PK:'Asia', PS:'Asia', PH:'Asia', QA:'Asia', SA:'Asia', SG:'Asia',
  KR:'Asia', LK:'Asia', SY:'Asia', TW:'Asia', TJ:'Asia', TH:'Asia', TL:'Asia',
  TR:'Asia', TM:'Asia', AE:'Asia', UZ:'Asia', VN:'Asia', YE:'Asia',

  // ── Europe ───────────────────────────────────────────────────────────────────
  AL:'Europe', AD:'Europe', AT:'Europe', BY:'Europe', BE:'Europe', BA:'Europe',
  BG:'Europe', HR:'Europe', CY:'Europe', CZ:'Europe', DK:'Europe', EE:'Europe',
  FI:'Europe', FR:'Europe', DE:'Europe', GR:'Europe', HU:'Europe', IS:'Europe',
  IE:'Europe', IT:'Europe', XK:'Europe', LV:'Europe', LI:'Europe', LT:'Europe',
  LU:'Europe', MT:'Europe', MD:'Europe', MC:'Europe', ME:'Europe', NL:'Europe',
  MK:'Europe', NO:'Europe', PL:'Europe', PT:'Europe', RO:'Europe', RU:'Europe',
  SM:'Europe', RS:'Europe', SK:'Europe', SI:'Europe', ES:'Europe', SE:'Europe',
  CH:'Europe', UA:'Europe', GB:'Europe', VA:'Europe',

  // ── North America (incl. Central America & Caribbean) ───────────────────────
  AG:'N. America', BS:'N. America', BB:'N. America', BZ:'N. America',
  CA:'N. America', CR:'N. America', CU:'N. America', DM:'N. America',
  DO:'N. America', SV:'N. America', GD:'N. America', GT:'N. America',
  HT:'N. America', HN:'N. America', JM:'N. America', MX:'N. America',
  NI:'N. America', PA:'N. America', KN:'N. America', LC:'N. America',
  VC:'N. America', TT:'N. America', US:'N. America', BM:'N. America',
  KY:'N. America', TC:'N. America', VI:'N. America', PR:'N. America',

  // ── South America ────────────────────────────────────────────────────────────
  AR:'S. America', BO:'S. America', BR:'S. America', CL:'S. America',
  CO:'S. America', EC:'S. America', GY:'S. America', PY:'S. America',
  PE:'S. America', SR:'S. America', UY:'S. America', VE:'S. America',
  FK:'S. America', GF:'S. America',

  // ── Oceania ──────────────────────────────────────────────────────────────────
  AU:'Oceania', FJ:'Oceania', KI:'Oceania', MH:'Oceania', FM:'Oceania',
  NR:'Oceania', NZ:'Oceania', PW:'Oceania', PG:'Oceania', WS:'Oceania',
  SB:'Oceania', TO:'Oceania', TV:'Oceania', VU:'Oceania', CK:'Oceania',
  NC:'Oceania', PF:'Oceania',
};

export const CONTINENT_META = {
  'Africa':     { emoji: '🌍', color: '#f59e0b' },
  'Asia':       { emoji: '🌏', color: '#06b6d4' },
  'Europe':     { emoji: '🏛️',  color: '#8b5cf6' },
  'N. America': { emoji: '🌎', color: '#22c55e' },
  'S. America': { emoji: '🌿', color: '#10b981' },
  'Oceania':    { emoji: '🌊', color: '#3b82f6' },
};

// Display order
export const CONTINENT_ORDER = ['Asia', 'Europe', 'Africa', 'N. America', 'S. America', 'Oceania'];
