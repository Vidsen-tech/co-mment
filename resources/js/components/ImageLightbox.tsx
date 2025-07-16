// resources/js/components/ImageLightbox.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// Define the types this component needs
interface ImageDetail {
    id: number;
    url: string;
    author: string | null;
}

interface Props {
    images: ImageDetail[];
    startIndex: number;
    onClose: () => void;
}

const ImageLightbox: React.FC<Props> = ({ images, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    const goToPrevious = useCallback(() => {
        setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length]);

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

    const currentImage = images[currentIndex];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <AnimatePresence mode="wait">
                <motion.img
                    key={currentIndex}
                    src={currentImage.url}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    alt={currentImage.author || `Image ${currentIndex + 1}`}
                />
            </AnimatePresence>
            <button
                aria-label="Close"
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
                <X size={40} />
            </button>
            <button
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            >
                <ChevronLeft size={60} />
            </button>
            <button
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
            >
                <ChevronRight size={60} />
            </button>
            {currentImage.author && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-lg">
                    Autor: {currentImage.author}
                </div>
            )}
        </motion.div>
    );
};

export default ImageLightbox;
