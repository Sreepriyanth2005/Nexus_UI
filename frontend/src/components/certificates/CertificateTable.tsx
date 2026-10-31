import React from 'react';
import { Certificate } from '../../modules/certificates-issued/types/certificate';
import CertificateRow from './CertificateRow';
import styles from '../../modules/certificates-issued/styles/certificatesIssued.module.css';

interface CertificateTableProps {
  certificates: Certificate[];
  selectedIds: Set<string>;
  onSelectRow: (id: string) => void;
  onSelectAll: () => void;
  allSelected: boolean;
}

const CertificateTable: React.FC<CertificateTableProps> = ({
  certificates,
  selectedIds,
  onSelectRow,
  onSelectAll,
  allSelected,
}) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.certificateTable}>
        <thead>
          <tr>
            <th className={styles.checkboxCell}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={allSelected}
                onChange={onSelectAll}
              />
            </th>
            <th>Issued</th>
            <th>Recipient</th>
            <th>Email</th>
            <th>Certification</th>
            <th>Path</th>
            <th>Issuer</th>
            <th>Verify URL</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {certificates.map((cert) => (
            <CertificateRow
              key={cert.id}
              certificate={cert}
              isSelected={selectedIds.has(cert.id)}
              onSelect={onSelectRow}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CertificateTable;
