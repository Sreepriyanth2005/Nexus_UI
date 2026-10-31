import { api } from "../../../config/axios";

export interface NotebookEntry {
  id: string;
  userId: string;
  lessonId: string;
  courseId?: string | null;
  careerPathId?: string | null;
  content: string;
  tags?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  lessonId: string;
  courseId?: string;
  careerPathId?: string;
  content: string;
}

export interface UpdateNotePayload {
  content: string;
}

export const NotebookAPI = {
  getNotes: async (lessonId?: string): Promise<NotebookEntry[]> => {
    const params = lessonId ? { lessonId } : {};
    const { data } = await api.get("/learning/notebook", { params });
    return data.data;
  },

  createNote: async (payload: CreateNotePayload): Promise<NotebookEntry> => {
    const { data } = await api.post("/learning/notebook", payload);
    return data.data;
  },

  updateNote: async (noteId: string, payload: UpdateNotePayload): Promise<NotebookEntry> => {
    const { data } = await api.put(`/learning/notebook/${noteId}`, payload);
    return data.data;
  },

  deleteNote: async (noteId: string): Promise<void> => {
    await api.delete(`/learning/notebook/${noteId}`);
  },
};
