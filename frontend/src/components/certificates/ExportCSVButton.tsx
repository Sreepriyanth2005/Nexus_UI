import React from 'react';
import styles from '../../modules/certificates-issued/styles/certificatesIssued.module.css';

interface ExportCSVButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const ExportCSVButton: React.FC<ExportCSVButtonProps> = ({
  onClick,
  variant = 'primary',
}) => {
  const className = variant === 'primary' ? styles.exportBtn : styles.footerExportBtn;

  return (
    <button className={className} onClick={onClick}>
      Export CSV
    </button>
  );
};

export default ExportCSVButton;
