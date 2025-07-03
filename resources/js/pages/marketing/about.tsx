import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import useTranslation from '@/hooks/useTranslation';
import AppLayout from '@/layouts/app-layout';


// --- Type Definitions (No change) ---
interface Dancer {
    id: number;
    photo: string;
    name: Record<string, string>;
    bio: Record<string, string>;
}

// --- ★ NEW: PerformerCard Component ★ ---
// This component displays each artist in a beautiful, dedicated card,
// replacing the old grid and modal system.
const PerformerCard = ({ dancer, locale }: { dancer: Dancer, locale: 'hr' | 'en' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="bg-card/80 dark:bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/20"
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                {/* Image Container */}
                <div className="md:col-span-5 h-96 md:h-auto">
                    <img
                        src={dancer.photo}
                        alt={dancer.name[locale]}
                        className="object-cover w-full h-full"
                        onError={(e) => { e.currentTarget.src = `https://placehold.co/600x800/e2e8f0/475569?text=${dancer.name[locale]}` }}
                    />
                </div>

                {/* Text Content Container */}
                <div className="md:col-span-7 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                        {dancer.name[locale]}
                    </h2>
                    <p className="text-base lg:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                        {dancer.bio[locale].replace(/Co-mment/gi, 'Co\u2011mment')}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}

// --- Main About Page Component ---

About.layout = (page: React.ReactElement) => <AppLayout children={page} />;
export default function About() {
    const { locale, t } = useTranslation();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    /* static data – no changes here */
    const dancers: Dancer[] = [
        {
            id: 1,
            photo: '/images/dancer_linda.png',
            name: { hr: 'Linda Tarnovski', en: 'Linda Tarnovski' },
            bio: {
                hr: `Linda Tarnovski je plesačica suvremenog plesa bazirana u Zagrebu. Svoje plesno obrazovanje stječe u Školi suvremenog plesa Ane Maletić, a 2021. diplomira Suvremeni ples na Akademiji dramske umjetnosti u Zagrebu. Nakon studija odlazi u Vitlycke CPA u Švedsku na Erasmus+ stručnu praksu pod mentorstvom Francesca Scavette. Tijekom svojeg studija imala je priliku raditi s raznim domaćim i stranim plesnim umjetnicima. U dosadašnjem profesionalnom iskustvu surađivala je s Ansamblom suvremenog plesa VEM, VRUM kolektivom, Petrom Hrašćanec, Tomom Savić-Gecanom, Laurom Aris Alvarez, Jesusom Rubio Gamom, Idom Jolić, Filipom Bavčević, Milošem Isailovićem, Mateom Bilosnić. Od 2022. je aktivna članica Zagrebačkog plesnog ansambla te je su-osnivačica Umjetničke organizacije CO-MMENT. Kao autorica je dosad razvila radove Tango (2022.), …, a još su manji izlazi (2023.) i Co-lažiranje (2024.) te zajedno s kolegicom Dorom Pocedić vodi kreativnu plesnu radionicu Kolažiranje.`,
                en: `Linda Tarnovski is a contemporary dancer based in Zagreb. She received her dance education at Ana Maletić’s School of Contemporary Dance, and in 2021, she graduated in Contemporary Dance from the Academy of Dramatic Art in Zagreb. Following her studies, she undertook an Erasmus+ internship at Vitlycke CPA in Sweden, under the mentorship of Francesco Scavetta. During her studies, she had the opportunity to work with various local and international dance artists. In her previous professional experience, she collaborated with the VEM contemporary dance ensemble, the VRUM collective, and artists including Petra Hrašćanec, Tom Savić-Gecan, Laura Aris Alvarez, Jesus Rubio Gama, Ida Jolić, Filipa Bavčević, Miloš Isailović, and Matea Bilosnić. Since 2022, she has been an active member of the Zagreb Dance Company and a co-founder of the Artistic Organization CO-MMENT. As an author, her works to date include Tango (2022), ... and the exits are even smaller (2023), and Co-llaging (2024). She is also co-teaching a creative dance workshop, Collaging, with her colleague Dora Pocedić.`,
            },
        },
        {
            id: 2,
            photo: '/images/dancer_dora.png',
            name: { hr: 'Dora Pocedić', en: 'Dora Pocedić' },
            bio: {
                hr: `Dora Pocedić rođena je 1999. godine u Zagrebu. Svoje plesno obrazovanje započinje u Školi suvremenog plesa Ane Maletić gdje završava srednju školu (smjer plesač), nakon čega upisuje studij Suvremenog plesa na Akademiji dramske umjetnosti Sveučilišta u Zagrebu na kojem završava preddiplomski studij (izvedbeni smjer). Nakon studija odlazi na stručnu praksu pod mentorstvom Francesca Scavette u Vitlycke – Center for Performing Arts, a dodatno se usavršava kroz različite edukacijske i umjetničke programe. Trenutno pohađa diplomski studij Home of Performance Practices na ArtEZ University of the Arts. Kao izvođačica surađuje s domaćim i stranim autorima i koreografima, ali i kroz autorske radove. Autorski rad “TwoorMore” izvodi u sklopu Monoplay festivala 2022., te uz to kao koautorica i izvođačica razvila je radove “JADE”, “Tango”, “…, a još su manji izlazi”, “O Co” i “Co-lažiranje”. Suosnivačica je Umjetničke organizacije Co-mment kroz koju nastavlja razvijati umjetnički rad. Od 2024. godine postaje članica Hrvatske zajednice samostalnih umjetnika`,
                en: `Dora Pocedić was born in 1999 in Zagreb. She began her dance education at the Ana Maletić School for Contemporary Dance, where she completed high school (dancer course), after which she enrolled in the BA program in Contemporary Dance at the Academy of Dramatic Art, University of Zagreb (performance course). After completing her undergraduate studies, she did a professional internship under the mentorship of Francesco Scavetta at Vitlycke – Center for Performing Arts and further developed her practice through various educational and artistic programs. She is currently pursuing an MA in Home of Performance Practices at ArtEZ University of the Arts. As a performer, she collaborates with both local and international artists and choreographers, while also developing her own work. Her piece “TwoorMore” was presented at the Monoplay Festival in 2022. As a co-author and performer, she has also developed the works “JADE”, “Tango”, “…, and the exits are even smaller”, “O Co”, and “Co-lažiranje”. She is a co-founder of the artistic organization Co-mment, through which she continues to develop her artistic practice. Since 2024, she has been a member of the Croatian Freelance Artists’ Association.`,
            },
        },
    ];

    // Effect for mouse tracking and fade-in (no change)
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

    const orgName = t('about.orgName');
    const statement = t('about.statement');

    return (
        // ★★★ UNIFIED PAGE STYLES ★★★
        <div
            ref={containerRef}
            // ★ CHANGE: Using a much lighter slate gradient for a brighter 'dark mode' feel.
            className="relative bg-background dark:bg-gradient-to-br dark:from-slate-700 dark:via-slate-600 dark:to-slate-800 min-h-screen text-foreground overflow-hidden"
            style={{ '--mouse-x': `${mousePosition.x}px`, '--mouse-y': `${mousePosition.y}px` } as React.CSSProperties}
        >
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
                // ★ CHANGE: Increased glow opacity to make it more visible on the new, brighter background.
                style={{ background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(165, 180, 252, 0.15), transparent 80%)` }}
                aria-hidden="true"
            />

            {/* Content Wrapper */}
            <div className="relative z-10">
                {/* Hero Image */}
                <div className="relative w-full h-80 md:h-[40rem]">
                    <img src="/images/wallpaper.jpg" alt="Hero" className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
                </div>

                {/* ★★★ REDESIGNED CONTENT LAYOUT ★★★ */}
                <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 -mt-32 md:-mt-48">
                    {/* Intro Statement */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="relative bg-card/80 dark:bg-card/50 backdrop-blur-md border border-border rounded-2xl p-8 md:p-16 text-center shadow-xl"
                    >
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground">
                            {orgName.replace(/Co-mment/gi, 'Co\u2011mment')}
                        </h1>
                        <p className="mx-auto max-w-4xl text-lg md:text-xl text-muted-foreground leading-relaxed whitespace-pre-line">
                            {statement.replace(/Co-mment/gi, 'Co\u2011mment')}
                        </p>
                    </motion.div>

                    {/* Dancers Section */}
                    <div className="mt-24 space-y-16 md:space-y-24">
                        {dancers.map((dancer) => (
                            <PerformerCard key={dancer.id} dancer={dancer} locale={locale as 'hr' | 'en'} />
                        ))}
                    </div>
                </main>

                {/* Consistent Footer */}
                <footer className="flex flex-col items-center py-12 px-4 mt-16">
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
        </div>
    );
}
