import React, { useState, useEffect } from 'react';
import eventBus, { InstallationStep } from '../utils/eventBus';
import styles from '../styles/InstallationProgress.module.css';
import { FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

interface InstallationProgressProps {
  serverName: string;
}

const InstallationProgress: React.FC<InstallationProgressProps> = ({ serverName }) => {
  const [steps, setSteps] = useState<InstallationStep[]>([]);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [hasSteps, setHasSteps] = useState(false);

  useEffect(() => {
    const handleProgress = (step: InstallationStep) => {
      if (step.server !== serverName) return;
      
      // Set the active step when a new step is in progress
      if (step.status === 'in-progress') {
        setActiveStep(step.step);
      }
      
      setSteps(prevSteps => {
        // Check if we already have this step
        const existingStepIndex = prevSteps.findIndex(s => s.step === step.step);
        
        let newSteps;
        if (existingStepIndex >= 0) {
          // Update existing step
          newSteps = [...prevSteps];
          newSteps[existingStepIndex] = step;
        } else {
          // Add new step
          newSteps = [...prevSteps, step];
        }
        
        // Update hasSteps flag
        if (newSteps.length > 0) {
          setHasSteps(true);
        }
        
        return newSteps;
      });
    };

    const unsubscribe = eventBus.on('installation-progress', handleProgress);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [serverName]);

  // Always show the component, even if there are no steps yet

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <FaCheckCircle className={`${styles.statusIcon} ${styles.success}`} />;
      case 'error':
        return <FaExclamationCircle className={`${styles.statusIcon} ${styles.error}`} />;
      case 'in-progress':
        return <FaSpinner className={`${styles.statusIcon} ${styles.spinner}`} />;
      case 'pending':
        return <div className={styles.statusIconPlaceholder} />;
      default:
        return <div className={styles.statusIconPlaceholder} />;
    }
  };

  return (
    <div className={styles.installationProgress}>
      {/* No header button needed anymore since we're not collapsing */}
      
      <div className={`${styles.progressSteps} ${styles.expanded}`}>
        {!hasSteps || steps.length === 0 ? (
          <div className={`${styles.progressStep} ${styles.pending}`}>
            <div className={styles.statusIconPlaceholder} />
            <div className={styles.stepContent}>
              <div className={styles.stepName}>Preparing installation...</div>
              <div className={styles.stepMessage}>Setting up environment...</div>
            </div>
          </div>
        ) : (
          steps.map((step, index) => {
            const stepStatusClass = step.status === 'in-progress' ? styles.inProgress : 
                                   step.status === 'complete' ? styles.complete : 
                                   step.status === 'error' ? styles.error : '';
            
            return (
              <div 
                key={index} 
                className={`${styles.progressStep} ${stepStatusClass} ${activeStep === step.step ? styles.active : ''}`}
              >
                {getStatusIcon(step.status)}
                <div className={styles.stepContent}>
                  <div className={styles.stepName}>{step.step}</div>
                  {step.message && <div className={styles.stepMessage}>{step.message}</div>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InstallationProgress;
