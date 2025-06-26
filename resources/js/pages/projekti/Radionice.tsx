import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, MapPin, Link as LinkIcon } from 'lucide-react';

// --- Hardkodirani podaci za radionicu ---
// Kasnije se ovo može prebaciti da dolazi iz CMS-a
const workshopData = {
    hr: {
        title: 'Radionica Kolažiranje',
        description: `Ova radionica temelji se na principu “kolažiranja,” koji je poslužio kao polazna točka za naš autorski rad “…, a još su manji izlazi.” Inspirirani likovnom tehnikom kolaža, gradimo plesni vokabular u kojem tijelo i prostor tretiramo kao platno. Koristeći principe kolažiranja, stvaramo izvedbu koja istražuje granice između pokreta, prostora i ritma.\n\nKroz improvizacijske zadatke istražujemo kvalitete kretanja i tjelesne alate koji potiču individualnu kreativnost na temu kolažiranja. Naglasak je na osvještavanju tijela u osobnom i zajedničkom prostoru, dok radom u paru i grupama uvodimo osnovne mehanizme kolažiranja.\n\nSpecifičnost ovog pristupa temelji se na fragmentiranom i preciznom pokretu, koji potiče poseban ritam tijela. Radionicu zaokružujemo samostalnim kreativnim zadacima, omogućujući sudionicima da preispitaju i primjene usvojena znanja i alate na vlastiti način.\n\nPozivamo vas da kroz ovu radionicu istražite granice vlastitog pokreta i otvorite prostor za novu plesnu kreativnost.`,
        sessions: [
            { date: '29.10.2024.', location: 'KC Magacin, Beograd', event: 'Kondenz festival, NDA Hrvatska, Modularna škola', link: 'https://dancestation.org/kondenz-2024-unsafety-signs/#KOLAZIRANJE' },
            { date: '2. i 3.11.2024.', location: 'Beton Kino Doma Mladih, Split', event: 'Plesna udruga Tiramola, NDA Hrvatska, Modularna škola', link: 'https://fb.me/e/7yPGiL6d7' },
            { date: '19.11.2024.', location: 'TALA PLE(j)S, Zagreb', event: 'Koreografska konvencija, Nomadska plesna akademija Hrvatska, Modularna škola', link: 'https://antisezona.space/en/choreographic-convention-programme/' },
        ]
    },
    en: {
        title: 'Collaging Workshop',
        description: `This workshop is based on the principle of "collaging," which served as the starting point for our original work, “…, and the exits are even smaller.” Inspired by the visual art technique of collage, we build a dance vocabulary where the body and the space are treated as a canvas. Using the principles of collaging, we create a performance that explores the boundaries between movement, space, and rhythm.\n\nThrough improvisational tasks, we explore movement qualities and physical tools that provoke individual creativity on the theme of collaging. The emphasis is on building body awareness within personal and collective spaces. Working in pairs and groups, participants are introduced to fundamental mechanisms of collaging. This approach is characterized by fragmented and precise movement, revealing the unique rhythm produced by the body. The workshop concludes with individual creative tasks that allow participants to reflect on and apply the knowledge and tools they have acquired in their own way.\n\nWe invite you to this workshop to explore the boundaries of your movement and open space for new dance creativity.`,
        sessions: [
            { date: '29th of October 2024', location: 'KC Magacin, Belgrade', event: 'Kondenz festival, NDA Croatia, Modular school', link: 'https://dancestation.org/kondenz-2024-unsafety-signs/#KOLAZIRANJE' },
            { date: '2nd and 3rd of November 2024', location: 'Beton Kino Doma Mladih, Split', event: 'Plesna udruga Tiramola, NDA Croatia, Modular school', link: 'https://fb.me/e/7yPGiL6d7' },
            { date: '19th of November 2024', location: 'TALA PLE(j)S, Zagreb', event: 'Choreographic convention, NDA Croatia, Modular school', link: 'https://antisezona.space/en/choreographic-convention-programme/' },
        ]
    }
};

// --- Glavna komponenta stranice ---
export default function Radionice() {
    // Automatski detektira jezik i prikazuje pravi sadržaj
    const { props: { locale } } = usePage<{ locale: 'hr' | 'en' }>();
    const content = workshopData[locale] || workshopData.hr;

    return (
        <div className="bg-black text-white min-h-screen">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

                {/* Hero sekcija s naslovom */}
                <header className="relative h-[50vh] flex items-center justify-center text-center p-6 overflow-hidden bg-gray-900">
                    <img
                        src="https://images.unsplash.com/photo-1549488493-1apisFNAP3jQ?q=80&w=2574&auto=format&fit=crop"
                        alt="Radionica Kolažiranje"
                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                    />
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

                {/* Sekcija sa sadržajem */}
                <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <div className="flex items-center gap-3 text-indigo-400 mb-4">
                            <BookOpen size={20} />
                            <h2 className="text-2xl font-bold uppercase tracking-wider">Opis radionice</h2>
                        </div>
                        <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
                            {content.description}
                        </p>

                        <div className="mt-16">
                            <div className="flex items-center gap-3 text-indigo-400 mb-6">
                                <Calendar size={20} />
                                <h2 className="text-2xl font-bold uppercase tracking-wider">Održane radionice</h2>
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
                                        <a
                                            href={session.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 md:mt-0 flex-shrink-0 inline-flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors"
                                        >
                                            <LinkIcon size={16} />
                                            <span>Više informacija</span>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-16 text-center text-gray-500">
                            <p>Slike i trailer uskoro...</p>
                        </div>
                    </motion.div>
                </main>
            </motion.div>
        </div>
    );
}
