import { useCallback } from "react";

import {
  createAssetPersonaApi,
  deleteAssetPersonaApi,
  getAssetPersonaByIdApi,
  getAssetPersonasApi,
  updateAssetPersonaApi,
} from "../../core/api/asset/asset-persona.api";

import { useAssetPersonaStore } from "../../store/asset/assetPersonaStore";

export const useAssetPersona =
  () => {
    const {
      personas,
      setPersonas,
      addPersona,
      updatePersona,
      deletePersona,
      clearPersonas,
    } =
      useAssetPersonaStore();

    const getAll =
      useCallback(
        async (
          assetId: string
        ) => {
          const data =
            await getAssetPersonasApi(
              assetId
            );

          setPersonas(data);

          return data;
        },
        [setPersonas]
      );

    const getById =
      useCallback(
        async (
          assetId: string,
          personaId: string
        ) => {
          const data =
            await getAssetPersonaByIdApi(
              assetId,
              personaId
            );

          addPersona(data);

          return data;
        },
        [addPersona]
      );

    const create =
      useCallback(
        async (
          assetId: string,
          payload: any
        ) => {
          const data =
            await createAssetPersonaApi(
              assetId,
              payload
            );

          addPersona(data);

          return data;
        },
        [addPersona]
      );

    const update =
      useCallback(
        async (
          assetId: string,
          personaId: string,
          payload: any
        ) => {
          const data =
            await updateAssetPersonaApi(
              assetId,
              personaId,
              payload
            );

          updatePersona(data);

          return data;
        },
        [updatePersona]
      );

    const remove =
      useCallback(
        async (
          assetId: string,
          personaId: string
        ) => {
          await deleteAssetPersonaApi(
            assetId,
            personaId
          );

          deletePersona(
            assetId,
            personaId
          );
        },
        [deletePersona]
      );

    return {
      personas,

      getAll,
      getById,

      create,
      update,
      remove,

      clearPersonas,
    };
  };