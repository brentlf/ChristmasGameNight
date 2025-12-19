'use client';

import { useState, useEffect, useMemo } from 'react';
import { getLanguage, t } from '@/lib/i18n';
import { traditionsChristmasPool } from '@/content/traditions_christmas';
import type { TraditionItem, TraditionWheel as TraditionWheelType } from '@/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import TraditionWheel from '@/app/components/TraditionWheel';

const STORAGE_KEY_LOCAL = 'traditionWheel_local';
const STORAGE_KEY_MODE = 'traditionWheel_mode';
const STORAGE_KEY_WHEEL_ID = 'traditionWheel_id';

export default function TraditionsPage() {
  const DEBUG = process.env.NODE_ENV !== 'production';
  const lang = getLanguage();
  const router = useRouter();
  const [mode, setMode] = useState<'local' | 'synced'>('local');
  const [wheelId, setWheelId] = useState<string | null>(null);
  const [wheel, setWheel] = useState<TraditionWheelType | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [selectedTradition, setSelectedTradition] = useState<TraditionItem | null>(null);
  const [pendingSelection, setPendingSelection] = useState<TraditionItem | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  // Freeze the wheel segments for a spin so they don't change after we mark a tradition as used.
  const [wheelTraditions, setWheelTraditions] = useState<TraditionItem[]>(traditionsChristmasPool);
  const [freezeWheel, setFreezeWheel] = useState(false);
  // Local-mode source of truth (do NOT rely on localStorage reads to drive renders).
  const [localUsedIds, setLocalUsedIds] = useState<string[]>([]);
  const [userUid, setUserUid] = useState<string | null>(null);

  useEffect(() => {
    // Check URL params for wheel ID
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const wheelParam = params.get('wheel');
      if (wheelParam) {
        setMode('synced');
        setWheelId(wheelParam);
        localStorage.setItem(STORAGE_KEY_MODE, 'synced');
        localStorage.setItem(STORAGE_KEY_WHEEL_ID, wheelParam);
        return;
      }
    }

    const storedMode = localStorage.getItem(STORAGE_KEY_MODE) as 'local' | 'synced' | null;
    const storedWheelId = localStorage.getItem(STORAGE_KEY_WHEEL_ID);
    
    if (storedMode === 'synced' && storedWheelId) {
      setMode('synced');
      setWheelId(storedWheelId);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserUid(user?.uid ?? null);
    });

    return () => unsubscribe();
  }, []);

  // Load local wheel
  useEffect(() => {
    if (mode === 'local') {
      const stored = localStorage.getItem(STORAGE_KEY_LOCAL);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setSelectedTradition(data.selectedTradition ? traditionsChristmasPool.find(t => t.id === data.selectedTradition.id) || null : null);
          setLocalUsedIds(Array.isArray(data.usedIds) ? data.usedIds : []);
        } catch {}
      } else {
        setLocalUsedIds([]);
      }
      setLoading(false);
    }
  }, [mode]);

  // Load synced wheel
  useEffect(() => {
    if (mode === 'synced' && wheelId) {
      setLoading(true);
      const wheelRef = doc(db, 'traditionWheels', wheelId);
      const unsubscribe = onSnapshot(wheelRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as TraditionWheelType;
          setWheel({ ...data, id: snap.id });
          if (data.lastSpunAt) {
            const lastSpunDate = new Date(data.lastSpunAt);
            const today = new Date();
            if (lastSpunDate.toDateString() === today.toDateString() && data.usedIds.length > 0) {
              const lastUsedId = data.usedIds[data.usedIds.length - 1];
              setSelectedTradition(traditionsChristmasPool.find(t => t.id === lastUsedId) || null);
            } else {
              setSelectedTradition(null);
            }
          } else {
            setSelectedTradition(null);
          }
        } else {
          setWheel(null);
          setSelectedTradition(null);
        }
        setLoading(false);
      }, (error) => {
        console.error('Error loading wheel:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else if (mode === 'synced' && !wheelId) {
      setLoading(false);
    }
  }, [mode, wheelId]);

  const availableTraditions = useMemo(() => {
    if (mode === 'local') {
      return traditionsChristmasPool.filter((t) => !localUsedIds.includes(t.id));
    }
    if (wheel) {
      return traditionsChristmasPool.filter((t) => !wheel.usedIds.includes(t.id));
    }
    return traditionsChristmasPool;
  }, [mode, wheel, localUsedIds]);

  // Auto-unfreeze when there's no active selection (e.g. day rollover, switching modes).
  useEffect(() => {
    if (spinning) return;
    if (pendingSelection) return;
    if (selectedTradition) return;
    setFreezeWheel(false);
  }, [pendingSelection, selectedTradition, spinning]);

  // Keep the wheel showing the current available set unless we're frozen after a spin.
  // (This prevents a post-spin re-render from removing the selected slice and shifting the top segment.)
  useEffect(() => {
    if (spinning) return;
    if (freezeWheel) return;
    setWheelTraditions(availableTraditions);
  }, [availableTraditions, freezeWheel, spinning]);

  const usedTraditions = useMemo(() => {
    if (mode === 'local') {
      return traditionsChristmasPool.filter((t) => localUsedIds.includes(t.id));
    } else if (wheel) {
      return traditionsChristmasPool.filter(t => wheel.usedIds.includes(t.id));
    }
    return [];
  }, [mode, wheel, localUsedIds]);

  const handleSpin = async () => {
    if (availableTraditions.length === 0) {
      toast.error(lang === 'en' ? 'No traditions available. Reset the wheel first.' : 'Žádné tradice k dispozici. Nejdříve resetujte kolo.');
      return;
    }

    // Freeze the segment list for this spin (so the visual wheel can't shift after completion)
    const snapshot = availableTraditions;
    setWheelTraditions(snapshot);
    setFreezeWheel(true);

    // Wheel will decide the final slice and report it back.
    setPendingSelection(null);
    setSelectedTradition(null); // Clear previous selection during spin
    setSpinning(true);

    if (DEBUG) {
      console.log('[TraditionsPage] spin clicked', {
        mode,
        availableLen: availableTraditions.length,
        wheelTraditionsLen: snapshot.length,
        usedLen: usedTraditions.length,
        lastSelectedId: selectedTradition?.id ?? null,
        lastSelectedLabel: selectedTradition?.[lang] ?? null,
      });
    }
  };

  const handleAISpin = async () => {
    if (spinning || aiBusy) return;
    setAiBusy(true);
    try {
      const res = await fetch('/api/ai-tradition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to generate tradition' }));
        throw new Error(err?.error || 'Failed to generate tradition');
      }

      const ai = (await res.json()) as { id: string; en: string; cs: string };
      const aiTradition: TraditionItem = {
        id: String(ai.id),
        en: String(ai.en),
        cs: String(ai.cs),
      };

      // For this spin, add the AI option as an extra slice and force the wheel to land on it.
      const snapshot = [...availableTraditions, aiTradition];
      setWheelTraditions(snapshot);
      setFreezeWheel(true);
      setPendingSelection(aiTradition);
      setSelectedTradition(null);
      setSpinning(true);
    } catch (e: any) {
      toast.error(e?.message || (lang === 'cs' ? 'AI se nepovedlo.' : 'AI failed.'));
      setFreezeWheel(false);
    } finally {
      setAiBusy(false);
    }
  };

  const handleSpinComplete = async (actualSelectedTradition: TraditionItem) => {
    if (!actualSelectedTradition) {
      setSpinning(false);
      return;
    }
    
    // Use the tradition that's actually at the top of the wheel
    const selected = actualSelectedTradition;
    setSelectedTradition(selected);
    setPendingSelection(null);

    const isAiTradition = !traditionsChristmasPool.some((t) => t.id === selected.id);
    if (isAiTradition) {
      // Don't persist AI picks into the used list / synced wheel, since they are intentionally outside the pool.
      setFreezeWheel(false);
      setWheelTraditions(availableTraditions);
      setSpinning(false);
      toast.success(lang === 'en' ? `AI picked: ${selected.en}` : `AI vybralo: ${selected.cs}`);
      return;
    }

    if (DEBUG) {
      console.log('[TraditionsPage] spin complete callback', {
        selectedId: selected.id,
        selectedLabel: selected[lang],
        wheelTraditionsLen: wheelTraditions.length,
        availableLenBeforeUpdate: availableTraditions.length,
      });
    }

    if (mode === 'local') {
      const stored = localStorage.getItem(STORAGE_KEY_LOCAL);
      const data = stored ? JSON.parse(stored) : { usedIds: [] };
      const nextUsedIds = [...(data.usedIds || []), selected.id];
      data.usedIds = nextUsedIds;
      data.selectedTradition = selected;
      data.lastSpunAt = Date.now();
      localStorage.setItem(STORAGE_KEY_LOCAL, JSON.stringify(data));
      setLocalUsedIds(nextUsedIds);
    } else if (wheel && userUid && wheel.controllerUid === userUid) {
      const wheelRef = doc(db, 'traditionWheels', wheel.id);
      await updateDoc(wheelRef, {
        usedIds: [...wheel.usedIds, selected.id],
        lastSpunAt: Date.now(),
      });
    }

    setSpinning(false);
    toast.success(lang === 'en' ? `Selected: ${selected.en}` : `Vybráno: ${selected.cs}`);
  };

  const handleRestoreTradition = async (traditionId: string) => {
    // Restores are explicit user actions; allow the wheel to re-render to reflect the new available set.
    setFreezeWheel(false);
    if (mode === 'local') {
      const stored = localStorage.getItem(STORAGE_KEY_LOCAL);
      const data = stored ? JSON.parse(stored) : { usedIds: [] };
      const nextUsedIds = (data.usedIds || []).filter((id: string) => id !== traditionId);
      data.usedIds = nextUsedIds;
      if (data.selectedTradition?.id === traditionId) {
        data.selectedTradition = null;
      }
      localStorage.setItem(STORAGE_KEY_LOCAL, JSON.stringify(data));
      setLocalUsedIds(nextUsedIds);
      if (selectedTradition?.id === traditionId) setSelectedTradition(null);
    } else if (wheel && userUid && wheel.controllerUid === userUid) {
      const wheelRef = doc(db, 'traditionWheels', wheel.id);
      await updateDoc(wheelRef, {
        usedIds: wheel.usedIds.filter(id => id !== traditionId),
        lastSpunAt: wheel.usedIds.length === 1 ? null : wheel.lastSpunAt,
      });
      if (selectedTradition?.id === traditionId) setSelectedTradition(null);
    }
  };

  const handleRestoreAll = async () => {
    setFreezeWheel(false);
    if (mode === 'local') {
      localStorage.setItem(STORAGE_KEY_LOCAL, JSON.stringify({ usedIds: [], selectedTradition: null }));
      setLocalUsedIds([]);
      setSelectedTradition(null);
      toast.success(lang === 'en' ? 'All traditions restored' : 'Všechny tradice obnoveny');
    } else if (wheel && userUid && wheel.controllerUid === userUid) {
      const wheelRef = doc(db, 'traditionWheels', wheel.id);
      await updateDoc(wheelRef, {
        usedIds: [],
        lastSpunAt: null,
      });
      setSelectedTradition(null);
      toast.success(lang === 'en' ? 'All traditions restored' : 'Všechny tradice obnoveny');
    }
  };

  const handleCreateWheel = async (name: string) => {
    if (!userUid) {
      toast.error(lang === 'en' ? 'Please sign in first' : 'Nejdříve se přihlaste');
      return;
    }

    const newWheel: Omit<TraditionWheelType, 'id'> = {
      name,
      traditions: traditionsChristmasPool,
      usedIds: [],
      createdAt: Date.now(),
      controllerUid: userUid,
    };

    const wheelRef = doc(db, 'traditionWheels');
    await setDoc(wheelRef, newWheel);
    const newId = wheelRef.id;
    
    setWheelId(newId);
    setMode('synced');
    localStorage.setItem(STORAGE_KEY_MODE, 'synced');
    localStorage.setItem(STORAGE_KEY_WHEEL_ID, newId);
    
    toast.success(lang === 'en' ? 'Wheel created! Share the link.' : 'Kolo vytvořeno! Sdílejte odkaz.');
  };

  const handleJoinWheel = async (id: string) => {
    const wheelRef = doc(db, 'traditionWheels', id);
    const snap = await getDoc(wheelRef);
    
    if (!snap.exists()) {
      toast.error(lang === 'en' ? 'Wheel not found' : 'Kolo nenalezeno');
      return;
    }

    setWheelId(id);
    setMode('synced');
    localStorage.setItem(STORAGE_KEY_MODE, 'synced');
    localStorage.setItem(STORAGE_KEY_WHEEL_ID, id);
    toast.success(lang === 'en' ? 'Joined wheel!' : 'Připojeno ke kolu!');
  };

  const handleSwitchToLocal = () => {
    setMode('local');
    setWheelId(null);
    setWheel(null);
    localStorage.setItem(STORAGE_KEY_MODE, 'local');
    localStorage.removeItem(STORAGE_KEY_WHEEL_ID);
  };

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="text-4xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  return (
    <main className="h-dvh px-3 md:px-4 py-4 md:py-6 flex flex-col overflow-hidden">
      <div className="mx-auto max-w-6xl w-full flex-1 min-h-0 flex flex-col">
        <div className="mb-3 md:mb-4 text-center shrink-0">
          <div className="inline-flex items-center gap-1.5 md:gap-2 rounded-full bg-white/10 border border-white/20 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-white/80 backdrop-blur-md">
            <span>🎡</span>
            <span>{t('traditions.title', lang)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0 overflow-auto pr-1">
          <div className="xl:col-span-8">
            <div className="card relative overflow-hidden">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
              <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

              <div className="relative">
                <h1 className="game-show-title mb-1.5 md:mb-2 text-center text-2xl md:text-3xl">{t('traditions.title', lang)}</h1>
                <p className="text-center text-white/75 mb-4 md:mb-6 text-sm md:text-base">{t('traditions.subtitle', lang)}</p>

                {/* Mode selector */}
                <div className="flex gap-2 mb-4 md:mb-6 justify-center">
                  <button
                    onClick={handleSwitchToLocal}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm transition ${
                      mode === 'local'
                        ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white'
                        : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {t('traditions.localMode', lang)}
                  </button>
                  <button
                    onClick={() => {
                      if (mode === 'synced' && !wheelId) {
                        // Show join/create dialog
                      } else {
                        setMode('synced');
                        localStorage.setItem(STORAGE_KEY_MODE, 'synced');
                      }
                    }}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm transition ${
                      mode === 'synced'
                        ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white'
                        : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {t('traditions.syncedMode', lang)}
                  </button>
                </div>

                {/* Create/Join for synced mode */}
                {mode === 'synced' && !wheel && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                    <CreateWheelDialog onCreate={handleCreateWheel} lang={lang} />
                    <JoinWheelDialog onJoin={handleJoinWheel} lang={lang} />
                  </div>
                )}

                {/* Spinning Wheel */}
                <div className="mb-4 md:mb-6 lg:mb-8">
                  <TraditionWheel
                    traditions={wheelTraditions}
                    selectedTradition={pendingSelection || selectedTradition}
                    spinning={spinning}
                    lang={lang}
                    onSpinComplete={handleSpinComplete}
                  />
                </div>

                {/* Selected tradition */}
                {selectedTradition && !spinning && (
                  <div className="rounded-xl md:rounded-2xl border border-christmas-gold/40 bg-christmas-gold/10 p-4 md:p-6 mb-4 md:mb-6 text-center animate-scale-in">
                    <p className="text-xs md:text-sm text-white/70 mb-1.5 md:mb-2">{t('traditions.todaysTradition', lang)}</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold text-christmas-gold">{selectedTradition[lang]}</p>
                  </div>
                )}

                {/* Spin button */}
                <div className="text-center mb-4 md:mb-6">
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center items-center">
                    <button
                      onClick={handleSpin}
                      disabled={spinning || availableTraditions.length === 0}
                      className="btn-primary text-lg md:text-xl lg:text-2xl px-6 md:px-8 py-3 md:py-4 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform"
                    >
                      {spinning ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin">🎡</span>
                          {t('traditions.spinning', lang)}
                        </span>
                      ) : (
                        `🎡 ${t('traditions.spin', lang)}`
                      )}
                    </button>

                    <button
                      onClick={handleAISpin}
                      disabled={spinning || aiBusy}
                      className="btn-secondary text-sm md:text-base lg:text-lg px-4 md:px-6 py-2.5 md:py-3 lg:py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={lang === 'cs' ? 'AI vymyslí novou tradici mimo seznam 20' : 'AI generates a new tradition outside the 20-list'}
                    >
                      {aiBusy ? (lang === 'cs' ? '✨ AI…' : '✨ AI…') : lang === 'cs' ? '✨ AI překvapení' : '✨ AI Surprise'}
                    </button>
                  </div>
                </div>

                {/* Share link for synced mode */}
                {mode === 'synced' && wheel && userUid === wheel.controllerUid && (
                  <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4 mb-4 md:mb-6">
                    <p className="text-xs md:text-sm font-semibold mb-1.5 md:mb-2">{t('traditions.shareLink', lang)}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/traditions?wheel=${wheel.id}`}
                        className="input-field flex-1 text-xs md:text-sm"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/traditions?wheel=${wheel.id}`);
                          toast.success(t('common.copied', lang));
                        }}
                        className="btn-secondary text-xs md:text-sm"
                      >
                        {t('common.copy', lang)}
                      </button>
                    </div>
                  </div>
                )}

                {/* Available traditions count */}
                <div className="text-center text-white/70 mb-3 md:mb-4 text-xs md:text-sm">
                  {availableTraditions.length} {t('traditions.availableTraditions', lang).toLowerCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Used traditions (right column on desktop) */}
          <div className="xl:col-span-4">
            <div className="card h-full">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold">{t('traditions.usedTraditions', lang)}</h2>
                {(mode === 'local' || (wheel && userUid === wheel.controllerUid)) && usedTraditions.length > 0 && (
                  <button onClick={handleRestoreAll} className="btn-secondary text-xs md:text-sm">
                    {t('traditions.restoreAll', lang)}
                  </button>
                )}
              </div>

              {usedTraditions.length === 0 ? (
                <div className="text-xs md:text-sm text-white/60">
                  {lang === 'cs' ? 'Zatím žádné použité tradice.' : 'No used traditions yet.'}
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {usedTraditions.map((tradition) => (
                    <div
                      key={tradition.id}
                      className="rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4 flex items-center justify-between gap-2 md:gap-3"
                    >
                      <span className="text-xs md:text-sm text-white/80">{tradition[lang]}</span>
                      {(mode === 'local' || (wheel && userUid === wheel.controllerUid)) && (
                        <button
                          onClick={() => handleRestoreTradition(tradition.id)}
                          className="btn-secondary text-xs px-2 md:px-3 py-1 shrink-0"
                        >
                          {t('traditions.restoreTradition', lang)}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function CreateWheelDialog({ onCreate, lang }: { onCreate: (name: string) => void; lang: 'en' | 'cs' }) {
  const [name, setName] = useState('');
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="btn-primary w-full">
        {t('traditions.createWheel', lang)}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('traditions.wheelNamePlaceholder', lang)}
        className="input-field mb-3"
      />
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (name.trim()) {
              onCreate(name.trim());
              setShow(false);
              setName('');
            }
          }}
          className="btn-primary flex-1"
        >
          {t('traditions.createWheel', lang)}
        </button>
        <button onClick={() => { setShow(false); setName(''); }} className="btn-secondary">
          {t('common.close', lang)}
        </button>
      </div>
    </div>
  );
}

function JoinWheelDialog({ onJoin, lang }: { onJoin: (id: string) => void; lang: 'en' | 'cs' }) {
  const [id, setId] = useState('');
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="btn-secondary w-full">
        {t('traditions.joinWheel', lang)}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <input
        type="text"
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder={t('traditions.wheelIdPlaceholder', lang)}
        className="input-field mb-3"
      />
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (id.trim()) {
              onJoin(id.trim());
              setShow(false);
              setId('');
            }
          }}
          className="btn-primary flex-1"
        >
          {t('traditions.join', lang)}
        </button>
        <button onClick={() => { setShow(false); setId(''); }} className="btn-secondary">
          {t('common.close', lang)}
        </button>
      </div>
    </div>
  );
}
