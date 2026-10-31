import { create } from "zustand";

/* =========================
   QUESTION OPTION
========================= */

export interface QuestionOptionState {
    id?: string;
    optionText: string;
    optionImage?: string;
    isCorrect: boolean;
    displayOrder: number;
}

/* =========================
   QUESTION BANK
========================= */

export interface QuestionBankState {
    id?: string;

    questionType: string;

    questionGroupId?: string;

    commonImageFileId?: string;

    commonEssayText?: string;

    questionText: string;

    questionImageFileId?: string;

    explanation?: string;

    difficulty?: string;

    topic?: string;

    skill?: string;

    tags?: string;

    essayEvaluationCriteria?: string;

    questionStatus: string;

    options: QuestionOptionState[];
}

/* =========================
   QUESTION GROUP
========================= */

export interface QuestionGroupState {
    id?: string;

    groupType: string;

    title?: string;

    imageFileId?: string;

    passageText?: string;

    questions: QuestionBankState[];
}

/* =========================
   QUIZ QUESTION MAPPING
========================= */

export interface QuizQuestionState {
    id?: string;

    questionId?: string;

    sequenceOrder: number;

    questionScoreWeight: number;

    isMandatory: boolean;
}

/* =========================
   QUIZ
========================= */

export interface QuizState {
    id?: string;

    courseId: string;

    lessonId: string;

    careerPathId: string;

    quizTitle: string;

    quizDescription: string;

    quizType: string;

    passingScore: number;

    maxAttempts: number;

    timed: boolean;

    timeLimitMinutes?: number;

    randomizeQuestions: boolean;

    randomizeAnswers: boolean;

    allowRetry: boolean;

    showResultImmediately: boolean;

    lockBrowserTab: boolean;

    showQuestionNavigation: boolean;

    allowBackNavigation: boolean;

    retakeIntervalHours?: number;

    quizStatus: string;

    createdBy: string;
}

/* =========================
   STORE
========================= */

interface AssessmentStore {
    quiz: QuizState;

    questionGroups: QuestionGroupState[];

    quizQuestions: QuizQuestionState[];

    selectedCourseId: string;
    selectedLessonId: string;
    selectedCareerPathId: string;

    setQuiz: (quiz: Partial<QuizState>) => void;

    setCourseId: (id: string) => void;
    setLessonId: (id: string) => void;
    setCareerPathId: (id: string) => void;

    addQuestionGroup: (group: QuestionGroupState) => void;

    updateQuestionGroup: (
        groupId: string,
        data: Partial<QuestionGroupState>
    ) => void;

    removeQuestionGroup: (groupId: string) => void;

    addQuizQuestion: (
        question: QuizQuestionState
    ) => void;

    removeQuizQuestion: (
        questionId: string
    ) => void;

    resetAssessment: () => void;
}

const initialQuiz: QuizState = {
    courseId: "",
    lessonId: "",
    careerPathId: "",

    quizTitle: "",
    quizDescription: "",

    quizType: "PRACTICE",

    passingScore: 70,

    maxAttempts: 3,

    timed: false,

    timeLimitMinutes: 30,

    randomizeQuestions: true,

    randomizeAnswers: true,

    allowRetry: true,

    showResultImmediately: true,

    lockBrowserTab: false,

    showQuestionNavigation: true,

    allowBackNavigation: true,

    quizStatus: "DRAFT",

    createdBy: "",
};

export const useAssessmentStore =
    create<AssessmentStore>((set) => ({
        quiz: initialQuiz,

        questionGroups: [],

        quizQuestions: [],

        selectedCourseId: "",

        selectedLessonId: "",

        selectedCareerPathId: "",

        setQuiz: (data) =>
            set((state) => ({
                quiz: {
                    ...state.quiz,
                    ...data,
                },
            })),

        setCourseId: (id) =>
            set({
                selectedCourseId: id,
                quiz: {
                    ...initialQuiz,
                    courseId: id,
                },
            }),

        setLessonId: (id) =>
            set((state) => ({
                selectedLessonId: id,
                quiz: {
                    ...state.quiz,
                    lessonId: id,
                },
            })),

        setCareerPathId: (id) =>
            set((state) => ({
                selectedCareerPathId: id,
                quiz: {
                    ...state.quiz,
                    careerPathId: id,
                },
            })),

        addQuestionGroup: (group) =>
            set((state) => ({
                questionGroups: [
                    ...state.questionGroups,
                    group,
                ],
            })),

        updateQuestionGroup: (
            groupId,
            data
        ) =>
            set((state) => ({
                questionGroups:
                    state.questionGroups.map((g) =>
                        g.id === groupId
                            ? {
                                ...g,
                                ...data,
                            }
                            : g
                    ),
            })),

        removeQuestionGroup: (
            groupId
        ) =>
            set((state) => ({
                questionGroups:
                    state.questionGroups.filter(
                        (g) => g.id !== groupId
                    ),
            })),

        addQuizQuestion: (
            question
        ) =>
            set((state) => ({
                quizQuestions: [
                    ...state.quizQuestions,
                    question,
                ],
            })),

        removeQuizQuestion: (
            questionId
        ) =>
            set((state) => ({
                quizQuestions:
                    state.quizQuestions.filter(
                        (q) =>
                            q.questionId !== questionId
                    ),
            })),

        resetAssessment: () =>
            set({
                quiz: initialQuiz,
                questionGroups: [],
                quizQuestions: [],
                selectedCourseId: "",
                selectedLessonId: "",
                selectedCareerPathId: "",
            }),
    }));