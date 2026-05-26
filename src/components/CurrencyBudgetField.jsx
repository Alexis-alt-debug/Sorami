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

// ── Exported helper — used in display cards ───────────────────────────────────
export function formatBudget(amount, currency) {
  if (!amount || Number(amount) <= 0) return null;
  const num = Number(amount);
  const curr = CURRENCIES.find(c => c.code === currency);
  if (!currency || !curr) {
    // Backward-compat: old records without currency
    return num.toLocaleString();
  }
  const formatted = NO_DECIMAL.includes(currency)
    ? Math.round(num).toLocaleString()
    : num % 1 === 0
      ? num.toLocaleString()
      : parseFloat(num.toFixed(2)).toLocaleString();
  return `${currency} ${curr.symbol}${formatted}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * CurrencyBudgetField
 *
 * Props:
 *   amount:    string   – current amount ("" when empty)
 *   currency:  string   – 3-letter code, e.g. "USD"
 *   onChange:  (amount: string, currency: string) => void
 *   inputBg:   string   – background colour for inputs (default '#1e293b')
 */
export default function CurrencyBudgetField({
  amount,
  currency,
  onChange,
  inputBg = '#1e293b',
}) {
  // 'main' | 'from' | 'to' | null  →  which picker sheet is open
  const [currModal,     setCurrModal]     = useState(null);
  const [currSearch,    setCurrSearch]    = useState('');
  const [showConverter, setShowConverter] = useState(false);

  // Converter state
  const [fromAmt,      setFromAmt]      = useState('');
  const [fromCurr,     setFromCurr]     = useState(currency === 'USD' ? 'EUR' : 'USD');
  const [toCurr,       setToCurr]       = useState(currency);
  const [rates,        setRates]        = useState(null);
  const [rateLoading,  setRateLoading]  = useState(false);
  const [rateError,    setRateError]    = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!currModal) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [currModal]);

  // Sync toCurr when converter first opens
  useEffect(() => {
    if (showConverter) setToCurr(currency);
  }, [showConverter]); // intentionally NOT including `currency` to avoid reset mid-conversion

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

  // Computed conversion result
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

  // Exchange rate label
  const rateInfo = useMemo(() => {
    if (!rates || !rates[toCurr]) return null;
    const r = rates[toCurr];
    const rStr = r >= 1000 ? Math.round(r).toLocaleString()
               : r >= 1    ? parseFloat(r.toFixed(4)).toLocaleString()
               :              parseFloat(r.toFixed(6)).toString();
    return `1 ${fromCurr} ≈ ${rStr} ${toCurr}`;
  }, [rates, fromCurr, toCurr]);

  // Filtered list for the picker modal
  const filteredCurrencies = useMemo(() => {
    if (!currSearch.trim()) return CURRENCIES;
    const q = currSearch.toLowerCase();
    return CURRENCIES.filter(c =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [currSearch]);

  // Lookup helpers
  const selectedCurr = CURRENCIES.find(c => c.code === currency)  || { code: currency,  symbol: currency,  name: '' };
  const fromCurrObj  = CURRENCIES.find(c => c.code === fromCurr)  || { code: fromCurr,  symbol: fromCurr,  name: '' };
  const toCurrObj    = CURRENCIES.find(c => c.code === toCurr)    || { code: toCurr,    symbol: toCurr,    name: '' };

  // ── Handlers ────────────────────────────────────────────────────────────────
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

  // ── Shared styles ────────────────────────────────────────────────────────────
  const baseInput = {
    background: inputBg,
    border: '1px solid #334155',
    borderRadius: 12,
    padding: '12px 14px',
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
    boxSizing: 'border-box',
  };

  const currBtn = {
    background: inputBg,
    border: '1px solid #334155',
    borderRadius: 12,
    padding: '0 14px',
    color: '#e2e8f0',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    height: 48,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    transition: 'border-color 0.15s',
  };

  const smCurrBtn = {
    ...currBtn,
    background: '#1e293b',
    borderRadius: 10,
    height: 44,
    fontSize: 13,
  };

  const smInput = {
    ...baseInput,
    background: '#1e293b',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Main row: currency selector + amount ── */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => { setCurrModal('main'); setCurrSearch(''); }}
          style={currBtn}
        >
          <span style={{ fontSize: 14 }}>{selectedCurr.symbol}</span>
          <span style={{ fontSize: 13 }}>{selectedCurr.code}</span>
          <span style={{ fontSize: 9, color: '#64748b' }}>▾</span>
        </button>
        <input
          type="number"
          placeholder="0"
          value={amount}
          onChange={e => onChange(e.target.value, currency)}
          min="0"
          style={{ flex: 1, ...baseInput }}
        />
      </div>

      {/* ── Converter toggle button ── */}
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
          background: showConverter ? 'rgba(6,182,212,0.08)' : 'transparent',
          border: `1px dashed ${showConverter ? 'rgba(6,182,212,0.4)' : '#475569'}`,
          borderRadius: 10,
          padding: '8px 12px',
          color: showConverter ? '#a78bfa' : '#64748b',
          fontSize: 12,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <span>🔄</span>
        <span>{showConverter ? 'Hide currency converter' : 'Use currency converter'}</span>
      </button>

      {/* ── Converter panel ── */}
      {showConverter && (
        <div style={{
          marginTop: 10,
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 14,
          padding: 14,
        }}>
          <p style={{
            margin: '0 0 14px', fontSize: 11, color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
          }}>
            Currency Converter
          </p>

          {/* FROM */}
          <p style={{ margin: '0 0 6px', fontSize: 11, color: '#64748b' }}>I have</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => { setCurrModal('from'); setCurrSearch(''); }}
              style={smCurrBtn}
            >
              <span style={{ fontSize: 12 }}>{fromCurrObj.symbol}</span>
              <span>{fromCurr}</span>
              <span style={{ fontSize: 9, color: '#64748b' }}>▾</span>
            </button>
            <input
              type="number"
              placeholder="0"
              value={fromAmt}
              onChange={e => setFromAmt(e.target.value)}
              min="0"
              style={{ flex: 1, ...smInput }}
            />
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
            <span style={{ color: '#475569', fontSize: 18 }}>↓</span>
            <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
          </div>

          {/* TO */}
          <p style={{ margin: '0 0 6px', fontSize: 11, color: '#64748b' }}>I want to save as</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: rateInfo ? 8 : 12 }}>
            <button
              type="button"
              onClick={() => { setCurrModal('to'); setCurrSearch(''); }}
              style={smCurrBtn}
            >
              <span style={{ fontSize: 12 }}>{toCurrObj.symbol}</span>
              <span>{toCurr}</span>
              <span style={{ fontSize: 9, color: '#64748b' }}>▾</span>
            </button>

            {/* Result display */}
            <div style={{
              flex: 1,
              background: '#1e293b',
              border: `1px solid ${convertedRaw !== null ? 'rgba(6,182,212,0.35)' : '#334155'}`,
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              minHeight: 44,
              boxSizing: 'border-box',
            }}>
              {rateLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    border: '2px solid #334155', borderTopColor: '#8b5cf6',
                    animation: 'cbf-spin 0.7s linear infinite', flexShrink: 0,
                  }} />
                  <span style={{ color: '#475569', fontSize: 12 }}>Fetching rates…</span>
                </div>
              ) : rateError ? (
                <span style={{ color: '#f87171', fontSize: 12 }}>Rate unavailable</span>
              ) : formattedConverted !== null ? (
                <span style={{ color: '#a78bfa', fontSize: 15, fontWeight: 700 }}>
                  {toCurrObj.symbol}&thinsp;{formattedConverted}
                </span>
              ) : (
                <span style={{ color: '#475569', fontSize: 13 }}>—</span>
              )}
            </div>
          </div>

          {/* Rate label */}
          {rateInfo && (
            <p style={{ margin: '0 0 12px', fontSize: 11, color: '#475569', textAlign: 'center' }}>
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
                padding: '12px',
                borderRadius: 10,
                background: 'rgba(6,182,212,0.12)',
                border: '1px solid rgba(6,182,212,0.35)',
                color: '#a78bfa',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
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
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', pointerEvents: 'all' }}
            onClick={() => { setCurrModal(null); setCurrSearch(''); }}
          />

          {/* Sheet */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 430,
            background: '#1e293b',
            borderRadius: '20px 20px 0 0',
            border: '1px solid #334155',
            borderBottom: 'none',
            maxHeight: '72vh',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'all',
          }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 6, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#475569' }} />
            </div>

            {/* Header */}
            <div style={{
              padding: '0 16px 12px', borderBottom: '1px solid #334155', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 15 }}>
                {currModal === 'main' ? 'Save budget in' : currModal === 'from' ? 'Convert from' : 'Convert to'}
              </p>
              <button
                onClick={() => { setCurrModal(null); setCurrSearch(''); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }}
              >
                ✕
              </button>
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
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Currency list */}
            <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
              {filteredCurrencies.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>No currencies found</p>
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
                      padding: '12px 16px',
                      background: isSelected ? 'rgba(6,182,212,0.1)' : 'transparent',
                      border: 'none',
                      borderBottom: i < filteredCurrencies.length - 1 ? '1px solid #1e293b' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      color: isSelected ? '#a78bfa' : '#94a3b8',
                      fontSize: 13, fontWeight: 700,
                      width: 40, flexShrink: 0,
                    }}>
                      {c.code}
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: 13, flex: 1 }}>{c.name}</span>
                    <span style={{
                      color: isSelected ? '#a78bfa' : '#475569',
                      fontSize: 13, fontWeight: 600, flexShrink: 0,
                    }}>
                      {c.symbol}
                    </span>
                    {isSelected && (
                      <span style={{ color: '#a78bfa', fontSize: 14, flexShrink: 0 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Spinner keyframe (scoped name to avoid conflicts) */}
      <style>{`@keyframes cbf-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
