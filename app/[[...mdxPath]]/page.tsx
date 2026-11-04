import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../mdx-components'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

type Props = { params: Promise<{ mdxPath?: string[] }> }

export async function generateMetadata(props: Props) {
    const params = await props.params
    const { metadata } = await importPage(params.mdxPath)
    return metadata
}

const Wrapper = getMDXComponents().wrapper

export default async function Page(props: Props) {
    const params = await props.params
    const result = await importPage(params.mdxPath)
    const { default: MDXContent, toc, metadata } = result
    return (
        // Empty sourceCode keeps the theme's "Copy page" button hidden.
        <Wrapper toc={toc} metadata={metadata} sourceCode="">
            <MDXContent {...props} params={params} />
        </Wrapper>
    )
}