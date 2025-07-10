// src/lib/journal-operations.ts
import { 
  db, 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query,
  orderBy, 
  getDocs,
  deleteDoc,
  serverTimestamp,
  addDoc
} from './firebase';
import { JournalEntry, JournalMessage } from '@/types/journals';
import { decryptData } from './encryption';

export const journalOperations = {
  async create(journal: Omit<JournalEntry, 'id'>): Promise<string> {
    const journalsCollectionRef = collection(db, `users/${journal.userId}/journals`);
    const newJournalRef = await addDoc(journalsCollectionRef, {
      ...journal,
      metadata: {
        ...journal.metadata,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    });
    return newJournalRef.id;
  },

  async update(userId: string, journalId: string, updates: Partial<JournalEntry>): Promise<void> {
    const docRef = doc(db, `users/${userId}/journals/${journalId}`);
    await updateDoc(docRef, {
      ...updates,
      metadata: {
        ...updates.metadata,
        updatedAt: serverTimestamp()
      }
    });
  },

  async get(userId: string, journalId: string, userPassphrase?: string): Promise<JournalEntry | null> {
    const docRef = doc(db, `users/${userId}/journals/${journalId}`);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = { id: docSnap.id, ...docSnap.data() } as JournalEntry;
    
    if (data.encryptedContent && userPassphrase) {
      try {
        const decryptedContent = await decryptData(
          data.encryptedContent,
          userPassphrase,
          data.salt!,
          data.iv!
        );
        return {
          ...data,
          content: decryptedContent
        };
      } catch {
        // Silent fallback to encrypted data if decryption fails
        return data;
      }
    }

    return data;
  },

  async getByUser(userId: string, userPassphrase?: string): Promise<JournalEntry[]> {
    const q = query(
      collection(db, `users/${userId}/journals`),
      orderBy('metadata.updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const journals: JournalEntry[] = [];
    
    for (const doc of querySnapshot.docs) {
      const data = { id: doc.id, ...doc.data() } as JournalEntry;
      
      if (data.encryptedContent && userPassphrase) {
        try {
          const decryptedContent = await decryptData(
            data.encryptedContent,
            userPassphrase,
            data.salt!,
            data.iv!
          );
          journals.push({
            ...data,
            content: decryptedContent
          });
        } catch {
          // Silent fallback to encrypted data if decryption fails
          journals.push(data);
        }
      } else {
        journals.push(data);
      }
    }
    
    return journals;
  },

  async delete(userId: string, journalId: string): Promise<void> {
    const docRef = doc(db, `users/${userId}/journals/${journalId}`);
    await deleteDoc(docRef);
  }
};

export const journalMessageOperations = {
  async create(userId: string, journalId: string, message: Omit<JournalMessage, 'id' | 'journalId'>): Promise<string> {
    const messagesCollectionRef = collection(db, `users/${userId}/journals/${journalId}/messages`);
    const newMessageRef = await addDoc(messagesCollectionRef, {
      ...message,
      journalId,
      timestamp: serverTimestamp()
    });
    return newMessageRef.id;
  },

  async getByJournal(userId: string, journalId: string, userPassphrase?: string): Promise<JournalMessage[]> {
    const q = query(
      collection(db, `users/${userId}/journals/${journalId}/messages`),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const messages: JournalMessage[] = [];
    
    for (const doc of querySnapshot.docs) {
      const data = { id: doc.id, ...doc.data() } as JournalMessage;
      
      if (data.encryptedContent && userPassphrase) {
        try {
          const decryptedContent = await decryptData(
            data.encryptedContent,
            userPassphrase,
            data.salt!,
            data.iv!
          );
          messages.push({
            ...data,
            content: decryptedContent
          });
        } catch {
          // Silent fallback to encrypted data if decryption fails
          messages.push(data);
        }
      } else {
        messages.push(data);
      }
    }
    
    return messages;
  },

  async delete(userId: string, journalId: string, messageId: string): Promise<void> {
    const docRef = doc(db, `users/${userId}/journals/${journalId}/messages/${messageId}`);
    await deleteDoc(docRef);
  }
};
