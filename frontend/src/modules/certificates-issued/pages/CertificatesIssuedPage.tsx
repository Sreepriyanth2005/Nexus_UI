import React, { useMemo, useCallback } from 'react';
import { Certificate, CertificateStats as CertificateStatsType } from '../types/certificate';
import {
  CertificateStats,
  CertificateFilters,
  CertificateTable,
  CertificateCard,
  ExportCSVButton,
  InfoBox,
} from '../../../components/certificates';
import styles from '../styles/certificatesIssued.module.css';

// Store & Hook imports
import { useCertificateStore } from '../../../store/certificate/certificate.store';
import { useCertificateAdminList, useCertificateAdminStats } from '../../../hooks/certificate/certificate';
import { CertificateDto } from '../../../core/api/certificate/certificateApi.types';

// Helper to map DTO to UI model
const mapCertificateToView = (dto: CertificateDto): Certificate => {
  const issuedDate = dto.issuedAt ? dto.issuedAt.split('T')[0] : '';
  const recipientName = dto.user?.profile
    ? `${dto.user.profile.firstName || ''} ${dto.user.profile.lastName || ''}`.trim() || dto.user.profile.certificateName
    : 'Unknown';

  return {
    id: dto.id,
    issuedDate,
    recipientName,
    email: dto.user?.email || '',
    certification: dto.course?.title || '',
    certificationLabel: dto.course?.title || '',
    path: dto.course?.careerPaths?.[0]?.careerPath?.title || '',
    issuer: dto.issuer || 'system',
    verifyUrl: dto.verification?.publicUrl || '',
    status: dto.verification?.isRevoked ? 'Revoked' : 'Active',
    revokeReason: dto.verification?.isRevoked ? 'rule violation' : undefined,
  };
};

