import { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const useUnreadAlertCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'alerts'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  return count;
};
