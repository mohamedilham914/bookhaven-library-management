import React from 'react';
import { Heart, BookOpen, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { Button } from '../ui/Button';

interface WishlistProps {
  onViewBook: (bookId: string) => void;
}

export const Wishlist: React.FC<WishlistProps> = ({ onViewBook }) => {
  const { user } = useAuth();
  const { books, checkoutBook, reserveBook, removeFromWishlist } = useLibrary();

  if (!user) return null;

  const wishlistBooks = user.wishlist
    .map(id => books.find(b => b.id === id))
    .filter((b): b is NonNullable<typeof b> => !!b);

  const handleCheckout = async (bookId: string) => {
    if (await checkoutBook(bookId)) {
      alert('Book checked out successfully!');
    } else {
      alert('Unable to checkout book. Please try again.');
    }
  };

  const handleReserve = async (bookId: string) => {
    if (await reserveBook(bookId)) {
      alert('Book reserved successfully!');
    } else {
      alert('You already have an active reservation for this book.');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Wishlist</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {wishlistBooks.length === 0
            ? "Your wishlist is empty. Start adding books you'd like to read!"
            : `You have ${wishlistBooks.length} book${wishlistBooks.length === 1 ? '' : 's'} on your wishlist.`}
        </p>
      </div>

      {wishlistBooks.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No books in your wishlist yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Browse the library and tap the heart icon on any book to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistBooks.map(book => (
            <div
              key={book.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => onViewBook(book.id)}
              />
              <div className="p-4">
                <button
                  onClick={() => onViewBook(book.id)}
                  className="block text-lg font-semibold text-gray-900 dark:text-white mb-1 text-left hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                >
                  {book.title}
                </button>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">by {book.author}</p>

                <div className="space-y-2">
                  {book.availableCopies > 0 ? (
                    <Button size="sm" className="w-full" onClick={() => handleCheckout(book.id)}>
                      <BookOpen size={16} className="mr-1" />
                      Checkout
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => handleReserve(book.id)}>
                      <Clock size={16} className="mr-1" />
                      Reserve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={() => removeFromWishlist(book.id)}
                  >
                    <Heart size={16} className="mr-1 fill-current text-red-500" />
                    Remove from Wishlist
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
