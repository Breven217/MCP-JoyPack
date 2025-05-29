import { ServerConfig } from "../types";
import { ENV_PATH, HOME_PATH, REPO_PATH } from './config';
import { mkdir } from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";
import { writeTextFile, BaseDirectory, remove, exists } from '@tauri-apps/plugin-fs';
import { CommandType } from "../types";

export const setupLocal = async (server: ServerConfig) => {
  try {
	const repoPath = await cloneLocalRepo(server);

	if (server.localSetup.command === CommandType.Node) {
	//   // Install dependencies
	//   const installCommand = Command.create('npm-install', ['--prefix', repoPath, 'install']);
	//   await installCommand.execute().catch((error) => {
	// 	console.error('Error installing dependencies:', error);
	// 	throw error;
	//   });
	//   // Build the project
	//   const buildCommand = Command.create('npm-build', ['--prefix', repoPath, 'run', 'build']);
	//   await buildCommand.execute().catch((error) => {
	// 	console.error('Error building project:', error);
	// 	throw error;
	//   });
	} else if (server.localSetup.command === CommandType.UV) {}

	// Create wrapper
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
		// if the repo doesn't exist, skip
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
	// Ensure MCP directory exists
	await mkdir(directoryPath, { recursive: true, baseDir: BaseDirectory.Home });
	const repoName = server.localSetup.repo.split('/').pop()?.replace('.git', '') || 'repo';
	const repoPath = `${directoryPath}/${repoName}`;
	// Clone the repository
	const cloneCommand = Command.create('git-clone', ['clone', server.localSetup.repo, repoPath]);
	await cloneCommand.execute().catch((error) => {
		console.error('Error cloning repository:', error);
		throw error;
	});
	return repoPath;
};
  
const createEnvWrapper = async (server: ServerConfig) => {
// Create wrapper to load env variables and run the server
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

	// Create wrapper file
	const wrapperContent = `#!/bin/bash
export $(cat ${envPath} | xargs)
${server.localSetup.command} ${repoPath}/${server.localSetup.entryPoint}`;
	await writeTextFile(wrapperPath, wrapperContent, { baseDir: BaseDirectory.Home });
	// Make the wrapper executable
	await Command.create('chmod', ['+x', wrapperPath]).execute();
} catch (error) {
	console.error('Error creating env wrapper:', error);
}
}

export const checkPrerequisite = async (server: ServerConfig): Promise<string | null> => {
	if (!server.localSetup?.command) {
		return null;
	}

	const packageName = server.localSetup.command === CommandType.Node ? 'npm' : 'uv';

	const command = Command.create('which', [packageName]);
	let installed = false;
	await command.execute().then((result) => {
		if (result.code === 0) {
			installed = true;
		}
	}).catch(() => {
		return null;
	});
	if (installed) {
		console.log(`${packageName} is already installed`);
		return null;
	}
	return `${packageName} is not installed, please install it before continuing`;
}
