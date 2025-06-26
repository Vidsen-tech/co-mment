import { useEffect, useState } from 'react';

interface Props {
    images: string[];
    source?: string;
    height?: string;            // tailwind height class
    autoPlay?: boolean;
    autoPlayInterval?: number;
    hideArrows?: boolean;
}

export default function GalleryCarousel({
                                            images,
                                            source,
                                            height = 'h-80',
                                            autoPlay = false,
                                            autoPlayInterval = 3000,
                                            hideArrows = false,
                                        }: Props) {
    const [index, setIndex] = useState(0);
    const total = images.length;

    const next = () => setIndex((i) => (i + 1) % total);
    const prev = () => setIndex((i) => (i - 1 + total) % total);

    useEffect(() => {
        if (!autoPlay) return;
        const id = setInterval(next, autoPlayInterval);
        return () => clearInterval(id);
    }, [autoPlay, autoPlayInterval]);

    return (
        <div className={`relative w-full ${height} bg-gray-200`}>
            <img
                src={images[index]}
                alt={`slide-${index}`}
                className="object-cover w-full h-full"
            />

            {/* credit */}
            <div className="absolute top-2 left-2 bg-gray-800/60 text-xs text-white px-2 py-1 rounded">
                Izvor: {source ?? 'Unknown'}
            </div>

            {!hideArrows && total > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-800/60 text-white p-2 rounded"
                    >
                        &#8592;
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800/60 text-white p-2 rounded"
                    >
                        &#8594;
                    </button>
                </>
            )}
        </div>
    );
}
