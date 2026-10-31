import React, {
    useState,
} from "react";

import { useCategories } from "../../hooks/category/useCategories";

import type {
    Category,
} from "../../core/api/category/category.api";

const CreateCategories: React.FC = () => {
    const [name, setName] =
        useState("");

    const {
        categories,
        selectedCategory,

        loading,
        error,

        createCategory,
        updateCategory,
        deleteCategory,

        setSelectedCategory,
        clearSelectedCategory,
    } = useCategories();

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!name.trim()) return;

        try {
            if (selectedCategory) {
                await updateCategory({
                    categoryId:
                        selectedCategory.id,
                    payload: {
                        name,
                    },
                });

                clearSelectedCategory();
            } else {
                await createCategory({
                    name,
                });
            }

            setName("");
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (
        category: Category
    ) => {
        setSelectedCategory(
            category
        );

        setName(category.name);
    };

    const handleDelete = async (
        categoryId: string
    ) => {
        const confirmed =
            window.confirm(
                "Delete this category?"
            );

        if (!confirmed) return;

        try {
            await deleteCategory(
                categoryId
            );

            if (
                selectedCategory?.id ===
                categoryId
            ) {
                clearSelectedCategory();
                setName("");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen p-10">
            <div className="max-w-6xl mx-auto">

                <h1 className="text-3xl font-bold mb-8">
                    Categories CRUD
                </h1>

                {error && (
                    <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
                        {String(error)}
                    </div>
                )}

                {/* FORM */}
                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="border p-8 rounded-xl mb-10"
                >
                    <input
                        value={name}
                        onChange={(e) =>
                            setName(
                                e.target.value
                            )
                        }
                        placeholder="Enter category name"
                        className="w-full border p-3 rounded"
                    />

                    <div className="mt-4 flex gap-2">
                        <button
                            type="submit"
                            disabled={
                                loading
                            }
                            className="px-6 py-2 bg-rose-600 text-white rounded disabled:opacity-50"
                        >
                            {loading
                                ? "Processing..."
                                : selectedCategory
                                    ? "Update"
                                    : "Create"}
                        </button>

                        {selectedCategory && (
                            <button
                                type="button"
                                onClick={() => {
                                    clearSelectedCategory();
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
                <div className="overflow-x-auto border rounded-xl">
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
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {categories.length ===
                            0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            3
                                        }
                                        className="p-5 text-center"
                                    >
                                        No Categories
                                        Found
                                    </td>
                                </tr>
                            ) : (
                                categories.map(
                                    (
                                        category: any
                                    ) => (
                                        <tr
                                            key={
                                                category.id
                                            }
                                            className="border-b"
                                        >
                                            <td className="p-3">
                                                {
                                                    category.id
                                                }
                                            </td>

                                            <td className="p-3">
                                                {
                                                    category.name
                                                }
                                            </td>

                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                category
                                                            )
                                                        }
                                                        className="px-3 py-1 bg-blue-500 text-white rounded"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                category.id
                                                            )
                                                        }
                                                        className="px-3 py-1 bg-red-600 text-white rounded"
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

export default CreateCategories;