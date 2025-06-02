import { ServerConfig } from "../types";
import { ENV_PATH, getHomePath } from './config';
import { Command } from "@tauri-apps/plugin-shell";
import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import eventBus from '../utils/eventBus';
import { createAppError } from '../utils/errorTypes';

export const setupDockerWrapper = async (server: ServerConfig) => {
	try {
	  // Prepare paths
	  const homePath = await getHomePath();
	  const wrapperPath = `${homePath}/${ENV_PATH}/${server.name}-docker-wrapper.sh`;
	  const envPath = `${homePath}/${ENV_PATH}/${server.name}.env`;
  
	  // Update progress
	  eventBus.updateInstallationProgress({
		server: server.name,
		step: 'Docker Wrapper Creation',
		status: 'in-progress',
		message: 'Creating docker wrapper...',
	  });
	  
	  // Create wrapper script
	  const wrapperContent = `#!/bin/bash
  # ~/.mcp/bamboohr-docker-wrapper.sh
  
  # Extract GitHub token from environment file or use provided token
  GITHUB_TOKEN=$(grep GITHUB_PERSONAL_ACCESS_TOKEN ${envPath} | cut -d '=' -f2)
  
  # Login to GitHub Container Registry
  echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
  
  # Run the original Docker command
  docker run --rm -i --env-file ${envPath} ${server.dockerImage}`;
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
		step: 'Docker Wrapper Creation',
		status: 'complete',
		message: 'Docker wrapper created successfully',
	  });
	} catch (error: unknown) {
	  // Handle errors
	  const appError = createAppError(error, 'WRAPPER_CREATION_ERROR');
	  eventBus.updateInstallationProgress({
		server: server.name,
		step: 'Docker Wrapper Creation',
		status: 'error',
		message: `Error creating docker wrapper: ${appError.message}`,
	  });
	  console.error('Error creating docker wrapper:', appError);
	  throw appError;
	}
}