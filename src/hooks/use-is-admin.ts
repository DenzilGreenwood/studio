import {useState, useEffect} from 'react';
import {useAuth} from '@/context/auth-context';
import {doc, getDoc} from 'firebase/firestore';
import {db} from '@/lib/firebase';

export function useIsAdmin() {
  const {user, loading: authLoading} = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().isAdmin === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading) {
        checkAdminStatus();
    }
  }, [user, authLoading]);

  return isAdmin;
}
