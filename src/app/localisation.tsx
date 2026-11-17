
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { getEquipements } from '../database/database';

type Equipement = {
  id: number;
  nom: string;
  type: string;
  localisation: string;
  date_installation: string;
  latitude?: number | null;
  longitude?: number | null;
};

export default function LocalisationScreen() {
  const [position, setPosition] =
    useState<Location.LocationObject | null>(null);

  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [chargement, setChargement] = useState(false);
  const [chargementEquipements, setChargementEquipements] = useState(true);
  const [erreur, setErreur] = useState('');

  async function chargerEquipements() {
    try {
      setChargementEquipements(true);

      const resultat = await getEquipements();
      setEquipements(resultat);
    } catch (error) {
      console.error('Erreur de chargement des équipements :', error);
      setErreur('Impossible de charger les équipements.');
    } finally {
      setChargementEquipements(false);
    }
  }

  useEffect(() => {
    chargerEquipements();
  }, []);

  async function obtenirPosition() {
    try {
      setChargement(true);
      setErreur('');

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setErreur("L'autorisation de localisation a été refusée.");
        return;
      }

      const resultat = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setPosition(resultat);
    } catch (error) {
      console.error('Erreur GPS :', error);
      setErreur('Impossible de récupérer votre position.');
    } finally {
      setChargement(false);
    }
  }

  const latitude = position?.coords.latitude;
  const longitude = position?.coords.longitude;

  const equipementsGPS = equipements.filter(
    (item) =>
      item.latitude !== null &&
      item.latitude !== undefined &&
      item.longitude !== null &&
      item.longitude !== undefined
  );

  const centreLatitude =
    latitude ?? equipementsGPS[0]?.latitude;

  const centreLongitude =
    longitude ?? equipementsGPS[0]?.longitude;

  const donneesEquipements = equipementsGPS.map((item) => ({
    nom: item.nom,
    localisation: item.localisation,
    latitude: item.latitude,
    longitude: item.longitude,
  }));

  const donneesSecurisees = JSON.stringify(donneesEquipements)
    .replace(/</g, '\\u003c');

  const donneesTechnicien = JSON.stringify(
    latitude !== undefined && longitude !== undefined
      ? { latitude, longitude }
      : null
  );

  const htmlCarte = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <style>
          html, body, #map {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

        <script>
          const equipements = ${donneesSecurisees};
          const technicien = ${donneesTechnicien};

          const centre = [
            ${centreLatitude ?? -11.6642},
            ${centreLongitude ?? 27.4820}
          ];

          const map = L.map('map').setView(centre, 15);

          L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 19
            }
          ).addTo(map);

          const marqueurs = [];

          if (technicien) {
            const marqueurTechnicien = L.marker([
              technicien.latitude,
              technicien.longitude
            ]).addTo(map);

            marqueurTechnicien.bindPopup(
              '<strong>Position du technicien</strong>'
            );

            marqueurs.push(marqueurTechnicien);
          }

          equipements.forEach((item) => {
            const marqueur = L.marker([
              item.latitude,
              item.longitude
            ]).addTo(map);

            marqueur.bindPopup(
              '<strong>' + item.nom + '</strong><br>' +
              'Localisation : ' + item.localisation
            );

            marqueurs.push(marqueur);
          });

          if (marqueurs.length > 1) {
            const groupe = L.featureGroup(marqueurs);
            map.fitBounds(groupe.getBounds().pad(0.2));
          }
        </script>
      </body>
    </html>
  `;

  const carteDisponible =
    position !== null || equipementsGPS.length > 0;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titre}>Géolocalisation</Text>

      <Text style={styles.description}>
        Retrouvez la position du technicien et localisez les équipements
        informatiques sur une carte.
      </Text>

      <View style={styles.carte}>
        <Text style={styles.sousTitre}>
          Position du technicien
        </Text>

        {chargement ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : position ? (
          <>
            <Text style={styles.label}>Latitude</Text>
            <Text style={styles.valeur}>
              {latitude?.toFixed(6)}
            </Text>

            <Text style={styles.label}>Longitude</Text>
            <Text style={styles.valeur}>
              {longitude?.toFixed(6)}
            </Text>

            <Text style={styles.label}>Précision GPS</Text>
            <Text style={styles.valeur}>
              {position.coords.accuracy
                ? `${position.coords.accuracy.toFixed(2)} mètres`
                : 'Non disponible'}
            </Text>
          </>
        ) : (
          <Text style={styles.message}>
            Appuyez sur le bouton pour obtenir votre position.
          </Text>
        )}

        {erreur ? (
          <Text style={styles.erreur}>{erreur}</Text>
        ) : null}
      </View>

      <View style={styles.carte}>
        <Text style={styles.sousTitre}>
          Équipements géolocalisés
        </Text>

        {chargementEquipements ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : equipementsGPS.length > 0 ? (
          equipementsGPS.map((item) => (
            <View key={item.id} style={styles.equipement}>
              <Text style={styles.nomEquipement}>
                {item.nom}
              </Text>

              <Text style={styles.message}>
                Localisation : {item.localisation}
              </Text>

              <Text style={styles.coordonnees}>
                GPS : {item.latitude?.toFixed(6)}, {item.longitude?.toFixed(6)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.message}>
            Aucun équipement ne possède encore de coordonnées GPS.
            Enregistrez sa position depuis la page Équipements.
          </Text>
        )}
      </View>

      {carteDisponible && (
        <View style={styles.carte}>
          <Text style={styles.sousTitre}>
            Carte du parc informatique
          </Text>

          {Platform.OS === 'web' ? (
            <iframe
              title="Carte du parc informatique"
              srcDoc={htmlCarte}
              width="100%"
              height="350"
              style={{
                border: 0,
                borderRadius: 10,
              }}
            />
          ) : (
            <WebView
              source={{ html: htmlCarte }}
              style={styles.webview}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
            />
          )}

          <Text style={styles.message}>
            Les marqueurs indiquent la position du technicien et celle
            des équipements géolocalisés.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.bouton}
        onPress={obtenirPosition}
        disabled={chargement}
      >
        <Text style={styles.texteBouton}>
          {chargement ? 'Localisation...' : 'Obtenir ma position'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.boutonSecondaire}
        onPress={chargerEquipements}
        disabled={chargementEquipements}
      >
        <Text style={styles.texteBouton}>
          {chargementEquipements
            ? 'Actualisation...'
            : 'Actualiser les équipements'}
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
    marginBottom: 12,
  },
  boutonSecondaire: {
    backgroundColor: '#1E40AF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 25,
  },
  texteBouton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  message: {
    color: '#6B7280',
    marginVertical: 8,
  },
  erreur: {
    color: '#DC2626',
    marginTop: 10,
  },
  webview: {
    height: 350,
    width: '100%',
    borderRadius: 10,
  },
  equipement: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  nomEquipement: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  coordonnees: {
    color: '#2563EB',
    fontSize: 13,
    marginTop: 4,
  },
});
