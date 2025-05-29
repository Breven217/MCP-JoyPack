import { ServerConfig } from "../types";
import { Command } from "@tauri-apps/plugin-shell";

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
	Vault: {
		name: 'vault',
		commands: [
			['tap', 'hashicorp/tap'],
			['install', 'hashicorp/tap/vault'],
		]
	}
}
export const checkPrerequisite = async (server: ServerConfig): Promise<string | null> => {
	if (!server.localSetup?.prerequisites) {
		return null;
	}

	const refreshCommand = Command.create('refresh-terminal');
	await refreshCommand.execute();

	for (const prerequisite of server.localSetup.prerequisites) {
		const command = Command.create('which', [prerequisite]);
		let installed = false;
		await command.execute().then((result) => {
			if (result.code === 0) {
				installed = true;
			}
		})
		if (installed) {
			console.log(`${prerequisite} is already installed`);
			continue;
		}
		console.log(`Installing ${prerequisite}`);
		
		const prereq = Object.values(PREREQUISITES).find(p => p.name === prerequisite);
		if (!prereq) {
			return `Prerequisite ${prerequisite} not found`;
		}

		for (const command of prereq.commands) {
			const installCommand = Command.create('brew', command);
			await installCommand.execute().catch((error) => {
				console.error(`Error installing ${prerequisite}:`, error);
				return `Error installing ${prerequisite}: ${error.message}`;
			});
		}
	}

	return null;
}