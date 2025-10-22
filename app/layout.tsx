import { Layout, Navbar} from 'nextra-theme-docs'
import { Head} from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
    // Define your metadata here
    // For more information on metadata API, see: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
}

const navbar = (
    <Navbar logo={
        <>
            <img src="@/images/logo.jpg" alt="Logo" width={100} height={20} />
            <span style={{ marginLeft: '1em', fontWeight: 600 }}>
                ML's BF's Website!
            </span>
        </>
    }>
    </Navbar>
);

export default async function RootLayout({children}) {
    return (
        <html
        // English
        lang="en"
        // reads left to right
        dir="ltr"
        // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
        suppressHydrationWarning
        >
        <Head>
            <link rel="shortcut icon" href="@/images/favicon.ico"/>
        </Head>
        <body>
        <Layout
            navbar={navbar}
            pageMap={await getPageMap()}
            footer={null}
            feedback={{ content: null }}
            editLink={null}
        >
        {children}
        </Layout>
        </body>
        </html>
    )
}