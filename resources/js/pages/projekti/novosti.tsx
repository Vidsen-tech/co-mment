// resources/js/pages/projekti/novosti.tsx

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react'; // ★ CHANGE: Removed Collapsible imports
import useTranslation from '@/hooks/useTranslation';
import AppLayout from '@/layouts/app-layout';
import NewsModal from '@/components/NewsModal'; // ★ CHANGE: Added our new modal

// --- Type Definitions (No Changes) ---
interface NewsImageDetail {
    id: number;
    url: string;
    author: string | null;
    is_thumbnail: boolean;
}

interface NewsItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    date: string;
    formatted_date: string;
    type: string;
    category: string | null;
    source: string | null;
    is_active: boolean;
    images: NewsImageDetail[];
    thumbnail_url: string | null;
}

interface PaginatedNewsResponse {
    current_page: number;
    data: NewsItem[];
    last_page: number;
}

// --- ★ CHANGE: Export the lightbox so our new modal can use it ---
export const ImageLightbox = ({ images, startIndex, onClose }: { images: NewsImageDetail[], startIndex: number, onClose: () => void }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const goToPrevious = useCallback(() => setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1)), [images.length]);
    const goToNext = useCallback(() => setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1)), [images.length]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') goToPrevious();
            if (event.key === 'ArrowRight') goToNext();
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToPrevious, goToNext, onClose]);

    if (!images || images.length === 0) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <AnimatePresence mode="wait">
                <motion.img
                    key={currentIndex}
                    src={images[currentIndex].url}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                />
            </AnimatePresence>
            <button className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors" onClick={(e) => { e.stopPropagation(); onClose(); }}><X size={40} /></button>
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors" onClick={(e) => { e.stopPropagation(); goToPrevious(); }}><ChevronLeft size={60} /></button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors" onClick={(e) => { e.stopPropagation(); goToNext(); }}><ChevronRight size={60} /></button>
            {images[currentIndex].author && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">Autor: {images[currentIndex].author}</div>}
        </motion.div>
    );
};


