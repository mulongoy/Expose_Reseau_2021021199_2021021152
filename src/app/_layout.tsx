import { initDatabase } from '@/database/database';
import {
  DarkTheme,
  DefaultTheme,
  Tabs,
  ThemeProvider,
} from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initDatabase()
      .then(() => console.log('Base de données initialisée avec succès'))
      .catch((error) => console.error('Erreur SQLite :', error));
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tabs>
        <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
        <Tabs.Screen name="equipements" options={{ title: 'Équipements' }} />
        <Tabs.Screen name="techniciens" options={{ title: 'Techniciens' }} />
        <Tabs.Screen name="planning" options={{ title: 'Planning' }} />
        <Tabs.Screen name="interventions" options={{ title: 'Interventions' }} />
        <Tabs.Screen name="diagnostic" options={{ title: 'Diagnostic réseau' }} />
        <Tabs.Screen name="localisation" options={{ title: 'Géolocalisation' }} />
        <Tabs.Screen name="camera" options={{ title: 'Caméra' }} />
        <Tabs.Screen name="audio" options={{ title: 'Mémos vocaux' }} />
        <Tabs.Screen name="contacts" options={{ title: 'Contacts' }} />
        <Tabs.Screen name="notifications" options={{ title: 'Notifications' }} />
      </Tabs>
    </ThemeProvider>
  );
}
