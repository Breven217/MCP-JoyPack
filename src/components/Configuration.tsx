import { useState, useEffect } from 'react';
import { EnvType, EnvVariable, ServerConfig } from '../types';
import '../styles/Configuration.css';
import { readEnvFile } from '../fileFunctions';
import { FaEye, FaEyeSlash, FaExternalLinkAlt, FaInfoCircle } from 'react-icons/fa';

interface ConfigurationProps {
  server: ServerConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (envVars: Record<string, EnvVariable>) => void;
  isInstall?: boolean;
  isLoading?: boolean;
}

const Configuration = ({ server, isOpen, onClose, onSave, isInstall = false, isLoading = false }: ConfigurationProps) => {
  const [envVars, setEnvVars] = useState<Record<string, EnvVariable>>({});
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Initialize env vars from server config
    if (server.installed) {
      readEnvFile(server).then(envVars => {
        setEnvVars({ ...envVars });
      });
    } else if (server && server.env) {
      setEnvVars({ ...server.env });
    }

    // Add scroll lock to body when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    // Cleanup function to remove scroll lock when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [server, isOpen]);

  const handleInputChange = (key: string, value: string) => {
    // Update the env vars state by finding the env var with the matching key and updating the "value" property
    setEnvVars(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
  };

  const toggleFieldVisibility = (key: string) => {
    setVisibleFields(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isBooleanValue = (value: string | undefined) => {
    return value === 'true' || value === 'false';
  };

  const handleToggleChange = (key: string, checked: boolean) => {
    setEnvVars(prev => ({
      ...prev,
      [key]: { ...prev[key], value: checked ? 'true' : 'false' }
    }));
  };

  if (!isOpen) {
    // Ensure scroll is enabled when modal is closed
    document.body.style.overflow = '';
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="config-modal">
        <div className="modal-header">
          <h2>{isInstall ? `Install ${server.displayName}` : `Configure ${server.displayName}`}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="config-description">
            {isInstall
              ? `Configure environment variables to install ${server.displayName}`
              : `Update environment variables for ${server.displayName}`}
          </p>

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
                          onChange={(e) => handleToggleChange(key, e.target.checked)}
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
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={envVars[key]?.value || ''}
                      />
                      {envVars[key]?.type === EnvType.Password && (
                        <button
                          type="button"
                          className="toggle-visibility-button"
                          onClick={() => toggleFieldVisibility(key)}
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

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="save-button" onClick={() => onSave(envVars)} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                {isInstall ? 'Installing...' : 'Saving...'}
              </>
            ) : (
              isInstall ? 'Install' : 'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Configuration;
