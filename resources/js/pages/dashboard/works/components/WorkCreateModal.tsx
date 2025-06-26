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
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { UploadCloud, Trash2, Loader2, Save, PlusCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

// --- Types ---
interface Props {
    open: boolean;
    onClose: () => void;
}
interface ImagePreview {
    url: string;
    name: string;
}
interface FormShowing {
    id: string;
    performance_date: string;
    location: string;
}
interface CreateWorkForm {
    translations: {
        hr: { title: string; description: string; };
        en: { title: string; description: string; };
    };
    premiere_date: string;
    images: File[];
    image_authors: (string | null)[];
    thumbnail_index: number | null;
    showings: { performance_date: string; location: string; }[];
}

// --- Main Component ---
const WorkCreateModal: React.FC<Props> = ({ open, onClose }) => {
    const [activeLocale, setActiveLocale] = useState<'hr' | 'en'>('hr');
    const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
    const [formShowings, setFormShowings] = useState<FormShowing[]>([]);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<CreateWorkForm>({
        translations: { hr: { title: '', description: '' }, en: { title: '', description: '' } },
        premiere_date: new Date().toISOString().split('T')[0],
        images: [],
        image_authors: [],
        thumbnail_index: null,
        showings: [],
    });

    useEffect(() => {
        setData('showings', formShowings.map(({ performance_date, location }) => ({ performance_date, location })));
    }, [formShowings, setData]);

    const addShowing = () => {
        setFormShowings(prev => [...prev, { id: uuidv4(), performance_date: '', location: '' }]);
    };
    const removeShowing = (id: string) => {
        setFormShowings(prev => prev.filter(s => s.id !== id));
    };
    const updateShowing = (id: string, field: 'performance_date' | 'location', value: string) => {
        setFormShowings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleClose = useCallback(() => {
        imagePreviews.forEach(p => URL.revokeObjectURL(p.url));
        setImagePreviews([]);
        setFormShowings([]);
        reset();
        setActiveLocale('hr');
        onClose();
    }, [imagePreviews, onClose, reset]);

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

    // ★★★ Helper functions to manage image data in the form state ★★★
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
        post(route('works.store'), {
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
            <DialogContent className="sm:max-w-[600px] md:max-w-[900px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">Stvori novi rad</DialogTitle>
                    <DialogDescription>
                        Ispunite polja za novi rad. Polja označena sa * su obavezna.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} id="work-create-form" className="space-y-6 py-4">
                    <ScrollArea className="max-h-[75vh] pr-6">
                        {/* Language Toggle */}
                        <div className="flex items-center gap-4">
                            <Label>Jezik unosa:</Label>
                            <ToggleGroup type="single" value={activeLocale} onValueChange={(v: 'hr' | 'en') => v && setActiveLocale(v)}>
                                <ToggleGroupItem value="hr">Hrvatski</ToggleGroupItem>
                                <ToggleGroupItem value="en">Engleski</ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        {/* Translated Fields */}
                        {Object.keys(data.translations).map((locale) => (
                            <div key={locale} className={cn('space-y-4 mt-4', activeLocale === locale ? 'block' : 'hidden')}>
                                <div>
                                    <Label htmlFor={`title-${locale}`}>Naslov ({locale.toUpperCase()}) {locale === 'hr' && '*'}</Label>
                                    <Input id={`title-${locale}`} value={data.translations[locale as 'hr'|'en'].title} onChange={e => setData(d => ({...d, translations: {...d.translations, [locale]: { ...d.translations[locale as 'hr'|'en'], title: e.target.value }}}))} className={cn(getError(`translations.${locale}.title`) && 'border-red-500')} />
                                </div>
                                <div>
                                    <Label htmlFor={`description-${locale}`}>Opis ({locale.toUpperCase()}) {locale === 'hr' && '*'}</Label>
                                    <Textarea id={`description-${locale}`} rows={8} value={data.translations[locale as 'hr'|'en'].description} onChange={e => setData(d => ({...d, translations: {...d.translations, [locale]: {...d.translations[locale as 'hr'|'en'], description: e.target.value }}}))} className={cn(getError(`translations.${locale}.description`) && 'border-red-500')} />
                                </div>
                            </div>
                        ))}

                        {/* Premiere Date */}
                        <div className="pt-4">
                            <Label htmlFor="premiere_date">Datum premijere *</Label>
                            <Input id="premiere_date" type="date" value={data.premiere_date} onChange={e => setData('premiere_date', e.target.value)} className={cn(errors.premiere_date && 'border-red-500')} />
                        </div>

                        {/* Image Uploader */}
                        <div className="pt-4">
                            <Label>Slike</Label>
                            <div className="mt-1 border border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors">
                                <Label htmlFor="image-upload-create" className="cursor-pointer flex flex-col items-center justify-center"><UploadCloud className="h-8 w-8 text-muted-foreground" /> <span className="mt-2 font-medium text-primary">Kliknite za upload</span><span className="text-xs text-muted-foreground">ili povucite slike ovdje</span></Label>
                                <Input id="image-upload-create" type="file" multiple accept="image/*" onChange={onFileChange} className="sr-only" />
                            </div>
                        </div>

                        {/* ★★★ Image Preview Section ★★★ */}
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {imagePreviews.map((preview, idx) => (
                                    <div key={preview.name + idx} className="relative border rounded-lg p-2 space-y-2 bg-background">
                                        <img src={preview.url} alt={`preview ${idx}`} className="aspect-video w-full object-cover rounded bg-muted" />
                                        <Input type="text" placeholder="Autor (opcionalno)" value={data.image_authors[idx] ?? ''} onChange={e => setAuthor(idx, e.target.value)} className="h-8 text-sm" />
                                        <div className="flex items-center justify-between pt-1">
                                            <Label htmlFor={`thumb-create-${idx}`} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                                                <input type="radio" id={`thumb-create-${idx}`} name="thumb_radio_create" checked={data.thumbnail_index === idx} onChange={() => setThumbnail(idx)} />
                                                Naslovna
                                            </Label>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeImage(idx)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Showings/Performances Section */}
                        <div className="pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Izvedbe</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addShowing}><PlusCircle className="h-4 w-4 mr-2" /> Dodaj izvedbu</Button>
                            </div>
                            {formShowings.map((showing) => (
                                <div key={showing.id} className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                                    <Input type="datetime-local" value={showing.performance_date} onChange={e => updateShowing(showing.id, 'performance_date', e.target.value)} className="flex-1" />
                                    <Input placeholder="Lokacija" value={showing.location} onChange={e => updateShowing(showing.id, 'location', e.target.value)} className="flex-1" />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeShowing(showing.id)}><X className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </form>
                <DialogFooter className="mt-6 pt-4 border-t">
                    <DialogClose asChild><Button variant="outline" disabled={processing}>Otkaži</Button></DialogClose>
                    <Button type="submit" form="work-create-form" disabled={processing}>{processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Stvori rad</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WorkCreateModal;
