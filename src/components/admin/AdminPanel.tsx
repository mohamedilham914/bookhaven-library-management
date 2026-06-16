import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, BookOpen, Users, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { BookForm } from './BookForm';
import { Book } from '../../types';
import { getCheckoutStatus, formatDate } from '../../utils/checkoutHelpers';

type AdminTab = 'books' | 'checkouts' | 'members';

export const AdminPanel: React.FC = () => {
  const { users, refreshUsers } = useAuth();
  const { books, checkouts, addBook, updateBook, deleteBook, returnBook } = useLibrary();

  const [tab, setTab] = useState<AdminTab>('books');
  const [search, setSearch] = useState('');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Book | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.isbn.toLowerCase().includes(search.toLowerCase())
  );

  const activeCheckouts = checkouts.filter(c => c.status === 'active');
  const overdueCheckouts = activeCheckouts.filter(c => getCheckoutStatus(c) === 'overdue');

  const getBook = (bookId: string) => books.find(b => b.id === bookId);
  const getUser = (userId: string) => users.find(u => u.id === userId);

  const stats = [
    { label: 'Total Books', value: books.length, icon: BookOpen, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300' },
    { label: 'Active Checkouts', value: activeCheckouts.length, icon: Clock, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300' },
    { label: 'Overdue Books', value: overdueCheckouts.length, icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300' },
    { label: 'Registered Members', value: users.length, icon: Users, color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300' }
  ];

  const handleAdd = () => {
    setEditingBook(null);
    setFormError('');
    setShowForm(true);
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormError('');
    setShowForm(true);
  };

  const handleFormSubmit = async (data: Omit<Book, 'id' | 'reviews'>) => {
    const success = editingBook
      ? await updateBook(editingBook.id, data)
      : await addBook(data);

    if (!success) {
      setFormError('Something went wrong saving this book. Please try again.');
      return;
    }

    setShowForm(false);
    setEditingBook(null);
  };

  const handleDeleteConfirmed = async () => {
    if (confirmDelete) {
      await deleteBook(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Panel</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your library's books, checkouts, and members.
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

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'books' as const, label: 'Manage Books' },
          { id: 'checkouts' as const, label: 'Checkouts' },
          { id: 'members' as const, label: 'Members' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
              tab === t.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Books Tab */}
      {tab === 'books' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Input
                type="text"
                placeholder="Search books..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button onClick={handleAdd}>
              <Plus size={18} className="mr-1" />
              Add Book
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Author</th>
                  <th className="py-2 pr-4">Genre</th>
                  <th className="py-2 pr-4">Copies</th>
                  <th className="py-2 pr-4">Rating</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredBooks.map(book => (
                  <tr key={book.id}>
                    <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white max-w-xs truncate">
                      {book.title}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{book.author}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{book.genre}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      {book.availableCopies} / {book.totalCopies}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{book.rating}</td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(book)}
                          className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                          aria-label="Edit book"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(book)}
                          className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                          aria-label="Delete book"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBooks.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No books found.</p>
            )}
          </div>
        </div>
      )}

      {/* Checkouts Tab */}
      {tab === 'checkouts' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4">Book</th>
                  <th className="py-2 pr-4">Member</th>
                  <th className="py-2 pr-4">Checked Out</th>
                  <th className="py-2 pr-4">Due Date</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {checkouts
                  .slice()
                  .sort((a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime())
                  .map(checkout => {
                    const book = getBook(checkout.bookId);
                    const member = getUser(checkout.userId);
                    const status = getCheckoutStatus(checkout);

                    return (
                      <tr key={checkout.id}>
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white max-w-xs truncate">
                          {book?.title ?? 'Unknown Book'}
                        </td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                          {member?.name ?? 'Unknown Member'}
                        </td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                          {formatDate(checkout.checkoutDate)}
                        </td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                          {formatDate(checkout.dueDate)}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            status === 'active'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : status === 'overdue'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {checkout.status === 'active' && (
                            <Button size="sm" variant="ghost" onClick={() => returnBook(checkout.id)}>
                              Mark Returned
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {checkouts.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No checkouts yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2 pr-4">Borrowed</th>
                  <th className="py-2 pr-4">Wishlist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map(member => (
                  <tr key={member.id}>
                    <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{member.name}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{member.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{formatDate(member.joinDate)}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{member.borrowedBooks.length}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{member.wishlist.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Book Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingBook(null); }}
        title={editingBook ? 'Edit Book' : 'Add New Book'}
        size="lg"
      >
        {formError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {formError}
          </div>
        )}
        <BookForm
          initialBook={editingBook ?? undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingBook(null); }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Book"
        size="sm"
      >
        <div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Are you sure you want to delete "{confirmDelete?.title}"? This action cannot be undone.
          </p>
          <div className="flex space-x-2">
            <Button variant="danger" onClick={handleDeleteConfirmed}>Delete</Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
