import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  collection, doc, setDoc, addDoc,
  updateDoc, deleteDoc, onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const TravelContext = createContext(null);

export const DEFAULT_STATUS_COLORS = {
  visited: '#22c55e',
  bucketList: '#eab308',
  current: '#3b82f6',
};

// Keep old export name for backward compat
export const STATUS_COLORS = DEFAULT_STATUS_COLORS;

export function TravelProvider({ children }) {
  const { user } = useAuth();
  const [countryStatuses, setCountryStatuses] = useState({});
  const [memories, setMemories] = useState([]);
  const [tripPlans, setTripPlans] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memoriesError, setMemoriesError] = useState('');

  useEffect(() => {
    if (!user) {
      setCountryStatuses({});
      setMemories([]);
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setTripPlans([]);

    const statusUnsub = onSnapshot(
      collection(db, 'users', user.uid, 'countryStatuses'),
      (snap) => {
        const statuses = {};
        snap.forEach(d => { statuses[d.id] = d.data(); });
        setCountryStatuses(statuses);
      },
      (err) => console.error('Status listener error:', err)
    );

    const memoriesUnsub = onSnapshot(
      collection(db, 'users', user.uid, 'memories'),
      (snap) => {
        const mems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort newest first in JS — avoids needing a Firestore composite index
        mems.sort((a, b) => {
          const da = a.date || a.createdAt || '';
          const db2 = b.date || b.createdAt || '';
          return db2.localeCompare(da);
        });
        setMemories(mems);
        setLoading(false);
      },
      (err) => {
        console.error('Memories listener error:', err);
        setMemoriesError(err.message || 'Failed to load memories');
        setLoading(false);
      }
    );

    const profileUnsub = onSnapshot(
      doc(db, 'users', user.uid, 'profile', 'main'),
      (snap) => { if (snap.exists()) setProfile(snap.data()); },
      (err) => console.error('Profile listener error:', err)
    );

    const plansUnsub = onSnapshot(
      collection(db, 'users', user.uid, 'tripPlans'),
      (snap) => {
        const plans = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort soonest first
        plans.sort((a, b) => (a.dateFrom || '').localeCompare(b.dateFrom || ''));
        setTripPlans(plans);
      },
      (err) => console.error('Trip plans listener error:', err)
    );

    return () => { statusUnsub(); memoriesUnsub(); profileUnsub(); plansUnsub(); };
  }, [user]);

  // Merge default colors with user's custom colors
  const statusColors = useMemo(() => ({
    ...DEFAULT_STATUS_COLORS,
    ...(profile?.statusColors || {}),
  }), [profile]);

  // Count memories per country code for heatmap
  const memoryCounts = useMemo(() => {
    const counts = {};
    memories.forEach(m => {
      if (m.countryCode) counts[m.countryCode] = (counts[m.countryCode] || 0) + 1;
    });
    return counts;
  }, [memories]);

  const setCountryStatus = useCallback(async (countryCode, status) => {
    if (!user) return;
    if (status === null) {
      // Remove status — optimistic delete then Firestore delete
      setCountryStatuses(prev => {
        const next = { ...prev };
        delete next[countryCode];
        return next;
      });
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'countryStatuses', countryCode));
      } catch (err) {
        console.error('Failed to remove country status:', err);
      }
    } else {
      // Preserve existing fields (e.g. bucket-list note) when changing status
      setCountryStatuses(prev => ({
        ...prev,
        [countryCode]: { ...(prev[countryCode] || {}), status },
      }));
      try {
        // merge:true so any existing 'note' field is not wiped
        await setDoc(
          doc(db, 'users', user.uid, 'countryStatuses', countryCode),
          { status },
          { merge: true }
        );
      } catch (err) {
        console.error('Failed to save country status:', err);
      }
    }
  }, [user]);

  const updateCountryNote = useCallback(async (countryCode, note) => {
    if (!user) return;
    setCountryStatuses(prev => ({
      ...prev,
      [countryCode]: { ...(prev[countryCode] || {}), note },
    }));
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'countryStatuses', countryCode),
        { note },
        { merge: true }
      );
    } catch (err) {
      console.error('Failed to save bucket-list note:', err);
    }
  }, [user]);

  const addMemory = useCallback(async (memoryData) => {
    if (!user) return null;
    const docRef = await addDoc(collection(db, 'users', user.uid, 'memories'), {
      ...memoryData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  }, [user]);

  const updateMemory = useCallback(async (memoryId, data) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'memories', memoryId), data);
  }, [user]);

  const deleteMemory = useCallback(async (memoryId) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'memories', memoryId));
  }, [user]);

  const addTripPlan = useCallback(async (data) => {
    if (!user) return null;
    const docRef = await addDoc(collection(db, 'users', user.uid, 'tripPlans'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  }, [user]);

  const updateTripPlan = useCallback(async (planId, data) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'tripPlans', planId), data);
  }, [user]);

  const deleteTripPlan = useCallback(async (planId) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'tripPlans', planId));
  }, [user]);

  const updateProfile = useCallback(async (profileData) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'profile', 'main'), profileData, { merge: true });
    setProfile(prev => ({ ...prev, ...profileData }));
  }, [user]);

  const uploadPhoto = useCallback(async (file) => {
    // Convert to base64 and store directly in Firestore — no external service needed.
    // File should already be compressed (≈100 KB) before calling this.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);  // returns "data:image/jpeg;base64,..."
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const getCountryColor = useCallback((countryCode) => {
    const code = String(countryCode);

    // Home country gets its own distinctive highlight colour
    if (profile?.homeCountry?.code === code) {
      return profile?.homeCountryColor || '#ff6b6b';
    }

    const status = countryStatuses[code]?.status;
    if (!status) return 'rgba(255,255,255,0.07)';
    const baseColor = statusColors[status];
    // Heatmap: more memories = higher opacity for visited countries
    if (status === 'visited') {
      const count = memoryCounts[code] || 0;
      const opacity = count === 0 ? 0.55 : Math.min(0.55 + count * 0.12, 1);
      return baseColor + Math.round(opacity * 255).toString(16).padStart(2, '0');
    }
    return baseColor;
  }, [countryStatuses, statusColors, memoryCounts, profile]);

  const stats = {
    visited: Object.values(countryStatuses).filter(s => s.status === 'visited').length,
    bucketList: Object.values(countryStatuses).filter(s => s.status === 'bucketList').length,
    current: Object.values(countryStatuses).filter(s => s.status === 'current').length,
  };

  return (
    <TravelContext.Provider value={{
      countryStatuses, memories, tripPlans, profile, loading, memoriesError,
      setCountryStatus, updateCountryNote, addMemory, updateMemory, deleteMemory,
      addTripPlan, updateTripPlan, deleteTripPlan,
      updateProfile, uploadPhoto, getCountryColor,
      stats, statusColors, memoryCounts,
    }}>
      {children}
    </TravelContext.Provider>
  );
}

export function useTravel() {
  return useContext(TravelContext);
}
