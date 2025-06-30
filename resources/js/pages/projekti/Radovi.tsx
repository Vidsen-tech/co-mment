import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown, Link as LinkIcon, X, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import ContactModal from '@/components/ContactModal';

// --- ★ FIX: All multilingual text is now in ONE simplified object to prevent initialization errors. ★ ---
const contentData = {
    hr: {
        moreInfo: 'Više informacija',
        galleryTitle: 'Galerija',
        authorPrefix: 'Autor',
        creditsTitle: 'Autorski tim',
        performancesTitle: 'Izvedbe',
        noPerformances: 'Nema zabilježenih nadolazećih izvedbi.',
        dateHeader: 'Datum',
        locationHeader: 'Lokacija',
        linkHeader: 'Poveznica',
        moreLink: 'Više',
        modal: {
            modalTitle: 'Zatraži Scenski Rider',
            buttonText: 'Zatraži scenski Rider',
            nameLabel: 'Ime i prezime',
            namePlaceholder: 'Npr. Ana Anić',
            contactLabel: 'Email ili telefon',
            contactPlaceholder: 'Npr. ana.anic@email.com',
            messageLabel: 'Vaša poruka',
            messagePlaceholder: 'Ovdje napišite vašu poruku...',
            sendButton: 'Pošalji upit',
            sendingButton: 'Slanje...',
            successMessage: 'Upit uspješno poslan!',
            closeButton: 'Zatvori'
        }
    },
    en: {
        moreInfo: 'More Information',
        galleryTitle: 'Gallery',
        authorPrefix: 'Author',
        creditsTitle: 'Authorial Team',
        performancesTitle: 'Performances',
        noPerformances: 'There are no upcoming performances scheduled.',
        dateHeader: 'Date',
        locationHeader: 'Location',
        linkHeader: 'Link',
        moreLink: 'More',
        modal: {
            modalTitle: 'Request a Scene Rider',
            buttonText: 'Request a Scene Rider',
            nameLabel: 'Full Name',
            namePlaceholder: 'E.g., John Doe',
            contactLabel: 'Email or Phone',
            contactPlaceholder: 'E.g., john.doe@email.com',
            messageLabel: 'Your Message',
            messagePlaceholder: 'Write your message here...',
            sendButton: 'Send Inquiry',
            sendingButton: 'Sending...',
            successMessage: 'Inquiry Sent Successfully!',
            closeButton: 'Close'
        }
    }
};

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
interface WorkTranslation {
    title: string;
    description: string;
    credits: Record<string, string>;
}
interface Work {
    id: number;
    slug: string;
    translations: {
        hr: WorkTranslation;
        en?: WorkTranslation;
    };
    thumbnail_url: string | null;
    performances: Performance[];
    images: WorkImage[];
}
interface RadoviPageProps {
    works: Work[];
}

// --- Components ---

const ImageLightbox = ({ images, startIndex, onClose, authorPrefix }: { images: WorkImage[], startIndex: number, onClose: () => void, authorPrefix: string }) => {
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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <AnimatePresence mode="wait">
                <motion.img key={currentIndex} src={images[currentIndex].url} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            </AnimatePresence>
            <button className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors" onClick={(e) => { e.stopPropagation(); onClose(); }}><X size={40} /></button>
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors" onClick={(e) => { e.stopPropagation(); goToPrevious(); }}><ChevronLeft size={60} /></button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors" onClick={(e) => { e.stopPropagation(); goToNext(); }}><ChevronRight size={60} /></button>
            {images[currentIndex].author && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">{authorPrefix}: {images[currentIndex].author}</div>}
        </motion.div>
    );
};

const NestedCollapsible = ({ title, children }: { title: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Collapsible.Root open={isOpen} onOpenChange={setIsOpen} className="border-t border-border mt-8 pt-6">
            <Collapsible.Trigger className="w-full flex justify-between items-center text-left">
                <h4 className="text-xl font-semibold text-foreground">{title}</h4>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown className="text-muted-foreground" size={24} />
                </motion.div>
            </Collapsible.Trigger>
            <Collapsible.Content asChild>
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                >
                    <div className="pt-4">{children}</div>
                </motion.div>
            </Collapsible.Content>
        </Collapsible.Root>
    )
}

