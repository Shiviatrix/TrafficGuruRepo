import ComparisonDashboard from '@/components/comparison-dashboard';

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          AdaptiveFlow
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Smart Adaptive Traffic Light Controller
        </p>
      </header>
      <ComparisonDashboard />
    </main>
  );
}
