import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IcoArrowLeft, IcoSend, IcoFox, IcoCheck, IcoX, IcoCalendar, IcoCoin, IcoMapPin } from '../components/VintageIcons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useTravel } from '../context/TravelContext';
import { getCountryInfo, COUNTRY_NAMES } from '../data/countryNames';
import FlagImg from '../components/FlagImg';
import { formatBudget } from '../components/CurrencyBudgetField';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── createTripPlan tool declaration ─────────────────────────────────────────
const CREATE_TRIP_PLAN_FN = {
  name: 'createTripPlan',
  description: "Save a trip plan to the user's Diary Trip Planner. Use this once you have at minimum a destination and rough dates. Ask for any missing key details first.",
  parameters: {
    type: 'OBJECT',
    properties: {
      countryName:    { type: 'STRING', description: 'Full English country name e.g. "Japan"' },
      title:          { type: 'STRING', description: 'Short trip title e.g. "Cherry Blossom Season"' },
      dateFrom:       { type: 'STRING', description: 'Start date YYYY-MM-DD' },
      dateTo:         { type: 'STRING', description: 'End date YYYY-MM-DD' },
      status:         { type: 'STRING', description: 'One of: planning, booked, confirmed' },
      notes:          { type: 'STRING', description: 'Planning notes: highlights, must-sees, reminders' },
      budget:         { type: 'NUMBER', description: 'Estimated total budget (number only, no symbols)' },
      budgetCurrency: { type: 'STRING', description: 'Currency code e.g. USD, EUR, JPY, GBP' },
      cities:         { type: 'ARRAY', items: { type: 'STRING' }, description: 'Ordered city or region stops' },
      checklist:      { type: 'ARRAY', items: { type: 'STRING' }, description: 'Practical to-do items before the trip' },
    },
    required: ['countryName'],
  },
};

// ─── Build system prompt from user's real travel data ─────────────────────────
function buildSystemPrompt(memories, countryStatuses) {
  const names = (status) =>
    Object.entries(countryStatuses)
      .filter(([, v]) => v.status === status)
      .map(([code]) => getCountryInfo(code)?.name || code)
      .join(', ') || 'None';

  return `You are a friendly and knowledgeable travel assistant inside Sorami, a personal travel memory app.

Help the user plan trips, estimate budgets, compare destinations, understand visa requirements, discover hidden gems, and share cultural tips.

The user's current travel profile:
- Countries visited: ${names('visited')}
- Bucket list: ${names('bucketList')}
- Currently traveling: ${names('current')}
- Total memories recorded: ${memories.length}

Guidelines:
- Be warm, concise, and enthusiastic about travel
- For budgets, always give daily cost ranges in USD across three tiers: Budget / Mid-range / Luxury
- Mention local currencies and typical accommodation / food / transport costs separately when relevant
- Reference the user's past trips to personalise advice (e.g. "Since you've been to Japan, you'll notice Vietnam is…")
- Use bullet points and short paragraphs — mobile-friendly formatting
- For itineraries, structure clearly by day or region
- End responses with a brief follow-up question to keep the conversation going

Trip Planner:
- When the user wants to plan or save a trip, gather the essentials through natural conversation: destination, rough travel dates, budget range, interests, and key stops
- Once you have at minimum the destination and approximate dates, call createTripPlan to save it — don't wait for every detail to be perfect; the user can edit afterwards
- Always include a practical checklist (book flights, check visa requirements, book accommodation, travel insurance, packing essentials, etc.)
- Put itinerary highlights and tips in the notes field`;
}

