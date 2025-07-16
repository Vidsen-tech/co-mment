import React, { useEffect, useState, useCallback } from 'react';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Trash2, Edit, Save, X, Loader2, Ban, PlusCircle, CheckCircle, Badge, UploadCloud } from 'lucide-react';
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
interface EditableImage {
    id: number | null;
    file?: File;
    previewUrl: string;
    author: string;
    is_thumbnail: boolean;
    markedForRemoval?: boolean;
}
interface FormShowing {
    id: number | string; // Use string for new items
    performance_date: string;
    location: string;
    news_id: number | null;
}
// ★★★ NEW TYPE for a single credit item ★★★
interface CreditItem {
    id: string; // Unique ID for React key
    role: string;
    name: string;
}

// --- Main Component ---
const WorkDetailsModal: React.FC<Props> = ({ open, onClose, work, newsList }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeLocale, setActiveLocale] = useState<'hr' | 'en'>('hr');
    const [formShowings, setFormShowings] = useState<FormShowing[]>([]);
    const [editableImages, setEditableImages] = useState<EditableImage[]>([]);

    // ★★★ FIX 1: Update form data structure to handle description and credits separately ★★★
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        translations: {
            hr: { title: '', description: '', credits: [] as CreditItem[] },
            en: { title: '', description: '', credits: [] as CreditItem[] }
        },
        premiere_date: '',
        is_active: true,
        _method: 'PUT' // Use post with _method for FormData
    });

    const populateForm = useCallback((workData: WorkTableRow) => {
        // Function to convert credits object/array from backend to our frontend format
        const formatCredits = (credits: any): CreditItem[] => {
            if (!credits) return [];
            // Handle both object { "Role": "Name" } and array [ { role, name } ]
            if (Array.isArray(credits)) return credits.map(c => ({ ...c, id: uuidv4() }));
            return Object.entries(credits).map(([role, name]) => ({ id: uuidv4(), role, name: name as string }));
        };

        setData({
            ...data,
            translations: {
                hr: { ...workData.translations.hr, credits: formatCredits(workData.translations.hr?.credits) },
                en: { ...workData.translations.en, credits: formatCredits(workData.translations.en?.credits) }
            },
            premiere_date: workData.premiere_date,
            is_active: workData.is_active,
        });
        setEditableImages(workData.images.map(img => ({ ...img, previewUrl: img.url, author: img.author ?? '', is_thumbnail: img.is_thumbnail })));
        setFormShowings(workData.showings.map(s => ({ ...s, performance_date: s.performance_date ? s.performance_date.replace(' ', 'T') : '' })));
    }, [setData]);

    useEffect(() => {
        if (open && work) { populateForm(work); clearErrors(); }
        if (!open) { setIsEditing(false); setActiveLocale('hr'); setFormShowings([]); setEditableImages([]); reset(); }
    }, [open, work, populateForm, clearErrors, reset]);

    const handleSave = () => {
        if (!work) return;

        // Convert credits from our array format back to the object format the backend expects
        const formatCreditsForSubmission = (credits: CreditItem[]) => {
            return credits.reduce((acc, credit) => {
                if (credit.role) { // Only include if role is not empty
                    acc[credit.role] = credit.name;
                }
                return acc;
            }, {} as Record<string, string>);
        };

        const submissionData: any = {
            ...data,
            translations: {
                hr: { ...data.translations.hr, credits: formatCreditsForSubmission(data.translations.hr.credits) },
                en: { ...data.translations.en, credits: formatCreditsForSubmission(data.translations.en.credits) }
            },
            showings: formShowings.map(({id, ...rest}) => rest), // Remove our temporary UUIDs
            new_images: editableImages.filter(i => i.file && !i.markedForRemoval).map(i => i.file),
            new_image_authors: editableImages.filter(i => i.file && !i.markedForRemoval).map(i => i.author),
            existing_image_authors: Object.fromEntries(
                editableImages.filter(i => i.id && !i.markedForRemoval).map(i => [i.id, i.author])
            ),
            remove_image_ids: editableImages.filter(i => i.id && i.markedForRemoval).map(i => i.id!),
        };

        const thumb = editableImages.find(i => i.is_thumbnail && !i.markedForRemoval);
        if (thumb?.file) {
            const newImages = editableImages.filter(i => i.file && !i.markedForRemoval);
            submissionData.new_thumbnail_index = newImages.findIndex(i => i.previewUrl === thumb.previewUrl);
        } else if (thumb?.id) {
            submissionData.thumbnail_image_id = thumb.id;
        }

        router.post(route('works.update', work.id), submissionData, {
            forceFormData: true, preserveScroll: true,
            onSuccess: () => { toast.success('Rad ažuriran!'); onClose(); },
            onError: (e) => { toast.error('Greška pri ažuriranju.'); console.error(e); },
        });
    };

    // --- Credit Handlers ---
    const addCredit = (locale: 'hr' | 'en') => {
        setData(d => ({...d, translations: {...d.translations, [locale]: {...d.translations[locale], credits: [...d.translations[locale].credits, {id: uuidv4(), role: '', name: ''}]}}}));
    };
    const updateCredit = (locale: 'hr' | 'en', id: string, field: 'role' | 'name', value: string) => {
        setData(d => ({...d, translations: {...d.translations, [locale]: {...d.translations[locale], credits: d.translations[locale].credits.map(c => c.id === id ? {...c, [field]: value} : c) }}}));
    };
    const removeCredit = (locale: 'hr' | 'en', id: string) => {
        setData(d => ({...d, translations: {...d.translations, [locale]: {...d.translations[locale], credits: d.translations[locale].credits.filter(c => c.id !== id)}}}));
    };


    // --- Other handlers (images, showings) remain mostly the same ---
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files).map(file => ({ id: null, file, previewUrl: URL.createObjectURL(file), author: '', is_thumbnail: false }));
        setEditableImages(p => {
            const combined = [...p, ...newFiles];
            if (!combined.some(i => i.is_thumbnail && !i.markedForRemoval)) {
                const firstAvailable = combined.find(i => !i.markedForRemoval);
                if (firstAvailable) firstAvailable.is_thumbnail = true;
            }
            return combined;
        });
    }, []);
    const markImageForRemoval = useCallback((indexToRemove: number) => {
        setEditableImages(p => {
            const next = [...p]; const target = next[indexToRemove]; if (!target) return next;
            if (target.id) { target.markedForRemoval = true; } else { URL.revokeObjectURL(target.previewUrl); next.splice(indexToRemove, 1); }
            if (target.is_thumbnail) { const newThumb = next.find(i => !i.markedForRemoval); if (newThumb) newThumb.is_thumbnail = true; } return next;
        });
    }, []);
    const handleThumbnailSelection = useCallback((selectedIndex: number) => {
        setEditableImages(p => p.map((img, idx) => ({ ...img, is_thumbnail: idx === selectedIndex })));
    }, []);
    const addShowing = () => setFormShowings(p => [...p, { id: uuidv4(), performance_date: '', location: '', news_id: null }]);
    const removeShowing = (id: number | string) => setFormShowings(p => p.filter(s => s.id !== id));
    const updateShowing = (id: number | string, field: 'performance_date' | 'location' | 'news_id', value: string | number | null) => {
        setFormShowings(p => p.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] md:max-w-[1000px] flex flex-col h-[90vh] p-0">
                {work && (
                    <form id="work-details-form" className="flex flex-col h-full" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <DialogHeader className="shrink-0 p-6 border-b"><DialogTitle className="text-2xl font-semibold">{isEditing ? `Uređivanje: ${work.title}` : work.title}</DialogTitle><DialogDescription>Kreirano: {work.created_at} | Zadnja izmjena: {work.updated_at}</DialogDescription></DialogHeader>
                        <div className="flex-1 overflow-y-auto min-h-0 px-6">
                            <div className="space-y-6 py-4">
                                {isEditing && <div className="flex items-center gap-4"><Label>Jezik unosa:</Label><ToggleGroup type="single" value={activeLocale} onValueChange={(v: 'hr' | 'en') => v && setActiveLocale(v)}><ToggleGroupItem value="hr">Hrvatski</ToggleGroupItem><ToggleGroupItem value="en">Engleski</ToggleGroupItem></ToggleGroup></div>}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-4">
                                        {Object.keys(data.translations).map((locale) => (
                                            <div key={locale} className={cn('space-y-6', !isEditing || activeLocale === locale ? 'block' : 'hidden')}>
                                                {/* --- Basic Info --- */}
                                                <div><Label>Naslov ({locale.toUpperCase()})</Label>{isEditing ? <Input value={data.translations[locale as 'hr'|'en'].title} onChange={e => setData(d => ({...d, translations: {...d.translations, [locale]: { ...d.translations[locale as 'hr'|'en'], title: e.target.value }}}))} /> : <p className="mt-1">{data.translations[locale as 'hr'|'en']?.title || '-'}</p>}</div>
                                                <div>
                                                    <Label>Opis ({locale.toUpperCase()})</Label>
                                                    {isEditing ? (
                                                        <RichTextEditor
                                                            content={data.translations[locale as 'hr' | 'en'].description}
                                                            onChange={(newContent) => {
                                                                setData(d => ({
                                                                    ...d,
                                                                    translations: {
                                                                        ...d.translations,
                                                                        [locale]: { ...d.translations[locale as 'hr'|'en'], description: newContent }
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="prose dark:prose-invert max-w-none mt-1 text-sm text-muted-foreground"
                                                            dangerouslySetInnerHTML={{ __html: data.translations[locale as 'hr' | 'en']?.description || '-' }}
                                                        />
                                                    )}
                                                </div>

                                                {/* ★★★ NEW: Credits Editor ★★★ */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Label>Autorski tim ({locale.toUpperCase()})</Label>
                                                        {isEditing && <Button size="sm" type="button" variant="outline" onClick={() => addCredit(locale as 'hr'|'en')}><PlusCircle className="h-4 w-4 mr-2" /> Dodaj unos</Button>}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {data.translations[locale as 'hr'|'en'].credits.map((credit, index) => (
                                                            isEditing ? (
                                                                <div key={credit.id} className="flex items-center gap-2">
                                                                    <Input placeholder="Uloga (npr. Režija)" value={credit.role} onChange={e => updateCredit(locale as 'hr'|'en', credit.id, 'role', e.target.value)} />
                                                                    <Input placeholder="Ime i prezime" value={credit.name} onChange={e => updateCredit(locale as 'hr'|'en', credit.id, 'name', e.target.value)} />
                                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCredit(locale as 'hr'|'en', credit.id)}><X className="h-4 w-4 text-destructive" /></Button>
                                                                </div>
                                                            ) : (
                                                                <div key={credit.id} className="grid grid-cols-3 text-sm"><dt className="font-semibold">{credit.role}:</dt><dd className="col-span-2 text-muted-foreground">{credit.name}</dd></div>
                                                            )
                                                        ))}
                                                        {!isEditing && data.translations[locale as 'hr'|'en'].credits.length === 0 && <p className="text-sm text-muted-foreground italic">Nema unesenih članova tima.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div><Label>Datum premijere</Label>{isEditing ? <Input type="date" value={data.premiere_date} onChange={e => setData('premiere_date', e.target.value)} /> : <p className="mt-1">{new Date(data.premiere_date).toLocaleDateString('hr-HR')}</p>}</div>
                                            <div><Label>Status</Label>{isEditing ? <div className="flex items-center gap-2 mt-2"><Switch checked={data.is_active} onCheckedChange={c => setData('is_active', c)} /><span>{data.is_active ? 'Aktivan' : 'Neaktivan'}</span></div> : <div className="flex items-center gap-2 mt-1">{data.is_active ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Ban className="h-5 w-5 text-red-500" />}<span>{data.is_active ? 'Aktivan' : 'Neaktivan'}</span></div>}</div>
                                        </div>
                                    </div>
                                    {/* --- Image Section --- */}
                                    <div className="space-y-4">
                                        <Label>Slike</Label>
                                        {isEditing && <div className="border border-dashed rounded-md p-4 text-center hover:border-primary"><Label htmlFor="img-up-det" className="cursor-pointer flex flex-col items-center"><UploadCloud className="h-8 w-8" /><span>Dodaj slike</span></Label><Input id="img-up-det" type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only" /></div>}
                                        <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">{editableImages.map((img, idx) => (<div key={img.id ?? img.previewUrl} className={cn("relative group border rounded-lg p-2 space-y-2", img.markedForRemoval && "opacity-40")}><img src={img.previewUrl} alt="Slika" className="aspect-video w-full object-cover rounded" />{isEditing ? (<><Input placeholder="Autor" value={img.author} onChange={e => setEditableImages(p => { const n=[...p]; if(n[idx]) n[idx].author = e.target.value; return n; })} className="h-8" /><div className="flex items-center justify-between"><Label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="thumb_edit" checked={img.is_thumbnail} onChange={() => handleThumbnailSelection(idx)} disabled={img.markedForRemoval} />Naslovna</Label><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => markImageForRemoval(idx)}><Trash2 className="h-4" /></Button></div></>) : (<div className="text-xs truncate">{img.author && <span>Autor: {img.author}</span>}{img.is_thumbnail && <Badge className="ml-2">Naslovna</Badge>}</div>)}</div>))}</div>
                                    </div>
                                </div>
                                {/* --- Showings Section --- */}
                                <div className="pt-4 space-y-4">
                                    <div className="flex items-center justify-between"><h3 className="text-lg font-medium">Izvedbe</h3>{isEditing && <Button type="button" variant="outline" size="sm" onClick={addShowing}><PlusCircle className="h-4 w-4 mr-2" /> Dodaj</Button>}</div>
                                    <div className="space-y-2">{formShowings.map((showing) => (<div key={showing.id} className="flex items-center gap-2 p-3 rounded-md bg-muted/50">{isEditing ? (<><Input type="datetime-local" value={showing.performance_date} onChange={e => updateShowing(showing.id, 'performance_date', e.target.value)} className="flex-1" /><Input placeholder="Lokacija" value={showing.location} onChange={e => updateShowing(showing.id, 'location', e.target.value)} className="flex-1" /><Select value={String(showing.news_id ?? 'null')} onValueChange={v => updateShowing(showing.id, 'news_id', v === 'null' ? null : parseInt(v))}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Poveži vijest..." /></SelectTrigger><SelectContent><SelectItem value="null">-- Bez vijesti --</SelectItem>{newsList.map(n => <SelectItem key={n.id} value={String(n.id)}>{n.title}</SelectItem>)}</SelectContent></Select><Button type="button" variant="ghost" size="icon" onClick={() => removeShowing(showing.id)}><X className="h-4 w-4 text-destructive" /></Button></>) : (<><span className="flex-1">{showing.performance_date ? new Date(showing.performance_date).toLocaleString('hr-HR') : 'Nema datuma'}</span><span className="flex-1">{showing.location}</span><span className="w-[180px] text-sm text-muted-foreground">{showing.news_id ? newsList.find(n => n.id === showing.news_id)?.title ?? 'Povezana vijest' : '-- Bez vijesti --'}</span></>)}</div>))}</div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="shrink-0 mt-auto p-6 border-t bg-background w-full flex items-center justify-between">
                            <Button variant="destructive" disabled={processing || !work?.is_active} type="button" onClick={() => router.delete(route('works.destroy', work.id), { preserveScroll: true, onSuccess: onClose })}><Trash2 className="mr-2 h-4 w-4" /> Deaktiviraj</Button>
                            <div className="flex gap-2">
                                {isEditing ? (<><Button variant="outline" onClick={() => setIsEditing(false)} disabled={processing} type="button"><X className="mr-2 h-4" /> Otkaži</Button><Button type="submit" disabled={processing}>{processing ? <Loader2 className="mr-2 h-4 animate-spin" /> : <Save className="mr-2 h-4" />} Spremi</Button></>) : (<Button onClick={() => setIsEditing(true)} type="button"><Edit className="mr-2 h-4" /> Uredi</Button>)}
                            </div>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default WorkDetailsModal;
