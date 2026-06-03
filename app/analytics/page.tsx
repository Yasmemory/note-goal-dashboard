"use client";

import {
  ActualProgressChart,
  ErrorMessages,
  GrowthModelChart,
  MetricCard,
  PageShell,
  SectionCard,
  decimal,
  formatDate,
  useDashboardData,
} from "../shared";

export default function AnalyticsPage() {
  const { values, logs, metrics, analysis } = useDashboardData();

  return (
    <PageShell>
      <ErrorMessages errors={metrics.errors} />
      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="7日増加" value={analysis.followerIncrease} unit="人" />
        <MetricCard label="1日平均増加" value={decimal(analysis.averagePerDay)} unit="人 / 日" />
        <MetricCard label="必要ペースとの差" value={`${analysis.paceDelta >= 0 ? "+" : ""}${decimal(analysis.paceDelta)}`} unit="人 / 日" />
        <MetricCard label="達成予測" value={analysis.predictionDate ? formatDate(analysis.predictionDate) : "未算出"} unit="" accent />
      </section>

      <SectionCard eyebrow="FORECAST" title="達成予測">
        <p className="text-sm leading-relaxed text-stone-600">
          直近の平均増加数が続くと、
          <span className="font-black text-emerald-700">
            {analysis.predictionDate ? formatDate(analysis.predictionDate) : "まだ予測できません"}
          </span>
          に目標到達見込みです。必要ペースとの差は
          <span className="font-black">{`${analysis.paceDelta >= 0 ? "+" : ""}${decimal(analysis.paceDelta)}人 / 日`}</span>
          です。
        </p>
      </SectionCard>

      <ActualProgressChart logs={logs} values={values} />
      <GrowthModelChart values={values} />
    </PageShell>
  );
}
