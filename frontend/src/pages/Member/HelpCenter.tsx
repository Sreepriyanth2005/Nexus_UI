import React, { useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  ClipboardList,
  Award,
  AlertTriangle,
  User,
  HelpCircle,
  ChevronDown,
  MessageSquare,
  Globe,
  X,
  Check,
  Zap,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  FileText,
  Mail,
  ShieldCheck,
  GraduationCap,
  PlayCircle,
  LifeBuoy,
  Sparkles,
  ArrowUpRight,
  Building2,
  CreditCard,
  Smartphone,
  Compass,
  BookOpenCheck,
  UserCheck,
  SlidersHorizontal,
  Laptop,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useHelpCenterStore } from "../../store/helpCenter.store";

interface FAQItem {
  id: number;
  question: string;
  category: "Account & Security" | "Certificates & Proofs" | "Course Player & Video" | "Corporate & Billing";
  answer: string;
  steps?: string[];
  tip?: string;
  isSecurity?: boolean;
  readTime: string;
}

const HelpCenter: React.FC = () => {
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm } = useHelpCenterStore();

  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("All");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<number, "yes" | "no">>({});
  const [selectedAiPrompt, setSelectedAiPrompt] = useState<string | null>(null);

  const quickSearches = [
    "OTP verification",
    "Certificate download",
    "Change proof name",
    "Video playback error",
    "Quiz retakes",
    "Tax invoices",
    "Team seat allocation",
  ];

  const quickActions = [
    {
      title: "Verify Credentials",
      subtitle: "Download high-res PDF certificate or verify authenticity serial code.",
      badge: "Instant",
      icon: <GraduationCap className="w-5 h-5 text-amber-600" />,
      bg: "bg-amber-500/10 border-amber-500/20 text-amber-700",
      actionText: "Check Certificate",
      action: () => navigate("/certificate"),
    },
    {
      title: "OTP & Sign-in Help",
      subtitle: "Troubleshoot delayed SMS codes, locked accounts, and session timeouts.",
      badge: "Security",
      icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-500/10 border-blue-500/20 text-blue-700",
      actionText: "Fix OTP Issues",
      action: () => {
        setSearchTerm("OTP");
        setSelectedCategoryTab("Account & Security");
        document.getElementById("faqs-container")?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      title: "Player & Playback",
      subtitle: "Solve buffering, customize speed, and sync lesson completion status.",
      badge: "Guide",
      icon: <PlayCircle className="w-5 h-5 text-purple-600" />,
      bg: "bg-purple-500/10 border-purple-500/20 text-purple-700",
      actionText: "Player Support",
      action: () => {
        setSearchTerm("video");
        setSelectedCategoryTab("Course Player & Video");
        document.getElementById("faqs-container")?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      title: "Submit Support Ticket",
      subtitle: "Need human assistance? Our technical support team replies within 2 hours.",
      badge: "Priority",
      icon: <LifeBuoy className="w-5 h-5 text-emerald-600" />,
      bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700",
      actionText: "Open Ticket",
      action: () => navigate("/issue-reporting"),
    },
  ];

  // 6 category cards for the grid (3-col)
  const categoryCards = [
    {
      id: "Course Player & Video",
      title: "Training Issues",
      description: "Video playback, lesson completion, buffering & progress sync.",
      icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
      iconBg: "bg-indigo-50",
      borderHover: "hover:border-indigo-300",
      tag: "indigo",
    },
    {
      id: "Corporate & Billing",
      title: "Assessment Help",
      description: "Quiz retakes, timer issues, scoring & proctored exams.",
      icon: <ClipboardList className="w-6 h-6 text-amber-600" />,
      iconBg: "bg-amber-50",
      borderHover: "hover:border-amber-300",
      tag: "amber",
    },
    {
      id: "Certificates & Proofs",
      title: "Certificate Issues",
      description: "PDF download, LinkedIn sharing, name correction & proof IDs.",
      icon: <Award className="w-6 h-6 text-emerald-600" />,
      iconBg: "bg-emerald-50",
      borderHover: "hover:border-emerald-300",
      tag: "emerald",
    },
    {
      id: "Corporate & Billing",
      title: "Assignment Issues",
      description: "Overdue trainings, assignment tracking & mandatory completions.",
      icon: <AlertTriangle className="w-6 h-6 text-rose-600" />,
      iconBg: "bg-rose-50",
      borderHover: "hover:border-rose-300",
      tag: "rose",
    },
    {
      id: "Account & Security",
      title: "Account & Profile",
      description: "OTP recovery, session management, profile completion & KYC.",
      icon: <User className="w-6 h-6 text-slate-600" />,
      iconBg: "bg-slate-100",
      borderHover: "hover:border-slate-400",
      tag: "slate",
    },
    {
      id: "All",
      title: "General Support",
      description: "Browse all FAQs, contact support & submit a help ticket.",
      icon: <HelpCircle className="w-6 h-6 text-sky-600" />,
      iconBg: "bg-sky-50",
      borderHover: "hover:border-sky-300",
      tag: "sky",
    },
  ];

  const knowledgeCategories = [
    {
      id: "Account & Security",
      title: "Account & Security",
      description: "Two-factor auth, OTP delivery, login sessions & credential security.",
      articlesCount: 14,
      icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
      iconBg: "bg-blue-50 border border-blue-100",
      accentBorder: "hover:border-blue-300",
      tags: ["OTP Resend", "Password Reset", "Active Sessions"],
    },
    {
      id: "Certificates & Proofs",
      title: "Certificates & Proofs",
      description: "Digital badges, verification serials, legal proof names & PDF downloads.",
      articlesCount: 18,
      icon: <GraduationCap className="w-6 h-6 text-amber-600" />,
      iconBg: "bg-amber-50 border border-amber-100",
      accentBorder: "hover:border-amber-300",
      tags: ["Name Edit", "Pass Marks", "LinkedIn Share"],
    },
    {
      id: "Courses & Enrolment",
      title: "Courses & Enrolment",
      description: "Course discovery, prerequisites, access duration & subscriptions.",
      articlesCount: 12,
      icon: <BookOpenCheck className="w-6 h-6 text-emerald-600" />,
      iconBg: "bg-emerald-50 border border-emerald-100",
      accentBorder: "hover:border-emerald-300",
      tags: ["Self-Paced", "Syllabus", "Curriculum"],
    },
    {
      id: "Course Player & Video",
      title: "Video Player & Progress",
      description: "Adaptive HD streaming, playback speeds, lecture notes & transcripts.",
      articlesCount: 9,
      icon: <PlayCircle className="w-6 h-6 text-indigo-600" />,
      iconBg: "bg-indigo-50 border border-indigo-100",
      accentBorder: "hover:border-indigo-300",
      tags: ["Buffering", "Captions", "Audio Speed"],
    },
    {
      id: "Corporate & Team Plans",
      title: "Corporate & Teams",
      description: "Bulk invitations, team progress tracking, LMS integrations & analytics.",
      articlesCount: 11,
      icon: <Building2 className="w-6 h-6 text-teal-600" />,
      iconBg: "bg-teal-50 border border-teal-100",
      accentBorder: "hover:border-teal-300",
      tags: ["Seat Management", "CSV Bulk Add", "Reports"],
    },
    {
      id: "Profile & Identity",
      title: "Profile & Identity",
      description: "Profile 100% completion rule, avatar upload & legal entity verification.",
      articlesCount: 8,
      icon: <UserCheck className="w-6 h-6 text-rose-600" />,
      iconBg: "bg-rose-50 border border-rose-100",
      accentBorder: "hover:border-rose-300",
      tags: ["Mandatory Fields", "Contact Info", "KYC"],
    },
    {
      id: "Billing & Invoices",
      title: "Billing & Invoices",
      description: "GST/VAT receipts, enterprise purchase orders & payment methods.",
      articlesCount: 7,
      icon: <CreditCard className="w-6 h-6 text-violet-600" />,
      iconBg: "bg-violet-50 border border-violet-100",
      accentBorder: "hover:border-violet-300",
      tags: ["Tax Invoice", "Card Update", "Refund Policy"],
    },
    {
      id: "Mobile & Devices",
      title: "Mobile & Devices",
      description: "Cross-device sync, tablet optimizations & offline caching tips.",
      articlesCount: 6,
      icon: <Smartphone className="w-6 h-6 text-cyan-600" />,
      iconBg: "bg-cyan-50 border border-cyan-100",
      accentBorder: "hover:border-cyan-300",
      tags: ["iOS/Android", "Offline Sync", "Multi-login"],
    },
  ];

  const allFaqs: FAQItem[] = [
    {
      id: 1,
      question: "I did not receive my OTP verification code. How do I proceed?",
      category: "Account & Security",
      isSecurity: true,
      readTime: "2 min read",
      answer:
        "OTP codes are dispatched via high-priority telecom routes, but occasional carrier filtering or network latency can occur. Follow these troubleshooting steps:",
      steps: [
        "Wait 60 seconds before triggering a resend to allow gateway delivery.",
        "Check your email spam / promotional folders if verifying by email address.",
        "Ensure your mobile device has active cellular reception and Do Not Disturb (DND) is not blocking automated transactional SMS.",
        "If you are using a corporate email address, verify that strict firewall filters are not quarantining automated transactional authentication emails.",
      ],
      tip: "If you still do not receive your OTP after 3 attempts, submit an urgent ticket or contact our support team to verify your registered contact details.",
    },
    {
      id: 2,
      question: "How do I access my assigned trainings?",
      category: "Course Player & Video",
      readTime: "2 min read",
      answer:
        "Assigned trainings appear in your personalised dashboard under 'My Learning'. Here's how to access them:",
      steps: [
        "Log in and navigate to the Dashboard or My Learning section.",
        "Look for the 'Assigned Trainings' or 'Mandatory' tab to see all courses assigned to you.",
        "Click on any training card to open the course player and start learning.",
        "Your progress is auto-saved so you can resume from where you left off.",
      ],
      tip: "If a training doesn't appear, contact your L&D administrator — they may need to re-assign the course to your profile.",
    },
    {
      id: 3,
      question: "What happens if I fail an assessment?",
      category: "Course Player & Video",
      readTime: "2 min read",
      answer:
        "Assessment policies depend on the specific course design configured by the content developer and course instructor:",
      steps: [
        "Standard Courses: Most self-paced courses offer 2 to 3 retake attempts after a mandatory 24-hour review cooldown period.",
        "Proctored / Capstone Quizzes: Capstone certification assessments may require instructor review or administrator reset.",
        "Check the course syllabus or lesson overview tab for the exact retake threshold and cooling-off timers.",
      ],
      tip: "Always ensure a stable broadband connection before beginning timed quizzes to avoid accidental session disconnects.",
    },
    {
      id: 4,
      question: "How do I download my certificate?",
      category: "Certificates & Proofs",
      readTime: "3 min read",
      answer:
        "Course Completed credentials are generated automatically once all pedagogical and platform criteria are fulfilled:",
      steps: [
        "Verify 100% Course Progress: Ensure every video lesson is watched completely and marked with a green checkmark.",
        "Pass All Graded Quizzes: Confirm that all mandatory module quizzes meet or exceed the required minimum pass score (usually 80%).",
        "Complete 100% Profile Information: To ensure legally recognized certificate issuance, your profile must be 100% complete.",
        "Visit My Learning > Certificates, then click 'Download PDF' on the completed course certificate.",
      ],
      tip: "Once your profile hits 100%, the certificate generator is instantly unlocked in the 'My Learning' and 'Certificates' tab.",
    },
    {
      id: 5,
      question: "Can I retake an assessment?",
      category: "Corporate & Billing",
      readTime: "2 min read",
      answer:
        "Yes, most assessments allow retakes subject to the course configuration. Here's what you need to know:",
      steps: [
        "Check the course syllabus for the number of allowed retake attempts (usually 2–3).",
        "A mandatory cooldown period (typically 24 hours) applies between retakes to encourage review.",
        "Go to the assessment page and click 'Retake' once your cooldown period has elapsed.",
        "For proctored exams, contact your administrator or submit a ticket to request a manual reset.",
      ],
      tip: "Review your incorrect answers in the results page before retaking to maximize your score.",
    },
    {
      id: 6,
      question: "Why is my training marked as overdue?",
      category: "Corporate & Billing",
      readTime: "2 min read",
      answer:
        "Trainings are marked overdue when a completion deadline set by your L&D administrator has passed. Here's how to resolve it:",
      steps: [
        "Navigate to My Learning and look for the red 'Overdue' badge on the training card.",
        "Complete the training as soon as possible — progress is still recorded even after the deadline.",
        "Contact your L&D administrator if you need an extension or if the deadline was set incorrectly.",
        "Once completed, the overdue badge will be replaced with a green completion status.",
      ],
      tip: "Enable browser notifications so you receive reminders before upcoming training deadlines.",
    },
    {
      id: 7,
      question: "How do I change my preferred language?",
      category: "Account & Security",
      readTime: "1 min read",
      answer: "You can update your language preference from your profile settings at any time:",
      steps: [
        "Click your profile avatar in the top-right corner and select 'Settings'.",
        "Navigate to the 'Language & Region' section.",
        "Select your preferred language from the dropdown list.",
        "Click 'Save Changes' — the platform will reload in your chosen language.",
      ],
      tip: "Not all course content may be available in every language. Content availability depends on the course creator.",
    },
    {
      id: 8,
      question: "How do I track my learning progress?",
      category: "Course Player & Video",
      readTime: "2 min read",
      answer:
        "Our platform provides detailed learning analytics so you can track every aspect of your progress:",
      steps: [
        "Go to Dashboard or My Learning to see an overview of all enrolled and assigned courses.",
        "Click on any course to view the detailed progress breakdown by module and lesson.",
        "Use the 'Learning Reports' section (if enabled) to export your progress data as a PDF or CSV.",
        "Your completion percentage, time spent, and quiz scores are all tracked automatically.",
      ],
      tip: "Corporate users can ask their administrator to share team-level progress dashboards for a broader learning view.",
    },
    {
      id: 9,
      question: "Why can't I download my Course Completed proof or Certificate?",
      category: "Certificates & Proofs",
      readTime: "3 min read",
      answer:
        "Course Completed credentials are generated automatically once all pedagogical and platform criteria are fulfilled:",
      steps: [
        "Verify 100% Course Progress: Ensure every video lesson is watched completely and marked with a green checkmark.",
        "Pass All Graded Quizzes: Confirm that all mandatory module quizzes meet or exceed the required minimum pass score (usually 80%).",
        "Complete 100% Profile Information: To ensure legally recognized certificate issuance, your profile must be 100% complete, including your full legal name, phone number, and location.",
        "Visit Profile Settings > Edit Profile to fill in any empty optional or required details.",
      ],
      tip: "Once your profile hits 100%, the certificate generator is instantly unlocked in the 'My Learning' and 'Certificates' tab.",
    },
  ];

  const aiSamplePrompts = [
    {
      prompt: "How do I verify the authenticity of a certificate?",
      answer:
        "Every Nexus certificate features a unique cryptographic Serial Number (e.g., NX-8849-CERT). Anyone can verify its authenticity by visiting nexusacademy.com/verify and entering the serial number, or by scanning the embedded QR code.",
    },
    {
      prompt: "Can I take quizzes on my mobile phone?",
      answer:
        "Yes, all quizzes are fully responsive and work on mobile browsers. However, for timed assessments containing code editors or complex diagrams, we recommend using a desktop browser with a reliable broadband connection.",
    },
    {
      prompt: "What happens if my corporate license subscription expires?",
      answer:
        "When your team license concludes, your earned certificates and course completion records remain permanently preserved in your personal transcript. Access to ongoing interactive video player sessions is paused until license renewal.",
    },
  ];

  const filteredFaqs = useMemo(() => {
    return allFaqs.filter((faq) => {
      const matchesSearch =
        !searchTerm.trim() ||
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategoryTab === "All" ||
        (selectedCategoryTab === "Account & Security" && faq.category === "Account & Security") ||
        (selectedCategoryTab === "Certificates & Proofs" && faq.category === "Certificates & Proofs") ||
        (selectedCategoryTab === "Course Player & Video" && faq.category === "Course Player & Video") ||
        (selectedCategoryTab === "Corporate & Billing" && faq.category === "Corporate & Billing");

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategoryTab]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleHelpfulVote = (id: number, vote: "yes" | "no") => {
    setHelpfulFeedback((prev) => ({ ...prev, [id]: vote }));
    toast.success("Thank you for your feedback! It helps us improve our guides.");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">

      {/* =========================================================================
          HERO SECTION — indigo gradient
          ========================================================================= */}
      <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-800 text-white pt-14 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-white/5 blur-[100px] rounded-full" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            How can we help you?
          </h1>
          <p className="text-indigo-200 text-base mb-8">
            Browse our training help articles and FAQs
          </p>

          {/* Search bar — white pill */}
          <div className="relative max-w-2xl mx-auto">
            <div className={`relative flex items-center bg-white rounded-full shadow-xl transition-all duration-300 ${isSearchFocused ? "ring-4 ring-white/30" : ""}`}>
              <div className="pl-5 text-slate-400 flex items-center">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search solutions: OTP, certificate, quiz retakes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    document.getElementById("faqs-container")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="w-full py-4 px-4 text-sm sm:text-base bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="mr-2 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => document.getElementById("faqs-container")?.scrollIntoView({ behavior: "smooth" })}
                className="mr-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow transition-colors cursor-pointer shrink-0"
              >
                Search
              </button>
            </div>

            {/* Popular quick searches */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-indigo-200 font-medium flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Popular:
              </span>
              {quickSearches.map((query, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchTerm(query);
                    document.getElementById("faqs-container")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN CONTAINER
          ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* =====================================================================
            CATEGORY GRID — 6 cards, 3-col
            ===================================================================== */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Browse by Topic</h2>
              <p className="text-sm text-slate-500">Jump to the category that matches your question</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryCards.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedCategoryTab(cat.id);
                  document.getElementById("faqs-container")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-5 flex items-start gap-4 ${cat.borderHover}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cat.iconBg} group-hover:scale-105 transition-transform duration-200`}>
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-indigo-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{cat.description}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 -rotate-90 group-hover:text-indigo-500 transition-colors mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* =====================================================================
            QUICK ACTION SHORTCUTS
            ===================================================================== */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quick Action Shortcuts</h2>
              <p className="text-sm text-slate-500">Instant direct access for high-frequency learner workflows</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              Self-Service
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <div
                key={idx}
                onClick={action.action}
                className="group relative bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      {action.icon}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${action.bg}`}>
                      {action.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5 group-hover:text-indigo-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{action.subtitle}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                  <span>{action.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =====================================================================
            BROWSE BY KNOWLEDGE CATEGORY (8-col grid)
            ===================================================================== */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Browse by Knowledge Category</h2>
              <p className="text-sm text-slate-500">Explore structured troubleshooting guides by feature category</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              8 Core Modules • 85+ Platform Guides
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {knowledgeCategories.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedCategoryTab(cat.id);
                  document.getElementById("faqs-container")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between ${cat.accentBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200 ${cat.iconBg}`}>
                      {cat.icon}
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {cat.articlesCount} guides
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5 group-hover:text-indigo-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{cat.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {cat.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <span>View topics</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =====================================================================
            FAQ ACCORDION SECTION
            ===================================================================== */}
        <div id="faqs-container" className="pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {searchTerm ? `Search Results for "${searchTerm}"` : "Frequently Asked Questions"}
              </h2>
              <p className="text-sm text-slate-500">
                Detailed answers, step-by-step resolution guides, and system policies
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                Showing {filteredFaqs.length} of {allFaqs.length} articles
              </span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Category filter tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-4 mb-4 border-b border-slate-200">
            {["All", "Account & Security", "Certificates & Proofs", "Course Player & Video", "Corporate & Billing"].map((tab) => {
              const isActive = selectedCategoryTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedCategoryTab(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm border border-indigo-600"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Accordion list */}
          <div className="space-y-3">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                const userVote = helpfulFeedback[faq.id];

                return (
                  <div
                    key={faq.id}
                    className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? "border-indigo-300 shadow-md ring-1 ring-indigo-100"
                        : "border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 pr-4 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isOpen ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                              {faq.category}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {faq.readTime}
                            </span>
                            {faq.isSecurity && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <Lock className="w-2.5 h-2.5" />
                                Security
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-base leading-snug">
                            {faq.question}
                          </h4>
                        </div>
                      </div>
                      <div className="shrink-0 pl-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? "rotate-180 bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"}`}>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-6 pt-1 text-slate-700 text-sm border-t border-slate-100">
                        <p className="leading-relaxed mb-4 text-slate-600 font-normal">{faq.answer}</p>

                        {faq.steps && faq.steps.length > 0 && (
                          <div className="mb-4 bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Resolution Steps:
                            </h5>
                            <ol className="space-y-2">
                              {faq.steps.map((step, sIdx) => (
                                <li key={sIdx} className="flex items-start gap-2.5 text-xs text-slate-700">
                                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white border border-slate-300 text-slate-800 font-bold shrink-0 text-[10px]">
                                    {sIdx + 1}
                                  </span>
                                  <span className="pt-0.5 leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {faq.tip && (
                          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed mb-4">
                            <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold">Platform Tip: </strong>
                              {faq.tip}
                            </div>
                          </div>
                        )}

                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                          <span className="font-medium">Was this guide helpful?</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleHelpfulVote(faq.id, "yes")}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                                userVote === "yes"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Yes</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleHelpfulVote(faq.id, "no")}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                                userVote === "no"
                                  ? "bg-rose-50 text-rose-700 border-rose-300"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                              <span>No</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-8">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-base mb-1">
                  No matching articles found for "{searchTerm}"
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Try searching with different terms like "OTP", "certificate", or "quiz", or reach out to our support engineers.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(""); setSelectedCategoryTab("All"); }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Clear Search Query
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/issue-reporting")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Submit Support Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================================
            STILL NEED HELP — Contact Card
            ===================================================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 inline-block mb-3">
              Dedicated Support Channels
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
              Still need help?
            </h3>
            <p className="text-sm text-slate-500">
              Our engineering, academic, and customer success teams are always here to resolve technical issues or enrollment queries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col justify-between p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all duration-200">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1">Open a Priority Ticket</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Provide diagnostic logs and screenshots for course player glitches, profile verification, or assessment issues.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-4">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Average response time: &lt; 2 hours</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/issue-reporting")}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Submit Ticket</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col justify-between p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-200 hover:bg-white hover:shadow-md transition-all duration-200">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1">Direct Specialist Help Desk</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Live support hours for enterprise clients, team onboarding, and corporate training administrator setup.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-4">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Mon – Sat: 9:00 AM – 8:00 PM IST</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast.info("Connecting to live support desk queue...")}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Start Live Conversation</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col justify-between p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all duration-200">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1">Email Support Desk</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Direct dispatch for contract agreements, invoices, data protection inquiries, and credential audits.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-4">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>support@nexusacademy.com</span>
                </div>
              </div>
              <a
                href="mailto:support@nexusacademy.com?subject=Nexus%20Help%20Center%20Inquiry"
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-center shadow-sm"
              >
                <span>Send Official Email</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Search tip: Use direct keywords like <strong>"OTP"</strong>, <strong>"Certificate"</strong>, or <strong>"Invoice"</strong> for immediate answers.
              </span>
            </div>
            <span className="hover:text-slate-600 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              Back to top ↑
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HelpCenter;
