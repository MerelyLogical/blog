import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs' // nextra-theme-blog or your custom theme
import { Button } from '@/ts/ui/Button'
import { MDXImage } from '@/ts/components/MDXImage'
import { MDXSub } from '@/ts/components/MDXSub'

// Get the default MDX components
const themeComponents = getThemeComponents()

// Merge components
export function useMDXComponents(components) {
    return {
        ...themeComponents,
        Button,
        button: Button,
        MDXImage,
        img: MDXImage,
        MDXSub,
        sub: MDXSub,
        ...components
    }
}
