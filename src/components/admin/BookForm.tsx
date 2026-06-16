import React, { useState } from 'react';
import { Book } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { genres } from '../../utils/constants';

interface BookFormProps {
  initialBook?: Book;
  onSubmit: (book: Omit<Book, 'id' | 'reviews'>) => void | Promise<void>;
  onCancel: () => void;
}

const emptyForm = {
  title: '',
  author: '',
  isbn: '',
  genre: genres[1],
  publishedYear: new Date().getFullYear(),
  description: '',
  coverImage: '',
  totalCopies: 1,
  availableCopies: 1,
  rating: 0
};

export const BookForm: React.FC<BookFormProps> = ({ initialBook, onSubmit, onCancel }) => {
  const [form, setForm] = useState(() =>
    initialBook
      ? {
          title: initialBook.title,
          author: initialBook.author,
          isbn: initialBook.isbn,
          genre: initialBook.genre,
          publishedYear: initialBook.publishedYear,
          description: initialBook.description,
          coverImage: initialBook.coverImage,
          totalCopies: initialBook.totalCopies,
          availableCopies: initialBook.availableCopies,
          rating: initialBook.rating
        }
      : emptyForm
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (field: keyof typeof form, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.author.trim()) newErrors.author = 'Author is required';
    if (!form.isbn.trim()) newErrors.isbn = 'ISBN is required';
    if (!form.coverImage.trim()) newErrors.coverImage = 'Cover image URL is required';
    if (form.totalCopies < 0) newErrors.totalCopies = 'Must be 0 or more';
    if (form.availableCopies < 0 || form.availableCopies > form.totalCopies) {
      newErrors.availableCopies = 'Must be between 0 and total copies';
    }
    if (form.publishedYear < 0 || form.publishedYear > new Date().getFullYear() + 1) {
      newErrors.publishedYear = 'Enter a valid year';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...form,
      title: form.title.trim(),
      author: form.author.trim(),
      isbn: form.isbn.trim(),
      description: form.description.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={errors.title}
        />
        <Input
          label="Author"
          value={form.author}
          onChange={(e) => handleChange('author', e.target.value)}
          error={errors.author}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="ISBN"
          value={form.isbn}
          onChange={(e) => handleChange('isbn', e.target.value)}
          error={errors.isbn}
        />
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Genre
          </label>
          <select
            value={form.genre}
            onChange={(e) => handleChange('genre', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            {genres.filter(g => g !== 'All Genres').map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Published Year"
          type="number"
          value={form.publishedYear}
          onChange={(e) => handleChange('publishedYear', parseInt(e.target.value, 10) || 0)}
          error={errors.publishedYear}
        />
        <Input
          label="Total Copies"
          type="number"
          min={0}
          value={form.totalCopies}
          onChange={(e) => handleChange('totalCopies', parseInt(e.target.value, 10) || 0)}
          error={errors.totalCopies}
        />
        <Input
          label="Available Copies"
          type="number"
          min={0}
          value={form.availableCopies}
          onChange={(e) => handleChange('availableCopies', parseInt(e.target.value, 10) || 0)}
          error={errors.availableCopies}
        />
      </div>

      <Input
        label="Cover Image URL"
        value={form.coverImage}
        onChange={(e) => handleChange('coverImage', e.target.value)}
        error={errors.coverImage}
        placeholder="https://..."
      />

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="flex space-x-2 pt-2">
        <Button type="submit">{initialBook ? 'Save Changes' : 'Add Book'}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};
