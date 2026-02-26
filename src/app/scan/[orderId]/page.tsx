import ScanPageClient from './page-client';

interface ScanPageProps {
    params: { orderId: string };
}

export default function ScanPage({ params }: ScanPageProps) {
    return <ScanPageClient orderId={params.orderId} />;
}

export const metadata = {
    title: 'Order Pickup | Markitbot',
    description: 'Scan order QR code to manage pickup',
};

