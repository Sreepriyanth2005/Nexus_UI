import React from 'react';
import { Certificate } from '../../modules/certificates-issued/types/certificate';
import StatusBadge from './StatusBadge';
import styles from '../../modules/certificates-issued/styles/certificatesIssued.module.css';

interface CertificateRowProps {
  certificate: Certificate;
  isSelected: boolean;
  onSelect: (id: string) => void;
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

const formatDate = (dateStr: string): string => {
  const parts = dateStr.split('-');
  return `${parts[0]}-${parts[1]}-${parts[2]}`;
};

const CertificateRow: React.FC<CertificateRowProps> = ({
  certificate,
  isSelected,
  onSelect,
}) => {
  return (
    <tr>
      <td className={styles.checkboxCell}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={isSelected}
          onChange={() => onSelect(certificate.id)}
        />
      </td>
      <td className={styles.issuedDate}>{formatDate(certificate.issuedDate)}</td>
      <td className={styles.recipientName}>{certificate.recipientName}</td>
      <td className={styles.emailCell}>{certificate.email}</td>
      <td>
        <span className={`${styles.certBadge} ${getCertBadgeClass(certificate.path)}`}>
          {certificate.certificationLabel}
        </span>
      </td>
      <td className={styles.pathCell}>{certificate.path}</td>
      <td className={styles.issuerCell}>{certificate.issuer}</td>
      <td>
        <a
          className={styles.verifyLink}
          href={`https://${certificate.verifyUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {certificate.verifyUrl}
        </a>
      </td>
      <td>
        <StatusBadge status={certificate.status} reason={certificate.revokeReason} />
      </td>
    </tr>
  );
};

export default CertificateRow;
