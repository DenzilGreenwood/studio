/**
 * DataService - Main Firestore Interface
 * Version: 1.0.0
 * Date: July 9, 2025
 * 
 * Centralized TypeScript module for managing all Firestore interactions
 * in compliance with Zero-Knowledge Encryption (ZKE) architecture v1.1.2
 * and Firebase security rules.
 */

import { 
  doc, 
  collection, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  writeBatch,
  onSnapshot,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
  type FieldValue,
  type WhereFilterOp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { encryptContent, decryptContent } from '@/dataservice/cryptoService';

/**
 * Base data types
 */
type BaseDocument = Record<string, unknown>;

/**
 * Query filter type
 */
type QueryFilter = {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
};

/**
 * Query options type
 */
type QueryOptions = {
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  where?: QueryFilter[];
};

/**
 * Batch operation type
 */
type BatchOperation = {
  type: 'set' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: BaseDocument;
};

/**
 * Base interface for all encrypted documents
 */
interface EncryptedDocument {
  encryptedData: string;
  metadata: {
    salt: string;
    iv: string;
    version: string;
  };
  createdAt?: FieldValue;
  updatedAt?: FieldValue;
}

/**
 * Journal entry interface
 */
interface JournalEntry extends BaseDocument {
  content: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

/**
 * Session data interface
 */
interface SessionData extends BaseDocument {
  // Session-specific fields can be added here
}

/**
 * Report data interface
 */
interface ReportData extends BaseDocument {
  reportType: string;
  generatedAt: string;
}

/**
 * Trash item interface
 */
interface TrashItem extends BaseDocument {
  deletedAt: Date;
  originalCollection: string;
}

/**
 * DataService class - Centralized Firestore operations with encryption
 */
export class DataService {
  private userId: string;
  private encryptionKey: CryptoKey;

  constructor(userId: string, encryptionKey: CryptoKey) {
    this.userId = userId;
    this.encryptionKey = encryptionKey;
  }

  /**
   * Validate user ownership of a document path
   */
  private validateOwnership(path: string): boolean {
    return path.includes(`users/${this.userId}/`) || 
           path.includes(`/${this.userId}/`) ||
           path.startsWith(`users/${this.userId}`);
  }

  /**
   * Get a document path with user validation
   */
  private getDocPath(collection: string, docId: string): string {
    const path = `users/${this.userId}/${collection}/${docId}`;
    if (!this.validateOwnership(path)) {
      throw new Error('Invalid document path: user ownership required');
    }
    return path;
  }

  /**
   * Save encrypted document to Firestore
   */
  async saveDocument<T extends BaseDocument>(
    collection: string,
    docId: string,
    data: T,
    merge: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const docPath = this.getDocPath(collection, docId);
      const encrypted = await encryptContent(data, this.encryptionKey);
      
      const docData: EncryptedDocument = {
        ...encrypted,
        updatedAt: serverTimestamp(),
        ...(merge ? {} : { createdAt: serverTimestamp() })
      };

      const docRef = doc(db, docPath);
      await setDoc(docRef, docData, { merge });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save document' 
      };
    }
  }

  /**
   * Get and decrypt document from Firestore
   */
  async getDocument<T extends BaseDocument>(
    collection: string,
    docId: string
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const docPath = this.getDocPath(collection, docId);
      const docRef = doc(db, docPath);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'Document not found' };
      }

      const encryptedData = snapshot.data() as EncryptedDocument;
      const decrypted = await decryptContent<T>(encryptedData, this.encryptionKey);

      return { success: true, data: decrypted };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get document' 
      };
    }
  }

  /**
   * Update encrypted document in Firestore
   */
  async updateDocument<T extends BaseDocument>(
    collection: string,
    docId: string,
    data: Partial<T>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get existing document first
      const existing = await this.getDocument<T>(collection, docId);
      if (!existing.success || !existing.data) {
        return { success: false, error: 'Document not found for update' };
      }

      // Merge with existing data
      const updatedData = { ...existing.data, ...data };
      
      // Save the merged data
      return await this.saveDocument(collection, docId, updatedData, true);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update document' 
      };
    }
  }

  /**
   * Delete document from Firestore
   */
  async deleteDocument(
    collection: string,
    docId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const docPath = this.getDocPath(collection, docId);
      const docRef = doc(db, docPath);
      await deleteDoc(docRef);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete document' 
      };
    }
  }

  /**
   * Get multiple documents from a collection
   */
  async getCollection<T extends BaseDocument>(
    collectionName: string,
    options?: {
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      limit?: number;
      where?: QueryFilter[];
    }
  ): Promise<{ success: boolean; data?: T[]; error?: string }> {
    try {
      const collectionPath = `users/${this.userId}/${collectionName}`;
      const collectionRef = collection(db, collectionPath);
      
      let q = query(collectionRef);

      // Apply filters
      if (options?.where) {
        options.where.forEach(({ field, operator, value }) => {
          q = query(q, where(field, operator, value));
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // Apply limit
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      const documents: T[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const encryptedData = docSnapshot.data() as EncryptedDocument;
        const decrypted = await decryptContent<T>(encryptedData, this.encryptionKey);
        documents.push({ ...decrypted, id: docSnapshot.id } as T);
      }

      return { success: true, data: documents };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get collection' 
      };
    }
  }

  /**
   * Listen to real-time updates for a document
   */
  onDocumentSnapshot<T extends BaseDocument>(
    collection: string,
    docId: string,
    callback: (data: T | null, error?: string) => void
  ): Unsubscribe {
    try {
      const docPath = this.getDocPath(collection, docId);
      const docRef = doc(db, docPath);

      return onSnapshot(docRef, 
        async (snapshot) => {
          if (!snapshot.exists()) {
            callback(null);
            return;
          }

          try {
            const encryptedData = snapshot.data() as EncryptedDocument;
            const decrypted = await decryptContent<T>(encryptedData, this.encryptionKey);
            callback(decrypted);
          } catch (error) {
            callback(null, error instanceof Error ? error.message : 'Decryption failed');
          }
        },
        (error) => {
          callback(null, error.message);
        }
      );
    } catch (error) {
      // Return a no-op unsubscribe function if setup fails
      callback(null, error instanceof Error ? error.message : 'Failed to setup listener');
      return () => {};
    }
  }

  /**
   * Listen to real-time updates for a collection
   */
  onCollectionSnapshot<T extends BaseDocument>(
    collectionName: string,
    callback: (data: T[], error?: string) => void,
    options?: {
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      limit?: number;
      where?: QueryFilter[];
    }
  ): Unsubscribe {
    try {
      const collectionPath = `users/${this.userId}/${collectionName}`;
      const collectionRef = collection(db, collectionPath);
      
      let q = query(collectionRef);

      // Apply filters
      if (options?.where) {
        options.where.forEach(({ field, operator, value }) => {
          q = query(q, where(field, operator, value));
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // Apply limit
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      return onSnapshot(q,
        async (querySnapshot: QuerySnapshot<DocumentData>) => {
          try {
            const documents: T[] = [];

            for (const docSnapshot of querySnapshot.docs) {
              const encryptedData = docSnapshot.data() as EncryptedDocument;
              const decrypted = await decryptContent<T>(encryptedData, this.encryptionKey);
              documents.push({ ...decrypted, id: docSnapshot.id } as T);
            }

            callback(documents);
          } catch (error) {
            callback([], error instanceof Error ? error.message : 'Decryption failed');
          }
        },
        (error) => {
          callback([], error.message);
        }
      );
    } catch (error) {
      // Return a no-op unsubscribe function if setup fails
      callback([], error instanceof Error ? error.message : 'Failed to setup listener');
      return () => {};
    }
  }

  /**
   * Batch operations for multiple documents
   */
  async batchWrite(
    operations: Array<{
      type: 'set' | 'update' | 'delete';
      collection: string;
      docId: string;
      data?: BaseDocument;
    }>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const batch = writeBatch(db);

      for (const operation of operations) {
        const docPath = this.getDocPath(operation.collection, operation.docId);
        const docRef = doc(db, docPath);

        switch (operation.type) {
          case 'set':
            if (!operation.data) {
              throw new Error('Data required for set operation');
            }
            const encrypted = await encryptContent(operation.data, this.encryptionKey);
            const docData: EncryptedDocument = {
              ...encrypted,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            batch.set(docRef, docData);
            break;

          case 'update':
            if (!operation.data) {
              throw new Error('Data required for update operation');
            }
            // For updates, we need to encrypt the partial data
            const encryptedUpdate = await encryptContent(operation.data, this.encryptionKey);
            batch.update(docRef, {
              ...encryptedUpdate,
              updatedAt: serverTimestamp()
            });
            break;

          case 'delete':
            batch.delete(docRef);
            break;
        }
      }

      await batch.commit();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Batch operation failed' 
      };
    }
  }

  /**
   * Move document to trash (soft delete)
   */
  async moveToTrash(
    collection: string,
    docId: string,
    originalCollection: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the document first
      const document = await this.getDocument(collection, docId);
      if (!document.success || !document.data) {
        return { success: false, error: 'Document not found' };
      }

      // Create trash entry
      const trashData = {
        ...document.data,
        deletedAt: new Date(),
        originalCollection
      };

      // Save to trash and delete original
      const trashResult = await this.saveDocument('trash', docId, trashData);
      if (!trashResult.success) {
        return trashResult;
      }

      const deleteResult = await this.deleteDocument(collection, docId);
      return deleteResult;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to move to trash' 
      };
    }
  }

  /**
   * Restore document from trash
   */
  async restoreFromTrash(
    docId: string,
    targetCollection: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get from trash
      const trashDoc = await this.getDocument('trash', docId);
      if (!trashDoc.success || !trashDoc.data) {
        return { success: false, error: 'Document not found in trash' };
      }

      // Remove trash-specific fields
      const trashData = trashDoc.data as TrashItem;
      const { deletedAt, originalCollection, ...restoreData } = trashData;

      // Restore to target collection
      const restoreResult = await this.saveDocument(targetCollection, docId, restoreData);
      if (!restoreResult.success) {
        return restoreResult;
      }

      // Delete from trash
      const deleteResult = await this.deleteDocument('trash', docId);
      return deleteResult;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to restore from trash' 
      };
    }
  }
}

