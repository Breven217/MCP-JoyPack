import { ServerConfig } from "../types";
import { Command } from "@tauri-apps/plugin-shell";
import eventBus from "../utils/eventBus";

const PREREQUISITES = {
	Node: {
		name: 'node',
		commands: [
			['install', 'node'],
		]
	},
	UV: {
		name: 'uv',
		commands: [
			['install', 'uv'],
		]
	},
	PNPM: {
		name: 'pnpm',
		commands: [
			['install', 'pnpm'],
		]
	}
}
export const checkPrerequisite = async (server: ServerConfig): Promise<string | null> => {
	if (!server.prerequisites) {
		return null;
	}

	// Emit event for checking prerequisites
	eventBus.updateInstallationProgress({
		server: server.name,
		step: 'Prerequisites Check',
		status: 'in-progress',
		message: 'Checking required prerequisites...',
	});

	const refreshCommand = Command.create('refresh-terminal');
	await refreshCommand.execute();

	for (const prerequisite of server.prerequisites) {
		const command = Command.create('which', [prerequisite]);
		let installed = false;
		await command.execute().then((result) => {
			if (result.code === 0) {
				installed = true;
			}
		})
		if (installed) {
			eventBus.updateInstallationProgress({
				server: server.name,
				step: `Prerequisite: ${prerequisite}`,
				status: 'complete',
				message: `${prerequisite} is already installed`,
			});
			continue;
		}
		eventBus.updateInstallationProgress({
			server: server.name,
			step: `Prerequisite: ${prerequisite}`,
			status: 'in-progress',
			message: `Installing ${prerequisite}...`,
		});
		
		const prereq = Object.values(PREREQUISITES).find(p => p.name === prerequisite);
		if (!prereq) {
			eventBus.updateInstallationProgress({
				server: server.name,
				step: `Prerequisite: ${prerequisite}`,
				status: 'error',
				message: `Prerequisite ${prerequisite} not found in configuration`,
			});
			return `Prerequisite ${prerequisite} not found`;
		}

		for (const command of prereq.commands) {
			const installCommand = Command.create('brew', command);
			try {
				await installCommand.execute();
			} catch (error: any) {
				console.error(`Error installing ${prerequisite}:`, error);
				eventBus.updateInstallationProgress({
					server: server.name,
					step: `Prerequisite: ${prerequisite}`,
					status: 'error',
					message: `Error installing ${prerequisite}: ${error.message}`,
				});
				return `Error installing ${prerequisite}: ${error.message}`;
			}
		}
		
		// Mark prerequisite as successfully installed
		eventBus.updateInstallationProgress({
			server: server.name,
			step: `Prerequisite: ${prerequisite}`,
			status: 'complete',
			message: `${prerequisite} installed successfully`,
		});
	}

	// All prerequisites are installed
	eventBus.updateInstallationProgress({
		server: server.name,
		step: 'Prerequisites Check',
		status: 'complete',
		message: 'All prerequisites are installed',
	});
	return null;
}