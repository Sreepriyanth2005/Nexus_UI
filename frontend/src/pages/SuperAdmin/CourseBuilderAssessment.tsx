import { useEffect, useState } from "react";
import { useUserStore } from "../../store/user.store";
import { PublishType } from "./CourseBuilderLessons";
import { Spin, Modal, notification } from "antd";
import { getQuizzesApi, getQuizByIdApi, deleteQuestionBankApi, deleteQuizQuestionApi } from "../../core/api/assessment.api";
type QuestionType = "MCQ" | "TRUE_FALSE" | "IMAGE" | "ESSAY";

interface PassageSubQuestion {
  id?: string | number;
  questionId?: string;
  type?: "MCQ" | "TRUE_FALSE" | "IMAGE";
  question: string;
  options: string[];
  correctAnswer: number;
  imagePreview?: string;
  imageFile?: any;
}

interface Question {
  id: any;
  questionId?: string;
  questionGroupId?: string;
  type: QuestionType;
  question: string;
  questionText?: string;
  questionType?: string;
  note?: string;
  imageUrl?: string;

  imageFile?: any;
  imagePreview?: string;

  options?: string[];
  correctAnswer?: number;
  essayText?: string;
  passageText?: string;

  title?: string;
  questions?: PassageSubQuestion[];
}
type UserState = {
  user: {
    id: string;
    email: string;
  } | null;
}
interface AssessmentSettings {
  passingScore: string;
  timeLimit: string;
  attemptCount: string;
  randomize: boolean;
  lockTab: boolean;
}

interface CourseBuilderAssessmentProps {
  assessmentQuestions: Question[];
  setAssessmentQuestions: React.Dispatch<
    React.SetStateAction<Question[]>
  >;
  assessmentSettings: AssessmentSettings;
  setAssessmentSettings: React.Dispatch<
    React.SetStateAction<AssessmentSettings>
  >;
  publishType: PublishType;
  createdCareerPathId?: string | null;
  createdCourseId?: string | null;
  createdLessonId?: string | null;
  onSaveDraft?: () => void;
  isSaving?: boolean;
}

