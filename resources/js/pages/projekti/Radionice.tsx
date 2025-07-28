import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Calendar, MapPin, Link as LinkIcon, Mail, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';
import ContactModal from '@/components/ContactModal';
import AppLayout from '@/layouts/app-layout';


// --- Data ---
const workshopData = {
    hr: {
        title: 'Radionica Kolažiranje',
        galleryImages: [
            { id: 1, url: '/images/collage1.jpg', author: 'Autor 1' },
            { id: 2, url: '/images/collage2.jpg', author: 'Autor 2' },
            { id: 3, url: '/images/collage3.jpeg', author: 'Autor 3' },
            { id: 4, url: '/images/collage4.jpg', author: 'Autor 4' },
        ],
        description: `Ova radionica temelji se na principu “kolažiranja,” koji je poslužio kao polazna točka za naš autorski rad “…, a još su manji izlazi.” Inspirirani likovnom tehnikom kolaža, gradimo plesni vokabular u kojem tijelo i prostor tretiramo kao platno. Koristeći principe kolažiranja, stvaramo izvedbu koja istražuje granice između pokreta, prostora i ritma.\n\nKroz improvizacijske zadatke istražujemo kvalitete kretanja i tjelesne alate koji potiču individualnu kreativnost na temu kolažiranja. Naglasak je na osvještavanju tijela u osobnom i zajedničkom prostoru, dok radom u paru i grupama uvodimo osnovne mehanizme kolažiranja.\n\nSpecifičnost ovog pristupa temelji se na fragmentiranom i preciznom pokretu, koji potiče poseban ritam tijela. Radionicu zaokružujemo samostalnim kreativnim zadacima, omogućujući sudionicima da preispitaju i primjene usvojena znanja i alate na vlastiti način.\n\nPozivamo vas da kroz ovu radionicu istražite granice vlastitog pokreta i otvorite prostor za novu plesnu kreativnost.`,
        workshopDescriptionTitle: 'Opis radionice',
        pastWorkshopsTitle: 'Održane radionice',
        moreInfoButton: 'Više informacija',
        bookWorkshopButton: 'Pošalji upit za radionicu',
        modalContent: { modalTitle: 'Upit za radionicu', nameLabel: 'Ime i prezime', namePlaceholder: '', contactLabel: 'Email ili telefon', contactPlaceholder: '', messageLabel: 'Vaša poruka', messagePlaceholder: 'Ovdje napišite vašu poruku...', sendButton: 'Pošalji upit', sendingButton: 'Slanje...', successMessage: 'Upit uspješno poslan!', closeButton: 'Zatvori' },
        sessions: [
            { date: '29.10.2024.', location: 'KC Magacin, Beograd', event: 'Kondenz festival, NDA Hrvatska, Modularna škola', link: 'https://dancestation.org/kondenz-2024-unsafety-signs/#KOLAZIRANJE' },
            { date: '2. i 3.11.2024.', location: 'Beton Kino Doma Mladih, Split', event: 'Plesna udruga Tiramola, NDA Hrvatska, Modularna škola', link: 'https://fb.me/e/7yPGiL6d7' },
            { date: '19.11.2024.', location: 'TALA PLE(j)S, Zagreb', event: 'Koreografska konvencija, Nomadska plesna akademija Hrvatska, Modularna škola', link: 'https://antisezona.space/en/choreographic-convention-programme/' },
        ]
    },
    en: {
        title: 'Collaging Workshop',
        galleryImages: [
            { id: 1, url: '/images/collage1.jpg', author: 'Author 1' },
            { id: 2, url: '/images/collage2.jpg', author: 'Author 2' },
            { id: 3, url: '/images/collage3.jpeg', author: 'Author 3' },
            { id: 4, url: '/images/collage4.jpg', author: 'Author 4' },
        ],
        description: `This workshop is based on the principle of "collaging," which served as the starting point for our original work, “…, and the exits are even smaller.” Inspired by the visual art technique of collage, we build a dance vocabulary where the body and the space are treated as a canvas. Using the principles of collaging, we create a performance that explores the boundaries between movement, space, and rhythm.\n\nThrough improvisational tasks, we explore movement qualities and physical tools that provoke individual creativity on the theme of collaging. The emphasis is on building body awareness within personal and collective spaces. Working in pairs and groups, participants are introduced to fundamental mechanisms of collaging. This approach is characterized by fragmented and precise movement, revealing the unique rhythm produced by the body. The workshop concludes with individual creative tasks that allow participants to reflect on and apply the knowledge and tools they have acquired in their own way.\n\nWe invite you to this workshop to explore the boundaries of your movement and open space for new dance creativity.`,
        workshopDescriptionTitle: 'Workshop Description',
        pastWorkshopsTitle: 'Past Workshops',
        moreInfoButton: 'More Information',
        bookWorkshopButton: 'Book Us For a Workshop',
        modalContent: { modalTitle: 'Workshop Inquiry', nameLabel: 'Full Name', namePlaceholder: '', contactLabel: 'Email or Phone', contactPlaceholder: '', messageLabel: 'Your Message', messagePlaceholder: 'Write your message here...', sendButton: 'Send Inquiry', sendingButton: 'Sending...', successMessage: 'Inquiry Sent Successfully!', closeButton: 'Close' },
        sessions: [
            { date: '29th of October 2024', location: 'KC Magacin, Belgrade', event: 'Kondenz festival, NDA Croatia, Modular school', link: 'https://dancestation.org/kondenz-2024-unsafety-signs/#KOLAZIRANJE' },
            { date: '2nd and 3rd of November 2024', location: 'Beton Kino Doma Mladih, Split', event: 'Plesna udruga Tiramola, NDA Croatia, Modular school', link: 'https://fb.me/e/7yPGiL6d7' },
            { date: '19th of November 2024', location: 'TALA PLE(j)S, Zagreb', event: 'Choreographic convention, NDA Croatia, Modular school', link: 'https://antisezona.space/en/choreographic-convention-programme/' },
        ]
    }
};

