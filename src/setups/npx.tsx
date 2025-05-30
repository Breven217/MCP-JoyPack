import { ServerConfig } from "../types";
import { ENV_PATH, getHomePath } from './config';
import { Command } from "@tauri-apps/plugin-shell";
import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import eventBus from '../utils/eventBus';
import { executeInstallStep } from '../utils/installUtils';
import { createAppError } from '../utils/errorTypes';

export const setupNPX = async (server: ServerConfig) => {
  try {
	if (!server.npxSetup?.package) {
		throw new Error('Server does not have a npx package');
	}
	await executeInstallStep(
		server,
		'npx/smithery',
		'Installing npx dependencies...',
		Command.create('npx-install', [
            "-y",
            "@smithery/cli",
            "install",
            server.npxSetup?.package,
            "--client",
            "claude"
          ]),
		'npx dependencies installed successfully'
	  );

	await createEnvWrapper(server);
  } catch (error) {
	console.error('Error setting up npx repository:', error);
	throw error;
  }
};

const createEnvWrapper = async (server: ServerConfig): Promise<void> => {
  try {
	// Prepare paths
	const homePath = await getHomePath();
	const wrapperPath = `${homePath}/${ENV_PATH}/${server.name}-npx-wrapper.sh`;
	const envPath = `${homePath}/${ENV_PATH}/${server.name}.env`;

	// Update progress
	eventBus.updateInstallationProgress({
	  server: server.name,
	  step: 'npx Wrapper Creation',
	  status: 'in-progress',
	  message: 'Creating environment wrapper...',
	});
	
	const wrapperCommand = "npx " + server.npxSetup?.args.join(' ');
	// Create wrapper script
	const wrapperContent = `#!/bin/bash
export $(cat ${envPath} | xargs)
${wrapperCommand}`;
	await writeTextFile(wrapperPath, wrapperContent, { baseDir: BaseDirectory.Home });
	
	// Make wrapper executable
	const chmodCommand = Command.create('chmod', ['+x', wrapperPath]);
	await chmodCommand.execute();

	// Update mcpConfig for server
	server.mcpConfig = {
	  command: wrapperPath,
	  disabledTools: server.mcpConfig?.disabledTools || [],
	  args: undefined,
	  disabled: undefined
	};
	
	// Update progress on success
	eventBus.updateInstallationProgress({
	  server: server.name,
	  step: 'npx Wrapper Creation',
	  status: 'complete',
	  message: 'Environment wrapper created successfully',
	});
  } catch (error: unknown) {
	// Handle errors
	const appError = createAppError(error, 'WRAPPER_CREATION_ERROR');
	eventBus.updateInstallationProgress({
	  server: server.name,
	  step: 'npx Wrapper Creation',
	  status: 'error',
	  message: `Error creating wrapper: ${appError.message}`,
	});
	console.error('Error creating env wrapper:', appError);
	throw appError;
  }
};