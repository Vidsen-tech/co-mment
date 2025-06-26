// ★★★ 1. Add useRef to the React import ★★★
import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown, Link as LinkIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Type Definitions ---
interface Performance {
    id: number;
    date: string;
    time: string;
    location: string;
    news_link: string | null;
}
interface WorkImage {
    id: number;
    url: string;
    author: string | null;
}
interface Work {
    id: number;
    slug: string;
    title: string;
    description: string;
    credits: Record<string, string>;
    premiere_date: string;
    thumbnail_url: string | null;
    performances: Performance[];
    images: WorkImage[];
}
interface RadoviPageProps {
    works: Work[];
}

// --- Lightbox Component (No changes) ---
const ImageLightbox = ({ images, startIndex, onClose }: { images: WorkImage[], startIndex: number, onClose: () => void }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const goToPrevious = () => setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    const goToNext = () => setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') goToPrevious();
            if (event.key === 'ArrowRight') goToNext();
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <AnimatePresence mode="wait">
                <motion.img key={currentIndex} src={images[currentIndex].url} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            </AnimatePresence>
            <button className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors" onClick={(e) => { e.stopPropagation(); onClose(); }}><X size={40} /></button>
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors" onClick={(e) => { e.stopPropagation(); goToPrevious(); }}><ChevronLeft size={60} /></button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors" onClick={(e) => { e.stopPropagation(); goToNext(); }}><ChevronRight size={60} /></button>
            {images[currentIndex].author && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">Autor: {images[currentIndex].author}</div>}
        </motion.div>
    );
};

// --- Sub-components (No changes) ---
const PerformanceTable = ({ performances }: { performances: Performance[] }) => {
    if (!performances || performances.length === 0) {
        return <div className="mt-8"><h4 className="text-xl font-semibold text-gray-200 mb-4">Izvedbe</h4><p className="text-gray-400">Nema zabilježenih nadolazećih izvedbi.</p></div>
    }
    return (
        <div className="mt-8">
            <h4 className="text-xl font-semibold text-gray-200 mb-4">Izvedbe</h4>
            <div className="border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-800/50 text-xs text-gray-400 uppercase tracking-wider"><tr><th scope="col" className="px-6 py-3">Datum</th><th scope="col" className="px-6 py-3">Lokacija</th><th scope="col" className="px-6 py-3">Poveznica</th></tr></thead>
                    <tbody>
                    {performances.map((p) => (
                        <tr key={p.id} className="border-t border-gray-700 hover:bg-gray-800/40 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">{p.date}</td>
                            <td className="px-6 py-4">{p.location}</td>
                            <td className="px-6 py-4">{p.news_link ? <Link href={p.news_link} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2"><LinkIcon size={16} /><span>Više</span></Link> : <span className="text-gray-500">-</span>}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
const CreditsList = ({ credits }: { credits: Record<string, string> }) => {
    if (!credits || typeof credits !== 'object' || Object.keys(credits).length === 0) return null;
    return (
        <div className="mt-8 space-y-4">
            {Object.entries(credits).map(([role, name]) => (
                <div key={role} className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-baseline">
                    <dt className="font-semibold text-gray-300">{role}:</dt>
                    <dd className="md:col-span-2 text-gray-400">{role === 'Trailer' ? <a href={name} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 break-all">{name}</a> : name}</dd>
                </div>
            ))}
        </div>
    );
};

const WorkCard = ({ work }: { work: Work }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLightboxOpen, setLightboxOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const openLightbox = (index: number) => { setSelectedImageIndex(index); setLightboxOpen(true); };

    return (
        <>
            <AnimatePresence>{isLightboxOpen && <ImageLightbox images={work.images} startIndex={selectedImageIndex} onClose={() => setLightboxOpen(false)} />}</AnimatePresence>
            <Collapsible.Root open={isOpen} onOpenChange={setIsOpen} className="border-b-2 border-indigo-500/10 last:border-b-0">
                <div className="group relative w-full h-[60vh] md:h-[80vh] flex items-end p-6 md:p-12 text-white bg-gray-900 overflow-hidden">
                    <div className="absolute inset-0"><img src={work.images[0]?.url || work.thumbnail_url || `https://placehold.co/1200x800/0f172a/9ca3af?text=${work.slug}`} alt={`Thumbnail for ${work.title}`} className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div></div>
                    <div className="relative z-10 w-full">
                        <motion.h2 layout="position" className="text-4xl md:text-6xl lg:text-8xl font-extrabold">{work.title}</motion.h2>
                        <Collapsible.Trigger asChild><button className="mt-6 flex items-center gap-3 text-lg font-semibold bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full hover:bg-white/20 transition-all duration-300">Više informacija<motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown size={24} /></motion.div></button></Collapsible.Trigger>
                    </div>
                </div>
                <Collapsible.Content asChild>
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5, ease: 'easeInOut' }} className="overflow-hidden">
                        <div className="bg-gray-900 text-white p-6 md:p-12">
                            <div className="max-w-4xl mx-auto">
                                {work.images && work.images.length > 0 && (
                                    <div className="mb-12"><h4 className="text-xl font-semibold text-gray-200 mb-4">Galerija</h4><div className="flex overflow-x-auto gap-4 pb-4 -mb-4">{work.images.map((image, index) => (<button key={image.id} onClick={() => openLightbox(index)} className="flex-shrink-0 w-4/5 md:w-2/3 lg:w-1/2 snap-start cursor-pointer group/image overflow-hidden rounded-lg"><img src={image.url} alt={image.author || work.title} className="w-full h-auto object-cover rounded-lg shadow-lg transition-transform duration-300 group-hover/image:scale-105" />{image.author && <p className="text-right text-xs text-gray-400 mt-2">Autor: {image.author}</p>}</button>))}</div></div>
                                )}
                                <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">{work.description}</p>
                                <CreditsList credits={work.credits} />
                                <PerformanceTable performances={work.performances} />
                            </div>
                        </div>
                    </motion.div>
                </Collapsible.Content>
            </Collapsible.Root>
        </>
    );
};

// --- Main Page Component ---
export default function Radovi({ works }: RadoviPageProps) {
    // ★★★ 2. Add the state and ref for the interactive background ★★★
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

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

    return (
        // ★★★ 3. Apply the ref, style, and classes to the main container ★★★
        <div
            ref={containerRef}
            className="relative bg-black min-h-screen text-white overflow-hidden"
            style={{ '--mouse-x': `${mousePosition.x}px`, '--mouse-y': `${mousePosition.y}px` } as React.CSSProperties}
        >
            {/* ★★★ 4. Add the radial gradient background element ★★★ */}
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
                style={{ background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.1), transparent 80%)` }}
                aria-hidden="true"
            />

            {/* ★★★ 5. Wrap main content to ensure it's on top ★★★ */}
            <main className="relative z-10">
                {works.map((work) => (
                    <WorkCard key={work.id} work={work} />
                ))}
            </main>

            {/* ★★★ 6. Add the consistent footer with the animated logo ★★★ */}
            <footer className="relative z-10 flex flex-col items-center py-12 px-4">
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
        </div>
    );
}
