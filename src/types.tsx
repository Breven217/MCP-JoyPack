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
	dockerWrapper: boolean;
	dockerImage: string;
	mcpConfig: MCPServerConfig;
	env: Record<string, EnvVariable>;
	prerequisites?: string[];
	localSetup: LocalSetup;
	npxSetup: NpxSetup;
}

export type MCPServerConfig = {
	command: string;
	disabledTools: string[] | undefined;
	args: string[] | undefined;
	disabled?: boolean;
}

export type EnvVariable = {
	type: EnvType;
	docsUrl?: string;
	description?: string;
	value: string;
}

export type LocalSetup = {
	repo?: string;
	command?: CommandType;
	entryPoint?: string;
	buildCommand?: string;
}

export enum EnvType {
	String = 'string',
	Password = 'password'
}

export enum CommandType {
	Node = 'node',
	UV = 'uv',
	PNPM = 'pnpm',
	NPM = 'npm',
	Docker = 'docker'
}

export type NpxSetup = {
	args: string[];
	package: string;
}
