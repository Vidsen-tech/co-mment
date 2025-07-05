import { Link } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';

export default function Footer() {

    const { locale } = useTranslation();
    return (
        // ★ UPDATED: Increased vertical padding for a taller footer
        <footer className="bg-gray-100 dark:bg-black/20 border-t border-gray-200/80 dark:border-white/10 mt-auto">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-y-8 gap-x-12">

                    {/* Left Side: Sponsor & Main Logos */}
                    {/* ★ UPDATED: Increased gap between logos */}
                    <div className="flex items-center gap-8 lg:gap-10">
                        {/* ★ UPDATED: Wrapped in a link and increased size */}
                        <a
                            href="https://kulturanova.hr/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-opacity hover:opacity-80"
                        >
                            <img
                                src="/zKn_znak_logo_BIJELI.png"
                                alt="Zaklada Kultura nova Logo"
                                className="h-12 lg:h-14 object-contain"
                                title="Zaklada Kultura nova"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                        </a>

                        {/* Vertical Separator */}
                        {/* ★ UPDATED: Increased height */}
                        <div className="w-px h-12 lg:h-14 bg-gray-300 dark:bg-gray-700"></div>

                        <Link href="/">
                            {/* ★ UPDATED: Increased size */}
                            <img
                                src={locale === 'en' ? '/logo_eng_2.png' : '/logo.png'}
                                alt="Main Site Logo"
                                className="h-26 lg:h-30 object-contain transition-transform hover:scale-105"
                                title="Home"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                        </Link>
                    </div>

                    {/* Right Side: "Made by" Credit */}
                    <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
                        <a
                            href="mailto:luka.vidovic.biz@gmail.com"
                            // ★ UPDATED: Increased font size
                            className="text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-primary dark:hover:text-white"
                        >
                            Made by LV soft.
                        </a>
                        {/* ★ UPDATED: Increased size */}
                        <img
                            src="/logo-company.png"
                            alt="LV Soft Logo"
                            className="h-10 w-10 object-contain"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
}
