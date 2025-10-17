import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DemographicsData } from '../components/DemographicsForm';
import { TaskResponse, SatisfactionResponse } from '../types/visualization';
import { FinalPreferenceResponse } from '../components/FinalPreferenceQuestionnaire';

/**
 * Firebase Service for Experiment Data
 *
 * This service handles all Firebase Firestore operations for the thesis experiment:
 * - Saving participant data
 * - Fetching the last participant's group for automatic counterbalancing
 * - Retrieving experiment results
 */

// Collection name in Firestore
const PARTICIPANTS_COLLECTION = 'participants';

/**
 * Interface for complete participant data stored in Firebase
 */
export interface ParticipantData {
  participantId: string;
  assignedGroup: 'A' | 'B';
  demographics: DemographicsData;
  taskResponses: TaskResponse[];
  satisfactionResponses: SatisfactionResponse[];
  umuxResponse?: any;
  finalPreference?: FinalPreferenceResponse;
  timestamp: Timestamp;
  completedAt?: Timestamp;
}

/**
 * Get the last participant's assigned group from Firebase
 * Used for automatic counterbalancing: if last was Group A, assign Group B (and vice versa)
 *
 * @returns Promise<'A' | 'B' | null> - Returns the opposite group for balancing, or null if no previous participants
 */
export const getNextBalancedGroup = async (): Promise<'A' | 'B' | null> => {
  try {
    // Check psppData collection (not participants) for most recent entry
    const q = query(
      collection(db, 'psppData'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('📊 No previous participants found in psppData. Returning null for default assignment.');
      return null; // No previous participants, use default logic
    }

    const lastParticipant = querySnapshot.docs[0].data();
    const lastGroup = lastParticipant.Group as 'A' | 'B'; // psppData uses 'Group' field

    // Return the opposite group for automatic counterbalancing
    const nextGroup = lastGroup === 'A' ? 'B' : 'A';
    console.log(`📊 Last participant (psppData) was Group ${lastGroup}, assigning Group ${nextGroup} for counterbalancing`);

    return nextGroup;
  } catch (error) {
    console.error('❌ Error fetching last participant group from psppData:', error);
    return null; // Fall back to default logic on error
  }
};

/**
 * Save participant data to Firebase
 *
 * @param data - Complete participant experiment data
 * @returns Promise<string> - Document ID of the saved participant
 */
export const saveParticipantData = async (data: Omit<ParticipantData, 'timestamp'>): Promise<string> => {
  try {
    const participantData: ParticipantData = {
      ...data,
      timestamp: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, PARTICIPANTS_COLLECTION), participantData);
    console.log('✅ Participant data saved to Firebase with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving participant data to Firebase:', error);
    throw error;
  }
};

/**
 * Get all participants data (for analysis/export)
 *
 * @returns Promise<ParticipantData[]> - Array of all participant data
 */
export const getAllParticipants = async (): Promise<ParticipantData[]> => {
  try {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const participants: ParticipantData[] = [];

    querySnapshot.forEach((doc) => {
      participants.push(doc.data() as ParticipantData);
    });

    console.log(`✅ Retrieved ${participants.length} participants from Firebase`);
    return participants;
  } catch (error) {
    console.error('❌ Error fetching participants:', error);
    throw error;
  }
};

/**
 * Get participant count by group (for monitoring balance)
 *
 * @returns Promise<{groupA: number, groupB: number}> - Count of participants in each group
 */
export const getGroupCounts = async (): Promise<{ groupA: number; groupB: number }> => {
  try {
    const allParticipants = await getAllParticipants();

    const groupA = allParticipants.filter(p => p.assignedGroup === 'A').length;
    const groupB = allParticipants.filter(p => p.assignedGroup === 'B').length;

    console.log(`📊 Group counts - A: ${groupA}, B: ${groupB}`);
    return { groupA, groupB };
  } catch (error) {
    console.error('❌ Error getting group counts:', error);
    return { groupA: 0, groupB: 0 };
  }
};

/**
 * Export all participant data as JSON (for local backup/analysis)
 *
 * @returns Promise<string> - JSON string of all participant data
 */
export const exportAllDataAsJSON = async (): Promise<string> => {
  try {
    const allParticipants = await getAllParticipants();
    return JSON.stringify(allParticipants, null, 2);
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  }
};

/**
 * Check if a participant has already completed the experiment
 *
 * @param participantId - UUID of the participant to check
 * @returns Promise<boolean> - True if participant exists in Firestore
 */
export const checkParticipantExists = async (participantId: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, PARTICIPANTS_COLLECTION),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);

    // Check if any document has matching participantId
    for (const doc of querySnapshot.docs) {
      const data = doc.data() as ParticipantData;
      if (data.participantId === participantId) {
        console.log('⚠️ Participant already exists in database:', participantId);
        return true;
      }
    }

    console.log('✅ Participant not found in database:', participantId);
    return false;
  } catch (error) {
    console.error('❌ Error checking participant existence:', error);
    // Return false to allow experiment to proceed if check fails
    return false;
  }
};

/**
 * Check if Firebase is properly configured
 *
 * @returns boolean - True if Firebase config looks valid
 */
export const isFirebaseConfigured = (): boolean => {
  try {
    // Simple check: if db is initialized and doesn't throw
    return db !== undefined && db !== null;
  } catch (error) {
    console.error('❌ Firebase not properly configured:', error);
    return false;
  }
};
