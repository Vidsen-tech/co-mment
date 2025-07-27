import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Trash2, Edit, Save, X, Loader2, Ban, PlusCircle, CheckCircle, Badge, UploadCloud } from 'lucide-react';
import type { WorkTableRow, NewsSelectItem } from '@/types';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/RichTextEditor';

interface Props {
    open: boolean;
    onClose: () => void;
    work: WorkTableRow | null;
    newsList: NewsSelectItem[];
}

interface ImageForDisplay {
    key: string;
    isNew: boolean;
    originalIndex: number;
    id?: number;
    url: string;
    author: string;
    is_thumbnail: boolean;
}

interface ShowingItem {
    id: number | string;
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

interface UpdateWorkForm {
    translations: {
        hr: { title: string; description: string; credits: Record<string, string> };
        en: { title: string; description: string; credits: Record<string, string> };
    };
    premiere_date: string;
    is_active: boolean;
    showings: (Omit<ShowingItem, 'id' | 'performance_date'> & { id?: number, performance_date: string })[];
    new_images: File[];
    new_image_data: { author: string, is_thumbnail: boolean }[];
    existing_images: { id: number, author: string, is_thumbnail: boolean }[];
    remove_image_ids: number[];
    _method: 'PUT';
}

const WorkDetailsModal: React.FC<Props> = ({ open, onClose, work, newsList }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeLocale, setActiveLocale] = useState<'hr' | 'en'>('hr');
    const [showings, setShowings] = useState<ShowingItem[]>([]);
    const [credits, setCredits] = useState<{ hr: CreditItem[], en: CreditItem[] }>({ hr: [], en: [] });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<UpdateWorkForm>({
        translations: { hr: { title: '', description: '', credits: {} }, en: { title: '', description: '', credits: {} } },
        premiere_date: '',
        is_active: true,
        showings: [],
        new_images: [],
        new_image_data: [],
        existing_images: [],
        remove_image_ids: [],
        _method: 'PUT',
    });

    const [imagesForDisplay, setImagesForDisplay] = useState<ImageForDisplay[]>([]);

    const populateForm = useCallback((w: WorkTableRow) => {
        // This is where the build-breaking typo was. It's fixed now.
        const hrCredits = w.translations.hr?.credits ? Object.entries(w.translations.hr.credits).map(([role, name]) => ({ id: uuidv4(), role, name: name as string })) : [];
        const enCredits = w.translations.en?.credits ? Object.entries(w.translations.en.credits).map(([role, name]) => ({ id: uuidv4(), role, name: name as string })) : [];
        setCredits({ hr: hrCredits, en: enCredits });

        setShowings(w.showings.map(s => ({ ...s, performance_date: s.performance_date ? s.performance_date.replace(' ', 'T') : '' })));

        const displayImages = w.images.map((img, index) => ({
            key: `exist-${img.id}`,
            isNew: false,
            id: img.id,
            originalIndex: index,
            url: img.url,
            author: img.author ?? '',
            is_thumbnail: img.is_thumbnail,
        }));
        setImagesForDisplay(displayImages);

        setData(d => ({
            ...d,
            translations: {
                hr: { title: w.translations.hr?.title ?? '', description: w.translations.hr?.description ?? '', credits: {} },
                en: { title: w.translations.en?.title ?? '', description: w.translations.en?.description ?? '', credits: {} },
            },
            premiere_date: w.premiere_date,
            is_active: w.is_active,
            new_images: [],
            new_image_data: [],
            remove_image_ids: [],
        }));
    }, [setData]);

    useEffect(() => {
        if (open && work) {
            populateForm(work);
            clearErrors();
        }
        if (!open) {
            imagesForDisplay.forEach(img => { if (img.isNew) URL.revokeObjectURL(img.url); });
            setImagesForDisplay([]);
            setIsEditing(false);
            setActiveLocale('hr');
            setShowings([]);
            setCredits({ hr: [], en: [] });
            reset();
        }
    }, [open, work, populateForm, clearErrors, reset]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);

        const newDisplayImages: ImageForDisplay[] = newFiles.map((file, index) => ({
            key: `new-${file.name}-${Date.now()}-${index}`,
            isNew: true,
            originalIndex: data.new_images.length + index,
            url: URL.createObjectURL(file),
            author: '',
            is_thumbnail: imagesForDisplay.filter(img => !data.remove_image_ids.includes(img.id!)).length === 0 && index === 0,
        }));

