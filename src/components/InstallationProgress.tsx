import React, { useState, useEffect } from 'react';
import eventBus, { InstallationStep } from '../utils/eventBus';
import '../styles/InstallationProgress.css';
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
        return <FaCheckCircle className="status-icon success" />;
      case 'error':
        return <FaExclamationCircle className="status-icon error" />;
      case 'in-progress':
        return <FaSpinner className="status-icon spinner" />;
      case 'pending':
        return <div className="status-icon-placeholder" />;
      default:
        return <div className="status-icon-placeholder" />;
    }
  };

  return (
    <div className="installation-progress">
      {/* No header button needed anymore since we're not collapsing */}
      
      <div className="progress-steps expanded">
        {!hasSteps || steps.length === 0 ? (
          <div className="progress-step pending">
            <div className="status-icon-placeholder" />
            <div className="step-content">
              <div className="step-name">Preparing installation...</div>
              <div className="step-message">Setting up environment...</div>
            </div>
          </div>
        ) : (
          steps.map((step, index) => (
            <div 
              key={index} 
              className={`progress-step ${step.status} ${activeStep === step.step ? 'active' : ''}`}
            >
              {getStatusIcon(step.status)}
              <div className="step-content">
                <div className="step-name">{step.step}</div>
                {step.message && <div className="step-message">{step.message}</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InstallationProgress;
