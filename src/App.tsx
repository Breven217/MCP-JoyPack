import { useState, useEffect } from "react";
import "./styles/App.css";
import ServerCard from "./components/ServerCard";
import { getServers } from "./fileFunctions";
import { ServerConfig } from "./types";

function App() {
  const [installedServers, setInstalledServers] = useState<ServerConfig[]>([]);
  const [availableServers, setAvailableServers] = useState<ServerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get MCP server information
  const fetchMCPServers = async () => {
    try {
      setLoading(true);
      
      const servers = await getServers();
      
      setInstalledServers(servers?.installed || []);
      setAvailableServers(servers?.available || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching MCP servers:', err);
      setError('Failed to load MCP server information');
    } finally {
      setLoading(false);
    }
  };

  // Load server data on component mount
  useEffect(() => {
    fetchMCPServers();
  }, []);

  return (
    <main className="container">
      <div className="app-header">
        <div className="app-logo">M</div>
        <div className="header-content">
          <h1>MCP JoyPack Dashboard</h1>
          <p>Manage your Model Context Protocol servers</p>
        </div>
        <button className="refresh-btn" onClick={fetchMCPServers}>
          <span className="refresh-icon">↻</span> Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading MCP server information...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="dashboard">
          <section className="server-section">
            <h2>Installed MCP Servers <span className="server-count">{installedServers.length}</span></h2>
            <div className="server-grid">
              {installedServers.map((server, index) => (
                <ServerCard 
                  key={`installed-${server.name}-${index}`}
                  server={server}
                  onRefresh={fetchMCPServers}
                />
              ))}
            </div>
          </section>
          
          <section className="server-section">
            <h2>Available MCP Servers <span className="server-count">{availableServers.length}</span></h2>
            <div className="server-grid">
              {availableServers.map((server, index) => (
                <ServerCard 
                  key={`available-${server.name}-${index}`}
                  server={server}
                  onRefresh={fetchMCPServers}
                />
              ))}
            </div>
          </section>
          
          <div className="dashboard-footer">
            <p className="dashboard-meta">Last updated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
