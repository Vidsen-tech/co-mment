// Removed Link import

export default function AppLogo() {
    return (
        // Removed the wrapping Link component from here
        <div className="flex items-center gap-2 group"> {/* Use a div or span instead */}
            <img
                src="/logo.svg"
                alt="UO co-mment Logo"
                className="h-8 w-auto transition-transform duration-300 group-hover:scale-110"
            />
            <div className="text-sm font-semibold text-foreground truncate">
                Admin Panel
            </div>
        </div>
    );
}
