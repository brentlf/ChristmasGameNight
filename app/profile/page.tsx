'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getLanguage } from '@/lib/i18n';
import { getOrCreateProfileId, getProfileId, resetProfileId, setProfileId } from '@/lib/utils/profile';
import { useAudio } from '@/lib/contexts/AudioContext';

export default function ProfilePage() {
  const lang = getLanguage();
  const { playSound } = useAudio();
  const [profileId, setProfileIdState] = useState<string>('');
  const [input, setInput] = useState('');

  useEffect(() => {
    setProfileIdState(getOrCreateProfileId());
  }, []);

  const label = useMemo(() => {
    return {
      title: lang === 'cs' ? 'Profil' : 'Profile',
      subtitle: lang === 'cs' ? 'Propojit toto zařízení s vaším profilem' : 'Link this device to your profile',
      yourCode: lang === 'cs' ? 'Váš profilový kód' : 'Your profile code',
      copy: lang === 'cs' ? 'Kopírovat' : 'Copy',
      link: lang === 'cs' ? 'Propojit zařízení' : 'Link device',
      enter: lang === 'cs' ? 'Zadejte kód profilu' : 'Enter profile code',
      reset: lang === 'cs' ? 'Vytvořit nový kód' : 'Generate new code',
      back: lang === 'cs' ? 'Zpět' : 'Back',
      help: lang === 'cs'
        ? 'Na jiném zařízení otevřete tuto stránku a opište kód sem. Tím se bodování sloučí pod jednu osobu i když změníte jméno.'
        : 'On your other device, open this page and copy the code here. This merges scores under one person even if you change your name.',
      linked: lang === 'cs' ? 'Zařízení propojeno!' : 'Device linked!',
      copied: lang === 'cs' ? 'Zkopírováno' : 'Copied',
      invalid: lang === 'cs' ? 'Neplatný kód' : 'Invalid code',
    };
  }, [lang]);

  const doCopy = async () => {
    playSound('click');
    try {
      await navigator.clipboard.writeText(profileId);
      toast.success(label.copied);
    } catch {
      // Fallback: show code to manually copy
      toast.success(label.copied);
    }
  };

  const doLink = () => {
    playSound('click');
    try {
      const next = setProfileId(input);
      setProfileIdState(next);
      setInput('');
      toast.success(label.linked);
    } catch (e: any) {
      toast.error(e?.message || label.invalid);
    }
  };

  const doReset = () => {
    playSound('click');
    const ok = window.confirm(
      lang === 'cs'
        ? 'Opravdu chcete vytvořit nový profilový kód? Na tomto zařízení se tím odpojí předchozí profil.'
        : 'Generate a new profile code? This will unlink the previous profile on this device.'
    );
    if (!ok) return;
    const next = resetProfileId();
    setProfileIdState(next);
    toast.success(label.linked);
  };

  return (
    <main className="min-h-dvh px-3 md:px-4 py-4 md:py-6">
      <div className="mx-auto max-w-xl">
        <div className="card relative overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

          <div className="relative">
            <div className="mb-4 text-center">
              <h1 className="game-show-title mb-2">{label.title}</h1>
              <p className="text-white/70 text-sm md:text-base">{label.subtitle}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
              <div className="text-xs text-white/60 mb-2">{label.yourCode}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-black tracking-widest text-lg md:text-xl break-all bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                  {profileId || getProfileId() || ''}
                </div>
                <button type="button" className="btn-secondary shrink-0" onClick={doCopy}>
                  {label.copy}
                </button>
              </div>
              <p className="text-xs text-white/60 mt-3">{label.help}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
              <div className="text-xs text-white/60 mb-2">{label.enter}</div>
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  placeholder="PXXXXXXXXXXXX"
                  className="input-field flex-1 text-center font-black tracking-widest"
                />
                <button type="button" className="btn-primary shrink-0" onClick={doLink}>
                  {label.link}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" className="btn-secondary flex-1" onClick={doReset}>
                {label.reset}
              </button>
              <Link href="/game-night" className="btn-secondary flex-1 text-center">
                {label.back}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


