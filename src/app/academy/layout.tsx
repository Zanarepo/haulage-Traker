import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "NexHaul Academy | Master Logistics & Field Service Operations",
    description: "Access free expert resources, video walkthroughs, and industry insights on logistics visibility, fuel theft prevention, and automated work orders.",
    keywords: ["logistics academy", "field service management tips", "haulage tracker guides", "fuel monitoring nigeria", "automated maintenance"],
    openGraph: {
        title: "NexHaul Academy | Industry Insights & Expert Guides",
        description: "Learn how to scale your field operations with precision using NexHaul's expert resources.",
        type: "website",
    }
};

export default function AcademyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
