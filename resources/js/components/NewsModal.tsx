// resources/js/components/NewsModal.tsx

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import ImageLightbox from '@/components/ImageLightbox'; // ★★★ FIX: Import from the new component file ★★★

// --- Type Definitions ---
interface NewsImageDetail {
    id: number;
    url: string;
    author: string | null;
}
interface NewsItem {
    id: number;
    title: string;
    excerpt: string;
    formatted_date: string;
    source: string | null; // Added source
    images: NewsImageDetail[];
    thumbnail_url: string | null;
}
interface Props {
    open: boolean;
    onClose: () => void;
    item: NewsItem | null;
}

// --- Main Modal Component ---
const NewsModal: React.FC<Props> = ({ open, onClose, item }) => {
    const [isLightboxOpen, setLightboxOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const openLightbox = useCallback((index: number) => {
        setSelectedImageIndex(index);
        setLightboxOpen(true);
    }, []);

    const handleClose = () => {
        if (isLightboxOpen) return;
        onClose();
    };

    if (!item) return null;

    return (
        <AnimatePresence>
            {open && (
                <>
                    <AnimatePresence>
                        {isLightboxOpen && <ImageLightbox images={item.images} startIndex={selectedImageIndex} onClose={() => setLightboxOpen(false)} />}
                    </AnimatePresence>

                    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" aria-modal="true">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -50, opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                            className="relative z-50 flex flex-col w-full max-w-4xl h-[90vh] bg-card/80 dark:bg-card/60 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-20 p-2 rounded-full text-foreground/70 hover:text-foreground hover:bg-white/10 transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex-1 overflow-y-auto">
                                {item.thumbnail_url && (
                                    <div className="relative w-full h-64 md:h-80 bg-slate-800">
                                        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                                    </div>
                                )}

                                <div className="p-6 md:p-10 lg:p-12">
                                    <div className="relative -mt-16 md:-mt-20">
                                        <h2 className="text-3xl md:text-4xl font-extrabold text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>
                                            {item.title}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-3 text-sm text-white/80">
                                            <Calendar size={16} />
                                            <span>{item.formatted_date}</span>
                                        </div>
                                    </div>

                                    <div
                                        className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed mt-8"
                                        dangerouslySetInnerHTML={{ __html: item.excerpt }}
                                    />

                                    {/* ★★★ FIX: Added the source link display ★★★ */}
                                    {item.source && (
                                        <div className="mt-8">
                                            <a
                                                href={item.source}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                                            >
                                                <LinkIcon className="h-4 w-4" />
                                                <span>Izvor</span>
                                            </a>
                                        </div>
                                    )}

                                    {item.images && item.images.length > 0 && (
                                        <div className="mt-12 border-t border-border pt-8">
                                            <div className="flex items-center gap-3 text-primary mb-6">
                                                <ImageIcon size={20} />
                                                <h4 className="text-2xl font-bold uppercase tracking-wider">Galerija</h4>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {item.images.map((image, index) => (
                                                    <button
                                                        key={image.id}
                                                        onClick={() => openLightbox(index)}
                                                        className="aspect-square w-full cursor-pointer group overflow-hidden rounded-lg"
                                                    >
                                                        <img
                                                            src={image.url}
                                                            alt={image.author || item.title}
                                                            className="w-full h-full object-cover rounded-lg shadow-md transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NewsModal;
