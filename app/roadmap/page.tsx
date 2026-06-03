"use client";

import {
  ErrorMessages,
  GrowthModelChart,
  ModelDescriptions,
  PageShell,
  RoadmapTable,
  SectionCard,
  buildGrowthModelData,
  buildRoadmap,
  useDashboardData,
} from "../shared";

export default function RoadmapPage() {
  const { values, metrics } = useDashboardData();
  const modelData = buildGrowthModelData(values);

  return (
    <PageShell>
      <ErrorMessages errors={metrics.errors} />
      <SectionCard eyebrow="MODELS" title="成長モデル別の到達値">
        <div className="grid gap-3 md:grid-cols-3">
          <ModelCard title="線形成長" value={modelData.at(-1)?.linear ?? values.targetFollowers} />
          <ModelCard title="SNS型成長" value={modelData.at(-1)?.sns ?? values.targetFollowers} />
          <ModelCard title="指数型成長" value={modelData.at(-1)?.exponential ?? values.targetFollowers} />
        </div>
      </SectionCard>
      <SectionCard eyebrow="MODEL GUIDE" title="モデル説明">
        <ModelDescriptions />
      </SectionCard>
      <GrowthModelChart values={values} />
      <RoadmapTable
        description={`毎週の記事目標 ${values.articlesPerWeek}本 ・ つぶやき目標 ${values.shortPostsPerWeek}件`}
        items={buildRoadmap(values, 7)}
        title="週次ロードマップ"
      />
      <RoadmapTable
        description={`毎月の記事目標 ${values.articlesPerWeek * 4}本 ・ つぶやき目標 ${values.shortPostsPerWeek * 4}件`}
        items={buildRoadmap(values, 30)}
        title="月次ロードマップ"
      />
    </PageShell>
  );
}

function ModelCard({ title, value }: { title: string; value: number }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-bold text-stone-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-stone-800">{value}人</p>
    </article>
  );
}
