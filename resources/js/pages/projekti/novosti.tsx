import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import useTranslation from '@/hooks/useTranslation';
import AppLayout from '@/layouts/app-layout';
import NewsModal from '@/components/NewsModal';
import { Input } from '@/components/ui/input';

// --- Type Definitions (Unchanged) ---
export interface NewsImageDetail {
    id: number;
    url: string;
    author: string | null;
    is_thumbnail: boolean;
}
interface SourceLink {
    url: string;
    text: string | null;
}
export interface NewsItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    date: string;
    formatted_date: string;
    type: string;
    category: string | null;
    source: SourceLink | null;
    is_active: boolean;
    images: NewsImageDetail[];
    thumbnail_url: string | null;
}
interface PaginatedNewsResponse {
    current_page: number;
    data: NewsItem[];
    last_page: number;
}

// --- NewsCard Component (Unchanged) ---
const NewsCard = ({ item, onCardClick }: { item: NewsItem; onCardClick: () => void }) => {
    const summary = useMemo(() => {
        if (typeof window === 'undefined') return item.excerpt.substring(0, 150);
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
                    src={item.thumbnail_url || '/images/placeholder.jpg'}
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
    const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(''); // ★ NEW: State for the debounced search query

    // ★ MODIFIED: The fetch function now accepts a search query
    const stableFetchNews = useCallback((pageToFetch: number, query: string = '') => {
        if (pageToFetch === 1) setIsLoading(true); else setIsLoadingMore(true);

        // ★ MODIFIED: The URL now includes the search parameter
        const searchParam = query ? `&search=${encodeURIComponent(query)}` : '';
        fetch(`/api/news?page=${pageToFetch}&locale=${locale}${searchParam}`)
            .then(r => { if (!r.ok) throw new Error('Server error'); return r.json(); })
            .then((responseData: PaginatedNewsResponse) => {
                setItems(prev => pageToFetch === 1 ? responseData.data : [...prev, ...responseData.data]);
                setCurrentPage(responseData.current_page);
                setTotalPages(responseData.last_page);
            })
            .catch((e) => console.error("Failed to fetch news:", e))
            .finally(() => { setIsLoading(false); setIsLoadingMore(false); });
    }, [locale]);

    // ★ NEW: Debounce the search input to avoid excessive API calls
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500); // Wait for 500ms after the user stops typing

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    // ★ MODIFIED: This effect now fetches based on the debounced search query
    useEffect(() => {
        // The condition `!isLoading` prevents a double-fetch on initial load
        if (!isLoading) {
            stableFetchNews(1, debouncedSearchQuery);
        }
    }, [debouncedSearchQuery]);

    // ★ MODIFIED: Initial data fetch
    useEffect(() => {
        stableFetchNews(1);
    }, []);


    // ★ MODIFIED: This hook now only separates and groups items. The filtering is done on the server.
    const { upcoming, groupedArchive, sortedGroupKeys } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingItems: NewsItem[] = [];
        const archiveItems: NewsItem[] = [];

        // The 'items' are now pre-filtered by the server if a search is active.
        // We just need to separate them into upcoming vs. archive.
        for (const item of items) {
            const itemDate = new Date(item.date);
            if (itemDate >= today && !debouncedSearchQuery) { // Only show upcoming if not searching
                upcomingItems.push(item);
            } else {
                archiveItems.push(item);
            }
        }

        // --- CLIENT-SIDE FILTERING HAS BEEN REMOVED FROM HERE ---

        const grouped = archiveItems.reduce((acc, item) => {
            const date = new Date(item.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        }, {} as Record<string, NewsItem[]>);

        const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

        return {
            upcoming: upcomingItems,
            groupedArchive: grouped,
            sortedGroupKeys: sortedKeys
        };
    }, [items, debouncedSearchQuery]); // ★ MODIFIED: Dependency array

    const monthYearFormatter = useMemo(() => {
        return new Intl.DateTimeFormat(locale === 'hr' ? 'hr-HR' : 'en-US', {
            year: 'numeric',
            month: 'long',
        });
    }, [locale]);

    if (isLoading && items.length === 0) return <div className="fixed inset-0 flex items-center justify-center bg-background text-xl">{t('common.loading')}</div>;

    return (
        <div className="relative bg-background dark:bg-gradient-to-br dark:from-slate-700 dark:via-slate-600 dark:to-slate-800 min-h-screen text-foreground">
            <NewsModal open={!!selectedNewsItem} onClose={() => setSelectedNewsItem(null)} item={selectedNewsItem} />

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
                            {upcoming.map((n) => <NewsCard key={`upcoming-${n.id}`} item={n} onCardClick={() => setSelectedNewsItem(n)} />)}
                        </div>
                    </section>
                )}

                {(Object.keys(groupedArchive).length > 0 || searchQuery) && (
                    <section>
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                            <h2 className="text-3xl font-bold text-foreground">{t('novosti.archive')}</h2>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder={t('novosti.search_archive') || "Pretraži arhivu..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                        </div>

                        {sortedGroupKeys.length > 0 ? (
                            sortedGroupKeys.map(groupKey => {
                                const itemsInGroup = groupedArchive[groupKey];
                                const dateForFormatter = new Date(groupKey + '-02');
                                return (
                                    <div key={groupKey} className="mb-16">
                                        <h3 className="text-2xl font-semibold mb-6 capitalize text-foreground/80 border-b border-border pb-3">
                                            {monthYearFormatter.format(dateForFormatter)}
                                        </h3>
                                        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 pt-4">
                                            {itemsInGroup.map(n => <NewsCard key={`archive-${n.id}`} item={n} onCardClick={() => setSelectedNewsItem(n)} />)}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-muted-foreground text-center py-8">{t('novosti.no_results') || "Nema rezultata za vašu pretragu."}</p>
                        )}
                    </section>
                )}

                {/* ★ MODIFIED: "Load More" button now includes the search query */}
                {currentPage < totalPages && !isLoadingMore && (
                    <div className="text-center mt-16">
                        <button
                            onClick={() => stableFetchNews(currentPage + 1, debouncedSearchQuery)}
                            className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-semibold transition-colors duration-200"
                        >
                            {t('novosti.load_more')}
                        </button>
                    </div>
                )}
                {isLoadingMore && <div className="p-4 text-center text-lg mt-8">{t('common.loading_more')}</div>}
            </main>

            <footer className="flex flex-col items-center py-12 px-4 mt-16">
                <Link href="/"><motion.div whileHover={{ scale: 1.1, rotate: 3 }} transition={{ type: 'spring', stiffness: 200 }} className="relative w-32 h-32 sm:w-40 sm:h-40"><img src={locale === 'en' ? '/logo_eng_2.png' : '/logo.png'} className="object-contain w-full h-full" /></motion.div></Link>
            </footer>
        </div>
    );
}
