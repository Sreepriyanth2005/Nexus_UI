import React, {
    useEffect,
    useState,
} from "react";

import {
    createFieldOfStudyApi,
    deleteFieldOfStudyApi,
    getFieldsOfStudyApi,
    updateFieldOfStudyApi,
} from "../../core/api/fieldofstudy.api";

import {
    useMutation,
    useQuery,
} from "@tanstack/react-query";

import {
    useFieldOfStudyStore,
} from "../../store/fieldofstudy.store";

const FieldOfStudy: React.FC =
    () => {

        const [name, setName] =
            useState("");

        const [editingId, setEditingId] =
            useState<string | null>(
                null
            );

        const {
            fieldsOfStudy,
            setFieldsOfStudy,
            addFieldOfStudy,
            updateFieldOfStudy,
            deleteFieldOfStudy,
        } =
            useFieldOfStudyStore();

        // GET
        const {
            data,
            isLoading,
            isError,
            error,
        } = useQuery({
            queryKey: [
                "fields-of-study",
            ],
            queryFn:
                getFieldsOfStudyApi,
        });

        useEffect(() => {
            if (
                Array.isArray(data)
            ) {
                setFieldsOfStudy(
                    data
                );
            }
        }, [
            data,
            setFieldsOfStudy,
        ]);

        // CREATE
        const createMutation =
            useMutation({
                mutationFn:
                    createFieldOfStudyApi,

                onSuccess:
                    (
                        fieldOfStudy
                    ) => {
                        addFieldOfStudy(
                            fieldOfStudy
                        );

                        setName("");
                    },
            });

        // UPDATE
        const updateMutation =
            useMutation({
                mutationFn: ({
                    id,
                    data,
                }: {
                    id: string;
                    data: {
                        name: string;
                    };
                }) =>
                    updateFieldOfStudyApi(
                        id,
                        data
                    ),

                onSuccess:
                    (
                        updatedFieldOfStudy
                    ) => {
                        updateFieldOfStudy(
                            updatedFieldOfStudy
                        );

                        setEditingId(
                            null
                        );

                        setName("");
                    },
            });

        // DELETE
        const deleteMutation =
            useMutation({
                mutationFn:
                    deleteFieldOfStudyApi,

                onSuccess:
                    (_, id) => {
                        deleteFieldOfStudy(
                            id
                        );
                    },
            });

        const handleSubmit = (
            e: React.FormEvent
        ) => {
            e.preventDefault();

            if (
                !name.trim()
            )
                return;

            // UPDATE
            if (editingId) {
                updateMutation.mutate(
                    {
                        id: editingId,
                        data: {
                            name,
                        },
                    }
                );

                return;
            }

            // CREATE
            createMutation.mutate(
                {
                    name,
                }
            );
        };

        const handleEdit = (
            id: string,
            currentName: string
        ) => {
            setEditingId(id);

            setName(currentName);
        };

        if (isLoading) {
            return (
                <div className="min-h-screen flex justify-center items-center text-xl font-bold">
                    Loading...
                </div>
            );
        }

        if (isError) {
            return (
                <div className="min-h-screen flex justify-center items-center text-red-600 text-xl font-bold">
                    {(error as Error)
                        ?.message}
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-white text-black p-10">

                <div className="max-w-6xl mx-auto">

                    <h1 className="text-3xl font-bold mb-8">
                        Field Of Study
                    </h1>

                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="rounded-3xl border border-slate-300 bg-slate-950 p-8 shadow-2xl mb-10"
                    >

                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingId
                                ? "Update Field Of Study"
                                : "Create Field Of Study"}
                        </h2>

                        <input
                            type="text"
                            value={name}
                            onChange={(
                                e
                            ) =>
                                setName(
                                    e
                                        .target
                                        .value
                                )
                            }
                            placeholder="Enter field of study name"
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white mb-6"
                        />

                        <button
                            type="submit"
                            className="px-8 py-3 rounded-2xl bg-rose-600 text-white font-bold"
                        >
                            {editingId
                                ? "Update"
                                : "Create"}
                        </button>

                    </form>

                    <div className="bg-slate-950 rounded-2xl overflow-hidden text-white">

                        <table className="w-full">

                            <thead className="bg-slate-800">

                                <tr>
                                    <th className="p-4 text-left">
                                        ID
                                    </th>

                                    <th className="p-4 text-left">
                                        Name
                                    </th>

                                    <th className="p-4 text-left">
                                        Action
                                    </th>
                                </tr>

                            </thead>

                            <tbody>

                                {fieldsOfStudy.length >
                                    0 ? (
                                    fieldsOfStudy.map(
                                        (
                                            fieldOfStudy
                                        ) => (
                                            <tr
                                                key={
                                                    fieldOfStudy.id
                                                }
                                                className="border-b border-slate-800"
                                            >

                                                <td className="p-4">
                                                    {
                                                        fieldOfStudy.id
                                                    }
                                                </td>

                                                <td className="p-4">
                                                    {
                                                        fieldOfStudy.name
                                                    }
                                                </td>

                                                <td className="p-4 flex gap-3">

                                                    <button
                                                        onClick={() =>
                                                            handleEdit(
                                                                fieldOfStudy.id,
                                                                fieldOfStudy.name
                                                            )
                                                        }
                                                        className="px-4 py-2 bg-blue-600 rounded-lg"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            deleteMutation.mutate(
                                                                fieldOfStudy.id
                                                            )
                                                        }
                                                        className="px-4 py-2 bg-red-600 rounded-lg"
                                                    >
                                                        Delete
                                                    </button>

                                                </td>

                                            </tr>
                                        )
                                    )
                                ) : (
                                    <tr>

                                        <td
                                            colSpan={
                                                3
                                            }
                                            className="text-center p-8 text-slate-400"
                                        >
                                            No Data Found
                                        </td>

                                    </tr>
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>
        );
    };

export default FieldOfStudy;