import React from 'react';
import { Clock, BookOpen, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { Button } from '../ui/Button';
import { formatDate } from '../../utils/checkoutHelpers';

interface ReservationsProps {
  onViewBook: (bookId: string) => void;
}

export const Reservations: React.FC<ReservationsProps> = ({ onViewBook }) => {
  const { user } = useAuth();
  const { books, reservations, cancelReservation, checkoutBook } = useLibrary();

  if (!user) return null;

  const myReservations = reservations
    .filter(r => r.userId === user.id)
    .sort((a, b) => new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime());

  const activeReservations = myReservations.filter(r => r.status === 'active');
  const pastReservations = myReservations.filter(r => r.status !== 'active');

  const getBook = (bookId: string) => books.find(b => b.id === bookId);

  const handleCheckout = async (bookId: string, reservationId: string) => {
    if (await checkoutBook(bookId)) {
      await cancelReservation(reservationId);
      alert('Book checked out successfully!');
    } else {
      alert('This book is not yet available to checkout.');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Reservations</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {activeReservations.length === 0
            ? 'You have no active reservations.'
            : `You have ${activeReservations.length} active reservation${activeReservations.length === 1 ? '' : 's'}.`}
        </p>
      </div>

      {activeReservations.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No active reservations
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Reserve a book that's currently checked out and we'll let you know when it's back.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="space-y-3">
            {activeReservations.map(reservation => {
              const book = getBook(reservation.bookId);
              if (!book) return null;
              const isAvailable = book.availableCopies > 0;

              return (
                <div
                  key={reservation.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded cursor-pointer"
                      onClick={() => onViewBook(book.id)}
                    />
                    <div>
                      <button
                        onClick={() => onViewBook(book.id)}
                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left"
                      >
                        {book.title}
                      </button>
                      <p className="text-sm text-gray-600 dark:text-gray-400">by {book.author}</p>
                      <p className="text-sm mt-1">
                        <span className="text-gray-500 dark:text-gray-400">
                          Reserved on {formatDate(reservation.reservationDate)}
                        </span>
                        {' \u2014 '}
                        {isAvailable ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">Available now!</span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Still checked out</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isAvailable && (
                      <Button size="sm" onClick={() => handleCheckout(book.id, reservation.id)}>
                        <BookOpen size={16} className="mr-1" />
                        Checkout
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => cancelReservation(reservation.id)}>
                      <XCircle size={16} className="mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pastReservations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Past Reservations
          </h2>
          <div className="space-y-3">
            {pastReservations.slice(0, 10).map(reservation => {
              const book = getBook(reservation.bookId);
              if (!book) return null;

              return (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-10 h-14 object-cover rounded cursor-pointer"
                      onClick={() => onViewBook(book.id)}
                    />
                    <div>
                      <button
                        onClick={() => onViewBook(book.id)}
                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left"
                      >
                        {book.title}
                      </button>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {reservation.status}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(reservation.reservationDate)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
