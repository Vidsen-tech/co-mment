import React, { useEffect, useState, useCallback, DragEvent } from 'react';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Trash2, Edit, Save, X, UploadCloud, CheckCircle, Loader2, Ban, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { NewsTableRow, NewsType } from '@/types';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/RichTextEditor'; // ★ ADDED

// --- Type Definitions ---
interface Props {
    open: boolean;
    onClose: () => void;
    news: NewsTableRow | null;
    newsTypes: NewsType[];
}

interface ImageItem {
    id: number | string;
    file?: File;
    previewUrl: string;
    author: string;
    is_thumbnail: boolean;
    is_new: boolean;
}

// --- Draggable Image Component ---
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
const NewsDetailsModal: React.FC<Props> = ({ open, onClose, news, newsTypes }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [images, setImages] = useState<ImageItem[]>([]);
    const [activeLocale, setActiveLocale] = useState<'hr' | 'en'>('hr');
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const { data, setData, errors, reset, clearErrors, processing } = useForm({
        translations: { hr: { title: '', excerpt: '' }, en: { title: '', excerpt: '' } },
        date: '',
        type: '' as NewsType | '',
        is_active: true,
        source_url: '',
        source_text: '',
    });

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const populateForm = useCallback((newsItem: NewsTableRow) => {
        setData({
            translations: { hr: newsItem.translations.hr ?? { title: '', excerpt: '' }, en: newsItem.translations.en ?? { title: '', excerpt: '' } },
            date: newsItem.date,
            type: newsItem.type,
            is_active: newsItem.is_active,
            source_url: newsItem.source?.url ?? '',
            source_text: newsItem.source?.text ?? '',
        });
        setImages(newsItem.images.map(img => ({ id: img.id, previewUrl: img.url, author: img.author ?? '', is_thumbnail: img.is_thumbnail, is_new: false })));
    }, [setData]);

    useEffect(() => {
        if (open && news) {
            populateForm(news);
            clearErrors();
        } else if (!open) {
            reset();
            setIsEditing(false);
            setActiveLocale('hr');
            images.forEach(img => { if (img.is_new) URL.revokeObjectURL(img.previewUrl); });
            setImages([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, news]);

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

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
    }, []);

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
    };

    const removeImage = (id: number | string) => {
        const img = images.find(i => i.id === id);
        if (img?.is_new) URL.revokeObjectURL(img.previewUrl);
        setImages(p => { const next = p.filter(i => i.id !== id); if (img?.is_thumbnail && next.length > 0 && !next.some(i => i.is_thumbnail)) { next[0].is_thumbnail = true; } return next; });
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

    const handleSave = () => {
        if (!news) return;
        const orderedImagesPayload = images.map(({ file, previewUrl, ...rest }) => rest);
        const newImageFiles = images.filter(i => i.is_new).map(i => i.file!);

        router.post(route('news.update', news.id), {
            _method: 'PUT',
            ...data,
            ordered_images: orderedImagesPayload,
            new_images: newImageFiles,
        }, {
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

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
                {news && (
                    <>
                        <ScrollArea className="max-h-[85vh] pr-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-semibold">{isEditing ? `Uređivanje: ${news.title}` : news.title}</DialogTitle>
                                <DialogDescription>Kreirano: {news.created_at} | Zadnja izmjena: {news.updated_at}</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-6">
                                {isEditing && <div className="flex items-center gap-4"><Label>Jezik unosa:</Label><ToggleGroup type="single" value={activeLocale} onValueChange={(v: 'hr' | 'en') => v && setActiveLocale(v)}><ToggleGroupItem value="hr">Hrvatski</ToggleGroupItem><ToggleGroupItem value="en">Engleski</ToggleGroupItem></ToggleGroup></div>}
                                <div className="space-y-4">{Object.keys(data.translations).map(locale => (
                                    <div key={locale} className={cn('space-y-4', !isEditing || activeLocale === locale ? 'block' : 'hidden')}>
                                        <div><Label htmlFor={`title-${locale}`}>Naslov ({locale.toUpperCase()})</Label>{isEditing ? <Input id={`title-${locale}`} value={data.translations[locale as 'hr' | 'en'].title} onChange={e => setData(d => ({ ...d, translations: { ...d.translations, [locale]: { ...d.translations[locale as 'hr' | 'en'], title: e.target.value } } }))} /> : <p className="text-sm text-muted-foreground mt-1">{news.translations[locale as 'hr' | 'en']?.title || '-'}</p>}</div>
                                        <div>
                                            <Label htmlFor={`excerpt-${locale}`}>Sadržaj ({locale.toUpperCase()})</Label>
                                            {/* ★ UPDATED logic for both edit and view modes */}
                                            {isEditing ? (
                                                <RichTextEditor
                                                    content={data.translations[locale as 'hr' | 'en'].excerpt}
                                                    onChange={(newContent) => setData(d => ({...d, translations: {...d.translations, [locale]: {...d.translations[locale as 'hr'|'en'], excerpt: newContent}}}))}
                                                />
                                            ) : (
                                                <div
                                                    className="prose dark:prose-invert max-w-none mt-1 text-sm"
                                                    dangerouslySetInnerHTML={{ __html: news.translations[locale as 'hr'|'en']?.excerpt || '-' }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div><Label>Datum</Label>{isEditing ? <Input type="date" value={data.date} onChange={e => setData('date', e.target.value)} /> : <p className="text-sm mt-1">{news.formatted_date}</p>}</div>
                                        <div><Label>Tip</Label>{isEditing ? <Select value={data.type} onValueChange={(v: NewsType) => setData('type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{newsTypes.map(tp => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}</SelectContent></Select> : <p className="text-sm mt-1"><Badge variant="secondary">{data.type}</Badge></p>}</div>
                                        {(isEditing || data.source_url) && (
                                            <div><Label>Izvor</Label>{isEditing ? (<div className="grid grid-cols-2 gap-2 mt-1"><Input placeholder="URL izvora" value={data.source_url} onChange={e => setData('source_url', e.target.value)} /><Input placeholder="Naziv (npr. Večernji List)" value={data.source_text} onChange={e => setData('source_text', e.target.value)} /></div>) : (<a href={data.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 block mt-1 hover:underline">{data.source_text || data.source_url}</a>)}</div>
                                        )}
                                        <div><Label className="flex items-center gap-2 font-medium">Status</Label>{isEditing ? <div className="flex items-center gap-2 mt-2"><Switch id="is_active" checked={data.is_active} onCheckedChange={c => setData('is_active', c)} /><span>{data.is_active ? 'Aktivan' : 'Neaktivan'}</span></div> : <div className="flex items-center gap-2 mt-1">{data.is_active ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Ban className="h-5 w-5 text-red-500" />}<span>{data.is_active ? 'Aktivan' : 'Neaktivan'}</span></div>}</div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Slike</Label>
                                        {isEditing && <div onDrop={handleDrop} onDragOver={e => {e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true);}} onDragLeave={e => {e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);}} className={cn("border border-dashed rounded-md p-4 text-center hover:border-primary transition-all", isDraggingOver && "border-primary ring-4 ring-primary/20")}><Label htmlFor="img-up-det" className="cursor-pointer flex flex-col items-center"><UploadCloud className="mx-auto h-8 w-8" /><span>Dodaj slike</span></Label><Input id="img-up-det" type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only" /></div>}
                                        {isEditing ? (
                                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleImageDragEnd}>
                                                <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
                                                    <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                                                        {images.map(image => <SortableImageItem key={image.id} image={image} onUpdateAuthor={updateImageAuthor} onSetThumbnail={setThumbnail} onRemove={removeImage} />)}
                                                    </div>
                                                </SortableContext>
                                            </DndContext>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">{images.map((img) => (<div key={img.id} className="relative group border rounded-lg p-2 space-y-2"><img src={img.previewUrl} alt="Slika" className="aspect-video w-full object-cover rounded" /><div className="text-xs truncate">{img.author && <span>Autor: {img.author}</span>}{img.is_thumbnail && <Badge className="ml-2">Naslovna</Badge>}</div></div>))}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                        <DialogFooter className="mt-6 pt-4 border-t sm:justify-between">
                            <div><Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)} disabled={processing}><Trash2 className="mr-2 h-4 w-4" /> Deaktiviraj</Button></div>
                            <div className="flex gap-2">
                                {isEditing ? (<><Button variant="outline" onClick={() => setIsEditing(false)} disabled={processing}><X className="mr-2 h-4" /> Otkaži</Button><Button onClick={handleSave} disabled={processing}>{processing ? <><Loader2 className="mr-2 h-4 animate-spin" /> Spremanje...</> : <><Save className="mr-2 h-4" /> Spremi</>}</Button></>) : (<Button onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4" /> Uredi</Button>)}
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
