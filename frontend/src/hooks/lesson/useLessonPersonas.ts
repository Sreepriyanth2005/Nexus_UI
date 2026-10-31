// src/hooks/lesson/useLessonPersonas.ts

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getLessonPersonasApi,
  createLessonPersonaApi,
  updateLessonPersonaApi,
  deleteLessonPersonaApi,
} from "../../core/api/lesson/lesson-persona.api";

import {
  useLessonPersonaStore,
} from "../../store/lesson/lessonPersonaStore";

export const useLessonPersonas = (
  lessonId: string
) => {
  const {
    personas,
    setPersonas,
    addPersona,
    updatePersona,
    deletePersona,
  } = useLessonPersonaStore();

  const query = useQuery({
    queryKey: [
      "lesson-personas",
      lessonId,
    ],

    enabled: !!lessonId,

    queryFn: async () => {
      const data =
        await getLessonPersonasApi(
          lessonId
        );

      setPersonas(data);

      return data;
    },
  });

  const createMutation =
    useMutation({
      mutationFn: (
        payload: any
      ) =>
        createLessonPersonaApi(
          lessonId,
          payload
        ),

      onSuccess: (
        data
      ) =>
        addPersona(
          data
        ),
    });

  const updateMutation =
    useMutation({
      mutationFn: ({
        personaId,
        payload,
      }: any) =>
        updateLessonPersonaApi(
          lessonId,
          personaId,
          payload
        ),

      onSuccess: (
        data
      ) =>
        updatePersona(
          data
        ),
    });

  const deleteMutation =
    useMutation({
      mutationFn: (
        personaId: string
      ) =>
        deleteLessonPersonaApi(
          lessonId,
          personaId
        ),

      onSuccess: (
        _,
        personaId
      ) =>
        deletePersona(
          personaId
        ),
    });

  return {
    personas,
    query,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};