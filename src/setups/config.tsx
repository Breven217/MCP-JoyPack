import { homeDir } from "@tauri-apps/api/path";

export const CONFIG_PATH = ".codeium/windsurf/mcp_config.json";
export const ENV_PATH = ".mcp";
export const REPO_PATH = ".mcp/repos";

// Instead of using top-level await, create a function to get the home directory
let cachedHomePath: string | null = null;

export const getHomePath = async (): Promise<string> => {
  if (!cachedHomePath) {
    cachedHomePath = await homeDir();
  }
  return cachedHomePath;
};

export const REMOTE_CONFIG_URL = `https://gist.githubusercontent.com/Breven217/78add136e29ae98a8ed1a2c28d4f8d80/raw/server-config.json`;
