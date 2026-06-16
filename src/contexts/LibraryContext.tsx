import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Book, Checkout, FilterOptions, Review, ActivityLog, Reservation } from '../types';
import { useAuth } from './AuthContext';
import {
  supabase,
  BookRow,
  CheckoutRow,
  ReservationRow,
  ReviewRow,
  ActivityLogRow
} from '../lib/supabase';

interface LibraryContextType {
  books: Book[];
  checkouts: Checkout[];
  reservations: Reservation[];
  filteredBooks: Book[];
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  loading: boolean;
  addBook: (book: Omit<Book, 'id' | 'reviews'>) => Promise<boolean>;
  updateBook: (id: string, book: Partial<Book>) => Promise<boolean>;
  deleteBook: (id: string) => Promise<boolean>;
  checkoutBook: (bookId: string) => Promise<boolean>;
  returnBook: (checkoutId: string) => Promise<void>;
  reserveBook: (bookId: string) => Promise<boolean>;
  cancelReservation: (reservationId: string) => Promise<void>;
  addToWishlist: (bookId: string) => Promise<void>;
  removeFromWishlist: (bookId: string) => Promise<void>;
  addReview: (bookId: string, rating: number, comment: string) => Promise<void>;
  activityLogs: ActivityLog[];
  refreshBooks: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return context;
};

// --- Row -> app type mappers ---

function bookFromRow(row: BookRow, reviews: Review[]): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    genre: row.genre,
    publishedYear: row.published_year,
    description: row.description,
    coverImage: row.cover_image,
    totalCopies: row.total_copies,
    availableCopies: row.available_copies,
    rating: Number(row.rating),
    reviews
  };
}

function checkoutFromRow(row: CheckoutRow): Checkout {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    checkoutDate: new Date(row.checkout_date),
    dueDate: new Date(row.due_date),
    returnDate: row.return_date ? new Date(row.return_date) : undefined,
    status: row.status
  };
}

function reservationFromRow(row: ReservationRow): Reservation {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    reservationDate: new Date(row.reservation_date),
    status: row.status
  };
}

