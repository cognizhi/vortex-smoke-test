import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design',
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
