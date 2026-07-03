import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | SimplyBook',
    default: 'SimplyBook',
  },
};

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
