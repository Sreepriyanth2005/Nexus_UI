import React from 'react';
import { CertificateFilters as FiltersType } from '../../modules/certificates-issued/types/certificate';
import styles from '../../modules/certificates-issued/styles/certificatesIssued.module.css';

interface CertificateFiltersProps {
  filters: FiltersType;
  onFilterChange: (key: keyof FiltersType, value: string) => void;
  onClearFilters: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const CertificateFilters: React.FC<CertificateFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  search,
  onSearchChange,
}) => {
  return (
    <div className={styles.filtersContainer}>
      <input
        type="text"
        placeholder="Search name or email..."
        className={styles.searchInput}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <select
        className={styles.filterSelect}
        value={filters.dateRange}
        onChange={(e) => onFilterChange('dateRange', e.target.value)}
      >
        <option value="">Date range ▾</option>
        <option value="last7">Last 7 days</option>
        <option value="last30">Last 30 days</option>
        <option value="last90">Last 90 days</option>
        <option value="thisYear">This year</option>
        <option value="all">All time</option>
      </select>

      <select
        className={styles.filterSelect}
        value={filters.careerPath}
        onChange={(e) => onFilterChange('careerPath', e.target.value)}
      >
        <option value="">Career path ▾</option>
        <option value="CDMP">CDMP</option>
        <option value="IGP">IGP</option>
        <option value="CIP">CIP</option>
        <option value="KMP">KMP</option>
        <option value="ERM">ERM</option>
        <option value="DSA">DSA</option>
      </select>

      <select
        className={styles.filterSelect}
        value={filters.tenant}
        onChange={(e) => onFilterChange('tenant', e.target.value)}
      >
        <option value="">Tenant ▾</option>
        <option value="nexus">Nexus Global</option>
        <option value="bankmuscat">Bank Muscat</option>
        <option value="pdo">PDO</option>
        <option value="omantel">Omantel</option>
      </select>

      <select
        className={styles.filterSelect}
        value={filters.status}
        onChange={(e) => onFilterChange('status', e.target.value)}
      >
        <option value="">Status ▾</option>
        <option value="Active">Active</option>
        <option value="Revoked">Revoked</option>
      </select>

      <button className={styles.clearFiltersBtn} onClick={onClearFilters}>
        Clear filters
      </button>
    </div>
  );
};

export default CertificateFilters;
