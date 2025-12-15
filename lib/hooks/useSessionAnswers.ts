import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SessionAnswerDoc } from '@/lib/sessions/sessionEngine';

export function useSessionAnswers(roomId: string | null, sessionId: string | null, questionIndex: number | null) {
  const [allAnswers, setAllAnswers] = useState<SessionAnswerDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !sessionId) {
      setAllAnswers([]);
      setLoading(false);
      return;
    }

    const ref = collection(db, 'rooms', roomId, 'sessions', sessionId, 'answers');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const items: SessionAnswerDoc[] = [];
        snap.forEach((d) => {
          items.push({ ...(d.data() as any), uid: d.id } as SessionAnswerDoc);
        });
        setAllAnswers(items);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [roomId, sessionId]);

  const answersForQuestion = useMemo(() => {
    if (questionIndex === null || questionIndex === undefined) return [];
    return allAnswers.filter((a) => a.questionIndex === questionIndex);
  }, [allAnswers, questionIndex]);

  const answeredUids = useMemo(() => answersForQuestion.map((a) => a.uid), [answersForQuestion]);

  return { allAnswers, answersForQuestion, answeredUids, loading };
}


