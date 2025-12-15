'use client';

import { useState, useEffect } from 'react';
import { getUserProfile, type UserProfile } from '@/lib/utils/room';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useUserProfile() {
  const [previousNames, setPreviousNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getUserProfile();
          setPreviousNames(profile?.previousNames || []);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setPreviousNames([]);
        }
      } else {
        setPreviousNames([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { previousNames, loading };
}
