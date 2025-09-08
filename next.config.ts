import type { NextConfig } from 'next'
import nextra from 'nextra'

// Set up Nextra with its configuration
const withNextra = nextra({
    search: true,
    defaultShowCopyCode: true,
})

// Export the final Next.js config with Nextra included
const nextConfig: NextConfig = {
    output: 'export',
    distDir: 'docs',
    basePath: '/ml',
    images: {
        unoptimized: true,
    },
}

export default withNextra(nextConfig)
