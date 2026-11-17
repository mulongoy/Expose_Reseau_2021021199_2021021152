
import { useLocalSearchParams, useRouter } from 'expo-router';
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
    ajouterIntervention,
    getEquipements,
    getInterventions,
    getTechniciens,
    modifierIntervention,
    supprimerIntervention,
} from '@/database/database';

export default function InterventionsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    contactName?: string;
  }>();

  const [interventions, setInterventions] = useState<any[]>([]);
  const [equipements, setEquipements] = useState<any[]>([]);
  const [techniciens, setTechniciens] = useState<any[]>([]);

  const [equipementId, setEquipementId] = useState('');
  const [technicien, setTechnicien] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  const [listeEquipementsOuverte, setListeEquipementsOuverte] = useState(false);
  const [listeTechniciensOuverte, setListeTechniciensOuverte] = useState(false);
  const [interventionEnModification, setInterventionEnModification] = useState<number | null>(null);

  async function chargerDonnees() {
    try {
      setInterventions(await getInterventions());
      setEquipements(await getEquipements());
      setTechniciens(await getTechniciens());
    } catch (error) {
      console.error('Erreur de chargement :', error);
    }
  }

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Récupérer le contact choisi depuis le module Contacts
  useEffect(() => {
    if (params.contactName) {
      setTechnicien(params.contactName);
      setListeTechniciensOuverte(false);
    }
  }, [params.contactName]);

  function viderFormulaire() {
    setEquipementId('');
    setTechnicien('');
    setDate('');
    setDescription('');
    setInterventionEnModification(null);
    setListeEquipementsOuverte(false);
    setListeTechniciensOuverte(false);
  }

  async function enregistrerIntervention() {
    if (!equipementId || !date.trim() || !description.trim() || !technicien) {
      if (Platform.OS === 'web') {
        window.alert('Veuillez remplir tous les champs.');
      } else {
        Alert.alert('Attention', 'Veuillez remplir tous les champs.');
      }
      return;
    }

    try {
      if (interventionEnModification !== null) {
        await modifierIntervention(
          interventionEnModification,
          Number(equipementId),
          date,
          description,
          technicien
        );
      } else {
        await ajouterIntervention(
          Number(equipementId),
          date,
          description,
          technicien
        );
      }

      viderFormulaire();
      await chargerDonnees();

      if (Platform.OS === 'web') {
        window.alert('Intervention enregistrée avec succès.');
      } else {
        Alert.alert('Succès', 'Intervention enregistrée avec succès.');
      }
    } catch (error) {
      console.error(error);

      if (Platform.OS === 'web') {
        window.alert('Erreur lors de l’enregistrement.');
      } else {
        Alert.alert('Erreur', 'Erreur lors de l’enregistrement.');
      }
    }
  }

  function modifier(item: any) {
    setInterventionEnModification(item.id);
    setEquipementId(String(item.equipement_id));
    setDate(item.date);
    setDescription(item.description);
    setTechnicien(item.technicien);
  }

  async function supprimer(item: any) {
    const confirmer = async () => {
      await supprimerIntervention(item.id);
      await chargerDonnees();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous supprimer cette intervention ?')) {
        await confirmer();
      }
    } else {
      Alert.alert(
        'Confirmation',
        'Voulez-vous supprimer cette intervention ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: confirmer },
        ]
      );
    }
  }

  function nomEquipement(id: number) {
    return equipements.find((item) => item.id === id)?.nom || 'Équipement inconnu';
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titre}>Gestion des interventions</Text>

      <View style={styles.formulaire}>
        <Text style={styles.label}>Équipement concerné</Text>

        <TouchableOpacity
          style={styles.selecteur}
          onPress={() => setListeEquipementsOuverte(!listeEquipementsOuverte)}
        >
          <Text style={styles.texteSelecteur}>
            {equipements.find((item) => String(item.id) === equipementId)?.nom || 'Sélectionner un équipement'}
          </Text>
        </TouchableOpacity>

        {listeEquipementsOuverte && (
          <View style={styles.liste}>
            {equipements.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.element}
                onPress={() => {
                  setEquipementId(String(item.id));
                  setListeEquipementsOuverte(false);
                }}
              >
                <Text style={styles.texteElement}>{item.nom}</Text>
                <Text style={styles.detail}>ID : {item.id}</Text>
              </TouchableOpacity>
            ))}

            {equipements.length === 0 && (
              <Text style={styles.detail}>Aucun équipement enregistré.</Text>
            )}
          </View>
        )}

        <Text style={styles.label}>Technicien responsable</Text>

        <TouchableOpacity
          style={styles.selecteur}
          onPress={() => setListeTechniciensOuverte(!listeTechniciensOuverte)}
        >
          <Text style={styles.texteSelecteur}>
            {technicien || 'Sélectionner un technicien'}
          </Text>
        </TouchableOpacity>

        {listeTechniciensOuverte && (
          <View style={styles.liste}>
            {techniciens.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.element}
                onPress={() => {
                  setTechnicien(item.nom);
                  setListeTechniciensOuverte(false);
                }}
              >
                <Text style={styles.texteElement}>{item.nom}</Text>
                <Text style={styles.detail}>{item.specialite}</Text>
              </TouchableOpacity>
            ))}

            {techniciens.length === 0 && (
              <Text style={styles.detail}>Aucun technicien enregistré.</Text>
            )}
          </View>
        )}

       {/* Sélection d'un contact du téléphone */}
