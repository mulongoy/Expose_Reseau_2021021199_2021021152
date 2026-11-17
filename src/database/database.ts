
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

type Equipement = {
  id: number;
  nom: string;
  type: string;
  localisation: string;
  date_installation: string;
  latitude?: number | null;
  longitude?: number | null;
};

// Connexion SQLite ouverte uniquement sur Android et iOS
let dbPromise: ReturnType<typeof SQLite.openDatabaseAsync> | null = null;

async function getDatabase() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('maintenance.db');
  }
  return await dbPromise;
}

// Stockage temporaire pour les tests sur navigateur
const STORAGE_KEY = 'maintenance_equipements';

function lireEquipementsWeb(): Equipement[] {
  const donnees = localStorage.getItem(STORAGE_KEY);
  return donnees ? JSON.parse(donnees) : [];
}

function enregistrerEquipementsWeb(equipements: Equipement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(equipements));
}

// Initialiser les tables SQLite
export async function initDatabase() {
  if (Platform.OS === 'web') {
    return;
  }

  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS equipements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      type TEXT NOT NULL,
      localisation TEXT NOT NULL,
      date_installation TEXT,
      latitude REAL,
      longitude REAL
    );

    CREATE TABLE IF NOT EXISTS techniciens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      specialite TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interventions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipement_id INTEGER,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      technicien TEXT NOT NULL,
      FOREIGN KEY (equipement_id) REFERENCES equipements(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_planifiee (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipement_id INTEGER,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      commentaire TEXT,
      FOREIGN KEY (equipement_id) REFERENCES equipements(id)
    );
  `);

  // Ajouter les colonnes GPS si elles n'existent pas encore
  const colonnes = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(equipements)'
  );

  if (!colonnes.some((colonne) => colonne.name === 'latitude')) {
    await db.execAsync(
      'ALTER TABLE equipements ADD COLUMN latitude REAL'
    );
  }

  if (!colonnes.some((colonne) => colonne.name === 'longitude')) {
    await db.execAsync(
      'ALTER TABLE equipements ADD COLUMN longitude REAL'
    );
  }

  return db;
}

// Récupérer tous les équipements
export async function getEquipements(): Promise<Equipement[]> {
  if (Platform.OS === 'web') {
    return lireEquipementsWeb();
  }

  const db = await getDatabase();

  return await db.getAllAsync<Equipement>(
    'SELECT * FROM equipements ORDER BY id DESC'
  );
}

// Ajouter un équipement
export async function ajouterEquipement(
  nom: string,
  type: string,
  localisation: string,
  date_installation: string
) {
  if (Platform.OS === 'web') {
    const equipements = lireEquipementsWeb();

    const nouvelEquipement: Equipement = {
      id: Date.now(),
      nom,
      type,
      localisation,
      date_installation,
      latitude: null,
      longitude: null,
    };

    enregistrerEquipementsWeb([nouvelEquipement, ...equipements]);
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'INSERT INTO equipements (nom, type, localisation, date_installation) VALUES (?, ?, ?, ?)',
    [nom, type, localisation, date_installation]
  );
}

// Supprimer un équipement
export async function supprimerEquipement(id: number) {
  if (Platform.OS === 'web') {
    const equipements = lireEquipementsWeb().filter(
      (item) => item.id !== id
    );

    enregistrerEquipementsWeb(equipements);
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'DELETE FROM equipements WHERE id = ?',
    [id]
  );
}

// Modifier un équipement
export async function modifierEquipement(
  id: number,
  nom: string,
  type: string,
  localisation: string,
  date_installation: string
) {
  if (Platform.OS === 'web') {
    const equipements = lireEquipementsWeb().map((item) =>
      item.id === id
        ? {
            ...item,
            nom,
            type,
            localisation,
            date_installation,
          }
        : item
    );

    enregistrerEquipementsWeb(equipements);
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'UPDATE equipements SET nom = ?, type = ?, localisation = ?, date_installation = ? WHERE id = ?',
    [nom, type, localisation, date_installation, id]
  );
}

// Enregistrer les coordonnées GPS d'un équipement
export async function mettreAJourCoordonneesEquipement(
  id: number,
  latitude: number,
  longitude: number
) {
  if (Platform.OS === 'web') {
    const equipements = lireEquipementsWeb().map((item) =>
      item.id === id
        ? { ...item, latitude, longitude }
        : item
    );

    enregistrerEquipementsWeb(equipements);
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'UPDATE equipements SET latitude = ?, longitude = ? WHERE id = ?',
    [latitude, longitude, id]
  );
}

// Type d'un technicien
export type Technicien = {
  id: number;
  nom: string;
  specialite: string;
};

// Récupérer tous les techniciens
export async function getTechniciens(): Promise<Technicien[]> {
  if (Platform.OS === 'web') {
    const donnees = localStorage.getItem('maintenance_techniciens');
    return donnees ? JSON.parse(donnees) : [];
  }

  const db = await getDatabase();

  return await db.getAllAsync<Technicien>(
    'SELECT * FROM techniciens ORDER BY id DESC'
  );
}

// Ajouter un technicien
export async function ajouterTechnicien(
  nom: string,
  specialite: string
) {
  if (Platform.OS === 'web') {
    const techniciens = await getTechniciens();

    techniciens.unshift({
      id: Date.now(),
      nom,
      specialite,
    });

    localStorage.setItem(
      'maintenance_techniciens',
      JSON.stringify(techniciens)
    );
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'INSERT INTO techniciens (nom, specialite) VALUES (?, ?)',
    [nom, specialite]
  );
}

// Supprimer un technicien
export async function supprimerTechnicien(id: number) {
  if (Platform.OS === 'web') {
    const techniciens = (await getTechniciens()).filter(
      (item) => item.id !== id
    );

    localStorage.setItem(
      'maintenance_techniciens',
      JSON.stringify(techniciens)
    );
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'DELETE FROM techniciens WHERE id = ?',
    [id]
  );
}

// Modifier un technicien
export async function modifierTechnicien(
  id: number,
  nom: string,
  specialite: string
) {
  if (Platform.OS === 'web') {
    const techniciens = (await getTechniciens()).map((item) =>
      item.id === id ? { id, nom, specialite } : item
    );

    localStorage.setItem(
      'maintenance_techniciens',
      JSON.stringify(techniciens)
    );
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'UPDATE techniciens SET nom = ?, specialite = ? WHERE id = ?',
    [nom, specialite, id]
  );
}

// Type d'une maintenance planifiée
export type Maintenance = {
  id: number;
  equipement_id: number;
  date: string;
  type: string;
  commentaire: string;
};

// Récupérer toutes les maintenances
export async function getMaintenances(): Promise<Maintenance[]> {
  if (Platform.OS === 'web') {
    const donnees = localStorage.getItem('maintenance_planifiees');
    return donnees ? JSON.parse(donnees) : [];
  }

  const db = await getDatabase();

  return await db.getAllAsync<Maintenance>(
    'SELECT * FROM maintenance_planifiee ORDER BY date ASC'
  );
}

// Ajouter une maintenance
export async function ajouterMaintenance(
  equipement_id: number,
  date: string,
  type: string,
  commentaire: string
) {
  if (Platform.OS === 'web') {
    const maintenances = await getMaintenances();

    maintenances.unshift({
      id: Date.now(),
      equipement_id,
      date,
      type,
      commentaire,
    });

    localStorage.setItem(
      'maintenance_planifiees',
      JSON.stringify(maintenances)
    );
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'INSERT INTO maintenance_planifiee (equipement_id, date, type, commentaire) VALUES (?, ?, ?, ?)',
    [equipement_id, date, type, commentaire]
  );
}

// Modifier une maintenance
export async function modifierMaintenance(
  id: number,
  equipement_id: number,
  date: string,
  type: string,
  commentaire: string
) {
  if (Platform.OS === 'web') {
    const maintenances = (await getMaintenances()).map((item) =>
      item.id === id
        ? { id, equipement_id, date, type, commentaire }
        : item
    );

    localStorage.setItem(
      'maintenance_planifiees',
      JSON.stringify(maintenances)
    );
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'UPDATE maintenance_planifiee SET equipement_id = ?, date = ?, type = ?, commentaire = ? WHERE id = ?',
    [equipement_id, date, type, commentaire, id]
  );
}

// Supprimer une maintenance
export async function supprimerMaintenance(id: number) {
  if (Platform.OS === 'web') {
    const maintenances = (await getMaintenances()).filter(
      (item) => item.id !== id
    );

    localStorage.setItem(
      'maintenance_planifiees',
      JSON.stringify(maintenances)
    );
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'DELETE FROM maintenance_planifiee WHERE id = ?',
    [id]
  );
}

// Type d'une intervention
export type Intervention = {
  id: number;
  equipement_id: number;
  date: string;
  description: string;
  technicien: string;
};

// Récupérer toutes les interventions
export async function getInterventions(): Promise<Intervention[]> {
  if (Platform.OS === 'web') {
    const donnees = localStorage.getItem('interventions');
    return donnees ? JSON.parse(donnees) : [];
  }

  const db = await getDatabase();

  return await db.getAllAsync<Intervention>(
    'SELECT * FROM interventions ORDER BY date DESC'
  );
}

// Ajouter une intervention
export async function ajouterIntervention(
  equipement_id: number,
  date: string,
  description: string,
  technicien: string
) {
  if (Platform.OS === 'web') {
    const interventions = await getInterventions();

    interventions.unshift({
      id: Date.now(),
      equipement_id,
      date,
      description,
      technicien,
    });

    localStorage.setItem('interventions', JSON.stringify(interventions));
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'INSERT INTO interventions (equipement_id, date, description, technicien) VALUES (?, ?, ?, ?)',
    [equipement_id, date, description, technicien]
  );
}

// Modifier une intervention
export async function modifierIntervention(
  id: number,
  equipement_id: number,
  date: string,
  description: string,
  technicien: string
) {
  if (Platform.OS === 'web') {
    const interventions = (await getInterventions()).map((item) =>
      item.id === id
        ? { id, equipement_id, date, description, technicien }
        : item
    );

    localStorage.setItem('interventions', JSON.stringify(interventions));
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'UPDATE interventions SET equipement_id = ?, date = ?, description = ?, technicien = ? WHERE id = ?',
    [equipement_id, date, description, technicien, id]
  );
}

// Supprimer une intervention
export async function supprimerIntervention(id: number) {
  if (Platform.OS === 'web') {
    const interventions = (await getInterventions()).filter(
      (item) => item.id !== id
    );

    localStorage.setItem('interventions', JSON.stringify(interventions));
    return;
  }

  const db = await getDatabase();

  await db.runAsync(
    'DELETE FROM interventions WHERE id = ?',
    [id]
  );
}
