import { readTextFile, writeTextFile, BaseDirectory, remove, exists } from '@tauri-apps/plugin-fs';
import { EnvVariable, ServerConfig, ServersObject } from '../types'; 
import { setupLocal, tearDownLocalRepo } from './local';
import { CONFIG_PATH, ENV_PATH, HOME_PATH, REMOTE_CONFIG_URL } from './config';

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
    console.log('Fetching server configs from GitHub');
    const response = await fetch(REMOTE_CONFIG_URL, { cache: 'no-cache' });
    
    if (response.ok) {
      const responseText = await response.text();
      console.log('Response:', responseText);
      const jsonContent = JSON.parse(responseText);
      console.log('Parsed JSON:', jsonContent);
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
}

const installServer = async (server: ServerConfig) => {
  try {
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
    server.mcpConfig = JSON.parse(JSON.stringify(server.mcpConfig).replace(/~/g, HOME_PATH));
    jsonContent.mcpServers[server.name] = server.mcpConfig;

    // Write updated config
    await writeTextFile(CONFIG_PATH, JSON.stringify(jsonContent, null, 2), { baseDir: BaseDirectory.Home });

    // Install repo if specified
    if (server.localSetup?.repo) {
      await setupLocal(server);
    }
    return true;
  } catch (error) {
    console.error('Error installing server:', error);
    return false;
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
    if (server.localSetup?.repo) {
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
    // Map envVars to a Record<string, string>
    const stringEnvVars: Record<string, string> = {};
    for (const [key, value] of Object.entries(envVars)) {
      stringEnvVars[key] = value.value;
    }
    // Replace all instances of ~/ with the home directory path
    const cleanEnvVars = JSON.parse(JSON.stringify(stringEnvVars).replace(/~/g, HOME_PATH));
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
