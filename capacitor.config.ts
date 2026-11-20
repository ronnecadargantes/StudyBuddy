import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ronnecadargantes.studybuddy',
  appName: 'StudyBuddy',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
