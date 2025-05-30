import { useState, useEffect, useCallback } from "react";
import "./styles/App.css";
import ServerCard from "./components/ServerCard";
import Notification from "./components/Notification";
import { getServers } from "./setups/configs";
import { ServerConfig } from "./types";
import { ShowNotificationFn } from "./utils/notificationUtils";

function App() {
  const [installedServers, setInstalledServers] = useState<ServerConfig[]>([]);
  const [availableServers, setAvailableServers] = useState<ServerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  }>({ visible: false, message: '', type: 'info' });

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
  
  // Generic function to show notifications
  const showNotification: ShowNotificationFn = useCallback((message, type = 'info') => {
    setNotification({
      visible: true,
      message,
      type
    });
  }, []);
  
  // Close notification
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  // No update functions

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
          <div className="version-info">Version 0.1.0</div>
        </div>
        <button className="refresh-btn" onClick={async () => {
          // Force refresh from GitHub before fetching servers
          await fetchMCPServers();
        }}>
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
                  showNotification={showNotification}
                />
              ))}
            </div>
          </section>
          
          <section className="server-section">
            <h2>Available MCP Servers <span className="server-count">{availableServers.length}</span></h2>
            {availableServers.length > 0 ? (
              <div className="server-grid">
                {availableServers.map((server, index) => (
                  <ServerCard 
                    key={`available-${server.name}-${index}`}
                    server={server}
                    onRefresh={fetchMCPServers}
                    showNotification={showNotification}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <p className="empty-state-text">No additional MCP servers available at this time. Check back later for new servers.</p>
              </div>
            )}
          </section>
        </div>
      )}
      
      {/* Notification for Cascade restart */}
      <Notification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
        duration={5000} // Show for 5 seconds
      />
    </main>
  );
}

export default App;
