import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LibraryProvider, useLibrary } from './contexts/LibraryContext';
import { Layout } from './components/layout/Layout';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { SearchFilters } from './components/library/SearchFilters';
import { BookGrid } from './components/library/BookGrid';
import { BookDetails } from './components/library/BookDetails';
import { Modal } from './components/ui/Modal';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { Wishlist } from './components/dashboard/Wishlist';
import { Reservations } from './components/dashboard/Reservations';
import { AdminPanel } from './components/admin/AdminPanel';
import { Analytics } from './components/admin/Analytics';
import { Book } from './types';

interface LibraryViewProps {
  selectedBookId: string | null;
  onSelectBook: (bookId: string | null) => void;
}

function LibraryView({ selectedBookId, onSelectBook }: LibraryViewProps) {
  const {
    books,
    filteredBooks,
    filters,
    setFilters,
    checkoutBook,
    reserveBook,
    addToWishlist,
    removeFromWishlist
  } = useLibrary();

  const selectedBook: Book | null = selectedBookId
    ? books.find(b => b.id === selectedBookId) ?? null
    : null;

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

  const handleToggleWishlist = async (bookId: string, isWishlisted: boolean) => {
    if (isWishlisted) {
      await removeFromWishlist(bookId);
    } else {
      await addToWishlist(bookId);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Browse Library
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover your next great read from our collection of {filteredBooks.length} books
        </p>
      </div>

      <SearchFilters filters={filters} onFiltersChange={setFilters} />

      <BookGrid
        books={filteredBooks}
        onViewDetails={(book) => onSelectBook(book.id)}
        onCheckout={handleCheckout}
        onAddToWishlist={handleToggleWishlist}
        onReserve={handleReserve}
      />

      <Modal
        isOpen={!!selectedBook}
        onClose={() => onSelectBook(null)}
        title="Book Details"
        size="xl"
      >
        {selectedBook && (
          <BookDetails
            book={selectedBook}
            onClose={() => onSelectBook(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function AuthView() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { user, isAdmin, loading } = useAuth();
  const [currentView, setCurrentView] = useState('library');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  // Allow other views to open a book's details inside the Library view.
  const handleViewBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setCurrentView('library');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'library':
        return <LibraryView selectedBookId={selectedBookId} onSelectBook={setSelectedBookId} />;
      case 'dashboard':
        return <UserDashboard onViewBook={handleViewBook} />;
      case 'wishlist':
        return <Wishlist onViewBook={handleViewBook} />;
      case 'reservations':
        return <Reservations onViewBook={handleViewBook} />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <LibraryView selectedBookId={selectedBookId} onSelectBook={setSelectedBookId} />;
      case 'analytics':
        return isAdmin ? <Analytics /> : <LibraryView selectedBookId={selectedBookId} onSelectBook={setSelectedBookId} />;
      default:
        return <LibraryView selectedBookId={selectedBookId} onSelectBook={setSelectedBookId} />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderCurrentView()}
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LibraryProvider>
          <AppContent />
        </LibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
