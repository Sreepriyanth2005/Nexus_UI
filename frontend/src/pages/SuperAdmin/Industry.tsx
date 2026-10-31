// src/pages/industry/Industry.tsx

import {
    Pencil,
    Trash2,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    Industry,
} from "../../core/api/industry.api";

import {
    useIndustryStore,
} from "../../store/Industry.store";

const IndustryPage = () => {
    const {
        industries,
        fetchIndustries,
        updateIndustry,
        deleteIndustry,
    } = useIndustryStore();

    const [selectedIndustry,
        setSelectedIndustry] =
        useState<Industry | null>(
            null
        );

    const [editOpen,
        setEditOpen] =
        useState(false);

    const [deleteOpen,
        setDeleteOpen] =
        useState(false);

    const [industryName,
        setIndustryName] =
        useState("");

    const [deleteText,
        setDeleteText] =
        useState("");

    useEffect(() => {
        fetchIndustries();
    }, []);

    const handleEditClick = (
        industry: Industry
    ) => {
        setSelectedIndustry(
            industry
        );

        setIndustryName(
            industry.name
        );

        setEditOpen(true);
    };

    const handleDeleteClick = (
        industry: Industry
    ) => {
        setSelectedIndustry(
            industry
        );

        setDeleteText("");

        setDeleteOpen(true);
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-6">
                Industry Management
            </h1>

            <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left">
                                Name
                            </th>

                            <th className="p-3 text-center">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {industries.map(
                            (
                                item,
                                index
                            ) => (
                                <tr
                                    key={
                                        item.id
                                    }
                                    className={
                                        index %
                                            2 ===
                                            0
                                            ? "bg-white"
                                            : "bg-gray-50"
                                    }
                                >
                                    <td className="p-3">
                                        {
                                            item.name
                                        }
                                    </td>

                                    <td className="p-3">
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() =>
                                                    handleEditClick(
                                                        item
                                                    )
                                                }
                                            >
                                                <Pencil
                                                    size={
                                                        18
                                                    }
                                                    className="text-blue-600"
                                                />
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDeleteClick(
                                                        item
                                                    )
                                                }
                                            >
                                                <Trash2
                                                    size={
                                                        18
                                                    }
                                                    className="text-red-600"
                                                />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {/* EDIT MODAL */}

            {editOpen &&
                selectedIndustry && (
                    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
                        <div className="bg-white w-[450px] rounded-xl p-6 shadow-xl">
                            <h2 className="font-bold text-lg mb-4">
                                Edit Industry
                            </h2>

                            <input
                                value={
                                    industryName
                                }
                                onChange={(
                                    e
                                ) =>
                                    setIndustryName(
                                        e.target
                                            .value
                                    )
                                }
                                className="w-full border rounded-lg p-3"
                            />

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    className="px-4 py-2 border rounded"
                                    onClick={() =>
                                        setEditOpen(
                                            false
                                        )
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    disabled={
                                        !industryName.trim()
                                    }
                                    onClick={async () => {
                                        await updateIndustry(
                                            selectedIndustry.id,
                                            industryName
                                        );

                                        setEditOpen(
                                            false
                                        );
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* DELETE MODAL */}

            {deleteOpen &&
                selectedIndustry && (
                    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
                        <div className="bg-white w-[450px] rounded-xl p-6 shadow-xl">
                            <h2 className="font-bold text-lg">
                                Delete Industry
                            </h2>

                            <p className="mt-3 text-sm text-gray-600">
                                Type
                                {" "}
                                <strong>
                                    DELETE
                                </strong>
                                {" "}
                                to confirm deletion.
                            </p>

                            <input
                                value={
                                    deleteText
                                }
                                onChange={(
                                    e
                                ) =>
                                    setDeleteText(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder="Type DELETE"
                                className="w-full border rounded-lg p-3 mt-4"
                            />

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() =>
                                        setDeleteOpen(
                                            false
                                        )
                                    }
                                    className="px-4 py-2 border rounded"
                                >
                                    Cancel
                                </button>

                                <button
                                    disabled={
                                        deleteText !==
                                        "DELETE"
                                    }
                                    onClick={async () => {
                                        await deleteIndustry(
                                            selectedIndustry.id
                                        );

                                        setDeleteOpen(
                                            false
                                        );
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-300"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default IndustryPage;