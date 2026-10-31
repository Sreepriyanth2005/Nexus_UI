import React from 'react';
import styles from '../../modules/certificates-issued/styles/certificatesIssued.module.css';

interface CertificateStatsProps {
  totalIssued: number;
  thisWeek: number;
  pendingIssuance: number;
  revokedExpired: number;
}

const CertificateStats: React.FC<CertificateStatsProps> = ({
  totalIssued,
  thisWeek,
  pendingIssuance,
  revokedExpired,
}) => {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <p className={`${styles.statValue} ${styles.statValueDefault}`}>
          {totalIssued.toLocaleString()}
        </p>
        <p className={styles.statLabel}>Total issued</p>
      </div>

      <div className={styles.statCard}>
        <p className={`${styles.statValue} ${styles.statValueDefault}`}>
          {thisWeek}
        </p>
        <p className={styles.statLabel}>This week</p>
      </div>

      <div className={styles.statCard}>
        <p className={`${styles.statValue} ${styles.statValueWarning}`}>
          {pendingIssuance}
        </p>
        <p className={styles.statLabel}>Pending issuance</p>
        <p className={styles.statSmallText}>profile &lt;100% complete</p>
      </div>

      <div className={styles.statCard}>
        <p className={`${styles.statValue} ${styles.statValueDanger}`}>
          {revokedExpired}
        </p>
        <p className={styles.statLabel}>Revoked / expired</p>
      </div>
    </div>
  );
};

export default CertificateStats;
