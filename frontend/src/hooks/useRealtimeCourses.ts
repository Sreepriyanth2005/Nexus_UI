import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../core/integrations/firebase'; 

// Example API fetcher
const fetchCourses = async () => {
  const response = await fetch('/api/courses?status=PUBLISHED');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const useRealtimeCourses = () => {
  const queryClient = useQueryClient();

  // 1. Initial REST API Fetch via TanStack Query
  // Good for hydration, pagination, authorization, and complex joins
  const queryInfo = useQuery({
    queryKey: ['courses', 'published'],
    queryFn: fetchCourses,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 2. Realtime Listener via Firestore
  // Surgically updates the TanStack Query cache without page reloads
  useEffect(() => {
    // Only listen to published courses (matching the API query)
    const q = query(
      collection(db, 'courses'),
      where('status', '==', 'PUBLISHED')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // If it's a local cache event before server confirmation, we still apply it
        // but can optionally skip if we strictly want server data.
        
        // Transform Firestore snapshot to match API shape if necessary
        const realtimeCourses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Update the TanStack query cache directly
        queryClient.setQueryData(['courses', 'published'], realtimeCourses);
      },
      (error) => {
        console.error('Firestore listener error in useRealtimeCourses:', error);
      }
    );

    return () => unsubscribe();
  }, [queryClient]);

  return queryInfo;
};

