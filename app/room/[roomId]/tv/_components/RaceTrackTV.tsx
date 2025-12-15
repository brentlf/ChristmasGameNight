'use client';

import { useMemo } from 'react';
import type { Player, RaceTrack } from '@/types';

function stageIcon(stageType: string) {
  switch (stageType) {
    case 'riddle_gate':
      return '🧩';
    case 'emoji_guess':
      return '🎬';
    case 'trivia_solo':
      return '⚡';
    case 'code_lock':
      return '🔒';
    case 'photo_scavenger':
      return '📸';
    case 'final_riddle':
      // Keep the finish flag reserved for the actual finish line marker.
      return '🎁';
    default:
      return '⭐';
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function RaceTrackTV(props: {
  track: RaceTrack;
  players: Player[];
  lang: 'en' | 'cs';
}) {
  const { track, players, lang } = props;
  const totalStages = track.stages.length;
  const totalSlots = totalStages + 1; // +1 for the finish line slot after the final stage

  const { stageNodes, rows } = useMemo(() => {
    const stageNodes = track.stages.map((s, i) => {
      // stage node position: 0..100, with an extra slot reserved for the finish line
      // so the final stage doesn't overlap the finish flag.
      const pct = totalSlots > 0 ? ((i + 1) / totalSlots) * 100 : 0;
      return { id: s.id, i, pct, icon: stageIcon(s.type), title: s.title[lang] };
    });

    // One row per player (ordered by joinedAt so it feels like the lobby roster).
    const rows = [...players]
      .sort((a: any, b: any) => Number(a.joinedAt ?? 0) - Number(b.joinedAt ?? 0))
      .map((p: any) => {
        const rawStage = Number(p.stageIndex ?? 0);
        // stageIndex is the *current* stage (0-based). When you complete the last stage,
        // stageIndex becomes === totalStages (one past the last index) => finished.
        const finished = rawStage >= totalStages;
        // Slot mapping:
        // slot 0 = start, slot 1 = stage 1, ..., slot totalStages = final stage, slot totalStages+1 = finish
        const slot = finished ? totalSlots : clamp(rawStage + 1, 0, totalSlots);
        const leftPct = totalSlots > 0 ? (slot / totalSlots) * 100 : 0;
        return {
          uid: String(p.uid),
          name: String(p.name ?? ''),
          avatar: String(p.avatar ?? '🎅'),
          stageIdx: clamp(rawStage, 0, totalStages),
          leftPct,
          finished,
        };
      });

    return { stageNodes, rows };
  }, [lang, players, totalSlots, totalStages, track.stages]);

  return (
    <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 relative overflow-hidden">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/10 blur-3xl" />
      <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="text-sm text-white/70">{lang === 'cs' ? 'Amazing Race' : 'Amazing Race'}</div>
          <h2 className="text-3xl font-black truncate">{track.title[lang]}</h2>
          <p className="text-xs text-white/60 mt-1">
            {lang === 'cs'
              ? 'Hráči se posouvají doprava přes checkpointy až do cíle.'
              : 'Players move right through checkpoints to the finish.'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs text-white/60">{lang === 'cs' ? 'Checkpointy' : 'Checkpoints'}</div>
          <div className="text-2xl font-black text-christmas-gold">{totalStages}</div>
        </div>
      </div>

      <div className="relative rounded-3xl border border-white/10 bg-black/20 p-4 overflow-hidden">
        {/* Header row (always at top) */}
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="w-full sm:w-[220px] shrink-0">
              <div className="text-xs text-white/60">{lang === 'cs' ? 'Hráč' : 'Player'}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="relative h-[64px]">
                {/* baseline */}
                <div className="absolute left-3 right-3 top-[34px] h-2 rounded-full bg-gradient-to-r from-white/15 via-christmas-gold/30 to-white/15" />

                {/* start + finish */}
                <div className="absolute left-3 top-[16px] flex items-center gap-2">
                  <span className="text-lg">🎅</span>
                  <span className="text-xs text-white/70">{lang === 'cs' ? 'Start' : 'Start'}</span>
                </div>
                <div className="absolute right-3 top-[16px] flex items-center gap-2">
                  <span className="text-xs text-white/70">{lang === 'cs' ? 'Cíl' : 'Finish'}</span>
                  <span className="text-lg">🏁</span>
                </div>

                {/* stage nodes */}
                {stageNodes.map((n) => (
                  <div
                    key={n.id}
                    className="absolute top-[2px] -translate-x-1/2"
                    style={{ left: `calc(${n.pct}% - 0px)` }}
                    title={`${n.i + 1}. ${n.title}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-9 w-9 rounded-full border border-white/15 bg-white/10 backdrop-blur flex items-center justify-center shadow-md">
                        <span className="text-lg">{n.icon}</span>
                      </div>
                      <div className="text-[10px] text-white/65 whitespace-nowrap">
                        {n.i + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Player rows */}
        <div className="mt-4 space-y-2 max-h-[min(560px,60dvh)] overflow-auto pr-1">
          {rows.length === 0 ? (
            <div className="text-sm text-white/60">{lang === 'cs' ? 'Zatím žádní hráči.' : 'No players yet.'}</div>
          ) : (
            rows.map((r) => (
              <div key={r.uid} className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-full sm:w-[220px] shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl">{r.avatar}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white/90 truncate">{r.name}</div>
                      <div className="text-[11px] text-white/60">
                        {r.finished
                          ? `🏁 ${lang === 'cs' ? 'Cíl' : 'Finished'}`
                          : `${lang === 'cs' ? 'Stage' : 'Stage'} ${r.stageIdx + 1}/${totalStages}`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="relative h-[44px] rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
                    <div className="absolute left-3 right-3 top-[20px] h-2 rounded-full bg-white/10" />
                    <div className="absolute left-3 right-3 top-[20px] h-2 rounded-full bg-gradient-to-r from-christmas-gold/10 via-christmas-gold/30 to-christmas-gold/10" />

                    <div
                      className="absolute top-[6px] -translate-x-1/2 transition-all duration-700 ease-out"
                      style={{ left: `calc(${r.leftPct}% + 12px)` }}
                    >
                      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/55 backdrop-blur px-3 py-1 shadow-lg">
                        <span className="text-sm">{r.finished ? '🏁' : '🛷'}</span>
                        <span className="text-sm font-bold text-white/90">{r.finished ? (lang === 'cs' ? 'Cíl' : 'Finish') : r.stageIdx + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
          <div>
            {lang === 'cs'
              ? 'Tip: zvuk zvonečků se přehraje, když někdo postoupí.'
              : 'Tip: sleighbells play when someone advances.'}
          </div>
          <div className="text-white/50">
            {lang === 'cs' ? 'Pořadí' : 'Order'}: {lang === 'cs' ? 'dle postupu' : 'by progress'}
          </div>
        </div>
      </div>
    </div>
  );
}


