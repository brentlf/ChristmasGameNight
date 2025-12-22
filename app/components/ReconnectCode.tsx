'use client';

import { useState } from 'react';
import type { Player } from '@/types';
import { getLanguage, t } from '@/lib/i18n';

interface ReconnectCodeProps {
  player: Player | null;
  roomId: string;
}

export function ReconnectCode({ player, roomId }: ReconnectCodeProps) {
  const lang = getLanguage();
  const [copied, setCopied] = useState(false);

  if (!player?.playerKey) return null;

  const code = player.playerKey;
  const isEmoji = player.playerKeyType === 'emoji';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-3 md:p-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm text-white/70 mb-1 break-words">
            {lang === 'cs' ? 'Váš kód pro opětovné připojení:' : 'Your Reconnect Code:'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="font-mono text-lg md:text-xl font-bold text-christmas-gold hover:text-christmas-gold/80 transition-colors break-all text-left"
              title={lang === 'cs' ? 'Klikněte pro kopírování' : 'Click to copy'}
            >
              {isEmoji ? code : code}
            </button>
            {copied && (
              <span className="text-xs text-green-400">✓ {lang === 'cs' ? 'Zkopírováno' : 'Copied'}</span>
            )}
          </div>
          <p className="text-xs text-white/50 mt-1.5 break-words">
            {lang === 'cs'
              ? 'Použijte tento kód, pokud se připojíte z jiného telefonu.'
              : 'Use this if you join from another phone.'}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 p-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
          aria-label={lang === 'cs' ? 'Kopírovat kód' : 'Copy code'}
        >
          📋
        </button>
      </div>
    </div>
  );
}

