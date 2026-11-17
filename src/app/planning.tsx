
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  ajouterMaintenance,
  getEquipements,
  getMaintenances,
  modifierMaintenance,
  supprimerMaintenance,
  type Maintenance,
} from '@/database/database';

type Equipement = {
  id: number;
  nom: string;
  type: string;
  localisation: string;
  date_installation: string;
};

export default function PlanningScreen() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [equipements, setEquipements] = useState<Equipement[]>([]);

  const [equipementId, setEquipementId] = useState('');
  const [listeOuverte, setListeOuverte] = useState(false);
  const [date, setDate] = useState('');
  const [type, setType] = useState('Préventive');
  const [commentaire, setCommentaire] = useState('');
  const [modificationId, setModificationId] = useState<number | null>(null);

  // Recharger les données à chaque ouverture de la page Planning
  useFocusEffect(
    useCallback(() => {
      chargerDonnees();
    }, [])
  );

  async function chargerDonnees() {
    try {
      const listeMaintenances = await getMaintenances();
      const listeEquipements = await getEquipements();

      setMaintenances(listeMaintenances);
      setEquipements(listeEquipements);

      console.log('Équipements chargés dans Planning :', listeEquipements);
    } catch (error) {
      console.error('Erreur de chargement des données :', error);
    }
  }

  function viderFormulaire() {
    setEquipementId('');
    setListeOuverte(false);
    setDate('');
    setType('Préventive');
    setCommentaire('');
    setModificationId(null);
  }

  async function enregistrerMaintenance() {
    if (!equipementId || !date.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Veuillez choisir un équipement et saisir une date.');
      } else {
        Alert.alert(
          'Attention',
          'Veuillez choisir un équipement et saisir une date.'
        );
      }
      return;
    }

    try {
      if (modificationId !== null) {
        await modifierMaintenance(
          modificationId,
          Number(equipementId),
          date.trim(),
          type,
          commentaire.trim()
        );
      } else {
        await ajouterMaintenance(
          Number(equipementId),
          date.trim(),
          type,
          commentaire.trim()
        );
      }

      viderFormulaire();
      await chargerDonnees();

      if (Platform.OS === 'web') {
        window.alert('Maintenance enregistrée avec succès.');
      } else {
        Alert.alert('Succès', 'Maintenance enregistrée avec succès.');
      }
    } catch (error) {
      console.error('Erreur d’enregistrement :', error);

      if (Platform.OS === 'web') {
        window.alert('Impossible d’enregistrer la maintenance.');
      } else {
        Alert.alert('Erreur', 'Impossible d’enregistrer la maintenance.');
      }
    }
  }

  function modifier(item: Maintenance) {
    setModificationId(item.id);
    setEquipementId(String(item.equipement_id));
    setDate(item.date);
    setType(item.type);
    setCommentaire(item.commentaire || '');
    setListeOuverte(false);
  }

  function confirmerSuppression(id: number) {
    const supprimer = async () => {
      try {
        await supprimerMaintenance(id);
        await chargerDonnees();
      } catch (error) {
        console.error(error);

        if (Platform.OS === 'web') {
          window.alert('Impossible de supprimer cette maintenance.');
        } else {
          Alert.alert('Erreur', 'Impossible de supprimer cette maintenance.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous supprimer cette maintenance ?')) {
        supprimer();
      }
    } else {
      Alert.alert(
        'Confirmation',
        'Voulez-vous supprimer cette maintenance ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: supprimer,
          },
        ]
      );
    }
  }

  function nomEquipement(id: number) {
    const equipement = equipements.find((item) => item.id === id);
    return equipement ? equipement.nom : 'Équipement inconnu';
  }

  function choisirEquipement(item: Equipement) {
    setEquipementId(String(item.id));
    setListeOuverte(false);
  }

  const equipementSelectionne = equipements.find(
    (item) => String(item.id) === equipementId
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.contenu}
      data={maintenances}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View>
          <Text style={styles.titre}>Planification des maintenances</Text>

          <Text style={styles.sousTitre}>
            Programmer et suivre les opérations de maintenance.
          </Text>

          <View style={styles.formulaire}>
            <Text style={styles.label}>Choisir un équipement</Text>

            <TouchableOpacity
              style={styles.selecteur}
              onPress={async () => {
                await chargerDonnees();
                setListeOuverte((ouverte) => !ouverte);
              }}
            >
              <Text
                style={
                  equipementSelectionne
                    ? styles.texteSelection
                    : styles.placeholder
                }
              >
                {equipementSelectionne
                  ? equipementSelectionne.nom +
                    ' (ID : ' +
                    equipementSelectionne.id +
                    ')'
                  : 'Sélectionner un équipement'}
              </Text>

              <Text style={styles.fleche}>
                {listeOuverte ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {listeOuverte && (
              <View style={styles.listeEquipements}>
                {equipements.length === 0 ? (
                  <Text style={styles.aucunEquipement}>
                    Aucun équipement enregistré.
                  </Text>
                ) : (
                  equipements.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.elementEquipement}
                      onPress={() => choisirEquipement(item)}
                    >
                      <Text style={styles.nomEquipement}>
                        {item.nom}
                      </Text>

                      <Text style={styles.detailEquipement}>
                        {item.type} · ID : {item.id}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            <Text style={styles.label}>Date de maintenance</Text>

            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-JJ (ex : 2026-12-15)"
              placeholderTextColor="#64748B"
              value={date}
              onChangeText={setDate}
            />

            <Text style={styles.label}>Type de maintenance</Text>

            <View style={styles.types}>
              <TouchableOpacity
                style={[
                  styles.boutonType,
                  type === 'Préventive' && styles.typeActif,
                ]}
                onPress={() => setType('Préventive')}
              >
                <Text
                  style={[
                    styles.texteType,
                    type === 'Préventive' && styles.texteTypeActif,
                  ]}
                >
                  Préventive
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.boutonType,
                  type === 'Curative' && styles.typeActif,
                ]}
                onPress={() => setType('Curative')}
              >
                <Text
                  style={[
                    styles.texteType,
                    type === 'Curative' && styles.texteTypeActif,
                  ]}
                >
                  Curative
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Commentaire</Text>

            <TextInput
              style={[styles.input, styles.commentaire]}
              placeholder="Décrire la maintenance prévue..."
              placeholderTextColor="#64748B"
              value={commentaire}
              onChangeText={setCommentaire}
              multiline
            />

            <TouchableOpacity
              style={styles.boutonPrincipal}
              onPress={enregistrerMaintenance}
            >
              <Text style={styles.texteBouton}>
                {modificationId !== null
                  ? 'Enregistrer les modifications'
                  : 'Ajouter la maintenance'}
              </Text>
            </TouchableOpacity>

            {modificationId !== null && (
              <TouchableOpacity
                style={styles.boutonAnnuler}
                onPress={viderFormulaire}
              >
                <Text style={styles.texteAnnuler}>
                  Annuler la modification
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.titreListe}>
            Maintenances programmées ({maintenances.length})
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.vide}>
          Aucune maintenance programmée pour le moment.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.carte}>
          <Text style={styles.nom}>
            {nomEquipement(item.equipement_id)}
          </Text>

          <Text style={styles.detail}>Date : {item.date}</Text>
          <Text style={styles.detail}>Type : {item.type}</Text>

          <Text style={styles.detail}>
            Commentaire : {item.commentaire || 'Aucun'}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.boutonModifier}
              onPress={() => modifier(item)}
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
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  contenu: {
    padding: 18,
    paddingBottom: 40,
  },
  titre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  sousTitre: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  formulaire: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 7,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  selecteur: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  texteSelection: {
    color: '#1e293b',
    fontWeight: '600',
  },
  placeholder: {
    color: '#64748b',
  },
  fleche: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  listeEquipements: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: '#ffffff',
  },
  elementEquipement: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  nomEquipement: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  detailEquipement: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  aucunEquipement: {
    padding: 12,
    color: '#64748b',
  },
  commentaire: {
    height: 90,
    textAlignVertical: 'top',
  },
  types: {
    flexDirection: 'row',
    gap: 10,
  },
  boutonType: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    alignItems: 'center',
  },
  typeActif: {
    backgroundColor: '#2563eb',
  },
  texteType: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  texteTypeActif: {
    color: '#ffffff',
  },
  boutonPrincipal: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  texteBouton: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  boutonAnnuler: {
    padding: 12,
    alignItems: 'center',
  },
  texteAnnuler: {
    color: '#64748b',
    fontWeight: 'bold',
  },
  titreListe: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  vide: {
    color: '#64748b',
    textAlign: 'center',
    padding: 20,
  },
  carte: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  nom: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 5,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  boutonModifier: {
    flex: 1,
    backgroundColor: '#0f766e',
    padding: 11,
    borderRadius: 7,
    alignItems: 'center',
  },
  boutonSupprimer: {
    flex: 1,
    backgroundColor: '#dc2626',
    padding: 11,
    borderRadius: 7,
    alignItems: 'center',
  },
});