// --- ★ CHANGE: Completely new, simplified NewsCard component ---
const NewsCard = ({ item, onCardClick }: { item: NewsItem; onCardClick: () => void }) => {
    const summary = useMemo(() => {
        const doc = new DOMParser().parseFromString(item.excerpt, 'text/html');
        return doc.body.textContent || "";
    }, [item.excerpt]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex flex-col bg-card/80 dark:bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/20 group cursor-pointer"
            onClick={onCardClick}
        >
            <div className="w-full h-56 bg-slate-800 overflow-hidden">
                <img
                    src={item.thumbnail_url || '/images/placeholder.jpg'} // Provide a fallback image
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                />
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <p className="text-sm text-muted-foreground mb-1">{item.formatted_date}</p>
                <h3 className="text-xl font-bold text-foreground flex-grow">{item.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm line-clamp-3 leading-relaxed">{summary}</p>
            </div>
        </motion.div>
    );
};


const ENABLE_INFINITE = false;

// --- Main Page Component ---
Novosti.layout = (page: React.ReactElement) => <AppLayout children={page} />;

export default function Novosti() {
    const { props: { locale } } = usePage<{ locale: string }>();
    const { t } = useTranslation();
    const [items, setItems] = useState<NewsItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    // ★ CHANGE: State to manage the currently selected item for the modal
    const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);

    // Data fetching and other hooks remain unchanged
    const stableFetchNews = useCallback((pageToFetch: number) => {
        if (pageToFetch === 1) setIsLoading(true);
        else setIsLoadingMore(true);

        fetch(`/api/news?page=${pageToFetch}&locale=${locale}`)
            .then(r => {
                if (!r.ok) throw new Error('Server error');
                return r.json();
            })
            .then((responseData: PaginatedNewsResponse) => {
                setItems(prev => pageToFetch === 1 ? responseData.data : [...prev, ...responseData.data]);
                setCurrentPage(responseData.current_page);
                setTotalPages(responseData.last_page);
                setError(null);
            })
            .catch(() => {
                setError(t('novosti.fetch_error') as string);
                if (pageToFetch === 1) setItems([]);
            })
            .finally(() => {
                setIsLoading(false);
                setIsLoadingMore(false);
            });
    }, [locale]);

    useEffect(() => { stableFetchNews(1); }, [stableFetchNews]);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
            }
        };
        const currentRef = containerRef.current;
        if (currentRef) currentRef.addEventListener('mousemove', handleMouseMove);
        return () => { if (currentRef) currentRef.removeEventListener('mousemove', handleMouseMove); };
    }, []);

    useEffect(() => {
        if (!ENABLE_INFINITE || isLoadingMore || currentPage >= totalPages) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) stableFetchNews(currentPage + 1);
        }, { threshold: 0.1 });
        const currentSentinel = sentinelRef.current;
        if (currentSentinel) observer.observe(currentSentinel);
        return () => { if (currentSentinel) observer.disconnect(); };
    }, [isLoadingMore, currentPage, totalPages, stableFetchNews]);

    const [upcoming, archive] = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingItems: NewsItem[] = [];
        const archiveItems: NewsItem[] = [];
        items.forEach(n => {
            const itemDate = new Date(n.date);
            itemDate.setHours(0, 0, 0, 0);
            if (itemDate >= today) upcomingItems.push(n);
            else archiveItems.push(n);
        });
        return [upcomingItems, archiveItems];
    }, [items]);


    if (isLoading) return <div className="fixed inset-0 flex items-center justify-center bg-background text-xl">{t('common.loading')}</div>;
    if (error) return <div className="fixed inset-0 flex items-center justify-center bg-background text-red-500 p-4 text-center">{error}</div>;

    return (
        <div
            ref={containerRef}
            className="relative bg-background dark:bg-gradient-to-br dark:from-slate-700 dark:via-slate-600 dark:to-slate-800 min-h-screen text-foreground overflow-hidden"
            style={{ '--mouse-x': `${mousePosition.x}px`, '--mouse-y': `${mousePosition.y}px` } as React.CSSProperties}
        >
            {/* ★ CHANGE: Render our new modal, controlled by our new state */}
            <NewsModal open={!!selectedNewsItem} onClose={() => setSelectedNewsItem(null)} item={selectedNewsItem} />

            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
                style={{ background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(165, 180, 252, 0.15), transparent 80%)` }}
                aria-hidden="true"
            />

            <div className="relative z-10">
                <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <header className="text-center mb-16">
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-foreground">{t('novosti.title')}</h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">{t('novosti.intro')}</p>
                    </header>

                    {items.length === 0 && !isLoading && (
                        <div className="p-4 text-center text-xl text-muted-foreground">{t('novosti.no_news_found')}</div>
                    )}

                    {upcoming.length > 0 && (
                        <section className="mb-20">
                            <h2 className="text-3xl font-bold mb-8 text-foreground">{t('novosti.news')}</h2>
                            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                                {/* ★ CHANGE: Pass the click handler to our new NewsCard */}
                                {upcoming.map((n) => <NewsCard key={`upcoming-${n.id}`} item={n} onCardClick={() => setSelectedNewsItem(n)} />)}
                            </div>
                        </section>
                    )}

                    {archive.length > 0 && (
                        <section>
                            <h2 className="text-3xl font-bold mb-8 text-foreground">{t('novosti.archive')}</h2>
                            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                                {/* ★ CHANGE: Pass the click handler to our new NewsCard */}
                                {archive.map((n) => <NewsCard key={`archive-${n.id}`} item={n} onCardClick={() => setSelectedNewsItem(n)} />)}
                            </div>
                        </section>
                    )}

                    {isLoadingMore && <div className="p-4 text-center text-lg mt-8">{t('common.loading_more')}</div>}

                    {!ENABLE_INFINITE && currentPage < totalPages && !isLoadingMore && (
                        <div className="text-center mt-16">
                            <button
                                onClick={() => stableFetchNews(currentPage + 1)}
                                className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-semibold transition-colors duration-200"
                            >
                                {t('novosti.load_more')}
                            </button>
                        </div>
                    )}

                    {ENABLE_INFINITE && currentPage < totalPages && (
                        <div ref={sentinelRef} className="h-10"></div>
                    )}
                </main>

                <footer className="flex flex-col items-center py-12 px-4 mt-16">
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
