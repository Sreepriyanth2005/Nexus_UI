import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../core/integrations/firebase'; 

// Example API fetcher
const fetchCareerPaths = async () => {
  const response = await fetch('/api/career-paths?status=PUBLISHED');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const useRealtimeCareerPaths = () => {
  const queryClient = useQueryClient();
  const queryKey = ['careerPaths', 'published'];

  // 1. Initial REST API Fetch via TanStack Query
  const queryInfo = useQuery({
    queryKey,
    queryFn: fetchCareerPaths,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 2. Realtime Listener via Firestore
  useEffect(() => {
    // Only listen to published career paths
    const q = query(
      collection(db, 'careerPaths'),
      where('status', '==', 'PUBLISHED')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const realtimeCareerPaths = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Update the TanStack query cache directly
        queryClient.setQueryData(queryKey, realtimeCareerPaths);
      },
      (error) => {
        console.error('Firestore listener error in useRealtimeCareerPaths:', error);
      }
    );

    return () => unsubscribe();
  }, [queryClient]);

  return queryInfo;
};

