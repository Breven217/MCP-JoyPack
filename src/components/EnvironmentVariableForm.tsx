import React from 'react';
import { EnvType, EnvVariable, ServerConfig } from '../types';
import { FaEye, FaEyeSlash, FaExternalLinkAlt, FaInfoCircle } from 'react-icons/fa';

interface EnvironmentVariableFormProps {
  server: ServerConfig;
  envVars: Record<string, EnvVariable>;
  visibleFields: Record<string, boolean>;
  onInputChange: (key: string, value: string) => void;
  onToggleChange: (key: string, checked: boolean) => void;
  onToggleVisibility: (key: string) => void;
}

/**
 * Reusable component for rendering environment variable form
 */
const EnvironmentVariableForm: React.FC<EnvironmentVariableFormProps> = ({
  server,
  envVars,
  visibleFields,
  onInputChange,
  onToggleChange,
  onToggleVisibility
}) => {
  /**
   * Check if a value is a boolean
   */
  const isBooleanValue = (value: string | undefined): boolean => {
    return value === 'true' || value === 'false';
  };

  return (
    <div className="env-vars-section">
      <h3 className="section-title">Environment Variables</h3>
      <div className="env-vars-container">
        {Object.entries(server.env).map(([key]) => (
          <div key={key} className="env-var-input">
            {isBooleanValue(envVars[key]?.value) ? (
              <>
                <div className="env-var-label-container">
                  <label htmlFor={`toggle-${key}`}>{key}:</label>
                  {envVars[key]?.docsUrl && (
                    <a 
                      href={envVars[key]?.docsUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="docs-link"
                      title="Open documentation"
                    >
                      <FaExternalLinkAlt />
                    </a>
                  )}
                </div>
                <div className="toggle-container">
                  <label className="toggle-switch">
                    <input
                      id={`toggle-${key}`}
                      type="checkbox"
                      checked={(envVars[key]?.value) === 'true'}
                      onChange={(e) => onToggleChange(key, e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {envVars[key]?.description && (
                  <div className="env-var-description">
                    <FaInfoCircle className="description-icon" />
                    <span>{envVars[key]?.description}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="env-var-label-container">
                  <label htmlFor={`env-${key}`}>{key}:</label>
                  {envVars[key]?.docsUrl && (
                    <a 
                      href={envVars[key]?.docsUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="docs-link"
                      title="Open documentation"
                    >
                      <FaExternalLinkAlt />
                    </a>
                  )}
                </div>
                <div className="input-container">
                  <input
                    id={`env-${key}`}
                    type={
                      envVars[key]?.type === EnvType.Password
                        ? visibleFields[key] ? 'text' : 'password'
                        : 'text'
                    }
                    value={envVars[key]?.value || ''}
                    onChange={(e) => onInputChange(key, e.target.value)}
                    placeholder={envVars[key]?.value || ''}
                  />
                  {envVars[key]?.type === EnvType.Password && (
                    <button
                      type="button"
                      className="toggle-visibility-button"
                      onClick={() => onToggleVisibility(key)}
                      aria-label={visibleFields[key] ? 'Hide password' : 'Show password'}
                    >
                      {visibleFields[key] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  )}
                </div>
                {envVars[key]?.description && (
                  <div className="env-var-description">
                    <FaInfoCircle className="description-icon" />
                    <span>{envVars[key]?.description}</span>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(EnvironmentVariableForm);