        setImagesForDisplay(prev => [...prev, ...newDisplayImages]);
        setData(d => ({
            ...d,
            new_images: [...d.new_images, ...newFiles],
        }));
    };

    const removeImage = (key: string) => {
        const imgToRemove = imagesForDisplay.find(i => i.key === key);
        if (!imgToRemove) return;

        if (imgToRemove.isNew) {
            URL.revokeObjectURL(imgToRemove.url);
        } else if (imgToRemove.id) {
            setData('remove_image_ids', [...data.remove_image_ids, imgToRemove.id]);
        }

        const remainingImages = imagesForDisplay.filter(i => i.key !== key);
        if (imgToRemove.is_thumbnail && remainingImages.length > 0) {
            remainingImages[0].is_thumbnail = true;
        }
        setImagesForDisplay(remainingImages);
    };

    const updateImageAuthor = (key: string, author: string) => {
        setImagesForDisplay(prev => prev.map(i => i.key === key ? { ...i, author } : i));
    };

    const setAsThumbnail = (key: string) => {
        setImagesForDisplay(prev => prev.map(i => ({ ...i, is_thumbnail: i.key === key })));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!work) return;

        const formattedCreditsHr = credits.hr.reduce((acc, credit) => { if (credit.role) acc[credit.role] = credit.name; return acc; }, {} as Record<string, string>);
        const formattedCreditsEn = credits.en.reduce((acc, credit) => { if (credit.role) acc[credit.role] = credit.name; return acc; }, {} as Record<string, string>);

        const showingsForSubmission = showings.map(({ id, ...rest }) => ({ ...(typeof id === 'number' && { id }), ...rest }));

        const visibleImages = imagesForDisplay.filter(i => !data.remove_image_ids.includes(i.id!));

        const existingImagesForSubmission = visibleImages
            .filter(i => !i.isNew && i.id)
            .map(i => ({ id: i.id!, author: i.author, is_thumbnail: i.is_thumbnail }));

        const newImageDataForSubmission = visibleImages
            .filter(i => i.isNew)
            .map(i => ({ author: i.author, is_thumbnail: i.is_thumbnail }));

        const newImagesForSubmission = data.new_images.filter(file => visibleImages.some(img => img.isNew && img.url.endsWith(file.name)));


        setData(d => ({
            ...d,
            showings: showingsForSubmission,
            translations: {
                hr: { ...d.translations.hr, credits: formattedCreditsHr },
                en: { ...d.translations.en, credits: formattedCreditsEn },
            },
            existing_images: existingImagesForSubmission,
            new_image_data: newImageDataForSubmission,
            new_images: newImagesForSubmission
        }));
        setIsSubmitting(true);
    };

    useEffect(() => {
        if (isSubmitting && work) {
            post(route('works.update', work.id), {
                preserveScroll: true,
                onSuccess: () => { toast.success('Rad uspješno ažuriran!'); onClose(); },
                onError: (e) => { toast.error('Greška pri ažuriranju rada. Provjerite polja.'); console.error("Update Error:", e); },
                onFinish: () => setIsSubmitting(false),
            });
        }
    }, [isSubmitting, work, post]);

    const addCredit = (locale: 'hr' | 'en') => setCredits(p => ({ ...p, [locale]: [...p[locale], { id: uuidv4(), role: '', name: '' }] }));
    const removeCredit = (locale: 'hr' | 'en', id: string) => setCredits(p => ({ ...p, [locale]: p[locale].filter(c => c.id !== id) }));
    const updateCredit = (locale: 'hr' | 'en', id: string, field: 'role' | 'name', value: string) => setCredits(p => ({ ...p, [locale]: p[locale].map(c => c.id === id ? { ...c, [field]: value } : c) }));
    const addShowing = () => setShowings(p => [...p, { id: uuidv4(), performance_date: '', location: '', news_id: null, external_link: null }]);
    const removeShowing = (id: number | string) => setShowings(p => p.filter(s => s.id !== id));
    const updateShowing = (id: number | string, field: keyof Omit<ShowingItem, 'id'>, value: string | number | null) => {
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

    const visibleImages = useMemo(() => imagesForDisplay.filter(i => !data.remove_image_ids.includes(i.id!)), [imagesForDisplay, data.remove_image_ids]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] md:max-w-[1000px] flex flex-col h-[90vh] p-0">
                {work && (
                    <form id="work-details-form" className="flex flex-col h-full" onSubmit={handleSave}>
                        <DialogHeader className="shrink-0 p-6 border-b"><DialogTitle className="text-2xl font-semibold">{isEditing ? `Uređivanje: ${work.title}` : work.title}</DialogTitle><DialogDescription>Kreirano: {work.created_at} | Zadnja izmjena: {work.updated_at}</DialogDescription></DialogHeader>
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="space-y-6 p-6">
                                {isEditing && <div className="flex items-center gap-4"><Label>Jezik unosa:</Label><ToggleGroup type="single" value={activeLocale} onValueChange={(v: 'hr' | 'en') => v && setActiveLocale(v)}><ToggleGroupItem value="hr">Hrvatski</ToggleGroupItem><ToggleGroupItem value="en">Engleski</ToggleGroupItem></ToggleGroup></div>}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-4">
                                        {Object.keys(credits).map((locale) => (
                                            <div key={locale} className={cn('space-y-6', !isEditing || activeLocale === locale ? 'block' : 'hidden')}>
                                                <div><Label>Naslov ({locale.toUpperCase()})</Label>{isEditing ? <Input value={data.translations[locale as 'hr'|'en'].title} onChange={e => setData(`translations.${locale}.title` as any, e.target.value)} /> : <p className="mt-1">{data.translations[locale as 'hr'|'en']?.title || '-'}</p>}</div>
                                                <div><Label>Opis ({locale.toUpperCase()})</Label>{isEditing ? <RichTextEditor content={data.translations[locale as 'hr' | 'en'].description} onChange={(c) => setData(`translations.${locale}.description` as any, c)} /> : <div className="prose dark:prose-invert max-w-none mt-1 text-sm" dangerouslySetInnerHTML={{ __html: data.translations[locale as 'hr'|'en']?.description || '-' }} />}</div>
                                                <div><div className="flex items-center justify-between mb-2"><Label>Autorski tim ({locale.toUpperCase()})</Label>{isEditing && <Button size="sm" type="button" variant="outline" onClick={() => addCredit(locale as 'hr'|'en')}><PlusCircle className="h-4 w-4 mr-2" /> Dodaj</Button>}</div><div className="space-y-2">{credits[locale as 'hr'|'en'].map((credit) => isEditing ? <div key={credit.id} className="flex items-center gap-2"><Input placeholder="Uloga" value={credit.role} onChange={e => updateCredit(locale as 'hr'|'en', credit.id, 'role', e.target.value)} /><Input placeholder="Ime" value={credit.name} onChange={e => updateCredit(locale as 'hr'|'en', credit.id, 'name', e.target.value)} /><Button type="button" variant="ghost" size="icon" onClick={() => removeCredit(locale as 'hr'|'en', credit.id)}><X className="h-4 w-4 text-destructive" /></Button></div> : <div key={credit.id} className="grid grid-cols-3 text-sm"><dt className="font-semibold">{credit.role}:</dt><dd className="col-span-2">{credit.name}</dd></div>)}</div></div>
                                            </div>
                                        ))}
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div><Label>Datum premijere</Label>{isEditing ? <Input type="date" value={data.premiere_date} onChange={e => setData('premiere_date', e.target.value)} /> : <p className="mt-1">{new Date(data.premiere_date).toLocaleDateString('hr-HR')}</p>}</div>
                                            <div><Label>Status</Label>{isEditing ? <div className="flex items-center gap-2 mt-2"><Switch checked={data.is_active} onCheckedChange={c => setData('is_active', c)} /><span>{data.is_active ? 'Aktivan' : 'Neaktivan'}</span></div> : <div className="flex items-center gap-2 mt-1">{data.is_active ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Ban className="h-5 w-5 text-red-500" />}<span>{data.is_active ? 'Aktivan' : 'Neaktivan'}</span></div>}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Slike</Label>
                                        {isEditing && <div className="border border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary"><Label htmlFor="img-up-det" className="flex flex-col items-center"><UploadCloud className="h-8 w-8" /><span>Dodaj slike</span></Label><Input id="img-up-det" type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only" /></div>}
                                        <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">{visibleImages.map((img) => (<div key={img.key} className="relative group border rounded-lg p-2 space-y-2"><img src={img.url} alt="Slika" className="aspect-video w-full object-cover rounded" />{isEditing ? (<><Input placeholder="Autor" value={img.author} onChange={e => updateImageAuthor(img.key, e.target.value)} className="h-8" /><div className="flex items-center justify-between"><Label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="thumb_edit" checked={img.is_thumbnail} onChange={() => setAsThumbnail(img.key)} />Naslovna</Label><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeImage(img.key)}><Trash2 className="h-4" /></Button></div></>) : (<div className="text-xs truncate">{img.author && <span>Autor: {img.author}</span>}{img.is_thumbnail && <Badge className="ml-2">Naslovna</Badge>}</div>)}</div>))}</div>
                                    </div>
                                </div>
                                <div className="pt-8 space-y-4">
                                    <div className="flex items-center justify-between"><h3 className="text-lg font-medium">Izvedbe</h3>{isEditing && <Button type="button" variant="outline" size="sm" onClick={addShowing}><PlusCircle className="h-4 w-4 mr-2" /> Dodaj</Button>}</div>
                                    <div className="space-y-3">{showings.map((showing) => (<div key={showing.id} className="grid items-start gap-3 p-3 rounded-md bg-muted/50">{isEditing ? (<><div className="grid grid-cols-2 gap-3"><Input type="datetime-local" value={showing.performance_date} onChange={e => updateShowing(showing.id, 'performance_date', e.target.value)} /><Input placeholder="Lokacija" value={showing.location} onChange={e => updateShowing(showing.id, 'location', e.target.value)} /></div><div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3"><Select value={String(showing.news_id ?? 'null')} onValueChange={v => updateShowing(showing.id, 'news_id', v === 'null' ? null : parseInt(v))} disabled={!!showing.external_link}><SelectTrigger><SelectValue placeholder="Poveži vijest..." /></SelectTrigger><SelectContent><SelectItem value="null">-- Bez vijesti --</SelectItem>{newsList.map(n => <SelectItem key={n.id} value={String(n.id)}>{n.title}</SelectItem>)}</SelectContent></Select><span className="text-sm text-muted-foreground">ILI</span><Input placeholder="Vanjski link (URL)" value={showing.external_link ?? ''} onChange={e => updateShowing(showing.id, 'external_link', e.target.value)} disabled={!!showing.news_id} /></div><div className="flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => removeShowing(showing.id)}><X className="h-4 w-4 text-destructive" /></Button></div></>) : (<div className="flex items-center gap-4 text-sm"><span className="flex-1 font-mono">{showing.performance_date ? new Date(showing.performance_date).toLocaleString('hr-HR') : 'N/A'}</span><span className="flex-1">{showing.location}</span><div className="flex-1 text-muted-foreground">{showing.news_id ? `Vijest: ${newsList.find(n => n.id === showing.news_id)?.title ?? 'N/A'}`: showing.external_link ? <a href={showing.external_link} target="_blank" rel="noreferrer" className="text-primary hover:underline">Link</a> : '--'}</div></div>)}</div>))}</div>
                                </div>
                            </div>
                        </ScrollArea>
                        <DialogFooter className="shrink-0 p-6 border-t bg-background flex items-center justify-between">
                            <Button variant="outline" onClick={onClose} type="button">Zatvori</Button>
                            <div className="flex gap-2">
                                {isEditing ? (<><Button variant="outline" onClick={() => setIsEditing(false)} disabled={processing} type="button"><X className="mr-2 h-4" /> Otkaži</Button><Button type="submit" disabled={processing}>{processing ? <Loader2 className="mr-2 h-4 animate-spin" /> : <Save className="mr-2 h-4" />} Spremi promjene</Button></>) : (<Button onClick={() => setIsEditing(true)} type="button"><Edit className="mr-2 h-4" /> Uredi</Button>)}
                            </div>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default WorkDetailsModal;
