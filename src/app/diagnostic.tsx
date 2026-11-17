
import * as Network from 'expo-network';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DiagnosticScreen() {
  const [etatReseau, setEtatReseau] = useState<any>(null);
  const [chargement, setChargement] = useState(false);

  async function verifierConnexion() {
    try {
      setChargement(true);

      const resultat = await Network.getNetworkStateAsync();

      setEtatReseau(resultat);
    } catch (error) {
      console.error('Erreur de diagnostic réseau :', error);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    verifierConnexion();
  }, []);

  function typeConnexion(type: string) {
    switch (type) {
      case 'WIFI':
        return 'Wi-Fi';
      case 'CELLULAR':
        return 'Données mobiles';
      case 'ETHERNET':
        return 'Connexion Ethernet';
      case 'NONE':
        return 'Aucune connexion';
      case 'UNKNOWN':
        return 'Type inconnu';
      case 'BLUETOOTH':
        return 'Bluetooth';
      default:
        return type || 'Non disponible';
    }
  }

  function etatInternet(valeur: boolean | null) {
    if (valeur === true) return 'Connecté';
    if (valeur === false) return 'Non connecté';
    return 'Information indisponible';
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titre}>Diagnostic réseau</Text>

      <Text style={styles.description}>
        Vérifiez l'état de votre connexion réseau et Internet.
      </Text>

      {chargement ? (
        <ActivityIndicator size="large" color="#2563EB" />
      ) : etatReseau ? (
        <View style={styles.carte}>
          <Text style={styles.sousTitre}>Résultat du diagnostic</Text>

          <Text style={styles.label}>Type de connexion</Text>
          <Text style={styles.valeur}>
            {typeConnexion(etatReseau.type)}
          </Text>

          <Text style={styles.label}>État de la connexion réseau</Text>
          <Text style={styles.valeur}>
            {etatInternet(etatReseau.isConnected)}
          </Text>

          <Text style={styles.label}>Accès à Internet</Text>
          <Text style={styles.valeur}>
            {etatInternet(etatReseau.isInternetReachable)}
          </Text>

          <Text style={styles.label}>Wi-Fi activé</Text>
          <Text style={styles.valeur}>
            {etatReseau.isWifiEnabled === true
              ? 'Oui'
              : etatReseau.isWifiEnabled === false
                ? 'Non'
                : 'Information indisponible'}
          </Text>
        </View>
      ) : (
        <Text style={styles.message}>
          Impossible de récupérer les informations du réseau.
        </Text>
      )}

      <TouchableOpacity
        style={styles.bouton}
        onPress={verifierConnexion}
        disabled={chargement}
      >
        <Text style={styles.texteBouton}>
          Vérifier à nouveau
        </Text>
      </TouchableOpacity>
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
    fontSize: 25,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 25,
  },
  carte: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sousTitre: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 15,
  },
  label: {
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 15,
  },
  valeur: {
    fontSize: 16,
    color: '#2563EB',
    marginTop: 5,
  },
  bouton: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  texteBouton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  message: {
    color: '#DC2626',
    marginBottom: 20,
  },
});
