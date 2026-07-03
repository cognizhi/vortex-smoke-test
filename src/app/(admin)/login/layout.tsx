import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
