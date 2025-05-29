/**
 * Event type constants to avoid string literals and typos
 */
export const EventTypes = {
  INSTALLATION_PROGRESS: 'installation-progress',
  SERVER_STATUS_CHANGE: 'server-status-change',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];
