// src/pages/SuperAdmin/CreateSubjects.tsx

import React, {
    useState,
} from "react";

import { useSubjects } from "../../hooks/useSubjects";

import type {
    Subject,
} from "../../core/api/subject.api";

const CreateSubjects: React.FC = () => {
    const [name, setName] =
        useState("");

    const [
        selectedSubject,
        setSelectedSubject,
    ] = useState<Subject | null>(
        null
    );

    const {
        subjects,
        loading,
        error,

        createSubject,
        updateSubject,
        deleteSubject,

        creating,
        updating,
        deleting,
    } = useSubjects();

    const clearSelectedSubject =
        () => {
            setSelectedSubject(
                null
            );
        };

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!name.trim()) return;

        try {
            if (
                selectedSubject
            ) {
                await updateSubject(
                    selectedSubject.id,
                    {
                        name:
                            name.trim(),
                    }
                );

                clearSelectedSubject();
            } else {
                await createSubject(
                    {
                        name:
                            name.trim(),
                    }
                );
            }

            setName("");
        } catch (err) {
            console.error(
                err
            );
        }
    };

    const handleEdit = (
        subject: Subject
    ) => {
        setSelectedSubject(
            subject
        );

        setName(
            subject.name
        );
    };

    const handleDelete =
        async (
            id: string
        ) => {
            const confirmed =
                window.confirm(
                    "Delete this subject?"
                );

            if (
                !confirmed
            )
                return;

            try {
                await deleteSubject(
                    id
                );

                if (
                    selectedSubject?.id ===
                    id
                ) {
                    clearSelectedSubject();

                    setName(
                        ""
                    );
                }
            } catch (
                err
            ) {
                console.error(
                    err
                );
            }
        };

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">
                    Subject CRUD
                </h1>

                {error && (
                    <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
                        {
                            error.message
                        }
                    </div>
                )}

                {/* FORM */}
                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="border p-8 rounded-2xl mb-10 bg-white"
                >
                    <input
                        value={
                            name
                        }
                        onChange={(
                            e
                        ) =>
                            setName(
                                e
                                    .target
                                    .value
                            )
                        }
                        placeholder="Enter subject name"
                        className="w-full border p-3 rounded"
                    />

                    <div className="mt-4 flex gap-2">
                        <button
                            type="submit"
                            disabled={
                                creating ||
                                updating
                            }
                            className="px-6 py-2 bg-rose-600 text-white rounded disabled:opacity-50"
                        >
                            {creating ||
                            updating
                                ? "Processing..."
                                : selectedSubject
                                ? "Update"
                                : "Create"}
                        </button>

                        {selectedSubject && (
                            <button
                                type="button"
                                onClick={() => {
                                    clearSelectedSubject();

                                    setName(
                                        ""
                                    );
                                }}
                                className="px-6 py-2 bg-gray-500 text-white rounded"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                {/* TABLE */}
                <div className="overflow-x-auto bg-white rounded-xl border">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-slate-100">
                                <th className="p-3 text-left">
                                    ID
                                </th>

                                <th className="p-3 text-left">
                                    Name
                                </th>

                                <th className="p-3 text-left">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={
                                            3
                                        }
                                        className="p-5 text-center"
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            ) : subjects.length ===
                              0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            3
                                        }
                                        className="p-5 text-center"
                                    >
                                        No Subjects
                                        Found
                                    </td>
                                </tr>
                            ) : (
                                subjects.map(
                                    (
                                        subject: any
                                    ) => (
                                        <tr
                                            key={
                                                subject.id
                                            }
                                            className="border-b"
                                        >
                                            <td className="p-3">
                                                {
                                                    subject.id
                                                }
                                            </td>

                                            <td className="p-3">
                                                {
                                                    subject.name
                                                }
                                            </td>

                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                subject
                                                            )
                                                        }
                                                        className="px-3 py-1 bg-blue-500 text-white rounded"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            deleting
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                subject.id
                                                            )
                                                        }
                                                        className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CreateSubjects;