import { notFound } from 'next/navigation';

/** Unknown paths inside a locale render the locale's not-found.tsx with HTTP 404. */
export default function CatchAll() {
  notFound();
}
