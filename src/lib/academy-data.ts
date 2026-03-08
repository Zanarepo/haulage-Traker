import React from 'react';
import { Zap, Wrench, ShieldCheck, FileText, BarChart, Truck } from 'lucide-react';

export interface VideoContent {
    id: string;
    type: 'video';
    title: string;
    description: string;
    thumbnail: string;
    videoUrl: string;
    category: 'Logistics' | 'Maintenance' | 'Operations' | 'Strategy';
    duration: string;
}

export interface BlogContent {
    id: string;
    type: 'blog';
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    thumbnail: string;
    category: 'Logistics' | 'Maintenance' | 'Operations' | 'Strategy';
    author: string;
    date: string;
    readTime: string;
    keywords: string[];
}

export const ACADEMY_VIDEOS: VideoContent[] = [
    {
        id: 'onboarding',
        type: 'video',
        title: 'Mastering the Account Setup',
        description: 'Learn how to register your company, pick your modules, and launch your command center in 60 seconds.',
        thumbnail: '/screenshots/Superadmin.png',
        videoUrl: 'https://www.youtube.com/embed/i8WqIqTD9rQ',
        category: 'Operations',
        duration: '3:45'
    },
    {
        id: 'dispatch',
        type: 'video',
        title: 'Operational Foundations',
        description: 'Guided walkthrough on how to create clusters, clients, and sites to build your operational map.',
        thumbnail: '/screenshots/Trips&logistics.png',
        videoUrl: 'https://www.youtube.com/embed/isIm84oVpUo',
        category: 'Logistics',
        duration: '5:20'
    },
    {
        id: 'maintenance',
        type: 'video',
        title: 'Automating Site Maintenance',
        description: 'How to register assets, track hour meters, and schedule preventive maintenance alerts.',
        thumbnail: '/screenshots/AssetRegistry.png',
        videoUrl: 'https://www.youtube.com/embed/i8WqIqTD9rQ',
        category: 'Maintenance',
        duration: '4:15'
    },
    {
        id: 'inventory-tracking',
        type: 'video',
        title: 'Depot Inventory Tracking',
        description: 'Master fuel accountability by tracking every liter from the moment it enters your depot.',
        thumbnail: 'https://img.youtube.com/vi/K-_XuP5IUzE/maxresdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/K-_XuP5IUzE',
        category: 'Logistics',
        duration: '6:10'
    }
];

