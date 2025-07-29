import React, { useEffect, useState, useCallback, DragEvent } from 'react';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Trash2, Edit, Save, X, Loader2, Ban, PlusCircle, CheckCircle, Badge, UploadCloud, GripVertical } from 'lucide-react';
import type { WorkTableRow, NewsSelectItem } from '@/types';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/RichTextEditor';

// --- Type Definitions ---
interface Props {
    open: boolean;
    onClose: () => void;
    work: WorkTableRow | null;
    newsList: NewsSelectItem[];
}

interface ImageItem {
    id: number | string;
    file?: File;
    previewUrl: string;
    author: string;
    is_thumbnail: boolean;
    is_new: boolean;
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

// --- Draggable Components ---
const SortableCreditItem = ({ credit, onUpdate, onRemove }: { credit: CreditItem, onUpdate: (id: string, field: 'role' | 'name', value: string) => void, onRemove: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: credit.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto' };
    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md shadow-sm">
            <button type="button" {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground hover:text-foreground touch-none"><GripVertical className="h-5 w-5" /></button>
            <Input placeholder="Uloga (npr. Režija)" value={credit.role} onChange={e => onUpdate(credit.id, 'role', e.target.value)} />
            <Input placeholder="Ime i prezime" value={credit.name} onChange={e => onUpdate(credit.id, 'name', e.target.value)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(credit.id)}><X className="h-4 w-4 text-destructive" /></Button>
        </div>
    );
};

const SortableImageItem = ({ image, onUpdateAuthor, onSetThumbnail, onRemove }: { image: ImageItem, onUpdateAuthor: (id: number | string, author: string) => void, onSetThumbnail: (id: number | string) => void, onRemove: (id: number | string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto', opacity: isDragging ? 0.8 : 1 };
    return (
        <div ref={setNodeRef} style={style} className="relative border rounded-lg p-2 space-y-2 bg-background shadow-sm">
            <button type="button" {...attributes} {...listeners} className="absolute top-1 left-1 z-10 cursor-grab bg-black/40 text-white rounded-full p-1 touch-none"><GripVertical size={16} /></button>
            <img src={image.previewUrl} alt="Slika" className="aspect-video w-full object-cover rounded" />
            <Input placeholder="Autor" value={image.author} onChange={e => onUpdateAuthor(image.id, e.target.value)} className="h-8" />
            <div className="flex items-center justify-between"><Label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="thumb_edit" checked={image.is_thumbnail} onChange={() => onSetThumbnail(image.id)} />Naslovna</Label><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onRemove(image.id)}><Trash2 className="h-4" /></Button></div>
        </div>
    );
};

// --- Main Modal Component ---
const WorkDetailsModal: React.FC<Props> = ({ open, onClose, work, newsList }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeLocale, setActiveLocale] = useState<'hr' | 'en'>('hr');
    const [showings, setShowings] = useState<ShowingItem[]>([]);
    const [credits, setCredits] = useState<{ hr: CreditItem[], en: CreditItem[] }>({ hr: [], en: [] });
    const [images, setImages] = useState<ImageItem[]>([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const { data, setData, processing, errors, reset, clearErrors } = useForm({
        translations: { hr: { title: '', description: '' }, en: { title: '', description: '' } },
        premiere_date: '',
        is_active: true,
    });

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    // ★★★ FIX: Added all state setters to the dependency array for this memoized function ★★★
    const populateForm = useCallback((w: WorkTableRow) => {
        const parseCredits = (creditsData: any): CreditItem[] => {
            if (Array.isArray(creditsData)) return creditsData.map(c => ({ ...c, id: uuidv4() }));
            return [];
        };
        setData({
            translations: {
                hr: { title: w.translations.hr?.title ?? '', description: w.translations.hr?.description ?? '' },
                en: { title: w.translations.en?.title ?? '', description: w.translations.en?.description ?? '' },
            },
            premiere_date: w.premiere_date,
            is_active: w.is_active,
        });
        setCredits({ hr: parseCredits(w.translations.hr?.credits), en: parseCredits(w.translations.en?.credits) });
        setShowings(w.showings.map(s => ({ ...s, id: s.id ?? uuidv4(), performance_date: s.performance_date ? s.performance_date.replace(' ', 'T') : '' })));
        setImages(w.images.map(img => ({ id: img.id, previewUrl: img.url, author: img.author ?? '', is_thumbnail: img.is_thumbnail, is_new: false })));
    }, [setData, setCredits, setShowings, setImages]);

    // ★★★ FIX: Removed `images` from the dependency array to prevent the infinite loop ★★★
    useEffect(() => {
        if (open && work) {
            populateForm(work);
            clearErrors();
        }
        if (!open) {
            // This cleanup code now runs ONLY when the modal is closed.
            images.forEach(img => { if (img.is_new && img.previewUrl) URL.revokeObjectURL(img.previewUrl); });
            // Reset all state
            setIsEditing(false);
            setActiveLocale('hr');
            setImages([]);
            setShowings([]);
            setCredits({ hr: [], en: [] });
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, work, populateForm, clearErrors, reset]);


    const addFiles = (files: File[]) => {
        const newImageItems: ImageItem[] = files
            .filter(file => file.type.startsWith('image/'))
            .map(file => ({
                id: uuidv4(),
                file,
                previewUrl: URL.createObjectURL(file),
                author: '',
                is_thumbnail: false,
                is_new: true,
            }));

        if (newImageItems.length === 0) return;

        setImages(prev => {
            const combined = [...prev, ...newImageItems];
            if (!combined.some(i => i.is_thumbnail)) {
                const first = combined.find(i => i);
                if (first) first.is_thumbnail = true;
            }
            return combined;
        });
    };

    const handleFileChange = useCallback((e: React.ChangeEvent<IputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
    }, []);

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
    };

    const removeImage = (idToRemove: number | string) => {
        const imageToRemove = images.find(i => i.id === idToRemove);
        if (imageToRemove?.is_new) URL.revokeObjectURL(imageToRemove.previewUrl);
        setImages(prev => {
            const next = prev.filter(i => i.id !== idToRemove);
            if (imageToRemove?.is_thumbnail && next.length > 0 && !next.some(img => img.is_thumbnail)) {
                next[0].is_thumbnail = true;
            }
            return next;
        });
    };

    const updateImageAuthor = (id: number | string, author: string) => setImages(p => p.map(i => i.id === id ? { ...i, author } : i));
    const setThumbnail = (id: number | string) => setImages(p => p.map(i => ({ ...i, is_thumbnail: i.id === id })));
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

    const handleSave = () => {
        if (!work) return;

        const orderedImagesPayload = images.map(({ file, previewUrl, ...rest }) => rest);
        const newImageFiles = images.filter(i => i.is_new).map(i => i.file!);

        router.post(route('works.update', work.id), {
            _method: 'PUT',
            ...data,
            translations: {
                hr: { ...data.translations.hr, credits: credits.hr.map(({ id, ...rest }) => rest) },
                en: { ...data.translations.en, credits: credits.en.map(({ id, ...rest }) => rest) },
            },
            showings: showings.map(({ id, ...rest }) => ({ ...(typeof id === 'number' && { id }), ...rest })),
            ordered_images: orderedImagesPayload,
            new_images: newImageFiles,
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Rad uspješno ažuriran!');
                onClose();
            },
            onError: (e) => {
                toast.error('Greška pri ažuriranju. Provjerite polja.');
                console.error("Update errors:", e);
            },
        });
    };

    const addCredit = (locale: 'hr' | 'en') => setCredits(p => ({ ...p, [locale]: [...p[locale], { id: uuidv4(), role: '', name: '' }] }));
    const removeCredit = (locale: 'hr' | 'en', id: string) => setCredits(p => ({ ...p, [locale]: p[locale].filter(c => c.id !== id) }));
    const updateCredit = (locale: 'hr' | 'en', id: string, field: 'role' | 'name', value: string) => setCredits(p => ({ ...p, [locale]: p[locale].map(c => c.id === id ? { ...c, [field]: value } : c) }));
    const handleCreditDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setCredits(items => {
                const activeLocaleCredits = items[activeLocale];
                const oldIndex = activeLocaleCredits.findIndex(item => item.id === active.id);
                const newIndex = activeLocaleCredits.findIndex(item => item.id === over.id);
                return { ...items, [activeLocale]: arrayMove(activeLocaleCredits, oldIndex, newIndex) };
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[600px] md:max-w-[1000px] flex flex-col h-[90vh] p-0">
                {work && (
                    <form id="work-details-form" className="flex flex-col h-full" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <DialogHeader className="shrink-0 p-6 border-b"><DialogTitle className="text-2xl font-semibold">{isEditing ? `Uređivanje: ${work.title}` : work.title}</DialogTitle><DialogDescription>Kreirano: {work.created_at} | Zadnja izmjena: {work.updated_at}</DialogDescription></DialogHeader>
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="space-y-6 p-6">
                                {isEditing && <div className="flex items-center gap-4"><Label>Jezik unosa:</Label><ToggleGroup type="single" value={activeLocale} onValueChange={(v: 'hr' | 'en') => v && setActiveLocale(v)}><ToggleGroupItem value="hr">Hrvatski</ToggleGroupItem><ToggleGroupItem value="en">Engleski</ToggleGroupItem></ToggleGroup></div>}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-4">
                                        {Object.keys(credits).map((locale) => (
                                            <div key={locale} className={cn('space-y-6', !isEditing || activeLocale === locale ? 'block' : 'hidden')}>
                                                <div><Label>Naslov ({locale.toUpperCase()})</Label>{isEditing ? <Input value={data.translations[locale as 'hr'|'en'].title} onChange={e => setData(d=>({...d, translations: {...d.translations, [locale]: {...d.translations[locale as 'hr'|'en'], title: e.target.value}}}))} /> : <p className="mt-1">{work.translations[locale as 'hr'|'en']?.title || '-'}</p>}</div>
                                                <div><Label>Opis ({locale.toUpperCase()})</Label>{isEditing ? <RichTextEditor content={data.translations[locale as 'hr' | 'en'].description} onChange={(c) => setData(d=>({...d, translations: {...d.translations, [locale]: {...d.translations[locale as 'hr'|'en'], description: c}}}))} /> : <div className="prose dark:prose-invert max-w-none mt-1 text-sm" dangerouslySetInnerHTML={{ __html: work.translations[locale as 'hr'|'en']?.description || '-' }} />}</div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-2"><Label>Autorski tim ({locale.toUpperCase()})</Label>{isEditing && <Button size="sm" type="button" variant="outline" onClick={() => addCredit(locale as 'hr'|'en')}><PlusCircle className="h-4 w-4 mr-2" /> Dodaj</Button>}</div>
                                                    {isEditing ? (
                                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCreditDragEnd}>
                                                            <SortableContext items={credits[locale as 'hr'|'en'].map(c => c.id)} strategy={verticalListSortingStrategy}>
                                                                <div className="space-y-2">
                                                                    {credits[locale as 'hr'|'en'].map((credit) => (
                                                                        <SortableCreditItem key={credit.id} credit={credit} onUpdate={(id, field, value) => updateCredit(locale as 'hr'|'en', id, field, value)} onRemove={(id) => removeCredit(locale as 'hr'|'en', id)} />
                                                                    ))}
                                                                </div>
                                                            </SortableContext>
                                                        </DndContext>
                                                    ) : (
                                                        <ul className="space-y-1 mt-1">{credits[locale as 'hr'|'en'].map((credit) => <li key={credit.id} className="text-sm"><span className="font-semibold">{credit.role}:</span> {credit.name}</li>)}</ul>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div><Label>Datum premijere</Label>{isEditing ? <Input type="date" value={data.premiere_date} onChange={e => setData('premiere_date', e.target.value)} /> : <p className="mt-1">{new Date(data.premiere_date).toLocaleDateString('hr-HR')}</p>}</div>
                                            <div><Label>Status</Label>{isEditing ? <div className="flex items-center gap-2 mt-2"><Switch checked={data.is_active} onCheckedChange={c => setData('is_active', c)} /><span>{data.is_active ? 'Aktivan' : 'Neaktivan'}</span></div> : <div className="flex items-center gap-2 mt-1">{data.is_active ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Ban className="h-5 w-5 text-red-500" />}<span>{data.is_active ? 'Aktivan' : 'Neaktivan'}</span></div>}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Slike</Label>
                                        {isEditing && <div onDrop={handleDrop} onDragOver={e => {e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true);}} onDragLeave={e => {e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);}} className={cn("border border-dashed rounded-md p-4 text-center hover:border-primary transition-all", isDraggingOver && "border-primary ring-4 ring-primary/20")}><Label htmlFor="img-up-det" className="cursor-pointer flex flex-col items-center"><UploadCloud className="mx-auto h-8 w-8" /><span>Dodaj slike</span></Label><Input id="img-up-det" type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only" /></div>}
                                        {images.length > 0 ? (
                                            isEditing ? (
                                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleImageDragEnd}>
                                                    <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
                                                        <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                                                            {images.map(image => <SortableImageItem key={image.id} image={image} onUpdateAuthor={updateImageAuthor} onSetThumbnail={setThumbnail} onRemove={removeImage} />)}
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">{images.map((img) => (<div key={img.id} className="relative group border rounded-lg p-2 space-y-2"><img src={img.previewUrl} alt="Slika" className="aspect-video w-full object-cover rounded" /><div className="text-xs truncate">{img.author && <span>Autor: {img.author}</span>}{img.is_thumbnail && <Badge className="ml-2">Naslovna</Badge>}</div></div>))}</div>
                                            )
                                        ) : <p className='text-sm text-muted-foreground text-center py-4'>Nema slika.</p>}
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
