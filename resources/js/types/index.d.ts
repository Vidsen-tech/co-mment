/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

/* ────────────────────────────────────────────────────────────────
   Shared & Global Types
   ───────────────────────────────────────────────────────────────*/

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Auth {
    user: User | null;
}

export interface SharedData {
    appName: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    locale: string;
    translations: Record<string, string>;
    flash?: { success?: string; error?: string };
    errors?: Record<string, string>;
    [key: string]: unknown;
}

export type PageProps = SharedData;

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    first_page_url?: string | null;
    last_page_url?: string | null;
    next_page_url?: string | null;
    prev_page_url?: string | null;
    path?: string;
    links?: unknown;
}


/* ────────────────────────────────────────────────────────────────
   News Module Types
   ───────────────────────────────────────────────────────────────*/
export type NewsType = 'Radovi' | 'Radionice' | 'Novosti';

export interface NewsImageData {
    id: number;
    url: string;
    author: string | null;
    is_thumbnail: boolean;
}

export interface NewsTableRow {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    type: NewsType;
    date: string;
    formatted_date: string;
    is_active: boolean;
    thumbnail_url: string | null;
    source: string | null;
    created_at: string;
    updated_at: string;
    images: NewsImageData[];
    translations: {
        [locale: string]: {
            title: string;
            excerpt: string;
        };
    };
}


/* ────────────────────────────────────────────────────────────────
   Works Module Types
   ───────────────────────────────────────────────────────────────*/
export interface WorkImageData {
    id: number;
    url: string;
    author: string | null;
    is_thumbnail: boolean;
}

export interface ShowingData {
    id: number;
    performance_date: string;
    location: string;
    news_id: number | null;
}

export interface WorkTableRow {
    id: number;
    slug: string;
    title: string;
    premiere_date: string;
    is_active: boolean;
    thumbnail_url: string | null;
    created_at: string;
    updated_at: string;
    images: WorkImageData[];
    showings: ShowingData[];
    translations: {
        [locale: string]: {
            title: string;
            description: string;
        };
    };
}

// ★★★ THE ONLY CHANGE IS HERE ★★★
// Represents a single news item for the dropdown list.
export interface NewsSelectItem {
    id: number;
    title: string;
}

export interface WorksIndexPageProps extends PageProps {
    works: PaginatedResponse<WorkTableRow>;
    filters: { search?: string; };
    // Add the list of news articles to the page props.
    newsList: NewsSelectItem[];
}
