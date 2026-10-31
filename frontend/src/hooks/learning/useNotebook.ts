import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NotebookAPI, CreateNotePayload, UpdateNotePayload } from "../../core/api/learning/notebook.api";

export const useNotebookKeys = {
  all: ["notebook"] as const,
  byLesson: (lessonId: string) => [...useNotebookKeys.all, lessonId] as const,
};

export const useNotebook = (lessonId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: useNotebookKeys.byLesson(lessonId || ""),
    queryFn: () => NotebookAPI.getNotes(lessonId),
    enabled: !!lessonId,
  });

  const createNote = useMutation({
    mutationFn: (payload: CreateNotePayload) => NotebookAPI.createNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useNotebookKeys.byLesson(lessonId || "") });
    },
  });

  const updateNote = useMutation({
    mutationFn: ({ noteId, payload }: { noteId: string; payload: UpdateNotePayload }) =>
      NotebookAPI.updateNote(noteId, payload),
    onMutate: async ({ payload }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: useNotebookKeys.byLesson(lessonId || "") });
      const previousNotes = queryClient.getQueryData(useNotebookKeys.byLesson(lessonId || ""));

      if (previousNotes && Array.isArray(previousNotes) && previousNotes.length > 0) {
        queryClient.setQueryData(useNotebookKeys.byLesson(lessonId || ""), (old: any) => {
          if (!old || !old[0]) return old;
          return [{ ...old[0], content: payload.content }, ...old.slice(1)];
        });
      }
      return { previousNotes };
    },
    onError: (_err, _newNote, context) => {
      queryClient.setQueryData(useNotebookKeys.byLesson(lessonId || ""), context?.previousNotes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: useNotebookKeys.byLesson(lessonId || "") });
    },
  });

  return {
    notes: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    createNote,
    updateNote,
  };
};
