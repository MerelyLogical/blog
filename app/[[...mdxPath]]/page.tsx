import { getPageMap } from 'nextra/page-map'
import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { TimeStamp } from '../../ts/components/TimeStamp'
import { dated, fmt } from '../../ts/pages'
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
    // Index pages have no date of their own, so show the newest one beneath them.
    const { updated } = metadata as typeof metadata & { updated?: string }
    const date = updated ?? dated(await getPageMap(`/${params.mdxPath?.join('/') ?? ''}`))[0]?.date
    return (
        // Empty sourceCode keeps the theme's "Copy page" button hidden.
        <Wrapper toc={toc} metadata={metadata} sourceCode="">
            <MDXContent {...props} params={params} />
            {date && <TimeStamp date={fmt(date)} />}
        </Wrapper>
    )
}