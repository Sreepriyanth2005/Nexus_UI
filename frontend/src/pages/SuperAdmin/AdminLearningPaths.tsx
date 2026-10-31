import React from "react";
import { useNavigate } from "react-router";
import { Plus, Search, Download, ArrowRight, ChevronLeft, Info } from "../../assets/icons";
import { RotateCcw, Book, Users, ChevronRight, LayoutGrid, SquarePen } from "lucide-react";
import {
  useAdminLearningPaths,
  useLearningPathStatistics,
  useAdminLearningPathMutations,
} from "../../hooks/admin-learning-paths/useAdminLearningPaths";
import { useAdminLearningPathsStore } from "../../store/admin-learning-paths/adminLearningPaths.store";
import { Input } from "../../components/ui/Input/Input";
import { Select } from "../../components/ui/Select/Select";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

const SkeletonCard = () => (
  <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-lg)] p-6 space-y-4 mb-4 shadow-[var(--shadow-sm)]">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1 w-full">
        <Skeleton className="h-5 w-1/3 rounded" />
        <Skeleton className="h-4 w-1/4 rounded" />
      </div>
      <Skeleton className="h-8 w-24 rounded-[var(--r-pill)]" />
    </div>
    <div className="h-[1px] bg-[var(--line)] w-full my-4" />
    <div className="flex items-center gap-3 overflow-x-auto pt-2">
      <Skeleton className="h-8 w-28 rounded-[var(--r-xs)] shrink-0" />
      <Skeleton className="h-2 w-4 rounded shrink-0" />
      <Skeleton className="h-8 w-28 rounded-[var(--r-xs)] shrink-0" />
    </div>
  </div>
);

const EmptyState: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-lg)] p-12 text-center space-y-4 shadow-[var(--shadow-sm)]">
    <div className="mx-auto w-12 h-12 bg-[var(--paper-2)] rounded-full flex items-center justify-center text-[var(--ink-faint)]">
      <Search width={24} height={24} strokeWidth={1.7} />
    </div>
    <h3 className="text-[length:var(--fs-meta)] font-[var(--fw-bold)] text-[var(--ink)]">No learning paths found</h3>
    <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] font-[var(--fw-regular)] max-w-xs mx-auto">
      No career tracks match your search queries or active filters. Try clearing your filters.
    </p>
    <button
      onClick={onClear}
      className="inline-flex items-center gap-2 border border-[var(--line-strong)] text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-bold)] px-5 py-2.5 rounded-[var(--r-pill)] hover:bg-[var(--paper-2)] transition-colors cursor-pointer"
    >
      <RotateCcw size={14} strokeWidth={1.7} />
      Clear Filters
    </button>
  </div>
);

