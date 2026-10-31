import React, { useState, useEffect } from 'react';
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import { AlignLeft } from "../../assets/icons";

import { DataManagementCard } from './components/DataManagementCard';

const DATA_SETS: { title: string; description: string; type: string; readOnly?: boolean }[] = [
  { title: 'Industry', description: 'Industry sectors', type: 'industry' },
  { title: 'Category', description: 'Catalog content categories', type: 'category' },
  { title: 'Subject', description: 'Subject-matter areas', type: 'subject' },
  { title: 'Difficulty level', description: 'Learner level on a card', type: 'difficulty-level', readOnly: true },
  { title: 'Duration', description: 'Duration filter bands', type: 'duration', readOnly: true },
  { title: 'Visibility', description: 'Who a learning is visible to', type: 'visibility', readOnly: true },
  { title: 'Learning type', description: 'Lesson format', type: 'lesson-type', readOnly: true },
  { title: 'Content type', description: 'Content format for cards', type: 'content-type', readOnly: true },
];

const DataManagementDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading to match other dashboard pages
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 w-full min-h-screen bg-[var(--surface)]">
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
    <div>
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-[6px] mb-[6px]">
        <AlignLeft width={13} height={13} color="var(--ink-mute)" />
        <span className="text-[length:var(--fs-label)] font-[700] font-serif tracking-[0.08em] uppercase text-[var(--ink-mute)]">
          Platform Data
        </span>
      </div>

      {/* ── Page Title ── */}
      <div className="mb-7">
        <h1 className="text-[length:var(--fs-h1)] font-[var(--fw-extrabold)] leading-tight m-0 mb-[6px] text-[var(--ink)]">
          Data Management
        </h1>
        <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] max-w-[680px] m-0 leading-[1.55]">
          Add, edit and remove the option lists (data sets) that feed the catalog filters, the
          course builder, and every dropdown across the platform. Prototype: changes are held in
          this session only.
        </p>
      </div>

      {/* ── Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {DATA_SETS.map((ds) => (
          <DataManagementCard
            key={ds.type}
            title={ds.title}
            description={ds.description}
            type={ds.type}
            readOnly={ds.readOnly}
          />
        ))}
      </div>
    </div>
  );
};

export default DataManagementDashboard;

