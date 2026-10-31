import { api } from "../../config/axios";

export interface Subject {
  id: string;
  name: string;
}

export interface CreateSubjectPayload {
  name: string;
}

export interface UpdateSubjectPayload {
  name?: string;
}

export interface SubjectResponse {
  success: boolean;
  message?: string;
  data: Subject;
}

export interface SubjectsResponse {
  success: boolean;
  data: Subject[];
}

// CREATE
export const createSubject = async (payload: CreateSubjectPayload): Promise<SubjectResponse> => {
  const { data } = await api.post("/subjects",payload);
  return data;
};

// GET ALL
export const getSubjects =async (): Promise<SubjectsResponse> => {
    const { data } = await api.get("/subjects");
    return data;
  };

// GET BY ID
export const getSubjectById = async (subjectId: string): Promise<SubjectResponse> => {
  const { data } = await api.get(`/subjects/${subjectId}`);
  return data;
};

// UPDATE
export const updateSubject = async (subjectId: string,payload: UpdateSubjectPayload): Promise<SubjectResponse> => {
  const { data } = await api.put(`/subjects/${subjectId}`,payload);
  return data;
};

// DELETE
export const deleteSubject = async (
  subjectId: string): Promise<{success: boolean;message: string;}> => {
  const { data } = await api.delete(`/subjects/${subjectId}`);
  return data;
};