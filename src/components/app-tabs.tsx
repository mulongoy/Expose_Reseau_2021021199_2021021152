
import { Tabs } from 'expo-router';

export default function AppTabs() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil' }}
      />

      <Tabs.Screen
        name="equipements"
        options={{ title: 'Équipements' }}
      />

      <Tabs.Screen
        name="explore"
        options={{ title: 'Planning' }}
      />
    </Tabs>
  );
}
