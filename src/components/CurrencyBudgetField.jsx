import { useState, useMemo, useEffect } from 'react';

// ── Currency list ─────────────────────────────────────────────────────────────
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar',           symbol: '$'    },
  { code: 'EUR', name: 'Euro',                symbol: '€'    },
  { code: 'GBP', name: 'British Pound',       symbol: '£'    },
  { code: 'JPY', name: 'Japanese Yen',        symbol: '¥'    },
  { code: 'AUD', name: 'Australian Dollar',   symbol: 'A$'   },
  { code: 'CAD', name: 'Canadian Dollar',     symbol: 'C$'   },
  { code: 'CHF', name: 'Swiss Franc',         symbol: 'Fr'   },
  { code: 'CNY', name: 'Chinese Yuan',        symbol: '¥'    },
  { code: 'HKD', name: 'Hong Kong Dollar',    symbol: 'HK$'  },
  { code: 'SGD', name: 'Singapore Dollar',    symbol: 'S$'   },
  { code: 'MYR', name: 'Malaysian Ringgit',   symbol: 'RM'   },
  { code: 'THB', name: 'Thai Baht',           symbol: '฿'    },
  { code: 'IDR', name: 'Indonesian Rupiah',   symbol: 'Rp'   },
  { code: 'PHP', name: 'Philippine Peso',     symbol: '₱'    },
  { code: 'VND', name: 'Vietnamese Dong',     symbol: '₫'    },
  { code: 'KRW', name: 'South Korean Won',    symbol: '₩'    },
  { code: 'TWD', name: 'Taiwan Dollar',       symbol: 'NT$'  },
  { code: 'INR', name: 'Indian Rupee',        symbol: '₹'    },
  { code: 'PKR', name: 'Pakistani Rupee',     symbol: '₨'    },
  { code: 'BDT', name: 'Bangladeshi Taka',    symbol: '৳'    },
  { code: 'LKR', name: 'Sri Lankan Rupee',    symbol: 'Rs'   },
  { code: 'NPR', name: 'Nepalese Rupee',      symbol: 'Rs'   },
  { code: 'MMK', name: 'Myanmar Kyat',        symbol: 'K'    },
  { code: 'KHR', name: 'Cambodian Riel',      symbol: '៛'    },
  { code: 'LAK', name: 'Lao Kip',             symbol: '₭'    },
  { code: 'BND', name: 'Brunei Dollar',       symbol: 'B$'   },
  { code: 'MVR', name: 'Maldivian Rufiyaa',   symbol: 'Rf'   },
  { code: 'NZD', name: 'New Zealand Dollar',  symbol: 'NZ$'  },
  { code: 'SEK', name: 'Swedish Krona',       symbol: 'kr'   },
  { code: 'NOK', name: 'Norwegian Krone',     symbol: 'kr'   },
  { code: 'DKK', name: 'Danish Krone',        symbol: 'kr'   },
  { code: 'ZAR', name: 'South African Rand',  symbol: 'R'    },
  { code: 'BRL', name: 'Brazilian Real',      symbol: 'R$'   },
  { code: 'MXN', name: 'Mexican Peso',        symbol: 'MX$'  },
  { code: 'AED', name: 'UAE Dirham',          symbol: 'AED'  },
  { code: 'SAR', name: 'Saudi Riyal',         symbol: 'SAR'  },
  { code: 'TRY', name: 'Turkish Lira',        symbol: '₺'    },
  { code: 'RUB', name: 'Russian Ruble',       symbol: '₽'    },
  { code: 'PLN', name: 'Polish Zloty',        symbol: 'zł'   },
  { code: 'CZK', name: 'Czech Koruna',        symbol: 'Kč'   },
  { code: 'HUF', name: 'Hungarian Forint',    symbol: 'Ft'   },
  { code: 'RON', name: 'Romanian Leu',        symbol: 'lei'  },
  { code: 'ILS', name: 'Israeli Shekel',      symbol: '₪'    },
  { code: 'EGP', name: 'Egyptian Pound',      symbol: 'E£'   },
  { code: 'NGN', name: 'Nigerian Naira',      symbol: '₦'    },
  { code: 'KES', name: 'Kenyan Shilling',     symbol: 'Ksh'  },
  { code: 'GHS', name: 'Ghanaian Cedi',       symbol: '₵'    },
  { code: 'MAD', name: 'Moroccan Dirham',     symbol: 'MAD'  },
  { code: 'CLP', name: 'Chilean Peso',        symbol: 'CLP$' },
  { code: 'COP', name: 'Colombian Peso',      symbol: 'COP$' },
  { code: 'PEN', name: 'Peruvian Sol',        symbol: 'S/.'  },
  { code: 'ARS', name: 'Argentine Peso',      symbol: 'AR$'  },
];

