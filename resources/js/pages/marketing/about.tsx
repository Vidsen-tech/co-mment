// /* eslint-disable no-irregular-whitespace */
import { useState, useEffect, useRef } from 'react'; // <-- Import useRef
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import Modal from '@/components/Modal';
import useTranslation from '@/hooks/useTranslation';

interface Dancer {
    id: number;
    photo: string;
    name: Record<string, string>;
    bio: Record<string, string>;
}

export default function About() {
    const { locale, t } = useTranslation();
    const [loaded, setLoaded] = useState(false);
    const [openId, setOpenId] = useState<number | null>(null);

    // --- New state and ref for interactive background ---
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    // --- End of new state and ref ---

    /* fade‑in once */
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

    /* static data – move to JSON later if you wish */
    const dancers: Dancer[] = [
        {
            id: 1,
            photo: '/images/dancer_linda.png',
            name: { hr: 'Linda Tarnovski', en: 'Linda Tarnovski' },
            bio: {
                hr: `Linda Tarnovski (univ.bacc.art) je plesačica suvremenog plesa bazirana u Zagrebu.
Diplomirala je Suvremeni ples na ADU te je nastavila usavršavanje u Švedskoj.
Profesionalno iskustvo obuhvaća suradnju s domaćim i inozemnim koreografima,
a od 2022. su-osnivačica je Umjetničke organizacije CO-MENT.`,
                en: `Linda Tarnovski (univ.bacc.art) is a contemporary dancer based in Zagreb.
She graduated Contemporary Dance at the Academy of Dramatic Arts and continued
her training in Sweden. Her professional experience spans collaborations with
Croatian and international choreographers, and since 2022 she is a co‑founder
of the art organisation CO‑MENT.`,
            },
        },
        {
            id: 2,
            photo: '/images/dancer_dora.png',
            name: { hr: 'Dora Pocedić', en: 'Dora Pocedić' },
            bio: {
                hr: `Dora Pocedić (univ.bacc.art) je plesačica suvremenog plesa iz Zagreba.
Diplomirala je Suvremeni ples na ADU te se usavršavala u Švedskoj kroz Erasmus+.
Profesionalno radi s mnogim renomiranim koreografima te je od 2022. su-osnivačica
Umjetničke organizacije Co-mment.`,
                en: `Dora Pocedić (univ.bacc.art) is a contemporary dancer from Zagreb.
She holds a BA in Contemporary Dance and enriched her studies in Sweden via
Erasmus+. She collaborates with renowned choreographers and co‑founded
CO‑MENT in 2022.`,
            },
        },
    ];

    const orgName = t('about.orgName');
    const statement = t('about.statement');

    return (
        // --- Updated main container for background effect ---
        <div
            ref={containerRef} // Add ref here
            className={`relative w-full min-h-screen text-white transition-opacity duration-500 overflow-hidden
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

            {/* Content needs to be relative to stack above the pseudo-element */}
            <div className="relative z-10">
                {/* hero */}
                <div className="relative w-full h-80 md:h-[32rem] overflow-hidden">
                    <img
                        src="/images/landing_4.jpg"
                        alt="Hero"
                        className="object-cover w-full h-full"
                    />
                    {/* Optional: Add a subtle overlay to the hero image if text contrast is needed */}
                    {/* <div className="absolute inset-0 bg-black/20"></div> */}
                </div>

                <div className="max-w-screen-xl mx-auto px-4 py-12">
                    {/* heading */}
                    <h1 className="text-center text-4xl md:text-5xl font-extrabold mb-6">
                        {orgName}
                    </h1>
                    <p className="mx-auto max-w-3xl text-center text-lg md:text-xl text-gray-300
                           leading-relaxed whitespace-pre-line mb-16">
                        {statement}
                    </p>

                    {/* dancer grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                        {dancers.map(({ id, photo, name }) => (
                            <motion.div
                                /* eslint-disable-next-line react/jsx-key */
                                key={id}
                                whileHover={{ scale: 1.04 }}
                                // Updated card style for consistency
                                className="bg-gray-900/70 backdrop-blur-sm rounded-lg shadow-lg cursor-pointer overflow-hidden
                                     border border-gray-700/50 hover:shadow-indigo-500/30"
                                onClick={() => setOpenId(id)}
                            >
                                <div className="relative w-full h-64">
                                    <img src={photo} alt={name[locale]} className="object-cover w-full h-full" />
                                </div>
                                <div className="p-4">
                                    <h2 className="text-xl font-bold text-gray-100">{name[locale]}</h2>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* logo link back home */}
                    <div className="flex justify-center">
                        <Link href="/">
                            <motion.div
                                whileHover={{ scale: 1.08, rotate: 3 }}
                                transition={{ type: 'spring', stiffness: 220 }}
                                className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44"
                            >
                                <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" />
                            </motion.div>
                        </Link>
                    </div>
                </div>

                {/* modals */}
                {dancers.map(({ id, name, bio, photo }) => (
                    // Modal styling remains the same - typically overlays everything including the background effect
                    <Modal key={id} isOpen={openId === id} onClose={() => setOpenId(null)}>
                        {/* Modal content structure from Novosti for consistency */}
                        <div className="flex flex-col md:flex-row max-h-[90vh] max-w-4xl w-full bg-white text-black rounded-lg overflow-hidden">
                            {/* Image container */}
                            <div className="w-full md:w-1/2 flex-shrink-0 bg-gray-100 flex items-center justify-center p-4">
                                <img src={photo} alt={name[locale]} className="object-contain max-h-[60vh] md:max-h-full w-auto h-auto" />
                            </div>
                            {/* Text container */}
                            <div className="w-full md:w-1/2 flex flex-col p-6 overflow-y-auto">
                                <h2 className="text-2xl md:text-3xl font-bold mb-4 shrink-0">{name[locale]}</h2>
                                <div className="flex-grow overflow-y-auto">
                                    <p className="text-base md:text-lg leading-relaxed whitespace-pre-line">
                                        {bio[locale]}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Modal>
                ))}
            </div> {/* End relative z-10 content wrapper */}
        </div> // End of main container
    );
}
