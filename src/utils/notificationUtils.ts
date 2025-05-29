// Utility functions for notifications

/**
 * Type definition for notification handlers
 */
export type ShowNotificationFn = (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;

/**
 * Default message for Cascade restart notification
 */
export const RESTART_CASCADE_MESSAGE = "Configuration updated. Please restart Cascade or refresh Plugins for changes to take effect.";

/**
 * Show a notification to restart Cascade
 * @param showNotification Function to show notification
 */
export const showRestartCascadeNotification = (showNotification: ShowNotificationFn): void => {
  showNotification(RESTART_CASCADE_MESSAGE, 'info');
};
