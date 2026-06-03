"use client";

import {
  DailyLogForm,
  ErrorMessages,
  MetricCard,
  PageShell,
  RecentLogs,
  SectionCard,
  decimal,
  formatDate,
  useDashboardData,
} from "./shared";

export default function DashboardPage() {
  const data = useDashboardData();
  const { values, metrics, analysis } = data;
  const isBehind = metrics.progressDelta < 0;
  const adjustedReads =
    values.readsPerDay + (isBehind ? Math.max(2, Math.ceil(Math.abs(metrics.progressDelta) / 10)) : 0);
  const adjustedComments =
    values.commentsPerDay + (isBehind ? Math.max(1, Math.ceil(Math.abs(metrics.progressDelta) / 20)) : 0);

  return (
    <PageShell>
      <ErrorMessages errors={metrics.errors} />
      <SectionCard
        description={isBehind ? "少し行動量を増やして、交流のきっかけを作りましょう。" : "順調です。記事の質と継続を大切にしましょう。"}
        eyebrow="TODAY"
        title="今日の勝利条件"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Action title="他人の記事を読む" value={`${adjustedReads}記事`} />
          <Action title="コメントする" value={`${adjustedComments}件`} />
          <Action title="つぶやきを投稿する" value={`週${values.shortPostsPerWeek}件ペース`} />
          <Action title="記事テーマを考える" value={`週${values.articlesPerWeek}本につなげる`} />
        </div>
      </SectionCard>

      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard label="達成率" value={decimal(Math.min(metrics.achievementRate, 100))} unit="%" accent />
        <MetricCard label="予定との差" value={`${metrics.progressDelta >= 0 ? "+" : ""}${metrics.progressDelta}`} unit="人" />
        <MetricCard label="残り日数" value={Math.max(metrics.remainingDays, 0)} unit="日" />
      </section>

      <SectionCard eyebrow="PROGRESS" title="達成率と予定との差">
        <p className={`text-sm font-bold ${isBehind ? "text-rose-600" : "text-emerald-700"}`}>
          予定より{Math.abs(metrics.progressDelta)}人{isBehind ? "遅れています" : "進んでいます"}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          今日の予定 {metrics.plannedFollowers}人 ・ 現在 {values.currentFollowers}人
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min(metrics.achievementRate, 100)}%` }}
          />
        </div>
      </SectionCard>

      <DailyLogForm {...data} />

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="直近7日の増加" value={analysis.followerIncrease} unit="人" />
        <MetricCard label="1日平均" value={decimal(analysis.averagePerDay)} unit="人 / 日" />
        <MetricCard label="必要ペースとの差" value={`${analysis.paceDelta >= 0 ? "+" : ""}${decimal(analysis.paceDelta)}`} unit="人 / 日" />
        <MetricCard label="達成予測" value={analysis.predictionDate ? formatDate(analysis.predictionDate) : "未算出"} unit="" />
      </section>

      <RecentLogs {...data} />
    </PageShell>
  );
}

function Action({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl bg-stone-900 p-4 text-white">
      <h3 className="font-black">{title}</h3>
      <p className="mt-1 text-sm text-emerald-200">{value}</p>
    </article>
  );
}
