import React, { useState } from "react";

import {
useSkills,
useCreateSkill,
useUpdateSkill,
useDeleteSkill,
} from "../../hooks/useMaster";

const CreateSkills: React.FC = () => {
const [name, setName] = useState("");
const [editId, setEditId] = useState<string | null>(null);


const { data: skills = [], isLoading } = useSkills();

const createSkillMutation = useCreateSkill();
const updateSkillMutation = useUpdateSkill();
const deleteSkillMutation = useDeleteSkill();

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (editId) {
        updateSkillMutation.mutate({
            skillId: editId,
            payload: {
                name: name.trim(),
            },
        });

        setEditId(null);
    } else {
        createSkillMutation.mutate({
            name: name.trim(),
        });
    }

    setName("");
};

const handleEdit = (skill: {
    id: string;
    name: string;
}) => {
    setEditId(skill.id);
    setName(skill.name);
};

if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            Loading Skills...
        </div>
    );
}

return (
    <div className="min-h-screen p-10">
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">
                Skill Management
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
                    placeholder="Enter skill name"
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
                            createSkillMutation.isPending ||
                            updateSkillMutation.isPending
                        }
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl"
                    >
                        {editId
                            ? "Update Skill"
                            : "Create Skill"}
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
                        {skills.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="p-6 text-center"
                                >
                                    No Skills Found
                                </td>
                            </tr>
                        ) : (
                            skills.map((skill) => (
                                <tr
                                    key={skill.id}
                                    className="border-t border-slate-800"
                                >
                                    <td className="p-4">
                                        {skill.id}
                                    </td>

                                    <td className="p-4">
                                        {skill.name}
                                    </td>

                                    <td className="p-4 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEdit(
                                                    skill
                                                )
                                            }
                                            className="px-3 py-1 bg-blue-500 text-white rounded"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                deleteSkillMutation.mutate(
                                                    skill.id
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

export default CreateSkills;
