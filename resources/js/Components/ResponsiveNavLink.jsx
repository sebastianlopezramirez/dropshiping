import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 text-sm font-medium transition duration-150 ease-in-out focus:outline-none ${
                active
                    ? 'border-orange-400 bg-orange-500/10 text-orange-400'
                    : 'border-transparent text-gray-400 hover:border-gray-600 hover:bg-gray-800 hover:text-white'
            } ${className}`}
        >
            {children}
        </Link>
    );
}
