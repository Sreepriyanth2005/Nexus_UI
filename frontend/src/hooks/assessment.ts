import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    getCoursesApi,
    getLessonsApi,
    getCareerPathsApi,
    createQuizApi,
    createQuestionBankApi,
    createQuestionOptionApi,
    createQuizQuestionApi,
    createQuestionGroupApi,
} from "../core/api/assessment.api";

/* ---------------- */
/* DEFAULT IDS */
/* ---------------- */

export const useCourses = () =>
    useQuery({
        queryKey: ["courses"],
        queryFn: getCoursesApi,
    });

export const useLessons = () =>
    useQuery({
        queryKey: ["lessons"],
        queryFn: getLessonsApi,
    });

export const useCareerPaths = () =>
    useQuery({
        queryKey: ["career-paths"],
        queryFn: getCareerPathsApi,
    });

/* ---------------- */
/* QUIZ */
/* ---------------- */

export const useCreateQuiz = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: createQuizApi,

        onSuccess: () => {
            qc.invalidateQueries({
                queryKey: ["quizzes"],
            });
        },
    });
};

/* ---------------- */
/* QUESTION BANK */
/* ---------------- */

export const useCreateQuestionBank = () => {
    return useMutation({
        mutationFn: createQuestionBankApi,
    });
};

/* ---------------- */
/* QUESTION OPTION */
/* ---------------- */

export const useCreateQuestionOption = () => {
    return useMutation({
        mutationFn: createQuestionOptionApi,
    });
};

/* ---------------- */
/* QUIZ QUESTION */
/* ---------------- */

export const useCreateQuizQuestion = () => {
    return useMutation({
        mutationFn: createQuizQuestionApi,
    });
};

/* ---------------- */
/* QUESTION GROUP */
/* ---------------- */

export const useCreateQuestionGroup = () => {
    return useMutation({
        mutationFn: createQuestionGroupApi,
    });
};

