import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'UNLu Academic Credentials',
  description: 'Sistema de verificación y emisión de credenciales académicas para la Universidad Nacional de Luján (UNLu) on-chain',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