<TouchableOpacity
  style={styles.boutonContacts}
  onPress={() =>
    router.push({
      pathname: '/contacts',
      params: { selection: '1' },
    } as any)
  }
>
  <Text style={styles.texteBouton}>
    Choisir dans les contacts du téléphone
  </Text>
</TouchableOpacity>

        <Text style={styles.label}>Date de l'intervention</Text>

        <TextInput
          style={styles.input}
          placeholder="Exemple : 2026-11-10"
          value={date}
          onChangeText={setDate}
        />

        <Text style={styles.label}>Description de l'intervention</Text>

        <TextInput
          style={[styles.input, styles.zoneTexte]}
          placeholder="Décrivez le travail effectué..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity style={styles.bouton} onPress={enregistrerIntervention}>
          <Text style={styles.texteBouton}>
            {interventionEnModification !== null
              ? 'Enregistrer les modifications'
              : 'Ajouter l’intervention'}
          </Text>
        </TouchableOpacity>

        {interventionEnModification !== null && (
          <TouchableOpacity style={styles.boutonAnnuler} onPress={viderFormulaire}>
            <Text style={styles.texteBouton}>Annuler la modification</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sousTitre}>Historique des interventions</Text>

      {interventions.length === 0 ? (
        <Text style={styles.message}>Aucune intervention enregistrée.</Text>
      ) : (
        interventions.map((item) => (
          <View key={item.id} style={styles.carte}>
            <Text style={styles.nom}>{nomEquipement(item.equipement_id)}</Text>
            <Text style={styles.info}>Date : {item.date}</Text>
            <Text style={styles.info}>Technicien : {item.technicien}</Text>
            <Text style={styles.info}>Description : {item.description}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.boutonModifier}
                onPress={() => modifier(item)}
              >
                <Text style={styles.texteBouton}>Modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.boutonSupprimer}
                onPress={() => supprimer(item)}
              >
                <Text style={styles.texteBouton}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  titre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 20,
  },
  formulaire: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 25,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  zoneTexte: {
    height: 90,
    textAlignVertical: 'top',
  },
  selecteur: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 13,
    backgroundColor: '#FFFFFF',
  },
  texteSelecteur: {
    color: '#374151',
  },
  liste: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: '#FFFFFF',
  },
  element: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  texteElement: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  detail: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  bouton: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  boutonAnnuler: {
    backgroundColor: '#6B7280',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  boutonContacts: {
    backgroundColor: '#059669',
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  texteBouton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sousTitre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  message: {
    color: '#6B7280',
    marginBottom: 20,
  },
  carte: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  nom: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  info: {
    color: '#374151',
    marginBottom: 5,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  boutonModifier: {
    flex: 1,
    backgroundColor: '#D97706',
    padding: 10,
    borderRadius: 7,
    alignItems: 'center',
  },
  boutonSupprimer: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 10,
    borderRadius: 7,
    alignItems: 'center',
  },
});
