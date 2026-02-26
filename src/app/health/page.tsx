// src\app\health\page.tsx

export const dynamic = 'force-dynamic';

export default function HealthPage() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Markitbot Health Check</h1>
      <p className="text-sm text-gray-500">
        If you can see this, routing and the app layout are working.
      </p>
    </main>
  );
}
