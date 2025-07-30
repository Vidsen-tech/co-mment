import React, { useState, useCallback, DragEvent } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { UploadCloud, Trash2, Loader2, Save, GripVertical } from 'lucide-react';
import type { NewsType } from '@/types';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/RichTextEditor'; // ★ ADDED

// --- Type Definitions ---
interface Props {
    open: boolean;
    onClose: () => void;
    newsTypes: NewsType[];
}

interface ImageItem {
    id: string;
    file: File;
    previewUrl: string;
    author: string;
    is_thumbnail: boolean;
}

// --- Draggable Image Component ---
const SortableImageItem = ({ image, onUpdateAuthor, onSetThumbnail, onRemove }: { image: ImageItem, onUpdateAuthor: (id: string, author: string) => void, onSetThumbnail: (id: string) => void, onRemove: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto', opacity: isDragging ? 0.8 : 1 };

    return (
        <div ref={setNodeRef} style={style} className="relative border rounded-lg p-2 space-y-2 bg-background shadow-sm">
            <button type="button" {...attributes} {...listeners} className="absolute top-1 left-1 z-10 cursor-grab bg-black/40 text-white rounded-full p-1 touch-none"><GripVertical size={16} /></button>
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
const NewsCreateModal: React.FC<Props> = ({ open, onClose, newsTypes }) => {
    const [activeLocale, setActiveLocale] = useState<'hr' | 'en'>('hr');
    const [images, setImages] = useState<ImageItem[]>([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        translations: { hr: { title: '', excerpt: '' }, en: { title: '', excerpt: '' } },
        date: new Date().toISOString().split('T')[0],
        type: '' as NewsType | '',
        source_url: '',
        source_text: '',
    });

    const handleClose = useCallback(() => {
        images.forEach(i => URL.revokeObjectURL(i.previewUrl));
        setImages([]);
        reset();
        setActiveLocale('hr');
        onClose();
    }, [images, onClose, reset]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const addFiles = (files: File[]) => {
        const newImageItems: ImageItem[] = files
            .filter(file => file.type.startsWith('image/'))
            .map(file => ({
                id: uuidv4(),
                file,
                previewUrl: URL.createObjectURL(file),
                author: '',
                is_thumbnail: false,
            }));

        if (newImageItems.length === 0) return;

        setImages(prev => {
            const combined = [...prev, ...newImageItems];
            if (!combined.some(i => i.is_thumbnail)) {
                combined[0].is_thumbnail = true;
            }
            return combined;
        });
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
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

    const updateImageAuthor = (id: string, author: string) => setImages(prev => prev.map(i => i.id === id ? { ...i, author } : i));
    const setThumbnail = (id: string) => setImages(prev => prev.map(i => ({ ...i, is_thumbnail: i.id === id })));
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

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const submissionData = {
            ...data,
            images: images.map(i => i.file),
            image_data: images.map(i => ({ author: i.author, is_thumbnail: i.is_thumbnail })),
        };
        router.post(route('news.store'), submissionData, {
            forceFormData: true,
            onSuccess: () => { toast.success('Nova novost uspješno stvorena!'); handleClose(); },
            onError: (err) => { console.error("Validation errors:", err); toast.error('Greška pri stvaranju. Provjerite jesu li sva obavezna polja ispunjena.'); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="sm:max-w-[600px] md:max-w-[800px]">
                <ScrollArea className="max-h-[85vh] pr-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold">Stvori novu novost</DialogTitle>
                        <DialogDescription>Ispunite polja za novu novost. Polja označena sa * su obavezna.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} id="news-create-form" className="space-y-6 py-4">
                        <div className="flex items-center gap-4"><Label>Jezik unosa:</Label><ToggleGroup type="single" value={activeLocale} onValueChange={(v: 'hr' | 'en') => v && setActiveLocale(v)}><ToggleGroupItem value="hr">Hrvatski</ToggleGroupItem><ToggleGroupItem value="en">Engleski</ToggleGroupItem></ToggleGroup></div>
                        {Object.keys(data.translations).map((locale) => (
                            <div key={locale} className={cn('space-y-4', activeLocale === locale ? 'block' : 'hidden')}>
                                <div><Label htmlFor={`title-${locale}`}>Naslov ({locale.toUpperCase()}) {locale === 'hr' && '*'}</Label><Input id={`title-${locale}`} value={data.translations[locale as 'hr'|'en'].title} onChange={e => setData(d => ({...d, translations: {...d.translations, [locale]: {...d.translations[locale as 'hr'|'en'], title: e.target.value}} }))} /></div>
                                <div>
                                    <Label htmlFor={`excerpt-${locale}`}>Sadržaj ({locale.toUpperCase()}) {locale === 'hr' && '*'}</Label>
                                    {/* ★ REPLACED Textarea with RichTextEditor */}
                                    <RichTextEditor
                                        content={data.translations[locale as 'hr' | 'en'].excerpt}
                                        onChange={(newContent) => setData(d => ({ ...d, translations: { ...d.translations, [locale]: { ...d.translations[locale as 'hr' | 'en'], excerpt: newContent } } }))}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label htmlFor="date">Datum *</Label><Input id="date" type="date" value={data.date} onChange={e => setData('date', e.target.value)} /></div>
                            <div><Label htmlFor="type">Tip *</Label><Select value={data.type} onValueChange={v => setData('type', v as NewsType)}><SelectTrigger id="type"><SelectValue placeholder="Odaberite tip" /></SelectTrigger><SelectContent>{newsTypes.map(tp => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}</SelectContent></Select></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label htmlFor="source_url">Izvor (Link)</Label><Input id="source_url" value={data.source_url} onChange={e => setData('source_url', e.target.value)} placeholder="https://primjer.com/izvor" /></div>
                            <div><Label htmlFor="source_text">Naziv izvora (opcionalno)</Label><Input id="source_text" value={data.source_text} onChange={e => setData('source_text', e.target.value)} placeholder="Npr. Službena stranica" /></div>
                        </div>
                        <div>
                            <Label>Slike</Label>
                            <div onDrop={handleDrop} onDragOver={e => {e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true);}} onDragLeave={e => {e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);}} className={cn("mt-1 border border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary transition-all", isDraggingOver && "border-primary ring-4 ring-primary/20")}>
                                <Label htmlFor="image-upload-create" className="cursor-pointer flex flex-col items-center justify-center"><UploadCloud className="h-8 w-8 text-muted-foreground" /><span className="mt-2 font-medium text-primary">Kliknite ili povucite slike ovdje</span></Label>
                                <Input id="image-upload-create" type="file" multiple accept="image/*" onChange={onFileChange} className="sr-only" />
                            </div>
                        </div>
                        {images.length > 0 && (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleImageDragEnd}>
                                <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {images.map(image => <SortableImageItem key={image.id} image={image} onUpdateAuthor={updateImageAuthor} onSetThumbnail={setThumbnail} onRemove={removeImage} />)}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
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
