import { ServerConfig } from "../types";
import { HOME_PATH } from './config';
import { Command } from "@tauri-apps/plugin-shell";
import { executeInstallStep } from '../utils/installUtils';

/**
 * Build BambooHR dependencies and set up environment
 * @param server Server configuration
 */
export const bambooBuild = async (server: ServerConfig): Promise<void> => {
	const setupRepoPath = `${HOME_PATH}/repos/setup`;
	await executeInstallStep(
		server,
		'Syncing Setup Repository',
		'Fetching and pulling setup repository...',
		Command.create('git-pull-origin', ['-C', setupRepoPath, 'pull', 'origin']),
		'Setup repository synced successfully'
	);

	await executeInstallStep(
		server,
		'Vault Environment Sync',
		'Syncing vault environment...',
		Command.create('vault-sync-env'),
		'Vault environment synced successfully'
	);

	await executeInstallStep(
		server,
		'UV Tool Installation',
		'Installing UV tool...',
		Command.create('uv-tool-install', ['tool', 'install', server.name]),
		'UV tool installed successfully'
	);
}
