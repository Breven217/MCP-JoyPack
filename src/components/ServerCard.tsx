import { useState, useRef } from "react";
import { EnvVariable, ServerConfig } from "../types";
import { saveServer, uninstallServer, toggleServerEnabled } from "../fileFunctions";
import Configuration from "./Configuration";
import { ShowNotificationFn, showRestartCascadeNotification } from "../utils/notificationUtils";
import { FaInfoCircle } from "react-icons/fa";
import Tooltip from "./Tooltip";

interface ServerCardProps {
	server: ServerConfig;
	onRefresh: () => void;
	showNotification: ShowNotificationFn;
}

export default function ServerCard({ server, onRefresh, showNotification }: ServerCardProps) {
	const [isConfigOpen, setIsConfigOpen] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [tooltipVisible, setTooltipVisible] = useState(false);
	const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
	const infoIconRef = useRef<HTMLDivElement>(null);
	
	const handleConfigClick = () => {
		setIsConfigOpen(true);
	};
	
	const handleConfigClose = () => {
		setIsConfigOpen(false);
	};
	
	const handleConfigSave = async (envVars: Record<string, EnvVariable>) => {
		setIsProcessing(true);
		
		try {
			await saveServer(server, envVars);
			
			// Show notification to restart Cascade
			showRestartCascadeNotification(showNotification);
			
			// Refresh the server list
			onRefresh();
			
			// Close the modal
			handleConfigClose();
		} catch (error) {
			console.error('Error saving configuration:', error);
			showNotification('Error saving configuration', 'error');
		} finally {
			setIsProcessing(false);
		}
	};
	
	const handleUninstall = async () => {
		setIsProcessing(true);
		
		try {
			await uninstallServer(server);
			
			// Show notification to restart Cascade
			showRestartCascadeNotification(showNotification);
			
			onRefresh();
		} catch (error) {
			console.error('Error uninstalling server:', error);
			showNotification('Error uninstalling server', 'error');
		} finally {
			setIsProcessing(false);
		}
	};
	
	const handleToggleEnabled = async () => {
		setIsProcessing(true);
		
		try {
			await toggleServerEnabled(server);
			
			// Show notification to restart Cascade
			showRestartCascadeNotification(showNotification);
			
			onRefresh();
		} catch (error) {
			console.error('Error toggling server state:', error);
			showNotification('Error toggling server state', 'error');
		} finally {
			setIsProcessing(false);
		}
	};
	
	return (
		<>
			<div key={server.name} className={`server-card ${server.installed ? 'installed' : 'available'}`}>
				{server.installed && (
					<span 
						className={`status-indicator ${server.mcpConfig?.disabled ? 'status-disabled' : 'status-enabled'}`}
						onClick={handleToggleEnabled}
						title={server.mcpConfig?.disabled ? 'Server disabled - Click to enable' : 'Server enabled - Click to disable'}
					></span>
				)}
				{/* Removed Available indicator */}
				
				<h3>
					{server.displayName}
					<div 
						className="info-icon-container"
						ref={infoIconRef}
						onMouseEnter={() => {
							if (infoIconRef.current) {
								const rect = infoIconRef.current.getBoundingClientRect();
								setTooltipPosition({
									x: rect.left + rect.width / 2,
									y: rect.top - 10
								});
								setTooltipVisible(true);
							}
						}}
						onMouseLeave={() => setTooltipVisible(false)}
					>
						<FaInfoCircle className="info-icon" />
					</div>
				</h3>
				
				<div className="server-actions">
					{server.installed ? (
					<>
						{server.docsUrl && (
						<a href={server.docsUrl} target="_blank" rel="noreferrer" className="server-action-btn primary-action">
							Docs
						</a>
						)}
						<button className="server-action-btn secondary-action" onClick={handleConfigClick} disabled={isProcessing}>Config</button>
						<button className="server-action-btn danger-action" onClick={handleUninstall} disabled={isProcessing}>
							{isProcessing ? 'Processing...' : 'Uninstall'}
						</button>
					</>
					) : (
					<button className="server-action-btn primary-action" onClick={handleConfigClick} disabled={isProcessing}>
						{isProcessing ? 'Processing...' : 'Install'}
					</button>
					)}
				</div>
			</div>
			
			{/* Configuration Modal */}
			{isConfigOpen && (
				<Configuration
					server={server}
					isOpen={isConfigOpen}
					onClose={handleConfigClose}
					onSave={handleConfigSave}
					isInstall={!server.installed}
					isLoading={isProcessing}
				/>
			)}
			
			{/* Tooltip */}
			<Tooltip
				text={server.description}
				visible={tooltipVisible}
				position={tooltipPosition}
			/>
		</>
	);
};