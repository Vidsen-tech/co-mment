import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
// ★★★ 1. Import the new icon ★★★
import { LayoutGrid, PlusCircle, Cog, GalleryVerticalEnd } from 'lucide-react';
import AppLogo from './app-logo';

// ★★★ 2. Add the new navigation item ★★★
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
        icon: LayoutGrid,
    },
    {
        title: 'Novosti',
        href: route('news.index'),
        icon: PlusCircle,
    },
    {
        title: 'Radovi',
        href: route('works.index'), // ← named in web.php as 'works.index'
        icon: GalleryVerticalEnd,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Postavke',
        href: route('profile.edit'),
        icon: Cog,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link
                            href={route('dashboard')}
                            className="block focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
                        >
                            <SidebarMenuButton size="lg">
                                <AppLogo />
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
