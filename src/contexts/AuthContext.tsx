import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { supabase, ProfileRow } from '../lib/supabase';

interface RegisterResult {
  success: boolean;
  needsEmailConfirmation?: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<RegisterResult>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

function profileToUser(
  profile: ProfileRow,
  borrowedBooks: string[],
  wishlist: string[],
  reservations: string[]
): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    joinDate: new Date(profile.join_date),
    borrowedBooks,
    wishlist,
    reservations
  };
}

/**
 * Loads a full User object for the given auth user id: their profile plus
 * the ids of books they currently have checked out, wishlisted, and reserved.
 */
async function loadUser(userId: string): Promise<User | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) return null;

  const [{ data: checkouts }, { data: wishlist }, { data: reservations }] = await Promise.all([
    supabase.from('checkouts').select('book_id').eq('user_id', userId).eq('status', 'active'),
    supabase.from('wishlist').select('book_id').eq('user_id', userId),
    supabase.from('reservations').select('id, book_id').eq('user_id', userId).eq('status', 'active')
  ]);

  return profileToUser(
    profile as ProfileRow,
    (checkouts ?? []).map(c => c.book_id),
    (wishlist ?? []).map(w => w.book_id),
    (reservations ?? []).map(r => r.id)
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCurrentUser = useCallback(async (userId: string) => {
    const loaded = await loadUser(userId);
    setUser(loaded);
  }, []);

  const refreshUsers = useCallback(async () => {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error || !profiles) return;

    const allUsers: User[] = await Promise.all(
      (profiles as ProfileRow[]).map(async profile => {
        const [{ data: checkouts }, { data: wishlist }, { data: reservations }] = await Promise.all([
          supabase.from('checkouts').select('book_id').eq('user_id', profile.id).eq('status', 'active'),
          supabase.from('wishlist').select('book_id').eq('user_id', profile.id),
          supabase.from('reservations').select('id').eq('user_id', profile.id).eq('status', 'active')
        ]);
        return profileToUser(
          profile,
          (checkouts ?? []).map(c => c.book_id),
          (wishlist ?? []).map(w => w.book_id),
          (reservations ?? []).map(r => r.id)
        );
      })
    );

    setUsers(allUsers);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Load the current session (if any) on first mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        await refreshCurrentUser(session.user.id);
      }
      setLoading(false);
    });

    // Keep the user in sync with auth state changes (login/logout/token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await refreshCurrentUser(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshCurrentUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return false;
    await refreshCurrentUser(data.user.id);
    return true;
  };

  const register = async (email: string, password: string, name: string): Promise<RegisterResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data.user) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }

    // If email confirmation is required, there may be no active session yet.
    if (data.session) {
      await refreshCurrentUser(data.user.id);
      return { success: true };
    }

    return { success: true, needsEmailConfirmation: true };
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, users, loading, login, register, logout, refreshUsers, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
