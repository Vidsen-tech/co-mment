// /* eslint-disable no-irregular-whitespace */
import { useState, useEffect, useRef } from 'react'; // <-- Import useRef
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { FaFacebookF, FaInstagram } from 'react-icons/fa';
import useTranslation from '@/hooks/useTranslation';

export default function Contact() {
    const { t } = useTranslation();
    const [loaded, setLoaded] = useState(false);

    // --- New state and ref for interactive background ---
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    // --- End of new state and ref ---

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 80);
        return () => clearTimeout(timer);
    }, []);

    // --- Effect for tracking mouse position ---
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePosition({
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                });
            }
        };

        const currentRef = containerRef.current;
        if (currentRef) {
            currentRef.addEventListener('mousemove', handleMouseMove);
        }

        // Cleanup function to remove the event listener
        return () => {
            if (currentRef) {
                currentRef.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, []); // Empty dependency array means this runs once on mount and cleanup on unmount
    // --- End of mouse tracking effect ---

    return (
        // --- Updated main container for background effect ---
        <div
            ref={containerRef} // Add ref here
            className={`relative flex flex-col min-h-screen text-white transition-opacity duration-500 overflow-hidden
                  bg-gradient-to-br from-gray-900 via-indigo-950 to-black
                  ${loaded ? 'opacity-100' : 'opacity-0'}`}
            // Apply CSS variables for mouse position
            style={{
                '--mouse-x': `${mousePosition.x}px`,
                '--mouse-y': `${mousePosition.y}px`,
            } as React.CSSProperties} // Type assertion for custom properties
        >
            {/* Add the pseudo-element for the cursor light effect */}
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0" // Ensure z-index is lower than content
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.15), transparent 80%)`
                }}
                aria-hidden="true"
            />
            {/* --- End of background effect elements --- */}

            {/* Content needs to be relative to stack above the pseudo-element and maintain flex layout */}
            <div className="relative z-10 flex flex-col flex-grow">
                {/* main */}
                {/* Added flex-grow to main to push footer down */}
                <main className="flex-grow flex flex-col items-center justify-center px-4 py-8">
                    <div className="max-w-2xl w-full text-center bg-black/20 backdrop-blur-sm p-6 md:p-10 rounded-lg border border-gray-700/30"> {/* Optional subtle background for text block */}
                        {/* title */}
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-8">
                            {t('contact.title')}
                        </h1>

                        {/* organisation */}
                        <div className="text-xl sm:text-2xl md:text-3xl font-semibold leading-relaxed">
                            {t('contact.orgLine1')}
                            <br />
                            {t('contact.orgLine2')}
                        </div>

                        {/* info block */}
                        <div className="text-lg sm:text-xl md:text-2xl mt-4 leading-relaxed text-gray-300"> {/* Slightly lighter color for secondary info */}
                            OIB: 00000000000
                            <br />
                            IBAN: HR123456789101568
                            <br />
                            Ulica Ljudevita Posavskog 36
                            <br />
                            10000 Zagreb
                        </div>

                        {/* contact details */}
                        <div className="text-lg sm:text-xl md:text-2xl mt-4 leading-relaxed">
                            Email:{' '}
                            <a
                                href="mailto:uo-comment@gmail.com"
                                className="underline hover:text-indigo-300 transition-colors" // Enhanced link color
                            >
                                uo.comment@gmail.com
                            </a>
                            <br />
                            Linda: (+385) 99 400 8815
                            <br />
                            Dora: (+385) 99 385 6565
                        </div>
                    </div>
                </main>

                {/* footer */}
                {/* Footer is part of the z-10 flex container */}
                <footer className="flex flex-col items-center mb-8 px-4 shrink-0"> {/* Added shrink-0 */}
                    {/* social */}
                    <div className="flex space-x-6 mb-6">
                        <Link
                            href="https://www.facebook.com/yourprofile" // Remember to update these links!
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                            className="text-3xl sm:text-4xl md:text-5xl text-gray-400 hover:text-white transition-colors" // Adjusted icon colors
                        >
                            <FaFacebookF />
                        </Link>
                        <Link
                            href="https://www.instagram.com/yourprofile" // Remember to update these links!
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            className="text-3xl sm:text-4xl md:text-5xl text-gray-400 hover:text-white transition-colors" // Adjusted icon colors
                        >
                            <FaInstagram />
                        </Link>
                    </div>

                    {/* logo link */}
                    <Link href="/">
                        <motion.div
                            whileHover={{ scale: 1.2, rotate: 3 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48"
                        >
                            <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" />
                        </motion.div>
                    </Link>
                </footer>
            </div> {/* End relative z-10 content wrapper */}
        </div> // End of main container
    );
}
