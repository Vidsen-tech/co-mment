import React from 'react';
import Footer from '@/components/Footer';

// This layout will wrap our PUBLIC pages (Radovi, Radionice, etc.)
export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        // This flex container ensures the footer is always at the bottom.
        <div className="flex flex-col min-h-screen">

            {/* The main page content (e.g., the Radovi component) will be rendered here */}
            <main className="flex-grow">
                {children}
            </main>

            {/* The shared public footer */}
            <Footer />
        </div>
    );
}
