import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { firebaseAuth } from "./firebaseClient";

export const useAuthUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
};
