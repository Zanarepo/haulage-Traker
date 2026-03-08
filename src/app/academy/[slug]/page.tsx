import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, Clock, User, Calendar, Share2, ArrowRight } from 'lucide-react';
import NexHaulLogo from '@/components/NexHaulLogo';
import ShareButton from '@/components/academy/ShareButton';
import { ACADEMY_BLOGS } from '@/lib/academy-data';
import { notFound } from 'next/navigation';

import '../academy.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = ACADEMY_BLOGS.find((b) => b.slug === slug);

  if (!blog) return { title: 'Article Not Found | NexHaul' };

  return {
    title: `${blog.title} | NexHaul Academy`,
    description: blog.excerpt,
    keywords: blog.keywords,
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: [blog.thumbnail],
      type: 'article',
      authors: [blog.author],
      publishedTime: blog.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.excerpt,
      images: [blog.thumbnail],
    }
  };
}

export default async function BlogArticle({ params }: Props) {
  const { slug } = await params;
  const blog = ACADEMY_BLOGS.find((b) => b.slug === slug);

  if (!blog) {
    notFound();
  }

  // Simple renderer for the demo content - in a real app you'd use react-markdown
  const renderContent = (content: string) => {
    return content.split('\n').filter(line => line.trim() !== '').map((line, i) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('# ')) return <h1 key={i}>{trimmedLine.slice(2)}</h1>;
      if (trimmedLine.startsWith('## ')) return <h2 key={i}>{trimmedLine.slice(3)}</h2>;
      if (trimmedLine.startsWith('### ')) return <h3 key={i}>{trimmedLine.slice(4)}</h3>;
      if (trimmedLine.startsWith('- ')) return <li key={i}>{trimmedLine.slice(2)}</li>;
      return <p key={i}>{trimmedLine}</p>;
    });
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": blog.title,
    "description": blog.excerpt,
    "image": blog.thumbnail,
    "author": {
      "@type": "Person",
      "name": blog.author
    },
    "datePublished": blog.date,
    "publisher": {
      "@type": "Organization",
      "name": "NexHaul",
      "logo": {
        "@type": "ImageObject",
        "url": "https://nexhaul.sellyticshq.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://nexhaul.sellyticshq.com/academy/${blog.slug}`
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://nexhaul.sellyticshq.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Academy",
        "item": "https://nexhaul.sellyticshq.com/academy"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": blog.title,
        "item": `https://nexhaul.sellyticshq.com/academy/${blog.slug}`
      }
    ]
  };

  return (
    <div className="article-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav className="article-nav">
        <div className="nav-logo">
          <NexHaulLogo size={24} />
        </div>
        <ShareButton />
        <Link href="/academy" className="back-link">
          <span>Academy Hub</span>
          <ArrowLeft size={18} />
        </Link>
      </nav>

      <article className="main-article">
        <header className="article-header">
          <div className="category-tag">{blog.category}</div>
          <h1>{blog.title}</h1>
          <div className="article-meta">
            <div className="meta-group">
              <div className="meta-item"><User size={16} /> <span>{blog.author}</span></div>
              <div className="meta-item"><Calendar size={16} /> <span>{blog.date}</span></div>
            </div>
            <div className="meta-item"><Clock size={16} /> <span>{blog.readTime}</span></div>
          </div>
        </header>

        <div className="hero-image">
          <img src={blog.thumbnail} alt={blog.title} />
        </div>

        <div className="article-content">
          {renderContent(blog.content)}
        </div>

        <section className="related-articles">
          <h2>Related Insights</h2>
          <div className="related-grid">
            {ACADEMY_BLOGS.filter(b => b.slug !== slug).slice(0, 2).map(related => (
              <Link href={`/academy/${related.slug}`} key={related.id} className="related-card">
                <div className="related-thumb">
                  <img src={related.thumbnail} alt={related.title} />
                </div>
                <div className="related-info">
                  <h4>{related.title}</h4>
                  <span>Read Article <ArrowRight size={14} /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="article-footer">
          <div className="cta-box">
            <h3>Ready to automate your operations?</h3>
            <p>Join the logistics firms in Nigeria using NexHaul to eliminate fuel theft and manual paperwork.</p>
            <Link href="/" className="btn-cta">
              Get Started for Free <ArrowRight size={18} />
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
