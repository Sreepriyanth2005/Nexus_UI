import { api } from "../../config/axios";



export const getCoursesApi = async () => {
    const res = await api.get("/courses");
    return res.data;
};

/* -------------------------------- */
/* LESSON */
/* -------------------------------- */

export const getLessonsApi = async () => {
    const res = await api.get("/lessons");
    return res.data;
};

/* -------------------------------- */
/* CAREER PATH */
/* -------------------------------- */

export const getCareerPathsApi = async () => {
    const res = await api.get("/career-paths");
    return res.data;
};

/* -------------------------------- */
/* QUIZ */
/* -------------------------------- */

export const createQuizApi = async (payload: any) => {
    const res = await api.post("/quizzes", payload);
    return res.data;
};

export const getQuizzesApi = async (params?: Record<string, any>) => {
    const res = await api.get("/quizzes", { params });
    return res.data;
};

export const getQuizByIdApi = async (quizId: string) => {
    const res = await api.get(`/quizzes/${quizId}`);
    return res.data;
};

export const updateQuizApi = async ({
    quizId,
    payload,
}: {
    quizId: string;
    payload: any;
}) => {
    const res = await api.patch(`/quizzes/${quizId}`, payload);
    return res.data;
};

export const deleteQuizApi = async (quizId: string) => {
    const res = await api.delete(`/quizzes/${quizId}`);
    return res.data;
};

/* -------------------------------- */
/* QUESTION BANK */
/* -------------------------------- */

export const createQuestionBankApi = async (payload: any) => {
    const res = await api.post("/questionbank", payload);
    return res.data;
};

export const getQuestionBankApi = async () => {
    const res = await api.get("/questionbank");
    return res.data;
};

export const getQuestionBankByIdApi = async (id: string) => {
    const res = await api.get(`/questionbank/${id}`);
    return res.data;
};

export const updateQuestionBankApi = async ({
    id,
    payload,
}: {
    id: string;
    payload: any;
}) => {
    const res = await api.patch(`/questionbank/${id}`, payload);
    return res.data;
};

export const deleteQuestionBankApi = async (id: string) => {
    const res = await api.delete(`/questionbank/${id}`);
    return res.data;
};

/* -------------------------------- */
/* QUESTION OPTIONS */
/* -------------------------------- */

export const createQuestionOptionApi = async (payload: any) => {
    const res = await api.post("/question-options", payload);
    return res.data;
};

export const getQuestionOptionsApi = async () => {
    const res = await api.get("/question-options");
    return res.data;
};

export const getQuestionOptionByIdApi = async (id: string) => {
    const res = await api.get(`/question-options/${id}`);
    return res.data;
};

export const updateQuestionOptionApi = async ({
    id,
    payload,
}: {
    id: string;
    payload: any;
}) => {
    const res = await api.patch(`/question-options/${id}`, payload);
    return res.data;
};

export const deleteQuestionOptionApi = async (id: string) => {
    const res = await api.delete(`/question-options/${id}`);
    return res.data;
};

/* -------------------------------- */
/* QUIZ QUESTIONS */
/* -------------------------------- */

export const createQuizQuestionApi = async (payload: any) => {
    const res = await api.post("/quiz-questions", payload);
    return res.data;
};

export const getQuizQuestionsApi = async () => {
    const res = await api.get("/quiz-questions");
    return res.data;
};

export const getQuizQuestionByIdApi = async (id: string) => {
    const res = await api.get(`/quiz-questions/${id}`);
    return res.data;
};

export const updateQuizQuestionApi = async ({
    id,
    payload,
}: {
    id: string;
    payload: any;
}) => {
    const res = await api.patch(`/quiz-questions/${id}`, payload);
    return res.data;
};

export const deleteQuizQuestionApi = async (id: string) => {
    const res = await api.delete(`/quiz-questions/${id}`);
    return res.data;
};

/* -------------------------------- */
/* QUESTION GROUP */
/* -------------------------------- */

export const createQuestionGroupApi = async (payload: any) => {
    const res = await api.post("/question-groups", payload);
    return res.data;
};

export const getQuestionGroupsApi = async () => {
    const res = await api.get("/question-groups");
    return res.data;
};

export const getQuestionGroupByIdApi = async (id: string) => {
    const res = await api.get(`/question-groups/${id}`);
    return res.data;
};

export const updateQuestionGroupApi = async ({
    id,
    payload,
}: {
    id: string;
    payload: any;
}) => {
    const res = await api.put(`/question-groups/${id}`, payload);
    return res.data;
};

/* -------------------------------- */
/* QUIZ ATTEMPTS & SUBMISSIONS      */
/* -------------------------------- */

export const createQuizAttemptApi = async (payload: { quizId: string; userId: string }) => {
    const res = await api.post("/quizattempt", payload);
    return res.data;
};

export const resumeQuizAttemptApi = async (params: { quizId: string; userId: string }) => {
    const res = await api.get("/quizattempt/resume", { params });
    return res.data;
};

export const pauseQuizAttemptApi = async (payload: { attemptId: string; timeSpentSeconds: number }) => {
    const res = await api.post("/quizattempt/pause", payload);
    return res.data;
};

export const abandonQuizAttemptApi = async (attemptId: string) => {
    const res = await api.post(`/quizattempt/${attemptId}/abandon`);
    return res.data;
};

export const submitQuizAnswerApi = async (payload: {
    attemptId: string;
    questionId: string;
    selectedOptionId?: string;
    essayAnswer?: string;
    timeSpentSeconds?: number;
}) => {
    const res = await api.post("/quizanswer", payload);
    return res.data;
};

export const submitQuizApi = async (attemptId: string, payload?: { autoSubmitted?: boolean }) => {
    const res = await api.post(`/quizsubmit/attempt/${attemptId}/submit`, payload || {});
    return res.data;
};

export const getQuizResultApi = async (attemptId: string) => {
    const res = await api.get(`/quizattempt/${attemptId}/result`);
    return res.data;
};

export const getQuizAttemptsApi = async (params: { quizId?: string; userId?: string }) => {
    const res = await api.get("/quizattempt", { params });
    return res.data;
};