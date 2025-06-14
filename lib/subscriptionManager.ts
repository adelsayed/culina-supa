/**
 * Subscription Manager to prevent MaxSubscriptionsReachedError
 * Helps manage and cleanup GraphQL subscriptions properly
 */

type Subscription = {
  unsubscribe: () => void;
};

class SubscriptionManager {
  private subscriptions = new Map<string, Subscription>();
  private maxSubscriptions = 15; // Keep below AWS limit of 20

  /**
   * Add a subscription with a unique key
   */
  add(key: string, subscription: Subscription): void {
    // Clean up existing subscription with same key
    this.remove(key);

    // Check if we're approaching the limit
    if (this.subscriptions.size >= this.maxSubscriptions) {
      console.warn(`Approaching subscription limit (${this.subscriptions.size}/${this.maxSubscriptions}). Consider cleaning up unused subscriptions.`);
    }

    this.subscriptions.set(key, subscription);
    console.log(`Added subscription: ${key} (Total: ${this.subscriptions.size})`);
  }

  /**
   * Remove and unsubscribe a specific subscription
   */
  remove(key: string): void {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
      console.log(`Removed subscription: ${key} (Total: ${this.subscriptions.size})`);
    }
  }

  /**
   * Remove all subscriptions (useful for cleanup)
   */
  removeAll(): void {
    console.log(`Cleaning up all ${this.subscriptions.size} subscriptions`);
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Get current subscription count
   */
  getCount(): number {
    return this.subscriptions.size;
  }

  /**
   * List all active subscription keys
   */
  listKeys(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager();

/**
 * Hook to automatically manage subscriptions in React components
 */
export const useSubscriptionCleanup = (componentName: string) => {
  const cleanup = () => {
    // Remove subscriptions that start with the component name
    const keysToRemove = subscriptionManager.listKeys().filter(key => 
      key.startsWith(componentName)
    );
    keysToRemove.forEach(key => subscriptionManager.remove(key));
  };

  return { cleanup };
};