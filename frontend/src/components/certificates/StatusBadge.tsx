import React from 'react';
import styles from '../../modules/certificates-issued/styles/certificatesIssued.module.css';

interface StatusBadgeProps {
  status: 'Active' | 'Revoked';
  reason?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, reason }) => {
  const statusClass = status === 'Active' ? styles.statusActive : styles.statusRevoked;

  return (
    <span className={`${styles.statusBadge} ${statusClass}`}>
      <span className={styles.statusDot} />
      {status}
      {reason && <span className={styles.revokeReason}>({reason})</span>}
    </span>
  );
};

export default StatusBadge;
