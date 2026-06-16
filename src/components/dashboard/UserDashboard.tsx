import React from 'react';
import { BookOpen, Clock, Heart, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { Button } from '../ui/Button';
import { getCheckoutStatus, daysUntilDue, formatDate } from '../../utils/checkoutHelpers';

interface UserDashboardProps {
  onViewBook: (bookId: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onViewBook }) => {
  const { user } = useAuth();
  const { books, checkouts, returnBook } = useLibrary();

  if (!user) return null;

  const myCheckouts = checkouts
    .filter(c => c.userId === user.id)
    .sort((a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime());

  const activeCheckouts = myCheckouts.filter(c => c.status === 'active');
  const pastCheckouts = myCheckouts.filter(c => c.status === 'returned');
  const overdueCheckouts = activeCheckouts.filter(c => getCheckoutStatus(c) === 'overdue');

  const getBook = (bookId: string) => books.find(b => b.id === bookId);

  const stats = [
    {
      label: 'Currently Borrowed',
      value: activeCheckouts.length,
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300'
    },
    {
      label: 'Overdue',
      value: overdueCheckouts.length,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
    },
    {
      label: 'Wishlist Items',
      value: user.wishlist.length,
      icon: Heart,
      color: 'text-pink-600 bg-pink-100 dark:bg-pink-900 dark:text-pink-300'
    },
    {
      label: 'Books Read',
      value: pastCheckouts.length,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's an overview of your library activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 flex items-center">
              <div className={`p-3 rounded-lg mr-4 ${stat.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Currently Borrowed */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Currently Borrowed Books
        </h2>

        {activeCheckouts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            You don't have any books checked out right now.
          </p>
        ) : (
          <div className="space-y-3">
            {activeCheckouts.map(checkout => {
              const book = getBook(checkout.bookId);
              if (!book) return null;
              const status = getCheckoutStatus(checkout);
              const days = daysUntilDue(checkout);

              return (
                <div
                  key={checkout.id}
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
                        <span className="text-gray-500 dark:text-gray-400">Due: {formatDate(checkout.dueDate)} </span>
                        {status === 'overdue' ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            ({Math.abs(days)} day{Math.abs(days) === 1 ? '' : 's'} overdue)
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">
                            ({days} day{days === 1 ? '' : 's'} left)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => returnBook(checkout.id)}>
                    Return Book
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reading History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Reading History
        </h2>

        {pastCheckouts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            You haven't returned any books yet.
          </p>
        ) : (
          <div className="space-y-3">
            {pastCheckouts.slice(0, 10).map(checkout => {
              const book = getBook(checkout.bookId);
              if (!book) return null;

              return (
                <div
                  key={checkout.id}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Star size={14} className="text-yellow-400 fill-current" />
                        {book.rating}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    {checkout.returnDate && <p>Returned {formatDate(checkout.returnDate)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reminders */}
      {(activeCheckouts.length > 0 || overdueCheckouts.length > 0) && (
        <div className="mt-8 flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <Clock className="text-blue-600 dark:text-blue-400 mt-0.5" size={20} />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {overdueCheckouts.length > 0
                ? `You have ${overdueCheckouts.length} overdue book${overdueCheckouts.length === 1 ? '' : 's'}. Please return ${overdueCheckouts.length === 1 ? 'it' : 'them'} as soon as possible.`
                : `Books are due within 14 days of checkout. Don't forget to return them on time!`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
