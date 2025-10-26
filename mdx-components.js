import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs' // nextra-theme-blog or your custom theme
import { Button } from '@/ts/ui/Button'
import { TimeStamp } from '@/ts/components/TimeStamp'

// Get the default MDX components
const themeComponents = getThemeComponents()

// Merge components
export function useMDXComponents(components) {
    return {
        ...themeComponents,
        Button,
        button: Button,
        TimeStamp,
        ...components
    }
}
