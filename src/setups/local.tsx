import { ServerConfig, CommandType } from "../types";
import { ENV_PATH, HOME_PATH, REPO_PATH } from './config';
import { Command } from "@tauri-apps/plugin-shell";
import { writeTextFile, BaseDirectory, remove, exists, mkdir } from '@tauri-apps/plugin-fs';
import eventBus from '../utils/eventBus';

export const setupLocal = async (server: ServerConfig) => {
  try {
    const repoPath = await cloneLocalRepo(server);

    if (server.localSetup?.command === CommandType.Node) {
      eventBus.updateInstallationProgress({
        server: server.name,
        step: 'Dependencies Installation',
        status: 'in-progress',
        message: 'Installing npm dependencies...',
      });
      
      const installCommand = Command.create('npm-install', ['--prefix', repoPath, 'install']);
      await installCommand.execute().then(() => {
        eventBus.updateInstallationProgress({
          server: server.name,
          step: 'Dependencies Installation',
          status: 'complete',
          message: 'NPM dependencies installed successfully',
        });
      }).catch((error: any) => {
        eventBus.updateInstallationProgress({
          server: server.name,
          step: 'Dependencies Installation',
          status: 'error',
          message: `Error installing dependencies: ${error.message}`,
        });
        console.error('Error installing dependencies:', error);
        throw error;
      });
    } else if (server.localSetup?.command === CommandType.UV) {
      eventBus.updateInstallationProgress({
        server: server.name,
        step: 'Dependencies Installation',
        status: 'in-progress',
        message: 'Syncing Python dependencies...',
      });
      
      const syncCommand = Command.create('uv-sync', ['--prefix', repoPath, 'sync']);
      await syncCommand.execute().then(() => {
        eventBus.updateInstallationProgress({
          server: server.name,
          step: 'Dependencies Installation',
          status: 'complete',
          message: 'Python dependencies synced successfully',
        });
      }).catch((error: any) => {
        eventBus.updateInstallationProgress({
          server: server.name,
          step: 'Dependencies Installation',
          status: 'error',
          message: `Error syncing dependencies: ${error.message}`,
        });
        console.error('Error syncing dependencies:', error);
        throw error;
      });
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
    const repoPath = `${HOME_PATH}/${REPO_PATH}/${repoName}`;
    const existing = await exists(repoPath, { baseDir: BaseDirectory.Home });
    if (!existing) {
      return;
    }
    await remove(repoPath, { recursive: true, baseDir: BaseDirectory.Home });
  } catch (error) {
    console.error('Error tearing down local repository:', error);
  }
};

const cloneLocalRepo = async (server: ServerConfig): Promise<string> => {
  if (!server.localSetup?.repo) {
    throw new Error('Server does not have a special repository URL');
  }
  const directoryPath = `${HOME_PATH}/${REPO_PATH}`;
  await mkdir(directoryPath, { recursive: true, baseDir: BaseDirectory.Home });
  const repoName = server.localSetup.repo.split('/').pop()?.replace('.git', '') || 'repo';
  const repoPath = `${directoryPath}/${repoName}`;

  eventBus.updateInstallationProgress({
    server: server.name,
    step: 'Repository Clone',
    status: 'in-progress',
    message: `Cloning ${server.localSetup.repo}...`,
  });
  
  const cloneCommand = Command.create('git-clone', ['clone', server.localSetup.repo, repoPath]);
  await cloneCommand.execute().then(() => {
    eventBus.updateInstallationProgress({
      server: server.name,
      step: 'Repository Clone',
      status: 'complete',
      message: 'Repository cloned successfully',
    });
  }).catch((error: any) => {
    eventBus.updateInstallationProgress({
      server: server.name,
      step: 'Repository Clone',
      status: 'error',
      message: `Error cloning repository: ${error.message}`,
    });
    console.error('Error cloning repository:', error);
    throw error;
  });
  return repoPath;
};

const createEnvWrapper = async (server: ServerConfig) => {
  try {
    if (!server.localSetup?.command) {
      throw new Error('Server does not have a special command to run');
    }
    if (!server.localSetup?.entryPoint) {
      throw new Error('Server does not have a special entry point to run');
    }
    const repoName = server.localSetup.repo?.split('/').pop()?.replace('.git', '') || 'repo';
    const repoPath = `${HOME_PATH}/${REPO_PATH}/${repoName}`;
    const wrapperPath = `${repoPath}/${server.name}-wrapper.sh`;
    const envPath = `${HOME_PATH}/${ENV_PATH}/${server.name}.env`;

    eventBus.updateInstallationProgress({
      server: server.name,
      step: 'Wrapper Creation',
      status: 'in-progress',
      message: 'Creating environment wrapper...',
    });
    
    const wrapperContent = `#!/bin/bash
export $(cat ${envPath} | xargs)
${server.localSetup.command} ${repoPath}/${server.localSetup.entryPoint}`;
    await writeTextFile(wrapperPath, wrapperContent, { baseDir: BaseDirectory.Home });
    await Command.create('chmod', ['+x', wrapperPath]).execute();
    
    eventBus.updateInstallationProgress({
      server: server.name,
      step: 'Wrapper Creation',
      status: 'complete',
      message: 'Environment wrapper created successfully',
    });
  } catch (error: any) {
    eventBus.updateInstallationProgress({
      server: server.name,
      step: 'Wrapper Creation',
      status: 'error',
      message: `Error creating wrapper: ${error.message}`,
    });
    console.error('Error creating env wrapper:', error);
  }
};