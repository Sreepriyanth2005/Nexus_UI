import React from "react";
import CourseVersionHistoryHeader from "../../components/course-version-history/CourseVersionHistoryHeader";
import CourseVersionHistoryTable from "../../components/course-version-history/CourseVersionHistoryTable";
import VersionControlInfo from "../../components/course-version-history/VersionControlInfo";
import { VersionItem } from "../../components/course-version-history/VersionHistoryRow";

const AdminCourseVersionHistory: React.FC = () => {
  const versionData: VersionItem[] = [
    {
      version: "v3.0 - Current",
      published: "2026-04-12",
      changes: "Updated lesson 3 + new quiz question",
      author: "N. Al-Rashid",
      status: "Live",
    },
    {
      version: "v2.1",
      published: "2026-02-08",
      changes: "Fixed typos, added ISO reference",
      author: "N. Al-Rashid",
      status: "Archived",
    },
    {
      version: "v2.0",
      published: "2025-11-20",
      changes: "Major restructure: 4 lessons became 6",
      author: "A. Khalfan",
      status: "Archived",
    },
    {
      version: "v1.0",
      published: "2025-09-01",
      changes: "Initial publish",
      author: "A. Khalfan",
      status: "Archived",
    },
  ];

  const handlePreview = (item: VersionItem) => {
    alert(`Previewing version ${item.version} (UI Mock)`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <CourseVersionHistoryHeader />

        {/* Table Section */}
        <CourseVersionHistoryTable
          versions={versionData}
          onPreview={handlePreview}
        />

        {/* Info Banner Section */}
        <VersionControlInfo />
      </div>
    </div>
  );
};

export default AdminCourseVersionHistory;
