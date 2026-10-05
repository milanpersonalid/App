import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shreenathji.imitation',
  appName: 'Shreenathji Imitation',
  webDir: 'dist',
  // The app uses Supabase and other remote services over HTTPS.
  server: {
    androidScheme: 'https',
  },
};

export default config;
