type EventCallback = (...args: any[]) => void;

interface EventMap {
  [eventName: string]: EventCallback[];
}

export type InstallationStep = {
  server: string;
  step: string;
  status: 'pending' | 'in-progress' | 'complete' | 'error';
  message?: string;
};

class EventBus {
  private events: EventMap = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
  }

  // Installation specific methods
  updateInstallationProgress(data: InstallationStep) {
    this.emit('installation-progress', data);
  }
}

export default new EventBus();
