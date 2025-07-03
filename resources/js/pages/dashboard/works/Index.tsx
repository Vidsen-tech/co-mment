import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';
// ★★★ 1. Make sure all our types are imported ★★★
import type { PaginatedResponse, WorkTableRow, NewsSelectItem } from '@/types';

import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, PlusCircle } from 'lucide-react';
import WorkCreateModal from './components/WorkCreateModal';
// ★★★ 2. Import our new Details Modal ★★★
import WorkDetailsModal from './components/WorkDetailsModal';


// --- The Main Page Component ---
export default function WorksIndexPage() {
    // ★★★ 3. Update usePage to get the new newsList prop ★★★
    const { works, filters, newsList } = usePage<{
        works: PaginatedResponse<WorkTableRow>;
        filters: { search: string | null; };
        newsList: NewsSelectItem[];
    }>().props;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    // ★★★ 4. Add state for the details modal ★★★
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedWork, setSelectedWork] = useState<WorkTableRow | null>(null);

    // Function to open the details modal
    const handleOpenDetails = (work: WorkTableRow) => {
        setSelectedWork(work);
        setIsDetailsModalOpen(true);
    };

    // ★★★ 5. Define columns in the component to access the handler ★★★
    const columns: ColumnDef<WorkTableRow>[] = [
        {
            accessorKey: 'title',
            header: 'Naslov',
            cell: ({ row }) => {
                const work = row.original;
                return (
                    <div className="flex items-center gap-4">
                        <img
                            src={work.thumbnail_url || `https://placehold.co/80x60/1e293b/9ca3af?text=${work.slug.charAt(0).toUpperCase()}`}
                            alt={work.title}
                            className="h-12 w-16 rounded-md object-cover"
                            width={64}
                            height={48}
                        />
                        <div className="flex flex-col">
                            <span className="font-medium text-white">{work.title}</span>
                            <span className="text-sm text-muted-foreground">{work.slug}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'premiere_date',
            header: 'Datum Premijere',
            cell: ({ row }) => new Date(row.getValue('premiere_date')).toLocaleDateString('hr-HR'),
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => {
                const isActive = row.getValue('is_active');
                return (
                    <Badge variant={isActive ? 'success' : 'destructive'}>
                        {isActive ? 'Aktivan' : 'Neaktivan'}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Akcije</div>,
            cell: ({ row }) => {
                const work = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        {/* ★★★ 6. Add the onClick handler to the button ★★★ */}
                        <Button variant="outline" size="sm" onClick={() => handleOpenDetails(work)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Detalji
                        </Button>
                    </div>
                );
            },
        },
    ];

    const [search, setSearch] = useState(filters.search || '');

    const table = useReactTable({
        data: works.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        manualPagination: true,
        rowCount: works.total,
        state: {
            pagination: {
                pageIndex: works.current_page - 1,
                pageSize: works.per_page,
            },
        },
    });

    const handleSearch = () => {
        router.get(route('works.index'), { search }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppSidebarLayout>
            {/* Render both modals. They are invisible until their 'open' prop is true. */}
            <WorkCreateModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
            {/* ★★★ 7. Render our new Details Modal ★★★ */}
            <WorkDetailsModal
                open={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                work={selectedWork}
                newsList={newsList}
            />

            <div className="p-4 md:p-8">
                <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Radovi</h1>
                        <p className="text-muted-foreground">Upravljajte svojim radovima i izvedbama.</p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Stvori novi rad
                    </Button>
                </header>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex items-center p-4">
                        <div className="flex w-full max-w-sm items-center space-x-2">
                            <Input
                                placeholder="Pretraži po naslovu..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch}>Pretraži</Button>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        Nema rezultata.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-end space-x-2 p-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit(works.prev_page_url!, { preserveScroll: true })}
                            disabled={!works.prev_page_url}
                        >
                            Prethodna
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Stranica {works.current_page} od {works.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit(works.next_page_url!, { preserveScroll: true })}
                            disabled={!works.next_page_url}
                        >
                            Sljedeća
                        </Button>
                    </div>
                </div>
            </div>
        </AppSidebarLayout>
    );
}
