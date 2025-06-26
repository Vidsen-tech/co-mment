// ★★★ 1. IMPORTS - ADDED Mail ICON & NEW MODAL COMPONENT ★★★
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { BookOpen, Calendar, MapPin, Link as LinkIcon, Mail } from 'lucide-react';
import ContactModal from '@/Components/ContactModal'; // Import the new modal

// --- HARDCODED DATA - ADDED NEW TRANSLATIONS FOR BUTTON & MODAL ---
const workshopData = {
    hr: {
        title: 'Radionica Kolažiranje',
        description: `Ova radionica temelji se na principu “kolažiranja,” koji je poslužio kao polazna točka za naš autorski rad “…, a još su manji izlazi.” Inspirirani likovnom tehnikom kolaža, gradimo plesni vokabular u kojem tijelo i prostor tretiramo kao platno. Koristeći principe kolažiranja, stvaramo izvedbu koja istražuje granice između pokreta, prostora i ritma.\n\nKroz improvizacijske zadatke istražujemo kvalitete kretanja i tjelesne alate koji potiču individualnu kreativnost na temu kolažiranja. Naglasak je na osvještavanju tijela u osobnom i zajedničkom prostoru, dok radom u paru i grupama uvodimo osnovne mehanizme kolažiranja.\n\nSpecifičnost ovog pristupa temelji se na fragmentiranom i preciznom pokretu, koji potiče poseban ritam tijela. Radionicu zaokružujemo samostalnim kreativnim zadacima, omogućujući sudionicima da preispitaju i primjene usvojena znanja i alate na vlastiti način.\n\nPozivamo vas da kroz ovu radionicu istražite granice vlastitog pokreta i otvorite prostor za novu plesnu kreativnost.`,
        workshopDescriptionTitle: 'Opis radionice',
        pastWorkshopsTitle: 'Održane radionice',
        moreInfoButton: 'Više informacija',
        bookWorkshopButton: 'Pošalji upit za radionicu',
        modalContent: {
            modalTitle: 'Upit za Radionicu',
            nameLabel: 'Ime i prezime',
            namePlaceholder: 'Npr. Ana Anić',
            contactLabel: 'Email ili telefon',
            contactPlaceholder: 'Npr. ana.anic@email.com',
            messageLabel: 'Vaša poruka',
            messagePlaceholder: 'Ovdje napišite vašu poruku...',
            sendButton: 'Pošalji upit',
            sendingButton: 'Slanje...',
            successMessage: 'Upit uspješno poslan!',
            closeButton: 'Zatvori',
        },
        sessions: [
            { date: '29.10.2024.', location: 'KC Magacin, Beograd', event: 'Kondenz festival, NDA Hrvatska, Modularna škola', link: 'https://dancestation.org/kondenz-2024-unsafety-signs/#KOLAZIRANJE' },
            { date: '2. i 3.11.2024.', location: 'Beton Kino Doma Mladih, Split', event: 'Plesna udruga Tiramola, NDA Hrvatska, Modularna škola', link: 'https://fb.me/e/7yPGiL6d7' },
            { date: '19.11.2024.', location: 'TALA PLE(j)S, Zagreb', event: 'Koreografska konvencija, Nomadska plesna akademija Hrvatska, Modularna škola', link: 'https://antisezona.space/en/choreographic-convention-programme/' },
        ]
    },
    en: {
        title: 'Collaging Workshop',
        description: `This workshop is based on the principle of "collaging," which served as the starting point for our original work, “…, and the exits are even smaller.” Inspired by the visual art technique of collage, we build a dance vocabulary where the body and the space are treated as a canvas. Using the principles of collaging, we create a performance that explores the boundaries between movement, space, and rhythm.\n\nThrough improvisational tasks, we explore movement qualities and physical tools that provoke individual creativity on the theme of collaging. The emphasis is on building body awareness within personal and collective spaces. Working in pairs and groups, participants are introduced to fundamental mechanisms of collaging. This approach is characterized by fragmented and precise movement, revealing the unique rhythm produced by the body. The workshop concludes with individual creative tasks that allow participants to reflect on and apply the knowledge and tools they have acquired in their own way.\n\nWe invite you to this workshop to explore the boundaries of your movement and open space for new dance creativity.`,
        workshopDescriptionTitle: 'Workshop Description',
        pastWorkshopsTitle: 'Past Workshops',
        moreInfoButton: 'More Information',
        bookWorkshopButton: 'Book Us For a Workshop',
        modalContent: {
            modalTitle: 'Workshop Inquiry',
            nameLabel: 'Full Name',
            namePlaceholder: 'E.g., John Doe',
            contactLabel: 'Email or Phone',
            contactPlaceholder: 'E.g., john.doe@email.com',
            messageLabel: 'Your Message',
            messagePlaceholder: 'Write your message here...',
            sendButton: 'Send Inquiry',
            sendingButton: 'Sending...',
            successMessage: 'Inquiry Sent Successfully!',
            closeButton: 'Close',
        },
        sessions: [
            { date: '29th of October 2024', location: 'KC Magacin, Belgrade', event: 'Kondenz festival, NDA Croatia, Modular school', link: 'https://dancestation.org/kondenz-2024-unsafety-signs/#KOLAZIRANJE' },
            { date: '2nd and 3rd of November 2024', location: 'Beton Kino Doma Mladih, Split', event: 'Plesna udruga Tiramola, NDA Croatia, Modular school', link: 'https://fb.me/e/7yPGiL6d7' },
            { date: '19th of November 2024', location: 'TALA PLE(j)S, Zagreb', event: 'Choreographic convention, NDA Croatia, Modular school', link: 'https://antisezona.space/en/choreographic-convention-programme/' },
        ]
    }
};

