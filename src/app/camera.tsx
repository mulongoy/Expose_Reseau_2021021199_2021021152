
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import * as FileSystem from 'expo-file-system/legacy';

type TypePhoto = 'Avant' | 'Après';

type PhotoEnregistree = {
  uri: string;
  type: TypePhoto;
  date: string;
};

const FICHIER_PHOTOS = 'photos_maintenance.json';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [typePhoto, setTypePhoto] = useState<TypePhoto>('Avant');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoEnregistree[]>([]);
  const [chargement, setChargement] = useState(false);

  // Charger les photos déjà enregistrées
  useEffect(() => {
    chargerPhotos();
  }, []);

  async function chargerPhotos() {
    try {
      const chemin = FileSystem.documentDirectory + FICHIER_PHOTOS;
      const fichier = await FileSystem.getInfoAsync(chemin);

      if (fichier.exists) {
        const contenu = await FileSystem.readAsStringAsync(chemin);
        setPhotos(JSON.parse(contenu));
      }
    } catch (error) {
      console.error('Erreur de chargement des photos :', error);
    }
  }

  // Prendre une photo avec la caméra
  async function prendrePhoto() {
    if (!cameraRef.current) {
      Alert.alert('Erreur', 'La caméra n’est pas disponible.');
      return;
    }

    try {
      const resultat = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (resultat?.uri) {
        setPhoto(resultat.uri);
        setCameraActive(false);
      }
    } catch (error) {
      console.error('Erreur caméra :', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    }
  }

  // Sauvegarder la photo dans le stockage local
  async function sauvegarderPhoto() {
    if (!photo) return;

    try {
      setChargement(true);

      const dossier = FileSystem.documentDirectory;

      if (!dossier) {
        throw new Error('Stockage local indisponible.');
      }

      const nomFichier = `maintenance_${typePhoto.toLowerCase()}_${Date.now()}.jpg`;
      const destination = dossier + nomFichier;

      await FileSystem.copyAsync({
        from: photo,
        to: destination,
      });

      const nouvellePhoto: PhotoEnregistree = {
        uri: destination,
        type: typePhoto,
        date: new Date().toLocaleString(),
      };

      const nouvelleListe = [nouvellePhoto, ...photos];

      await FileSystem.writeAsStringAsync(
        dossier + FICHIER_PHOTOS,
        JSON.stringify(nouvelleListe)
      );

      setPhotos(nouvelleListe);
      setPhoto(null);

      Alert.alert(
        'Photo sauvegardée',
        `La photo ${typePhoto.toLowerCase()} maintenance a été enregistrée avec succès.`
      );
    } catch (error) {
      console.error('Erreur de sauvegarde :', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la photo.');
    } finally {
      setChargement(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Chargement des permissions...</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.titre}>Audit visuel des équipements</Text>
        <Text style={styles.message}>
          La prise et la sauvegarde des photos seront testées
          sur un appareil Android.
        </Text>
        <Text style={styles.message}>
          Le module caméra et la sauvegarde locale sont préparés.
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.titre}>Caméra</Text>
        <Text style={styles.message}>
          Autorisez l'accès à la caméra pour photographier
          les équipements avant et après maintenance.
        </Text>

        <TouchableOpacity
          style={styles.bouton}
          onPress={requestPermission}
        >
          <Text style={styles.texteBouton}>
            Autoriser la caméra
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titre}>
        Audit visuel des équipements
      </Text>

      <Text style={styles.message}>
        Photographiez l'équipement avant et après
        chaque opération de maintenance.
      </Text>

      <Text style={styles.sousTitre}>
        Type de photographie
      </Text>

      <View style={styles.ligneBoutons}>
        <TouchableOpacity
          style={[
            styles.boutonType,
            typePhoto === 'Avant' && styles.boutonSelectionne,
          ]}
          onPress={() => setTypePhoto('Avant')}
        >
          <Text style={styles.texteBouton}>
            Avant maintenance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.boutonType,
            typePhoto === 'Après' && styles.boutonSelectionne,
          ]}
          onPress={() => setTypePhoto('Après')}
        >
          <Text style={styles.texteBouton}>
            Après maintenance
          </Text>
        </TouchableOpacity>
      </View>

      {cameraActive ? (
        <View>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          />

          <TouchableOpacity
            style={styles.bouton}
            onPress={prendrePhoto}
          >
            <Text style={styles.texteBouton}>
              📸 Prendre la photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.boutonSecondaire}
            onPress={() => setCameraActive(false)}
          >
            <Text style={styles.texteSecondaire}>
              Fermer la caméra
            </Text>
          </TouchableOpacity>
        </View>
      ) : photo ? (
        <View>
          <Image
            source={{ uri: photo }}
            style={styles.apercu}
          />

          <TouchableOpacity
            style={styles.bouton}
            onPress={sauvegarderPhoto}
            disabled={chargement}
          >
            <Text style={styles.texteBouton}>
              {chargement ? 'Sauvegarde...' : '💾 Sauvegarder la photo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.boutonSecondaire}
            onPress={() => setPhoto(null)}
          >
            <Text style={styles.texteSecondaire}>
              Reprendre une photo
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.espaceVide}>
          <Text style={styles.message}>
            Aucune photo en cours.
          </Text>

          <TouchableOpacity
            style={styles.bouton}
            onPress={() => setCameraActive(true)}
          >
            <Text style={styles.texteBouton}>
              Ouvrir la caméra
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sousTitre}>
        Photos enregistrées ({photos.length})
      </Text>

      {photos.length === 0 ? (
        <Text style={styles.message}>
          Aucune photo sauvegardée pour le moment.
        </Text>
      ) : (
        photos.map((item, index) => (
          <View style={styles.cartePhoto} key={item.uri}>
            <Image
              source={{ uri: item.uri }}
              style={styles.miniature}
            />

            <View style={styles.infoPhoto}>
              <Text style={styles.nomPhoto}>
                Photo {item.type} maintenance
              </Text>
              <Text style={styles.datePhoto}>
                {item.date}
              </Text>
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
    padding: 20,
  },
  titre: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 15,
    lineHeight: 22,
  },
  sousTitre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginTop: 22,
    marginBottom: 12,
  },
  ligneBoutons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  boutonType: {
    flex: 1,
    backgroundColor: '#64748B',
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  boutonSelectionne: {
    backgroundColor: '#153E75',
  },
  camera: {
    width: '100%',
    height: 350,
    borderRadius: 12,
    overflow: 'hidden',
  },
  apercu: {
    width: '100%',
    height: 350,
    resizeMode: 'contain',
    backgroundColor: '#111827',
  },
  espaceVide: {
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
  },
  bouton: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  texteBouton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  boutonSecondaire: {
    backgroundColor: '#E5E7EB',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  texteSecondaire: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  cartePhoto: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  miniature: {
    width: 75,
    height: 75,
    borderRadius: 8,
  },
  infoPhoto: {
    flex: 1,
    marginLeft: 12,
  },
  nomPhoto: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  datePhoto: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
  },
});
