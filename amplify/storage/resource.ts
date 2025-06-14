import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'recipe-images',
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['read', 'write']), // Public read and write access for all files under public/
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});