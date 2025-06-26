// resources/js/pages/projekti/novosti.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
// ★ NOTE: Assuming your actual project imports will work correctly.
// The mock components below are for environmental context.
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import GalleryCarousel from '@/components/GalleryCarousel';
import Modal from '@/components/Modal';
import useTranslation from '@/hooks/useTranslation';

// --- (MOCK IMPLEMENTATIONS - No changes here) ---

// Interface for the individual image objects from the API
interface NewsImageDetail {
    id: number;
    url: string;
    author: string | null;
    is_thumbnail: boolean;
}

// Interface for each news item from the API
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
    thumbnail_url: string | null;
    images: NewsImageDetail[];
    thumbnail: NewsImageDetail | null;
}

// Interface for the API's paginated response structure
interface PaginatedNewsResponse {
    current_page: number;
    data: NewsItem[];
    first_page_url: string | null;
    from: number | null;
    last_page: number;
    last_page_url: string | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

const ENABLE_INFINITE = false;

export default function Novosti() {
    const { props: { locale } } = usePage<{ locale: string }>();
    const { t } = useTranslation();
    const [loaded, setLoaded] = useState(false);
    const [items, setItems] = useState<NewsItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<NewsItem | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const id = setTimeout(() => setLoaded(true), 80);
        return () => clearTimeout(id);
    }, []);

    // ★★★ FIX: Removed `t` from the dependency array.
    // This stabilizes the function, preventing it from being recreated on every render, which stops the infinite loop.
    // The function will still have access to `t` via closure.
    const fetchNews = useCallback((pageToFetch: number) => {
        if (pageToFetch === 1) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        // ★★★ THIS IS THE ONLY LINE THAT MATTERS ★★★
        // It MUST be enclosed in backticks (`), and use ${...} for variables.
        fetch(`/api/news?page=${pageToFetch}&locale=${locale}`)
            .then((r) => {
                if (!r.ok) {
                    console.error('Server responded with an error:', r);
                    throw new Error('Server error, check console and network tab.');
                }
                return r.json();
            })
            .then((responseData: PaginatedNewsResponse) => {
                if (responseData && responseData.data) {
                    setItems(prevItems => pageToFetch === 1 ? responseData.data : [...prevItems, ...responseData.data]);
                    setCurrentPage(responseData.current_page);
                    setTotalPages(responseData.last_page);
                    setError(null);
                } else {
                    throw new Error(t('novosti.fetch_error_format') || 'Unexpected response format');
                }
            })
            .catch((err) => {
                setError(t('novosti.fetch_error') as string);
                if (pageToFetch === 1) setItems([]);
            })
            .finally(() => {
                setIsLoading(false);
                setIsLoadingMore(false);
            });
    }, [locale]); // The dependency array is correct.

    useEffect(() => {
        // This effect now runs only once on component mount, as intended.
        fetchNews(1);
    }, [fetchNews]);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
            }
        };
        const currentRefVal = containerRef.current;
        if (currentRefVal) {
            currentRefVal.addEventListener('mousemove', handleMouseMove);
        }
        return () => {
            if (currentRefVal) {
                currentRefVal.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, []);

    const [upcoming, archive] = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingItems: NewsItem[] = [];
        const archiveItems: NewsItem[] = [];

        items.forEach((n) => {
            const itemDate = new Date(n.date);
            itemDate.setHours(0,0,0,0);
            if (itemDate >= today) {
                upcomingItems.push(n);
            } else {
                archiveItems.push(n);
            }
        });
        return [upcomingItems, archiveItems];
    }, [items]);

    useEffect(() => {
        if (!ENABLE_INFINITE || isLoadingMore || currentPage >= totalPages) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    fetchNews(currentPage + 1);
                }
            },
            { threshold: 0.1 },
        );
        const currentSentinel = sentinelRef.current;
        if (currentSentinel) observer.observe(currentSentinel);
        return () => {
            if (currentSentinel) observer.disconnect();
        };
    }, [isLoadingMore, currentPage, totalPages, fetchNews]);

    if (isLoading) return <div className="p-4 text-center text-xl">{t('common.loading')}</div>;
    if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;
    if (!loaded) return <div className="p-4 text-center text-xl">{t('common.loading')}</div>;
    if (items.length === 0) return <div className="p-4 text-center text-xl">{t('novosti.no_news_found')}</div>;

    const NewsCard = ({ item }: { item: NewsItem }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => setSelected(item)}
            className="cursor-pointer bg-gray-900/70 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden
                 border border-gray-700/50
                 transform transition duration-300 hover:-translate-y-1 hover:shadow-indigo-500/30"
        >
            <GalleryCarousel
                images={item.images.map(img => img.url)}
                source={item.source || undefined}
                height="h-64"
            />
            <div className="p-5 space-y-1">
                <h2 className="text-2xl font-bold text-gray-100">{item.title}</h2>
                <span className="text-sm text-gray-400">{item.formatted_date}</span>
                <p className="text-gray-300 mt-2 line-clamp-3">{item.excerpt}</p>
            </div>
        </motion.div>
    );

    return (
        <div
            ref={containerRef}
            className={`relative w-full min-h-screen text-white transition-opacity duration-500 overflow-hidden
                  bg-gradient-to-br from-gray-900 via-indigo-950 to-black
                  ${loaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ '--mouse-x': `${mousePosition.x}px`, '--mouse-y': `${mousePosition.y}px` } as React.CSSProperties}
        >
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                style={{ background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.15), transparent 80%)` }}
                aria-hidden="true"
            />
            <div className="relative z-10 max-w-screen-xl mx-auto px-4 py-10">
                <header className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t('novosti.title')}</h1>
                    <p className="text-lg md:text-xl text-gray-300">{t('novosti.intro')}</p>
                </header>

                {upcoming.length > 0 && (
                    <section className="mb-20">
                        <h2 className="text-3xl font-bold mb-6">{t('novosti.news')}</h2>
                        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {upcoming.map((n: NewsItem) => <NewsCard key={`upcoming-${n.id}`} item={n} />)}
                        </div>
                    </section>
                )}

                {archive.length > 0 && (
                    <section className="mb-20">
                        <h2 className="text-3xl font-bold mb-6">{t('novosti.archive')}</h2>
                        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {archive.map((n: NewsItem) => <NewsCard key={`archive-${n.id}`} item={n} />)}
                        </div>
                    </section>
                )}

                {isLoadingMore && <div className="p-4 text-center text-xl">{t('common.loading_more')}</div>}

                {!ENABLE_INFINITE && currentPage < totalPages && !isLoadingMore && (
                    <div className="text-center mt-8">
                        <button
                            onClick={() => fetchNews(currentPage + 1)}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-full font-semibold transition-colors duration-200"
                        >
                            {t('novosti.load_more')}
                        </button>
                    </div>
                )}

                {ENABLE_INFINITE && currentPage < totalPages && (
                    <div ref={sentinelRef} className="h-10"></div>
                )}

                <div className="mt-12 text-center">
                    <Link href="/">
                        <motion.div
                            className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 inline-block"
                        >
                            <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" onError={(e) => { e.currentTarget.src = 'https://placehold.co/192x192/000000/FFFFFF?text=Logo' }} />
                        </motion.div>
                    </Link>
                </div>
            </div>

            {selected && (
                <Modal isOpen onClose={() => setSelected(null)}>
                    <div className="flex-1 flex flex-col bg-white text-black max-h-[90vh] overflow-hidden">
                        <header className="p-4 border-b border-gray-200 shrink-0">
                            <h2 className="text-2xl font-bold">{selected.title}</h2>
                            <p className="text-sm text-gray-600">{selected.formatted_date}</p>
                        </header>

                        <div className="flex-1 overflow-y-auto">
                            <GalleryCarousel
                                images={selected.images.map(img => img.url)}
                                source={selected.source || undefined}
                                height="h-96"
                            />
                            <div className="p-4">
                                <p dangerouslySetInnerHTML={{ __html: selected.excerpt }}></p>
                            </div>
                        </div>

                        <footer className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center shrink-0">
                            <Link href="/" onClick={() => setSelected(null)}>
                                <motion.div
                                    className="relative w-16 h-16"
                                >
                                    <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" onError={(e) => { e.currentTarget.src = 'https://placehold.co/64x64/000000/FFFFFF?text=Logo' }}/>
                                </motion.div>
                            </Link>
                        </footer>
                    </div>
                </Modal>
            )}
        </div>
    );
}
