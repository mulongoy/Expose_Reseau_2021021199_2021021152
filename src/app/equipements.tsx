
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  ajouterEquipement,
  getEquipements,
  mettreAJourCoordonneesEquipement,
  modifierEquipement,
  supprimerEquipement,
} from '@/database/database';

type Equipement = {
  id: number;
  nom: string;
  type: string;
  localisation: string;
  date_installation: string;
  latitude?: number | null;
  longitude?: number | null;
};

export default function EquipementsScreen() {
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [nom, setNom] = useState('');
  const [type, setType] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [chargementGPS, setChargementGPS] = useState<number | null>(null);
  const [equipementEnModification, setEquipementEnModification] =
    useState<number | null>(null);

  async function chargerEquipements() {
    try {
      const resultat = await getEquipements();
      setEquipements(resultat);
    } catch (error) {
      console.error('Erreur de chargement :', error);
    }
  }

  useEffect(() => {
    chargerEquipements();
  }, []);

  function viderFormulaire() {
    setNom('');
    setType('');
    setLocalisation('');
    setDate('');
    setEquipementEnModification(null);
  }

  async function enregistrerEquipement() {
    if (!nom.trim() || !type.trim() || !localisation.trim()) {
      setMessage('Veuillez remplir les champs obligatoires.');
      return;
    }

    try {
      if (equipementEnModification !== null) {
        await modifierEquipement(
          equipementEnModification,
          nom.trim(),
          type.trim(),
          localisation.trim(),
          date.trim()
        );

        setMessage('Équipement modifié avec succès !');
      } else {
        await ajouterEquipement(
          nom.trim(),
          type.trim(),
          localisation.trim(),
          date.trim()
        );

        setMessage('Équipement enregistré avec succès !');
      }

      viderFormulaire();
      await chargerEquipements();
    } catch (error) {
      console.error('Erreur :', error);
      setMessage('Une erreur est survenue.');
    }
  }

  function preparerModification(item: Equipement) {
    setNom(item.nom);
    setType(item.type);
    setLocalisation(item.localisation);
    setDate(item.date_installation || '');
    setEquipementEnModification(item.id);
    setMessage('Modification de : ' + item.nom);
  }

  async function enregistrerPositionGPS(item: Equipement) {
    try {
      setChargementGPS(item.id);
      setMessage('Récupération de la position GPS...');

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setMessage('Permission de localisation refusée.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await mettreAJourCoordonneesEquipement(
        item.id,
        position.coords.latitude,
        position.coords.longitude
      );

      await chargerEquipements();

      setMessage(
        'Position GPS enregistrée pour ' + item.nom + ' !'
      );
    } catch (error) {
      console.error('Erreur GPS :', error);
      setMessage(
        'Impossible de récupérer la position GPS. Vérifiez votre connexion et le GPS.'
      );
    } finally {
      setChargementGPS(null);
    }
  }

  async function supprimer(id: number) {
    try {
      await supprimerEquipement(id);
      await chargerEquipements();
      setMessage('Équipement supprimé avec succès.');
    } catch (error) {
      console.error('Erreur de suppression :', error);
      setMessage('Erreur lors de la suppression.');
    }
  }

  function confirmerSuppression(id: number) {
    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous supprimer cet équipement ?')) {
        supprimer(id);
      }
    } else {
      Alert.alert(
        'Confirmation',
        'Voulez-vous supprimer cet équipement ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => supprimer(id),
          },
        ]
      );
    }
  }

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titre}>Gestion des équipements</Text>

      <Text style={styles.sousTitre}>
        Ajouter et gérer le matériel informatique
      </Text>

      <View style={styles.formulaire}>
        <Text style={styles.titreFormulaire}>
          {equipementEnModification !== null
            ? 'Modifier un équipement'
            : 'Ajouter un équipement'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nom de l'équipement"
          placeholderTextColor="#64748B"
          value={nom}
          onChangeText={setNom}
        />

        <TextInput
          style={styles.input}
          placeholder="Type : Routeur, Switch ou PC"
          placeholderTextColor="#64748B"
          value={type}
          onChangeText={setType}
        />

        <TextInput
          style={styles.input}
          placeholder="Localisation"
          placeholderTextColor="#64748B"
          value={localisation}
          onChangeText={setLocalisation}
        />

        <TextInput
          style={styles.input}
          placeholder="Date d'installation (JJ/MM/AAAA)"
          placeholderTextColor="#64748B"
          value={date}
          onChangeText={setDate}
        />

        <TouchableOpacity
          style={styles.boutonAjouter}
          onPress={enregistrerEquipement}
        >
          <Text style={styles.texteBouton}>
            {equipementEnModification !== null
              ? 'Enregistrer les modifications'
              : '+ Enregistrer l’équipement'}
          </Text>
        </TouchableOpacity>

        {equipementEnModification !== null && (
          <TouchableOpacity
            style={styles.boutonAnnuler}
            onPress={() => {
              viderFormulaire();
              setMessage('Modification annulée.');
            }}
          >
            <Text style={styles.texteBouton}>
              Annuler la modification
            </Text>
          </TouchableOpacity>
        )}

        {message !== '' && (
          <Text style={styles.message}>{message}</Text>
        )}
      </View>

      <Text style={styles.titreListe}>
        Liste des équipements ({equipements.length})
      </Text>

      {equipements.length === 0 ? (
        <Text style={styles.vide}>
          Aucun équipement enregistré pour le moment.
        </Text>
      ) : (
        equipements.map((item) => (
          <View style={styles.carte} key={item.id}>
            <Text style={styles.nom}>{item.nom}</Text>

            <Text style={styles.identifiant}>ID : {item.id}</Text>

            <Text>Type : {item.type}</Text>
            <Text>Localisation : {item.localisation}</Text>

            <Text>
              Date d'installation : {item.date_installation || 'Non précisée'}
            </Text>

            {item.latitude != null && item.longitude != null ? (
              <Text style={styles.coordonnees}>
                GPS : {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
              </Text>
            ) : (
              <Text style={styles.gpsAbsent}>
                Position GPS non enregistrée
              </Text>
            )}

            <TouchableOpacity
              style={styles.boutonGPS}
              onPress={() => enregistrerPositionGPS(item)}
              disabled={chargementGPS !== null}
            >
              <Text style={styles.texteBouton}>
                {chargementGPS === item.id
                  ? 'Récupération GPS...'
                  : item.latitude != null
                    ? 'Actualiser la position GPS'
                    : 'Enregistrer la position GPS'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.boutonModifier}
              onPress={() => preparerModification(item)}
            >
              <Text style={styles.texteBouton}>Modifier</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.boutonSupprimer}
              onPress={() => confirmerSuppression(item.id)}
            >
              <Text style={styles.texteBouton}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F3F6FA',
  },
  titre: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#15345B',
  },
  sousTitre: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 5,
    marginBottom: 20,
  },
  formulaire: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 25,
  },
  titreFormulaire: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#15345B',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 16,
    minHeight: 52,
  },
  boutonAjouter: {
    backgroundColor: '#15345B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  boutonGPS: {
    backgroundColor: '#0D9488',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  boutonModifier: {
    backgroundColor: '#D97706',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  boutonSupprimer: {
    backgroundColor: '#DC2626',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  boutonAnnuler: {
    backgroundColor: '#64748B',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  texteBouton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  message: {
    marginTop: 12,
    color: '#15803D',
    fontWeight: 'bold',
  },
  coordonnees: {
    color: '#0D9488',
    fontWeight: 'bold',
    marginTop: 8,
  },
  gpsAbsent: {
    color: '#64748B',
    marginTop: 8,
  },
  titreListe: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#15345B',
    marginBottom: 12,
  },
  identifiant: {
    color: '#2563EB',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  carte: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nom: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#15345B',
  },
  vide: {
    textAlign: 'center',
    marginTop: 20,
    color: '#64748B',
  },
});