export const ACADEMY_BLOGS: BlogContent[] = [
    {
        id: 'fuel-theft-prevention',
        type: 'blog',
        slug: '5-strategies-to-eliminate-fuel-theft-nigeria',
        title: '5 Proven Strategies to Eliminate Fuel Theft in Nigerian Logistics',
        excerpt: 'Fuel theft is the silent killer of logistics margins in Nigeria. Learn how to verify every drop with digital accountability.',
        author: 'NexHaul Strategy Team',
        date: 'March 8, 2026',
        readTime: '6 min read',
        category: 'Logistics',
        thumbnail: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
        keywords: ['fuel theft prevention Nigeria', 'logistics margins', 'fuel accountability'],
        content: `
# 5 Proven Strategies to Eliminate Fuel Theft in Nigerian Logistics

Fuel theft is not just a nuisance; for many haulage companies in Nigeria, it represents a 10-15% leakage in their total operational budget. In a high-inflation environment, this is often the difference between profit and closure.

At NexHaul, we've analyzed thousands of trips to identify exactly how "the bleeding" happens and how the top 1% of fleet managers stop it.

## 1. Move from Paper to Digital Waybills
Paper waybills are easily forged or altered. By moving to a Digital Waybill system, you create a tamper-proof record of the dispatched volume that cannot be changed once the truck leaves the depot.

## 2. Implement GPS-Fenced Delivery Verification
Knowing "where" the fuel was dropped is critical. NexHaul Uses geofencing to ensure that a delivery can only be marked as "Completed" when the truck is physically within 50 meters of the designated site.

## 3. Real-Time Volume Reconciliation
Most companies reconcile at the end of the month. By then, it's too late. Successful managers reconcile daily. If you dispatched 10,000L and the site received 9,500L, you need to know the same day to hold the driver accountable.

## 4. Monitor Asset Fuel Consumption Ratios
Fuel isn't just stolen during transit; it's often stolen from the generator or truck tank itself. By tracking "Fuel vs. Work Hours," NexHaul flags anomalies where fuel consumption spikes without a corresponding increase in work.

## 5. Build a Culture of Accountability
When drivers and site engineers know that every liter is being digitally tracked and reported in real-time to headquarters, the "temptation" drops significantly. Visibility is the best deterrent.

Ready to stop the bleeding? NexHaul InfraSupply was built specifically to solve these challenges in the Nigerian market.
        `
    },
    {
        id: 'manual-vs-digital-waybills',
        type: 'blog',
        slug: 'manual-vs-digital-waybills-why-paper-is-killing-profit',
        title: 'Manual vs. Digital Waybills: Why Paper is Killing Your Profit Margin',
        excerpt: 'Lost waybills, manual entry errors, and poor audit trails. Discover why the most successful logistics firms are going paperless.',
        author: 'NexHaul Tech Team',
        date: 'March 5, 2026',
        readTime: '4 min read',
        category: 'Operations',
        thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800',
        keywords: ['digital waybill system', 'logistics automation', 'supply chain efficiency'],
        content: `
# Manual vs. Digital Waybills: Why Paper is Killing Your Profit Margin

In the fast-paced world of Nigerian haulage, speed is everything. Yet, many companies are still held back by a 100-year-old technology: Paper.

## The Hidden Cost of Paper
If you think paper is "free," consider these hidden costs:
- Reconciliation Lag: It can take 2 weeks for a signed waybill to return to the head office. That's 14 days of financial blindness.
- Physical Loss: Waybills get wet, torn, or lost in truck cabs. A lost waybill often means a delayed payment from the client.
- Human Error: Manual data entry from paper to Excel leads to a 3-5% error rate in billing.

## The Digital Advantage
A Digital Waybill system like NexHaul doesn't just "replace" paper; it transforms your business:
1. Instant Billing: The moment a delivery is confirmed, your finance team has the data.
2. Iron-Clad Audit Trail: See exactly who signed for the product, at what time, and at what GPS coordinate.
3. Searchability: Need to find a delivery from 6 months ago? It takes 2 seconds, not 2 hours in a filing cabinet.

The transition to digital is no longer a "luxury"—it is a survival requirement for modern logistics.
        `
    },
    {
        id: 'automating-work-orders-pow',
        type: 'blog',
        slug: 'beyond-whatsapp-automated-work-orders-site-longevity',
        title: 'Beyond WhatsApp: Why Automated Work Orders are Critical for Asset Longevity',
        excerpt: 'Chasing proof of work in WhatsApp chats is killing your generators and trucks. Discover how geo-fenced work orders ensure 100% uptime.',
        author: 'NexHaul Operations Lead',
        date: 'March 8, 2026',
        readTime: '7 min read',
        category: 'Maintenance',
        thumbnail: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800',
        keywords: ['field service management software', 'automated work orders', 'proof of work maintenance', 'asset longevity'],
        content: `
# Beyond WhatsApp: Why Automated Work Orders are Critical for Asset Longevity

In many Nigerian field operations, the standard "Proof of Work" (PoW) is a blurry photo sent to a crowded WhatsApp group. While it feels fast, this "WhatsApp Workflow" is the single greatest threat to your asset longevity and your bottom line.

## The Chaos of Unverified Maintenance
When maintenance is tracked via chat, you face three critical failures:
1. Ghost Visits: An engineer reports a site visit, but without GPS-stamping, you have no proof they were actually there.
2. Data Fragmentation: Try finding a photo of a generator service from 6 months ago. It's impossible.
3. Spare Part Leakage: Without a digital link between a work order and inventory, spare parts "disappear" between the warehouse and the site.

## The NexHaul Maintain Advantage
NexHaul Maintain was built to replace this chaos with Asset Intelligence.

### 1. Geo-Fenced Proof of Work
With NexHaul, a field engineer can only submit a "Work in Progress" or "Completion" report if their phone's GPS is within 50 meters of the asset. No more ghost visits. Every photo is time-stamped and watermarked, creating an iron-clad audit trail.

### 2. Automatic Work Order Assignment
Why waste time calling around? NexHaul automatically predicts and assigns the best engineer for a ticket. The work order alert auto predicts when an asset is due for servicing, triggers a workflow, and alerts the engineer in that cluster responsible for asset maintenance. Engineers can easily carry out services on time while leveraging their inventory stocks to check if they have the right components to carry out the service ASAP. Assignment is optimized based on:
- Proximity to the site.
- Skillset (e.g., HVAC vs. Power).
- Real-time inventory availability in their vehicle.

### 3. Predicting Asset Life
By tracking consistent "Run Hours vs. Fuel Usage," NexHaul flags anomalies. If a generator is consuming more fuel after a service, the system detects it immediately, preventing a catastrophe before it happens.

## The 40% Longevity Rule
Data shows that assets maintained through a verified, automated system like NexHaul live 40% longer than those managed via manual spreadsheets or chats. Consistent, verified preventive maintenance (PM) is the only way to reduce the Total Cost of Ownership (TCO).

Stop the chat chaos. Leverage NexHaul Maintain to digitize your field operations and give your assets a longer, more productive life.
        `
    }
];
