'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { getLanguage, t } from '@/lib/i18n';
import Link from 'next/link';
import type { Room, RoomStatus } from '@/types';
import toast from 'react-hot-toast';

export default function ActiveRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingAll, setClosingAll] = useState(false);
  const [closingRoomId, setClosingRoomId] = useState<string | null>(null);
  const router = useRouter();
  const lang = getLanguage();

  useEffect(() => {
    // Query for active rooms (status is 'lobby' or 'running')
    const roomsRef = collection(db, 'rooms');
    const q = query(
      roomsRef,
      where('status', 'in', ['lobby', 'running'])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const roomsList: Room[] = [];
        snapshot.forEach((doc) => {
          roomsList.push({ id: doc.id, ...doc.data() } as Room);
        });
        // Sort by createdAt descending (newest first)
        roomsList.sort((a, b) => b.createdAt - a.createdAt);
        setRooms(roomsList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching rooms:', err);
        toast.error('Failed to load active rooms');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleCloseRoom = async (room: Room) => {
    if (!auth.currentUser) {
      toast.error('You must be authenticated to close rooms');
      return;
    }

    if (room.controllerUid !== auth.currentUser.uid) {
      toast.error('You can only close rooms you created.');
      return;
    }

    if (!confirm(`Are you sure you want to close "${room.name}"? This action cannot be undone.`)) {
      return;
    }

    setClosingRoomId(room.id);

    try {
      const roomRef = doc(db, 'rooms', room.id);
      await deleteDoc(roomRef);
      toast.success(`Successfully closed "${room.name}"`);
    } catch (error) {
      console.error('Error closing room:', error);
      toast.error('Failed to close room. You may only close rooms you created.');
    } finally {
      setClosingRoomId(null);
    }
  };

  const handleCloseAll = async () => {
    if (!auth.currentUser) {
      toast.error('You must be authenticated to close rooms');
      return;
    }

    if (rooms.length === 0) {
      toast.success('No active rooms to close');
      return;
    }

    // Get all rooms that the current user is the controller of
    const userRooms = rooms.filter(room => room.controllerUid === auth.currentUser?.uid);
    
    if (userRooms.length === 0) {
      toast.error('You are not the controller of any active rooms. You can only close rooms you created.');
      return;
    }

    const totalRooms = rooms.length;
    const closableRooms = userRooms.length;
    
    const message = closableRooms < totalRooms
      ? `You can close ${closableRooms} of ${totalRooms} active room(s) (only rooms you created). Are you sure you want to close them? This action cannot be undone.`
      : `Are you sure you want to close all ${totalRooms} active room(s)? This action cannot be undone.`;

    if (!confirm(message)) {
      return;
    }

    setClosingAll(true);

    try {
      // Use batch write for efficient deletion
      const batch = writeBatch(db);
      userRooms.forEach((room) => {
        const roomRef = doc(db, 'rooms', room.id);
        batch.delete(roomRef);
      });

      await batch.commit();
      toast.success(`Successfully closed ${closableRooms} room(s)`);
    } catch (error) {
      console.error('Error closing rooms:', error);
      toast.error('Failed to close some rooms. You may only close rooms you created.');
    } finally {
      setClosingAll(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(lang === 'cs' ? 'cs-CZ' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case 'lobby':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'running':
        return 'bg-green-500/20 text-green-300 border-green-500/40';
      case 'finished':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
      default:
        return 'bg-white/10 text-white/70 border-white/20';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'amazing_race':
        return '🎄 Amazing Race';
      case 'mini_games':
        return '🎮 Mini Games';
      case 'leaderboard':
        return '🏆 Leaderboard';
      default:
        return mode;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-10 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="card text-center">
            <p className="text-white/70">{t('common.loading', lang)}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link 
            href="/game-night" 
            className="inline-flex items-center gap-3 rounded-full bg-white/10 border border-white/15 px-4 py-2 backdrop-blur-md hover:bg-white/20 transition"
          >
            <span>←</span>
            <span className="font-semibold">Back to Game Night</span>
          </Link>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

          <div className="relative">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="game-show-title mb-2">Active Rooms</h1>
                <p className="text-white/70">
                  {rooms.length} active room{rooms.length !== 1 ? 's' : ''}
                </p>
              </div>
              {rooms.length > 0 && (
                <button
                  onClick={handleCloseAll}
                  disabled={closingAll}
                  className="px-5 py-2 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-semibold hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {closingAll ? 'Closing...' : 'Close All Active Rooms'}
                </button>
              )}
            </div>

            {rooms.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏠</div>
                <p className="text-xl text-white/70 mb-2">No Active Rooms</p>
                <p className="text-white/50">All rooms are finished or closed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{room.name}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(room.status)}`}
                          >
                            {room.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 mb-3">
                          <span className="flex items-center gap-1">
                            <span>🔑</span>
                            <span className="font-mono font-bold">{room.code}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>🎮</span>
                            <span>{getModeLabel(room.roomMode)}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>👥</span>
                            <span>Max {room.maxPlayers}</span>
                          </span>
                          {room.pinEnabled && (
                            <span className="flex items-center gap-1">
                              <span>🔒</span>
                              <span>PIN Protected</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50">
                          Created {formatDate(room.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/room/${room.id}/tv`}
                          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition text-sm font-semibold"
                        >
                          📺 TV View
                        </Link>
                        {auth.currentUser && room.controllerUid === auth.currentUser.uid && (
                          <button
                            onClick={() => handleCloseRoom(room)}
                            disabled={closingRoomId === room.id}
                            className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {closingRoomId === room.id ? 'Closing...' : '✕ Close'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
