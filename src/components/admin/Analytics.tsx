import React, { useEffect } from 'react';
import { TrendingUp, Star, BookOpen, Users, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { getCheckoutStatus, formatDate } from '../../utils/checkoutHelpers';

export const Analytics: React.FC = () => {
  const { users, refreshUsers } = useAuth();
  const { books, checkouts, activityLogs } = useLibrary();

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  // Genre distribution
  const genreCounts = books.reduce<Record<string, number>>((acc, book) => {
    acc[book.genre] = (acc[book.genre] || 0) + 1;
    return acc;
  }, {});
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxGenreCount = topGenres.length > 0 ? topGenres[0][1] : 1;

  // Most checked-out books (all-time, by checkout count)
  const checkoutCounts = checkouts.reduce<Record<string, number>>((acc, c) => {
    acc[c.bookId] = (acc[c.bookId] || 0) + 1;
    return acc;
  }, {});
  const popularBooks = Object.entries(checkoutCounts)
    .map(([bookId, count]) => ({ book: books.find(b => b.id === bookId), count }))
    .filter(item => !!item.book)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top rated books
  const topRated = books
    .filter(b => b.reviews.length > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  // Overall stats
  const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const availableCopies = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const checkedOutCopies = totalCopies - availableCopies;
  const activeCheckouts = checkouts.filter(c => c.status === 'active');
  const overdueCheckouts = activeCheckouts.filter(c => getCheckoutStatus(c) === 'overdue');
  const avgRating = books.length > 0
    ? (books.reduce((sum, b) => sum + b.rating, 0) / books.length).toFixed(2)
    : '0';
  const totalReviews = books.reduce((sum, b) => sum + b.reviews.length, 0);

  const summaryCards = [
    { label: 'Total Books', value: books.length, icon: BookOpen, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300' },
    { label: 'Books Checked Out', value: checkedOutCopies, icon: Activity, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300' },
    { label: 'Registered Members', value: users.length, icon: Users, color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300' },
    { label: 'Average Rating', value: avgRating, icon: Star, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300' }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          A snapshot of how your library is being used.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 flex items-center">
              <div className={`p-3 rounded-lg mr-4 ${card.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Genre distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Collection by Genre
          </h2>
          {topGenres.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No data available.</p>
          ) : (
            <div className="space-y-3">
              {topGenres.map(([genre, count]) => (
                <div key={genre}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{genre}</span>
                    <span className="text-gray-500 dark:text-gray-400">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count / maxGenreCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Library status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Library Status
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300">Copies Available</span>
                <span className="text-gray-500 dark:text-gray-400">{availableCopies} / {totalCopies}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${totalCopies > 0 ? (availableCopies / totalCopies) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCheckouts.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Checkouts</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueCheckouts.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalReviews}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews Submitted</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Most popular books */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp size={18} className="mr-2 text-blue-600" />
            Most Checked Out
          </h2>
          {popularBooks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No checkouts recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {popularBooks.map(({ book, count }) => (
                <li key={book!.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={book!.coverImage} alt={book!.title} className="w-8 h-11 object-cover rounded" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{book!.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">by {book!.author}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                    {count} checkout{count === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top rated */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Star size={18} className="mr-2 text-yellow-500" />
            Top Rated Books
          </h2>
          {topRated.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No reviews yet.</p>
          ) : (
            <ul className="space-y-3">
              {topRated.map(book => (
                <li key={book.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={book.coverImage} alt={book.title} className="w-8 h-11 object-cover rounded" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{book.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">by {book.author}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center whitespace-nowrap ml-2">
                    <Star size={14} className="text-yellow-400 fill-current mr-1" />
                    {book.rating} ({book.reviews.length})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        {activityLogs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {activityLogs.slice(0, 10).map(log => (
              <div key={log.id} className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{log.action}: </span>
                  <span className="text-gray-600 dark:text-gray-400">{log.details}</span>
                </div>
                <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
