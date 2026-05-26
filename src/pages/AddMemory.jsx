import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, X, Star, MapPin, Plus, Users } from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import { getCountryInfo, getFlagEmoji } from '../data/countryNames';
import CurrencyBudgetField from '../components/CurrencyBudgetField';

const MAX_PHOTOS = 4;

// Compress photo to max 900px and 65% JPEG quality.
// Result is ~80-120 KB — small enough to store as base64 in Firestore (1 MB doc limit).
function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 900;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(
        blob => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg', 0.65
      );
    };
    img.src = objectUrl;
  });
}

export default function AddMemory() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addMemory, updateMemory, uploadPhoto, profile } = useTravel();

  // Edit mode when a memory object is passed in location.state
  const editMemory = location.state?.memory || null;
  const isEdit = !!editMemory;

  const info = location.state?.name
    ? { name: location.state.name, alpha2: location.state.alpha2 }
    : getCountryInfo(code);
  const flag = getFlagEmoji(info.alpha2);

  const [isMultiDay, setIsMultiDay] = useState(!!(editMemory?.dateTo));

  const [form, setForm] = useState({
    region:  editMemory?.region  ?? '',
    date:    editMemory?.date    ?? new Date().toISOString().split('T')[0],
    dateTo:  editMemory?.dateTo  ?? '',
    diary:   editMemory?.diary   ?? '',
    rating:  editMemory?.rating  ?? 0,
    budget:         editMemory?.budget  != null ? String(editMemory.budget) : '',
    budgetCurrency: editMemory?.budgetCurrency || 'USD',
    weather: editMemory?.weather ?? '',
    tags:    editMemory?.tags?.join(', ')  ?? '',
    // partners is now an array of strings
    partners: editMemory?.partners || [],
  });

  // In edit mode, existing photos are already base64 strings — use directly as previews.
  const [photos, setPh]     = useState(editMemory?.photos || []);
  const [previews, setPrev] = useState(editMemory?.photos || []);
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError]   = useState('');
  const [saved, setSaved]   = useState(false);
  const fileRef = useRef();

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // ── City list fetched from countriesnow.space ────────────────────────────
  const [cityList,    setCityList]    = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [citySearch,  setCitySearch]  = useState('');
  const [cityOpen,    setCityOpen]    = useState(false); // ← FIX: explicit open/close

  useEffect(() => {
    if (!info.name) return;
    setCityLoading(true);
    fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ country: info.name }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.error && Array.isArray(data.data)) setCityList(data.data);
      })
      .catch(() => {})
      .finally(() => setCityLoading(false));
  }, [info.name]);

  // Show first 20 cities by default; filter as user types
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cityList.slice(0, 20);
    const q = citySearch.toLowerCase();
    return cityList.filter(c => c.toLowerCase().includes(q)).slice(0, 20);
  }, [cityList, citySearch]);

  // ── Partner picker ────────────────────────────────────────────────────────────
  // Collect all unique partner names from travelGroups (new) or travelPartners (old)
  const partnerGroups = useMemo(() => {
    const groups = profile?.travelGroups || [];
    if (groups.length > 0) return groups;
    // Fallback: convert old travelPartners to pseudo-groups by category
    const CATS = [
      { id: 'family',    name: 'Family',    emoji: '👨‍👩‍👧' },
      { id: 'friend',    name: 'Friend',    emoji: '🤝' },
      { id: 'lover',     name: 'Lover',     emoji: '❤️' },
      { id: 'colleague', name: 'Colleague', emoji: '💼' },
    ];
    const old = profile?.travelPartners || [];
    return CATS
      .map(cat => ({
        id: cat.id, name: cat.name, emoji: cat.emoji,
        members: old.filter(p => p.category === cat.id).map(p => p.name),
      }))
      .filter(g => g.members.length > 0);
  }, [profile]);

  // All unique member names across all groups (for custom-add dedup)
  const allKnownNames = useMemo(
    () => new Set(partnerGroups.flatMap(g => g.members)),
    [partnerGroups]
  );

  const [customPartnerInput, setCustomPartnerInput] = useState('');
  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);

  const togglePartner = (name) => {
    const current = form.partners;
    if (current.includes(name)) {
      set('partners', current.filter(p => p !== name));
    } else {
      set('partners', [...current, name]);
    }
  };

  // Select / deselect an entire group at once
  const toggleGroup = (group) => {
    const current = form.partners;
    const allSelected = group.members.every(m => current.includes(m));
    if (allSelected) {
      // Remove every member of this group
      set('partners', current.filter(n => !group.members.includes(n)));
    } else {
      // Add any member not already selected
      const toAdd = group.members.filter(m => !current.includes(m));
      set('partners', [...current, ...toAdd]);
    }
  };

  const addCustomPartner = () => {
    const name = customPartnerInput.trim();
    if (!name || form.partners.includes(name)) { setCustomPartnerInput(''); return; }
    set('partners', [...form.partners, name]);
    setCustomPartnerInput('');
  };

  // ─── Photo handlers ────────────────────────────────────────────────────────
  const handlePhotos = (e) => {
    const incoming = Array.from(e.target.files);
    e.target.value = '';
    const slots = MAX_PHOTOS - photos.length;
    if (slots <= 0) return;
    const allowed = incoming.slice(0, slots);
    setPh(prev => [...prev, ...allowed]);
    allowed.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPrev(p => [...p, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i) => {
    setPh(prev => prev.filter((_, idx) => idx !== i));
    setPrev(prev => prev.filter((_, idx) => idx !== i));
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setUploadStatus('');

    try {
      let photoUrls = [];

      if (photos.length > 0) {
        const newFiles = photos.filter(p => p instanceof File);
        if (newFiles.length > 0) {
          setUploadStatus(`Compressing ${newFiles.length} photo${newFiles.length > 1 ? 's' : ''}…`);
          await new Promise(r => setTimeout(r, 30));
        }
        setUploadStatus('Processing photos…');
        const results = await Promise.all(
          photos.map(async (photo) => {
            if (typeof photo === 'string') return photo;
            try {
              const compressed = await compressImage(photo);
              return await uploadPhoto(compressed);
            } catch (err) {
              console.warn('Photo processing failed, skipping:', err);
              return null;
            }
          })
        );
        photoUrls = results.filter(Boolean);
      }

      setUploadStatus('Saving…');
      const tags = form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

      const memoryData = {
        countryCode:   code,
        countryName:   info.name,
        countryAlpha2: info.alpha2 || '',
        region:  form.region,
        date:    form.date,
        dateTo:  isMultiDay && form.dateTo ? form.dateTo : null,
        diary:   form.diary,
        rating:  form.rating || null,
        budget:         form.budget ? Number(form.budget) : null,
        budgetCurrency: form.budget ? (form.budgetCurrency || 'USD') : null,
        weather: form.weather,
        tags,
        partners: form.partners, // array of strings
        photos: photoUrls,
      };

      if (isEdit) {
        await updateMemory(editMemory.id, memoryData);
      } else {
        await addMemory(memoryData);
      }

      setUploadStatus('');
      setSaved(true);
      setTimeout(() => (isEdit ? navigate(-1) : navigate('/diary')), 800);
    } catch (err) {
      setSaving(false);
      setUploadStatus('');
      console.error('Save failed:', err);
      setError(err?.message || 'Failed to save. Check your connection and try again.');
    }
  };

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xl">{flag}</span>
        <div className="flex-1">
          <h1 className="text-white font-bold">{isEdit ? 'Edit Memory' : 'Add Memory'}</h1>
          <p className="text-slate-400 text-xs">{info.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        {/* Success */}
        {saved && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-3">
            <p className="text-green-400 text-sm font-medium">
              ✅ Memory {isEdit ? 'updated' : 'saved'}! {isEdit ? 'Going back…' : 'Opening Diary…'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Photos */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-2">
            Photos{' '}
            <span className="normal-case text-slate-600">(optional · max {MAX_PHOTOS})</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:border-violet-500 hover:text-violet-400 transition-colors"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px]">Add</span>
              </button>
            )}
          </div>
          {photos.length >= MAX_PHOTOS && (
            <p className="text-xs text-amber-400/80 mt-2">
              Maximum {MAX_PHOTOS} photos reached. Remove one to add another.
            </p>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
        </div>

        {/* City */}
        <Field label="City">
          {/* Selected city chip */}
          {form.region && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-3 py-1.5">
                <MapPin className="w-3 h-3 text-violet-400 flex-shrink-0" />
                <span className="text-violet-400 text-sm font-medium">{form.region}</span>
                <button
                  type="button"
                  onClick={() => { set('region', ''); setCitySearch(''); setCityOpen(false); }}
                  className="text-slate-500 hover:text-slate-300 ml-1 text-base leading-none"
                >✕</button>
              </div>
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              placeholder={cityLoading ? `Loading cities for ${info.name}…` : 'Search city…'}
              value={citySearch}
              onChange={e => { setCitySearch(e.target.value); setCityOpen(true); }}
              onFocus={() => setCityOpen(true)}
              className="input-field"
              disabled={cityLoading}
            />

            {/* Scrollable city dropdown — only shown when explicitly open */}
            {cityOpen && filteredCities.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl z-10"
                style={{ maxHeight: 220, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
              >
                {filteredCities.map((city, i) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      set('region', city);
                      setCitySearch('');
                      setCityOpen(false); // ← FIX: close dropdown after selection
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                    style={{ borderBottom: i < filteredCities.length - 1 ? '1px solid #1e293b' : 'none' }}
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    {city}
                  </button>
                ))}
              </div>
            )}

            {/* No match → offer custom entry */}
            {cityOpen && citySearch.trim() && filteredCities.length === 0 && !cityLoading && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl z-10">
                <button
                  type="button"
                  onClick={() => { set('region', citySearch.trim()); setCitySearch(''); setCityOpen(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-violet-400 hover:bg-slate-800"
                >
                  + Use "{citySearch.trim()}"
                </button>
              </div>
            )}
          </div>

          {cityLoading && (
            <p className="text-slate-600 text-xs mt-1.5 flex items-center gap-1.5">
              <span className="w-3 h-3 border border-slate-600 border-t-violet-500 rounded-full animate-spin inline-block" />
              Loading cities…
            </p>
          )}
        </Field>

        {/* Date */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-2">Travel Date</label>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { multi: false, label: '📅 Single Day' },
              { multi: true,  label: '🗓️ Multiple Days' },
            ].map(({ multi, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setIsMultiDay(multi);
                  if (!multi) set('dateTo', '');
                }}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  isMultiDay === multi
                    ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {isMultiDay ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">From</p>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">To</p>
                <input type="date" value={form.dateTo} onChange={e => set('dateTo', e.target.value)} min={form.date || undefined} className="input-field" />
              </div>
            </div>
          ) : (
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" />
          )}
        </div>

        {/* Rating */}
        <Field label="Rating">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => set('rating', form.rating === n ? 0 : n)} className="transition-transform active:scale-90">
                <Star className={`w-7 h-7 ${form.rating >= n ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
              </button>
            ))}
          </div>
        </Field>

        {/* Diary */}
        <Field label="Diary / Memo">
          <textarea
            placeholder="Write about your experience, food, funny moments, emotional memories..."
            value={form.diary}
            onChange={e => set('diary', e.target.value)}
            rows={5}
            className="input-field resize-none"
          />
        </Field>

        {/* ── Travel Partners ────────────────────────────────────────────────── */}
        <Field label="Travel Partners">
          {/* Selected partner chips */}
          {form.partners.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {form.partners.map(name => (
                <div key={name} className="flex items-center gap-1.5 bg-violet-500/15 border border-violet-500/30 text-violet-400 text-xs px-3 py-1.5 rounded-full">
                  <span>{name}</span>
                  <button type="button" onClick={() => togglePartner(name)} className="text-violet-300 hover:text-white leading-none">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Picker toggle */}
          <button
            type="button"
            onClick={() => setPartnerPickerOpen(o => !o)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-violet-400 border border-slate-600 hover:border-violet-500/40 bg-slate-800 px-3 py-2 rounded-xl transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            {partnerPickerOpen ? 'Close partner picker' : 'Choose travel partners'}
          </button>

          {partnerPickerOpen && (
            <div className="mt-3 bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-4">
              {partnerGroups.length > 0 ? partnerGroups.map(group => {
                const allSelected     = group.members.length > 0 && group.members.every(m => form.partners.includes(m));
                const someSelected    = !allSelected && group.members.some(m => form.partners.includes(m));
                return (
                  <div key={group.id}>
                    {/* Group header row with Select-All checkbox */}
                    <div className="flex items-center gap-2 mb-2">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all"
                        style={{
                          background: allSelected ? '#8b5cf6' : someSelected ? '#0e7490' : 'transparent',
                          borderColor: (allSelected || someSelected) ? '#8b5cf6' : '#475569',
                        }}
                        title={allSelected ? 'Deselect all' : 'Select all'}
                      >
                        {allSelected && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                        {someSelected && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>–</span>}
                      </button>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                        {group.emoji} {group.name}
                      </p>
                      <span className="text-[10px] text-slate-600 ml-auto">
                        {allSelected ? 'All selected' : someSelected ? `${group.members.filter(m => form.partners.includes(m)).length}/${group.members.length}` : 'Select all'}
                      </span>
                    </div>

                    {/* Individual member chips */}
                    <div className="flex flex-wrap gap-2 pl-6">
                      {group.members.map(name => {
                        const selected = form.partners.includes(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => togglePartner(name)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                              selected
                                ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                                : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            {selected ? '✓ ' : ''}{name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }) : (
                <p className="text-slate-500 text-xs italic">
                  No saved partners yet. Add people in the Home page, then pick them here.
                </p>
              )}

              {/* Custom / one-off partner */}
              <div className="pt-2 border-t border-slate-700/60">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">Add someone else</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Name…"
                    value={customPartnerInput}
                    onChange={e => setCustomPartnerInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomPartner())}
                    className="input-field flex-1"
                    style={{ padding: '8px 12px' }}
                  />
                  <button
                    type="button"
                    onClick={addCustomPartner}
                    disabled={!customPartnerInput.trim()}
                    className="flex items-center gap-1 text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30 px-3 py-2 rounded-xl hover:bg-violet-500/30 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </Field>

        {/* Budget */}
        <Field label="Budget">
          <CurrencyBudgetField
            amount={form.budget}
            currency={form.budgetCurrency}
            onChange={(amt, curr) => setForm(f => ({ ...f, budget: amt, budgetCurrency: curr }))}
          />
        </Field>

        {/* Weather */}
        <Field label="Weather">
          <input
            type="text"
            placeholder="e.g. Sunny 22°C"
            value={form.weather}
            onChange={e => set('weather', e.target.value)}
            className="input-field"
          />
        </Field>

        {/* Tags */}
        <Field label="Tags (comma-separated)">
          <input
            type="text"
            placeholder="food, beach, family, adventure"
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            className="input-field"
          />
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-violet-500 hover:bg-violet-400 active:bg-violet-600 text-white font-semibold py-3.5 rounded-2xl transition-colors disabled:opacity-60 text-sm flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {uploadStatus || 'Saving…'}
            </>
          ) : (isEdit ? 'Update Memory' : 'Save Memory')}
        </button>

        {saving && photos.some(p => p instanceof File) && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-center">
            <p className="text-slate-400 text-xs">
              Photos are being compressed &amp; processed — please keep this page open.
            </p>
          </div>
        )}
      </form>

      <style>{`
        .input-field {
          width: 100%;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 12px 14px;
          color: #e2e8f0;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus { border-color: #8b5cf6; }
        .input-field::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-2">{label}</label>
      {children}
    </div>
  );
}
