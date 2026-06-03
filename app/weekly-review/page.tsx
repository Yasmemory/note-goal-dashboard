"use client";

import {
  ErrorMessages,
  MetricCard,
  PageShell,
  SectionCard,
  buildWeeklyReview,
  decimal,
  formatDate,
  useDashboardData,
} from "../shared";

export default function WeeklyReviewPage() {
  const { metrics, logs, values } = useDashboardData();
  const review = buildWeeklyReview(logs, values, metrics.requiredFollowersPerWeek);

  return (
    <PageShell>
      <ErrorMessages errors={metrics.errors} />

      <SectionCard
        description={`${formatDate(review.weekStart)}からの今週のふりかえりです。`}
        eyebrow="WEEKLY REVIEW"
        title="今週のレビュー"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <ReviewCard label="今週の結果" value={`+${review.weeklyIncrease}人`} />
          <ReviewCard label="目標" value={`+${decimal(review.weeklyTarget)}人`} />
          <ReviewCard label="評価" value={review.evaluation} accent={review.targetGap >= 0} />
        </div>
      </SectionCard>

      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard label="今週の目標達成率" value={decimal(review.achievementRate)} unit="%" accent />
        <MetricCard
          label="目標との差"
          value={`${review.targetGap >= 0 ? "+" : ""}${decimal(review.targetGap)}`}
          unit="人"
        />
        <MetricCard label="最も少なかった行動" value={review.leastAction} unit="" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <SectionCard eyebrow="BEST ACTION" title="最も成果に繋がった行動">
          <p className="text-3xl font-black text-emerald-700">{review.mostEffectiveAction}</p>
          <p className="mt-2 text-sm text-stone-500">
            Analyticsの相関分析から、伸びに効いていそうな行動を表示しています。
          </p>
        </SectionCard>

        <SectionCard eyebrow="NEXT WEEK" title="来週の推奨行動">
          <p className="text-3xl font-black text-stone-800">{review.recommendation}</p>
          <p className="mt-2 text-sm text-stone-500">
            今週の不足行動と成果につながった行動をもとに提案しています。
          </p>
        </SectionCard>
      </section>
    </PageShell>
  );
}

function ReviewCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <article
      className={`rounded-2xl border p-5 ${
        accent ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-stone-200 bg-stone-50 text-stone-800"
      }`}
    >
      <p className="text-xs font-bold text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </article>
  );
}
