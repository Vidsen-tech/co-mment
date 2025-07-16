// resources/js/pages/projekti/novosti.tsx

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import useTranslation from '@/hooks/useTranslation';
import AppLayout from '@/layouts/app-layout';
import NewsModal from '@/components/NewsModal';

// --- Type Definitions ---
// These types are now also used by NewsModal, so exporting is good practice.
export interface NewsImageDetail {
    id: number;
    url: string;
    author: string | null;
    is_thumbnail: boolean;
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

// --- NewsCard Component (Solves the expanding box issue) ---
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

    const stableFetchNews = useCallback((pageToFetch: number) => {
        if (pageToFetch === 1) setIsLoading(true); else setIsLoadingMore(true);
        fetch(`/api/news?page=${pageToFetch}&locale=${locale}`)
            .then(r => { if (!r.ok) throw new Error('Server error'); return r.json(); })
            .then((responseData: PaginatedNewsResponse) => {
                setItems(prev => pageToFetch === 1 ? responseData.data : [...prev, ...responseData.data]);
                setCurrentPage(responseData.current_page);
                setTotalPages(responseData.last_page);
            })
            .catch((e) => console.error("Failed to fetch news:", e))
            .finally(() => { setIsLoading(false); setIsLoadingMore(false); });
    }, [locale]);

    useEffect(() => { stableFetchNews(1); }, [stableFetchNews]);

    const [upcoming, archive] = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return items.reduce<[NewsItem[], NewsItem[]]>(([up, ar], item) => {
            const itemDate = new Date(item.date);
            if (itemDate >= today) up.push(item); else ar.push(item);
            return [up, ar];
        }, [[], []]);
    }, [items]);

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

                {archive.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold mb-8 text-foreground">{t('novosti.archive')}</h2>
                        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {archive.map((n) => <NewsCard key={`archive-${n.id}`} item={n} onCardClick={() => setSelectedNewsItem(n)} />)}
                        </div>
                    </section>
                )}

                {currentPage < totalPages && !isLoadingMore && (
                    <div className="text-center mt-16">
                        <button
                            onClick={() => stableFetchNews(currentPage + 1)}
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
