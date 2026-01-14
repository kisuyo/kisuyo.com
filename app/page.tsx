import GlassCard from "@/components/glassCard";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#fffaf4] via-[#fdfdff] to-[#f2fbff]">
      <GlassCard>
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-slate-900">
            Hey, I'm Igor
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            I'm a full stack engineer learning to make games
          </p>
        </div>
      </GlassCard>
    </main>
  );
}
