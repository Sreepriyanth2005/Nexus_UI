import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../core/integrations/firebase'; 

// Example API fetcher for lessons by course
const fetchLessons = async (courseId: string) => {
  const response = await fetch(`/api/courses/${courseId}/lessons`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const useRealtimeLessons = (courseId: string) => {
  const queryClient = useQueryClient();

  const queryKey = ['lessons', courseId];

  // 1. Initial REST API Fetch via TanStack Query
  const queryInfo = useQuery({
    queryKey,
    queryFn: () => fetchLessons(courseId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!courseId,
  });

  // 2. Realtime Listener via Firestore
  useEffect(() => {
    if (!courseId) return;

    // Listen to lessons for the specific course
    const q = query(
      collection(db, 'lessons'),
      where('courseId', '==', courseId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const realtimeLessons = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Update the TanStack query cache directly
        queryClient.setQueryData(queryKey, realtimeLessons);
      },
      (error) => {
        console.error('Firestore listener error in useRealtimeLessons:', error);
      }
    );

    return () => unsubscribe();
  }, [queryClient, courseId]);

  return queryInfo;
};

