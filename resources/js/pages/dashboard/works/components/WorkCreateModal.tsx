import React, { useState, useEffect, useCallback } from 'react';
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

// --- Types ---
interface Props {
    open: boolean;
    onClose: () => void;
    newsList: NewsSelectItem[];
}

interface ImagePreview {
    file: File;
    url: string;
    author: string;
    is_thumbnail: boolean;
}

interface FormShowing {
    id: string;
    performance_date: string;
    location: string;
    news_id: number | null;
    external_link: string | null;
}

interface CreditItem {
    id: string;
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
    showings: {
        performance_date: string;
        location: string;
        news_id: number | null;
        external_link: string | null;
    }[];
}

// --- Main Component ---
const WorkCreateModal: React.FC<Props> = ({ open, onClose, newsList }) => {
    const [activeLocale, setActiveLocale] = useState<'hr' | 'en'>('hr');
    const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
    const [formShowings, setFormShowings] = useState<FormShowing[]>([]);
    const [credits, setCredits] = useState<{ hr: CreditItem[], en: CreditItem[] }>({ hr: [], en: [] });

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<CreateWorkForm>();

    const handleClose = useCallback(() => {
        imagePreviews.forEach(p => URL.revokeObjectURL(p.url));
        setImagePreviews([]);
        setFormShowings([]);
        setCredits({ hr: [], en: [] });
        reset();
        clearErrors();
        setActiveLocale('hr');
        onClose();
    }, [imagePreviews, onClose, reset, clearErrors]);

    // --- Image Handlers ---
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        const newPreviews = newFiles.map(file => ({ file, url: URL.createObjectURL(file), author: '', is_thumbnail: false }));
        setImagePreviews(prev => {
            const combined = [...prev, ...newPreviews];
            if (!combined.some(i => i.is_thumbnail) && combined.length > 0) {
                combined[0].is_thumbnail = true;
            }
            return combined;
        });
    };

    const removeImage = (indexToRemove: number) => {
        URL.revokeObjectURL(imagePreviews[indexToRemove].url);
        setImagePreviews(prev => {
            const next = prev.filter((_, i) => i !== indexToRemove);
            if (prev[indexToRemove]?.is_thumbnail && next.length > 0 && !next.some(img => img.is_thumbnail)) {
                next[0].is_thumbnail = true;
            }
            return next;
        });
    };

    const updateImage = (index: number, field: 'author' | 'is_thumbnail', value: string | boolean) => {
        setImagePreviews(prev => prev.map((img, idx) => {
            if (idx === index) return { ...img, [field]: value };
            if (field === 'is_thumbnail' && value) return { ...img, is_thumbnail: false };
            return img;
        }));
    };

    // --- Showings Handlers ---
    const addShowing = () => {
        setFormShowings(prev => [...prev, { id: uuidv4(), performance_date: '', location: '', news_id: null, external_link: null }]);
    };
    const removeShowing = (id: string) => {
        setFormShowings(prev => prev.filter(s => s.id !== id));
    };

    // ★★★ THIS IS THE ONLY 'updateShowing' FUNCTION IN THE FILE ★★★
    const updateShowing = (id: string, field: 'performance_date' | 'location' | 'news_id' | 'external_link', value: string | number | null) => {
        setFormShowings(prev => prev.map(s => {
            if (s.id === id) {
                const updatedShowing = { ...s, [field]: value };
                if (field === 'external_link' && value) updatedShowing.news_id = null;
                if (field === 'news_id' && value) updatedShowing.external_link = '';
                return updatedShowing;
            }
            return s;
        }));
    };

    // --- Credits Handlers ---
    const addCredit = (locale: 'hr' | 'en') => {
        setCredits(prev => ({ ...prev, [locale]: [...prev[locale], { id: uuidv4(), role: '', name: '' }] }));
    };
    const updateCredit = (locale: 'hr' | 'en', id: string, field: 'role' | 'name', value: string) => {
        setCredits(prev => ({ ...prev, [locale]: prev[locale].map(c => c.id === id ? { ...c, [field]: value } : c) }));
    };
    const removeCredit = (locale: 'hr' | 'en', id: string) => {
        setCredits(prev => ({ ...prev, [locale]: prev[locale].filter(c => c.id !== id) }));
    };

    // --- Form Submission ---
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const formatCreditsForSubmission = (creditItems: CreditItem[]) => creditItems.reduce((acc, credit) => {
            if (credit.role) acc[credit.role] = credit.name;
            return acc;
        }, {} as Record<string, string>);

        // Manually build the data object to be sent
        const submissionData = {
            ...data,
            premiere_date: data.premiere_date,
            translations: {
                hr: { ...data.translations.hr, credits: formatCreditsForSubmission(credits.hr) },
                en: { ...data.translations.en, credits: formatCreditsForSubmission(credits.en) },
            },
            images: imagePreviews.map(p => p.file),
            image_authors: imagePreviews.map(p => p.author),
            thumbnail_index: imagePreviews.findIndex(p => p.is_thumbnail),
            showings: formShowings.map(({ id, ...rest }) => rest),
        };

        post(route('works.store'), {
            ...submissionData,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Novi rad uspješno stvoren!');
                handleClose();
            },
            onError: (err) => {
                toast.error('Greška pri stvaranju. Provjerite jesu li sva obavezna polja ispunjena.');
                console.error("Validation errors:", err);
            },
        });
    };

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
                                <div>
                                    <Label htmlFor={`title-${locale}`}>Naslov ({locale.toUpperCase()}) {locale === 'hr' && '*'}</Label>
                                    <Input id={`title-${locale}`} value={data.translations?.[locale as 'hr'|'en']?.title ?? ''} onChange={e => setData(d => ({ ...d, translations: { ...d.translations, [locale]: { ...(d.translations as any)[locale], title: e.target.value } } }))} className={cn(getError(`translations.${locale}.title`) && 'border-red-500')} />
                                </div>
                                <div>
                                    <Label htmlFor={`description-${locale}`}>Opis ({locale.toUpperCase()}) {locale === 'hr' && '*'}</Label>
                                    <RichTextEditor content={data.translations?.[locale as 'hr'|'en']?.description ?? ''} onChange={(newContent) => setData(d => ({ ...d, translations: { ...d.translations, [locale]: { ...(d.translations as any)[locale], description: newContent } } }))} />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2"><Label>Autorski tim ({locale.toUpperCase()})</Label><Button size="sm" type="button" variant="outline" onClick={() => addCredit(locale as 'hr'|'en')}><PlusCircle className="h-4 w-4 mr-2" /> Dodaj unos</Button></div>
                                    <div className="space-y-2">{credits[locale as 'hr'|'en'].map((credit) => (<div key={credit.id} className="flex items-center gap-2"><Input placeholder="Uloga (npr. Režija)" value={credit.role} onChange={e => updateCredit(locale as 'hr'|'en', credit.id, 'role', e.target.value)} /><Input placeholder="Ime i prezime" value={credit.name} onChange={e => updateCredit(locale as 'hr'|'en', credit.id, 'name', e.target.value)} /><Button type="button" variant="ghost" size="icon" onClick={() => removeCredit(locale as 'hr'|'en', credit.id)}><X className="h-4 w-4 text-destructive" /></Button></div>))}</div>
                                </div>
                            </div>
                        ))}

                        <div className="pt-4"><Label htmlFor="premiere_date">Datum premijere *</Label><Input id="premiere_date" type="date" value={data.premiere_date} onChange={e => setData('premiere_date', e.target.value)} className={cn(errors.premiere_date && 'border-red-500')} /></div>

                        <div className="pt-4"><Label>Slike</Label><div className="mt-1 border border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors"><Label htmlFor="image-upload-create" className="cursor-pointer flex flex-col items-center justify-center"><UploadCloud className="h-8 w-8 text-muted-foreground" /> <span className="mt-2 font-medium text-primary">Kliknite za upload</span></Label><Input id="image-upload-create" type="file" multiple accept="image/*" onChange={onFileChange} className="sr-only" /></div></div>

                        {imagePreviews.length > 0 && (<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{imagePreviews.map((preview, idx) => (<div key={preview.url} className="relative border rounded-lg p-2 space-y-2 bg-background"><img src={preview.url} alt={`preview ${idx}`} className="aspect-video w-full object-cover rounded bg-muted" /><Input type="text" placeholder="Autor (opcionalno)" value={preview.author} onChange={e => updateImage(idx, 'author', e.target.value)} className="h-8 text-sm" /><div className="flex items-center justify-between pt-1"><Label className="flex items-center gap-1.5 text-xs cursor-pointer select-none"><input type="radio" name="thumb_radio_create" checked={preview.is_thumbnail} onChange={() => updateImage(idx, 'is_thumbnail', true)} />Naslovna</Label><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeImage(idx)}><Trash2 className="h-4 w-4" /></Button></div></div>))}</div>)}

                        <div className="pt-4 space-y-4">
                            <div className="flex items-center justify-between"><Label>Izvedbe</Label><Button type="button" variant="outline" size="sm" onClick={addShowing}><PlusCircle className="h-4 w-4 mr-2" /> Dodaj izvedbu</Button></div>
                            {formShowings.map((showing) => (<div key={showing.id} className="grid items-start gap-3 p-3 rounded-md bg-muted/50"><div className="grid grid-cols-2 gap-3"><Input type="datetime-local" value={showing.performance_date} onChange={e => updateShowing(showing.id, 'performance_date', e.target.value)} /><Input placeholder="Lokacija" value={showing.location} onChange={e => updateShowing(showing.id, 'location', e.target.value)} /></div><div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3"><Select value={String(showing.news_id ?? 'null')} onValueChange={v => updateShowing(showing.id, 'news_id', v === 'null' ? null : parseInt(v))} disabled={!!showing.external_link}><SelectTrigger><SelectValue placeholder="Poveži vijest..." /></SelectTrigger><SelectContent><SelectItem value="null">-- Bez vijesti --</SelectItem>{newsList.map(n => <SelectItem key={n.id} value={String(n.id)}>{n.title}</SelectItem>)}</SelectContent></Select><span className="text-sm text-muted-foreground">ILI</span><Input placeholder="Vanjski link (URL)" value={showing.external_link ?? ''} onChange={e => updateShowing(showing.id, 'external_link', e.target.value)} disabled={!!showing.news_id} /></div><div className="flex justify-end -mt-2"><Button type="button" variant="ghost" size="icon" onClick={() => removeShowing(showing.id)}><X className="h-4 w-4 text-destructive" /></Button></div></div>))}
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
