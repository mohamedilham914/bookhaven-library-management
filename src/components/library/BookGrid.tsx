import React from 'react';
import { Book } from '../../types';
import { BookCard } from './BookCard';
import { useAuth } from '../../contexts/AuthContext';

interface BookGridProps {
  books: Book[];
  onViewDetails: (book: Book) => void;
  onCheckout: (bookId: string) => void;
  onAddToWishlist: (bookId: string, isWishlisted: boolean) => void;
  onReserve: (bookId: string) => void;
}

export const BookGrid: React.FC<BookGridProps> = ({ 
  books, 
  onViewDetails, 
  onCheckout, 
  onAddToWishlist, 
  onReserve 
}) => {
  const { user } = useAuth();

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-600 mb-4">
          <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No books found</h3>
        <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map(book => (
        <BookCard
          key={book.id}
          book={book}
          onViewDetails={onViewDetails}
          onCheckout={onCheckout}
          onAddToWishlist={onAddToWishlist}
          onReserve={onReserve}
          isLoggedIn={!!user}
        />
      ))}
    </div>
  );
};