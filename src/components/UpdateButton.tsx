import React, { useState, useEffect } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import { FaDownload } from 'react-icons/fa';

// Import app info from Tauri to get the installed version
import { getVersion } from '@tauri-apps/api/app';

// Interface for GitHub release data
interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
}

interface UpdateButtonProps {
  className?: string;
}

const UpdateButton: React.FC<UpdateButtonProps> = ({ className = '' }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [installedVersion, setInstalledVersion] = useState('0.1.0');
  const [latestVersion, setLatestVersion] = useState('');
  const [checkingVersion, setCheckingVersion] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Fetch both installed version and latest version from GitHub
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setCheckingVersion(true);
        
        // Get installed version from Tauri app info
        try {
          const currentVersion = await getVersion();
          setInstalledVersion(currentVersion);
        } catch (err) {
          console.error('Failed to get installed version:', err);
          // Fallback to default version if we can't get it from Tauri
        }
        
        // Get latest version from GitHub
        try {
          const response = await fetch('https://api.github.com/repos/Breven217/MCP-JoyPack/releases/latest');
          if (response.ok) {
            const data: GitHubRelease = await response.json();
            // Remove 'v' prefix if present
            const versionNumber = data.tag_name.startsWith('v') ? data.tag_name.substring(1) : data.tag_name;
            setLatestVersion(versionNumber);
            
            // Compare versions to see if update is available
            // Simple string comparison works if versions follow semver (e.g., 1.0.0)
            if (versionNumber !== installedVersion) {
              setUpdateAvailable(true);
            }
          }
        } catch (err) {
          console.error('Failed to fetch latest version:', err);
        }
      } finally {
        setCheckingVersion(false);
      }
    };

    fetchVersions();
  }, [installedVersion]);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      setUpdateStatus('Checking for updates...');
      
      // Create a command to run the update script
      const command = Command.create('run-update');
      
      try {
        // Execute the command
        const result = await command.execute();
        
        if (result.code === 0) {
          setUpdateStatus('Update completed successfully! The app will restart automatically...');
        } else {
          setUpdateStatus(`Update failed with code ${result.code}`);
          console.error('Update stderr:', result.stderr);
        }
      } catch (error) {
        console.error('Update error:', error);
        setUpdateStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsUpdating(false);
      }
    } catch (error) {
      console.error('Failed to start update:', error);
      setUpdateStatus(`Failed to start update: ${error instanceof Error ? error.message : String(error)}`);
      setIsUpdating(false);
    }
  };

  return (
    <div className={`update-button-container ${className}`}>
      <div className="version-info">
        <span className="version-label">
          {checkingVersion ? 'Version: ...' : `Version: ${installedVersion}`}
          {updateAvailable && !checkingVersion && (
            <span className="update-badge" title={`Update available: ${latestVersion}`}>•</span>
          )}
        </span>
        <button
          className={`update-button ${isUpdating ? 'updating' : ''} ${updateAvailable ? 'update-available' : ''}`}
          onClick={handleUpdate}
          disabled={isUpdating}
          title={updateAvailable ? `Update to version ${latestVersion}` : "Check for updates"}
        >
          <FaDownload className="icon" />
          {isUpdating ? '...' : ''}
        </button>
      </div>
      {updateStatus && (
        <div className="update-status">
          {updateStatus}
        </div>
      )}

      <style>{`
        .update-button-container {
          display: flex;
          flex-direction: column;
          margin: 5px 0;
        }
        
        .version-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        
        .version-label {
          color: #666;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .update-badge {
          color: #ff6b00;
          font-size: 18px;
          line-height: 1;
          animation: pulse 1.5s infinite;
        }
        
        .update-button {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 4px;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
          transition: all 0.2s ease;
        }
        
        .update-button:hover {
          background-color: #45a049;
          transform: scale(1.05);
        }
        
        .update-button.updating {
          background-color: #FFA500;
          cursor: not-allowed;
          animation: pulse 1.5s infinite;
        }
        
        .update-button.update-available {
          background-color: #ff6b00;
        }
        
        .update-button.update-available:hover {
          background-color: #ff8c00;
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        
        .update-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .icon {
          font-size: 12px;
        }
        
        .update-status {
          margin-top: 4px;
          font-size: 10px;
          color: #666;
          font-style: italic;
          max-width: 200px;
        }
      `}</style>
    </div>
  );
};

export default UpdateButton;