import { readTextFile, writeTextFile, BaseDirectory, remove, exists } from '@tauri-apps/plugin-fs';
import { EnvVariable, ServerConfig, ServersObject } from '../types'; 
import { setupLocal, tearDownLocalRepo } from './local';
import { CONFIG_PATH, ENV_PATH, getHomePath, REMOTE_CONFIG_URL } from './config';
import eventBus from '../utils/eventBus';
import { setupNPX } from './npx';
import { setupDockerWrapper } from './docker';

export const getServers = async (): Promise<ServersObject | null> => {
  try {
    const installedServersObj = await readExistingConfigFile();
    const availableServers = await fetchServerConfigs();
    
    if (!installedServersObj || !availableServers) {
      return null;
    }
    
    const installedServerNames: string[] = Object.keys(installedServersObj);
    
    const installedServerConfigs = installedServerNames.map(serverName => {
      const serverConfig = availableServers.find(s => s.name === serverName);
      const installedConfig = installedServersObj[serverName];
      if (serverConfig) {
        return {
          ...serverConfig,
          installed: true,
          mcpConfig: installedConfig
        };
      }
      return null;
    }).filter(Boolean) as ServerConfig[];
    
    const availableServerConfigs = availableServers
      .filter(server => !installedServerNames.includes(server.name))
      .map(server => ({
        ...server,
        installed: false
      }));
    
    return {
      installed: installedServerConfigs,
      available: availableServerConfigs
    };
  } catch (error) {
    console.error('Error getting servers:', error);
    return null; 
  }
}

const readExistingConfigFile = async (): Promise<Record<string, any> | null> => {
  try {
    const configContent = await readTextFile(CONFIG_PATH, { baseDir: BaseDirectory.Home });
    const jsonContent = JSON.parse(configContent);
    return jsonContent.mcpServers;
  } catch (error) {
    console.error('Error reading config file:', error);
    return null;
  }
};

/**
 * Fetch server configurations from GitHub
 */
