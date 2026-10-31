import React from 'react';
import { Certificate } from '../../modules/certificates-issued/types/certificate';
import StatusBadge from './StatusBadge';
import styles from '../../modules/certificates-issued/styles/certificatesIssued.module.css';

interface CertificateCardProps {
  certificate: Certificate;
}

const getCertBadgeClass = (path: string): string => {
  const badgeMap: Record<string, string> = {
    CDMP: styles.certBadgeCDMP,
    IGP: styles.certBadgeIGP,
    CIP: styles.certBadgeCIP,
    KMP: styles.certBadgeKMP,
    ERM: styles.certBadgeERM,
    DSA: styles.certBadgeDSA,
  };
  return badgeMap[path] || styles.certBadgeDefault;
};

const CertificateCard: React.FC<CertificateCardProps> = ({ certificate }) => {
  return (
    <div className={styles.certCard}>
      <div className={styles.certCardHeader}>
        <span className={styles.certCardName}>{certificate.recipientName}</span>
        <span className={styles.certCardDate}>{certificate.issuedDate}</span>
      </div>
      <div className={styles.certCardEmail}>{certificate.email}</div>

      <div className={styles.certCardRow}>
        <span className={styles.certCardLabel}>Certification</span>
        <span className={`${styles.certBadge} ${getCertBadgeClass(certificate.path)}`}>
          {certificate.certificationLabel}
        </span>
      </div>

      <hr className={styles.certCardDivider} />

      <div className={styles.certCardRow}>
        <span className={styles.certCardLabel}>Path</span>
        <span className={styles.certCardValue}>{certificate.path}</span>
      </div>

      <div className={styles.certCardRow}>
        <span className={styles.certCardLabel}>Issuer</span>
        <span className={styles.certCardValue}>{certificate.issuer}</span>
      </div>

      <hr className={styles.certCardDivider} />

      <div className={styles.certCardRow}>
        <span className={styles.certCardLabel}>Verify</span>
        <a
          className={styles.verifyLink}
          href={`https://${certificate.verifyUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {certificate.verifyUrl}
        </a>
      </div>

      <hr className={styles.certCardDivider} />

      <div className={styles.certCardRow}>
        <span className={styles.certCardLabel}>Status</span>
        <StatusBadge status={certificate.status} reason={certificate.revokeReason} />
      </div>
    </div>
  );
};

export default CertificateCard;