function activityLogFromRow(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    details: row.details,
    timestamp: new Date(row.created_at)
  };
}

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUsers } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    genre: 'All Genres',
    availability: 'all',
    sortBy: 'title',
    sortOrder: 'asc'
  });

  const refreshBooks = useCallback(async () => {
    const [{ data: bookRows, error: booksError }, { data: reviewRows }] = await Promise.all([
      supabase.from('books').select('*').order('title'),
      supabase.from('reviews').select('*')
    ]);

    if (booksError || !bookRows) return;

    const reviewsByBook = new Map<string, Review[]>();
    for (const r of (reviewRows ?? []) as (ReviewRow & { profiles?: { name: string } })[]) {
      const review: Review = {
        id: r.id,
        userId: r.user_id,
        userName: '',
        rating: r.rating,
        comment: r.comment,
        date: new Date(r.created_at)
      };
      const list = reviewsByBook.get(r.book_id) ?? [];
      list.push(review);
      reviewsByBook.set(r.book_id, list);
    }

    // Resolve reviewer names from profiles in one batch
    const reviewerIds = Array.from(new Set((reviewRows ?? []).map(r => (r as ReviewRow).user_id)));
    if (reviewerIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', reviewerIds);
      const nameById = new Map((profiles ?? []).map(p => [p.id, p.name as string]));
      for (const reviews of reviewsByBook.values()) {
        for (const review of reviews) {
          review.userName = nameById.get(review.userId) ?? 'Unknown';
        }
      }
    }

    setBooks((bookRows as BookRow[]).map(row => bookFromRow(row, reviewsByBook.get(row.id) ?? [])));
  }, []);

  const refreshCheckouts = useCallback(async () => {
    const { data, error } = await supabase.from('checkouts').select('*');
    if (error || !data) return;
    setCheckouts((data as CheckoutRow[]).map(checkoutFromRow));
  }, []);

  const refreshReservations = useCallback(async () => {
    const { data, error } = await supabase.from('reservations').select('*');
    if (error || !data) return;
    setReservations((data as ReservationRow[]).map(reservationFromRow));
  }, []);

  const refreshActivityLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !data) return;
    setActivityLogs((data as ActivityLogRow[]).map(activityLogFromRow));
  }, []);

  // Initial load, and reload whenever the logged-in user changes
  // (so RLS-scoped data like checkouts/reservations reflects the right user).
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([refreshBooks(), refreshCheckouts(), refreshReservations(), refreshActivityLogs()]).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [user?.id, refreshBooks, refreshCheckouts, refreshReservations, refreshActivityLogs]);

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                         book.author.toLowerCase().includes(filters.search.toLowerCase());
    const matchesGenre = filters.genre === 'All Genres' || book.genre === filters.genre;
    const matchesAvailability = filters.availability === 'all' ||
                              (filters.availability === 'available' && book.availableCopies > 0) ||
                              (filters.availability === 'checked_out' && book.availableCopies === 0);

    return matchesSearch && matchesGenre && matchesAvailability;
  }).sort((a, b) => {
    let comparison = 0;
    switch (filters.sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'author':
        comparison = a.author.localeCompare(b.author);
        break;
      case 'rating':
        comparison = a.rating - b.rating;
        break;
      case 'year':
        comparison = a.publishedYear - b.publishedYear;
        break;
    }
    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });

  const addActivityLog = useCallback(async (action: string, details: string) => {
    if (!user) return;
    const { error } = await supabase.from('activity_logs').insert({
      user_id: user.id,
      action,
      details
    });
    if (!error) {
      await refreshActivityLogs();
    }
  }, [user, refreshActivityLogs]);

  const addBook = async (bookData: Omit<Book, 'id' | 'reviews'>): Promise<boolean> => {
    const { error } = await supabase.from('books').insert({
      title: bookData.title,
      author: bookData.author,
      isbn: bookData.isbn,
      genre: bookData.genre,
      published_year: bookData.publishedYear,
      description: bookData.description,
      cover_image: bookData.coverImage,
      total_copies: bookData.totalCopies,
      available_copies: bookData.availableCopies,
      rating: bookData.rating
    });

    if (error) return false;

    await refreshBooks();
    await addActivityLog('Book Added', `Added "${bookData.title}" by ${bookData.author}`);
    return true;
  };

  const updateBook = async (id: string, bookData: Partial<Book>): Promise<boolean> => {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (bookData.title !== undefined) updates.title = bookData.title;
    if (bookData.author !== undefined) updates.author = bookData.author;
    if (bookData.isbn !== undefined) updates.isbn = bookData.isbn;
    if (bookData.genre !== undefined) updates.genre = bookData.genre;
    if (bookData.publishedYear !== undefined) updates.published_year = bookData.publishedYear;
    if (bookData.description !== undefined) updates.description = bookData.description;
    if (bookData.coverImage !== undefined) updates.cover_image = bookData.coverImage;
    if (bookData.totalCopies !== undefined) updates.total_copies = bookData.totalCopies;
    if (bookData.availableCopies !== undefined) updates.available_copies = bookData.availableCopies;
    if (bookData.rating !== undefined) updates.rating = bookData.rating;

    const { error } = await supabase.from('books').update(updates).eq('id', id);
    if (error) return false;

    const title = bookData.title ?? books.find(b => b.id === id)?.title ?? id;
    await refreshBooks();
    await addActivityLog('Book Updated', `Updated "${title}"`);
    return true;
  };

  const deleteBook = async (id: string): Promise<boolean> => {
    const book = books.find(b => b.id === id);
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) return false;

    await refreshBooks();
    if (book) {
      await addActivityLog('Book Deleted', `Deleted "${book.title}" by ${book.author}`);
    }
    return true;
  };

  const checkoutBook = async (bookId: string): Promise<boolean> => {
    const book = books.find(b => b.id === bookId);
    if (!book || book.availableCopies === 0 || !user) return false;

    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { error: checkoutError } = await supabase.from('checkouts').insert({
      user_id: user.id,
      book_id: bookId,
      due_date: dueDate,
      status: 'active'
    });
    if (checkoutError) return false;

    const { error: bookError } = await supabase
      .from('books')
      .update({ available_copies: book.availableCopies - 1 })
      .eq('id', bookId);
    if (bookError) return false;

    await Promise.all([refreshBooks(), refreshCheckouts()]);
    await addActivityLog('Book Checked Out', `Checked out "${book.title}"`);
    return true;
  };

  const returnBook = async (checkoutId: string): Promise<void> => {
    const checkout = checkouts.find(c => c.id === checkoutId);
    if (!checkout) return;

    const book = books.find(b => b.id === checkout.bookId);

    const { error: checkoutError } = await supabase
      .from('checkouts')
      .update({ status: 'returned', return_date: new Date().toISOString() })
      .eq('id', checkoutId);
    if (checkoutError) return;

    if (book) {
      await supabase
        .from('books')
        .update({ available_copies: book.availableCopies + 1 })
        .eq('id', checkout.bookId);
    }

    await Promise.all([refreshBooks(), refreshCheckouts()]);
    if (book) {
      await addActivityLog('Book Returned', `Returned "${book.title}"`);
    }
  };

  const reserveBook = async (bookId: string): Promise<boolean> => {
    const book = books.find(b => b.id === bookId);
    if (!book || !user) return false;

    const alreadyReserved = reservations.some(
      r => r.userId === user.id && r.bookId === bookId && r.status === 'active'
    );
    if (alreadyReserved) return false;

    const { error } = await supabase.from('reservations').insert({
      user_id: user.id,
      book_id: bookId,
      status: 'active'
    });
    if (error) return false;

    await refreshReservations();
    await addActivityLog('Book Reserved', `Reserved "${book.title}"`);
    return true;
  };

  const cancelReservation = async (reservationId: string): Promise<void> => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId);
    if (error) return;

    await refreshReservations();
    const book = books.find(b => b.id === reservation.bookId);
    if (book) {
      await addActivityLog('Reservation Cancelled', `Cancelled reservation for "${book.title}"`);
    }
  };

  const addToWishlist = async (bookId: string): Promise<void> => {
    const book = books.find(b => b.id === bookId);
    if (!book || !user) return;
    if (user.wishlist.includes(bookId)) return;

    const { error } = await supabase.from('wishlist').insert({ user_id: user.id, book_id: bookId });
    if (error) return;

    await refreshUsers();
    await addActivityLog('Added to Wishlist', `Added "${book.title}" to wishlist`);
  };

  const removeFromWishlist = async (bookId: string): Promise<void> => {
    if (!user) return;
    const book = books.find(b => b.id === bookId);

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('book_id', bookId);
    if (error) return;

    await refreshUsers();
    if (book) {
      await addActivityLog('Removed from Wishlist', `Removed "${book.title}" from wishlist`);
    }
  };

  const addReview = async (bookId: string, rating: number, comment: string): Promise<void> => {
    if (!user) return;
    const book = books.find(b => b.id === bookId);

    const { error } = await supabase.from('reviews').insert({
      book_id: bookId,
      user_id: user.id,
      rating,
      comment
    });
    if (error) return;

    // Recalculate the book's average rating
    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('book_id', bookId);
    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await supabase
        .from('books')
        .update({ rating: Math.round(avg * 10) / 10 })
        .eq('id', bookId);
    }

    await refreshBooks();
    if (book) {
      await addActivityLog('Review Added', `Reviewed "${book.title}" with ${rating} stars`);
    }
  };

  return (
    <LibraryContext.Provider value={{
      books,
      checkouts,
      reservations,
      filteredBooks,
      filters,
      setFilters,
      loading,
      addBook,
      updateBook,
      deleteBook,
      checkoutBook,
      returnBook,
      reserveBook,
      cancelReservation,
      addToWishlist,
      removeFromWishlist,
      addReview,
      activityLogs,
      refreshBooks
    }}>
      {children}
    </LibraryContext.Provider>
  );
};
