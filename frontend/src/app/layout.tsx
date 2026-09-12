import '../styles/globals.css';
import { ReactNode } from 'react';

export const metadata = { title: 'Kashi Banaras — The Weave of Heritage', description: 'Pure Banarasi sarees, woven with tradition.' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
