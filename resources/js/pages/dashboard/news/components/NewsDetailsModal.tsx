import React, { useEffect, useState, useCallback } from 'react';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader,
    DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Trash2, Edit, Save, X, UploadCloud,
    CheckCircle, Loader2, Ban,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { NewsTableRow, NewsType } from '@/types';
import { cn } from '@/lib/utils';

// --- Type Definitions ---
interface NewsDetailsModalProps {
    open: boolean;
    onClose: () => void;
    news: NewsTableRow | null;
    newsTypes: NewsType[];
}

interface EditableImage {
    id: number | null;
    file?: File;
    previewUrl: string;
    author: string;
    is_thumbnail: boolean;
    markedForRemoval?: boolean;
}

interface UpdateNewsForm {
    translations: {
        hr: { title: string; excerpt: string; };
        en: { title: string; excerpt: string; };
    };
    date: string;
    type: NewsType | '';
    is_active: boolean;
    source: string;
}

// --- The Main Component ---
const NewsDetailsModal: React.FC<NewsDetailsModalProps> = ({ open, onClose, news, newsTypes }) => {
    // --- State ---
    const [isEditing, setIsEditing] = useState(false);
    const [editableImages, setEditableImages] = useState<EditableImage[]>([]);
    const [activeLocale, setActiveLocale] = useState<'hr' | 'en'>('hr');
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    // --- Form Hook ---
    const { data, setData, errors, reset, clearErrors, processing } = useForm<UpdateNewsForm>({
        translations: { hr: { title: '', excerpt: '' }, en: { title: '', excerpt: '' } },
        date: '', type: '', is_active: true, source: '',
    });

    // --- Callbacks for State Management ---
    const populateForm = useCallback((newsItem: NewsTableRow) => {
        setData({
            translations: {
                hr: newsItem.translations.hr ?? { title: '', excerpt: '' },
                en: newsItem.translations.en ?? { title: '', excerpt: '' },
            },
            date: newsItem.date, type: newsItem.type, is_active: newsItem.is_active, source: newsItem.source ?? '',
        });
        setEditableImages(newsItem.images.map(img => ({ id: img.id, previewUrl: img.url, author: img.author ?? '', is_thumbnail: img.is_thumbnail })));
    }, [setData]);

    // This effect now ONLY runs when the modal is opened or a different news item is passed.
    // This is the critical fix that prevents the infinite loops.
    useEffect(() => {
        if (open && news) {
            populateForm(news);
            clearErrors();
        } else if (!open) {
            reset();
            setIsEditing(false);
            setActiveLocale('hr');
            editableImages.forEach(img => { if (img.file) URL.revokeObjectURL(img.previewUrl); });
            setEditableImages([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, news]);


    // --- Handlers ---
    const handleEditToggle = useCallback(() => {
        if (isEditing && news) { populateForm(news); clearErrors(); }
        setIsEditing(p => !p);
    }, [isEditing, news, populateForm, clearErrors]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files).map(file => ({ id: null, file, previewUrl: URL.createObjectURL(file), author: '', is_thumbnail: false, }));
        setEditableImages(prev => { const combined = [...prev, ...newFiles]; if (!combined.some(i => i.is_thumbnail)) { const first = combined.find(i => !i.markedForRemoval); if(first) first.is_thumbnail = true; } return combined; });
    }, []);

    const handleThumbnailSelection = useCallback((selectedIndex: number) => {
        setEditableImages(p => p.map((img, idx) => ({ ...img, is_thumbnail: idx === selectedIndex })));
    }, []);

    const markImageForRemoval = useCallback((indexToRemove: number) => {
        setEditableImages(p => { const next = [...p]; const target = next[indexToRemove]; if(!target) return next; if (target.id) { target.markedForRemoval = true; } else { URL.revokeObjectURL(target.previewUrl); next.splice(indexToRemove, 1); } if(target.is_thumbnail){ const newThumb = next.find(i => !i.markedForRemoval); if(newThumb) newThumb.is_thumbnail = true; } return next; });
    }, []);

    const handleSave = () => {
        if (!news) return;
        const formData = new FormData();
        formData.append('_method', 'PUT');
        // Append all data fields from the form state
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'translations') {
                Object.entries(value).forEach(([locale, fields]) => {
                    Object.entries(fields).forEach(([field, text]) => formData.append(`translations[${locale}][${field}]`, text));
                });
            } else if (key === 'is_active') {
                formData.append(key, value ? '1' : '0');
            } else {
                formData.append(key, value as string);
            }
        });

        // Handle images
        const newImages = editableImages.filter(i => i.file && !i.markedForRemoval);
        newImages.forEach((img, idx) => { formData.append(`new_images[${idx}]`, img.file!); if (img.author) formData.append(`new_image_authors[${idx}]`, img.author); });
        const removedIds = editableImages.filter(i => i.id && i.markedForRemoval).map(i => i.id!);
        removedIds.forEach(id => formData.append('remove_image_ids[]', String(id)));
        const thumb = editableImages.find(i => i.is_thumbnail && !i.markedForRemoval);
        if (thumb?.file) { formData.append('new_thumbnail_index', String(newImages.findIndex(i => i.previewUrl === thumb.previewUrl))); }
        else if (thumb?.id) { formData.append('thumbnail_image_id', String(thumb.id)); }

        router.post(route('news.update', news.id), formData, {
            forceFormData: true, preserveScroll: true,
            onSuccess: () => { toast.success('Novost ažurirana!'); onClose(); },
            onError: (e) => { toast.error('Greška pri ažuriranju.'); console.error(e); },
        });
    };

    const handleDelete = () => {
        if (!news) return;
        router.delete(route('news.destroy', news.id), {
            preserveScroll: true,
            onSuccess: () => { toast.success('Novost deaktivirana.'); onClose(); },
            onError: () => toast.error('Greška pri deaktiviranju.'),
            onFinish: () => setConfirmDeleteOpen(false),
        });
    };

    const getError = (field: string) => (errors as any)[field];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
                {/* This check is critical to prevent crashes before data is loaded */}
                {news && (
                    <>
                        <ScrollArea className="max-h-[85vh] pr-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-semibold">{isEditing ? `Uređivanje: ${news.title}` : news.title}</DialogTitle>
                                <DialogDescription>Kreirano: {news.created_at} | Zadnja izmjena: {news.updated_at}</DialogDescription>
                            </DialogHeader>

                            {/* ★★★ FULL JSX RESTORED BELOW ★★★ */}
                            <div className="py-4 space-y-6">
                                {isEditing && <div className="flex items-center gap-4"><Label>Jezik unosa:</Label><ToggleGroup type="single" value={activeLocale} onValueChange={(v: 'hr' | 'en') => v && setActiveLocale(v)}><ToggleGroupItem value="hr">Hrvatski</ToggleGroupItem><ToggleGroupItem value="en">Engleski</ToggleGroupItem></ToggleGroup></div>}

                                <div className="space-y-4">{Object.keys(data.translations).map(locale => (
                                    <div key={locale} className={cn('space-y-4', !isEditing || activeLocale === locale ? 'block' : 'hidden')}>
                                        <div>
                                            <Label htmlFor={`title-${locale}`}>Naslov ({locale.toUpperCase()})</Label>
                                            {isEditing ? <Input id={`title-${locale}`} value={data.translations[locale as 'hr'|'en'].title} onChange={e => setData(d => ({...d, translations: {...d.translations, [locale]: { ...d.translations[locale as 'hr'|'en'], title: e.target.value }}}))} className={cn(getError(`translations.${locale}.title`) && 'border-red-500')} /> : <p className="text-sm text-muted-foreground mt-1">{data.translations[locale as 'hr'|'en']?.title || '-'}</p>}
                                            {getError(`translations.${locale}.title`) && <p className="text-xs text-red-500 mt-1">{getError(`translations.${locale}.title`)}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor={`excerpt-${locale}`}>Sadržaj ({locale.toUpperCase()})</Label>
                                            {isEditing ? <Textarea id={`excerpt-${locale}`} rows={6} value={data.translations[locale as 'hr'|'en'].excerpt} onChange={e => setData(d => ({...d, translations: {...d.translations, [locale]: {...d.translations[locale as 'hr'|'en'], excerpt: e.target.value}} }))} className={cn(getError(`translations.${locale}.excerpt`) && 'border-red-500')} /> : <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{data.translations[locale as 'hr'|'en']?.excerpt || '-'}</p>}
                                            {getError(`translations.${locale}.excerpt`) && <p className="text-xs text-red-500 mt-1">{getError(`translations.${locale}.excerpt`)}</p>}
                                        </div>
                                    </div>
                                ))}</div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div><Label>Datum</Label>{isEditing ? <Input type="date" value={data.date} onChange={e => setData('date', e.target.value)} /> : <p className="text-sm mt-1">{news.formatted_date}</p>}</div>
                                        <div><Label>Tip</Label>{isEditing ? <Select value={data.type} onValueChange={(v: NewsType) => setData('type', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{newsTypes.map(tp => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}</SelectContent></Select> : <p className="text-sm mt-1"><Badge variant="secondary">{data.type}</Badge></p>}</div>
                                        {(isEditing || data.source) && <div><Label>Izvor (Link)</Label>{isEditing ? <Input value={data.source} onChange={e => setData('source', e.target.value)} /> : <a href={data.source} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 block mt-1">{data.source}</a>}</div>}
                                        <div><Label className="flex items-center gap-2 font-medium">Status</Label>{isEditing ? <div className="flex items-center gap-2 mt-2"><Switch id="is_active" checked={data.is_active} onCheckedChange={c => setData('is_active', c)} /><span>{data.is_active ? 'Aktivan' : 'Neaktivan'}</span></div> : <div className="flex items-center gap-2 mt-1">{data.is_active ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Ban className="h-5 w-5 text-red-500" />}<span>{data.is_active ? 'Aktivan' : 'Neaktivan'}</span></div>}</div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Slike</Label>
                                        {isEditing && <div className="border border-dashed rounded-md p-4 text-center hover:border-primary"><Label htmlFor="img-up-det" className="cursor-pointer"><UploadCloud className="mx-auto h-8 w-8" /><span>Dodaj slike</span></Label><Input id="img-up-det" type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only" /></div>}
                                        <div className="grid grid-cols-2 gap-4">{editableImages.filter(i => !i.markedForRemoval).map((img, idx) => (<div key={img.id ?? img.previewUrl} className="relative group border rounded-lg p-2 space-y-2"><img src={img.previewUrl} alt="Slika" className="aspect-video w-full object-cover rounded" />{isEditing ? (<><Input placeholder="Autor" value={img.author} onChange={e => setEditableImages(p => { const n=[...p]; if(n[idx]) n[idx].author = e.target.value; return n; })} className="h-8" /><div className="flex items-center justify-between"><Label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="thumb_edit" checked={img.is_thumbnail} onChange={() => handleThumbnailSelection(idx)} />Naslovna</Label><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => markImageForRemoval(idx)}><Trash2 className="h-4" /></Button></div></>) : (<div className="text-xs truncate">{img.author && <span>Autor: {img.author}</span>}{img.is_thumbnail && <Badge className="ml-2">Naslovna</Badge>}</div>)}</div>))}</div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                        <DialogFooter className="mt-6 pt-4 border-t sm:justify-between">
                            <div><Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)} disabled={processing}><Trash2 className="mr-2 h-4 w-4" /> Deaktiviraj</Button></div>
                            <div className="flex gap-2">
                                {isEditing ? (<><Button variant="outline" onClick={handleEditToggle} disabled={processing}><X className="mr-2 h-4" /> Otkaži</Button><Button onClick={handleSave} disabled={processing}>{processing ? <><Loader2 className="mr-2 h-4 animate-spin" /> Spremanje...</> : <><Save className="mr-2 h-4" /> Spremi</>}</Button></>) : (<Button onClick={handleEditToggle}><Edit className="mr-2 h-4" /> Uredi</Button>)}
                                <DialogClose asChild><Button variant="secondary" onClick={onClose} disabled={processing}>Zatvori</Button></DialogClose>
                            </div>
                        </DialogFooter>
                        <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}><DialogContent><DialogHeader><DialogTitle>Potvrda deaktivacije</DialogTitle><DialogDescription>Jeste li sigurni? Deaktivirana novost se može ponovo aktivirati kasnije.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>Otkaži</Button><Button variant="destructive" onClick={handleDelete} disabled={processing}>{processing ? 'Deaktiviram...' : 'Da, deaktiviraj'}</Button></DialogFooter></DialogContent></Dialog>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default NewsDetailsModal;
