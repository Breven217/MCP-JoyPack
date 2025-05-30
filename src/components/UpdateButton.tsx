import React, { useState } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import { FaDownload } from 'react-icons/fa';

// Get the version from the environment or use a default
const appVersion = '0.1.0'; // You can update this manually or get it from your build process

interface UpdateButtonProps {
  className?: string;
}

const UpdateButton: React.FC<UpdateButtonProps> = ({ className = '' }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

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
        <span className="version-label">Version: {appVersion}</span>
        <button
          className={`update-button ${isUpdating ? 'updating' : ''}`}
          onClick={handleUpdate}
          disabled={isUpdating}
          title="Check for updates"
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