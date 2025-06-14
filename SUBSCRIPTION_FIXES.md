# AWS Amplify Subscription Management Fixes

## Problem
The app was experiencing `MaxSubscriptionsReachedError: Max number of 20 subscriptions reached` due to improper cleanup of GraphQL subscriptions.

## Root Causes
1. **Improper cleanup**: Subscriptions weren't being unsubscribed properly in component unmount
2. **Race conditions**: Components mounting/unmounting rapidly could create multiple subscriptions
3. **No centralized management**: No way to track or limit active subscriptions
4. **Missing auth checks**: Subscriptions were created even when user wasn't authenticated

## Solutions Implemented

### 1. Subscription Manager (`lib/subscriptionManager.ts`)
- **Centralized tracking**: All subscriptions are registered with unique keys
- **Automatic cleanup**: Provides methods to clean up individual or all subscriptions
- **Limit monitoring**: Warns when approaching AWS limit of 20 subscriptions
- **Debug utilities**: Helps identify subscription leaks

### 2. Fixed Component Subscriptions

#### MyRecipesWithAmplify.tsx
- ✅ **Proper cleanup**: Subscription is properly unsubscribed on unmount
- ✅ **Auth checking**: Only creates subscription when user is authenticated
- ✅ **Unique keys**: Uses `MyRecipes-${userId}` as subscription key
- ✅ **Mount guards**: Checks if component is still mounted before state updates

#### TodoList.tsx
- ✅ **Proper cleanup**: Subscription is properly unsubscribed on unmount
- ✅ **Auth checking**: Only creates subscription when user is authenticated
- ✅ **Unique keys**: Uses `TodoList-${userId}` as subscription key
- ✅ **Mount guards**: Checks if component is still mounted before state updates

### 3. Enhanced AuthContext (`lib/AuthContext.tsx`)
- ✅ **Global cleanup**: Cleans up all subscriptions on sign out
- ✅ **State change handling**: Removes subscriptions when auth state changes

### 4. Debug Monitoring (`lib/subscriptionDebug.ts`)
- 🔍 **Real-time monitoring**: Logs subscription count and active keys
- ⚠️ **Leak detection**: Warns about potential memory leaks
- 📊 **Status reporting**: Shows current subscription usage vs AWS limits

### 5. Custom Hooks (`hooks/useAmplifySubscription.ts`)
- 🎣 **Reusable patterns**: Provides hooks for safe subscription management
- 🛡️ **Built-in safety**: Automatic cleanup and mount checking
- 🔧 **Easy to use**: Simplifies subscription setup in components

## Usage Examples

### Using Subscription Manager Directly
```typescript
import { subscriptionManager } from '../lib/subscriptionManager';

// In component
useEffect(() => {
  const subscription = amplifyClient.models.Recipe.observeQuery().subscribe({
    next: (data) => { /* handle data */ },
    error: (error) => { /* handle error */ }
  });

  // Register with manager
  subscriptionManager.add('MyComponent-Recipe', subscription);

  return () => {
    subscriptionManager.remove('MyComponent-Recipe');
  };
}, []);
```

### Using Custom Hook
```typescript
import { useAmplifyQuery } from '../hooks/useAmplifySubscription';

// In component
useAmplifyQuery(
  'MyComponent-Recipe',
  () => amplifyClient.models.Recipe.observeQuery(),
  (recipes) => setRecipes(recipes),
  (error) => console.error(error),
  [userId]
);
```

## Best Practices

### ✅ Do's
- Always use unique subscription keys
- Check auth state before creating subscriptions
- Use the subscription manager for tracking
- Include user ID in subscription keys when relevant
- Clean up subscriptions on component unmount
- Use mount guards to prevent state updates on unmounted components

### ❌ Don'ts
- Don't create subscriptions without cleanup
- Don't ignore auth state when creating subscriptions
- Don't create multiple subscriptions for the same data
- Don't forget to unsubscribe on component unmount
- Don't create subscriptions in render functions

## Monitoring

### Check Subscription Status
```typescript
import { subscriptionDebug } from '../lib/subscriptionDebug';

// Log current status
subscriptionDebug.logStatus();

// Check for potential leaks
subscriptionDebug.checkForLeaks();
```

### Console Output
The debug system will automatically log:
- When subscriptions are added/removed
- Current subscription count vs AWS limits
- Warnings when approaching limits
- Potential memory leak detection

## AWS Limits
- **Maximum subscriptions**: 20 per client
- **Recommended limit**: Keep under 15 to allow headroom
- **Timeout**: Subscriptions auto-close after 2 hours of inactivity

## Testing
To test the fixes:
1. Navigate between screens rapidly
2. Sign in/out multiple times
3. Check console for subscription count logs
4. Verify no `MaxSubscriptionsReachedError` occurs

## Future Improvements
1. **Connection pooling**: Share subscriptions across components when possible
2. **Lazy loading**: Only create subscriptions when data is actually needed
3. **Subscription caching**: Cache subscription results to reduce duplicate queries
4. **Auto-reconnection**: Handle network disconnections gracefully