// ─── Lightweight markdown renderer (bold + line breaks) ──────────────────────
function RenderText({ text }) {
  return (
    <span>
      {text.split('\n').map((line, li) => {
        if (!line) return <br key={li} />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={li} style={{ display: 'block', marginBottom: li < text.split('\n').length - 1 ? 2 : 0 }}>
            {parts.map((part, pi) =>
              pi % 2 === 1 ? <strong key={pi}>{part}</strong> : part
            )}
          </span>
        );
      })}
    </span>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const { memories, countryStatuses, addTripPlan } = useTravel();

  const chatRef  = useRef(null);   // Gemini chat session
  const bottomRef = useRef(null);  // auto-scroll anchor

  const [messages, setMessages] = useState([{
    role: 'ai',
    text: "Hi! I'm your Sorami travel assistant 🌍\n\nAsk me anything — trip planning, budget estimates, visa info, destination comparisons, packing tips, you name it. What are you thinking about?",
  }]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [noKey,       setNoKey]       = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null); // { msgId } while waiting for confirm/cancel

  // ── Init Gemini chat session ────────────────────────────────────────────────
  useEffect(() => {
    if (!GEMINI_KEY || GEMINI_KEY === 'your_gemini_api_key') {
      setNoKey(true);
      return;
    }
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: buildSystemPrompt(memories, countryStatuses),
        tools: [{ functionDeclarations: [CREATE_TRIP_PLAN_FN] }],
      });
      chatRef.current = model.startChat({ history: [] });
    } catch (err) {
      console.error('Gemini init error:', err);
      setNoKey(true);
    }
  // Re-init when travel data loads (memories & statuses start empty then populate)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const msg = text.trim();
    if (!msg || loading || !chatRef.current) return;

    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);

    try {
      const result   = await chatRef.current.sendMessage(msg);
      const response = result.response;
      const fnCalls  = response.functionCalls?.();

      if (fnCalls?.length > 0 && fnCalls[0].name === 'createTripPlan') {
        const msgId = Date.now();
        setMessages(prev => [...prev, {
          role: 'plan', planData: fnCalls[0].args, status: 'pending', id: msgId,
        }]);
        setPendingPlan({ msgId });
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: response.text() }]);
      }
    } catch (err) {
      console.error('Gemini error:', err);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: "I couldn't reach the AI right now. Please check your internet connection or API key and try again.",
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Send Gemini function response and get follow-up text ────────────────────
  const sendFunctionResponse = async (name, responseObj) => {
    if (!chatRef.current) return;
    setLoading(true);
    try {
      const result = await chatRef.current.sendMessage([{
        functionResponse: { name, response: responseObj },
      }]);
      setMessages(prev => [...prev, { role: 'ai', text: result.response.text() }]);
    } catch (err) {
      console.error('Function response error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Confirm — save plan and tell Gemini it worked ────────────────────────────
  const handleConfirmPlan = async (planData, msgId) => {
    // Look up country code + alpha2 from name
    const entry = Object.entries(COUNTRY_NAMES).find(
      ([, v]) => v.name.toLowerCase() === (planData.countryName || '').toLowerCase()
    ) || Object.entries(COUNTRY_NAMES).find(
      ([, v]) => v.name.toLowerCase().includes((planData.countryName || '').toLowerCase())
    );

    const tripData = {
      countryCode:    entry?.[0]               || '',
      countryName:    planData.countryName      || '',
      countryAlpha2:  entry?.[1]?.alpha2        || '',
      title:          planData.title            || '',
      dateFrom:       planData.dateFrom         || '',
      dateTo:         planData.dateTo           || '',
      status:         planData.status           || 'planning',
      notes:          planData.notes            || '',
      budget:         planData.budget           || null,
      budgetCurrency: planData.budgetCurrency   || 'USD',
      cities:    (planData.cities    || []).map(name => ({ name, dateFrom: '', dateTo: '' })),
      checklist: (planData.checklist || []).map(text => ({ text, done: false })),
      photos: [],
    };

    try {
      await addTripPlan(tripData);
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, status: 'saved' } : m
      ));
    } catch (err) {
      console.error('Failed to save plan:', err);
    }
    setPendingPlan(null);
    await sendFunctionResponse('createTripPlan', { success: true, message: 'Trip plan saved to Diary.' });
  };

  // ── Cancel — discard plan and tell Gemini ────────────────────────────────────
  const handleCancelPlan = async (msgId) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, status: 'cancelled' } : m
    ));
    setPendingPlan(null);
    await sendFunctionResponse('createTripPlan', { cancelled: true, message: 'User chose not to save the plan.' });
  };

  // ── Design tokens ───────────────────────────────────────────────────────────
  const T = {
    bg:     '#f0e8d8',
    card:   '#faf6ef',
    border: '#d4c4a8',
    text:   '#2c1a0e',
    text2:  '#7a6048',
    text3:  '#a89070',
    purple: '#7b6eb0',
    gold:   '#c4922a',
  };

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: T.bg }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, background: T.card, borderBottom: `2px solid ${T.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(44,26,14,0.06)' }}>
        <button onClick={() => navigate(-1)} style={{ color: T.text3, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <IcoArrowLeft size={18} color={T.text3} />
        </button>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${T.gold}15`, border: `1.5px solid ${T.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IcoFox size={20} color={T.gold} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Travel Assistant</h1>
          <p style={{ color: T.text3, fontSize: 10, margin: '1px 0 0' }}>Powered by Gemini 2.5 Flash</p>
        </div>
        {!noKey && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5a8a5a', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#5a8a5a', fontSize: 10, fontWeight: 600 }}>Online</span>
          </div>
        )}
      </div>

      {/* ── No-key warning banner ── */}
      {noKey && (
        <div style={{ flexShrink: 0, margin: '14px 14px 0', background: `${T.gold}12`, border: `1.5px solid ${T.gold}40`, borderRadius: 14, padding: 14 }}>
          <p style={{ color: T.gold, fontSize: 13, fontWeight: 700, margin: '0 0 8px' }}>⚠️ Gemini API key not set</p>
          <ol style={{ color: T.gold, fontSize: 11, lineHeight: 1.7, margin: 0, paddingLeft: 18, opacity: 0.85 }}>
            <li>Go to <span style={{ fontWeight: 700 }}>aistudio.google.com</span> and sign in</li>
            <li>Click <strong>Get API key → Create API key</strong></li>
            <li>Open your <code>.env</code> file and replace <code>your_gemini_api_key</code> with it</li>
            <li>Restart the dev server (<code>npm run dev</code>)</li>
          </ol>
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {messages.map((msg, i) => (
          msg.role === 'plan'
            ? <PlanConfirmCard
                key={i}
                planData={msg.planData}
                status={msg.status}
                msgId={msg.id}
                T={T}
                onConfirm={handleConfirmPlan}
                onCancel={handleCancelPlan}
              />
            : <MessageBubble key={i} msg={msg} T={T} />
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${T.gold}15`, border: `1.5px solid ${T.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IcoFox size={18} color={T.gold} />
            </div>
            <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: '14px 14px 14px 4px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 14 }}>
                {[0, 150, 300].map((delay) => (
                  <span key={delay} style={{ width: 6, height: 6, background: T.text3, borderRadius: '50%', animation: 'bounce 1s infinite', animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div style={{ flexShrink: 0, background: T.card, borderTop: `2px solid ${T.border}`, padding: '10px 14px' }}>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about destinations, budgets, visas…"
            disabled={noKey || loading || !!pendingPlan}
            rows={1}
            style={{
              flex: 1, background: T.bg, border: `1.5px solid ${T.border}`,
              borderRadius: 14, padding: '10px 14px', color: T.text, fontSize: 13,
              outline: 'none', resize: 'none', maxHeight: 120,
              fontFamily: "'Crimson Text', Georgia, serif", lineHeight: 1.6,
              opacity: (noKey || loading || !!pendingPlan) ? 0.5 : 1,
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || noKey || !!pendingPlan}
            style={{
              width: 42, height: 42, background: (!input.trim() || loading || noKey || !!pendingPlan) ? `${T.border}80` : T.purple,
              border: 'none', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: (!input.trim() || loading || noKey || !!pendingPlan) ? 'not-allowed' : 'pointer',
              flexShrink: 0, transition: 'background 0.15s',
            }}
          >
            <IcoSend size={16} color={(!input.trim() || loading || noKey || !!pendingPlan) ? T.text3 : '#fff'} />
          </button>
        </form>
        {pendingPlan ? (
          <p style={{ color: T.gold, fontSize: 10, textAlign: 'center', margin: '6px 0 0', fontWeight: 600 }}>
            ↑ Save or discard the trip plan above to continue chatting
          </p>
        ) : (
          <p style={{ color: T.text3, fontSize: 10, textAlign: 'center', margin: '6px 0 0' }}>
            AI can make mistakes — verify important travel info before booking
          </p>
        )}
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

// ─── Plan confirm card ────────────────────────────────────────────────────────
function PlanConfirmCard({ planData, status, msgId, T, onConfirm, onCancel }) {
  const isPending   = status === 'pending';
  const isSaved     = status === 'saved';
  const isCancelled = status === 'cancelled';

  // Look up alpha2 for flag
  const entry = Object.entries(COUNTRY_NAMES).find(
    ([, v]) => v.name.toLowerCase() === (planData.countryName || '').toLowerCase()
  ) || Object.entries(COUNTRY_NAMES).find(
    ([, v]) => v.name.toLowerCase().includes((planData.countryName || '').toLowerCase())
  );
  const alpha2 = entry?.[1]?.alpha2 || '';

  // Format date range
  const dateStr = planData.dateFrom
    ? planData.dateTo
      ? `${planData.dateFrom} → ${planData.dateTo}`
      : planData.dateFrom
    : null;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      {/* Fox avatar */}
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${T.gold}15`, border: `1.5px solid ${T.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <IcoFox size={18} color={T.gold} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, background: T.card, border: `1.5px solid ${T.border}`, borderRadius: '14px 14px 14px 4px', overflow: 'hidden', maxWidth: '85%' }}>

        {/* Header */}
        <div style={{ padding: '10px 14px 9px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FlagImg alpha2={alpha2} size={20} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: T.text3, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: 0, fontFamily: "'Crimson Text', Georgia, serif" }}>Trip Plan Ready</p>
            <p style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: '1px 0 0', fontFamily: "'Playfair Display', Georgia, serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {planData.title || planData.countryName}
            </p>
            {planData.title && <p style={{ color: T.text3, fontSize: 11, margin: '1px 0 0', fontFamily: "'Crimson Text', Georgia, serif" }}>{planData.countryName}</p>}
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {dateStr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IcoCalendar size={11} color={T.text3} />
              <span style={{ fontSize: 11, color: T.text2, fontFamily: "'Crimson Text', Georgia, serif" }}>{dateStr}</span>
            </div>
          )}
          {planData.cities?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <IcoMapPin size={11} color={T.text3} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11, color: T.text2, fontFamily: "'Crimson Text', Georgia, serif" }}>{planData.cities.join(' → ')}</span>
            </div>
          )}
          {planData.budget > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IcoCoin size={11} color={T.gold} />
              <span style={{ fontSize: 11, color: T.text2, fontFamily: "'Crimson Text', Georgia, serif" }}>
                {formatBudget(planData.budget, planData.budgetCurrency || 'USD')}
              </span>
            </div>
          )}
          {planData.notes && (
            <p style={{ color: T.text2, fontSize: 11, lineHeight: 1.55, margin: '2px 0 0', fontFamily: "'Crimson Text', Georgia, serif" }}>
              {planData.notes.length > 130 ? planData.notes.slice(0, 130) + '…' : planData.notes}
            </p>
          )}
          {planData.checklist?.length > 0 && (
            <div style={{ marginTop: 2 }}>
              <p style={{ color: T.text3, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: '0 0 4px', fontFamily: "'Crimson Text', Georgia, serif" }}>
                Checklist ({planData.checklist.length} items)
              </p>
              {planData.checklist.slice(0, 3).map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 2 }}>
                  <span style={{ color: T.text3, fontSize: 12, lineHeight: 1.4, flexShrink: 0 }}>◦</span>
                  <span style={{ color: T.text2, fontSize: 11, fontFamily: "'Crimson Text', Georgia, serif" }}>{item}</span>
                </div>
              ))}
              {planData.checklist.length > 3 && (
                <p style={{ color: T.text3, fontSize: 10, margin: '2px 0 0', fontStyle: 'italic' }}>+{planData.checklist.length - 3} more…</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isPending && (
          <div style={{ padding: '8px 12px 12px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
            <button
              onClick={() => onConfirm(planData, msgId)}
              style={{
                flex: 1, padding: '9px 10px', background: '#7b6eb0', color: '#fff', border: 'none',
                borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Crimson Text', Georgia, serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <IcoCheck size={12} color="#fff" /> Save to Planner
            </button>
            <button
              onClick={() => onCancel(msgId)}
              style={{
                padding: '9px 14px', background: '#f0e8d8', color: T.text3,
                border: `1.5px solid ${T.border}`, borderRadius: 10, fontSize: 12,
                cursor: 'pointer', fontFamily: "'Crimson Text', Georgia, serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <IcoX size={12} color={T.text3} /> Discard
            </button>
          </div>
        )}
        {isSaved && (
          <div style={{ padding: '8px 14px 10px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IcoCheck size={12} color="#5a8a5a" />
            <span style={{ fontSize: 11, color: '#5a8a5a', fontWeight: 700, fontFamily: "'Crimson Text', Georgia, serif" }}>Saved to Planner</span>
          </div>
        )}
        {isCancelled && (
          <div style={{ padding: '8px 14px 10px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IcoX size={12} color={T.text3} />
            <span style={{ fontSize: 11, color: T.text3, fontStyle: 'italic', fontFamily: "'Crimson Text', Georgia, serif" }}>Discarded</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, T }) {
  const isUser = msg.role === 'user';

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isUser ? 'row-reverse' : 'row' }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${T.gold}15`, border: `1.5px solid ${T.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 }}>
          <IcoFox size={18} color={T.gold} />
        </div>
      )}

      <div style={{
        maxWidth: '82%', padding: '10px 14px', fontSize: 13, lineHeight: 1.65,
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser ? T.purple : msg.error ? `${T.rose}15` : T.card,
        border: isUser ? 'none' : msg.error ? `1.5px solid ${T.rose}40` : `1.5px solid ${T.border}`,
        color: isUser ? '#fff' : msg.error ? T.rose : T.text2,
        fontFamily: "'Crimson Text', Georgia, serif",
      }}>
        <RenderText text={msg.text} />
      </div>
    </div>
  );
}
