import { ServerConfig, CommandType } from "../types";
import { ENV_PATH, getHomePath, REPO_PATH } from './config';
import { Command } from "@tauri-apps/plugin-shell";
import { writeTextFile, BaseDirectory, remove, exists, mkdir } from '@tauri-apps/plugin-fs';
import eventBus from '../utils/eventBus';
import { executeInstallStep } from '../utils/installUtils';
import { createAppError } from '../utils/errorTypes';

export const setupLocal = async (server: ServerConfig) => {
  try {
	const repoPath = await cloneLocalRepo(server);

	if (server.localSetup?.buildCommand === CommandType.NPM) {
		await npmBuild(server, repoPath);
	} else if (server.localSetup?.buildCommand === CommandType.UV) {
		throw new Error('UV build command not implemented');
		// await uvBuild(server, repoPath);
	} else if (server.localSetup?.buildCommand === CommandType.PNPM) {
		await pnpmBuild(server, repoPath);
	}
	await createEnvWrapper(server);
	return repoPath;
  } catch (error) {
    console.error('Error setting up local repository:', error);
    throw error;
  }
};

export const tearDownLocalRepo = async (server: ServerConfig) => {
  try {
    if (!server.localSetup?.repo) {
      throw new Error('Server does not have a special repository URL');
    }
    const repoName = server.localSetup.repo.split('/').pop()?.replace('.git', '') || 'repo';
    const homePath = await getHomePath();
    const repoPath = `${homePath}/${REPO_PATH}/${repoName}`;
    const existing = await exists(repoPath, { baseDir: BaseDirectory.Home });
    if (!existing) {
      return;
    }
    await remove(repoPath, { recursive: true, baseDir: BaseDirectory.Home });
  } catch (error) {
    console.error('Error tearing down local repository:', error);
  }
};

/**
 * Clone a repository for a server
 * @param server Server configuration
 * @returns Path to the cloned repository
 */
const cloneLocalRepo = async (server: ServerConfig): Promise<string> => {
  if (!server.localSetup?.repo) {
    throw createAppError(new Error('Server does not have a repository URL'), 'MISSING_REPO_URL');
  }
  
  try {
    const homePath = await getHomePath();
    const directoryPath = `${homePath}/${REPO_PATH}`;
    await mkdir(directoryPath, { recursive: true, baseDir: BaseDirectory.Home });
    const repoName = server.localSetup.repo.split('/').pop()?.replace('.git', '') || 'repo';
    const repoPath = `${directoryPath}/${repoName}`;

    const cloneCommand = Command.create('git-clone', ['clone', server.localSetup.repo, repoPath]);
    await executeInstallStep(
      server,
      'Repository Clone',
      `Cloning ${server.localSetup.repo}...`,
      cloneCommand,
      'Repository cloned successfully'
    );
    
    return repoPath;
  } catch (error: unknown) {
    const appError = createAppError(error, 'REPO_CLONE_ERROR');
    throw appError;
  }
};

/**
 * Build NPM dependencies for a server
 * @param server Server configuration
 * @param repoPath Path to the repository
 */
const npmBuild = async (server: ServerConfig, repoPath: string): Promise<void> => {
  const installCommand = Command.create('npm-install', ['--prefix', repoPath, 'install']);
  await executeInstallStep(
    server,
    'npm Installation',
    'Installing npm dependencies...',
    installCommand,
    'npm dependencies installed successfully'
  );

  await executeInstallStep(
    server,
    "npm Build",
    "Building npm dependencies...",
    Command.create('npm-build', ['--prefix', repoPath, 'run', 'build']),
    "npm dependencies built successfully"
  )
}

// /**
//  * Build Python dependencies using UV for a server
//  * @param server Server configuration
//  * @param repoPath Path to the repository
//  */
// const uvBuild = async (server: ServerConfig, repoPath: string): Promise<void> => {
// 	//TODO
// }

/**
 * Build NPM dependencies for a server
 * @param server Server configuration
 * @param repoPath Path to the repository
 */
const pnpmBuild = async (server: ServerConfig, repoPath: string): Promise<void> => {
  await executeInstallStep(
    server,
    'pnpm Installation',
    'Installing pnpm dependencies...',
    Command.create('pnpm', ['--prefix', repoPath, 'install']),
    'pnpm dependencies installed successfully'
  );

  await executeInstallStep(
    server,
    "Build pnpm",
    "Building pnpm dependencies...",
    Command.create('pnpm', ['--prefix', repoPath, 'build']),
    "pnpm dependencies built successfully"
  )
}

/**
 * Create an environment wrapper script for a server
 * @param server Server configuration
 */
const createEnvWrapper = async (server: ServerConfig): Promise<void> => {
  try {
    // Validate required fields
    if (!server.localSetup?.command) {
      throw createAppError(new Error('Server does not have a command to run'), 'MISSING_COMMAND');
    }
    if (!server.localSetup?.entryPoint) {
      throw createAppError(new Error('Server does not have an entry point to run'), 'MISSING_ENTRY_POINT');
    }
    
    // Prepare paths
    const homePath = await getHomePath();
    const repoName = server.localSetup.repo?.split('/').pop()?.replace('.git', '') || 'repo';
    const repoPath = `${homePath}/${REPO_PATH}/${repoName}`;
    const wrapperPath = `${repoPath}/${server.name}-wrapper.sh`;
    const envPath = `${homePath}/${ENV_PATH}/${server.name}.env`;

    // Update progress
    eventBus.updateInstallationProgress({
      server: server.name,
      step: 'Wrapper Creation',
      status: 'in-progress',
      message: 'Creating environment wrapper...',
    });
    
    // Create wrapper script
    const wrapperContent = `#!/bin/bash
export $(cat ${envPath} | xargs)
${server.localSetup.command} ${repoPath}/${server.localSetup.entryPoint}`;
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
      step: 'Wrapper Creation',
      status: 'complete',
      message: 'Environment wrapper created successfully',
    });
  } catch (error: unknown) {
    // Handle errors
    const appError = createAppError(error, 'WRAPPER_CREATION_ERROR');
    eventBus.updateInstallationProgress({
      server: server.name,
      step: 'Wrapper Creation',
      status: 'error',
      message: `Error creating wrapper: ${appError.message}`,
    });
    console.error('Error creating env wrapper:', appError);
    throw appError;
  }
};