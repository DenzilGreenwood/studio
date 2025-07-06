// src/lib/clarity-map-operations.ts
import { 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  deleteDoc,
  serverTimestamp
} from './firebase';
import { ClarityMap, InsightReport } from '@/types';
import { decryptData } from './encryption';

export const clarityMapOperations = {
  async create(clarityMap: ClarityMap): Promise<void> {
    const docRef = doc(db, 'clarityMaps', clarityMap.id);
    await setDoc(docRef, {
      ...clarityMap,
      metadata: {
        ...clarityMap.metadata,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    });
  },

  async update(clarityMap: ClarityMap): Promise<void> {
    const docRef = doc(db, 'clarityMaps', clarityMap.id);
    await updateDoc(docRef, {
      ...clarityMap,
      metadata: {
        ...clarityMap.metadata,
        updatedAt: serverTimestamp()
      }
    });
  },

  async get(mapId: string, userPassphrase?: string): Promise<ClarityMap | null> {
    const docRef = doc(db, 'clarityMaps', mapId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as ClarityMap;
    
    if (data.encryptedData && userPassphrase) {
      try {
        const decryptedJson = await decryptData(
          data.encryptedData,
          userPassphrase,
          data.salt!,
          data.iv!
        );
        const decryptedData = JSON.parse(decryptedJson);
        return {
          ...data,
          nodes: decryptedData.nodes,
          edges: decryptedData.edges,
          title: decryptedData.title
        };
      } catch (_error) {
        // Silent fallback to encrypted data if decryption fails
        return data;
      }
    }

    return data;
  },

  async getByUser(userId: string, userPassphrase?: string): Promise<ClarityMap[]> {
    const q = query(
      collection(db, 'clarityMaps'),
      where('userId', '==', userId),
      orderBy('metadata.updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const maps: ClarityMap[] = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data() as ClarityMap;
      
      if (data.encryptedData && userPassphrase) {
        try {
          const decryptedJson = await decryptData(
            data.encryptedData,
            userPassphrase,
            data.salt!,
            data.iv!
          );
          const decryptedData = JSON.parse(decryptedJson);
          maps.push({
            ...data,
            nodes: decryptedData.nodes,
            edges: decryptedData.edges,
            title: decryptedData.title
          });
        } catch (_error) {
          // Silent fallback: add encrypted data if decryption fails
          maps.push(data);
        }
      } else {
        maps.push(data);
      }
    }
    
    return maps;
  },

  async getBySession(sessionId: string, userPassphrase?: string): Promise<ClarityMap[]> {
    const q = query(
      collection(db, 'clarityMaps'),
      where('sessionId', '==', sessionId),
      orderBy('metadata.updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const maps: ClarityMap[] = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data() as ClarityMap;
      
      if (data.encryptedData && userPassphrase) {
        try {
          const decryptedJson = await decryptData(
            data.encryptedData,
            userPassphrase,
            data.salt!,
            data.iv!
          );
          const decryptedData = JSON.parse(decryptedJson);
          maps.push({
            ...data,
            nodes: decryptedData.nodes,
            edges: decryptedData.edges,
            title: decryptedData.title
          });
        } catch (_error) {
          // Silent fallback: add encrypted data if decryption fails
          maps.push(data);
        }
      } else {
        maps.push(data);
      }
    }
    
    return maps;
  },

  async delete(mapId: string): Promise<void> {
    const docRef = doc(db, 'clarityMaps', mapId);
    await deleteDoc(docRef);
  }
};

export const insightReportOperations = {
  async create(report: InsightReport): Promise<void> {
    const docRef = doc(db, 'insightReports', report.id);
    await setDoc(docRef, {
      ...report,
      metadata: {
        ...report.metadata,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    });
  },

  async update(report: InsightReport): Promise<void> {
    const docRef = doc(db, 'insightReports', report.id);
    await updateDoc(docRef, {
      ...report,
      metadata: {
        ...report.metadata,
        updatedAt: serverTimestamp()
      }
    });
  },

  async get(reportId: string, userPassphrase?: string): Promise<InsightReport | null> {
    const docRef = doc(db, 'insightReports', reportId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as InsightReport;
    
    if (data.encryptedContent && userPassphrase) {
      try {
        const decryptedJson = await decryptData(
          data.encryptedContent,
          userPassphrase,
          data.salt!,
          data.iv!
        );
        const decryptedData = JSON.parse(decryptedJson);
        return {
          ...data,
          content: decryptedData.content,
          sections: decryptedData.sections,
          title: decryptedData.title
        };
      } catch (_error) {
        // Silent fallback to encrypted data if decryption fails
        return data;
      }
    }

    return data;
  },

  async getByUser(userId: string, userPassphrase?: string): Promise<InsightReport[]> {
    const q = query(
      collection(db, 'insightReports'),
      where('userId', '==', userId),
      orderBy('metadata.updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reports: InsightReport[] = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data() as InsightReport;
      
      if (data.encryptedContent && userPassphrase) {
        try {
          const decryptedJson = await decryptData(
            data.encryptedContent,
            userPassphrase,
            data.salt!,
            data.iv!
          );
          const decryptedData = JSON.parse(decryptedJson);
          reports.push({
            ...data,
            content: decryptedData.content,
            sections: decryptedData.sections,
            title: decryptedData.title
          });
        } catch (_error) {
          // Silent fallback: add encrypted data if decryption fails
          reports.push(data);
        }
      } else {
        reports.push(data);
      }
    }
    
    return reports;
  },

  async getBySession(sessionId: string, userPassphrase?: string): Promise<InsightReport[]> {
    const q = query(
      collection(db, 'insightReports'),
      where('sessionId', '==', sessionId),
      orderBy('metadata.updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reports: InsightReport[] = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data() as InsightReport;
      
      if (data.encryptedContent && userPassphrase) {
        try {
          const decryptedJson = await decryptData(
            data.encryptedContent,
            userPassphrase,
            data.salt!,
            data.iv!
          );
          const decryptedData = JSON.parse(decryptedJson);
          reports.push({
            ...data,
            content: decryptedData.content,
            sections: decryptedData.sections,
            title: decryptedData.title
          });
        } catch (_error) {
          // Silent fallback: add encrypted data if decryption fails
          reports.push(data);
        }
      } else {
        reports.push(data);
      }
    }
    
    return reports;
  },

  async delete(reportId: string): Promise<void> {
    const docRef = doc(db, 'insightReports', reportId);
    await deleteDoc(docRef);
  }
};
