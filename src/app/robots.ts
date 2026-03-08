import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/dashboard/'], // Keep private data out of search results
        },
        sitemap: 'https://nexhaul.sellyticshq.com/sitemap.xml',
    }
}