// Currencies where we show no decimal places
const NO_DECIMAL = ['JPY', 'KRW', 'VND', 'IDR', 'KHR', 'LAK', 'MMK', 'HUF', 'CLP', 'COP'];

// ── Parchment design tokens ───────────────────────────────────────────────────
const T = {
  bg:     '#f0e8d8',
  card:   '#faf6ef',
  border: '#d4c4a8',
  text:   '#2c1a0e',
  text2:  '#7a6048',
  text3:  '#a89070',
  purple: '#7b6eb0',
  gold:   '#c4922a',
  navy:   '#6b7cb5',
  font:   "'Crimson Text', Georgia, serif",
};

// ── Exported helper — used in display cards ───────────────────────────────────
export function formatBudget(amount, currency) {
  if (!amount || Number(amount) <= 0) return null;
  const num = Number(amount);
  const curr = CURRENCIES.find(c => c.code === currency);
  if (!currency || !curr) return num.toLocaleString();
  const formatted = NO_DECIMAL.includes(currency)
    ? Math.round(num).toLocaleString()
    : num % 1 === 0
      ? num.toLocaleString()
      : parseFloat(num.toFixed(2)).toLocaleString();
  return `${currency} ${curr.symbol}${formatted}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CurrencyBudgetField({ amount, currency, onChange }) {
  const [currModal,     setCurrModal]     = useState(null);
  const [currSearch,    setCurrSearch]    = useState('');
  const [showConverter, setShowConverter] = useState(false);

  // Converter state
  const [fromAmt,     setFromAmt]     = useState('');
  const [fromCurr,    setFromCurr]    = useState(currency === 'USD' ? 'EUR' : 'USD');
  const [toCurr,      setToCurr]      = useState(currency);
  const [rates,       setRates]       = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError,   setRateError]   = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!currModal) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [currModal]);

  // Sync toCurr when converter first opens
  useEffect(() => {
    if (showConverter) setToCurr(currency);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConverter]);

  // Fetch exchange rates whenever converter is open + fromCurr changes
  useEffect(() => {
    if (!showConverter) return;
    setRateLoading(true);
    setRateError(false);
    setRates(null);
    fetch(`https://open.er-api.com/v6/latest/${fromCurr}`)
      .then(r => r.json())
      .then(data => {
        if (data.result === 'success') setRates(data.rates);
        else setRateError(true);
      })
      .catch(() => setRateError(true))
      .finally(() => setRateLoading(false));
  }, [fromCurr, showConverter]);

  const convertedRaw = useMemo(() => {
    if (!rates || !fromAmt || isNaN(Number(fromAmt)) || Number(fromAmt) <= 0) return null;
    const rate = rates[toCurr];
    if (!rate) return null;
    return Number(fromAmt) * rate;
  }, [rates, fromAmt, toCurr]);

  const formattedConverted = useMemo(() => {
    if (convertedRaw === null) return null;
    return NO_DECIMAL.includes(toCurr)
      ? Math.round(convertedRaw).toLocaleString()
      : parseFloat(convertedRaw.toFixed(2)).toLocaleString();
  }, [convertedRaw, toCurr]);

  const rateInfo = useMemo(() => {
    if (!rates || !rates[toCurr]) return null;
    const r = rates[toCurr];
    const rStr = r >= 1000 ? Math.round(r).toLocaleString()
               : r >= 1    ? parseFloat(r.toFixed(4)).toLocaleString()
               :              parseFloat(r.toFixed(6)).toString();
    return `1 ${fromCurr} ≈ ${rStr} ${toCurr}`;
  }, [rates, fromCurr, toCurr]);

  const filteredCurrencies = useMemo(() => {
    if (!currSearch.trim()) return CURRENCIES;
    const q = currSearch.toLowerCase();
    return CURRENCIES.filter(c =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [currSearch]);

  const selectedCurr = CURRENCIES.find(c => c.code === currency) || { code: currency, symbol: currency, name: '' };
  const fromCurrObj  = CURRENCIES.find(c => c.code === fromCurr) || { code: fromCurr, symbol: fromCurr, name: '' };
  const toCurrObj    = CURRENCIES.find(c => c.code === toCurr)   || { code: toCurr,   symbol: toCurr,   name: '' };

  const handleCurrencySelect = (code) => {
    if (currModal === 'main') onChange(amount, code);
    else if (currModal === 'from') setFromCurr(code);
    else if (currModal === 'to')   setToCurr(code);
    setCurrModal(null);
    setCurrSearch('');
  };

  const handleUseResult = () => {
    if (convertedRaw === null) return;
    const finalAmt = NO_DECIMAL.includes(toCurr)
      ? String(Math.round(convertedRaw))
      : convertedRaw.toFixed(2);
    onChange(finalAmt, toCurr);
    setShowConverter(false);
  };

  // ── Shared style snippets ────────────────────────────────────────────────────
  const fieldInput = {
    flex: 1,
    background: T.bg,
    border: `1.5px solid ${T.border}`,
    borderRadius: 10,
    padding: '10px 12px',
    color: T.text,
    fontSize: 13,
    outline: 'none',
    fontFamily: T.font,
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const currencyBtn = (active) => ({
    background: active ? `${T.purple}12` : T.bg,
    border: `1.5px solid ${active ? T.purple + '50' : T.border}`,
    borderRadius: 10,
    padding: '0 14px',
    color: active ? T.purple : T.text2,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    height: 42,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    fontFamily: T.font,
    fontSize: 13,
    transition: 'all 0.15s',
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Main row: currency selector + amount ── */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => { setCurrModal('main'); setCurrSearch(''); }}
          style={currencyBtn(currModal === 'main')}
        >
          <span style={{ fontSize: 13 }}>{selectedCurr.symbol}</span>
          <span>{selectedCurr.code}</span>
          <span style={{ fontSize: 9, color: T.text3, marginLeft: 1 }}>▾</span>
        </button>
        <input
          type="number"
          placeholder="0"
          value={amount}
          onChange={e => onChange(e.target.value, currency)}
          min="0"
          style={fieldInput}
        />
      </div>

      {/* ── Converter toggle ── */}
      <button
        type="button"
        onClick={() => setShowConverter(o => !o)}
        style={{
          marginTop: 8,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          background: showConverter ? `${T.gold}10` : 'transparent',
          border: `1.5px dashed ${showConverter ? T.gold + '60' : T.border}`,
          borderRadius: 10,
          padding: '8px 12px',
          color: showConverter ? T.gold : T.text3,
          fontSize: 12,
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontFamily: T.font,
        }}
      >
        <span>🔄</span>
        <span>{showConverter ? 'Hide currency converter' : 'Use currency converter'}</span>
      </button>

      {/* ── Converter panel ── */}
      {showConverter && (
        <div style={{
          marginTop: 10,
          background: T.card,
          border: `1.5px solid ${T.border}`,
          borderRadius: 14,
          padding: 14,
        }}>
          <p style={{ margin: '0 0 12px', fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontFamily: T.font }}>
            Currency Converter
          </p>

          {/* FROM */}
          <p style={{ margin: '0 0 6px', fontSize: 11, color: T.text3, fontFamily: T.font }}>I have</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => { setCurrModal('from'); setCurrSearch(''); }}
              style={currencyBtn(currModal === 'from')}
            >
              <span style={{ fontSize: 12 }}>{fromCurrObj.symbol}</span>
              <span>{fromCurr}</span>
              <span style={{ fontSize: 9, color: T.text3 }}>▾</span>
            </button>
            <input
              type="number"
              placeholder="0"
              value={fromAmt}
              onChange={e => setFromAmt(e.target.value)}
              min="0"
              style={fieldInput}
            />
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ color: T.text3, fontSize: 16 }}>↓</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          {/* TO */}
          <p style={{ margin: '0 0 6px', fontSize: 11, color: T.text3, fontFamily: T.font }}>I want to save as</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: rateInfo ? 8 : 12 }}>
            <button
              type="button"
              onClick={() => { setCurrModal('to'); setCurrSearch(''); }}
              style={currencyBtn(currModal === 'to')}
            >
              <span style={{ fontSize: 12 }}>{toCurrObj.symbol}</span>
              <span>{toCurr}</span>
              <span style={{ fontSize: 9, color: T.text3 }}>▾</span>
            </button>

            {/* Result display */}
            <div style={{
              flex: 1,
              background: T.bg,
              border: `1.5px solid ${convertedRaw !== null ? T.gold + '60' : T.border}`,
              borderRadius: 10,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              minHeight: 42,
              boxSizing: 'border-box',
            }}>
              {rateLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${T.border}`, borderTopColor: T.purple, animation: 'cbf-spin 0.7s linear infinite', flexShrink: 0 }} />
                  <span style={{ color: T.text3, fontSize: 12, fontFamily: T.font }}>Fetching rates…</span>
                </div>
              ) : rateError ? (
                <span style={{ color: '#c4809a', fontSize: 12, fontFamily: T.font }}>Rate unavailable</span>
              ) : formattedConverted !== null ? (
                <span style={{ color: T.gold, fontSize: 15, fontWeight: 700, fontFamily: T.font }}>
                  {toCurrObj.symbol}&thinsp;{formattedConverted}
                </span>
              ) : (
                <span style={{ color: T.text3, fontSize: 13, fontFamily: T.font }}>—</span>
              )}
            </div>
          </div>

          {/* Rate label */}
          {rateInfo && (
            <p style={{ margin: '0 0 12px', fontSize: 11, color: T.text3, textAlign: 'center', fontFamily: T.font }}>
              {rateInfo}
            </p>
          )}

          {/* Save button */}
          {convertedRaw !== null && (
            <button
              type="button"
              onClick={handleUseResult}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 10,
                background: `${T.gold}14`,
                border: `1.5px solid ${T.gold}50`,
                color: T.gold,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: T.font,
              }}
            >
              ✓ &nbsp;Save as {toCurr}&nbsp;{toCurrObj.symbol}{formattedConverted}
            </button>
          )}
        </div>
      )}

      {/* ── Currency picker bottom-sheet modal ── */}
      {currModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(44,26,14,0.45)', pointerEvents: 'all' }}
            onClick={() => { setCurrModal(null); setCurrSearch(''); }}
          />

          {/* Sheet */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 430,
            background: T.card,
            borderRadius: '20px 20px 0 0',
            border: `1.5px solid ${T.border}`,
            borderBottom: 'none',
            maxHeight: '72vh',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'all',
            boxShadow: '0 -4px 24px rgba(44,26,14,0.1)',
          }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 6, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
            </div>

            {/* Header */}
            <div style={{ padding: '0 16px 12px', borderBottom: `1px solid ${T.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ margin: 0, color: T.text, fontWeight: 700, fontSize: 15, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {currModal === 'main' ? 'Save budget in' : currModal === 'from' ? 'Convert from' : 'Convert to'}
              </p>
              <button
                onClick={() => { setCurrModal(null); setCurrSearch(''); }}
                style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}
              >✕</button>
            </div>

            {/* Search */}
            <div style={{ padding: 12, flexShrink: 0 }}>
              <input
                type="text"
                placeholder="Search currency or code…"
                value={currSearch}
                onChange={e => setCurrSearch(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  background: T.bg,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: T.text,
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: T.font,
                }}
              />
            </div>

            {/* Currency list */}
            <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
              {filteredCurrencies.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <p style={{ color: T.text3, fontSize: 13, margin: 0, fontFamily: T.font }}>No currencies found</p>
                </div>
              ) : filteredCurrencies.map((c, i) => {
                const isSelected =
                  currModal === 'main' ? c.code === currency :
                  currModal === 'from' ? c.code === fromCurr :
                  c.code === toCurr;
                return (
                  <button
                    key={c.code}
                    onClick={() => handleCurrencySelect(c.code)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 16px',
                      background: isSelected ? `${T.purple}10` : 'transparent',
                      border: 'none',
                      borderBottom: i < filteredCurrencies.length - 1 ? `1px solid ${T.border}40` : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                  >
                    <span style={{ color: isSelected ? T.purple : T.text2, fontSize: 13, fontWeight: 700, width: 40, flexShrink: 0, fontFamily: T.font }}>
                      {c.code}
                    </span>
                    <span style={{ color: T.text2, fontSize: 13, flex: 1, fontFamily: T.font }}>{c.name}</span>
                    <span style={{ color: isSelected ? T.purple : T.text3, fontSize: 13, fontWeight: 600, flexShrink: 0, fontFamily: T.font }}>
                      {c.symbol}
                    </span>
                    {isSelected && (
                      <span style={{ color: T.purple, fontSize: 13, flexShrink: 0 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes cbf-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
