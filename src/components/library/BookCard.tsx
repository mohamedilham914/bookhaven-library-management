import React from 'react';
import { Star, Eye, Heart, BookOpen, Clock } from 'lucide-react';
import { Book } from '../../types';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface BookCardProps {
  book: Book;
  onViewDetails: (book: Book) => void;
  onCheckout: (bookId: string) => void;
  onAddToWishlist: (bookId: string, isWishlisted: boolean) => void;
  onReserve: (bookId: string) => void;
  isLoggedIn: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onViewDetails,
  onCheckout,
  onAddToWishlist,
  onReserve,
  isLoggedIn
}) => {
  const { user } = useAuth();
  const isWishlisted = !!user?.wishlist.includes(book.id);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
      <div className="relative">
        <img
          src={book.coverImage}
          alt={book.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            book.availableCopies > 0
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {book.availableCopies > 0 ? 'Available' : 'Checked Out'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
            {book.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">by {book.author}</p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {renderStars(book.rating)}
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              ({book.rating})
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {book.publishedYear}
          </span>
        </div>

        <div className="mb-3">
          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
            {book.genre}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {book.description}
        </p>

        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => onViewDetails(book)}
          >
            <Eye size={16} className="mr-2" />
            View Details
          </Button>

          {isLoggedIn && (
            <div className="flex space-x-2">
              {book.availableCopies > 0 ? (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onCheckout(book.id)}
                >
                  <BookOpen size={16} className="mr-1" />
                  Checkout
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => onReserve(book.id)}
                >
                  <Clock size={16} className="mr-1" />
                  Reserve
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddToWishlist(book.id, isWishlisted)}
                className="px-3"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={16} className={isWishlisted ? 'fill-current text-red-500' : ''} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
