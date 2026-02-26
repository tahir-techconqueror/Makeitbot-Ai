// src\app\vibe\preview\[id]\page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicVibe } from '../../actions';
import { VibePreviewClient } from './client';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const result = await getPublicVibe(id);

    if (!result.success || !result.data) {
        return {
            title: 'Vibe Not Found | Markitbot',
        };
    }

    const vibe = result.data;
    const vibeName = vibe.config.name || 'Custom Vibe';

    return {
        title: `${vibeName} - AI Menu Design | Markitbot Vibe Studio`,
        description: vibe.config.description || `Check out this AI-generated dispensary menu design: ${vibeName}`,
        openGraph: {
            title: `${vibeName} - AI-Generated Menu Design`,
            description: `See this stunning cannabis menu design created with Markitbot Vibe Studio`,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${vibeName} - AI Menu Design`,
            description: `Check out this AI-generated dispensary menu design`,
        },
    };
}

export default async function VibePreviewPage({ params }: Props) {
    const { id } = await params;
    const result = await getPublicVibe(id);

    if (!result.success || !result.data) {
        notFound();
    }

    return <VibePreviewClient vibe={result.data} />;
}

