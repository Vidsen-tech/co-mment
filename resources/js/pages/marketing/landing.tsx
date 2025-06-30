// resources/js/Pages/marketing/landing.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import useTranslation from '@/hooks/useTranslation';

// Assets & geometry (No changes here)
const images = [
    '/images/landing_1.jpg',
    '/images/landing_2.jpg',
    '/images/landing_3.jpg',
    '/images/landing_4.jpg',
];

const polygons = [
    { coords: [[0, 0], [35, 0], [15, 25]],                      clip: 'polygon(0 0,35% 0,15% 25%)' },
    { coords: [[35, 0], [70, 0], [55, 25], [35, 25]],           clip: 'polygon(35% 0,70% 0,55% 25%,35% 25%)' },
    { coords: [[70, 0], [100, 0], [100, 25], [70, 25]],         clip: 'polygon(70% 0,100% 0,100% 25%,70% 25%)' },
    { coords: [[0, 25], [25, 25], [12, 55], [0, 55]],           clip: 'polygon(0 25%,25% 25%,12% 55%,0 55%)' },
    { coords: [[25, 25], [55, 25], [42, 55], [25, 55]],         clip: 'polygon(25% 25%,55% 25%,42% 55%,25% 55%)' },
    { coords: [[55, 25], [85, 25], [85, 55], [60, 55], [55, 40]], clip: 'polygon(55% 25%,85% 25%,85% 55%,60% 55%,55% 40%)' },
    { coords: [[0, 55], [15, 55], [30, 100], [0, 100]],         clip: 'polygon(0 55%,15% 55%,30% 100%,0 100%)' },
    { coords: [[15, 55], [45, 55], [32, 100], [15, 100]],       clip: 'polygon(15% 55%,45% 55%,32% 100%,15% 100%)' },
    { coords: [[45, 55], [75, 55], [75, 100], [50, 100], [45, 78]], clip: 'polygon(45% 55%,75% 55%,75% 100%,50% 100%,45% 78%)' },
    { coords: [[75, 55], [100, 55], [100, 100], [85, 100]],     clip: 'polygon(75% 55%,100% 55%,100% 100%,85% 100%)' },
];

const overlayVariants = {
    initial: { opacity: 1 },
    animate: (i: number) => ({
        opacity: 0,
        transition: { delay: 0.35 + i * 0.06, duration: 0.5, ease: 'easeOut' },
    }),
};

// Helper – point-in-polygon (No changes here)
const pointInPolygon = (x: number, y: number, poly: number[][]) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        const intersect =
            yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
};

// Motion-wrapped Inertia Link
const MotionLink = motion(Link);

