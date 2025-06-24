import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className='min-h-screen bg-gray-50'>
      <AppHeader />
      <main>{children}</main>
    </div>
  );
}
