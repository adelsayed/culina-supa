import { subscriptionManager } from './subscriptionManager';

/**
 * Debug utilities for monitoring subscription usage
 */

export const subscriptionDebug = {
  /**
   * Log current subscription status
   */
  logStatus: () => {
    const count = subscriptionManager.getCount();
    const keys = subscriptionManager.listKeys();
    
    console.log(`📊 Subscription Status:`);
    console.log(`   Active: ${count}/20 (AWS limit)`);
    console.log(`   Keys: ${keys.join(', ')}`);
    
    if (count > 15) {
      console.warn(`⚠️  High subscription count: ${count}/20`);
    }
  },

  /**
   * Monitor subscription changes
   */
  startMonitoring: () => {
    const originalAdd = subscriptionManager.add.bind(subscriptionManager);
    const originalRemove = subscriptionManager.remove.bind(subscriptionManager);

    subscriptionManager.add = (key: string, subscription: any) => {
      originalAdd(key, subscription);
      subscriptionDebug.logStatus();
    };

    subscriptionManager.remove = (key: string) => {
      originalRemove(key);
      subscriptionDebug.logStatus();
    };

    console.log('🔍 Subscription monitoring started');
  },

  /**
   * Check for potential memory leaks
   */
  checkForLeaks: () => {
    const keys = subscriptionManager.listKeys();
    const duplicateComponents = new Map<string, number>();

    keys.forEach(key => {
      const component = key.split('-')[0];
      duplicateComponents.set(component, (duplicateComponents.get(component) || 0) + 1);
    });

    duplicateComponents.forEach((count, component) => {
      if (count > 1) {
        console.warn(`🚨 Potential leak: ${component} has ${count} active subscriptions`);
      }
    });
  }
};

// Auto-start monitoring in development
if (__DEV__) {
  subscriptionDebug.startMonitoring();
  
  // Check for leaks every 30 seconds
  setInterval(() => {
    subscriptionDebug.checkForLeaks();
  }, 30000);
}