import { useState, useRef, useMemo, useCallback } from "react";
import { EnvVariable, ServerConfig } from "../types";
import Configuration from "./Configuration";
import { ShowNotificationFn } from "../utils/notificationUtils";
import { FaInfoCircle } from "react-icons/fa";
import Tooltip from "./Tooltip";
import { useServerActions } from "../hooks/useServerActions";

interface ServerCardProps {
	server: ServerConfig;
	onRefresh: () => void;
	showNotification: ShowNotificationFn;
}

export default function ServerCard({ server, onRefresh, showNotification }: ServerCardProps) {
	const [isConfigOpen, setIsConfigOpen] = useState(false);
	const [tooltipVisible, setTooltipVisible] = useState(false);
	const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
	const infoIconRef = useRef<HTMLDivElement>(null);
	
	// Use the custom hook for server actions
	const {
		isProcessing,
		doneProcessing,
		saveServerConfig,
		uninstallServerConfig,
		toggleServerState,
		resetState
	} = useServerActions(server, onRefresh, showNotification);
	
	// Memoize the server status for better performance
	const serverStatus = useMemo(() => {
		return {
			isInstalled: server.installed,
			isDisabled: server.mcpConfig?.disabled,
			statusClass: server.installed ? 'installed' : 'available',
			statusIndicatorClass: server.mcpConfig?.disabled ? 'status-disabled' : 'status-enabled',
			statusTitle: server.mcpConfig?.disabled ? 'Server disabled - Click to enable' : 'Server enabled - Click to disable'
		};
	}, [server.installed, server.mcpConfig?.disabled]);
	
	// Use useCallback for event handlers to prevent unnecessary re-renders
	const handleConfigClick = useCallback(() => {
		setIsConfigOpen(true);
	}, []);
	
	const handleConfigClose = useCallback(() => {
		setIsConfigOpen(false);
		resetState();
		onRefresh();
	}, [resetState, onRefresh]);
	
	const handleConfigSave = useCallback(async (envVars: Record<string, EnvVariable>) => {
		await saveServerConfig(envVars);
		if (server.installed) {
			handleConfigClose();
		}
	}, [saveServerConfig]);
	
	const handleUninstall = useCallback(async () => {
		await uninstallServerConfig();
	}, [uninstallServerConfig]);
	
	const handleToggleEnabled = useCallback(async () => {
		await toggleServerState();
	}, [toggleServerState]);
	
	return (
		<>
			<div key={server.name} className={`server-card ${serverStatus.statusClass}`}>
				{serverStatus.isInstalled && (
					<span 
						className={`status-indicator ${serverStatus.statusIndicatorClass}`}
						onClick={handleToggleEnabled}
						title={serverStatus.statusTitle}
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
					doneProcessing={doneProcessing}
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