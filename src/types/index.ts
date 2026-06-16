export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  joinDate: Date;
  borrowedBooks: string[];
  wishlist: string[];
  reservations: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: number;
  description: string;
  coverImage: string;
  totalCopies: number;
  availableCopies: number;
  rating: number;
  reviews: Review[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
}

export interface Checkout {
  id: string;
  userId: string;
  bookId: string;
  checkoutDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: 'active' | 'returned' | 'overdue';
}

export interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: Date;
  status: 'active' | 'fulfilled' | 'cancelled';
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: Date;
}

export type FilterOptions = {
  search: string;
  genre: string;
  availability: 'all' | 'available' | 'checked_out';
  sortBy: 'title' | 'author' | 'rating' | 'year';
  sortOrder: 'asc' | 'desc';
};