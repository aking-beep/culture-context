import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Culture Context Admin', description: 'Source and change review console' };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