const AdminLearningPaths: React.FC = () => {
  const navigate = useNavigate();
  const {
    search,
    selectedStatus,
    selectedVisibility,
    sort,
    page,
    setSearch,
    setStatus,
    setVisibility,
    setSort,
    setPage,
    clearFilters,
  } = useAdminLearningPathsStore();

  const { data: stats, isLoading: statsLoading } = useLearningPathStatistics();
  const { data: pathsData, isLoading: pathsLoading, refetch } = useAdminLearningPaths();
  const { publishMutation, unpublishMutation, deleteMutation } = useAdminLearningPathMutations();

  const listItems = pathsData?.data || [];

  const filteredItems = listItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === "all" || item.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesVisibility = selectedVisibility === "all" || item.visibility.toLowerCase() === selectedVisibility.toLowerCase();
    return matchesSearch && matchesStatus && matchesVisibility;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sort === "A-Z") {
      return a.title.localeCompare(b.title);
    }
    return b.id.localeCompare(a.id);
  });

  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
  const paginatedItems = sortedItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleAction = async (id: string, action: "publish" | "unpublish" | "delete") => {
    const confirmMsg =
      action === "publish"
        ? "Publish this learning path?"
        : action === "unpublish"
          ? "Archive/Unpublish this learning path?"
          : "Delete this learning path permanently?";

    if (!window.confirm(confirmMsg)) return;

    if (action === "publish") {
      await publishMutation.mutateAsync({ id, publishedById: "admin" });
    } else if (action === "unpublish") {
      await unpublishMutation.mutateAsync(id);
    } else if (action === "delete") {
      await deleteMutation.mutateAsync(id);
    }
    refetch();
  };

  const handleExportCSV = () => {
    if (!filteredItems || filteredItems.length === 0) return;

    const headers = [
      "Title",
      "Subtitle",
      "Difficulty",
      "Courses Count",
      "Learners Enrolled",
      "Completion Rate (%)",
      "Status",
      "Visibility"
    ];

    const rows = filteredItems.map((item) => {
      const difficultyStr = typeof item.difficulty === 'string' ? item.difficulty : (item.difficulty ? [item.difficulty].join(', ') : '');
      return [
        `"${item.title?.replace(/"/g, '""') || ''}"`,
        `"${item.subtitle?.replace(/"/g, '""') || ''}"`,
        `"${difficultyStr.replace(/"/g, '""')}"`,
        item.coursesCount || 0,
        item.learnersEnrolled || 0,
        item.completionRate || 0,
        item.status || '',
        item.visibility || ''
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `learning-paths-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (pathsLoading || statsLoading) {
    return (
      <div className="p-6 space-y-6 w-full">
        <div className="space-y-2 mb-8">
          <Skeleton className="h-8 w-1/4 rounded-[var(--r-sm)]" />
          <Skeleton className="h-4 w-1/3 rounded-[var(--r-sm)]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-[var(--space-8)] sm:gap-0">
        <div>
          <div className="text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] uppercase tracking-[var(--ls-label)] mb-1">
            COURSES
          </div>
          <h1 className="text-[length:var(--fs-h1)] font-[var(--fw-extrabold)] text-[var(--ink)] tracking-tight mb-1">
            Learning paths
          </h1>
          <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] font-[var(--fw-regular)]">
            Curated multi-course tracks that lead to a learning credential.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap w-full sm:w-auto gap-[var(--space-4)]">
          <button
            onClick={handleExportCSV}
            aria-label="Export data"
            className="flex-1 sm:flex-none justify-center h-[40px] px-[14px] py-[8px] bg-[var(--btn)] border border-[var(--c-honey)] text-[var(--ink)] rounded-[var(--r-pill)] text-[length:var(--fs-meta)] font-[var(--fw-semibold)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all duration-[var(--dur-fast)] flex items-center gap-[var(--space-2)] shadow-sm active:scale-95 cursor-pointer"
          >
            <Download width={14} height={14} className="stroke-[2]" />
            Export data
          </button>
          <button
            onClick={() => navigate("/create-course")}
            aria-label="Create new learning path"
            className="flex-1 sm:flex-none justify-center h-[40px] px-[14px] py-[8px] bg-[var(--btn)] border border-[var(--c-honey)] text-[var(--ink)] rounded-[var(--r-pill)] text-[length:var(--fs-meta)] font-[var(--fw-semibold)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all duration-[var(--dur-fast)] flex items-center gap-[var(--space-2)] shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus width={14} height={14} className="stroke-[2.5]" />
            New learning path
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-[var(--space-8)] grid grid-cols-2 lg:grid-cols-4 gap-[var(--space-4)]">
        {[
          { label: "Active paths", value: stats?.activePaths ?? 0, icon: Book, color: "text-[var(--c-honey-text)]", bg: "bg-[var(--c-honey-wash)]" },
          { label: "Courses mapped", value: stats?.coursesMapped ?? 0, icon: LayoutGrid, color: "text-[var(--c-sage-text)]", bg: "bg-[var(--c-sage-wash)]" },
          { label: "Learners enrolled", value: stats?.learnersEnrolled?.toLocaleString() ?? 0, icon: Users, color: "text-[var(--c-clay-text)]", bg: "bg-[var(--c-clay-wash)]" },
          { label: "Draft", value: stats?.draft ?? 0, icon: SquarePen, color: "text-[var(--ink-mute)]", bg: "bg-[var(--paper-2)]" },
        ].map((card, idx) => (
          <div key={idx} className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-lg)] py-[18px] px-[20px] flex items-center gap-4 w-full shadow-[var(--shadow-sm)] hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-1 transition-all duration-[var(--dur-base)] ease-[var(--tn)] cursor-pointer">
                <div
                  className={`w-[38px] h-[38px] flex items-center justify-center rounded-[var(--r-xs)] shrink-0 ${card.bg} ${card.color}`}
                >
                  <card.icon size={18} strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] text-[var(--ink)] leading-none mb-1 truncate">
                    {card.value}
                  </div>
                  <div className="text-[length:var(--fs-meta)] font-[var(--fw-regular)] text-[var(--ink-mute)] leading-tight truncate">
                    {card.label}
                  </div>
                </div>
          </div>
        ))}
      </div>

      {/* Toolbar Search / Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-5">
        <div className="relative w-full sm:w-[420px]">
          <Search width={16} height={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
          <Input
            type="text"
            placeholder="Search learning paths..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 font-sans font-[var(--fw-medium)] transition-all duration-[150ms] ease-nexus placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-1 focus-visible:border-ink disabled:bg-paper-2 disabled:opacity-60 disabled:cursor-not-allowed w-full h-[36px] border border-[var(--line)] rounded-[var(--r-pill)] bg-[var(--paper)] pl-[36px] pr-[12px] focus:outline-none focus:border-[var(--ink)] text-[length:var(--fs-meta)] text-[var(--ink)] placeholder-[var(--ink-faint)]"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select
            className="appearance-none h-[40px] pl-[14px] pr-[36px] py-0 border border-[var(--line-strong)] hover:border-[var(--ink)] focus:border-[var(--c-honey)] cursor-pointer transition-colors duration-150 bg-[var(--paper)] w-auto rounded-[var(--r-md)] focus:outline-none focus:ring-1 focus:ring-[var(--c-honey)] font-[var(--fw-medium)] text-[var(--ink-soft)]"
            iconClassName="text-[var(--c-clay-text)]"
            value={selectedStatus}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Status: All</option>
            <option value="published">Status: Active</option>
            <option value="draft">Status: Draft</option>
          </Select>
        </div>
      </div>

      {/* List content */}
      <div className="space-y-[var(--space-4)]">
        {paginatedItems.length === 0 ? (
          <EmptyState onClear={clearFilters} />
        ) : (
          paginatedItems.map((path) => {
            const isPublished = path.status.toLowerCase() === "published";
            const statusLabel = isPublished ? "Active" : "Draft";
            const levels = typeof path.difficulty === 'string' ? path.difficulty.split(',') : (path.difficulty ? [path.difficulty] : []);

            return (
              <div
                key={path.id}
                className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-lg)] py-[20px] px-[24px] mb-[var(--space-6)] shadow-[var(--shadow-sm)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] hover:border-[var(--line-strong)]"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-[length:var(--fs-h3)] font-[var(--fw-bold)] text-[var(--ink)] tracking-tight">{path.title}</h2>
                      {levels.map((lvl: string, i: number) => {
                        const raw = lvl.trim();
                        const formattedLvl = raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : 'Foundation';
                        return (
                          <span key={i} className="inline-block border border-[var(--c-honey-soft)] text-[var(--c-honey-text)] bg-transparent text-[length:var(--fs-label)] px-3 py-0.5 rounded-[var(--r-pill)] font-serif font-[var(--fw-bold)]">
                            {formattedLvl}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[length:var(--fs-meta)] text-[var(--ink-mute)] font-[var(--fw-regular)] font-serif mb-3.5">
                      <span>{path.coursesCount} {path.coursesCount === 1 ? "course" : "courses"}</span>
                      <span>{path.learnersEnrolled?.toLocaleString() || 0} learners</span>
                      {isPublished ? (
                        <div className="flex items-center gap-2">
                          <span className="font-[var(--fw-bold)] text-[var(--ink)]">{path.completionRate || 0}%</span>
                          <div className="w-[60px] h-[6px] bg-[var(--surface-3)] rounded-[var(--r-pill)] overflow-hidden">
                            <div className="h-full bg-[var(--c-honey)] rounded-[var(--r-pill)]" style={{ width: `${path.completionRate || 0}%` }}></div>
                          </div>
                          <span>completion</span>
                        </div>
                      ) : (
                        <span>Not published yet</span>
                      )}
                      <div className={`flex items-center gap-1.5 ml-1 font-serif text-[length:var(--fs-meta)] font-[var(--fw-bold)] whitespace-nowrap ${isPublished ? 'text-[var(--c-sage-text)]' : 'text-[var(--ink-soft)]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-[var(--c-sage)]' : 'bg-[var(--ink-mute)]'}`}></span>
                        <span>{statusLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={() => navigate(`/admin/career-paths/${path.id}/edit`)}
                      className="inline-flex items-center gap-1.5 border border-[var(--line-strong)] text-[var(--ink-mute)] text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif px-3.5 py-1.5 rounded-[var(--r-pill)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)] hover:border-[var(--ink-faint)] transition-all uppercase tracking-wider cursor-pointer"
                    >
                      EDIT PATH <ArrowRight width={12} height={12} className="stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Course Sequence Flow Display */}
                <div className="border-t border-[var(--line)] pt-4 flex flex-wrap items-center gap-3 overflow-x-auto font-serif">
                  {path.courses.length === 0 ? (
                    <span className="text-[length:var(--fs-meta)] text-[var(--ink-faint)]">No courses added yet.</span>
                  ) : (
                    <>
                      {path.courses.slice(0, 3).map((c, i) => (
                        <React.Fragment key={c.id}>
                          <div
                            onClick={() => navigate(`/admin/courses/${c.id}/edit`)}
                            className="border border-[var(--line)] rounded-[var(--r-md)] px-3.5 py-[5px] text-[length:var(--fs-label)] text-[var(--ink-soft)] bg-[var(--paper-2)] whitespace-nowrap font-[var(--fw-medium)] cursor-pointer hover:bg-[var(--surface-3)] hover:text-[var(--ink)] transition-colors"
                          >
                            {c.title}
                          </div>
                          {(i < Math.min(path.courses.length, 3) - 1 || path.courses.length > 3 || path.hasAssessment || path.hasCertificate) && (
                            <ArrowRight width={14} height={14} className="text-[var(--ink-faint)] shrink-0" strokeWidth={1.7} />
                          )}
                        </React.Fragment>
                      ))}
                      {path.courses.length > 3 && (
                        <>
                          <div className="border border-[var(--line-strong)] border-dashed rounded-[var(--r-md)] px-3.5 py-[5px] text-[length:var(--fs-label)] text-[var(--ink-mute)] bg-[var(--paper)] whitespace-nowrap font-[var(--fw-medium)]">
                            + {path.courses.length - 3} {isPublished ? 'more' : 'planned'}
                          </div>
                          {(path.hasAssessment || path.hasCertificate) && (
                            <ArrowRight width={14} height={14} className="text-[var(--ink-faint)] shrink-0" strokeWidth={1.7} />
                          )}
                        </>
                      )}
                    </>
                  )}
                  {path.hasAssessment && (
                    <>
                      <div
                        onClick={() => navigate(`/admin/career-paths/${path.id}/edit`)}
                        className="border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] rounded-[var(--r-md)] px-3.5 py-[5px] text-[length:var(--fs-label)] whitespace-nowrap font-[var(--fw-bold)] cursor-pointer transition-all hover:bg-[var(--ink-soft)] shadow-sm"
                      >
                        Assessment
                      </div>
                      {path.hasCertificate && (
                        <ArrowRight width={14} height={14} className="text-[var(--ink-faint)] shrink-0" strokeWidth={1.7} />
                      )}
                    </>
                  )}
                  {path.hasCertificate && (
                    <div
                      onClick={() => navigate(`/admin/certificate-settings`)}
                      className="border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] rounded-[var(--r-md)] px-3.5 py-[5px] text-[length:var(--fs-label)] whitespace-nowrap font-[var(--fw-bold)] cursor-pointer transition-all hover:bg-[var(--paper-2)]"
                    >
                      Learning credential
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Strip */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center p-4 border-t border-[var(--line)]">
          <span className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] font-[var(--fw-regular)]">
            Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, sortedItems.length)} of {sortedItems.length}
          </span>
          <div className="flex items-center gap-[var(--space-6)]">
            <span className="text-[length:var(--fs-meta)] text-[var(--ink)] font-[var(--fw-medium)]">
              {page} &nbsp;&nbsp;&nbsp; of &nbsp;&nbsp;&nbsp; {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                className="w-[32px] h-[32px] rounded-full flex justify-center items-center text-[var(--ink-mute)] hover:bg-[var(--paper-2)] transition-colors duration-[var(--dur-base)] disabled:opacity-50 cursor-pointer"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft width={16} height={16} strokeWidth={1.5} />
              </button>
              <button
                className="w-[32px] h-[32px] rounded-full flex justify-center items-center text-[var(--ink-mute)] hover:bg-[var(--paper-2)] transition-colors duration-[var(--dur-base)] disabled:opacity-50 cursor-pointer"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default AdminLearningPaths;