// --- Main Page Component ---
export default function Radionice() {
    const { props: { locale } } = usePage<{ locale: 'hr' | 'en' }>();
    const content = workshopData[locale] || workshopData.hr;

    // ★★★ 2. ADDED STATE FOR MODAL VISIBILITY ★★★
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            className="relative bg-gradient-to-br from-gray-900 via-indigo-950 to-black text-white min-h-screen overflow-hidden"
            style={{ '--mouse-x': `${mousePosition.x}px`, '--mouse-y': `${mousePosition.y}px` } as React.CSSProperties}
        >
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
                style={{ background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.15), transparent 80%)` }}
                aria-hidden="true"
            />

            <div className="relative z-10">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

                    <header className="relative h-[50vh] flex items-center justify-center text-center p-6 overflow-hidden bg-transparent">
                        <div className="relative z-10">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="text-4xl md:text-6xl font-extrabold tracking-tight"
                            >
                                {content.title}
                            </motion.h1>
                        </div>
                    </header>

                    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                        >
                            <div className="flex items-center gap-3 text-indigo-400 mb-4">
                                <BookOpen size={20} />
                                <h2 className="text-2xl font-bold uppercase tracking-wider">{content.workshopDescriptionTitle}</h2>
                            </div>
                            <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
                                {content.description}
                            </p>

                            <div className="mt-16">
                                <div className="flex items-center gap-3 text-indigo-400 mb-6">
                                    <Calendar size={20} />
                                    <h2 className="text-2xl font-bold uppercase tracking-wider">{content.pastWorkshopsTitle}</h2>
                                </div>
                                <div className="space-y-6">
                                    {content.sessions.map((session, index) => (
                                        <div key={index} className="bg-gray-900/50 p-6 rounded-lg border border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-start">
                                            <div>
                                                <p className="font-bold text-xl text-white">{session.date}</p>
                                                <p className="text-gray-400 flex items-center gap-2 mt-1">
                                                    <MapPin size={16} />
                                                    {session.location}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-2">{session.event}</p>
                                            </div>
                                            <a href={session.link} target="_blank" rel="noopener noreferrer" className="mt-4 md:mt-0 flex-shrink-0 inline-flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
                                                <LinkIcon size={16} />
                                                <span>{content.moreInfoButton}</span>
                                            </a>
                                        </div>
                                    ))}
                                </div>

                                {/* ★★★ 3. ADDED THE NEW "BOOK US" BUTTON ★★★ */}
                                <div className="mt-12 text-center">
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="inline-flex items-center gap-3 bg-fuchsia-600 px-8 py-3 rounded-lg text-lg font-bold text-white hover:bg-fuchsia-700 transition-all transform hover:scale-105"
                                    >
                                        <Mail size={20} />
                                        {content.bookWorkshopButton}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </main>

                    <footer className="flex flex-col items-center py-12 px-4">
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
                </motion.div>
            </div>

            {/* ★★★ 4. ADDED THE MODAL COMPONENT ★★★ */}
            <ContactModal
                show={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                localeContent={content.modalContent}
            />
        </div>
    );
}
