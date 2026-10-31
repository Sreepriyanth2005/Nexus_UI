import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getQuizzesApi, getQuizAttemptsApi } from "../../core/api/assessment.api";
import { useUserStore } from "../../store/user.store";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import {
  ClipboardList,
  Timer,
  AlertTriangle,
  ArrowRight,
  Check,
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  HelpCircle
} from "lucide-react";

const QuizStartWarning: React.FC = () => {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const courseId = searchParams.get("courseId") || "";
  const careerPathId = searchParams.get("careerPathId") || "";
  const lessonId = searchParams.get("lessonId") || "";

  const { data: quizzesRes, isLoading: isLoadingQuiz } = useQuery({
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

  const totalQuestions = activeQuiz?.quizQuestions?.length || 10;
  const passMark = activeQuiz?.passingScore || 70;
  const allowRetry = activeQuiz?.allowRetry !== false;
  const maxAttempts = activeQuiz?.maxAttempts;
  const timeLimit = activeQuiz?.timed && activeQuiz?.timeLimitMinutes ? activeQuiz?.timeLimitMinutes : null;

  const user = useUserStore((state) => state.user);

  const { data: attemptsRes, isLoading: isLoadingAttempts } = useQuery({
    queryKey: ["quizAttempts", { quizId: activeQuiz?.id, userId: user?.id }],
    queryFn: () => getQuizAttemptsApi({ quizId: activeQuiz?.id, userId: user?.id }),
    enabled: !!(activeQuiz?.id && user?.id),
  });

  const attemptsData = attemptsRes?.data?.items || attemptsRes?.data?.data || (Array.isArray(attemptsRes?.data) ? attemptsRes?.data : []);
  const attemptCount = attemptsData.filter((a: any) => a.status === "COMPLETED").length;
  const effectiveMaxAttempts = allowRetry ? (maxAttempts && maxAttempts > 1 ? maxAttempts : 3) : 1;
  const isMaxAttemptsExceeded = attemptCount >= effectiveMaxAttempts;
  const activeAttempt = attemptsData.find((a: any) => a.status === "IN_PROGRESS");
  const isLoading = isLoadingQuiz || isLoadingAttempts;

  const latestCompletedAttempt = React.useMemo(() => {
    const completed = attemptsData.filter((a: any) => a.status === "COMPLETED");
    if (completed.length === 0) return null;
    return completed.sort((a: any, b: any) => new Date(b.submittedAt || b.startedAt || 0).getTime() - new Date(a.submittedAt || a.startedAt || 0).getTime())[0];
  }, [attemptsData]);

  const isRetake = searchParams.get("retake") === "true";

  useEffect(() => {
    if (!isLoading && latestCompletedAttempt && !isRetake) {
      const queryStr = `?careerPathId=${careerPathId}&courseId=${courseId}${lessonId ? `&lessonId=${lessonId}` : ''}&attemptId=${latestCompletedAttempt.id}`;
      navigate(`/quiz-result${queryStr}`, {
        state: { attemptId: latestCompletedAttempt.id },
        replace: true
      });
    }
  }, [isLoading, latestCompletedAttempt, isRetake, navigate, careerPathId, courseId, lessonId]);

  const handleStartQuiz = () => {
    if (!isChecked && !activeAttempt) return;
    navigate(`/quiz?careerPathId=${careerPathId}&courseId=${courseId}&lessonId=${lessonId}&retake=${isRetake ? 'true' : 'false'}`);
  };

  const handleBackToCourse = () => {
    if (courseId || careerPathId) {
      navigate(`/course-player?careerPathId=${careerPathId}&courseId=${courseId}${lessonId ? `&lessonId=${lessonId}` : ''}`);
    } else {
      navigate("/member-learning");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-4 animate-pulse">
          <Skeleton className="h-8 w-48 mx-auto rounded-xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const attemptsRemaining = Math.max(0, effectiveMaxAttempts - attemptCount);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12 font-sans text-slate-900">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        
        {/* ── Top Step Ribbon ── */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 mb-3 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>Step 8: Post-Training Assessment</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {activeAttempt ? "Resume Post-Training Assessment" : "Knowledge & Compliance Assessment"}
          </h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-md mx-auto">
            {activeQuiz?.title || "Complete this evaluation to record your official training completion and generate your certificate."}
          </p>
        </div>

        {/* ── Content Body ── */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* 3 Metric Pills */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-black text-indigo-600">{passMark}%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Passing Score</div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-black text-slate-800">{totalQuestions}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Questions</div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-black text-emerald-600">{timeLimit ? `${timeLimit}m` : "Untimed"}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Time Limit</div>
            </div>
          </div>

          {/* Attempt Limit Warning */}
          <div className="flex items-center justify-between p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Attempt Policy: </span>
                <span>You have <strong>{attemptsRemaining}</strong> attempt(s) remaining out of {effectiveMaxAttempts}.</span>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Assessment Guidelines
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Questions cover SOPs, procedural guidance, and compliance protocols studied in this training.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Your score and pass/fail result will be calculated immediately upon submission.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Passing the assessment will unlock digital certificate generation and post-training feedback.</span>
              </li>
            </ul>
          </div>

          {/* Confirmation Checkbox */}
          {!activeAttempt && !isMaxAttemptsExceeded && (
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800">
                I am ready to take the assessment and understand the passing criteria.
              </span>
            </label>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleBackToCourse}
              className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Back to Training
            </button>
            <button
              onClick={handleStartQuiz}
              disabled={(!isChecked && !activeAttempt) || isMaxAttemptsExceeded}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>{activeAttempt ? "Resume Assessment" : "Begin Assessment"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizStartWarning;
