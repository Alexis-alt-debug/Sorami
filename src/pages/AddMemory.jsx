import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { IcoArrowLeft, IcoCamera, IcoX, IcoStar, IcoMapPin, IcoPlus, IcoUsers, IcoFlower, IcoSun, IcoMapleLeaf, IcoSnowflake } from '../components/VintageIcons';
import { useTravel } from '../context/TravelContext';
import { getCountryInfo } from '../data/countryNames';
import FlagImg from '../components/FlagImg';
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
  const [isMultiDay, setIsMultiDay] = useState(!!(editMemory?.dateTo));

  const [form, setForm] = useState({
    region:  editMemory?.region  ?? '',
    date:    editMemory?.date    ?? new Date().toISOString().split('T')[0],
    dateTo:  editMemory?.dateTo  ?? '',
    diary:   editMemory?.diary   ?? '',
    rating:  editMemory?.rating  ?? 0,
    budget:         editMemory?.budget  != null ? String(editMemory.budget) : '',
    budgetCurrency: editMemory?.budgetCurrency || 'USD',
    season: editMemory?.season || editMemory?.weather || '',
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
        season: form.season,
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
    <div style={{ minHeight: '100vh', paddingBottom: 32, background: '#f0e8d8' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#faf6ef', borderBottom: '2px solid #d4c4a8', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(44,26,14,0.06)' }}>
        <button onClick={() => navigate(-1)} style={{ color: '#a89070', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <IcoArrowLeft size={18} color="#a89070" />
        </button>
        <FlagImg alpha2={info.alpha2} size={22} />
        <div style={{ flex: 1 }}>
          <h1 style={{ color: '#2c1a0e', fontWeight: 700, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>{isEdit ? 'Edit Memory' : 'Add Memory'}</h1>
          <p style={{ color: '#a89070', fontSize: 11, margin: '2px 0 0' }}>{info.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Success */}
        {saved && (
          <div style={{ background: 'rgba(90,138,90,0.1)', border: '1.5px solid rgba(90,138,90,0.4)', borderRadius: 12, padding: '10px 14px' }}>
            <p style={{ color: '#5a8a5a', fontSize: 13, fontWeight: 600, margin: 0 }}>
              ✅ Memory {isEdit ? 'updated' : 'saved'}! {isEdit ? 'Going back…' : 'Opening Diary…'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(196,128,154,0.1)', border: '1.5px solid rgba(196,128,154,0.4)', borderRadius: 12, padding: '10px 14px' }}>
            <p style={{ color: '#c4809a', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Photos */}
        <div>
          <label style={{ display: 'block', fontSize: 10, color: '#a89070', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8, fontFamily: "'Crimson Text', Georgia, serif" }}>
            Photos <span style={{ textTransform: 'none', color: '#a89070', fontWeight: 400 }}>(optional · max {MAX_PHOTOS})</span>
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => removePhoto(i)}
                  style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'rgba(44,26,14,0.7)', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <IcoX size={10} color="#fff" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ width: 72, height: 72, border: '2px dashed #d4c4a8', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#a89070', background: 'transparent', cursor: 'pointer', fontSize: 22 }}>
                <IcoCamera size={18} color="#a89070" />
                <span style={{ fontSize: 10 }}>Add</span>
              </button>
            )}
          </div>
          {photos.length >= MAX_PHOTOS && (
            <p style={{ color: '#c4922a', fontSize: 11, marginTop: 6 }}>Maximum {MAX_PHOTOS} photos reached. Remove one to add another.</p>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />
        </div>

        {/* City */}
        <Field label="City">
          {/* Selected city chip */}
          {form.region && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(107,124,181,0.12)', border: '1.5px solid rgba(107,124,181,0.35)', borderRadius: 20, padding: '5px 12px' }}>
                <IcoMapPin size={12} color="#6b7cb5" />
                <span style={{ color: '#6b7cb5', fontSize: 13, fontWeight: 600, fontFamily: "'Crimson Text', Georgia, serif" }}>{form.region}</span>
                <button
                  type="button"
                  onClick={() => { set('region', ''); setCitySearch(''); setCityOpen(false); }}
                  style={{ color: '#a89070', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 2, fontSize: 14, lineHeight: 1, padding: 0 }}
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

            {/* Scrollable city dropdown */}
            {cityOpen && filteredCities.length > 0 && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, background: '#faf6ef', border: '1.5px solid #d4c4a8', borderRadius: 12, overflow: 'hidden', zIndex: 10, boxShadow: '0 8px 24px rgba(44,26,14,0.12)', maxHeight: 200, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {filteredCities.map((city, i) => (
                  <button key={city} type="button"
                    onClick={() => { set('region', city); setCitySearch(''); setCityOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'none', border: 'none', borderBottom: i < filteredCities.length - 1 ? '1px solid #d4c4a8' : 'none', cursor: 'pointer', textAlign: 'left', color: '#2c1a0e', fontSize: 13, fontFamily: "'Crimson Text', Georgia, serif" }}>
                    <IcoMapPin size={12} color="#a89070" />
                    {city}
                  </button>
                ))}
              </div>
            )}

            {/* No match → offer custom entry */}
            {cityOpen && citySearch.trim() && filteredCities.length === 0 && !cityLoading && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, background: '#faf6ef', border: '1.5px solid #d4c4a8', borderRadius: 12, overflow: 'hidden', zIndex: 10 }}>
                <button type="button"
                  onClick={() => { set('region', citySearch.trim()); setCitySearch(''); setCityOpen(false); }}
                  style={{ width: '100%', padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#7b6eb0', fontSize: 13, fontFamily: "'Crimson Text', Georgia, serif" }}>
                  + Use "{citySearch.trim()}"
                </button>
              </div>
            )}
          </div>

          {cityLoading && (
            <p style={{ color: '#a89070', fontSize: 11, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 11, height: 11, border: '2px solid #d4c4a8', borderTopColor: '#7b6eb0', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              Loading cities…
            </p>
          )}
        </Field>

        {/* Date */}
        <div>
          <label style={{ display: 'block', fontSize: 10, color: '#a89070', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8, fontFamily: "'Crimson Text', Georgia, serif" }}>Travel Date</label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
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
                style={{
                  padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  border: isMultiDay === multi ? '2px solid rgba(123,110,176,0.5)' : '1.5px solid #d4c4a8',
                  background: isMultiDay === multi ? 'rgba(123,110,176,0.1)' : '#f0e8d8',
                  color: isMultiDay === multi ? '#7b6eb0' : '#a89070',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: "'Crimson Text', Georgia, serif",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {isMultiDay ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: '#a89070', marginBottom: 6, fontFamily: "'Crimson Text', Georgia, serif" }}>From</p>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#a89070', marginBottom: 6, fontFamily: "'Crimson Text', Georgia, serif" }}>To</p>
                <input type="date" value={form.dateTo} onChange={e => set('dateTo', e.target.value)} min={form.date || undefined} className="input-field" />
              </div>
            </div>
          ) : (
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" />
          )}
        </div>

        {/* Rating */}
        <Field label="Rating">
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => set('rating', form.rating === n ? 0 : n)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'transform 0.1s' }}>
                <IcoStar size={28} color={form.rating >= n ? '#c4922a' : '#d4c4a8'} filled={form.rating >= n} />
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {form.partners.map(name => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(107,124,181,0.12)', border: '1.5px solid rgba(107,124,181,0.35)', color: '#6b7cb5', fontSize: 12, padding: '5px 12px', borderRadius: 20, fontFamily: "'Crimson Text', Georgia, serif" }}>
                  <span>{name}</span>
                  <button type="button" onClick={() => togglePartner(name)} style={{ color: '#a89070', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                    <IcoX size={12} color="#a89070" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Picker toggle */}
          <button
            type="button"
            onClick={() => setPartnerPickerOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: partnerPickerOpen ? '#7b6eb0' : '#7a6048', border: partnerPickerOpen ? '1.5px solid rgba(123,110,176,0.4)' : '1.5px solid #d4c4a8', background: partnerPickerOpen ? 'rgba(123,110,176,0.08)' : '#f0e8d8', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Crimson Text', Georgia, serif" }}
          >
            <IcoUsers size={14} color={partnerPickerOpen ? '#7b6eb0' : '#7a6048'} />
            {partnerPickerOpen ? 'Close partner picker' : 'Choose travel partners'}
          </button>

          {partnerPickerOpen && (
            <div style={{ marginTop: 12, background: '#faf6ef', border: '1.5px solid #d4c4a8', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {partnerGroups.length > 0 ? partnerGroups.map(group => {
                const allSelected  = group.members.length > 0 && group.members.every(m => form.partners.includes(m));
                const someSelected = !allSelected && group.members.some(m => form.partners.includes(m));
                return (
                  <div key={group.id}>
                    {/* Group header row with Select-All checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        style={{ flexShrink: 0, width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${(allSelected || someSelected) ? '#7b6eb0' : '#d4c4a8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: allSelected ? '#7b6eb0' : someSelected ? 'rgba(123,110,176,0.3)' : 'transparent', transition: 'all 0.15s' }}
                        title={allSelected ? 'Deselect all' : 'Select all'}
                      >
                        {allSelected && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                        {someSelected && <span style={{ color: '#7b6eb0', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>–</span>}
                      </button>
                      <p style={{ fontSize: 11, color: '#7a6048', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: 0, fontFamily: "'Crimson Text', Georgia, serif" }}>
                        {group.emoji} {group.name}
                      </p>
                      <span style={{ fontSize: 10, color: '#a89070', marginLeft: 'auto', fontFamily: "'Crimson Text', Georgia, serif" }}>
                        {allSelected ? 'All selected' : someSelected ? `${group.members.filter(m => form.partners.includes(m)).length}/${group.members.length}` : 'Select all'}
                      </span>
                    </div>

                    {/* Individual member chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 24 }}>
                      {group.members.map(name => {
                        const selected = form.partners.includes(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => togglePartner(name)}
                            style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, border: selected ? '1.5px solid rgba(123,110,176,0.45)' : '1.5px solid #d4c4a8', background: selected ? 'rgba(123,110,176,0.12)' : '#f0e8d8', color: selected ? '#7b6eb0' : '#7a6048', cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Crimson Text', Georgia, serif" }}
                          >
                            {selected ? '✓ ' : ''}{name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }) : (
                <p style={{ color: '#a89070', fontSize: 12, fontStyle: 'italic', margin: 0, fontFamily: "'Crimson Text', Georgia, serif" }}>
                  No saved partners yet. Add people in the Home page, then pick them here.
                </p>
              )}

              {/* Custom / one-off partner */}
              <div style={{ paddingTop: 12, borderTop: '1px solid #d4c4a8' }}>
                <p style={{ fontSize: 10, color: '#a89070', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8, fontFamily: "'Crimson Text', Georgia, serif" }}>Add someone else</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Name…"
                    value={customPartnerInput}
                    onChange={e => setCustomPartnerInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomPartner())}
                    className="input-field"
                    style={{ flex: 1, padding: '8px 12px' }}
                  />
                  <button
                    type="button"
                    onClick={addCustomPartner}
                    disabled={!customPartnerInput.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, background: 'rgba(123,110,176,0.12)', color: '#7b6eb0', border: '1.5px solid rgba(123,110,176,0.35)', padding: '8px 14px', borderRadius: 10, cursor: customPartnerInput.trim() ? 'pointer' : 'not-allowed', opacity: customPartnerInput.trim() ? 1 : 0.4, transition: 'all 0.15s', fontFamily: "'Crimson Text', Georgia, serif" }}
                  >
                    <IcoPlus size={13} color="#7b6eb0" /> Add
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

        {/* Season */}
        <Field label="Season">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { value: 'Spring', Icon: IcoFlower,    color: '#c4809a' },
              { value: 'Summer', Icon: IcoSun,       color: '#c4922a' },
              { value: 'Autumn', Icon: IcoMapleLeaf, color: '#b07040' },
              { value: 'Winter', Icon: IcoSnowflake, color: '#6b7cb5' },
            ].map(({ value, Icon, color }) => {
              const active = form.season === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('season', active ? '' : value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    border: active ? `2px solid ${color}` : '1.5px solid #d4c4a8',
                    background: active ? `${color}18` : '#f0e8d8',
                    color: active ? color : '#a89070',
                    fontFamily: "'Crimson Text', Georgia, serif",
                    fontSize: 13, fontWeight: active ? 700 : 500,
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={18} color={active ? color : '#a89070'} />
                  {value}
                </button>
              );
            })}
          </div>
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
          style={{ width: '100%', background: saving ? 'rgba(123,110,176,0.5)' : '#7b6eb0', color: '#fff', fontWeight: 700, padding: '13px', borderRadius: 12, border: 'none', fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1, fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {saving ? (
            <>
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              {uploadStatus || 'Saving…'}
            </>
          ) : (isEdit ? 'Update Memory' : 'Save Memory')}
        </button>

        {saving && photos.some(p => p instanceof File) && (
          <div style={{ background: 'rgba(212,196,168,0.3)', border: '1.5px solid #d4c4a8', borderRadius: 14, padding: '10px 14px', textAlign: 'center' }}>
            <p style={{ color: '#a89070', fontSize: 11, margin: 0 }}>
              Photos are being compressed &amp; processed — please keep this page open.
            </p>
          </div>
        )}
      </form>

      <style>{`
        .input-field {
          width: 100%;
          background: #f0e8d8;
          border: 1.5px solid #d4c4a8;
          border-radius: 10px;
          padding: 10px 12px;
          color: #2c1a0e;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
          font-family: 'Crimson Text', Georgia, serif;
          box-sizing: border-box;
        }
        .input-field:focus { border-color: #7b6eb0; }
        .input-field::placeholder { color: #a89070; }
        .input-field:disabled { opacity: 0.5; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, color: '#a89070', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 7, fontFamily: "'Crimson Text', Georgia, serif" }}>{label}</label>
      {children}
    </div>
  );
}
