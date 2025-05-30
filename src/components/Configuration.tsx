import { useEffect, useReducer, useCallback } from 'react';
import { EnvVariable, ServerConfig } from '../types';
import '../styles/Configuration.css';
import { readEnvFile } from '../setups/configs';
import { checkPrerequisite } from '../setups/prerequisites';
import InstallationProgress from './InstallationProgress';
import eventBus from '../utils/eventBus';
import { configReducer, ConfigState } from '../reducers/configurationReducer';
import EnvironmentVariableForm from './EnvironmentVariableForm';
import ModalFooter from './ModalFooter';

interface ConfigurationProps {
  server: ServerConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (envVars: Record<string, EnvVariable>) => void;
  isInstall?: boolean;
  isLoading?: boolean;
  doneProcessing?: boolean;
}

const Configuration = ({ server, isOpen, onClose, onSave, isInstall = false, isLoading = false, doneProcessing = false }: ConfigurationProps) => {
  // Initialize state with reducer
  const initialState: ConfigState = {
    envVars: {},
    visibleFields: {},
    prerequisitesMet: null,
    showProgress: false
  };
  
  const [state, dispatch] = useReducer(configReducer, initialState);
  

  useEffect(() => {
    // Initialize env vars from server config
    if (server.installed) {
      readEnvFile(server).then(envVars => {
        dispatch({ type: 'SET_ENV_VARS', envVars: { ...envVars } });
      });
    } else if (server && server.env) {
      dispatch({ type: 'SET_ENV_VARS', envVars: { ...server.env } });
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

  // Use useCallback to memoize event handlers
  const handleInputChange = useCallback((key: string, value: string) => {
    dispatch({ type: 'UPDATE_ENV_VAR', key, value });
  }, [dispatch]);

  const toggleFieldVisibility = useCallback((key: string) => {
    dispatch({ type: 'TOGGLE_FIELD_VISIBILITY', key });
  }, [dispatch]);

  const handleToggleChange = useCallback((key: string, checked: boolean) => {
    dispatch({ type: 'TOGGLE_BOOLEAN_VALUE', key, checked });
  }, [dispatch]);

  const handleSave = useCallback(async () => {
    if (!server.installed) {
      // Start installation process
      dispatch({ type: 'START_INSTALLATION' });
      
      // Emit initial installation event
      eventBus.updateInstallationProgress({
        server: server.name,
        step: 'Setup Started',
        status: 'in-progress',
        message: `Setting up ${server.displayName || server.name}...`,
      });
      
      // Check prerequisites
      const message = await checkPrerequisite(server);
      if (message) {
        dispatch({ type: 'PREREQUISITES_FAILED', message });
        return;
      }
    }

    // Save environment variables and continue with installation
    onSave(state.envVars);
  }, [dispatch, server, onSave, state.envVars]);



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

        <div className="config-content">
          {server.dockerWrapper && (
            <div className="info-notification">
              <div className="info-icon">ℹ️</div>
              <p>
                A Docker wrapper will be used which will authenticate to GitHub Container Registry using the provided <code>GITHUB_PERSONAL_ACCESS_TOKEN</code> before pulling the image.  This may affect your GitHub authentication.
              </p>
            </div>
          )}
          {state.prerequisitesMet && (
            <div className="error-message">
              {state.prerequisitesMet}
            </div>
          )}
          
          {!state.showProgress ? (
            <EnvironmentVariableForm
              server={server}
              envVars={state.envVars}
              visibleFields={state.visibleFields}
              onInputChange={handleInputChange}
              onToggleChange={handleToggleChange}
              onToggleVisibility={toggleFieldVisibility}
            />
          ) : (
            <div className="installation-section">
              <h3 className="section-title">Installation Progress</h3>
              <InstallationProgress serverName={server.name} />
            </div>
          )}
        </div>
        {!state.showProgress && (
          <div className="disabled-tools-section">
            <h4>Disabled Tools</h4>
            <p className="disabled-tools-description">
              Specify tools that should be disabled for this server (comma-separated):
            </p>
            <div className="disabled-tools-input-container">
              <input
                type="text"
                className="disabled-tools-input"
                value={server.mcpConfig?.disabledTools ? server.mcpConfig.disabledTools.join(", ") : ""}
                onChange={(e) => {
                  const toolsArray = e.target.value
                    .split(",")
                    .map(tool => tool.trim())
                    .filter(tool => tool !== "");
                  
                  // Update the server object
                  if (!server.mcpConfig) {
                    server.mcpConfig = { 
                      command: '', 
                      disabledTools: toolsArray,
                      args: undefined,
                      disabled: undefined
                    };
                  } else {
                    server.mcpConfig.disabledTools = toolsArray;
                  }
                  
                  // Just force a re-render with the current state
                  dispatch({ type: 'SET_ENV_VARS', envVars: { ...state.envVars } });
                }}
                placeholder="tool1, tool2, tool3"
              />
            </div>
            {server.mcpConfig?.disabledTools && server.mcpConfig.disabledTools.length > 0 && (
              <div className="disabled-tools-list">
                {server.mcpConfig.disabledTools.map((tool, index) => (
                  <span key={index} className="disabled-tool-tag">
                    {tool}
                    <button 
                      className="remove-tool-btn"
                      onClick={() => {
                        if (server.mcpConfig?.disabledTools) {
                          server.mcpConfig.disabledTools = server.mcpConfig.disabledTools.filter((_, i) => i !== index);
                          // Force a re-render with the current state
                          dispatch({ type: 'SET_ENV_VARS', envVars: { ...state.envVars } });
                        }
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        
        {state.showProgress && server.mcpConfig?.disabledTools && server.mcpConfig.disabledTools.length > 0 && (
          <div className="disabled-tools-section">
            <h4>Disabled Tools</h4>
            <div className="disabled-tools-list">
              {server.mcpConfig.disabledTools.map((tool, index) => (
                <span key={index} className="disabled-tool-tag">{tool}</span>
              ))}
            </div>
          </div>
        )}

        <ModalFooter
          isLoading={isLoading}
          doneProcessing={doneProcessing}
          isInstall={isInstall}
          disabled={isLoading || state.prerequisitesMet !== null}
          onSave={handleSave}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default Configuration;
