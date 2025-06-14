import { useEffect, useRef } from 'react';
import { subscriptionManager } from '../lib/subscriptionManager';

/**
 * Custom hook for managing Amplify subscriptions safely
 * Automatically handles cleanup and prevents subscription leaks
 */
export const useAmplifySubscription = (
  subscriptionKey: string,
  createSubscription: () => { subscribe: (callbacks: any) => any } | null,
  dependencies: any[] = []
) => {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const setupSubscription = () => {
      const observableQuery = createSubscription();
      
      if (!observableQuery || !mountedRef.current) {
        return;
      }

      const subscription = observableQuery.subscribe({
        next: (data: any) => {
          if (mountedRef.current) {
            // Handle data updates here
            console.log(`Subscription ${subscriptionKey} received data:`, data);
          }
        },
        error: (error: any) => {
          if (mountedRef.current) {
            console.error(`Subscription ${subscriptionKey} error:`, error);
          }
        }
      });

      // Register with subscription manager
      subscriptionManager.add(subscriptionKey, subscription);
    };

    setupSubscription();

    return () => {
      mountedRef.current = false;
      subscriptionManager.remove(subscriptionKey);
    };
  }, dependencies);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      subscriptionManager.remove(subscriptionKey);
    };
  }, []);

  return {
    isActive: () => mountedRef.current
  };
};

/**
 * Simplified hook for common use cases
 */
export const useAmplifyQuery = <T>(
  subscriptionKey: string,
  queryFn: () => any,
  onData: (data: T[]) => void,
  onError?: (error: any) => void,
  dependencies: any[] = []
) => {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const setupSubscription = () => {
      if (!mountedRef.current) return;

      const subscription = queryFn().subscribe({
        next: ({ items }: { items: T[] }) => {
          if (mountedRef.current) {
            onData(items);
          }
        },
        error: (error: any) => {
          if (mountedRef.current) {
            console.error(`Query ${subscriptionKey} error:`, error);
            onError?.(error);
          }
        }
      });

      subscriptionManager.add(subscriptionKey, subscription);
    };

    setupSubscription();

    return () => {
      mountedRef.current = false;
      subscriptionManager.remove(subscriptionKey);
    };
  }, dependencies);

  return {
    isActive: () => mountedRef.current
  };
};