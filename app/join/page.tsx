'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLanguage, t } from '@/lib/i18n';
import { findRoomByCode } from '@/lib/utils/room';
import { useRoom } from '@/lib/hooks/useRoom';
import toast from 'react-hot-toast';
import { validateRoomPin } from '@/lib/utils/room';
import { useAudio } from '@/lib/contexts/AudioContext';
import { reconnectPlayer } from '@/lib/utils/reconnect';
import { auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';

export default function JoinPage() {
  const router = useRouter();
  const lang = getLanguage();
  const { playSound, vibrate } = useAudio();
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const { room } = useRoom(roomId);
  const [loading, setLoading] = useState(false);
  const [pinOk, setPinOk] = useState(false);
  const [showReconnect, setShowReconnect] = useState(false);
  const [reconnectCode, setReconnectCode] = useState('');
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code');
      if (codeParam && !roomId) {
        setCode(codeParam.toUpperCase());
        findRoomByCode(codeParam.toUpperCase()).then((foundRoomId) => {
          if (foundRoomId) {
            setRoomId(foundRoomId);
          }
        }).catch(() => {});
      }
    }
  }, [roomId]);

  const handleCodeSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const codeToUse = code.trim().toUpperCase();
    if (!codeToUse || codeToUse.length !== 4) {
      if (e) {
        toast.error(t('join.invalidCode', lang));
      }
      return;
    }

    playSound('ui.click');
    setLoading(true);
    try {
      const foundRoomId = await findRoomByCode(codeToUse);
      if (!foundRoomId) {
        toast.error(t('join.invalidCode', lang));
        playSound('ui.error');
        vibrate(15);
        setLoading(false);
        return;
      }
      playSound('ui.success');
      vibrate(10);
      setRoomId(foundRoomId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to find room');
      playSound('ui.error');
      vibrate(15);
      setLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (!room || !roomId) return;
    if (!room.pinEnabled) {
      router.push(`/room/${roomId}/play`);
      return;
    }

    if (!pin || pin.length !== 4) {
      toast.error(t('join.wrongPin', lang));
      return;
    }

    playSound('ui.lock_in');
    vibrate(10);
    try {
      const ok = await validateRoomPin(roomId, pin);
      if (!ok) {
        playSound('game.wrong', 0.3);
        vibrate([20, 30, 20]);
        toast.error(t('join.wrongPin', lang));
        return;
      }
      playSound('ui.success');
      vibrate([10, 20, 10]);
      setPinOk(true);
      router.push(`/room/${roomId}/play`);
    } catch (e: any) {
      toast.error(e?.message || t('common.error', lang));
      playSound('ui.error');
    }
  };

  if (room && room.pinEnabled && !pinOk) {
    return (
      <main className="min-h-dvh px-3 md:px-4 py-4 md:py-6">
        <div className="mx-auto max-w-lg">
          <div className="card relative overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-red/15 blur-3xl" />
            <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-gold/12 blur-3xl" />

            <div className="relative">
              <div className="mb-4 md:mb-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-white/80 backdrop-blur-md">
                  <span>🔒</span>
                  <span>Room PIN</span>
                </div>
              </div>

              <h1 className="game-show-title mb-2 md:mb-3 text-center text-2xl md:text-3xl">{t('join.title', lang)}</h1>
              <p className="text-center text-white/75 mb-4 md:mb-6 text-sm md:text-base">{t('join.enterPin', lang)}</p>

              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\\D/g, '').slice(0, 4))}
                placeholder={t('join.pinPlaceholder', lang)}
                className="input-field text-center text-xl md:text-2xl font-bold tracking-widest mb-3 md:mb-4"
                maxLength={4}
              />
              <button onClick={handlePinSubmit} className="btn-primary w-full text-sm md:text-base">
                🎟️ {t('join.join', lang)}
              </button>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowReconnect(!showReconnect)}
                  className="text-xs text-white/60 hover:text-white/80 underline"
                >
                  {showReconnect 
                    ? (lang === 'cs' ? '← Zpět' : '← Back')
                    : (lang === 'cs' ? 'Mám kód pro opětovné připojení' : 'Have a reconnect code?')}
                </button>
                
                {showReconnect && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={reconnectCode}
                      onChange={(e) => setReconnectCode(e.target.value.toUpperCase().replace(/[^A-Z0-9🎄🎅❄️🎁🎀🎊🎉🌟⭐✨🔥💫🎯🏆🎪🎭🎨🎬🎤🎧🎵🎶🎸🎹🎺🎷🥁🎲🎮🕹️]/g, ''))}
                      placeholder={lang === 'cs' ? 'Zadejte kód' : 'Enter reconnect code'}
                      className="input-field text-center text-lg font-bold"
                      maxLength={20}
                    />
                    <button
                      onClick={async () => {
                        if (!reconnectCode.trim() || !roomId) return;
                        setReconnecting(true);
                        try {
                          // Ensure authenticated
                          if (!auth.currentUser) {
                            await signInAnonymously(auth);
                          }
                          if (!auth.currentUser) {
                            throw new Error('Failed to authenticate');
                          }
                          
                          await reconnectPlayer(roomId, reconnectCode.trim(), auth.currentUser.uid);
                          playSound('ui.success');
                          vibrate([10, 20, 10]);
                          toast.success(lang === 'cs' ? 'Úspěšně připojeno!' : 'Successfully reconnected!');
                          router.push(`/room/${roomId}/play`);
                        } catch (e: any) {
                          playSound('ui.error');
                          vibrate([20, 30, 20]);
                          toast.error(e?.message || (lang === 'cs' ? 'Neplatný kód' : 'Invalid code'));
                        } finally {
                          setReconnecting(false);
                        }
                      }}
                      disabled={reconnecting || !reconnectCode.trim()}
                      className="btn-secondary w-full text-sm"
                    >
                      {reconnecting 
                        ? (lang === 'cs' ? 'Připojování...' : 'Reconnecting...')
                        : (lang === 'cs' ? '🔗 Opětovně připojit' : '🔗 Reconnect')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  useEffect(() => {
    if (room && !room.pinEnabled && roomId) {
      router.push(`/room/${roomId}/play`);
    }
  }, [room, roomId, router]);
  
  if (room && !room.pinEnabled) {
    return null;
  }

  return (
    <main className="min-h-dvh px-4 py-6 md:py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
            <span>🎟️</span>
            <span>Join the show</span>
            <span className="text-white/40">•</span>
            <span className="text-white/70">Enter room code</span>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-green/15 blur-3xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-gold/12 blur-3xl" />

          <div className="relative">
            <h1 className="game-show-title mb-3 text-center">{t('join.title', lang)}</h1>
            <p className="text-center text-white/75 mb-8">
              Got a code on the TV? Type it below and you’re in.
            </p>

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/80">
                  {t('join.enterCode', lang)}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                  placeholder={t('join.codePlaceholder', lang)}
                  className="input-field text-center text-3xl font-black tracking-[0.35em]"
                  maxLength={4}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t('common.loading', lang) : `🎟️ ${t('join.join', lang)}`}
              </button>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowReconnect(!showReconnect)}
                  className="text-xs text-white/60 hover:text-white/80 underline"
                >
                  {showReconnect 
                    ? (lang === 'cs' ? '← Zpět' : '← Back')
                    : (lang === 'cs' ? 'Mám kód pro opětovné připojení' : 'Have a reconnect code?')}
                </button>
                
                {showReconnect && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={reconnectCode}
                      onChange={(e) => setReconnectCode(e.target.value.toUpperCase().replace(/[^A-Z0-9🎄🎅❄️🎁🎀🎊🎉🌟⭐✨🔥💫🎯🏆🎪🎭🎨🎬🎤🎧🎵🎶🎸🎹🎺🎷🥁🎲🎮🕹️]/g, ''))}
                      placeholder={lang === 'cs' ? 'Zadejte kód' : 'Enter reconnect code'}
                      className="input-field text-center text-lg font-bold"
                      maxLength={20}
                    />
                    <button
                      onClick={async () => {
                        if (!reconnectCode.trim() || !roomId) return;
                        setReconnecting(true);
                        try {
                          // Ensure authenticated
                          if (!auth.currentUser) {
                            await signInAnonymously(auth);
                          }
                          if (!auth.currentUser) {
                            throw new Error('Failed to authenticate');
                          }
                          
                          await reconnectPlayer(roomId, reconnectCode.trim(), auth.currentUser.uid);
                          playSound('ui.success');
                          vibrate([10, 20, 10]);
                          toast.success(lang === 'cs' ? 'Úspěšně připojeno!' : 'Successfully reconnected!');
                          router.push(`/room/${roomId}/play`);
                        } catch (e: any) {
                          playSound('ui.error');
                          vibrate([20, 30, 20]);
                          toast.error(e?.message || (lang === 'cs' ? 'Neplatný kód' : 'Invalid code'));
                        } finally {
                          setReconnecting(false);
                        }
                      }}
                      disabled={reconnecting || !reconnectCode.trim()}
                      className="btn-secondary w-full text-sm"
                    >
                      {reconnecting 
                        ? (lang === 'cs' ? 'Připojování...' : 'Reconnecting...')
                        : (lang === 'cs' ? '🔗 Opětovně připojit' : '🔗 Reconnect')}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-white/60 text-center mt-2">
                Tip: If a PIN is enabled, we'll ask for it next.
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

