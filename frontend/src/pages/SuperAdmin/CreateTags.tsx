import React, { useState } from "react";

import {
useTags,
useCreateTag,
useUpdateTag,
useDeleteTag,
} from "../../hooks/useMaster";

const CreateTags: React.FC = () => {
const [name, setName] = useState("");
const [editId, setEditId] = useState<string | null>(null);


const { data: tags = [], isLoading } = useTags();

const createTagMutation = useCreateTag();
const updateTagMutation = useUpdateTag();
const deleteTagMutation = useDeleteTag();

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (editId) {
        updateTagMutation.mutate({
            tagId: editId,
            payload: {
                name: name.trim(),
            },
        });

        setEditId(null);
    } else {
        createTagMutation.mutate({
            name: name.trim(),
        });
    }

    setName("");
};

const handleEdit = (tag: {
    id: string;
    name: string;
}) => {
    setEditId(tag.id);
    setName(tag.name);
};

if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            Loading Tags...
        </div>
    );
}

return (
    <div className="min-h-screen p-10">
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">
                Tag Management
            </h1>

            {/* FORM */}
            <form
                onSubmit={handleSubmit}
                className="border p-8 rounded-2xl mb-10"
            >
                <input
                    value={name}
                    onChange={(e) =>
                        setName(e.target.value)
                    }
                    placeholder="Enter tag name"
                    className="w-full px-4 py-3 border rounded-xl"
                />

                <div className="flex gap-3 justify-end mt-6">
                    {editId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditId(null);
                                setName("");
                            }}
                            className="px-6 py-3 bg-gray-400 text-white rounded-xl"
                        >
                            Cancel
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={
                            createTagMutation.isPending ||
                            updateTagMutation.isPending
                        }
                        className="px-8 py-3 bg-rose-600 text-white rounded-xl"
                    >
                        {editId
                            ? "Update Tag"
                            : "Create Tag"}
                    </button>
                </div>
            </form>

            {/* TABLE */}
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
                        {tags.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="p-6 text-center"
                                >
                                    No Tags Found
                                </td>
                            </tr>
                        ) : (
                            tags.map((tag) => (
                                <tr
                                    key={tag.id}
                                    className="border-t border-slate-800"
                                >
                                    <td className="p-4">
                                        {tag.id}
                                    </td>

                                    <td className="p-4">
                                        {tag.name}
                                    </td>

                                    <td className="p-4 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEdit(
                                                    tag
                                                )
                                            }
                                            className="px-3 py-1 bg-blue-500 text-white rounded"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                deleteTagMutation.mutate(
                                                    tag.id
                                                )
                                            }
                                            className="px-3 py-1 bg-red-600 text-white rounded"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);


};

export default CreateTags;
