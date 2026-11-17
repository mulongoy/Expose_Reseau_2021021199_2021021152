
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getEquipements,
  getInterventions,
  getMaintenances,
  getTechniciens,
} from '@/database/database';

export default function HomeScreen() {
  const router = useRouter();

  const [equipements, setEquipements] = useState(0);
  const [techniciens, setTechniciens] = useState(0);
  const [interventions, setInterventions] = useState(0);
  const [maintenances, setMaintenances] = useState(0);

  const chargerStatistiques = useCallback(async () => {
    try {
      const listeEquipements = await getEquipements();
      const listeTechniciens = await getTechniciens();
      const listeInterventions = await getInterventions();
      const listeMaintenances = await getMaintenances();

      setEquipements(listeEquipements.length);
      setTechniciens(listeTechniciens.length);
      setInterventions(listeInterventions.length);
      setMaintenances(listeMaintenances.length);
    } catch (error) {
      console.error('Erreur de chargement des statistiques :', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      chargerStatistiques();
    }, [chargerStatistiques])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>PARC INFORMATIQUE</Text>
            <Text style={styles.subtitle}>
              Gestion de maintenance
            </Text>
          </View>

          <View style={styles.profile}>
            <Text style={styles.profileText}>GM</Text>
          </View>
        </View>

        <View style={styles.welcome}>
          <Text style={styles.greeting}>Bonjour ! 👋</Text>
          <Text style={styles.description}>
            Bienvenue dans votre espace de gestion
            du parc informatique.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Vue générale</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🖥️</Text>
            <Text style={styles.statNumber}>{equipements}</Text>
            <Text style={styles.statLabel}>Équipements</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👨‍🔧</Text>
            <Text style={styles.statNumber}>{techniciens}</Text>
            <Text style={styles.statLabel}>Techniciens</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔧</Text>
            <Text style={styles.statNumber}>{interventions}</Text>
            <Text style={styles.statLabel}>Interventions</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statNumber}>{maintenances}</Text>
            <Text style={styles.statLabel}>
              Maintenances prévues
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Modules de gestion
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.moduleCard,
            pressed && styles.modulePressed,
          ]}
          onPress={() => router.push('/equipements' as any)}
        >
          <Text style={styles.moduleIcon}>🖥️</Text>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Équipements</Text>
            <Text style={styles.moduleDescription}>
              Ajouter et gérer les matériels informatiques.
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.moduleCard,
            pressed && styles.modulePressed,
          ]}
          onPress={() => router.push('/techniciens' as any)}
        >
          <Text style={styles.moduleIcon}>👨‍🔧</Text>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Techniciens</Text>
            <Text style={styles.moduleDescription}>
              Gérer les techniciens et leurs spécialités.
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.moduleCard,
            pressed && styles.modulePressed,
          ]}
          onPress={() => router.push('/planning' as any)}
        >
          <Text style={styles.moduleIcon}>📅</Text>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Planification</Text>
            <Text style={styles.moduleDescription}>
              Programmer les maintenances préventives.
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.moduleCard,
            pressed && styles.modulePressed,
          ]}
          onPress={() => router.push('/interventions' as any)}
        >
          <Text style={styles.moduleIcon}>🔧</Text>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Interventions</Text>
            <Text style={styles.moduleDescription}>
              Consulter et suivre les réparations.
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Text style={styles.footer}>
          Application de maintenance informatique
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    paddingTop: 45,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#153E75',
  },
  subtitle: {
    fontSize: 12,
    color: '#777777',
    marginTop: 4,
  },
  profile: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#153E75',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  welcome: {
    backgroundColor: '#153E75',
    margin: 20,
    padding: 22,
    borderRadius: 15,
  },
  greeting: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#E0E9F5',
    marginTop: 10,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222222',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 12,
    marginBottom: 14,
  },
  statIcon: {
    fontSize: 25,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#153E75',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 13,
    color: '#666666',
    marginTop: 5,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  modulePressed: {
    backgroundColor: '#E5EDF8',
    opacity: 0.8,
  },
  moduleIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },
  moduleDescription: {
    fontSize: 12,
    color: '#777777',
    marginTop: 5,
  },
  arrow: {
    fontSize: 25,
    color: '#153E75',
  },
  footer: {
    textAlign: 'center',
    color: '#888888',
    fontSize: 12,
    marginVertical: 25,
  },
});
