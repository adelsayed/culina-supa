import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { useAuth } from './AuthContext';
import { useEffect, useState } from 'react';

// Create a custom hook to handle Amplify client with Supabase auth
export const useAmplifyClient = () => {
  const { session } = useAuth();
  const [client, setClient] = useState<ReturnType<typeof generateClient<Schema>> | null>(null);

  useEffect(() => {
    // generateClient should pick up global config from Amplify.configure in App.tsx
    const amplifyClient = generateClient<Schema>({
      authMode: 'apiKey',
      headers: async () => ({
        'x-supabase-token': session?.access_token || '',
      }),
    });

    console.log("Amplify Client generated:", amplifyClient);
    console.log("Amplify Client Models:", amplifyClient.models);
    console.log("Amplify Client Todo Model:", amplifyClient.models.Todo);

    setClient(amplifyClient);
  }, [session]); // Re-generate client when session changes.

  return client;
}; 