import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

type Replace = Record<string, string>;

export default function useTranslation() {
    const { locale, translations } = usePage<PageProps>().props;

    const t = (key: string, replace: Replace = {}) => {
        let line = translations?.[key] ?? key;
        Object.entries(replace).forEach(([k, v]) => {
            line = line.replace(`:${k}`, v);
        });
        return line;
    };

    return { locale, t };
}
