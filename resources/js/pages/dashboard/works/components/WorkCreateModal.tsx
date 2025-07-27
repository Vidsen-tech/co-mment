import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, Trash2, Loader2, Save, PlusCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/RichTextEditor';
import type { NewsSelectItem } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    newsList: NewsSelectItem[];
}

interface ImagePreview {
    url: string;
    name: string;
}

interface ShowingItem {
    id: string; // React key
    performance_date: string;
    location: string;
    news_id: number | null;
    external_link: string | null;
}

interface CreditItem {
    id: string; // React key
    role: string;
    name: string;
}

interface CreateWorkForm {
    translations: {
        hr: { title: string; description: string; credits: Record<string, string> };
        en: { title: string; description: string; credits: Record<string, string> };
    };
    premiere_date: string;
    images: File[];
    image_authors: string[];
    thumbnail_index: number | null;
    showings: Omit<ShowingItem, 'id'>[];
}

const WorkCreateModal: React.FC<Props> = ({ open, onClose, newsList }) => {
    const [activeLocale, setActiveLocale] = useState<'hr' | 'en'>('hr');
    const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
    const [showings, setShowings] = useState<ShowingItem[]>([]);
    const [credits, setCredits] = useState<{ hr: CreditItem[], en: CreditItem[] }>({ hr: [], en: [] });
    // ★★★ FIX: State to manage the submission flow safely ★★★
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<CreateWorkForm>({
        translations: {
            hr: { title: '', description: '', credits: {} },
            en: { title: '', description: '', credits: {} },
        },
        premiere_date: new Date().toISOString().split('T')[0],
        images: [],
        image_authors: [],
        thumbnail_index: null,
        showings: [],
    });

    const handleClose = useCallback(() => {
        imagePreviews.forEach(p => URL.revokeObjectURL(p.url));
        setImagePreviews([]);
        setShowings([]);
        setCredits({ hr: [], en: [] });
        reset();
        clearErrors();
        setActiveLocale('hr');
        onClose();
    }, [imagePreviews, onClose, reset, clearErrors]);

    // Image handlers now update the `useForm` data directly
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const newFiles = Array.from(e.target.files);
        const currentFiles = data.images;
        const combinedFiles = [...currentFiles, ...newFiles];

        const newAuthors = newFiles.map(() => '');
        const combinedAuthors = [...data.image_authors, ...newAuthors];

        const newPreviews = newFiles.map(file => ({ url: URL.createObjectURL(file), name: file.name }));
        setImagePreviews(prev => [...prev, ...newPreviews]);

        setData(d => ({
            ...d,
            images: combinedFiles,
            image_authors: combinedAuthors,
            thumbnail_index: d.thumbnail_index === null && combinedFiles.length > 0 ? 0 : d.thumbnail_index,
        }));
    };

    const removeImage = (indexToRemove: number) => {
        URL.revokeObjectURL(imagePreviews[indexToRemove].url);

        const updatedFiles = data.images.filter((_, i) => i !== indexToRemove);
        const updatedAuthors = data.image_authors.filter((_, i) => i !== indexToRemove);
        const updatedPreviews = imagePreviews.filter((_, i) => i !== indexToRemove);

        let newThumbnailIndex = data.thumbnail_index;
        if (newThumbnailIndex === indexToRemove) {
            newThumbnailIndex = updatedFiles.length > 0 ? 0 : null;
        } else if (newThumbnailIndex !== null && newThumbnailIndex > indexToRemove) {
            newThumbnailIndex -= 1;
        }

        setImagePreviews(updatedPreviews);
        setData({
            ...data,
            images: updatedFiles,
            image_authors: updatedAuthors,
            thumbnail_index: newThumbnailIndex
        });
    };

    const updateImageAuthor = (index: number, author: string) => {
        const updatedAuthors = [...data.image_authors];
        updatedAuthors[index] = author;
        setData('image_authors', updatedAuthors);
    };

    const setThumbnail = (index: number) => {
        setData('thumbnail_index', index);
    };

    // Showings Handlers (using local state)
    const addShowing = () => setShowings(p => [...p, { id: uuidv4(), performance_date: '', location: '', news_id: null, external_link: null }]);
    const removeShowing = (id: string) => setShowings(p => p.filter(s => s.id !== id));
    const updateShowing = (id: string, field: keyof Omit<ShowingItem, 'id'>, value: string | number | null) => {
        setShowings(p => p.map(s => {
            if (s.id === id) {
                const updated = { ...s, [field]: value };
                if (field === 'external_link' && value) updated.news_id = null;
                if (field === 'news_id' && value) updated.external_link = '';
                return updated;
            }
            return s;
        }));
    };

    // Credits Handlers (using local state)
    const addCredit = (locale: 'hr' | 'en') => setCredits(p => ({ ...p, [locale]: [...p[locale], { id: uuidv4(), role: '', name: '' }] }));
    const removeCredit = (locale: 'hr' | 'en', id: string) => setCredits(p => ({ ...p, [locale]: p[locale].filter(c => c.id !== id) }));
    const updateCredit = (locale: 'hr' | 'en', id: string, field: 'role' | 'name', value: string) => setCredits(p => ({ ...p, [locale]: p[locale].map(c => c.id === id ? { ...c, [field]: value } : c) }));

    // ★★★ FIX: New submission handler that prevents race conditions ★★★
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const formattedCreditsHr = credits.hr.reduce((acc, credit) => { if (credit.role) acc[credit.role] = credit.name; return acc; }, {} as Record<string, string>);
        const formattedCreditsEn = credits.en.reduce((acc, credit) => { if (credit.role) acc[credit.role] = credit.name; return acc; }, {} as Record<string, string>);
        const showingsForSubmission = showings.map(({ id, ...rest }) => rest);

        setData(d => ({
            ...d,
            showings: showingsForSubmission,
            translations: {
                hr: { ...d.translations.hr, credits: formattedCreditsHr },
                en: { ...d.translations.en, credits: formattedCreditsEn },
            }
        }));
        // Trigger the useEffect
        setIsSubmitting(true);
    };

    // ★★★ FIX: useEffect handles the post call AFTER state is updated ★★★
    useEffect(() => {
        if (isSubmitting) {
            post(route('works.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Novi rad uspješno stvoren!');
                    handleClose();
                },
                onError: (err) => {
                    console.error("Validation errors:", err);
                    toast.error('Greška pri stvaranju. Provjerite jesu li sva obavezna polja ispunjena.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        }
    }, [isSubmitting]);

    const getError = (field: string) => (errors as any)[field];

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="sm:max-w-[600px] md:max-w-[1000px] flex flex-col h-[90vh] p-0">
                <DialogHeader className="shrink-0 p-6 border-b">
                    <DialogTitle className="text-2xl font-semibold">Stvori novi rad</DialogTitle>
                    <DialogDescription>Ispunite polja za novi rad. Polja označena sa * su obavezna.</DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0">
                    <form onSubmit={submit} id="work-create-form" className="space-y-6 p-6">
                        <div className="flex items-center gap-4"><Label>Jezik unosa:</Label><ToggleGroup type="single" value={activeLocale} onValueChange={(v: 'hr' | 'en') => v && setActiveLocale(v)}><ToggleGroupItem value="hr">Hrvatski</ToggleGroupItem><ToggleGroupItem value="en">Engleski</ToggleGroupItem></ToggleGroup></div>

                        {Object.keys(credits).map((locale) => (
                            <div key={locale} className={cn('space-y-6', activeLocale === locale ? 'block' : 'hidden')}>
                                <div><Label htmlFor={`title-${locale}`}>Naslov ({locale.toUpperCase()}) {locale === 'hr' && '*'}</Label><Input id={`title-${locale}`} value={data.translations[locale as 'hr'|'en'].title} onChange={e => setData(`translations.${locale}.title` as any, e.target.value)} className={cn(getError(`translations.${locale}.title`) && 'border-red-500')} /></div>
                                <div><Label htmlFor={`description-${locale}`}>Opis ({locale.toUpperCase()}) {locale === 'hr' && '*'}</Label><RichTextEditor content={data.translations[locale as 'hr'|'en'].description} onChange={(newContent) => setData(`translations.${locale}.description` as any, newContent)} /></div>
                                <div><div className="flex items-center justify-between mb-2"><Label>Autorski tim ({locale.toUpperCase()})</Label><Button size="sm" type="button" variant="outline" onClick={() => addCredit(locale as 'hr'|'en')}><PlusCircle className="h-4 w-4 mr-2" /> Dodaj unos</Button></div><div className="space-y-2">{credits[locale as 'hr'|'en'].map((credit) => (<div key={credit.id} className="flex items-center gap-2"><Input placeholder="Uloga (npr. Režija)" value={credit.role} onChange={e => updateCredit(locale as 'hr'|'en', credit.id, 'role', e.target.value)} /><Input placeholder="Ime i prezime" value={credit.name} onChange={e => updateCredit(locale as 'hr'|'en', credit.id, 'name', e.target.value)} /><Button type="button" variant="ghost" size="icon" onClick={() => removeCredit(locale as 'hr'|'en', credit.id)}><X className="h-4 w-4 text-destructive" /></Button></div>))}</div></div>
                            </div>
                        ))}

                        <div className="pt-4"><Label htmlFor="premiere_date">Datum premijere *</Label><Input id="premiere_date" type="date" value={data.premiere_date} onChange={e => setData('premiere_date', e.target.value)} className={cn(errors.premiere_date && 'border-red-500')} /></div>

                        <div className="pt-4"><Label>Slike</Label><div className="mt-1 border border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors"><Label htmlFor="image-upload-create" className="cursor-pointer flex flex-col items-center justify-center"><UploadCloud className="h-8 w-8 text-muted-foreground" /> <span className="mt-2 font-medium text-primary">Kliknite za upload</span></Label><Input id="image-upload-create" type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only" /></div></div>

                        {imagePreviews.length > 0 && (<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{imagePreviews.map((preview, idx) => (<div key={preview.url} className="relative border rounded-lg p-2 space-y-2 bg-background"><img src={preview.url} alt={preview.name} className="aspect-video w-full object-cover rounded bg-muted" /><Input type="text" placeholder="Autor (opcionalno)" value={data.image_authors[idx]} onChange={e => updateImageAuthor(idx, e.target.value)} className="h-8 text-sm" /><div className="flex items-center justify-between pt-1"><Label className="flex items-center gap-1.5 text-xs cursor-pointer select-none"><input type="radio" name="thumb_radio_create" checked={data.thumbnail_index === idx} onChange={() => setThumbnail(idx)} />Naslovna</Label><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeImage(idx)}><Trash2 className="h-4 w-4" /></Button></div></div>))}</div>)}

                        <div className="pt-4 space-y-4">
                            <div className="flex items-center justify-between"><Label>Izvedbe</Label><Button type="button" variant="outline" size="sm" onClick={addShowing}><PlusCircle className="h-4 w-4 mr-2" /> Dodaj izvedbu</Button></div>
                            {showings.map((showing) => (<div key={showing.id} className="grid items-start gap-3 p-3 rounded-md bg-muted/50"><div className="grid grid-cols-2 gap-3"><Input type="datetime-local" value={showing.performance_date} onChange={e => updateShowing(showing.id, 'performance_date', e.target.value)} /><Input placeholder="Lokacija" value={showing.location} onChange={e => updateShowing(showing.id, 'location', e.target.value)} /></div><div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3"><Select value={String(showing.news_id ?? 'null')} onValueChange={v => updateShowing(showing.id, 'news_id', v === 'null' ? null : parseInt(v))} disabled={!!showing.external_link}><SelectTrigger><SelectValue placeholder="Poveži vijest..." /></SelectTrigger><SelectContent><SelectItem value="null">-- Bez vijesti --</SelectItem>{newsList.map(n => <SelectItem key={n.id} value={String(n.id)}>{n.title}</SelectItem>)}</SelectContent></Select><span className="text-sm text-muted-foreground">ILI</span><Input placeholder="Vanjski link (URL)" value={showing.external_link ?? ''} onChange={e => updateShowing(showing.id, 'external_link', e.target.value)} disabled={!!showing.news_id} /></div><div className="flex justify-end -mt-2"><Button type="button" variant="ghost" size="icon" onClick={() => removeShowing(showing.id)}><X className="h-4 w-4 text-destructive" /></Button></div></div>))}
                        </div>
                    </form>
                </ScrollArea>

                <DialogFooter className="shrink-0 p-6 border-t bg-background">
                    <DialogClose asChild><Button variant="outline" disabled={processing} onClick={handleClose}>Otkaži</Button></DialogClose>
                    <Button type="submit" form="work-create-form" disabled={processing}>{processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Stvori rad</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WorkCreateModal;