interface Image { id: number; url: string; author: string; }

const ImageLightbox = ({ images, startIndex, onClose }: { images: Image[], startIndex: number, onClose: () => void }) => {
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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <AnimatePresence mode="wait"><motion.img key={currentIndex} src={images[currentIndex].url} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} /></AnimatePresence>
            <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={(e) => { e.stopPropagation(); onClose(); }}><X size={40} /></button>
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300" onClick={(e) => { e.stopPropagation(); goToPrevious(); }}><ChevronLeft size={60} /></button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300" onClick={(e) => { e.stopPropagation(); goToNext(); }}><ChevronRight size={60} /></button>
            {images[currentIndex].author && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">Autor: {images[currentIndex].author}</div>}
        </motion.div>
    );
};

// --- Main Page Component ---
Radionice.layout = (page: React.ReactElement) => <AppLayout children={page} />;

export default function Radionice() {
    const { props: { locale } } = usePage<{ locale: 'hr' | 'en' }>();
    const content = workshopData[locale] || workshopData.hr;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLightboxOpen, setLightboxOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // ★★★ FIX 1: Define functions to open and close the modal and lightbox ★★★
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const openLightbox = (index: number) => {
        setSelectedImageIndex(index);
        setLightboxOpen(true);
    };
    const closeLightbox = () => setLightboxOpen(false);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
            }
        };
        const currentRef = containerRef.current;
        if (currentRef) { currentRef.addEventListener('mousemove', handleMouseMove); }
        return () => { if (currentRef) { currentRef.removeEventListener('mousemove', handleMouseMove); } };
    }, []);

    return (
        <>
            <AnimatePresence>{isLightboxOpen && <ImageLightbox images={content.galleryImages} startIndex={selectedImageIndex} onClose={closeLightbox} />}</AnimatePresence>

            {/* ★★★ FIX 2: Call the newly defined functions and use the correct prop ★★★ */}
            <ContactModal
                show={isModalOpen}
                onClose={closeModal}
                localeContent={content.modalContent}
                endpoint="workshop.inquiry.send"
            />

            <div
                ref={containerRef}
                className="relative bg-background dark:bg-gradient-to-br dark:from-slate-700 dark:via-slate-600 dark:to-slate-800 min-h-screen text-foreground overflow-hidden"
                style={{ '--mouse-x': `${mousePosition.x}px`, '--mouse-y': `${mousePosition.y}px` } as React.CSSProperties}
            >
                <div
                    className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
                    style={{ background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(165, 180, 252, 0.15), transparent 80%)` }}
                    aria-hidden="true"
                />

                <div className="relative z-10">
                    <header className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center text-center p-6 text-white">
                        <div className="absolute inset-0 bg-black">
                            <img src="/images/collage.JPEG" alt="Radionica Kolažiranje" className="w-full h-full object-cover opacity-40" />
                        </div>
                        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }} className="relative z-10 text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
                            {content.title}
                        </motion.h1>
                    </header>

                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="bg-card/80 dark:bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/20"
                        >
                            <div className="p-8 md:p-12 lg:p-16">
                                <div className="mb-12">
                                    <h2 className="text-3xl font-bold text-foreground mb-6">Galerija</h2>
                                    <div className="flex overflow-x-auto gap-4 pb-4 -mb-4 -mx-8 px-8">
                                        {content.galleryImages.map((image, index) => (
                                            <button key={image.id} onClick={() => openLightbox(index)} className="flex-shrink-0 w-4/5 sm:w-2/3 md:w-1/2 lg:w-1/3 snap-start cursor-pointer group overflow-hidden rounded-lg">
                                                <img src={image.url} alt={image.author} className="w-full h-auto object-cover rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-3 text-primary mb-4">
                                        <BookOpen size={20} />
                                        <h2 className="text-2xl font-bold uppercase tracking-wider">{content.workshopDescriptionTitle}</h2>
                                    </div>
                                    <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">{content.description}</p>
                                </div>

                                <Collapsible.Root className="mt-12 border-t border-border pt-8">
                                    <Collapsible.Trigger className="w-full flex justify-between items-center text-left group">
                                        <div className="flex items-center gap-3 text-primary">
                                            <Calendar size={20} />
                                            <h2 className="text-2xl font-bold uppercase tracking-wider group-hover:text-primary/80 transition-colors">{content.pastWorkshopsTitle}</h2>
                                        </div>
                                        <motion.div>
                                            <ChevronDown className="text-muted-foreground group-hover:text-foreground transition-colors" size={28} />
                                        </motion.div>
                                    </Collapsible.Trigger>
                                    <Collapsible.Content asChild>
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: 'easeInOut' }} className="overflow-hidden">
                                            <div className="pt-6 space-y-6">
                                                {content.sessions.map((session, index) => (
                                                    <div key={index} className="bg-muted/50 p-6 rounded-lg border border-border flex flex-col md:flex-row gap-4 justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-xl text-foreground">{session.date}</p>
                                                            <p className="text-muted-foreground flex items-center gap-2 mt-1"><MapPin size={16} />{session.location}</p>
                                                            <p className="text-sm text-muted-foreground/80 mt-2">{session.event}</p>
                                                        </div>
                                                        <a href={session.link} target="_blank" rel="noopener noreferrer" className="mt-4 md:mt-0 flex-shrink-0 inline-flex items-center gap-2 bg-primary px-4 py-2 rounded-md text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                                                            <LinkIcon size={16} /><span>{content.moreInfoButton}</span>
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </Collapsible.Content>
                                </Collapsible.Root>

                                <div className="mt-16 text-center">
                                    {/* ★★★ FIX 3: Use the openModal function here ★★★ */}
                                    <button onClick={openModal} className="inline-flex items-center gap-3 bg-primary px-8 py-3 rounded-lg text-lg font-bold text-primary-foreground hover:bg-primary/90 transition-all transform hover:scale-105">
                                        <Mail size={20} />{content.bookWorkshopButton}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </main>

                    <footer className="flex flex-col items-center py-12 px-4">
                        <Link href="/"><motion.div whileHover={{ scale: 1.1, rotate: 3 }} transition={{ type: 'spring', stiffness: 200 }} className="relative w-32 h-32 sm:w-40 sm:h-40"><img src={locale === 'en' ? '/logo_eng_2.png' : '/logo.png'} className="object-contain w-full h-full" onError={(e) => { e.currentTarget.src = 'https://placehold.co/160x160/000000/FFFFFF?text=Logo' }} /></motion.div></Link>
                    </footer>
                </div>
            </div>
        </>
    );
}
