
import * as Contacts from 'expo-contacts/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Contact = {
  id: string;
  name: string;
  phoneNumbers?: { number?: string }[];
};

export default function ContactsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    selection?: string;
  }>();

  const modeSelection = params.selection === '1';

  const [listeContacts, setListeContacts] = useState<Contact[]>([]);
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState(
    'Appuyez sur le bouton pour accéder aux contacts.'
  );

  async function chargerContacts() {
    if (Platform.OS === 'web') {
      setMessage('Cette fonctionnalité doit être testée sur Android.');
      return;
    }

    try {
      setChargement(true);
      setMessage('');
      setListeContacts([]);

      // Demander l'autorisation Android
      const permission = await Contacts.requestPermissionsAsync();

      if (!permission.granted) {
        setMessage(
          `Accès refusé aux contacts. Statut : ${permission.status}. Autorisation à vérifier dans les paramètres du téléphone.`
        );
        return;
      }

      // Récupérer les contacts du téléphone
      const resultat = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      const contacts: Contact[] = resultat.data.map((contact) => ({
        id: contact.id || String(Math.random()),
        name: contact.name || 'Sans nom',
        phoneNumbers: contact.phoneNumbers,
      }));

      setListeContacts(contacts);

      if (contacts.length === 0) {
        setMessage('Aucun contact trouvé sur cet appareil.');
      } else {
        setMessage(`${contacts.length} contact(s) trouvé(s).`);
      }
    } catch (error) {
      console.error('Erreur détaillée des contacts :', error);

      const detail =
        error instanceof Error
          ? error.message
          : String(error);

      setMessage(`Erreur de chargement : ${detail}`);
    } finally {
      setChargement(false);
    }
  }

  function selectionnerContact(contact: Contact) {
    router.replace({
      pathname: '/interventions',
      params: {
        contactName: contact.name,
      },
    } as any);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Contacts</Text>

      <Text style={styles.description}>
        Consultez les contacts enregistrés sur votre appareil.
      </Text>

      {modeSelection && (
        <Text style={styles.instruction}>
          Sélectionnez un contact pour le désigner comme technicien
          responsable d'une intervention.
        </Text>
      )}

      <TouchableOpacity
        style={styles.bouton}
        onPress={chargerContacts}
        disabled={chargement}
      >
        <Text style={styles.texteBouton}>
          {chargement ? 'Chargement...' : 'Accéder aux contacts'}
        </Text>
      </TouchableOpacity>

      {chargement && (
        <ActivityIndicator size="large" color="#2563EB" />
      )}

      {!!message && (
        <Text style={styles.message}>{message}</Text>
      )}

      <FlatList
        data={listeContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.carte}>
            <Text style={styles.nom}>{item.name}</Text>

            <Text style={styles.telephone}>
              {item.phoneNumbers?.[0]?.number ||
                'Aucun numéro disponible'}
            </Text>

            {modeSelection && (
              <TouchableOpacity
                style={styles.boutonSelection}
                onPress={() => selectionnerContact(item)}
              >
                <Text style={styles.texteBouton}>
                  Sélectionner ce contact
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
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
  instruction: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    lineHeight: 21,
  },
  bouton: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  texteBouton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  message: {
    color: '#4B5563',
    fontSize: 15,
    marginBottom: 15,
  },
  carte: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  nom: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  telephone: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 5,
  },
  boutonSelection: {
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
});