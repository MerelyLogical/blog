'use client';

import { usePathname } from 'next/navigation';
import { ThemeSwitch } from 'nextra-theme-docs';

const HomeThemeSwitch = () => {
    const pathname = usePathname();
    if (pathname !== '/') {
        return null;
    }
    return <ThemeSwitch />;
};

export default HomeThemeSwitch;
