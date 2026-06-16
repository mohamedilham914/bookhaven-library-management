import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Did you create a .env file based on .env.example?'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Database row types (snake_case, matching the SQL schema) ---

export interface ProfileRow {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  join_date: string;
}

export interface BookRow {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  published_year: number;
  description: string;
  cover_image: string;
  total_copies: number;
  available_copies: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface CheckoutRow {
  id: string;
  user_id: string;
  book_id: string;
  checkout_date: string;
  due_date: string;
  return_date: string | null;
  status: 'active' | 'returned' | 'overdue';
}

export interface ReservationRow {
  id: string;
  user_id: string;
  book_id: string;
  reservation_date: string;
  status: 'active' | 'fulfilled' | 'cancelled';
}

export interface ReviewRow {
  id: string;
  book_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface WishlistRow {
  user_id: string;
  book_id: string;
  added_at: string;
}

export interface ActivityLogRow {
  id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
}