export default function CourseBuilderAssessment({
  assessmentQuestions,
  setAssessmentQuestions,
  assessmentSettings,
  setAssessmentSettings,
  publishType,
  createdCareerPathId,
  createdCourseId,
  createdLessonId,
  onSaveDraft,
  isSaving,
}: CourseBuilderAssessmentProps) {


  const questions = assessmentQuestions;

  //my worek
  const [showTrueFalseModal, setShowTrueFalseModal] = useState(false);
  const [trueFalseQuestion, setTrueFalseQuestion] = useState("");
  const [trueFalseAnswer, setTrueFalseAnswer] = useState(true);

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const user = useUserStore((state: UserState) => state.user);
  const userId = user?.id ?? "";
  const lessonId = publishType === "standalone-lesson"
    ? createdLessonId
    : undefined;

  const courseId = publishType === "standalone-course"
    ? createdCourseId
    : undefined;

  const careerPathId = publishType === "career-path"
    ? createdCareerPathId
    : undefined;

  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  useEffect(() => {
    const hasEntityId = lessonId || courseId || careerPathId;
    if (!hasEntityId) return;

    const fetchQuiz = async () => {
      try {
        setIsLoadingQuiz(true);
        const query: any = {};
        if (publishType === "career-path" && careerPathId) {
          query.careerPathId = careerPathId;
        } else if (publishType === "standalone-course" && courseId) {
          query.courseId = courseId;
        } else if (publishType === "standalone-lesson" && lessonId) {
          query.lessonId = lessonId;
        } else {
          return;
        }

        const res = await getQuizzesApi(query);
        
        let quizzesArray: any[] = [];
        if (Array.isArray(res)) quizzesArray = res;
        else if (Array.isArray(res?.data)) quizzesArray = res.data;
        else if (Array.isArray(res?.data?.data)) quizzesArray = res.data.data;
        else if (Array.isArray(res?.data?.items)) quizzesArray = res.data.items;
        else if (Array.isArray(res?.items)) quizzesArray = res.items;

        if (quizzesArray.length > 0) {
          const quiz = publishType === "standalone-course" 
            ? (quizzesArray.find((q: any) => !q.lessonId && !q.lesson_id) || quizzesArray[0])
            : (publishType === "standalone-lesson" 
              ? (quizzesArray.find((q: any) => String(q.lessonId || q.lesson_id) === String(lessonId)) || quizzesArray[0])
              : (quizzesArray.find((q: any) => !q.lessonId && !q.lesson_id && !q.courseId && !q.course_id) || quizzesArray[0]));
          setAssessmentSettings({
            passingScore: String(quiz.passingScore ?? "70"),
            timeLimit: String(quiz.timeLimitMinutes ?? "30"),
            attemptCount: String(quiz.maxAttempts ?? "2"),
            randomize: quiz.randomizeQuestions ?? false,
            lockTab: quiz.lockBrowserTab ?? false,
          });

          const quizDetailRes = await getQuizByIdApi(quiz.id);
          const fullQuiz = quizDetailRes?.data || quizDetailRes;

          if (fullQuiz?.quizQuestions) {
            const groupMap = new Map<string, any>();
            const standaloneQuestions: any[] = [];

            const sortedQQs = [...fullQuiz.quizQuestions].sort(
              (a: any, b: any) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0)
            );

            for (const qq of sortedQQs) {
              const qb = qq.question;
              if (!qb) continue;

              const correctAnswerIndex = qb.questionOptions?.findIndex((o: any) => o.isCorrect) ?? 0;
              const options = qb.questionOptions
                ?.sort((a: any, b: any) => a.displayOrder - b.displayOrder)
                .map((o: any) => o.optionText) || [];

              if (qb.questionGroupId && qb.questionGroup) {
                const qg = qb.questionGroup;
                const isPassage = qg.groupType === "ESSAY" || !!qg.passageText || !!qb.commonEssayText;
                const isImageGroup = qg.groupType === "IMAGE" || !!qg.imageFileId;

                if (!groupMap.has(qb.questionGroupId)) {
                  if (isPassage) {
                    groupMap.set(qb.questionGroupId, {
                      id: qg.id,
                      questionGroupId: qg.id,
                      type: "ESSAY",
                      title: qg.title || "Passage",
                      passageText: qg.passageText || qb.commonEssayText || "",
                      question: qg.title || "Passage",
                      questions: [],
                    });
                  } else if (isImageGroup) {
                    groupMap.set(qb.questionGroupId, {
                      id: qg.id,
                      questionGroupId: qg.id,
                      imageFileId: qg.imageFileId || qg.imageFile?.id || qb.commonImageFileId,
                      type: "IMAGE",
                      imageFile: "",
                      imagePreview: qg.imageFile?.url || qg.imageFile?.signedUrl || qb.commonImageFile?.url || qb.commonImageFile?.signedUrl || "",
                      questions: [],
                    });
                  } else {
                    groupMap.set(qb.questionGroupId, {
                      id: qg.id,
                      questionGroupId: qg.id,
                      type: qg.groupType || "ESSAY",
                      title: qg.title || "",
                      passageText: qg.passageText || "",
                      questions: [],
                    });
                  }
                }

                const currentGroup = groupMap.get(qb.questionGroupId);
                currentGroup.questions.push({
                  id: qq.id,
                  questionId: qb.id,
                  type: qb.questionType,
                  question: qb.questionText,
                  options,
                  correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                });
                currentGroup.note = `${currentGroup.questions.length} sub-question${currentGroup.questions.length > 1 ? "s" : ""}`;
              } else {
                if (qb.questionType === "MCQ") {
                  standaloneQuestions.push({
                    id: qq.id,
                    questionId: qb.id,
                    type: "MCQ",
                    question: qb.questionText,
                    options,
                    correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                  });
                } else if (qb.questionType === "TRUE_FALSE") {
                  standaloneQuestions.push({
                    id: qq.id,
                    questionId: qb.id,
                    type: "TRUE_FALSE",
                    question: qb.questionText,
                    options: options.length === 2 ? options : ["True", "False"],
                    correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                  });
                } else if (qb.questionType === "IMAGE") {
                  standaloneQuestions.push({
                    id: qq.id,
                    questionId: qb.id,
                    imageFileId: qb.commonImageFileId || qb.commonImageFile?.id,
                    type: "IMAGE",
                    question: qb.questionText,
                    imagePreview: qb.commonImageFile?.url || qb.commonImageFile?.signedUrl || qb.imageUrl || "",
                    options,
                    correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                  });
                } else if (qb.questionType === "ESSAY") {
                  const hasOptions = options && options.length > 0;
                  standaloneQuestions.push({
                    id: qq.id,
                    questionId: qb.id,
                    type: "ESSAY",
                    title: qb.questionText,
                    passageText: qb.commonEssayText || "",
                    question: qb.questionText,
                    note: hasOptions ? "1 sub-question" : "Open-ended descriptive essay",
                    questions: hasOptions
                      ? [
                          {
                            id: qq.id,
                            questionId: qb.id,
                            type: "MCQ",
                            question: qb.questionText,
                            options,
                            correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                          },
                        ]
                      : [
                          {
                            id: qq.id,
                            questionId: qb.id,
                            type: "ESSAY",
                            question: qb.questionText,
                            options: [],
                            correctAnswer: 0,
                          },
                        ],
                  });
                }
              }
            }

            const reconstructed = [...groupMap.values(), ...standaloneQuestions];
            if (reconstructed.length > 0) {
              setAssessmentQuestions(reconstructed);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load quiz", err);
      } finally {
        setIsLoadingQuiz(false);
      }
    };

    fetchQuiz();
  }, [publishType, careerPathId, courseId, lessonId, setAssessmentSettings, setAssessmentQuestions]);


  const [selectedType, setSelectedType] = useState<QuestionType>();
  const [showMcqModal, setShowMcqModal] = useState(false);
  const [mcqQuestion, setMcqQuestion] = useState("");
  const [mcqOptions, setMcqOptions] = useState([
    "",
    "",
    "",
    "",
  ]);

  const [showEssayModal, setShowEssayModal] = useState(false);
  const [essayTitle, setEssayTitle] = useState("");
  const [essayPassageText, setEssayPassageText] = useState("");
  const [essayQuestions, setEssayQuestions] = useState<PassageSubQuestion[]>([
    {
      question: "",
      type: "MCQ",
      options: ["", "", "", ""],
      correctAnswer: 0,
    },
  ]);

  const [showImageModal, setShowImageModal] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [imageQuestions, setImageQuestions] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    },
  ]);

  const [mcqCorrectAnswer, setMcqCorrectAnswer] = useState(0);
  const getQuestionType = () => {
    switch (selectedType) {
      case "MCQ":
        return "MCQ";

      case "TRUE_FALSE":
        return "TRUE_FALSE";

      case "IMAGE":
        return "IMAGE";

      case "ESSAY":
        return "ESSAY";

      default:
        return "MCQ";
    }
  };
  const handleAddQuestion = (type: QuestionType) => {
    setSelectedType(type);

    if (type === "TRUE_FALSE") {
      setShowTrueFalseModal(true);
      return;
    }

    if (type === "MCQ") {
      setShowMcqModal(true);
      return;
    }

    if (type === "ESSAY") {
      setShowEssayModal(true);
      return;
    }

    if (type === "IMAGE") {
      setShowImageModal(true);
      return;
    }
  };

  const addMcqOption = () => {
    setMcqOptions((prev) => [...prev, ""]);
  };

  const removeMcqOption = (index: number) => {
    setMcqOptions((prev) =>
      prev.filter((_, i) => i !== index),
    );
  };

  const updateMcqOption = (
    index: number,
    value: string,
  ) => {
    const updated = [...mcqOptions];
    updated[index] = value;
    setMcqOptions(updated);
  };

  const handleSaveMcqQuestion = () => {
    try {
      const existingQuestions = (assessmentQuestions || []) as any[];

      let updatedQuestions = [...existingQuestions];

      if (editingIndex !== null) {
        // UPDATE
        updatedQuestions[editingIndex] = {
          ...updatedQuestions[editingIndex],
          question: mcqQuestion,
          options: mcqOptions,
          correctAnswer: mcqCorrectAnswer,
        };
      } else {
        // CREATE
        updatedQuestions.push({
          id: Date.now(),
          type: "MCQ",
          questionType: "MCQ",
          question: mcqQuestion,
          options: mcqOptions,
          correctAnswer: mcqCorrectAnswer,
        });
      }

      setAssessmentQuestions(updatedQuestions);

      // Reset
      setMcqQuestion("");
      setMcqOptions(["", "", "", ""]);
      setMcqCorrectAnswer(0);

      setEditingIndex(null);
      setEditingQuestion(null);

      setShowMcqModal(false);
    } catch (error) {
      console.error(error);
    }
  };



  const handleSaveTrueFalseQuestion = () => {
    const existingQuestions = (assessmentQuestions || []) as any[];

    let updatedQuestions = [...existingQuestions];

    const questionData = {
      type: "TRUE_FALSE",
      questionType: "TRUE_FALSE",
      question: trueFalseQuestion,
      questionText: trueFalseQuestion,
      options: ["True", "False"],
      correctAnswer: trueFalseAnswer ? 0 : 1,
    };

    if (editingIndex !== null) {
      // UPDATE
      updatedQuestions[editingIndex] = {
        ...updatedQuestions[editingIndex],
        ...questionData,
      };
    } else {
      // CREATE
      updatedQuestions.push({
        id: Date.now(),
        ...questionData,
      });
    }

    setAssessmentQuestions(updatedQuestions);

    // Reset
    setTrueFalseQuestion("");
    setTrueFalseAnswer(true);

    setEditingIndex(null);
    setEditingQuestion(null);

    setShowTrueFalseModal(false);
  };

  const handleEditQuestion = (
    question: Question,
    index: number
  ) => {

    setEditingQuestion(question);
    setEditingIndex(index);
    setSelectedType((question.type || question.questionType) as QuestionType);

    if (
      question.type === "MCQ" ||
      question.questionType === "MCQ"
    ) {

      setMcqQuestion(
        question.question || question.questionText || ""
      );

      if (
        Array.isArray(question.options) &&
        typeof question.options[0] === "string"
      ) {
        setMcqOptions(question.options as string[]);
      }

      setMcqCorrectAnswer(
        question.correctAnswer ?? 0
      );

      setShowMcqModal(true);

    }

    if (
      question.type === "TRUE_FALSE" ||
      question.questionType === "TRUE_FALSE"
    ) {

      setTrueFalseQuestion(
        question.question || question.questionText || ""
      );

      setTrueFalseAnswer(
        question.correctAnswer === 0
      );

      setShowTrueFalseModal(true);
    }

    if (question.type === "ESSAY") {
      setEditingQuestion(question);
      setEditingIndex(index);
      setEssayTitle(question.title || question.question || "");
      setEssayPassageText(question.passageText || question.essayText || "");

      const existingSubs = question.questions && question.questions.length > 0
        ? question.questions.map((q: any) => ({
            id: q.id,
            questionId: q.questionId,
            type: (q.type as "MCQ" | "TRUE_FALSE" | "IMAGE") || "MCQ",
            question: q.question || q.questionText || "",
            options: Array.isArray(q.options) && q.options.length >= 2
              ? q.options
              : (q.type === "TRUE_FALSE" ? ["True", "False"] : ["Option 1", "Option 2", "Option 3", "Option 4"]),
            correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
            imagePreview: q.imagePreview || "",
          }))
        : [
            {
              question: question.question || "",
              type: "MCQ" as const,
              options: Array.isArray(question.options) && question.options.length >= 2
                ? question.options
                : ["Option 1", "Option 2", "Option 3", "Option 4"],
              correctAnswer: question.correctAnswer ?? 0,
            },
          ];

      setEssayQuestions(existingSubs);
      setShowEssayModal(true);
    }

    if (question.type === "IMAGE") {
      setEditingQuestion(question);
      setEditingIndex(index);

      setSelectedImage(null);

      setImagePreview(question.imagePreview || "");

      setImageQuestions(
        question.questions || [
          {
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
          },
        ]
      );

      setShowImageModal(true);
    }

  };

  const handleDeleteQuestion = (question: any, index: number) => {
    Modal.confirm({
      title: "Delete Question",
      content: "Are you sure you want to delete this question? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          if (question.questionId || (typeof question.id === "string")) {
            // Delete from Database
            if (question.id && typeof question.id === "string") {
              await deleteQuizQuestionApi(question.id).catch(console.error);
            }
            if (question.questionId && typeof question.questionId === "string") {
              await deleteQuestionBankApi(question.questionId).catch(console.error);
            }
            if (Array.isArray(question.questions)) {
              for (const sub of question.questions) {
                if (sub.id && typeof sub.id === "string") {
                  await deleteQuizQuestionApi(sub.id).catch(console.error);
                }
                if (sub.questionId && typeof sub.questionId === "string") {
                  await deleteQuestionBankApi(sub.questionId).catch(console.error);
                }
              }
            }
            notification.success({ title: "Question deleted from database" });
          } else {
            notification.success({ title: "Question removed from draft" });
          }
          
          setAssessmentQuestions((prev: any[]) => prev.filter((_, i) => i !== index));
          
          if (editingIndex === index) {
            setEditingIndex(null);
            setEditingQuestion(null);
            setShowMcqModal(false);
            setShowTrueFalseModal(false);
            setShowEssayModal(false);
            setShowImageModal(false);
          }
        } catch (error) {
          console.error("Failed to delete question", error);
          notification.error({ title: "Failed to delete question" });
        }
      }
    });
  };

  const addEssayQuestion = (type: "MCQ" | "TRUE_FALSE" | "IMAGE" = "MCQ") => {
    setEssayQuestions((prev) => [
      ...prev,
      {
        question: "",
        type,
        options: type === "TRUE_FALSE" ? ["True", "False"] : ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  const removeEssayQuestion = (index: number) => {
    setEssayQuestions((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const updateEssayQuestion = (
    index: number,
    value: string
  ) => {
    const updated = [...essayQuestions];
    updated[index].question = value;
    setEssayQuestions(updated);
  };

  const updateEssayQuestionType = (
    index: number,
    type: "MCQ" | "TRUE_FALSE" | "IMAGE"
  ) => {
    const updated = [...essayQuestions];
    updated[index].type = type;
    if (type === "TRUE_FALSE") {
      updated[index].options = ["True", "False"];
      updated[index].correctAnswer = 0;
    } else if (updated[index].options.length < 2) {
      updated[index].options = ["", "", "", ""];
      updated[index].correctAnswer = 0;
    }
    setEssayQuestions(updated);
  };

  const updateEssayOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updated = [...essayQuestions];
    updated[questionIndex].options[optionIndex] = value;
    setEssayQuestions(updated);
  };

  const addEssayOption = (questionIndex: number) => {
    const updated = [...essayQuestions];
    updated[questionIndex].options.push("");
    setEssayQuestions(updated);
  };

  const removeEssayOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...essayQuestions];
    if (updated[questionIndex].options.length > 2) {
      updated[questionIndex].options = updated[questionIndex].options.filter((_: any, i: number) => i !== optionIndex);
      if (updated[questionIndex].correctAnswer >= updated[questionIndex].options.length) {
        updated[questionIndex].correctAnswer = 0;
      }
      setEssayQuestions(updated);
    }
  };

  const updateEssayCorrectAnswer = (
    questionIndex: number,
    answer: number
  ) => {
    const updated = [...essayQuestions];
    updated[questionIndex].correctAnswer = answer;
    setEssayQuestions(updated);
  };

  const updateEssaySubQuestionImage = (
    questionIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = [...essayQuestions];
      updated[questionIndex].imagePreview = reader.result as string;
      updated[questionIndex].imageFile = file;
      setEssayQuestions(updated);
    };
    reader.readAsDataURL(file);
  };

  const removeEssaySubQuestionImage = (questionIndex: number) => {
    const updated = [...essayQuestions];
    updated[questionIndex].imagePreview = "";
    updated[questionIndex].imageFile = undefined;
    setEssayQuestions(updated);
  };

  const handleSaveEssay = () => {
    const existingQuestions = (assessmentQuestions || []) as any[];
    let updatedQuestions = [...existingQuestions];

    const currentItem = editingIndex !== null ? updatedQuestions[editingIndex] : null;

    const essayData: Question = {
      id: currentItem?.id ?? Date.now(),
      questionGroupId: currentItem?.questionGroupId,
      type: "ESSAY",
      title: essayTitle.trim() || "Passage",
      passageText: essayPassageText.trim(),
      question: essayTitle.trim() || "Passage",
      note: `${essayQuestions.length} sub-question${essayQuestions.length > 1 ? "s" : ""}`,
      questions: essayQuestions.map((q, idx) => ({
        id: q.id || (Date.now() + idx),
        questionId: q.questionId,
        type: q.type || "MCQ",
        question: q.question.trim(),
        options: q.type === "TRUE_FALSE" ? ["True", "False"] : q.options.map((o: string) => o.trim()),
        correctAnswer: q.correctAnswer ?? 0,
        imagePreview: q.imagePreview,
        imageFile: q.imageFile,
      })),
    };

    if (editingIndex !== null) {
      updatedQuestions[editingIndex] = essayData;
    } else {
      updatedQuestions.push(essayData);
    }

    setAssessmentQuestions(updatedQuestions);
    setEditingIndex(null);
    setEditingQuestion(null);
    setEssayTitle("");
    setEssayPassageText("");
    setEssayQuestions([
      {
        question: "",
        type: "MCQ",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
    setShowEssayModal(false);
  };

  // image
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(reader.result as string); // base64
    };

    reader.readAsDataURL(file);
  };
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
  };
  const addImageQuestion = () => {
    setImageQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  const removeImageQuestion = (index: number) => {
    setImageQuestions((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const updateImageQuestion = (
    index: number,
    value: string
  ) => {
    const updated = [...imageQuestions];

    updated[index].question = value;

    setImageQuestions(updated);
  };

  const updateImageOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updated = [...imageQuestions];

    updated[questionIndex].options[optionIndex] = value;

    setImageQuestions(updated);
  };

  const updateImageCorrectAnswer = (
    questionIndex: number,
    answer: number
  ) => {
    const updated = [...imageQuestions];

    updated[questionIndex].correctAnswer = answer;

    setImageQuestions(updated);
  };

  const handleSaveImage = () => {
    const existing = (assessmentQuestions || []) as any[];
    const updated = [...existing];
    const currentItem = editingIndex !== null ? updated[editingIndex] : null;

    const imageData = {
      id: currentItem?.id ?? Date.now(),
      questionGroupId: currentItem?.questionGroupId,
      imageFileId: currentItem?.imageFileId,

      type: "IMAGE",

      // retain File object or previous file reference
      imageFile:
        selectedImage ||
        currentItem?.imageFile ||
        "",

      // preview URL
      imagePreview:
        imagePreview ||
        currentItem?.imagePreview ||
        "",

      questions: imageQuestions.map((iq: any, idx: number) => ({
        ...iq,
        id: iq.id || (Date.now() + idx),
        questionId: iq.questionId,
      })),
    };

    if (editingIndex !== null) {
      updated[editingIndex] = imageData;
    } else {
      updated.push(imageData);
    }

    setAssessmentQuestions(updated);

    setEditingIndex(null);
    setEditingQuestion(null);

    setSelectedImage(null);
    setImagePreview("");

    setImageQuestions([
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);

    setShowImageModal(false);
  };

  const isMcqValid = mcqQuestion.trim().length > 0 && mcqOptions.every(opt => opt.trim().length > 0) && mcqOptions.length >= 2;
  const isTrueFalseValid = trueFalseQuestion.trim().length > 0;
  const isEssayValid =
    (essayTitle.trim().length > 0 || essayPassageText.trim().length > 0) &&
    essayQuestions.length > 0 &&
    essayQuestions.every((q) => {
      const hasText = q.question.trim().length > 0;
      if (!hasText) return false;
      if (q.type === "TRUE_FALSE") return true;
      return (
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.options.every((opt: string) => opt.trim().length > 0)
      );
    });
  const isImageValid = imagePreview.length > 0 && imageQuestions.length > 0 && imageQuestions.every(q => q.question.trim().length > 0 && q.options.every(opt => opt.trim().length > 0) && q.options.length >= 2);

  if (isLoadingQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
        <div className="flex flex-col items-center gap-4">
          <Spin size="large" />
          <p className="text-gray-500 font-medium">Loading assessment details...</p>
        </div>
      </div>
    );
  }

  const effectiveQuestions = questions || [];
  const totalQuestions = effectiveQuestions.length;
  const passingScore = assessmentSettings.passingScore || "70";
  const timeLimit = assessmentSettings.timeLimit || "30";
  const attempts = assessmentSettings.attemptCount || "2";

  return (
    <div className="w-full min-w-0 mt-6 space-y-6 pb-24">
      {/* 4 Summary KPI Cards — Icon Top-Left, Exact Colors, Font & Metric Display & Hover Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* QUESTIONS */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300 cursor-default">
          <div className="w-9 h-9 rounded-xl bg-[#fbf4ea] flex items-center justify-center mb-3">
            <svg className="w-4.5 h-4.5 text-[#c97a2b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C] mb-1.5">QUESTIONS</p>
          <p className="text-[24px] sm:text-[28px] font-extrabold text-[#141414] leading-tight">{totalQuestions}</p>
        </div>

        {/* PASSING SCORE */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300 cursor-default">
          <div className="w-9 h-9 rounded-xl bg-[#ebf8f2] flex items-center justify-center mb-3">
            <svg className="w-4.5 h-4.5 text-[#2d9d68]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C] mb-1.5">PASSING SCORE</p>
          <p className="text-[24px] sm:text-[28px] font-extrabold text-[#141414] leading-tight">{passingScore}%</p>
        </div>

        {/* TIME LIMIT */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300 cursor-default">
          <div className="w-9 h-9 rounded-xl bg-[#fef0ea] flex items-center justify-center mb-3">
            <svg className="w-4.5 h-4.5 text-[#e66a35]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 6v6l4 2" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C] mb-1.5">TIME LIMIT</p>
          <p className="text-[24px] sm:text-[28px] font-extrabold text-[#141414] leading-tight">
            {timeLimit} <span className="text-[16px] font-semibold text-[#5C5C5C] ml-0.5">minutes</span>
          </p>
        </div>

        {/* ATTEMPTS */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300 cursor-default">
          <div className="w-9 h-9 rounded-xl bg-[#fbf5e6] flex items-center justify-center mb-3">
            <svg className="w-4.5 h-4.5 text-[#b8860b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C] mb-1.5">ATTEMPTS</p>
          <p className="text-[24px] sm:text-[28px] font-extrabold text-[#141414] leading-tight">{attempts}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[16px] font-bold text-[#141414]">
              Questions ({totalQuestions})
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddQuestion("MCQ")}
                className="bg-white border border-gray-300 text-[#141414] text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-gray-50 hover:border-gray-400 hover:shadow-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-98"
              >
                + MCQ
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion("TRUE_FALSE")}
                className="bg-white border border-gray-300 text-[#141414] text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-gray-50 hover:border-gray-400 hover:shadow-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-98"
              >
                + True/False
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion("IMAGE")}
                className="bg-white border border-gray-300 text-[#141414] text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-gray-50 hover:border-gray-400 hover:shadow-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-98"
              >
                + Image Based
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion("ESSAY")}
                className="bg-white border border-gray-300 text-[#141414] text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-gray-50 hover:border-gray-400 hover:shadow-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-98"
              >
                + Passage
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {effectiveQuestions.map((question, index) => {
              const rawType = question.type || question.questionType || "MCQ";
              const typeLabel =
                rawType === "TRUE_FALSE"
                  ? "TRUE/FALSE"
                  : rawType === "IMAGE"
                  ? "IMAGE BASED"
                  : rawType === "ESSAY"
                  ? "PASSAGE"
                  : rawType;

              return (
                <div
                  key={question.id || index}
                  className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <p className="text-xs uppercase text-[#5C5C5C] font-bold tracking-wider">
                        Q{index + 1} · {typeLabel}
                      </p>
                      <h3 className="text-[15px] sm:text-[16px] font-bold text-[#141414] leading-snug">
                        {question.title || question.question || question.questionText}
                      </h3>
                      {(question.note || rawType === "IMAGE" || rawType === "ESSAY") && (
                        <p className="text-xs text-[#5C5C5C] font-medium pt-0.5">
                          {question.note || (rawType === "ESSAY" ? `${question.questions?.length || 1} sub-question${(question.questions?.length || 1) > 1 ? "s" : ""}` : "Image with 1 sub-question")}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditQuestion(question, index)}
                        className="bg-white border border-gray-300 text-[#141414] text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-gray-50 hover:border-gray-400 hover:shadow-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-98"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(question, index)}
                        className="bg-white border border-red-200 text-red-600 text-sm font-semibold px-3 py-1.5 rounded-full hover:bg-red-50 hover:border-red-300 transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-98"
                      >
                        <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Quiz Settings (Matching Frame 45 & Screenshots 244-245) */}
        <div>
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-4 sticky top-6 transition-all duration-200 hover:shadow-md hover:border-gray-300">
            <h3 className="text-[16px] font-bold text-[#141414]">
              Quiz settings
            </h3>

            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                  PASSING SCORE <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={assessmentSettings.passingScore ?? "70"}
                    onChange={(e) => setAssessmentSettings((prev) => ({ ...prev, passingScore: e.target.value }))}
                    placeholder="70"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold text-[#141414] focus:outline-none focus:border-[#141414] shadow-2xs"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5C5C5C] pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                  TIME LIMIT
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={assessmentSettings.timeLimit ?? "30"}
                    onChange={(e) => setAssessmentSettings((prev) => ({ ...prev, timeLimit: e.target.value }))}
                    placeholder="30"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-16 text-sm font-semibold text-[#141414] focus:outline-none focus:border-[#141414] shadow-2xs"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5C5C5C] pointer-events-none">
                    minutes
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">
                  RETRY ATTEMPTS <span className="text-red-500">*</span>
                </label>
                <select
                  value={String(assessmentSettings.attemptCount || "2")}
                  onChange={(e) => setAssessmentSettings((prev) => ({ ...prev, attemptCount: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#141414] focus:outline-none focus:border-[#141414] cursor-pointer shadow-2xs appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_1rem_center] bg-no-repeat pr-8"
                >
                  <option value="1">1 attempt</option>
                  <option value="2">2 attempts</option>
                  <option value="3">3 attempts</option>
                  <option value="5">5 attempts</option>
                  <option value="10">10 attempts</option>
                </select>
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-2.5 text-sm font-medium text-[#3A3A3A] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(assessmentSettings.randomize)}
                    onChange={(e) => setAssessmentSettings((prev) => ({ ...prev, randomize: e.target.checked }))}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                      Boolean(assessmentSettings.randomize)
                        ? "bg-[#2d7a4f] text-white"
                        : "border border-gray-300 bg-white"
                    }`}
                  >
                    {Boolean(assessmentSettings.randomize) && (
                      <span className="text-[10px] font-extrabold leading-none">✓</span>
                    )}
                  </div>
                  <span>Randomise question order</span>
                </label>

                <label className="flex items-center gap-2.5 text-sm font-medium text-[#3A3A3A] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(assessmentSettings.lockTab)}
                    onChange={(e) => setAssessmentSettings((prev) => ({ ...prev, lockTab: e.target.checked }))}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                      Boolean(assessmentSettings.lockTab)
                        ? "bg-[#2d7a4f] text-white"
                        : "border border-gray-300 bg-white"
                    }`}
                  >
                    {Boolean(assessmentSettings.lockTab) && (
                      <span className="text-[10px] font-extrabold leading-none">✓</span>
                    )}
                  </div>
                  <span>Lock browser tab during quiz</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMcqModal && (
        <div className="fixed inset-0 z-9999 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-serif italic">
                {editingIndex !== null ? "Update MCQ Question" : "Add Question"}
              </h2>
              <div className="px-4 py-2 bg-orange-100 rounded-full text-sm font-semibold">
                MCQ
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                Question Prompt
              </label>
              <textarea
                rows={4}
                value={mcqQuestion}
                onChange={(e) =>
                  setMcqQuestion(e.target.value)
                }
                className="w-full border rounded-xl p-4"
                placeholder="Type the question here..."
              />
            </div>

            {/* Options */}
            <div>
              <label className="block mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                Answer Options
              </label>
              <div className="space-y-4">
                {mcqOptions.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3"
                  >
                    <input
                      type="radio"
                      checked={
                        mcqCorrectAnswer === index
                      }
                      onChange={() =>
                        setMcqCorrectAnswer(index)
                      }
                    />

                    <input
                      value={option}
                      onChange={(e) =>
                        updateMcqOption(
                          index,
                          e.target.value,
                        )
                      }
                      placeholder="Answer option"
                      className="flex-1 border rounded-xl px-4 py-3"
                    />

                    {mcqOptions.length > 2 && (
                      <button
                        onClick={() =>
                          removeMcqOption(index)
                        }
                        className="w-10 h-10 border rounded-lg"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

              </div>

              {mcqOptions.length < 5 && (
                <button
                  onClick={addMcqOption}
                  className="mt-4 text-red-700 font-semibold"
                >
                  + Add Option
                </button>
              )}

            </div>

            {/* Footer */}

            <div className="flex justify-end gap-3 mt-10">

              <button
                onClick={() =>
                  setShowMcqModal(false)
                }
                className="border px-6 py-3 rounded-full"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveMcqQuestion}
                disabled={!isMcqValid}
                className={`px-6 py-3 rounded-full font-semibold ${isMcqValid ? 'bg-yellow-200 cursor-pointer hover:bg-yellow-300' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {editingIndex !== null ? "Update Question" : "Save Question"}
              </button>

            </div>

          </div>

        </div>
      )}

      {showTrueFalseModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-8">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-serif italic">
                {editingIndex !== null ? "Update Question" : "Add question"}
              </h2>

              <span className="px-4 py-2 rounded-full bg-orange-100 text-xs font-bold tracking-wider">
                TRUE / FALSE
              </span>
            </div>

            {/* QUESTION */}
            <div className="mb-8">
              <label className="block mb-2 text-xs font-black uppercase tracking-widest text-gray-500">
                Question Prompt
              </label>

              <textarea
                value={trueFalseQuestion}
                onChange={(e) =>
                  setTrueFalseQuestion(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Type the question here..."
                className="w-full rounded-xl border border-gray-300 p-4 outline-none"
              />
            </div>

            {/* ANSWERS */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500">
                Correct Answer
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={trueFalseAnswer === true}
                  onChange={() =>
                    setTrueFalseAnswer(true)
                  }
                />

                <input
                  value="True"
                  readOnly
                  className="flex-1 rounded-xl border border-gray-300 p-3"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={trueFalseAnswer === false}
                  onChange={() =>
                    setTrueFalseAnswer(false)
                  }
                />

                <input
                  value="False"
                  readOnly
                  className="flex-1 rounded-xl border border-gray-300 p-3"
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-8 flex justify-end gap-3 border-t pt-6">
              <button
                onClick={() =>
                  setShowTrueFalseModal(false)
                }
                className="border px-5 py-2 rounded-full"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveTrueFalseQuestion}
                disabled={!isTrueFalseValid}
                className={`px-5 py-2 rounded-full font-semibold ${isTrueFalseValid ? 'bg-yellow-200 cursor-pointer hover:bg-yellow-300' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {editingIndex !== null ? "Update Question" : "Save Question"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEssayModal && (
        <div className="fixed inset-0 z-9999 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-xl max-h-[95vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b">
              <div>
                <h2 className="text-3xl font-serif italic text-[#141414]">
                  {editingIndex !== null ? "Update Passage" : "Add Passage"}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Add a reading passage, case study, or scenario, then configure sub-questions below.
                </p>
              </div>

              <span className="px-5 py-2 rounded-full bg-orange-100 text-[11px] font-bold tracking-wider text-orange-700">
                PASSAGE
              </span>
            </div>

            <div className="p-8 space-y-6">

              {/* Passage Title */}
              <div>
                <label className="block mb-2 text-xs font-black uppercase tracking-widest text-gray-500">
                  Passage Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={essayTitle}
                  onChange={(e) => setEssayTitle(e.target.value)}
                  placeholder="e.g. Introduction to Cloud Architectures"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black text-sm font-medium"
                />
              </div>

              {/* Passage Content / Text */}
              <div>
                <label className="block mb-2 text-xs font-black uppercase tracking-widest text-gray-500">
                  Passage Content / Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={essayPassageText}
                  onChange={(e) => setEssayPassageText(e.target.value)}
                  placeholder="Enter the passage text, article excerpt, case study, or scenario here..."
                  className="w-full rounded-xl border border-gray-300 p-4 outline-none resize-none focus:border-black text-sm leading-relaxed"
                />
              </div>

              {/* Questions Section Header */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">
                      Questions Under This Passage
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Add questions based on the passage above using MCQ, True/False, or Image Based formats.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {essayQuestions.length} Question{essayQuestions.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-6">
                  {essayQuestions.map((item, index) => {
                    const qType = item.type || "MCQ";
                    return (
                      <div
                        key={index}
                        className="rounded-2xl border border-gray-200 bg-[#faf9f7] p-6 space-y-4"
                      >
                        {/* Sub-Question Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200/80">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-600">
                              Question {String(index + 1).padStart(2, "0")}
                            </span>
                            {/* Question Type Selector */}
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateEssayQuestionType(index, "MCQ")}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${qType === "MCQ" ? "bg-black text-white" : "text-gray-600 hover:text-black"}`}
                              >
                                MCQ
                              </button>
                              <button
                                type="button"
                                onClick={() => updateEssayQuestionType(index, "TRUE_FALSE")}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${qType === "TRUE_FALSE" ? "bg-black text-white" : "text-gray-600 hover:text-black"}`}
                              >
                                True/False
                              </button>
                              <button
                                type="button"
                                onClick={() => updateEssayQuestionType(index, "IMAGE")}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${qType === "IMAGE" ? "bg-black text-white" : "text-gray-600 hover:text-black"}`}
                              >
                                Image
                              </button>
                            </div>
                          </div>

                          {essayQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEssayQuestion(index)}
                              className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-red-50 text-gray-500 hover:text-red-600 flex items-center justify-center text-lg leading-none transition-colors cursor-pointer"
                              title="Delete sub-question"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Image Uploader for Image type */}
                        {qType === "IMAGE" && (
                          <div className="p-4 bg-white rounded-xl border border-gray-200">
                            {item.imagePreview ? (
                              <div className="relative inline-block">
                                <img
                                  src={item.imagePreview}
                                  alt="Sub-question preview"
                                  className="max-h-40 rounded-lg object-contain border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeEssaySubQuestionImage(index)}
                                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                  Upload Question Image
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => updateEssaySubQuestionImage(index, e)}
                                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Question Input */}
                        <div>
                          <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                            Question Prompt
                          </label>
                          <input
                            type="text"
                            value={item.question}
                            onChange={(e) => updateEssayQuestion(index, e.target.value)}
                            placeholder="Type question based on the passage above..."
                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-black text-sm"
                          />
                        </div>

                        {/* Answer Options */}
                        <div>
                          <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                            Answer Options (Select the correct one)
                          </label>

                          {qType === "TRUE_FALSE" ? (
                            <div className="space-y-2">
                              {["True", "False"].map((optText, optIndex) => (
                                <label
                                  key={optIndex}
                                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${item.correctAnswer === optIndex ? "border-black bg-yellow-50/50" : "border-gray-200 bg-white"}`}
                                >
                                  <input
                                    type="radio"
                                    name={`tf-passage-${index}`}
                                    checked={item.correctAnswer === optIndex}
                                    onChange={() => updateEssayCorrectAnswer(index, optIndex)}
                                    className="w-4 h-4 text-black focus:ring-black cursor-pointer"
                                  />
                                  <span className="text-sm font-semibold text-gray-800">{optText}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {item.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name={`passage-q-${index}`}
                                    checked={item.correctAnswer === optionIndex}
                                    onChange={() => updateEssayCorrectAnswer(index, optionIndex)}
                                    className="w-4 h-4 text-black focus:ring-black cursor-pointer"
                                    title="Mark as correct answer"
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => updateEssayOption(index, optionIndex, e.target.value)}
                                    placeholder={`Option ${optionIndex + 1}`}
                                    className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black bg-white"
                                  />
                                  {item.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeEssayOption(index, optionIndex)}
                                      className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center text-sm cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => addEssayOption(index)}
                                className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1 pt-1 cursor-pointer"
                              >
                                + Add Option
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Sub-Question Button */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => addEssayQuestion("MCQ")}
                    className="flex-1 rounded-xl border border-dashed border-gray-300 py-3.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    + Add MCQ Question
                  </button>
                  <button
                    type="button"
                    onClick={() => addEssayQuestion("TRUE_FALSE")}
                    className="flex-1 rounded-xl border border-dashed border-gray-300 py-3.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    + Add True/False Question
                  </button>
                  <button
                    type="button"
                    onClick={() => addEssayQuestion("IMAGE")}
                    className="flex-1 rounded-xl border border-dashed border-gray-300 py-3.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    + Add Image Question
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 flex justify-end gap-3 border-t pt-6">
                <button
                  type="button"
                  onClick={() => setShowEssayModal(false)}
                  className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEssay}
                  disabled={!isEssayValid}
                  className={`rounded-full px-6 py-2.5 text-sm font-semibold ${isEssayValid ? 'bg-yellow-200 hover:bg-yellow-300 cursor-pointer text-[#141414]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  {editingIndex !== null ? "Update Passage" : "Save Passage"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-8">

            {/* Header */}

            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-[38px] italic font-serif text-gray-800">
                {editingIndex !== null ? "Update question" : "Add question"}
              </h2>

              <span className="rounded-full bg-[#F9D8CC] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#8B5E3C]">
                Image Based
              </span>
            </div>

            {/* IMAGE */}

            <div className="mb-8">

              <p className="mb-2 text-[11px] font-bold uppercase tracking-[2px] text-[#8B5E3C]">
                Question Image
              </p>

              {!imagePreview ? (

                <label className="flex h-36 cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 bg-[#faf8f4] hover:bg-[#f5f2ec]">

                  <span className="text-sm text-gray-500">
                    Click to upload an image (PNG, JPG or GIF)
                  </span>

                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                </label>

              ) : (

                <div className="relative inline-block">

                  <img
                    src={imagePreview}
                    className="max-h-72 rounded-lg border"
                  />

                  <button
                    onClick={removeImage}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow border"
                  >
                    ✕
                  </button>

                </div>

              )}

            </div>

            {/* QUESTIONS */}

            <div>

              <p className="mb-4 text-[11px] font-bold uppercase tracking-[2px] text-[#8B5E3C]">
                Questions About This Image
              </p>

              {imageQuestions.map((item, index) => (

                <div
                  key={index}
                  className="mb-5 rounded-lg border border-gray-300 bg-[#faf8f4] p-5"
                >

                  <div className="mb-5 flex items-center justify-between">

                    <div>

                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#8B5E3C]">
                        Question {String(index + 1).padStart(2, "0")}
                      </p>

                    </div>

                    {imageQuestions.length > 1 && (

                      <button
                        onClick={() => removeImageQuestion(index)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border text-gray-500 hover:bg-gray-100"
                      >
                        ×
                      </button>

                    )}

                  </div>

                  {/* Question */}

                  <div className="mb-5">

                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#8B5E3C]">
                      Question Prompt
                    </p>

                    <textarea
                      rows={2}
                      value={item.question}
                      onChange={(e) =>
                        updateImageQuestion(index, e.target.value)
                      }
                      placeholder="What does this image show..."
                      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    />

                  </div>

                  {/* OPTIONS */}

                  <div>

                    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#8B5E3C]">
                      Answer Options (Select the Correct One)
                    </p>

                    {item.options.map((option, optionIndex) => (

                      <div
                        key={optionIndex}
                        className="mb-3 flex items-center gap-3"
                      >

                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={item.correctAnswer === optionIndex}
                          onChange={() =>
                            updateImageCorrectAnswer(
                              index,
                              optionIndex
                            )
                          }
                        />

                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            updateImageOption(
                              index,
                              optionIndex,
                              e.target.value
                            )
                          }
                          placeholder="Answer option"
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                        />

                      </div>

                    ))}

                  </div>

                </div>

              ))}

            </div>

            {/* ADD QUESTION */}

            <button
              onClick={addImageQuestion}
              className="mb-8 flex w-full items-center justify-center rounded-lg border border-dashed border-gray-300 py-4 text-sm font-semibold text-[#8B5E3C] hover:bg-[#faf8f4]"
            >
              + Add question about this image
            </button>

            {/* FOOTER */}

            <div className="flex justify-end gap-4 border-t pt-6">

              <button
                onClick={() => setShowImageModal(false)}
                className="rounded-full border border-gray-300 px-7 py-3 font-medium"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveImage}
                disabled={!isImageValid}
                className={`rounded-full px-8 py-3 font-semibold ${isImageValid ? 'bg-[#FFF3B0] hover:bg-[#FFE66D] cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {editingIndex !== null ? "Update question" : "Save question"}
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
