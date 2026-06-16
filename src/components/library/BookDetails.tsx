import React, { useState } from 'react';
import { Star, BookOpen, Heart, Clock, Share2, Calendar, User, Hash } from 'lucide-react';
import { Book } from '../../types';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { Input } from '../ui/Input';

interface BookDetailsProps {
  book: Book;
  onClose: () => void;
}

export const BookDetails: React.FC<BookDetailsProps> = ({ book, onClose }) => {
  const { user } = useAuth();
  const { checkoutBook, reserveBook, addToWishlist, removeFromWishlist, addReview } = useLibrary();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const isWishlisted = !!user?.wishlist.includes(book.id);

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={interactive ? 24 : 20}
        className={`${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive && onRate ? () => onRate(i + 1) : undefined}
      />
    ));
  };

  const handleCheckout = async () => {
    if (await checkoutBook(book.id)) {
      alert('Book checked out successfully!');
      onClose();
    } else {
      alert('Unable to checkout book. Please try again.');
    }
  };

  const handleReserve = async () => {
    if (await reserveBook(book.id)) {
      alert('Book reserved successfully!');
      onClose();
    } else {
      alert('You already have an active reservation for this book.');
    }
  };

  const handleToggleWishlist = async () => {
    if (isWishlisted) {
      await removeFromWishlist(book.id);
    } else {
      await addToWishlist(book.id);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewComment.trim()) {
      await addReview(book.id, reviewRating, reviewComment);
      setReviewComment('');
      setReviewRating(5);
      setShowReviewForm(false);
      alert('Review added successfully!');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book.title,
        text: `Check out "${book.title}" by ${book.author} on BookHaven`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${book.title} by ${book.author} - ${window.location.href}`);
      alert('Book link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Book Cover */}
        <div className="space-y-4">
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full max-w-md mx-auto rounded-lg shadow-lg"
          />
          
          {user && (
            <div className="space-y-3">
              {book.availableCopies > 0 ? (
                <Button className="w-full" onClick={handleCheckout}>
                  <BookOpen size={20} className="mr-2" />
                  Checkout Book
                </Button>
              ) : (
                <Button variant="secondary" className="w-full" onClick={handleReserve}>
                  <Clock size={20} className="mr-2" />
                  Reserve Book
                </Button>
              )}
              
              <div className="flex space-x-2">
                <Button variant="ghost" className="flex-1" onClick={handleToggleWishlist}>
                  <Heart size={18} className={`mr-2 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                  {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </Button>
                <Button variant="ghost" onClick={handleShare}>
                  <Share2 size={18} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Book Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {book.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
              by {book.author}
            </p>
            
            <div className="flex items-center mb-4">
              {renderStars(book.rating)}
              <span className="ml-2 text-lg font-medium text-gray-700 dark:text-gray-300">
                {book.rating} ({book.reviews.length} reviews)
              </span>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                book.availableCopies > 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {book.availableCopies > 0 
                  ? `${book.availableCopies} available` 
                  : 'Not available'
                }
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm">
                {book.genre}
              </span>
            </div>
          </div>

          {/* Book Metadata */}
          <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Calendar size={18} className="text-gray-500 mr-2" />
              <span className="text-gray-700 dark:text-gray-300">Published: {book.publishedYear}</span>
            </div>
            <div className="flex items-center">
              <Hash size={18} className="text-gray-500 mr-2" />
              <span className="text-gray-700 dark:text-gray-300">ISBN: {book.isbn}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {book.description}
            </p>
          </div>

          {/* Reviews Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reviews ({book.reviews.length})
              </h3>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  Write Review
                </Button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Rating
                  </label>
                  <div className="flex">
                    {renderStars(reviewRating, true, setReviewRating)}
                  </div>
                </div>
                <div className="mb-3">
                  <Input
                    type="text"
                    placeholder="Write your review..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" size="sm">Submit Review</Button>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {book.reviews.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No reviews yet. Be the first to review this book!
                </p>
              ) : (
                book.reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex items-center mb-2">
                      <User size={16} className="text-gray-500 mr-2" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {review.userName}
                      </span>
                      <div className="flex ml-auto">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{review.comment}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {review.date.toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};