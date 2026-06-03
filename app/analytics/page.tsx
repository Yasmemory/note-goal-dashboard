"use client";

import {
  ActualForecastPanel,
  ActualProgressChart,
  CorrelationAnalysis,
  ErrorMessages,
  GrowthModelChart,
  HistoryTimeline,
  MetricCard,
  PageShell,
  PlannedVsActualChart,
  decimal,
  formatDate,
  useDashboardData,
} from "../shared";

export default function AnalyticsPage() {
  const { values, logs, metrics, analysis } = useDashboardData();

  return (
    <PageShell>
      <ErrorMessages errors={metrics.errors} />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="直近7日増加" value={analysis.followerIncrease} unit="人" />
        <MetricCard label="1日平均増加" value={decimal(analysis.averagePerDay)} unit="人 / 日" />
        <MetricCard
          label="予定との差"
          value={`${metrics.progressDelta >= 0 ? "+" : ""}${metrics.progressDelta}`}
          unit="人"
        />
        <MetricCard
          label="達成予測"
          value={analysis.predictionDate ? formatDate(analysis.predictionDate) : "未算出"}
          unit=""
          accent
        />
      </section>

      <PlannedVsActualChart logs={logs} progressDelta={metrics.progressDelta} values={values} />
      <ActualForecastPanel
        logs={logs}
        requiredFollowersPerDay={metrics.requiredFollowersPerDay}
        values={values}
      />
      <ActualProgressChart logs={logs} values={values} />
      <CorrelationAnalysis logs={logs} />
      <HistoryTimeline logs={logs} />
      <GrowthModelChart values={values} />
    </PageShell>
  );
}