/**
 * Factory function to create DataService instance
 */
export function createDataService(userId: string, encryptionKey: CryptoKey): DataService {
  return new DataService(userId, encryptionKey);
}

/**
 * Specialized DataService methods for common operations
 */
export class JournalDataService extends DataService {
  async saveJournalEntry(journalId: string, content: string, metadata: Record<string, unknown> = {}) {
    const data = {
      content,
      metadata,
      timestamp: new Date().toISOString()
    };
    return this.saveDocument('journals', journalId, data);
  }

  async getJournalEntry(journalId: string) {
    return this.getDocument<JournalEntry>('journals', journalId);
  }

  async getJournalEntries(limit?: number) {
    return this.getCollection<JournalEntry>('journals', {
      orderBy: { field: 'timestamp', direction: 'desc' },
      limit
    });
  }
}

export class SessionDataService extends DataService {
  async saveSession(sessionId: string, sessionData: BaseDocument) {
    return this.saveDocument('sessions', sessionId, sessionData);
  }

  async getSession(sessionId: string) {
    return this.getDocument('sessions', sessionId);
  }

  async saveSessionMessage(sessionId: string, messageId: string, message: BaseDocument) {
    return this.saveDocument(`sessions/${sessionId}/messages`, messageId, message);
  }

  async getSessionMessages(sessionId: string, limit?: number) {
    return this.getCollection(`sessions/${sessionId}/messages`, {
      orderBy: { field: 'timestamp', direction: 'asc' },
      limit
    });
  }
}

export class ReportDataService extends DataService {
  async saveReport(reportId: string, reportData: BaseDocument, reportType: string) {
    const data = {
      ...reportData,
      reportType,
      generatedAt: new Date().toISOString()
    };
    return this.saveDocument('reports', reportId, data);
  }

  async getReport(reportId: string) {
    return this.getDocument('reports', reportId);
  }

  async getReports(reportType?: string, limit?: number) {
    const whereClause: QueryFilter[] = reportType ? 
      [{ field: 'reportType', operator: '==', value: reportType }] : 
      [];
    
    return this.getCollection('reports', {
      where: whereClause.length > 0 ? whereClause : undefined,
      orderBy: { field: 'generatedAt', direction: 'desc' },
      limit
    });
  }
}
