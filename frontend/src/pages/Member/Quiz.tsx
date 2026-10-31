import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getQuizzesApi,
  createQuizAttemptApi,
  submitQuizAnswerApi,
  submitQuizApi,
  abandonQuizAttemptApi
} from "../../core/api/assessment.api";
import { getAssetByIdApi } from "../../core/api/asset/asset.api";
import { useUserStore } from "../../store/user.store";
import { Clock, ChevronLeft, ChevronRight, Check, Lock } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

const QuizSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header Skeleton */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm px-6 md:px-10 py-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-1 w-full rounded-full mt-4" />
      </header>

      {/* Main Layout Skeleton */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-10 rounded-full" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-5 w-3/5" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

interface QuestionOption {
  id?: string;
  text: string;
  imageId?: string;
  isCorrect?: boolean;
}

interface Question {
  id: number;
  questionId?: string;
  type: "mcq" | "boolean" | "image" | "text";
  question: string;
  passage?: string;
  imageId?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
}

const QuizAssetImage: React.FC<{ assetId: string; maxHeight?: number }> = ({ assetId, maxHeight = 220 }) => {
  const { data: asset, isLoading } = useQuery({
    queryKey: ["asset", assetId],
    queryFn: () => getAssetByIdApi(assetId),
    enabled: !!assetId,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-200 h-24 w-full rounded-xl flex items-center justify-center text-xs text-slate-500">
        Loading image...
      </div>
    );
  }

  if (!asset) return null;
  const url = asset.signedUrl || asset.url || asset.storagePath;
  if (!url) return <div className="text-xs text-slate-400 p-2 text-center">Image unavailable</div>;

  return (
    <img
      src={url}
      alt="Question Asset"
      style={{ maxHeight: `${maxHeight}px` }}
      className="max-w-full object-contain rounded-xl border border-slate-200 shadow-sm mx-auto"
    />
  );
};



const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const courseId = searchParams.get("courseId") || "";
  const careerPathId = searchParams.get("careerPathId") || "";
  const lessonId = searchParams.get("lessonId") || "";

  const { data: quizzesRes, isLoading: isQuizzesLoading } = useQuery({
    queryKey: ["quiz-for-taking", { courseId, lessonId, careerPathId }],
    queryFn: () => getQuizzesApi(lessonId ? { lessonId } : (courseId ? { courseId } : (careerPathId ? { careerPathId } : {}))),
    enabled: !!(lessonId || courseId || careerPathId),
  });
  const quizItems = quizzesRes?.data?.items || quizzesRes?.data?.data || (Array.isArray(quizzesRes?.data) ? quizzesRes?.data : []);
  const activeQuiz = React.useMemo(() => {
    if (!quizItems || quizItems.length === 0) return null;
    if (lessonId) {
      return quizItems.find((q: any) => String(q.lessonId || q.lesson_id) === String(lessonId)) || quizItems[0];
    } else if (courseId) {
      return quizItems.find((q: any) => !q.lessonId && !q.lesson_id) || quizItems[0];
    } else if (careerPathId) {
      return quizItems.find((q: any) => !q.lessonId && !q.lesson_id && !q.courseId && !q.course_id) || quizItems[0];
    }
    return quizItems[0];
  }, [quizItems, lessonId, courseId, careerPathId]);

  const questions: Question[] = React.useMemo(() => {
    if (activeQuiz && activeQuiz.quizQuestions && activeQuiz.quizQuestions.length > 0) {
      let mappedQuestions = activeQuiz.quizQuestions.map((qq: any, idx: number) => {
        const qb = qq.question || qq;
        const rawType = (qb.questionType || qq.questionType || "").toUpperCase();
        let type: "mcq" | "boolean" | "image" | "text" = "mcq";
        if (rawType === "TRUE_FALSE" || rawType === "BOOLEAN") type = "boolean";
        else if (rawType === "IMAGE") type = "image";
        else if (rawType === "ESSAY" || rawType === "TEXT") type = "text";

        const optsArray = qb.questionOptions || qb.options || qq.options || [];
        const options: QuestionOption[] = optsArray.map((opt: any) => ({
          id: opt.id,
          text: opt.optionText || opt.text || "",
          imageId: opt.optionImageFileId || opt.imageFileId || opt.imageId,
          isCorrect: opt.isCorrect,
        }));
        if (options.length === 0 && type === "boolean") {
          options.push({ text: "True", isCorrect: true }, { text: "False", isCorrect: false });
        }

        const correctAnswer = options.find((o) => o.isCorrect)?.text || options[0]?.text;

        return {
          id: idx + 1,
          questionId: qb.id || qq.id,
          type,
          question: qb.questionText || qb.title || qq.questionText || "Untitled Question",
          passage: qb.questionGroup?.passageText || qb.commonEssayText || qq.passage || qq.commonEssayText,
          imageId: qb.questionGroup?.imageFileId || qb.commonImageFileId || qb.questionImageFileId || qq.imageId,
          options,
          correctAnswer,
        };
      });

      if (activeQuiz.randomizeQuestions) {
        mappedQuestions = mappedQuestions.sort(() => Math.random() - 0.5);
      }

      return mappedQuestions.map((q: any, idx: number) => ({
        ...q,
        id: idx + 1
      }));
    }
    return [];
  }, [activeQuiz]);

  const user = useUserStore((state) => state.user);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [skippedQuestions, setSkippedQuestions] = useState<number[]>([]);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timeSpentSecondsRef = React.useRef<number>(0);
  const [hasAlerted, setHasAlerted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleEnterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      console.error(e);
      alert("Please allow fullscreen to take this assessment.");
    }
  };

  const isInitializingRef = React.useRef(false);

  React.useEffect(() => {
    if (!activeQuiz?.id || !user?.id || attemptId || isInitializingRef.current) {
      if (!isQuizzesLoading && !activeQuiz) {
        setIsInitializing(false);
      }
      return;
    }

    // Clear any obsolete stored attempt keys
    try {
      const storageKey = `active_quiz_attempt_${activeQuiz.id}_${user.id}`;
      sessionStorage.removeItem(storageKey);
    } catch { }

    isInitializingRef.current = true;

    const initAttempt = async () => {
      let currentAttempt: any = null;
      try {
        const createRes = await createQuizAttemptApi({ quizId: activeQuiz.id, userId: user.id });
        if (createRes?.data?.id) {
          currentAttempt = createRes.data;
          setAttemptId(createRes.data.id);
        }
      } catch (createErr: any) {
        console.error("Failed to create quiz attempt", createErr);
        isInitializingRef.current = false;
        const msg = createErr?.response?.data?.message || createErr?.message || "Failed to initialize quiz attempt";
        alert(msg);
      }

      if (currentAttempt && activeQuiz && activeQuiz.timed && activeQuiz.timeLimitMinutes) {
        const totalSeconds = activeQuiz.timeLimitMinutes * 60;
        const timeSpent = currentAttempt.timeSpentSeconds || 0;
        timeSpentSecondsRef.current = timeSpent;
        const remainingSeconds = totalSeconds - timeSpent;
        setTimeLeft(remainingSeconds > 0 ? remainingSeconds : 0);
      }
      setIsInitializing(false);
    };
    initAttempt();
  }, [activeQuiz?.id, user?.id, attemptId, isQuizzesLoading]);

  React.useEffect(() => {
    if (!activeQuiz?.lockBrowserTab) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert("Warning: Tab switching is locked during this assessment.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }
    };
  }, [activeQuiz?.lockBrowserTab]);



  // Remove the old blind assignment
  // React.useEffect(() => {
  //   if (activeQuiz && activeQuiz.timed && activeQuiz.timeLimitMinutes) {
  //     setTimeLeft(activeQuiz.timeLimitMinutes * 60);
  //   }
  // }, [activeQuiz]);

  const question = questions[currentQuestion] || questions[0];

  const submitAnswerMutation = useMutation({
    mutationFn: submitQuizAnswerApi,
  });

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    setSkippedQuestions((prev) =>
      prev.filter((id) => id !== questionId)
    );

    const currentQ = questions.find((q) => q.id === questionId);
    if (attemptId && currentQ && currentQ.questionId) {
      let selectedOptionId = undefined;
      let essayAnswer = undefined;

      if (currentQ.type === "text" && (!currentQ.options || currentQ.options.length === 0)) {
        essayAnswer = answer;
      } else {
        const opt = currentQ.options?.find((o: any) => o.text === answer);
        if (opt) selectedOptionId = opt.id;
      }

      submitAnswerMutation.mutate({
        attemptId,
        questionId: currentQ.questionId,
        selectedOptionId,
        essayAnswer,
        timeSpentSeconds: timeSpentSecondsRef.current
      });
    }
  };

  const handleSkip = () => {
    if (!skippedQuestions.includes(question.id)) {
      setSkippedQuestions((prev) => [
        ...prev,
        question.id,
      ]);
    }

    const currentQ = questions[currentQuestion];
    if (attemptId && currentQ && currentQ.questionId) {
      submitAnswerMutation.mutate({
        attemptId,
        questionId: currentQ.questionId,
        selectedOptionId: undefined,
        timeSpentSeconds: timeSpentSecondsRef.current
      });
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const submitQuizMutation = useMutation({
    mutationFn: (variables: { autoSubmitted?: boolean }) => submitQuizApi(attemptId!, variables),
    onSuccess: (res) => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }
      const queryStr = `?careerPathId=${careerPathId}&courseId=${courseId}${lessonId ? `&lessonId=${lessonId}` : ''}`;
      // Pass the attemptId to QuizResult via state so it can fetch the details.
      navigate(`/quiz-result${queryStr}`, {
        state: { attemptId, autoSubmitted: res?.data?.autoSubmitted }
      });
    },
    onError: (err) => {
      console.error("Failed to submit quiz", err);
      setIsSubmitting(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }
      const queryStr = `?careerPathId=${careerPathId}&courseId=${courseId}${lessonId ? `&lessonId=${lessonId}` : ''}`;
      navigate(`/quiz-result${queryStr}`, {
        state: { attemptId }
      });
    }
  });

  const handleExitQuiz = async () => {
    if (window.confirm("Are you sure you want to exit? Your assessment attempt will be marked as failed.")) {
      if (attemptId) {
        try {
          await abandonQuizAttemptApi(attemptId);
        } catch (e) {
          console.error("Failed to abandon attempt", e);
        }
      }
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
      if (lessonId || courseId || careerPathId) {
        navigate(`/course-player?careerPathId=${careerPathId}&courseId=${courseId}${lessonId ? `&lessonId=${lessonId}` : ''}`);
      } else {
        navigate(`/member-learning`);
      }
    }
  };

  const handleBreadcrumbClick = async (destination: string) => {
    if (attemptId && !isSubmitting) {
      if (window.confirm("Leaving this page will mark your assessment attempt as failed. Do you want to proceed?")) {
        try {
          await abandonQuizAttemptApi(attemptId);
        } catch (e) {
          console.error("Failed to abandon attempt", e);
        }
        if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
        navigate(destination);
      }
    } else {
      navigate(destination);
    }
  };

  const handleSubmit = (autoSubmitted = false) => {
    if (!attemptId) {
      alert("No active assessment attempt found. Please reload the page to start an attempt.");
      return;
    }
    setIsSubmitting(true);
    submitQuizMutation.mutate({ autoSubmitted });
  };

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (attemptId && !isSubmitting) {
        e.preventDefault();
        e.returnValue = "Leaving this page will mark your assessment attempt as failed.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [attemptId, isSubmitting]);

  React.useEffect(() => {
    if (timeLeft === null || isSubmitting) return;

    if (timeLeft === 0) {
      handleSubmit(true);
      return;
    }

    if (timeLeft === 300 && !hasAlerted) {
      alert("You have only 5 minutes left to complete the assessment.");
      setHasAlerted(true);
    }

    const timer = setInterval(() => {
      timeSpentSecondsRef.current += 1;
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, hasAlerted, attemptId, isSubmitting]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).filter(
    (key) => answers[Number(key)]?.trim() !== ""
  ).length;

  const progress =
    (answeredCount / (questions.length || 1)) * 100;

  if (isQuizzesLoading || isInitializing) {
    return <QuizSkeleton />;
  }

  if (activeQuiz?.lockBrowserTab && !isFullscreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Fullscreen Required</h2>
          <p className="text-slate-500 text-sm mb-6">
            This assessment is configured with strict monitoring. You must take it in fullscreen mode to prevent tab switching and distractions.
          </p>
          <button
            onClick={handleEnterFullscreen}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
          >
            Enter Fullscreen to Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Top Header ────────────────────────────────────────── */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm px-6 md:px-10 py-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          {/* Left: course name + label */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assessment</p>
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">
              {activeQuiz?.title || "CDMP PRACTITIONER ASSESSMENT"}
            </h1>
          </div>

          {/* Center: Question pill */}
          <div className="hidden sm:flex items-center">
            <span className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold border border-indigo-200">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>

          {/* Right: timer + exit */}
          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <div
                className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 border ${
                  timeLeft <= 300
                    ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {formatTime(timeLeft)}
              </div>
            )}
            <button
              onClick={handleExitQuiz}
              className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────── */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 pb-28 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <button
            onClick={() => handleBreadcrumbClick('/member-learning')}
            className="hover:text-indigo-600 transition-colors"
          >
            My Learning
          </button>
          <span>/</span>
          <button
            onClick={() => {
              if (courseId) handleBreadcrumbClick(`/course-details?id=${courseId}`);
              else if (careerPathId) handleBreadcrumbClick(`/career-path-details?id=${careerPathId}`);
            }}
            className="hover:text-indigo-600 transition-colors"
          >
            {activeQuiz?.title || "CDMP PRACTITIONER"}
          </button>
          <span>/</span>
          <span className="text-slate-500">Assessment</span>
        </div>

        {/* Mobile question counter */}
        <div className="flex sm:hidden items-center">
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
            Q{currentQuestion + 1} of {questions.length}
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-8">
            {/* Question badge + label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-xs font-bold">
                Q{currentQuestion + 1}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {question.type === "mcq" ? "Multiple Choice" : question.type === "boolean" ? "True / False" : "Question"}
              </span>
            </div>

            {/* Question text */}
            <h1 className="text-xl font-semibold text-slate-900 mb-6 leading-snug">
              {question.question}
            </h1>

            {/* Passage */}
            {question.passage && (
              <div className="mb-6 py-4 px-5 bg-slate-50 border-l-4 border-slate-300 text-slate-700 italic rounded-r-xl text-sm leading-relaxed">
                {question.passage}
              </div>
            )}

            {/* Question image */}
            {question.imageId && (
              <div className="mb-8">
                <QuizAssetImage assetId={question.imageId} maxHeight={280} />
              </div>
            )}

            {/* Options */}
            {question.type === "mcq" || question.type === "boolean" || question.type === "image" ? (
              <div className="space-y-3">
                {question.options?.map((option, optIdx) => {
                  const isSelected = answers[question.id] === option.text;
                  const letter = String.fromCharCode(65 + optIdx);
                  return (
                    <button
                      key={option.id || option.text || optIdx}
                      onClick={() => handleAnswer(question.id, option.text)}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      {/* Letter badge / check */}
                      {isSelected ? (
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full border-2 border-slate-300 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                          {letter}
                        </div>
                      )}

                      <div className="flex flex-col flex-1">
                        {option.imageId && (
                          <div className="mb-3">
                            <QuizAssetImage assetId={option.imageId} maxHeight={120} />
                          </div>
                        )}
                        {option.text && (
                          <span className={`text-base ${isSelected ? "text-indigo-900 font-medium" : "text-slate-700"}`}>
                            {option.text}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Your Response:
                </label>
                <textarea
                  rows={8}
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm text-slate-800"
                  placeholder="Write your response here..."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Navigation Bar ─────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {/* Previous */}
          <button
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-40 transition-all hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {/* Skip + Next/Submit */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSkip}
              className="text-sm font-medium text-slate-400 hover:text-slate-700 transition"
            >
              Skip for now
            </button>

            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitQuizMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-sm shadow-indigo-200"
              >
                {submitQuizMutation.isPending ? "Submitting..." : "Submit Assessment"}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