const fetchServerConfigs = async (): Promise<ServerConfig[] | null> => {
  try {
    // Fetch from remote source
    const response = await fetch(REMOTE_CONFIG_URL, { cache: 'no-cache' });
    
    if (response.ok) {
      const responseText = await response.text();
      const jsonContent = JSON.parse(responseText);
      const servers: ServerConfig[] = [];
      
      for (const serverName in jsonContent) {
        const server = jsonContent[serverName];
        servers.push(server);
      }

      return servers;
    } else {
      console.error(`Failed to fetch remote config: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching server configs:', error);
    return null;
  }
};

export const saveServer = async (server: ServerConfig, envVars: Record<string, EnvVariable>) => {
  if (!server.installed) {
    await installServer(server);
  }
  await saveEnvFile(server, envVars);
  await saveMcpConfig(server);
}

const installServer = async (server: ServerConfig) => {
  try {
    if (server.localSetup) {
      await setupLocal(server);
    } else if (server.npxSetup) {
      await setupNPX(server);
    } else if (server.dockerWrapper) {
      await setupDockerWrapper(server);
    }

    return true;
  } catch (error) {
    console.error('Error installing server:', error);
    return false;
  }
}

const saveMcpConfig = async (server: ServerConfig) => {
  if (!server.installed){
    // Update progress
    eventBus.updateInstallationProgress({
      server: server.name,
      step: 'MCP Configuration',
      status: 'in-progress',
      message: 'Saving MCP configuration...',
    });
  }

  // Make sure the mcp config file exists
  const configExists = await exists(CONFIG_PATH, { baseDir: BaseDirectory.Home });
  if (!configExists) {
    await writeTextFile(CONFIG_PATH, JSON.stringify({ mcpServers: {} }, null, 2), { baseDir: BaseDirectory.Home });
  }

  // Read existing config
  const configContent = await readTextFile(CONFIG_PATH, { baseDir: BaseDirectory.Home });
  const jsonContent = JSON.parse(configContent);

  // Ensure mcpServers object exists
  if (!jsonContent.mcpServers) {
    jsonContent.mcpServers = {};
  }

  // Add server to installed servers
  // replace all instances of "~/" with the home directory
  const homePath = await getHomePath();
  server.mcpConfig = JSON.parse(JSON.stringify(server.mcpConfig).replace(/~/g, homePath));
  jsonContent.mcpServers[server.name] = server.mcpConfig;

  // Write updated config
  await writeTextFile(CONFIG_PATH, JSON.stringify(jsonContent, null, 2), { baseDir: BaseDirectory.Home });

  if (!server.installed){
    // Update progress
    eventBus.updateInstallationProgress({
      server: server.name,
      step: 'MCP Configuration',
      status: 'complete',
      message: 'MCP configuration saved successfully',
    });
  }
}

export const uninstallServer = async (server: ServerConfig) => {
  try {
    const configContent = await readTextFile(CONFIG_PATH, { baseDir: BaseDirectory.Home });
    const jsonContent = JSON.parse(configContent);

    // Remove server from mcpServers
    if (jsonContent.mcpServers && jsonContent.mcpServers[server.name]) {
      delete jsonContent.mcpServers[server.name];
    }

    await writeTextFile(CONFIG_PATH, JSON.stringify(jsonContent, null, 2), { baseDir: BaseDirectory.Home });
    await deleteEnvFile(server);

    // Tear down repo if specified
    if (server.localSetup) {
      await tearDownLocalRepo(server);
    }
    
    return true;
  } catch (error) {
    console.error('Error uninstalling server:', error);
    return false;
  }
}

export const readEnvFile = async (server: ServerConfig) => {
  try {
    const envContent = await readTextFile(`${ENV_PATH}/${server.name}.env`, { baseDir: BaseDirectory.Home });
    const lines = envContent.split('\n');
    for (const line of lines) {
      const [key, value] = line.split('=');
      const envVar = server.env[key];
      if (envVar) {
        envVar.value = value;
      }
    }
    return server.env;
  } catch (error) {
    console.error('Error reading env file:', error);
    return null;
  }
}

const deleteEnvFile = async (server: ServerConfig) => {
  try {
    // if the env file doesn't exist, skip
    const envExists = await exists(`${ENV_PATH}/${server.name}.env`, { baseDir: BaseDirectory.Home });
    if (!envExists) {
      return;
    }

    await remove(`${ENV_PATH}/${server.name}.env`, { baseDir: BaseDirectory.Home });
  } catch (error) {
    console.error('Error deleting env file:', error);
  }
}

const saveEnvFile = async (server: ServerConfig, envVars: Record<string, EnvVariable>) => {
  try {
    // Create a flat object with string values
    const stringEnvVars: Record<string, string> = {};
    for (const [key, value] of Object.entries(envVars)) {
      stringEnvVars[key] = value.value;
    }
    // Replace all instances of ~/ with the home directory path
    const homePath = await getHomePath();
    const cleanEnvVars = JSON.parse(JSON.stringify(stringEnvVars).replace(/~/g, homePath));
    let envString = '';
    for (const [key, value] of Object.entries(cleanEnvVars)) {
      envString += `${key}=${value}\n`;
    }
    await writeTextFile(`${ENV_PATH}/${server.name}.env`, envString, { baseDir: BaseDirectory.Home });
  } catch (error) {
    console.error('Error saving env file:', error);
  }
}

export const toggleServerEnabled = async (server: ServerConfig) => {
  try {
    const configContent = await readTextFile(CONFIG_PATH, { baseDir: BaseDirectory.Home });
    const jsonContent = JSON.parse(configContent);

    // Toggle the enabled state
    jsonContent.mcpServers[server.name].disabled = !jsonContent.mcpServers[server.name].disabled;

    // Write updated config
    await writeTextFile(CONFIG_PATH, JSON.stringify(jsonContent, null, 2), { baseDir: BaseDirectory.Home });
  } catch (error) {
    console.error('Error toggling server enabled state:', error);
  }
}