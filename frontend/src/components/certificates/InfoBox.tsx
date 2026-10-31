import React from 'react';
import styles from '../../modules/certificates-issued/styles/certificatesIssued.module.css';

interface InfoBoxProps {
  title: string;
  children: React.ReactNode;
  variant?: 'amber' | 'orange';
}

const InfoBox: React.FC<InfoBoxProps> = ({ title, children, variant = 'amber' }) => {
  const cardClass = variant === 'amber' ? styles.infoCardAmber : styles.infoCardOrange;

  return (
    <div className={`${styles.infoCard} ${cardClass}`}>
      <span className={styles.infoCardTitle}>{title}</span>
      <span className={styles.infoCardText}>{children}</span>
    </div>
  );
};

export default InfoBox;
