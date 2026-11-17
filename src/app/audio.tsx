
import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioPlayer,
    useAudioPlayerStatus,
    useAudioRecorder,
    useAudioRecorderState,
} from 'expo-audio';

import * as FileSystem from 'expo-file-system/legacy';

import { useEffect, useState } from 'react';

import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type MemoVocal = {
  id: string;
  uri: string;
  date: string;
};

const DOSSIER = FileSystem.documentDirectory;
const FICHIER_MEMOS = `${DOSSIER}memos_vocaux.json`;

export default function AudioScreen() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [message, setMessage] = useState(
    'Aucun mémo vocal enregistré.'
  );

  const [memos, setMemos] = useState<MemoVocal[]>([]);
  const [audioSelectionne, setAudioSelectionne] = useState<string | null>(null);

  const player = useAudioPlayer(audioSelectionne);
  const playerStatus = useAudioPlayerStatus(player);

  // Charger les mémos sauvegardés
  useEffect(() => {
    chargerMemos();
  }, []);

  async function chargerMemos() {
    try {
      if (!DOSSIER) return;

      const fichier = await FileSystem.getInfoAsync(FICHIER_MEMOS);

      if (fichier.exists) {
        const contenu = await FileSystem.readAsStringAsync(FICHIER_MEMOS);
        setMemos(JSON.parse(contenu));
      }
    } catch (error) {
      console.error('Erreur de chargement des mémos :', error);
    }
  }

  // Préparer et démarrer l'enregistrement
  async function commencerEnregistrement() {
    try {
      const permission =
        await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        setMessage('Autorisation du microphone refusée.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();

      setAudioSelectionne(null);
      setMessage('Enregistrement en cours...');
    } catch (error) {
      console.error('Erreur audio :', error);
      setMessage("Impossible de démarrer l'enregistrement.");
    }
  }

  // Arrêter et sauvegarder l'enregistrement
  async function arreterEnregistrement() {
    try {
      await recorder.stop();

      const uriOriginale = recorder.uri;

      if (!uriOriginale || !DOSSIER) {
        setMessage('Fichier audio introuvable.');
        return;
      }

      const id = Date.now().toString();
      const nouveauChemin = `${DOSSIER}memo_${id}.m4a`;

      await FileSystem.copyAsync({
        from: uriOriginale,
        to: nouveauChemin,
      });

      const nouveauMemo: MemoVocal = {
        id,
        uri: nouveauChemin,
        date: new Date().toLocaleString(),
      };

      const nouvelleListe = [nouveauMemo, ...memos];

      await FileSystem.writeAsStringAsync(
        FICHIER_MEMOS,
        JSON.stringify(nouvelleListe)
      );

      setMemos(nouvelleListe);
      setMessage('Mémo vocal enregistré avec succès !');
    } catch (error) {
      console.error('Erreur de sauvegarde :', error);
      setMessage('Erreur pendant la sauvegarde du mémo.');
    }
  }

  // Lire un mémo
  async function lireMemo(uri: string) {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
      });

      setAudioSelectionne(uri);

      // Le lecteur sera associé à l'URI sélectionnée.
      // La lecture démarre après le changement de source.
      player.replace(uri);
      player.play();
    } catch (error) {
      console.error('Erreur de lecture :', error);
      Alert.alert('Erreur', 'Impossible de lire ce mémo vocal.');
    }
  }

  function arreterLecture() {
    player.pause();
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.titre}>Mémos vocaux</Text>

        <Text style={styles.message}>
          Les enregistrements vocaux seront testés sur un appareil Android.
        </Text>

        <Text style={styles.message}>
          Le module audio et la sauvegarde locale sont préparés.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titre}>Mémos vocaux</Text>

      <View style={styles.carte}>
        <Text style={styles.sousTitre}>
          Note vocale d'intervention
        </Text>

        <Text style={styles.message}>{message}</Text>

        {recorderState.isRecording && (
          <Text style={styles.enregistrement}>
            ● Enregistrement en cours
          </Text>
        )}

        {!recorderState.isRecording ? (
          <TouchableOpacity
            style={styles.bouton}
            onPress={commencerEnregistrement}
          >
            <Text style={styles.texteBouton}>
              Commencer l'enregistrement
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.boutonArret}
            onPress={arreterEnregistrement}
          >
            <Text style={styles.texteBouton}>
              Arrêter et sauvegarder
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.carte}>
        <Text style={styles.sousTitre}>
          Mémos enregistrés ({memos.length})
        </Text>

        {memos.length === 0 ? (
          <Text style={styles.message}>
            Aucun mémo vocal disponible.
          </Text>
        ) : (
          memos.map((memo) => (
            <View key={memo.id} style={styles.memo}>
              <Text style={styles.date}>
                Enregistré le : {memo.date}
              </Text>

              <TouchableOpacity
                style={styles.boutonLecture}
                onPress={() => lireMemo(memo.uri)}
              >
                <Text style={styles.texteBouton}>
                  Écouter ce mémo
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {audioSelectionne && (
          <TouchableOpacity
            style={styles.boutonArret}
            onPress={arreterLecture}
          >
            <Text style={styles.texteBouton}>
              Arrêter la lecture
            </Text>
          </TouchableOpacity>
        )}
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
    marginBottom: 20,
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
  message: {
    color: '#4B5563',
    fontSize: 15,
    marginBottom: 15,
  },
  enregistrement: {
    color: '#DC2626',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  bouton: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  boutonArret: {
    backgroundColor: '#DC2626',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  boutonLecture: {
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  texteBouton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  memo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
  },
  date: {
    color: '#374151',
    fontSize: 14,
  },
});