// Reusable nav item
const Item = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <MotionLink
        href={href}
        // FIX: Replaced 'text-white' with theme-aware colors.
        className="relative block cursor-pointer text-neutral-800 dark:text-white no-underline"
        initial="rest"
        whileHover="hover"
        layout
    >
        {children}
        <motion.span
            layoutId="underline"
            // FIX: Replaced 'bg-white' with theme-aware colors for the underline.
            className="absolute left-0 -bottom-1 h-0.5 w-full bg-neutral-800 dark:bg-white origin-center"
            variants={{
                rest: { scaleX: 0, opacity: 0 },
                hover: { scaleX: 1, opacity: 1 }
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
    </MotionLink>
);

// Language flags (No changes here)
const Flags = ({ locale }: { locale: string }) => (
    <div className="absolute top-4 right-4 z-30 flex gap-3">
        {['hr', 'en'].map((lng) => (
            <Link
                key={lng}
                href={route('lang.switch', lng)}
                preserveScroll
                className={`transition-opacity ${locale === lng ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
            >
                <img src={`/flags/${lng}.png`} width={32} height={32} alt={lng} />
            </Link>
        ))}
    </div>
);

// Dropdown animation variants (No changes here)
const dropdownVariants = {
    hidden: { opacity: 0, y: -5, transition: { duration: 0.2, ease: "easeOut" } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export default function Landing() {
    const { locale, t } = useTranslation();

    const [loaded, setLoaded] = useState(false);
    const [reveal, setReveal] = useState(false);
    const [polys, setPolys] = useState<string[]>(Array.from({ length: polygons.length }, () => images[0]));
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const [isProjectsHovered, setIsProjectsHovered] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // All hooks (useEffect, useCallback) remain the same. No changes needed there.
    useEffect(() => {
        const t1 = setTimeout(() => setLoaded(true), 60);
        const t2 = setTimeout(() => setReveal(true), 380);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    const handleMove = useCallback((e: MouseEvent) => {
        const xp = (e.clientX / window.innerWidth) * 100;
        const yp = (e.clientY / window.innerHeight) * 100;
        let idx: number | null = null;
        for (let i = 0; i < polygons.length; i++) {
            if (pointInPolygon(xp, yp, polygons[i].coords)) { idx = i; break; }
        }
        if (idx !== null && idx !== hoverIdx) {
            setPolys(prev => {
                const next = [...prev];
                let img = images[Math.floor(Math.random() * images.length)];
                while (img === next[idx]) img = images[Math.floor(Math.random() * images.length)];
                next[idx] = img;
                return next;
            });
            setHoverIdx(idx);
        } else if (idx === null) {
            setHoverIdx(null);
        }
    }, [hoverIdx]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, [handleMove]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProjectsHovered(false);
            }
        };
        if (isProjectsHovered) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProjectsHovered]);

    useEffect(() => {
        if (!isProjectsHovered || !dropdownRef.current) return;
        const triggerRect = dropdownRef.current.getBoundingClientRect();
        const menuEl = dropdownRef.current.querySelector('ul');
        const menuHeight = menuEl?.clientHeight ?? 0;
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        setDropUp(menuHeight > spaceBelow);
    }, [isProjectsHovered]);

    return (
        // FIX: Added bg-white dark:bg-black to the main container. This sets the base color for each theme.
        <div className={`relative w-full h-screen overflow-hidden bg-white dark:bg-black
      transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>

            {/* FIX: In dark mode, we show the image polygons. In light mode, we hide them to keep the UI clean and prevent visual clutter on a white background. */}
            <div className="hidden dark:block">
                {polygons.map((p, i) => (
                    <div
                        key={i}
                        style={{
                            backgroundImage: `url(${polys[i]})`,
                            clipPath: p.clip,
                            WebkitClipPath: p.clip,
                        }}
                        className="absolute inset-0 bg-cover bg-center transition-[background-image] duration-500 will-change-transform"
                    />
                ))}
            </div>

            {/* overlay wipe animation */}
            <AnimatePresence>
                {!reveal && polygons.map((p, i) => (
                    <motion.div
                        key={i}
                        // FIX: The wipe animation now uses a white background in light mode and black in dark mode.
                        className="absolute inset-0 bg-white dark:bg-black"
                        style={{ clipPath: p.clip, WebkitClipPath: p.clip }}
                        custom={i}
                        variants={overlayVariants}
                        initial="initial"
                        animate="animate"
                        exit="animate"
                    />
                ))}
            </AnimatePresence>

            {/* foreground UI */}
            {/* FIX: Ensures the main content area is truly centered and takes up the full screen height reliably. */}
            <main className="relative z-20 grid place-items-center h-full text-neutral-800 dark:text-white">
                <Flags locale={locale} />

                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                    className="flex flex-col items-center gap-12 sm:gap-14 lg:gap-16 pointer-events-auto"
                >
                    {/* Your logo. Consider having a dark version for light mode if the default is light-colored. */}
                    <img
                        src="/logo.svg"
                        alt="Logo"
                        // FIX: In dark mode, the logo is slightly transparent. In light mode, it's fully opaque.
                        className="w-56 sm:w-80 lg:w-[32rem] xl:w-[36rem] 2xl:w-[40rem] dark:opacity-90 opacity-100"
                    />

                    <motion.nav layout className="flex flex-col sm:flex-row items-center gap-6 sm:gap-14
            text-3xl sm:text-4xl lg:text-5xl xl:text-6xl
            font-extrabold
            // FIX: Background is now theme-aware. A light, glassy effect on light mode, and a dark, glassy effect on dark mode.
            bg-white/60 dark:bg-black/40 backdrop-blur-sm px-8 py-5 sm:px-10 sm:py-6 rounded-xl overflow-visible">

                        <Item href="/about">{t('nav.about')}</Item>
                        <Item href="/contact">{t('nav.contact')}</Item>

                        <motion.div
                            ref={dropdownRef}
                            className="relative inline-block"
                            onMouseEnter={() => setIsProjectsHovered(true)}
                            onMouseLeave={() => setIsProjectsHovered(false)}
                        >
                            <div
                                className="relative cursor-pointer"
                                onClick={e => {
                                    e.stopPropagation();
                                    setIsProjectsHovered(b => !b);
                                }}
                            >
                                {t('nav.projects')}
                                <motion.span
                                    // FIX: Underline color is now theme-aware.
                                    className="absolute left-0 -bottom-1.5 h-0.5 lg:h-1 w-full bg-neutral-800 dark:bg-white origin-center"
                                    animate={isProjectsHovered ? "hover" : "rest"}
                                    variants={{ rest: { scaleX: 0, opacity: 0 }, hover: { scaleX: 1, opacity: 1 } }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                />
                            </div>

                            <AnimatePresence>
                                {isProjectsHovered && (
                                    <motion.ul
                                        variants={dropdownVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        className={`
                      absolute left-1/2 transform -translate-x-1/2
                      ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'}
                      sm:left-auto sm:right-0 sm:translate-x-0
                      sm:${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'}
                      z-20
                      w-64 sm:w-72 lg:w-80 xl:w-96
                      // FIX: Dropdown background and text color are now theme-aware.
                      bg-white/80 dark:bg-black/80 text-neutral-800 dark:text-white backdrop-blur rounded-lg
                      px-5 py-4 lg:px-6 lg:py-5
                      space-y-3 lg:space-y-4
                      text-xl lg:text-2xl xl:text-3xl
                      whitespace-nowrap
                      max-h-[calc(100vh-4rem)] overflow-y-auto
                    `}
                                        style={{ transformOrigin: dropUp ? 'bottom center' : 'top center' }}
                                        onMouseEnter={() => setIsProjectsHovered(true)}
                                        onMouseLeave={() => setIsProjectsHovered(false)}
                                    >
                                        {/* FIX: Hover text color is now theme-aware */}
                                        <li>
                                            <Link className="hover:text-neutral-500 dark:hover:text-gray-300 transition-colors duration-150" href="/projekti/radovi" onClick={() => setIsProjectsHovered(false)}>
                                                {t('nav.projects.works')}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="hover:text-neutral-500 dark:hover:text-gray-300 transition-colors duration-150" href="/projekti/radionice" onClick={() => setIsProjectsHovered(false)}>
                                                {t('nav.projects.workshops')}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="hover:text-neutral-500 dark:hover:text-gray-300 transition-colors duration-150" href="/projekti/novosti-arhiva" onClick={() => setIsProjectsHovered(false)}>
                                                {t('nav.projects.news')}
                                            </Link>
                                        </li>
                                    </motion.ul>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.nav>
                </motion.div>
            </main>
        </div>
    );
}