const PerformanceTable = ({ performances, content }: { performances: Performance[], content: typeof contentData['hr'] }) => {
    if (!performances || performances.length === 0) {
        return <p className="text-muted-foreground italic">{content.noPerformances}</p>;
    }
    return (
        <div className="border border-border rounded-lg overflow-hidden mt-2">
            <table className="w-full text-left text-foreground">
                <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
                <tr>
                    <th scope="col" className="px-6 py-3">{content.dateHeader}</th>
                    <th scope="col" className="px-6 py-3">{content.locationHeader}</th>
                    <th scope="col" className="px-6 py-3">{content.linkHeader}</th>
                </tr>
                </thead>
                <tbody>
                {performances.map((p) => (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">{p.date}</td>
                        <td className="px-6 py-4">{p.location}</td>
                        <td className="px-6 py-4">{p.news_link ? <Link href={p.news_link} className="text-primary hover:underline flex items-center gap-2"><LinkIcon size={16} /><span>{content.moreLink}</span></Link> : <span className="text-muted-foreground">-</span>}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

const CreditsList = ({ credits }: { credits: Record<string, string> }) => {
    if (!credits || typeof credits !== 'object' || Object.keys(credits).length === 0) return null;
    return (
        <div className="space-y-4">
            {Object.entries(credits).map(([role, name]) => (
                <div key={role} className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-baseline">
                    <dt className="font-semibold text-foreground">{role}:</dt>
                    <dd className="md:col-span-2 text-muted-foreground">{role.toLowerCase() === 'trailer' && (name.startsWith('http') || name.startsWith('www')) ? <a href={name} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{name}</a> : name}</dd>
                </div>
            ))}
        </div>
    );
};

const WorkCard = ({ work, locale }: { work: Work, locale: 'hr' | 'en' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLightboxOpen, setLightboxOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const content = contentData[locale] || contentData.hr;
    const t = work.translations[locale] || work.translations.hr;

    const modalProps = {
        ...content.modal,
        modalTitle: `${content.modal.modalTitle}: ${t.title}`
    };

    const openLightbox = useCallback((index: number) => {
        setSelectedImageIndex(index);
        setLightboxOpen(true);
    }, []);

    const closeLightbox = useCallback(() => setLightboxOpen(false), []);
    const openModal = useCallback(() => setIsModalOpen(true), []);
    const closeModal = useCallback(() => setIsModalOpen(false), []);


    return (
        <>
            <AnimatePresence>{isLightboxOpen && <ImageLightbox images={work.images} startIndex={selectedImageIndex} onClose={closeLightbox} authorPrefix={content.authorPrefix} />}</AnimatePresence>
            <ContactModal show={isModalOpen} onClose={closeModal} localeContent={modalProps} />

            <Collapsible.Root open={isOpen} onOpenChange={setIsOpen} className="border dark:border-indigo-900/50 border-indigo-200/50 bg-card rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-indigo-950/20">
                <div className="group relative w-full h-[60vh] md:h-[85vh] flex items-end p-6 md:p-12 text-white bg-gray-900 overflow-hidden">
                    <div className="absolute inset-0"><img src={work.images[0]?.url || work.thumbnail_url || `https://placehold.co/1200x800/0f172a/9ca3af?text=${work.slug}`} alt={`Thumbnail for ${t.title}`} className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div></div>
                    <div className="relative z-10 w-full">
                        <motion.h2 layout="position" className="text-4xl md:text-6xl lg:text-8xl font-extrabold" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>{t.title}</motion.h2>
                        <Collapsible.Trigger asChild><button className="mt-6 flex items-center gap-3 text-lg font-semibold bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full hover:bg-white/20 transition-all duration-300">{content.moreInfo}<motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown size={24} /></motion.div></button></Collapsible.Trigger>
                    </div>
                </div>
                <Collapsible.Content asChild>
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5, ease: 'easeInOut' }} className="overflow-hidden">
                        <div className="bg-card text-foreground p-6 md:p-12">
                            <div className="max-w-4xl mx-auto">
                                {work.images && work.images.length > 0 && (
                                    <div className="mb-12">
                                        <h4 className="text-xl font-semibold text-foreground mb-4">{content.galleryTitle}</h4>
                                        <div className="flex overflow-x-auto gap-4 pb-4 -mb-4">{work.images.map((image, index) => (<button key={image.id} onClick={() => openLightbox(index)} className="flex-shrink-0 w-4/5 md:w-2/3 lg:w-1/2 snap-start cursor-pointer group/image overflow-hidden rounded-lg"><img src={image.url} alt={image.author || t.title} className="w-full h-auto object-cover rounded-lg shadow-lg transition-transform duration-300 group-hover/image:scale-105" />{image.author && <p className="text-right text-xs text-muted-foreground mt-2">{content.authorPrefix}: {image.author}</p>}</button>))}</div>
                                    </div>
                                )}
                                <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">{t.description}</p>

                                {t.credits && Object.keys(t.credits).length > 0 && (
                                    <NestedCollapsible title={content.creditsTitle}>
                                        <CreditsList credits={t.credits} />
                                    </NestedCollapsible>
                                )}
                                {work.performances && work.performances.length > 0 && (
                                    <NestedCollapsible title={content.performancesTitle}>
                                        <PerformanceTable performances={work.performances} content={content} />
                                    </NestedCollapsible>
                                )}

                                <div className="mt-16 text-center border-t border-border pt-10">
                                    <button onClick={openModal} className="inline-flex items-center gap-3 bg-primary px-8 py-3 rounded-lg text-lg font-bold text-primary-foreground hover:bg-primary/90 transition-all transform hover:scale-105">
                                        <Mail size={20} />{content.modal.buttonText}
                                    </button>
                                </div>
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
    const { props: { locale } } = usePage<{ locale: 'hr' | 'en' }>();
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
        <div
            ref={containerRef}
            className="relative bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:via-indigo-950 dark:to-black min-h-screen text-foreground overflow-hidden"
            style={{ '--mouse-x': `${mousePosition.x}px`, '--mouse-y': `${mousePosition.y}px` } as React.CSSProperties}
        >
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
                style={{ background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.15), transparent 80%)` }}
                aria-hidden="true"
            />

            <main className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-16 sm:py-24 space-y-24">
                {works.map((work) => (
                    <WorkCard key={work.id} work={work} locale={locale} />
                ))}
            </main>

            <footer className="relative z-10 flex flex-col items-center py-12 px-4">
                <Link href="/">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 3 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48"
                    >
                        <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" onError={(e) => { e.currentTarget.src = 'https://placehold.co/192x192/000000/FFFFFF?text=Logo' }} />
                    </motion.div>
                </Link>
            </footer>
        </div>
    );
}
