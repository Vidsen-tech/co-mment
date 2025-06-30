import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { FaFacebookF, FaInstagram } from 'react-icons/fa';
import useTranslation from '@/hooks/useTranslation';
import AppLayout from '@/layouts/app-layout';


// --- Main Contact Page Component ---

Contact.layout = (page: React.ReactElement) => <AppLayout children={page} />;

export default function Contact() {
    const { t } = useTranslation();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Effect for mouse tracking (no change)
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
        return () => {
            if (currentRef) {
                currentRef.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, []);

    return (
        // ★★★ UNIFIED PAGE STYLES ★★★
        <div
            ref={containerRef}
            className="relative flex flex-col bg-background dark:bg-gradient-to-br dark:from-gray-900 dark:via-indigo-950 dark:to-black min-h-screen text-foreground overflow-hidden"
            style={{ '--mouse-x': `${mousePosition.x}px`, '--mouse-y': `${mousePosition.y}px` } as React.CSSProperties}
        >
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
                style={{ background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), hsl(var(--primary) / 0.15), transparent 80%)` }}
                aria-hidden="true"
            />

            {/* Content Wrapper */}
            <div className="relative z-10 flex flex-col flex-grow">
                {/* Main Content */}
                <main className="flex-grow flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        // ★★★ UNIFIED CARD STYLE ★★★
                        className="w-full max-w-4xl bg-card/80 dark:bg-card/50 backdrop-blur-md border border-border rounded-2xl p-8 md:p-12 lg:p-16 text-center shadow-xl"
                    >
                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-foreground">
                            {t('contact.title')}
                        </h1>

                        {/* Organisation */}
                        <div className="text-xl sm:text-2xl md:text-3xl font-semibold leading-relaxed text-foreground">
                            {t('contact.orgLine1')}
                            <br />
                            {t('contact.orgLine2')}
                        </div>

                        {/* Info Block */}
                        <div className="text-lg sm:text-xl mt-6 leading-relaxed text-muted-foreground">
                            OIB: 66592376787
                            <br />
                            IBAN: HR5423600001103108812
                            <br />
                            Ulica Ljudevita Posavskog 36
                            <br />
                            10000 Zagreb
                        </div>

                        {/* Contact Details */}
                        <div className="text-lg sm:text-xl mt-4 leading-relaxed text-muted-foreground">
                            Email:{' '}
                            <a
                                href="mailto:uo-comment@gmail.com"
                                className="font-semibold text-primary hover:underline transition-colors"
                            >
                                uo.comment@gmail.com
                            </a>
                            <br />
                            <span className="font-semibold text-foreground">Linda:</span> (+385) 99 400 8815
                            <br />
                            <span className="font-semibold text-foreground">Dora:</span> (+385) 99 385 6565
                        </div>
                    </motion.div>
                </main>

                {/* Consistent Footer */}
                <footer className="flex-shrink-0 flex flex-col items-center py-12 px-4">
                    {/* Social Links */}
                    <div className="flex space-x-6 mb-6">
                        <a
                            href="https://www.facebook.com/people/UO-Co-mment/61573194065494/#"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                            className="text-3xl text-muted-foreground hover:text-primary transition-colors"
                        >
                            <FaFacebookF />
                        </a>
                        <a
                            href="https://www.instagram.com/uo_co_mment/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            className="text-3xl text-muted-foreground hover:text-primary transition-colors"
                        >
                            <FaInstagram />
                        </a>
                    </div>

                    {/* Logo Link */}
                    <Link href="/">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 3 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className="relative w-32 h-32 sm:w-40 sm:h-40"
                        >
                            <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" onError={(e) => { e.currentTarget.src = 'https://placehold.co/160x160/000000/FFFFFF?text=Logo' }} />
                        </motion.div>
                    </Link>
                </footer>
            </div>
        </div>
    );
}
