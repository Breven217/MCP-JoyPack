export type ServersObject = {
	installed: ServerConfig[];
	available: ServerConfig[];
}

export type ServerConfig = {
	name: string;
	installed: boolean;
	displayName: string;
	description: string;
	docsUrl: string;
	mcpConfig: MCPServerConfig;
	env: Record<string, string>;
	localSetup: LocalSetup;
}

export type MCPServerConfig = {
	command: string;
	disabledTools: string[];
	args: string[];
	disabled?: boolean;
}

export type LocalSetup = {
	repo?: string;
	command?: string;
	entryPoint?: string;
}