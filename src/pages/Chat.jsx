import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useTravel } from '../context/TravelContext';
import { getCountryInfo } from '../data/countryNames';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── Suggested starter prompts ────────────────────────────────────────────────
const SUGGESTIONS = [
  { emoji: '💴', text: "What's the daily budget for Japan?" },
  { emoji: '🌏', text: 'Best budget destinations in Southeast Asia' },
  { emoji: '🗺️', text: 'Help me plan a 2-week Europe trip' },
  { emoji: '🛂', text: 'Visa tips for visiting multiple countries' },
  { emoji: '🇹🇭', text: 'Thailand vs Vietnam — which is better for first-timers?' },
  { emoji: '🎒', text: 'What should I pack for a tropical trip?' },
];

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
- End responses with a brief follow-up question to keep the conversation going`;
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
  const { memories, countryStatuses } = useTravel();

  const chatRef  = useRef(null);   // Gemini chat session
  const bottomRef = useRef(null);  // auto-scroll anchor

  const [messages, setMessages] = useState([{
    role: 'ai',
    text: "Hi! I'm your Sorami travel assistant 🌍\n\nAsk me anything — trip planning, budget estimates, visa info, destination comparisons, packing tips, you name it. What are you thinking about?",
  }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [noKey,   setNoKey]   = useState(false);

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
      const response = result.response.text();
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
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

  const hasUserMessages = messages.some(m => m.role === 'user');

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
          <Bot className="w-4 h-4 text-violet-400" />
        </div>

        <div className="flex-1">
          <h1 className="text-white font-bold text-sm leading-tight">Travel Assistant</h1>
          <p className="text-slate-500 text-[11px]">Powered by Gemini 2.5 Flash</p>
        </div>

        {/* Live indicator */}
        {!noKey && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-[10px] font-medium">Online</span>
          </div>
        )}
      </div>

      {/* ── No-key warning banner ───────────────────────────────────────────── */}
      {noKey && (
        <div className="flex-shrink-0 mx-4 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-amber-400 text-sm font-semibold mb-1.5">⚠️ Gemini API key not set</p>
          <ol className="text-amber-400/80 text-xs leading-relaxed list-decimal list-inside space-y-1">
            <li>Go to <span className="text-amber-300">aistudio.google.com</span> and sign in</li>
            <li>Click <strong>Get API key → Create API key</strong></li>
            <li>Open your <span className="text-amber-300 font-mono">.env</span> file and replace <span className="text-amber-300 font-mono">your_gemini_api_key</span> with it</li>
            <li>Restart the dev server (<span className="text-amber-300 font-mono">npm run dev</span>)</li>
          </ol>
        </div>
      )}

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Suggestion chips — visible only before first user message */}
        {!hasUserMessages && !noKey && (
          <div className="mb-1">
            <p className="text-slate-500 text-[11px] uppercase tracking-wider font-medium mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Try asking…
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map(({ emoji, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 text-slate-300 px-4 py-3 rounded-2xl hover:border-violet-500/40 hover:text-violet-300 transition-colors text-left text-sm"
                >
                  <span className="text-base flex-shrink-0">{emoji}</span>
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 px-4 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2 items-end"
        >
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
            disabled={noKey || loading}
            rows={1}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 disabled:opacity-40 leading-relaxed"
            style={{ resize: 'none', maxHeight: 120 }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || noKey}
            className="w-11 h-11 bg-violet-500 hover:bg-violet-400 active:bg-violet-600 disabled:bg-slate-700 disabled:text-slate-600 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
        <p className="text-slate-700 text-[10px] text-center mt-2">
          AI can make mistakes — verify important travel info before booking
        </p>
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* AI avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0 mb-0.5">
          <Bot className="w-3.5 h-3.5 text-violet-400" />
        </div>
      )}

      <div
        className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-violet-500 text-white rounded-br-sm'
            : msg.error
              ? 'bg-red-500/10 border border-red-500/30 text-red-300 rounded-bl-sm'
              : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-sm'
        }`}
      >
        <RenderText text={msg.text} />
      </div>
    </div>
  );
}
