import React, { useState, useCallback, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, Trash2, Loader2, Save, PlusCircle, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/RichTextEditor';
import type { NewsSelectItem } from '@/types';

// --- Type Definitions ---
interface Props {
    open: boolean;
    onClose: () => void;
    newsList: NewsSelectItem[];
}

interface ShowingItem {
    id: string; // React key
    performance_date: string;
    location: string;
    news_id: number | null;
    external_link: string | null;
}

interface CreditItem {
    id: string; // React key and D&D id
    role: string;
    name: string;
}

interface ImageItem {
    id: string; // D&D id
    file: File;
    previewUrl: string;
    author: string;
    is_thumbnail: boolean;
}


// --- Draggable Components ---

const SortableCreditItem = ({ credit, onUpdate, onRemove }: { credit: CreditItem, onUpdate: (id: string, field: 'role' | 'name', value: string) => void, onRemove: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: credit.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto' };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md shadow-sm">
            <button type="button" {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground hover:text-foreground"><GripVertical className="h-5 w-5" /></button>
            <Input placeholder="Uloga (npr. Režija)" value={credit.role} onChange={e => onUpdate(credit.id, 'role', e.target.value)} />
            <Input placeholder="Ime i prezime" value={credit.name} onChange={e => onUpdate(credit.id, 'name', e.target.value)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(credit.id)}><X className="h-4 w-4 text-destructive" /></Button>
        </div>
    );
};

const SortableImageItem = ({ image, onUpdateAuthor, onSetThumbnail, onRemove }: { image: ImageItem, onUpdateAuthor: (id: string, author: string) => void, onSetThumbnail: (id: string) => void, onRemove: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto', opacity: isDragging ? 0.8 : 1 };

    return (
        <div ref={setNodeRef} style={style} className="relative border rounded-lg p-2 space-y-2 bg-background shadow-sm">
            <button type="button" {...attributes} {...listeners} className="absolute top-1 left-1 z-10 cursor-grab bg-black/40 text-white rounded-full p-1"><GripVertical size={16} /></button>
            <img src={image.previewUrl} alt={`preview ${image.file.name}`} className="aspect-video w-full object-cover rounded bg-muted" />
            <Input type="text" placeholder="Autor (opcionalno)" value={image.author} onChange={e => onUpdateAuthor(image.id, e.target.value)} className="h-8 text-sm" />
            <div className="flex items-center justify-between pt-1">
                <Label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                    <input type="radio" name="thumb_radio_create" checked={image.is_thumbnail} onChange={() => onSetThumbnail(image.id)} />
                    Naslovna
                </Label>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => onRemove(image.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};


// --- Main Modal Component ---

const WorkCreateModal: React.FC<Props> = ({ open, onClose, newsList }) => {
    const [activeLocale, setActiveLocale] = useState<'hr' | 'en'>('hr');
    const [images, setImages] = useState<ImageItem[]>([]);
    const [showings, setShowings] = useState<ShowingItem[]>([]);
    const [credits, setCredits] = useState<{ hr: CreditItem[], en: CreditItem[] }>({ hr: [], en: [] });

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        translations: {
            hr: { title: '', description: '' },
            en: { title: '', description: '' },
        },
        premiere_date: new Date().toISOString().split('T')[0],
    });

    const handleClose = useCallback(() => {
        images.forEach(i => URL.revokeObjectURL(i.previewUrl));
        setImages([]);
        setShowings([]);
        setCredits({ hr: [], en: [] });
        reset();
        clearErrors();
        setActiveLocale('hr');
        onClose();
    }, [images, onClose, reset, clearErrors]);

    // --- D&D Sensors ---
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    // --- Image Handlers ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        const newImageItems: ImageItem[] = newFiles.map(file => ({
            id: uuidv4(),
            file,
            previewUrl: URL.createObjectURL(file),
            author: '',
            is_thumbnail: false,
        }));

        setImages(prev => {
            const combined = [...prev, ...newImageItems];
            if (!combined.some(i => i.is_thumbnail)) {
                combined[0].is_thumbnail = true;
            }
            return combined;
        });
    };

    const removeImage = (idToRemove: string) => {
        const imageToRemove = images.find(i => i.id === idToRemove);
        if (imageToRemove) URL.revokeObjectURL(imageToRemove.previewUrl);

        setImages(prev => {
            const next = prev.filter(i => i.id !== idToRemove);
            if (imageToRemove?.is_thumbnail && next.length > 0 && !next.some(img => img.is_thumbnail)) {
                next[0].is_thumbnail = true;
            }
            return next;
        });
    };

    const updateImageAuthor = (id: string, author: string) => {
        setImages(prev => prev.map(i => i.id === id ? { ...i, author } : i));
    };

    const setThumbnail = (id: string) => {
        setImages(prev => prev.map(i => ({ ...i, is_thumbnail: i.id === id })));
    };

    const handleImageDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setImages((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // --- Showings Handlers ---
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

    // --- Credits Handlers ---
    const addCredit = (locale: 'hr' | 'en') => setCredits(p => ({ ...p, [locale]: [...p[locale], { id: uuidv4(), role: '', name: '' }] }));
    const removeCredit = (locale: 'hr' | 'en', id: string) => setCredits(p => ({ ...p, [locale]: p[locale].filter(c => c.id !== id) }));
    const updateCredit = (locale: 'hr' | 'en', id: string, field: 'role' | 'name', value: string) => {
        setCredits(p => ({ ...p, [locale]: p[locale].map(c => c.id === id ? { ...c, [field]: value } : c) }));
    };

    const handleCreditDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setCredits(items => {
                const activeLocaleCredits = items[activeLocale];
                const oldIndex = activeLocaleCredits.findIndex(item => item.id === active.id);
                const newIndex = activeLocaleCredits.findIndex(item => item.id === over.id);
                return {
                    ...items,
                    [activeLocale]: arrayMove(activeLocaleCredits, oldIndex, newIndex)
                };
            });
        }
    };

    // --- Form Submission ---
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare data in the format the backend expects
        const submissionData = {
            ...data,
            translations: {
                hr: { ...data.translations.hr, credits: credits.hr.map(({id, ...rest}) => rest) },
                en: { ...data.translations.en, credits: credits.en.map(({id, ...rest}) => rest) },
            },
            showings: showings.map(({ id, ...rest }) => rest),
            images: images.map(i => i.file),
            image_authors: images.map(i => i.author),
            thumbnail_index: images.findIndex(i => i.is_thumbnail),
        };

        router.post(route('works.store'), submissionData, {
            forceFormData: true, // IMPORTANT for file uploads
            onSuccess: () => {
                toast.success('Novi rad uspješno stvoren!');
                handleClose();
            },
            onError: (err) => {
                console.error("Validation errors:", err);
                toast.error('Greška pri stvaranju. Provjerite jesu li sva obavezna polja ispunjena.');
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
                                <div><Label htmlFor={`title-${locale}`}>Naslov ({locale.toUpperCase()}) {locale === 'hr' && '*'}</Label><Input id={`title-${locale}`} value={data.translations[locale as 'hr'|'en'].title} onChange={e => setData(d=>({...d, translations: {...d.translations, [locale]: {...d.translations[locale as 'hr'|'en'], title: e.target.value}}}))} className={cn(getError(`translations.${locale}.title`) && 'border-red-500')} /></div>
                                <div><Label htmlFor={`description-${locale}`}>Opis ({locale.toUpperCase()}) {locale === 'hr' && '*'}</Label><RichTextEditor content={data.translations[locale as 'hr'|'en'].description} onChange={(newContent) => setData(d=>({...d, translations: {...d.translations, [locale]: {...d.translations[locale as 'hr'|'en'], description: newContent}}}))} /></div>
                                <div>
                                    <div className="flex items-center justify-between mb-2"><Label>Autorski tim ({locale.toUpperCase()})</Label><Button size="sm" type="button" variant="outline" onClick={() => addCredit(locale as 'hr'|'en')}><PlusCircle className="h-4 w-4 mr-2" /> Dodaj unos</Button></div>
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCreditDragEnd}>
                                        <SortableContext items={credits[locale as 'hr'|'en'].map(c => c.id)} strategy={verticalListSortingStrategy}>
                                            <div className="space-y-2">
                                                {credits[locale as 'hr'|'en'].map((credit) => (
                                                    <SortableCreditItem key={credit.id} credit={credit} onUpdate={(id, field, value) => updateCredit(locale as 'hr'|'en', id, field, value)} onRemove={(id) => removeCredit(locale as 'hr'|'en', id)} />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </div>
                        ))}

                        <div className="pt-4"><Label htmlFor="premiere_date">Datum premijere *</Label><Input id="premiere_date" type="date" value={data.premiere_date} onChange={e => setData('premiere_date', e.target.value)} className={cn(errors.premiere_date && 'border-red-500')} /></div>

                        <div className="pt-4"><Label>Slike</Label><div className="mt-1 border border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors"><Label htmlFor="image-upload-create" className="cursor-pointer flex flex-col items-center justify-center"><UploadCloud className="h-8 w-8 text-muted-foreground" /> <span className="mt-2 font-medium text-primary">Kliknite za upload</span></Label><Input id="image-upload-create" type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only" /></div></div>

                        {images.length > 0 && (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleImageDragEnd}>
                                <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {images.map(image => (
                                            <SortableImageItem key={image.id} image={image} onUpdateAuthor={updateImageAuthor} onSetThumbnail={setThumbnail} onRemove={removeImage} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}

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
