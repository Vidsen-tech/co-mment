import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Dialog, DialogContent, DialogFooter,
    DialogHeader, DialogTitle, DialogDescription, DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { UploadCloud, Trash2, Loader2, Save } from 'lucide-react';
import type { NewsType } from '@/types';
import { cn } from '@/lib/utils';

// --- Types ---
interface Props {
    open: boolean;
    onClose: () => void;
    newsTypes: NewsType[];
}

interface ImagePreview {
    url: string;
    name: string;
}

// ★ CORRECTED: The form data structure is now valid and complete.
interface CreateNewsForm {
    translations: {
        hr: { title: string; excerpt: string; };
        en: { title: string; excerpt: string; };
    };
    date: string;
    type: NewsType | '';
    source_url: string;
    source_text: string;
    images: File[];
    image_authors: (string | null)[];
    thumbnail_index: number | null;
}

// --- The Main Component ---
const NewsCreateModal: React.FC<Props> = ({ open, onClose, newsTypes }) => {
    const [activeLocale, setActiveLocale] = useState<'hr' | 'en'>('hr');
    const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);

    // ★ CORRECTED: The initial form state now matches the interface.
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<CreateNewsForm>({
        translations: {
            hr: { title: '', excerpt: '' },
            en: { title: '', excerpt: '' },
        },
        date: new Date().toISOString().split('T')[0],
        type: '',
        source_url: '',
        source_text: '',
        images: [],
        image_authors: [],
        thumbnail_index: null,
    });

    const handleClose = useCallback(() => {
        imagePreviews.forEach(p => URL.revokeObjectURL(p.url));
        setImagePreviews([]);
        reset();
        setActiveLocale('hr');
        onClose();
    }, [imagePreviews, onClose, reset]);

    useEffect(() => {
        if (!open) {
            clearErrors();
        }
    }, [open, clearErrors]);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        setData(prevData => {
            const updatedFiles = [...prevData.images, ...newFiles];
            const updatedAuthors = [...prevData.image_authors, ...newFiles.map(() => '')];
            let updatedThumbnailIndex = prevData.thumbnail_index;
            if (updatedThumbnailIndex === null && updatedFiles.length > 0) {
                updatedThumbnailIndex = 0;
            }
            return { ...prevData, images: updatedFiles, image_authors: updatedAuthors, thumbnail_index: updatedThumbnailIndex };
        });
        const newPreviews = newFiles.map(file => ({ url: URL.createObjectURL(file), name: file.name }));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (indexToRemove: number) => {
        URL.revokeObjectURL(imagePreviews[indexToRemove].url);
        setImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
        setData(prevData => {
            const updatedImages = prevData.images.filter((_, i) => i !== indexToRemove);
            const updatedAuthors = prevData.image_authors.filter((_, i) => i !== indexToRemove);
            let updatedThumbnailIndex = prevData.thumbnail_index;
            if (updatedThumbnailIndex === indexToRemove) {
                updatedThumbnailIndex = updatedImages.length > 0 ? 0 : null;
            } else if (updatedThumbnailIndex !== null && updatedThumbnailIndex > indexToRemove) {
                updatedThumbnailIndex -= 1;
            }
            return { ...prevData, images: updatedImages, image_authors: updatedAuthors, thumbnail_index: updatedThumbnailIndex };
        });
    };

    const setAuthor = (index: number, author: string) => {
        setData('image_authors', data.image_authors.map((a, i) => (i === index ? author : a)));
    };

    const setThumbnail = (index: number) => {
        setData('thumbnail_index', index);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('news.store'), {
            onSuccess: () => {
                toast.success('Nova novost uspješno stvorena!');
                handleClose();
            },
            onError: (e) => {
                toast.error('Greška pri stvaranju. Provjerite jesu li sva obavezna polja ispunjena.');
                console.error("Validation errors:", e);
            },
        });
    };

    const getError = (field: keyof CreateNewsForm) => errors[field];

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="sm:max-w-[600px] md:max-w-[800px]">
                <ScrollArea className="max-h-[85vh] pr-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold">Stvori novu novost</DialogTitle>
                        <DialogDescription>Ispunite polja za novu novost. Polja označena sa * su obavezna.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} id="news-create-form" className="space-y-6 py-4">
                        <div className="flex items-center gap-4"><Label>Jezik unosa:</Label><ToggleGroup type="single" value={activeLocale} onValueChange={(v: 'hr' | 'en') => v && setActiveLocale(v)} aria-label="Odabir jezika"><ToggleGroupItem value="hr">Hrvatski</ToggleGroupItem><ToggleGroupItem value="en">Engleski</ToggleGroupItem></ToggleGroup></div>

                        {Object.keys(data.translations).map((locale) => (
                            <div key={locale} className={cn('space-y-4', activeLocale === locale ? 'block' : 'hidden')}>
                                <div>
                                    <Label htmlFor={`title-${locale}`}>Naslov ({locale.toUpperCase()}) {locale === 'hr' && '*'}</Label>
                                    <Input id={`title-${locale}`} value={data.translations[locale as 'hr'|'en'].title} onChange={e => setData(d => ({...d, translations: {...d.translations, [locale]: {...d.translations[locale as 'hr'|'en'], title: e.target.value}} }))} className={cn(getError(`translations.${locale}.title` as any) && 'border-red-500')} />
                                </div>
                                <div>
                                    <Label htmlFor={`excerpt-${locale}`}>Sadržaj ({locale.toUpperCase()}) {locale === 'hr' && '*'}</Label>
                                    <Textarea id={`excerpt-${locale}`} rows={6} value={data.translations[locale as 'hr'|'en'].excerpt} onChange={e => setData(d => ({...d, translations: {...d.translations, [locale]: {...d.translations[locale as 'hr'|'en'], excerpt: e.target.value}} }))} className={cn(getError(`translations.${locale}.excerpt` as any) && 'border-red-500')} />
                                </div>
                            </div>
                        ))}

                        {/* ★★★ THIS IS THE CORRECTED SECTION WITH ALL FIELDS ★★★ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="date">Datum *</Label>
                                <Input id="date" type="date" value={data.date} onChange={e => setData('date', e.target.value)} className={cn(errors.date && 'border-red-500')} />
                                {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                            </div>
                            <div>
                                <Label htmlFor="type">Tip *</Label>
                                <Select value={data.type} onValueChange={v => setData('type', v as NewsType)}>
                                    <SelectTrigger id="type" className={cn(errors.type && 'border-red-500')}><SelectValue placeholder="Odaberite tip" /></SelectTrigger>
                                    <SelectContent>{newsTypes.map(tp => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}</SelectContent>
                                </Select>
                                {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="source_url">Izvor (Link)</Label>
                                <Input id="source_url" value={data.source_url} onChange={e => setData('source_url', e.target.value)} placeholder="https://primjer.com/izvor" className={cn(errors.source_url && 'border-red-500')} />
                                {errors.source_url && <p className="text-xs text-red-500 mt-1">{errors.source_url}</p>}
                            </div>
                            <div>
                                <Label htmlFor="source_text">Naziv izvora (opcionalno)</Label>
                                <Input id="source_text" value={data.source_text} onChange={e => setData('source_text', e.target.value)} placeholder="Npr. Službena stranica" className={cn(errors.source_text && 'border-red-500')} />
                                {errors.source_text && <p className="text-xs text-red-500 mt-1">{errors.source_text}</p>}
                            </div>
                        </div>
                        {/* The old duplicate source input is now removed */}

                        <div>
                            <Label className={cn((errors.images || errors.thumbnail_index) && 'text-red-500')}>Slike</Label>
                            <div className="mt-1 border border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors">
                                <Label htmlFor="image-upload-create" className="cursor-pointer flex flex-col items-center justify-center"><UploadCloud className="h-8 w-8 text-muted-foreground" /><span className="mt-2 font-medium text-primary">Kliknite za upload</span><span className="text-xs text-muted-foreground">ili povucite slike ovdje</span></Label>
                                <Input id="image-upload-create" type="file" multiple accept="image/*" onChange={onFileChange} className="sr-only" />
                            </div>
                        </div>

                        {imagePreviews.length > 0 && (<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{imagePreviews.map((preview, idx) => (<div key={preview.name + idx} className="relative border rounded-lg p-2 space-y-2 bg-background"><img src={preview.url} alt={`preview ${idx}`} className="aspect-video w-full object-cover rounded bg-muted" /><Input type="text" placeholder="Autor (opcionalno)" value={data.image_authors[idx] ?? ''} onChange={e => setAuthor(idx, e.target.value)} className="h-8 text-sm" /><div className="flex items-center justify-between pt-1"><Label htmlFor={`thumb-create-${idx}`} className="flex items-center gap-1.5 text-xs cursor-pointer select-none"><input type="radio" id={`thumb-create-${idx}`} name="thumb_radio_create" checked={data.thumbnail_index === idx} onChange={() => setThumbnail(idx)} />Naslovna</Label><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeImage(idx)}><Trash2 className="h-4 w-4" /></Button></div></div>))}</div>)}
                    </form>
                </ScrollArea>
                <DialogFooter className="mt-6 pt-4 border-t">
                    <DialogClose asChild><Button variant="outline" disabled={processing}>Otkaži</Button></DialogClose>
                    <Button type="submit" form="news-create-form" disabled={processing}>{processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Stvori novost</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NewsCreateModal;
