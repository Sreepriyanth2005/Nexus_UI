import { create } from "zustand";

import {
    FieldOfStudy
} from "../core/api/fieldofstudy.api";

type FieldOfStudyState = {
    fieldsOfStudy: FieldOfStudy[];

    selectedFieldOfStudy:
    FieldOfStudy | null;

    setFieldsOfStudy: (
        fieldsOfStudy: FieldOfStudy[]
    ) => void;

    addFieldOfStudy: (
        fieldOfStudy: FieldOfStudy
    ) => void;

    updateFieldOfStudy: (
        fieldOfStudy: FieldOfStudy
    ) => void;

    deleteFieldOfStudy: (
        id: string
    ) => void;

    setSelectedFieldOfStudy: (
        fieldOfStudy:
            FieldOfStudy | null
    ) => void;
};

export const useFieldOfStudyStore =
    create<FieldOfStudyState>(
        (set) => ({
            fieldsOfStudy: [],

            selectedFieldOfStudy:
                null,

            setFieldsOfStudy: (
                fieldsOfStudy
            ) =>
                set({
                    fieldsOfStudy,
                }),

            addFieldOfStudy: (
                fieldOfStudy
            ) =>
                set((state) => ({
                    fieldsOfStudy: [
                        ...state.fieldsOfStudy,
                        fieldOfStudy,
                    ],
                })),

            updateFieldOfStudy: (
                updatedFieldOfStudy
            ) =>
                set((state) => ({
                    fieldsOfStudy:
                        state.fieldsOfStudy.map(
                            (
                                fieldOfStudy
                            ) =>
                                fieldOfStudy.id ===
                                    updatedFieldOfStudy.id
                                    ? updatedFieldOfStudy
                                    : fieldOfStudy
                        ),
                })),

            deleteFieldOfStudy: (
                id
            ) =>
                set((state) => ({
                    fieldsOfStudy:
                        state.fieldsOfStudy.filter(
                            (
                                fieldOfStudy
                            ) =>
                                fieldOfStudy.id !==
                                id
                        ),
                })),

            setSelectedFieldOfStudy:
                (
                    fieldOfStudy
                ) =>
                    set({
                        selectedFieldOfStudy:
                            fieldOfStudy,
                    }),
        })
    );