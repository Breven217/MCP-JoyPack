import { Command } from "@tauri-apps/plugin-shell";
import { createAppError } from './errorTypes';
import { ServerConfig } from "../types";
import eventBus from './eventBus';

/**
 * Execute an installation step with proper progress tracking
 * @param server Server configuration
 * @param stepName Name of the installation step
 * @param startMessage Message to show when step starts
 * @param command Command to execute
 * @param successMessage Message to show on success
 */
export const executeInstallStep = async (
  server: ServerConfig,
  stepName: string,
  startMessage: string,
  command: Command<any>,
  successMessage: string
): Promise<void> => {
  eventBus.updateInstallationProgress({
    server: server.name,
    step: stepName,
    status: 'in-progress',
    message: startMessage,
  });
  
  try {
    await command.execute();
    eventBus.updateInstallationProgress({
      server: server.name,
      step: stepName,
      status: 'complete',
      message: successMessage,
    });
  } catch (error: unknown) {
    const appError = createAppError(error, 'INSTALL_STEP_ERROR', { step: stepName });
    eventBus.updateInstallationProgress({
      server: server.name,
      step: stepName,
      status: 'error',
      message: `Error: ${appError.message}`,
    });
    console.error(`Error in ${stepName}:`, appError);
    throw appError;
  }
};
