import { Checkout } from '../types';

/**
 * Returns true if an active checkout is past its due date.
 */
export function isOverdue(checkout: Checkout): boolean {
  if (checkout.status !== 'active') return false;
  return new Date(checkout.dueDate).getTime() < Date.now();
}

/**
 * Returns the effective status of a checkout, treating active-but-late
 * checkouts as 'overdue' without needing a separate state transition.
 */
export function getCheckoutStatus(checkout: Checkout): 'active' | 'returned' | 'overdue' {
  if (checkout.status === 'returned') return 'returned';
  return isOverdue(checkout) ? 'overdue' : 'active';
}

/**
 * Number of days remaining until due (negative if overdue).
 */
export function daysUntilDue(checkout: Checkout): number {
  const due = new Date(checkout.dueDate).getTime();
  const diff = due - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
