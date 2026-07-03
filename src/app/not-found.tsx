import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound(): React.ReactElement {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-2 text-6xl font-bold">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Page not found</h2>
        <p className="mb-6 text-gray-600">The page you're looking for doesn't exist.</p>
        <Link href="/">
          <Button variant="default">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
