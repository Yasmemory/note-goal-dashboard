"use client";

import { ErrorMessages, MetricCard, PageShell, SectionCard, SettingsForm, useDashboardData } from "../shared";

export default function SettingsPage() {
  const data = useDashboardData();
  const { values, metrics } = data;

  return (
    <PageShell>
      <ErrorMessages errors={metrics.errors} />
      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="現在値" value={values.currentFollowers} unit="人" />
        <MetricCard label="目標値" value={values.targetFollowers} unit="人" />
        <MetricCard label="期限" value={values.targetDate} unit="" />
        <MetricCard label="単位" value="フォロワー" unit="" accent />
      </section>
      <SettingsForm {...data} />
      <SectionCard eyebrow="STORAGE" title="保存仕様">
        <p className="text-sm leading-relaxed text-stone-600">
          データベースは使わず、既存のlocalStorageキーを維持しています。目標設定は
          <code className="mx-1 rounded bg-stone-100 px-1 py-0.5">note-follower-roadmap-inputs</code>
          、実績ログは
          <code className="mx-1 rounded bg-stone-100 px-1 py-0.5">note-follower-daily-logs</code>
          に保存されます。
        </p>
      </SectionCard>
    </PageShell>
  );
}
