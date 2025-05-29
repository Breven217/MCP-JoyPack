import { useState } from 'react';
import { EnvVariable, ServerConfig } from '../types';
import { saveServer, uninstallServer, toggleServerEnabled } from '../setups/fileFunctions';
import { ShowNotificationFn, showRestartCascadeNotification } from '../utils/notificationUtils';
import { createAppError } from '../utils/errorTypes';

/**
 * Custom hook for server-related actions
 * @param server Server configuration
 * @param onRefresh Callback to refresh server list
 * @param showNotification Function to show notifications
 */
export const useServerActions = (
  server: ServerConfig, 
  onRefresh: () => void, 
  showNotification: ShowNotificationFn
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [doneProcessing, setDoneProcessing] = useState(false);
  
  /**
   * Save server configuration
   * @param envVars Environment variables
   */
  const saveServerConfig = async (envVars: Record<string, EnvVariable>): Promise<void> => {
    setIsProcessing(true);
    
    try {
      await saveServer(server, envVars);
      showRestartCascadeNotification(showNotification);
    } catch (error: unknown) {
      const appError = createAppError(error, 'SAVE_SERVER_ERROR');
      console.error('Error saving configuration:', appError);
      showNotification('Error saving configuration', 'error');
    } finally {
      setIsProcessing(false);
      setDoneProcessing(true);
    }
  };
  
  /**
   * Uninstall a server
   */
  const uninstallServerConfig = async (): Promise<void> => {
    setIsProcessing(true);
    
    try {
      await uninstallServer(server);
      showRestartCascadeNotification(showNotification);
      onRefresh();
    } catch (error: unknown) {
      const appError = createAppError(error, 'UNINSTALL_SERVER_ERROR');
      console.error('Error uninstalling server:', appError);
      showNotification('Error uninstalling server', 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Toggle server enabled/disabled state
   */
  const toggleServerState = async (): Promise<void> => {
    setIsProcessing(true);
    
    try {
      await toggleServerEnabled(server);
      showRestartCascadeNotification(showNotification);
      onRefresh();
    } catch (error: unknown) {
      const appError = createAppError(error, 'TOGGLE_SERVER_ERROR');
      console.error('Error toggling server state:', appError);
      showNotification('Error toggling server state', 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Reset processing state
   */
  const resetState = (): void => {
    setDoneProcessing(false);
    setIsProcessing(false);
  };
  
  return {
    isProcessing,
    doneProcessing,
    saveServerConfig,
    uninstallServerConfig,
    toggleServerState,
    resetState
  };
};
