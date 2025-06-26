import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import useTranslation from '@/hooks/useTranslation';
import { useState, useEffect, useRef } from 'react';
import { BookOpen, Calendar, MapPin, Link as LinkIcon } from 'lucide-react';

// We define the structure of our translated content object.
// This provides type safety and makes the code easier to work with.
interface WorkshopContent {
    title: string;
    description: string;
    section_title_description: string;
    section_title_sessions: string;
    more_info: string;
    coming_soon: string;
    sessions: Array<{
        date: string;
        location: string;
        event: string;
        link: string;
    }>;
}

// --- Main Page Component ---
export default function Radionice() {
    // Initialize the translation hook
    const { t } = useTranslation();

    // Safely get the entire block of workshop content as a single object.
    // This requires your JSON files to have the single "workshops_page" key.
    const content = t('workshops_page', { returnObjects: true }) as WorkshopContent;

    // State and ref for the interactive background
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Effect for the interactive background
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
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

    // If the content hasn't loaded properly, show a loading message to prevent a crash.
    if (!content || !content.sessions) {
        return <div className="p-4 text-center text-xl text-white">Loading...</div>;
    }

    return (
        <div
            ref={containerRef}
            className="relative bg-gradient-to-br from-gray-900 via-indigo-950 to-black text-white min-h-screen overflow-hidden"
            style={{ '--mouse-x': `${mousePosition.x}px`, '--mouse-y': `${mousePosition.y}px` } as React.CSSProperties}
        >
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
                style={{ background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.15), transparent 80%)` }}
                aria-hidden="true"
            />
            <div className="relative z-10">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                    <header className="relative h-[50vh] flex items-center justify-center text-center p-6 overflow-hidden bg-transparent">
                        <div className="relative z-10">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="text-4xl md:text-6xl font-extrabold tracking-tight"
                            >
                                {content.title}
                            </motion.h1>
                        </div>
                    </header>
                    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                        >
                            <div className="flex items-center gap-3 text-indigo-400 mb-4">
                                <BookOpen size={20} />
                                <h2 className="text-2xl font-bold uppercase tracking-wider">{content.section_title_description}</h2>
                            </div>
                            <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
                                {content.description}
                            </p>
                            <div className="mt-16">
                                <div className="flex items-center gap-3 text-indigo-400 mb-6">
                                    <Calendar size={20} />
                                    <h2 className="text-2xl font-bold uppercase tracking-wider">{content.section_title_sessions}</h2>
                                </div>
                                <div className="space-y-6">
                                    {content.sessions.map((session, index) => (
                                        <div key={index} className="bg-gray-900/50 p-6 rounded-lg border border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-start">
                                            <div>
                                                <p className="font-bold text-xl text-white">{session.date}</p>
                                                <p className="text-gray-400 flex items-center gap-2 mt-1">
                                                    <MapPin size={16} />
                                                    {session.location}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-2">{session.event}</p>
                                            </div>
                                            <a href={session.link} target="_blank" rel="noopener noreferrer" className="mt-4 md:mt-0 flex-shrink-0 inline-flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
                                                <LinkIcon size={16} />
                                                <span>{content.more_info}</span>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-16 text-center text-gray-500"><p>{content.coming_soon}</p></div>
                        </motion.div>
                    </main>
                    <footer className="flex flex-col items-center py-12 px-4">
                        <Link href="/">
                            <motion.div
                                whileHover={{ scale: 1.2, rotate: 3 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="relative w-32 h-32 sm:w-40 sm:h-40"
                            >
                                <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" onError={(e) => { e.currentTarget.src = 'https://placehold.co/160x160/000000/FFFFFF?text=Logo' }} />
                            </motion.div>
                        </Link>
                    </footer>
                </motion.div>
            </div>
        </div>
    );
}
