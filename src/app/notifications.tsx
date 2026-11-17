
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import {
    getEquipements,
    getMaintenances,
} from '@/database/database';

type Maintenance = {
  id: number;
  equipement_id: number;
  date: string;
  description?: string;
  [key: string]: any;
};

type RappelProgramme = {
  maintenanceId: number;
  notificationId: string;
};

export default function NotificationsScreen() {
  const [message, setMessage] = useState(
    'Aucune notification envoyée pour le moment.'
  );

  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [rappels, setRappels] = useState<RappelProgramme[]>([]);
  const [chargement, setChargement] = useState(false);

  const afficherMessage = (texte: string) => {
    setMessage(texte);
  };

  const chargerMaintenances = useCallback(async () => {
    try {
      const resultat = await getMaintenances();
      setMaintenances(resultat || []);
    } catch (error) {
      console.error('Erreur de chargement des maintenances :', error);
      afficherMessage('Impossible de charger les maintenances.');
    }
  }, []);

  useEffect(() => {
    chargerMaintenances();
  }, [chargerMaintenances]);

  async function demanderPermission() {
    const permission =
      await Notifications.requestPermissionsAsync();

    if (!permission.granted) {
      afficherMessage(
        "L'autorisation d'envoyer des notifications a été refusée."
      );
      return false;
    }

    return true;
  }

  async function envoyerNotification() {
    if (Platform.OS === 'web') {
      afficherMessage(
        'Les notifications seront testées sur un appareil Android.'
      );
      return;
    }

    try {
      const autorise = await demanderPermission();

      if (!autorise) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rappel de maintenance',
          body: 'Une maintenance informatique est à effectuer.',
        },
        trigger: null,
      });

      afficherMessage('Notification de test envoyée avec succès !');
    } catch (error) {
      console.error('Erreur notification :', error);
      afficherMessage("Impossible d'envoyer la notification.");
    }
  }

  function obtenirNomEquipement(
    equipements: any[],
    equipementId: number
  ) {
    return (
      equipements.find((item) => item.id === equipementId)?.nom ||
      'Équipement informatique'
    );
  }

  async function programmerRappels() {
    if (Platform.OS === 'web') {
      afficherMessage(
        'La programmation des rappels sera testée sur Android.'
      );
      return;
    }

    try {
      setChargement(true);

      const autorise = await demanderPermission();

      if (!autorise) return;

      const equipements = await getEquipements();

      let nombreProgramme = 0;
      let nombreIgnore = 0;

      for (const maintenance of maintenances) {
        if (!maintenance.date) {
          nombreIgnore++;
          continue;
        }

        // Accepte une date au format AAAA-MM-JJ
        const dateMaintenance = new Date(
          `${maintenance.date}T09:00:00`
        );

        if (Number.isNaN(dateMaintenance.getTime())) {
          nombreIgnore++;
          continue;
        }

        // Ne programme pas une maintenance déjà passée
        if (dateMaintenance.getTime() <= Date.now()) {
          nombreIgnore++;
          continue;
        }

        // Évite de programmer deux fois le même rappel
        if (
          rappels.some(
            (rappel) => rappel.maintenanceId === maintenance.id
          )
        ) {
          continue;
        }

        const nomEquipement = obtenirNomEquipement(
          equipements,
          maintenance.equipement_id
        );

        const notificationId =
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Maintenance informatique prévue',
              body: `Une maintenance est prévue pour : ${nomEquipement}. ${maintenance.description || ''}`,
              data: {
                maintenanceId: maintenance.id,
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: dateMaintenance,
            },
          });

        setRappels((anciens) => [
          ...anciens,
          {
            maintenanceId: maintenance.id,
            notificationId,
          },
        ]);

        nombreProgramme++;
      }

      afficherMessage(
        `${nombreProgramme} rappel(s) programmé(s). ${nombreIgnore} maintenance(s) ignorée(s) car leur date est absente ou déjà passée.`
      );
    } catch (error) {
      console.error('Erreur programmation :', error);
      afficherMessage('Erreur lors de la programmation des rappels.');
    } finally {
      setChargement(false);
    }
  }

  async function annulerRappels() {
    if (Platform.OS === 'web') {
      afficherMessage(
        "L'annulation des rappels sera testée sur Android."
      );
      return;
    }

    try {
      for (const rappel of rappels) {
        await Notifications.cancelScheduledNotificationAsync(
          rappel.notificationId
        );
      }

      setRappels([]);
      afficherMessage('Tous les rappels programmés ont été annulés.');
    } catch (error) {
      console.error('Erreur annulation :', error);
      afficherMessage("Impossible d'annuler les rappels.");
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titre}>Notifications</Text>

      <Text style={styles.description}>
        Recevez des rappels concernant les maintenances informatiques.
      </Text>

      <View style={styles.carte}>
        <Text style={styles.sousTitre}>
          Test des notifications
        </Text>

        <Text style={styles.message}>{message}</Text>

        <TouchableOpacity
          style={styles.bouton}
          onPress={envoyerNotification}
        >
          <Text style={styles.texteBouton}>
            Tester une notification
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.carte}>
        <Text style={styles.sousTitre}>
          Rappels de maintenance
        </Text>

        <Text style={styles.information}>
          Maintenances enregistrées : {maintenances.length}
        </Text>

        <Text style={styles.information}>
          Rappels programmés pendant cette session : {rappels.length}
        </Text>

        <TouchableOpacity
          style={styles.bouton}
          onPress={chargerMaintenances}
        >
          <Text style={styles.texteBouton}>
            Actualiser les maintenances
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.boutonVert}
          onPress={programmerRappels}
          disabled={chargement}
        >
          <Text style={styles.texteBouton}>
            {chargement
              ? 'Programmation...'
              : 'Programmer les rappels'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.boutonRouge}
          onPress={annulerRappels}
        >
          <Text style={styles.texteBouton}>
            Annuler les rappels programmés
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  titre: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 20,
  },
  carte: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 18,
  },
  sousTitre: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 15,
  },
  message: {
    color: '#4B5563',
    fontSize: 15,
    marginBottom: 15,
  },
  information: {
    color: '#4B5563',
    fontSize: 14,
    marginBottom: 10,
  },
  bouton: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  boutonVert: {
    backgroundColor: '#059669',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  boutonRouge: {
    backgroundColor: '#DC2626',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  texteBouton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
