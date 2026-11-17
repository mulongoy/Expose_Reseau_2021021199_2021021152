
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
  ajouterTechnicien,
  getTechniciens,
  modifierTechnicien,
  supprimerTechnicien,
  type Technicien,
} from '@/database/database';

export default function TechniciensScreen() {
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [nom, setNom] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [message, setMessage] = useState('');
  const [technicienEnModification, setTechnicienEnModification] =
    useState<number | null>(null);

  async function chargerTechniciens() {
    try {
      const resultat = await getTechniciens();
      setTechniciens(resultat);
    } catch (error) {
      console.error('Erreur de chargement :', error);
    }
  }

  useEffect(() => {
    chargerTechniciens();
  }, []);

  function viderFormulaire() {
    setNom('');
    setSpecialite('');
    setTechnicienEnModification(null);
  }

  async function enregistrerTechnicien() {
    if (!nom.trim() || !specialite.trim()) {
      setMessage('Veuillez remplir tous les champs.');
      return;
    }

    try {
      if (technicienEnModification !== null) {
        await modifierTechnicien(
          technicienEnModification,
          nom.trim(),
          specialite.trim()
        );
        setMessage('Technicien modifié avec succès !');
      } else {
        await ajouterTechnicien(nom.trim(), specialite.trim());
        setMessage('Technicien enregistré avec succès !');
      }

      viderFormulaire();
      await chargerTechniciens();
    } catch (error) {
      console.error('Erreur :', error);
      setMessage('Une erreur est survenue.');
    }
  }

  function preparerModification(item: Technicien) {
    setNom(item.nom);
    setSpecialite(item.specialite);
    setTechnicienEnModification(item.id);
    setMessage('Modification de : ' + item.nom);
  }

  async function supprimer(id: number) {
    try {
      await supprimerTechnicien(id);
      await chargerTechniciens();
      setMessage('Technicien supprimé avec succès.');
    } catch (error) {
      console.error('Erreur de suppression :', error);
      setMessage('Erreur lors de la suppression.');
    }
  }

  function confirmerSuppression(id: number) {
    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous supprimer ce technicien ?')) {
        supprimer(id);
      }
    } else {
      Alert.alert(
        'Confirmation',
        'Voulez-vous supprimer ce technicien ?',
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
      <Text style={styles.titre}>Gestion des techniciens</Text>

      <Text style={styles.sousTitre}>
        Ajouter et gérer les techniciens informatiques
      </Text>

      <View style={styles.formulaire}>
        <Text style={styles.titreFormulaire}>
          {technicienEnModification !== null
            ? 'Modifier un technicien'
            : 'Ajouter un technicien'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nom du technicien"
          placeholderTextColor="#64748B"
          value={nom}
          onChangeText={setNom}
        />

        <TextInput
          style={styles.input}
          placeholder="Spécialité : Réseau, Maintenance, etc."
          placeholderTextColor="#64748B"
          value={specialite}
          onChangeText={setSpecialite}
        />

        <TouchableOpacity
          style={styles.boutonAjouter}
          onPress={enregistrerTechnicien}
        >
          <Text style={styles.texteBouton}>
            {technicienEnModification !== null
              ? 'Enregistrer les modifications'
              : '+ Enregistrer le technicien'}
          </Text>
        </TouchableOpacity>

        {technicienEnModification !== null && (
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
        Liste des techniciens ({techniciens.length})
      </Text>

      {techniciens.length === 0 ? (
        <Text style={styles.vide}>
          Aucun technicien enregistré pour le moment.
        </Text>
      ) : (
        techniciens.map((item) => (
          <View style={styles.carte} key={item.id}>
            <Text style={styles.nom}>{item.nom}</Text>
            <Text>Spécialité : {item.specialite}</Text>

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
  titreListe: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#15345B',
    marginBottom: 12,
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
