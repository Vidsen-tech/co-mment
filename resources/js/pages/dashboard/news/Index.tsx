// resources/js/pages/dashboard/news/Index.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

// UI Components
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ChevronDown, CirclePlus, ImageOff, Loader2, CheckCircle, XCircle } from 'lucide-react';

// Custom Components & Types
import NewsDetailsModal from './components/NewsDetailsModal';
import NewsCreateModal from './components/NewsCreateModal';
import type { NewsIndexPageProps, NewsTableRow, NewsType, BreadcrumbItem } from '@/types';


// --- Helper functions for persisting table state in localStorage ---
const loadSavedState = (key: string) => {
    try {
        const savedState = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        return savedState ? JSON.parse(savedState) : null;
    } catch { return null; }
};
const saveState = (key: string, state: unknown) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(state));
};


// --- The Main Component ---
const NewsIndex: React.FC = () => {
    const { t } = useTranslation();
    const { news: newsPagination, filters, newsTypes, flash } = usePage<NewsIndexPageProps>().props;

    // --- State Management ---
    const savedState = useMemo(() => loadSavedState('newsTableState'), []);
    const [sorting, setSorting] = useState<SortingState>(savedState?.sorting || [{ id: 'date', desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        filters.type ? [{ id: 'type', value: filters.type }] : (savedState?.columnFilters || [])
    );
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(savedState?.columnVisibility || {});

    const [pagination, setPagination] = useState({
        pageIndex: newsPagination.current_page - 1,
        pageSize: savedState?.pageSize || newsPagination.per_page || 20,
    });
    const [globalFilter, setGlobalFilter] = useState(filters.search || '');
    const [isLoading, setIsLoading] = useState(false);

    // Modal states
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState<NewsTableRow | null>(null);

    // --- Side Effects ---
    // Persist table state to localStorage whenever it changes.
    useEffect(() => {
        saveState('newsTableState', {
            sorting,
            columnFilters,
            columnVisibility,
            pageSize: pagination.pageSize,
        });
    }, [sorting, columnFilters, columnVisibility, pagination.pageSize]);

    // Debounced effect to fetch data from the backend when filters change.
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(true);
            const params: { [key: string]: any } = {
                search: globalFilter,
                page: 1, // Reset to page 1 on any filter change
                perPage: pagination.pageSize,
            };
            const typeFilter = columnFilters.find(f => f.id === 'type');
            if (typeFilter?.value) {
                params.type = typeFilter.value;
            }

            // Using router.get with replace and preserveState for a smooth filtering experience
            router.get(route('news.index'), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            });
        }, 500);

        return () => clearTimeout(timer);
        // ★★★ FIX: Use destructured props in dependency array to avoid loops from object identity changes ★★★
    }, [globalFilter, columnFilters, pagination.pageSize]);

    // Effect to handle pagination changes from the table footer
    useEffect(() => {
        // Only run if the page index or size has changed
        if (pagination.pageIndex !== (newsPagination.current_page - 1) || pagination.pageSize !== newsPagination.per_page) {
            const params: { [key: string]: any } = {
                search: globalFilter,
                page: pagination.pageIndex + 1,
                perPage: pagination.pageSize,
            };
            const typeFilter = columnFilters.find(f => f.id === 'type');
            if (typeFilter?.value) {
                params.type = typeFilter.value;
            }
            router.get(route('news.index'), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            });
        }
    }, [pagination, newsPagination]);


    // --- Table Column Definitions ---
    const columns = useMemo<ColumnDef<NewsTableRow>[]>(() => [
        {
            accessorKey: 'thumbnail_url',
            header: () => 'Slika',
            cell: ({ row }) => (
                <div className="w-16 h-10 flex items-center justify-center bg-muted rounded overflow-hidden">
                    {row.original.thumbnail_url ?
                        <img src={row.original.thumbnail_url} alt={`Naslovna za ${row.original.title}`} className="object-cover w-full h-full" loading="lazy" />
                        : <ImageOff className="w-5 h-5 text-gray-400" />
                    }
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'title',
            header: 'Naslov',
            cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
        },
        {
            accessorKey: 'type',
            header: 'Tip',
            cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
        },
        {
            accessorKey: 'date',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Datum objave <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => row.original.formatted_date,
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.is_active ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                    <span className="hidden md:inline">{row.original.is_active ? 'Aktivan' : 'Neaktivan'}</span>
                </div>
            ),
        }
    ], []);

    // --- React Table Instance ---
    const table = useReactTable({
        data: newsPagination.data,
        columns,
        pageCount: newsPagination.last_page,
        state: { sorting, columnFilters, columnVisibility, pagination },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
        manualFiltering: true,
        manualSorting: false,
    });

    // ★★★ FIX: Use useCallback to stabilize modal close handlers, preventing re-render loops ★★★
    const handleCloseDetailsModal = useCallback(() => setIsDetailsModalOpen(false), []);
    const handleCloseCreateModal = useCallback(() => setIsCreateModalOpen(false), []);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Dashboard') as string, href: route('dashboard') },
        { title: t('Novosti') as string, href: route('news.index') },
    ];

    // --- Render ---
    return (
        <AppSidebarLayout>
            <Head title={t('Novosti') as string} />

            {flash?.success && <Alert className="mb-4 border-green-500 text-green-700 dark:border-green-600 dark:text-green-500"><AlertTitle>Uspjeh!</AlertTitle><AlertDescription>{flash.success}</AlertDescription></Alert>}
            {flash?.error && <Alert variant="destructive" className="mb-4"><AlertTitle>Greška!</AlertTitle><AlertDescription>{flash.error}</AlertDescription></Alert>}

            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Input placeholder="Pretraži naslove…" value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="h-9 max-w-xs" />
                    <Select value={table.getColumn('type')?.getFilterValue() as string || 'all'} onValueChange={v => table.getColumn('type')?.setFilterValue(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Filtriraj po tipu" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Svi tipovi</SelectItem>
                            {newsTypes.map(tp => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" className="ml-auto h-9">Kolone <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">{table.getAllColumns().filter(c => c.getCanHide()).map(c => <DropdownMenuCheckboxItem key={c.id} className="capitalize" checked={c.getIsVisible()} onCheckedChange={v => c.toggleVisibility(!!v)}>{c.id === 'is_active' ? 'Status' : c.id}</DropdownMenuCheckboxItem>)}</DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto h-9"><CirclePlus className="mr-2 h-4 w-4" /> Nova novost</Button>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>{table.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
                    <TableBody>
                        {isLoading && newsPagination.data.length === 0 ? (
                            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center"><Loader2 className="animate-spin h-8 w-8 text-primary inline-block" /></TableCell></TableRow>
                        ) : table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map(r => (
                                <TableRow key={r.id} data-state={r.getIsSelected() && "selected"} className="hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedNews(r.original); setIsDetailsModalOpen(true); }}>
                                    {r.getVisibleCells().map(c => <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>)}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nema rezultata.</TableCell></TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={columns.length}>
                                <div className="flex items-center justify-between space-x-2 py-2">
                                    <span className="flex-1 text-sm text-muted-foreground">Stranica {table.getState().pagination.pageIndex + 1} od {table.getPageCount()} ({newsPagination.total} ukupno)</span>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>{'<<'}</Button>
                                        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prethodna</Button>
                                        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Sljedeća</Button>
                                        <Button variant="outline" size="sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>{'>>'}</Button>
                                    </div>
                                    <Select value={`${table.getState().pagination.pageSize}`} onValueChange={v => table.setPageSize(Number(v))}>
                                        <SelectTrigger className="h-9 w-[70px]"><SelectValue placeholder={table.getState().pagination.pageSize} /></SelectTrigger>
                                        <SelectContent side="top">{[10, 20, 30, 50, 100].map(ps => <SelectItem key={ps} value={`${ps}`}>{ps}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>

            <NewsDetailsModal key={selectedNews?.id} open={isDetailsModalOpen} onClose={handleCloseDetailsModal} news={selectedNews} newsTypes={newsTypes} />
            <NewsCreateModal open={isCreateModalOpen} onClose={handleCloseCreateModal} newsTypes={newsTypes} />
        </AppSidebarLayout>
    );
};

export default NewsIndex;