const CertificatesIssuedPage: React.FC = () => {
  const {
    filters,
    search,
    page,
    limit,
    selectedIds,
    setFilter,
    setSearch,
    setPage,
    resetFilters,
    toggleSelect,
    selectAll,
  } = useCertificateStore();

  // Map local filters to API Query Params
  const apiParams = useMemo(() => {
    let dateRangeStart: string | undefined;
    if (filters.dateRange === 'last7') {
      dateRangeStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (filters.dateRange === 'last30') {
      dateRangeStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (filters.dateRange === 'last90') {
      dateRangeStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    } else if (filters.dateRange === 'thisYear') {
      dateRangeStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
    }

    const statusMap = {
      Active: 'ACTIVE',
      Revoked: 'REVOKED',
    } as const;

    const statusParam = filters.status ? statusMap[filters.status as keyof typeof statusMap] : undefined;

    return {
      page,
      limit,
      search: search || undefined,
      status: statusParam,
      dateRangeStart,
    };
  }, [filters, search, page, limit]);

  // Fetch admin list & stats
  const {
    data: listData,
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
    refetch: refetchList,
  } = useCertificateAdminList(apiParams);

  const {
    data: statsData,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
  } = useCertificateAdminStats();

  const handleRetry = useCallback(() => {
    refetchList();
    refetchStats();
  }, [refetchList, refetchStats]);

  // Map certificates data for UI
  const paginatedCertificates = useMemo(() => {
    if (!listData?.data?.data) return [];
    return listData.data.data.map(mapCertificateToView);
  }, [listData]);

  const allSelected = useMemo(() => {
    return (
      paginatedCertificates.length > 0 &&
      paginatedCertificates.every((c) => selectedIds.has(c.id))
    );
  }, [paginatedCertificates, selectedIds]);

  const handleSelectRow = useCallback(
    (id: string) => {
      toggleSelect(id);
    },
    [toggleSelect]
  );

  const handleSelectAll = useCallback(() => {
    selectAll(paginatedCertificates.map((c) => c.id));
  }, [selectAll, paginatedCertificates]);

  const handleExportCSV = useCallback(() => {
    if (!paginatedCertificates.length) return;

    const headers = [
      'Issued',
      'Recipient',
      'Email',
      'Certification',
      'Path',
      'Issuer',
      'Verify URL',
      'Status',
    ];
    const rows = paginatedCertificates.map((c) => [
      c.issuedDate,
      c.recipientName,
      c.email,
      c.certificationLabel,
      c.path,
      c.issuer,
      c.verifyUrl,
      c.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificates-issued.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [paginatedCertificates]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const filterKey = key === 'tenant' ? 'tenantId' : key;
      setFilter(filterKey as any, value as any);
    },
    [setFilter]
  );

  const handleClearFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const totalRecords = listData?.data?.total || 0;
  const showingStart = (page - 1) * limit + 1;
  const showingEnd = Math.min(page * limit, totalRecords);
  const totalPages = listData?.data?.totalPages || 1;

  // Render stats mapping
  const stats = useMemo<CertificateStatsType>(() => {
    if (!statsData?.data) {
      return {
        totalIssued: 0,
        thisWeek: 0,
        pendingIssuance: 0,
        revokedExpired: 0,
      };
    }
    return {
      totalIssued: statsData.data.totalIssued,
      thisWeek: statsData.data.thisWeek,
      pendingIssuance: statsData.data.pendingIssuance,
      revokedExpired: statsData.data.revoked,
    };
  }, [statsData]);

  const handlePrevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page, setPage]);

  const handleNextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages, setPage]);

  const renderContent = () => {
    if (isListLoading || isStatsLoading) {
      return (
        <div className={styles.loadingState}>
          <p>Loading certificates data...</p>
        </div>
      );
    }

    if (isListError || isStatsError) {
      const getErrorMessage = (err: any) => {
        if (!err) return '';
        if (err.response?.data?.message) {
          return Array.isArray(err.response.data.message)
            ? err.response.data.message.join(', ')
            : err.response.data.message;
        }
        return err.message || String(err);
      };

      return (
        <div className={styles.errorState}>
          <p>Failed to load certificates from backend.</p>
          {listError && (
            <p style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.85 }}>
              List Error: {getErrorMessage(listError)}
            </p>
          )}
          {statsError && (
            <p style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.85 }}>
              Stats Error: {getErrorMessage(statsError)}
            </p>
          )}
          <button className={styles.errorRetryBtn} onClick={handleRetry}>
            Retry Request
          </button>
        </div>
      );
    }

    if (paginatedCertificates.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>No certificates found matching filters.</p>
        </div>
      );
    }

    return (
      <>
        {/* Desktop Table */}
        <CertificateTable
          certificates={paginatedCertificates}
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          allSelected={allSelected}
        />

        {/* Mobile Card List */}
        <div className={styles.cardList}>
          {paginatedCertificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      </>
    );
  };

  const uiFilters = useMemo(() => ({
    dateRange: filters.dateRange || '',
    careerPath: filters.careerPath || '',
    tenant: filters.tenantId || '',
    status: filters.status || '',
  }), [filters]);

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Certificates issued</h1>
          <p className={styles.pageSubtitle}>All credentials issued by Nexus Academy to date.</p>
        </div>
        <ExportCSVButton onClick={handleExportCSV} variant="primary" />
      </div>

      {/* Statistics Cards */}
      <CertificateStats
        totalIssued={stats.totalIssued}
        thisWeek={stats.thisWeek}
        pendingIssuance={stats.pendingIssuance}
        revokedExpired={stats.revokedExpired}
      />

      {/* Filters */}
      <CertificateFilters
        filters={uiFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Main Content Area */}
      {renderContent()}

      {/* Table Footer: Export + Pagination */}
      <div className={styles.tableFooter}>
        <ExportCSVButton onClick={handleExportCSV} variant="secondary" />
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Showing {showingStart}–{showingEnd} of {totalRecords.toLocaleString()}
          </span>
          <button
            className={styles.paginationBtn}
            onClick={handlePrevPage}
            disabled={page <= 1}
          >
            ‹ Previous
          </button>
          <button
            className={`${styles.paginationBtn} ${styles.paginationBtnActive}`}
            onClick={handleNextPage}
            disabled={page >= totalPages}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Information Cards */}
      <div className={styles.infoCardsContainer}>
        <InfoBox title="Auto-issuance rules:" variant="amber">
          Certificates auto-issue when a learner: (a) completes 100% of lessons,
          (b) passes assessment with 70% or more, (c) has 100% profile completion.
          The 47 pending certificates are gated on profile completion only; the learner
          has already passed.
        </InfoBox>

        <InfoBox title="Revocation:" variant="orange">
          Revoking a credential immediately invalidates the public verify URL.
          All revocations require a mandatory admin comment and are logged in the
          audit trail. This action cannot be undone without re-issuing.
        </InfoBox>
      </div>
    </div>
  );
};

export default CertificatesIssuedPage;
