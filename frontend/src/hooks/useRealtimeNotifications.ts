import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../core/integrations/firebase'; 

// Example API fetcher for user notifications
const fetchNotifications = async (userId: string) => {
  const response = await fetch(`/api/users/${userId}/notifications`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const useRealtimeNotifications = (userId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['notifications', userId];

  // 1. Initial REST API Fetch via TanStack Query
  const queryInfo = useQuery({
    queryKey,
    queryFn: () => fetchNotifications(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId,
  });

  // 2. Realtime Listener via Firestore
  useEffect(() => {
    if (!userId) return;

    // Listen to user-specific notifications
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const realtimeNotifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Update the TanStack query cache directly
        queryClient.setQueryData(queryKey, realtimeNotifications);
      },
      (error) => {
        console.error('Firestore listener error in useRealtimeNotifications:', error);
      }
    );

    return () => unsubscribe();
  }, [queryClient, userId]);

  return queryInfo;
};

