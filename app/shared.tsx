"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type FormValues = {
  accountStartDate: string;
  currentDate: string;
  currentFollowers: number;
  targetDate: string;
  targetFollowers: number;
  articlesPerWeek: number;
  shortPostsPerWeek: number;
  readsPerDay: number;
  commentsPerDay: number;
};

export type DailyLog = {
  id: string;
  date: string;
  followers: number;
  articles: number;
  shortPosts: number;
  reads: number;
  comments: number;
  memo: string;
};

type NumberKey = Exclude<keyof FormValues, "accountStartDate" | "currentDate" | "targetDate">;

const INPUT_STORAGE_KEY = "note-follower-roadmap-inputs";
const LOG_STORAGE_KEY = "note-follower-daily-logs";
const DAY_MS = 24 * 60 * 60 * 1000;

export function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export const sampleValues: FormValues = {
  accountStartDate: "2026-05-01",
  currentDate: today(),
  currentFollowers: 42,
  targetDate: "2026-09-30",
  targetFollowers: 500,
  articlesPerWeek: 2,
  shortPostsPerWeek: 5,
  readsPerDay: 5,
  commentsPerDay: 2,
};

function emptyLog(values: FormValues): Omit<DailyLog, "id"> {
  return {
    date: today(),
    followers: values.currentFollowers,
    articles: 0,
    shortPosts: 0,
    reads: 0,
    comments: 0,
    memo: "",
  };
}

export function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function diffDays(from: string, to: string) {
  return Math.floor((parseDate(to).getTime() - parseDate(from).getTime()) / DAY_MS);
}

export function addDays(date: string, days: number) {
  return new Date(parseDate(date).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(
    parseDate(date),
  );
}

export function decimal(value: number) {
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(value);
}

export function useDashboardData() {
  const [values, setValues] = useState<FormValues>(sampleValues);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [dailyLog, setDailyLog] = useState<Omit<DailyLog, "id">>(() => emptyLog(sampleValues));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedInputs = localStorage.getItem(INPUT_STORAGE_KEY);
      const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
      if (storedInputs) setValues({ ...sampleValues, ...JSON.parse(storedInputs) });
      if (storedLogs) setLogs(JSON.parse(storedLogs));
    } catch {
      localStorage.removeItem(INPUT_STORAGE_KEY);
      localStorage.removeItem(LOG_STORAGE_KEY);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(INPUT_STORAGE_KEY, JSON.stringify(values));
  }, [loaded, values]);

  useEffect(() => {
    if (loaded) localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  }, [loaded, logs]);

  useEffect(() => {
    if (loaded) {
      setDailyLog((current) => ({ ...current, followers: values.currentFollowers }));
    }
  }, [loaded, values.currentFollowers]);

  const metrics = useMemo(() => {
    const accountAgeDays = diffDays(values.accountStartDate, values.currentDate);
    const remainingDays = diffDays(values.currentDate, values.targetDate);
    const totalPlanDays = diffDays(values.accountStartDate, values.targetDate);
    const followerGap = values.targetFollowers - values.currentFollowers;
    const errors: string[] = [];

    if (accountAgeDays < 0) errors.push("noteを始めた日は、現在の日付以前に設定してください。");
    if (remainingDays <= 0) errors.push("目標の日付は、現在の日付より後に設定してください。");
    if (followerGap <= 0) {
      errors.push("目標フォロワー数は、現在のフォロワー数より大きく設定してください。");
    }

    const isValid = errors.length === 0;
    const requiredFollowersPerDay = isValid ? followerGap / remainingDays : 0;
    const planRatio =
      totalPlanDays > 0 ? Math.min(Math.max(accountAgeDays / totalPlanDays, 0), 1) : 0;
    const plannedFollowers = Math.round(values.targetFollowers * planRatio);
    const progressDelta = values.currentFollowers - plannedFollowers;

    return {
      accountAgeDays,
      remainingDays,
      followerGap,
      requiredFollowersPerDay,
      requiredFollowersPerWeek: requiredFollowersPerDay * 7,
      requiredFollowersPerMonth: requiredFollowersPerDay * 30,
      achievementRate:
        values.targetFollowers > 0 ? (values.currentFollowers / values.targetFollowers) * 100 : 0,
      plannedFollowers,
      progressDelta,
      errors,
      isValid,
    };
  }, [values]);

  const analysis = useMemo(() => {
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    const windowStart = addDays(values.currentDate, -6);
    const inWindow = sorted.filter((log) => log.date >= windowStart && log.date <= values.currentDate);
    const beforeWindow = sorted.filter((log) => log.date < windowStart).at(-1);
    const baseline = beforeWindow ?? inWindow[0];
    const latest = inWindow.at(-1);
    const followerIncrease = baseline && latest ? Math.max(latest.followers - baseline.followers, 0) : 0;
    const measuredDays = baseline && latest ? Math.max(diffDays(baseline.date, latest.date), 1) : 0;
    const averagePerDay = measuredDays > 0 ? followerIncrease / measuredDays : 0;
    const remainingFollowers = Math.max(values.targetFollowers - values.currentFollowers, 0);
    const predictionDate =
      averagePerDay > 0 ? addDays(values.currentDate, Math.ceil(remainingFollowers / averagePerDay)) : null;
    return {
      followerIncrease,
      averagePerDay,
      predictionDate,
      paceDelta: averagePerDay - metrics.requiredFollowersPerDay,
    };
  }, [logs, metrics.requiredFollowersPerDay, values]);

  function updateNumber(key: NumberKey, value: string) {
    setValues((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  }

  function updateDailyNumber(key: keyof Omit<DailyLog, "id" | "date" | "memo">, value: string) {
    setDailyLog((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  }

  function saveDailyLog() {
    const nextLog = { ...dailyLog, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    setLogs((current) => [...current.filter((log) => log.date !== nextLog.date), nextLog]);
    setValues((current) => ({
      ...current,
      currentDate: nextLog.date,
      currentFollowers: nextLog.followers,
    }));
    setDailyLog({ ...emptyLog(values), date: nextLog.date, followers: nextLog.followers });
  }

  function submitDailyLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveDailyLog();
  }

  function deleteDailyLog(id: string) {
    setLogs((current) => current.filter((log) => log.id !== id));
  }

  return {
    values,
    setValues,
    logs,
    dailyLog,
    setDailyLog,
    metrics,
    analysis,
    updateNumber,
    updateDailyNumber,
    submitDailyLog,
    saveDailyLog,
    deleteDailyLog,
  };
}

export function buildGrowthModelData(values: FormValues) {
  const gap = values.targetFollowers - values.currentFollowers;
  return Array.from({ length: 7 }, (_, index) => {
    const progress = index / 6;
    return {
      progress: `${Math.round(progress * 100)}%`,
      linear: Math.round(values.currentFollowers + gap * progress),
      sns: Math.round(values.currentFollowers + gap * progress ** 1.6),
      exponential: Math.round(values.currentFollowers + gap * progress ** 2.4),
    };
  });
}

export function buildRoadmap(values: FormValues, intervalDays: number) {
  const remainingDays = Math.max(diffDays(values.currentDate, values.targetDate), 1);
  const gap = values.targetFollowers - values.currentFollowers;
  return Array.from({ length: Math.ceil(remainingDays / intervalDays) }, (_, index) => {
    const elapsedDays = Math.min((index + 1) * intervalDays, remainingDays);
    const periodDays = Math.min(intervalDays, remainingDays - index * intervalDays);
    const ratio = elapsedDays / remainingDays;
    return {
      label: intervalDays === 7 ? `Week ${index + 1}` : `${index + 1}か月目`,
      date: addDays(values.currentDate, elapsedDays),
      followerTarget: Math.round(values.currentFollowers + gap * ratio),
      followerIncrease: Math.round((gap * periodDays) / remainingDays),
      articleGoal: Math.ceil((values.articlesPerWeek * periodDays) / 7),
      shortPostGoal: Math.ceil((values.shortPostsPerWeek * periodDays) / 7),
    };
  });
}

export function buildActualProgressData(logs: DailyLog[], values: FormValues) {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  if (sorted.length === 0) {
    return [{ date: formatDate(values.currentDate), followers: values.currentFollowers }];
  }
  return sorted.map((log) => ({ date: formatDate(log.date), followers: log.followers }));
}

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

export function plannedFollowersOnDate(values: FormValues, date: string) {
  const totalDays = Math.max(diffDays(values.accountStartDate, values.targetDate), 1);
  const elapsedDays = diffDays(values.accountStartDate, date);
  const progress = clampProgress(elapsedDays / totalDays);
  return Math.round(values.targetFollowers * progress);
}

export function sortedDailyLogs(logs: DailyLog[]) {
  return [...logs].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildPlannedVsActualData(logs: DailyLog[], values: FormValues) {
  const sorted = sortedDailyLogs(logs);
  const rows = sorted.map((log) => ({
    actual: log.followers,
    date: formatDate(log.date),
    fullDate: log.date,
    planned: plannedFollowersOnDate(values, log.date),
  }));

  if (!rows.some((row) => row.fullDate === values.currentDate)) {
    rows.push({
      actual: values.currentFollowers,
      date: formatDate(values.currentDate),
      fullDate: values.currentDate,
      planned: plannedFollowersOnDate(values, values.currentDate),
    });
  }

  return rows.sort((a, b) => a.fullDate.localeCompare(b.fullDate)).slice(-30);
}

export function buildTimeline(logs: DailyLog[]) {
  const sorted = sortedDailyLogs(logs);
  return sorted
    .map((log, index) => ({
      ...log,
      delta: index === 0 ? 0 : log.followers - sorted[index - 1].followers,
    }))
    .reverse();
}

function average(numbers: number[]) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function averageDeltaFor(entries: ReturnType<typeof buildTimeline>, predicate: (entry: ReturnType<typeof buildTimeline>[number]) => boolean) {
  return average(entries.filter(predicate).map((entry) => entry.delta));
}

export function buildCorrelationAnalysis(logs: DailyLog[]) {
  const chronological = buildTimeline(logs).reverse();
  const actionableEntries = chronological.filter((entry) => entry.delta !== 0 || chronological.length > 1).slice(1);
  const hasEnoughData = chronological.length >= 4;
  const averageComments = average(chronological.map((entry) => entry.comments));
  const averageReads = average(chronological.map((entry) => entry.reads));

  const cards = [
    {
      label: "記事投稿した日",
      value: averageDeltaFor(actionableEntries, (entry) => entry.articles > 0),
      sampleCount: actionableEntries.filter((entry) => entry.articles > 0).length,
    },
    {
      label: "つぶやき投稿した日",
      value: averageDeltaFor(actionableEntries, (entry) => entry.shortPosts > 0),
      sampleCount: actionableEntries.filter((entry) => entry.shortPosts > 0).length,
    },
    {
      label: "コメント数が多い日",
      value: averageDeltaFor(actionableEntries, (entry) => entry.comments > averageComments),
      sampleCount: actionableEntries.filter((entry) => entry.comments > averageComments).length,
    },
    {
      label: "読んだ記事数が多い日",
      value: averageDeltaFor(actionableEntries, (entry) => entry.reads > averageReads),
      sampleCount: actionableEntries.filter((entry) => entry.reads > averageReads).length,
    },
  ];

  const best = cards
    .filter((card) => card.sampleCount > 0)
    .sort((a, b) => b.value - a.value)
    .at(0);

  return {
    bestLabel: best?.label ?? null,
    cards,
    hasEnoughData,
  };
}

export function buildVictoryRecommendations(logs: DailyLog[], values: FormValues) {
  const correlation = buildCorrelationAnalysis(logs);

  if (!correlation.hasEnoughData) {
    return {
      hasEnoughData: false,
      items: [],
      reason: "まだ十分な分析データがありません",
    };
  }

  const rankedCards = correlation.cards
    .filter((card) => card.sampleCount > 0)
    .sort((a, b) => b.value - a.value);
  const strongest = rankedCards[0]?.label ?? "";
  const items = [
    {
      checked: false,
      label: `コメント${Math.max(values.commentsPerDay, strongest.includes("コメント") ? values.commentsPerDay + 2 : values.commentsPerDay)}件`,
    },
    {
      checked: false,
      label: `記事${strongest.includes("記事") ? 1 : Math.max(1, Math.ceil(values.articlesPerWeek / 3))}本`,
    },
    {
      checked: false,
      label: `他人の記事${Math.max(values.readsPerDay, strongest.includes("読") ? values.readsPerDay + 2 : values.readsPerDay)}本`,
    },
  ];

  if (strongest.includes("つぶやき")) {
    items.splice(2, 0, { checked: false, label: "つぶやき1件" });
  }

  return {
    hasEnoughData: true,
    items: items.slice(0, 4),
    reason: strongest ? `${strongest}が伸びに効いていそうです` : "実績データから今日の行動を提案します",
  };
}

export function buildWeeklyReview(logs: DailyLog[], values: FormValues, requiredFollowersPerWeek: number) {
  const current = parseDate(values.currentDate);
  const day = current.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const weekStart = addDays(values.currentDate, -daysFromMonday);
  const weekLogs = sortedDailyLogs(logs).filter((log) => log.date >= weekStart && log.date <= values.currentDate);
  const beforeWeek = sortedDailyLogs(logs).filter((log) => log.date < weekStart).at(-1);
  const first = weekLogs[0];
  const latest = weekLogs.at(-1);
  const baselineFollowers = beforeWeek?.followers ?? first?.followers ?? values.currentFollowers;
  const latestFollowers = latest?.followers ?? values.currentFollowers;
  const weeklyIncrease = Math.max(latestFollowers - baselineFollowers, 0);
  const weeklyTarget = Math.max(requiredFollowersPerWeek, 0);
  const achievementRate = weeklyTarget > 0 ? (weeklyIncrease / weeklyTarget) * 100 : 0;
  const targetGap = weeklyIncrease - weeklyTarget;
  const correlation = buildCorrelationAnalysis(logs);
  const mostEffectiveAction = correlation.bestLabel ?? "まだ判定できません";
  const actionTotals = [
    { label: "記事投稿", value: weekLogs.reduce((sum, log) => sum + log.articles, 0) },
    { label: "つぶやき投稿", value: weekLogs.reduce((sum, log) => sum + log.shortPosts, 0) },
    { label: "読む記事", value: weekLogs.reduce((sum, log) => sum + log.reads, 0) },
    { label: "コメント活動", value: weekLogs.reduce((sum, log) => sum + log.comments, 0) },
  ];
  const leastAction = actionTotals.sort((a, b) => a.value - b.value)[0]?.label ?? "未判定";
  const recommendation = correlation.bestLabel
    ? `${correlation.bestLabel}を維持する`
    : `${leastAction}を少し増やす`;

  return {
    achievementRate,
    evaluation: targetGap >= 0 ? "目標達成" : "目標未達",
    leastAction,
    mostEffectiveAction,
    recommendation,
    targetGap,
    weekStart,
    weeklyIncrease,
    weeklyTarget,
  };
}

export function buildForecastAnalysis(logs: DailyLog[], values: FormValues, requiredFollowersPerDay: number) {
  const sorted = sortedDailyLogs(logs);
  const latestFollowers = values.currentFollowers;
  const remainingFollowers = Math.max(values.targetFollowers - latestFollowers, 0);
  const lastSevenStart = addDays(values.currentDate, -6);
  const lastSeven = sorted.filter((log) => log.date >= lastSevenStart && log.date <= values.currentDate);
  const lastSevenBaseline = sorted.filter((log) => log.date < lastSevenStart).at(-1) ?? lastSeven[0];
  const lastSevenLatest = lastSeven.at(-1);
  const lastSevenDays =
    lastSevenBaseline && lastSevenLatest ? Math.max(diffDays(lastSevenBaseline.date, lastSevenLatest.date), 1) : 0;
  const lastSevenAverage =
    lastSevenBaseline && lastSevenLatest ? Math.max(lastSevenLatest.followers - lastSevenBaseline.followers, 0) / lastSevenDays : 0;

  const first = sorted[0];
  const latest = sorted.at(-1);
  const allDays = first && latest ? Math.max(diffDays(first.date, latest.date), 1) : 0;
  const allAverage = first && latest ? Math.max(latest.followers - first.followers, 0) / allDays : 0;
  const actualAverage = lastSevenAverage > 0 ? lastSevenAverage : allAverage;
  const predictedDate =
    actualAverage > 0 ? addDays(values.currentDate, Math.ceil(remainingFollowers / actualAverage)) : null;
  const canReachByTarget = predictedDate ? diffDays(predictedDate, values.targetDate) >= 0 : false;

  return {
    actualAverage,
    allAverage,
    canReachByTarget,
    lastSevenAverage,
    paceDelta: actualAverage - requiredFollowersPerDay,
    predictedDate,
  };
}

export function AppHeader() {
  const pathname = usePathname();
  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/analytics", label: "Analytics" },
    { href: "/roadmap", label: "Roadmap" },
    { href: "/weekly-review", label: "Weekly" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="border-b border-emerald-900/10 bg-emerald-700 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <p className="text-xs font-bold tracking-[0.2em] text-emerald-200">NOTE GROWTH PLANNER</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">
          フォロワー目標達成ダッシュボード
        </h1>
        <nav className="mt-5 grid grid-cols-2 gap-2 sm:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                className={`rounded-full px-4 py-2 text-center text-sm font-black transition ${
                  active ? "bg-white text-emerald-800" : "bg-emerald-800 text-emerald-100 hover:bg-emerald-900"
                }`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">{children}</main>;
}

export function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      {eyebrow && <p className="text-xs font-bold tracking-[0.18em] text-emerald-600">{eyebrow}</p>}
      <h2 className="mt-1 text-xl font-black text-stone-800">{title}</h2>
      {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: string | number;
  unit: string;
  accent?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm ${
        accent ? "border-emerald-400 bg-emerald-600 text-white" : "border-stone-200 bg-white"
      }`}
    >
      <p className={`text-xs font-bold ${accent ? "text-emerald-100" : "text-stone-500"}`}>{label}</p>
      <p className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-black tracking-tight">{value}</span>
        <span className={`text-xs font-bold ${accent ? "text-emerald-100" : "text-stone-400"}`}>{unit}</span>
      </p>
    </article>
  );
}

export function ErrorMessages({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <p className="font-black">入力内容を確認してください</p>
      {errors.map((error) => (
        <p className="mt-1" key={error}>
          ・{error}
        </p>
      ))}
    </section>
  );
}

export function DailyLogForm({
  dailyLog,
  setDailyLog,
  updateDailyNumber,
  submitDailyLog,
  saveDailyLog,
}: Pick<
  ReturnType<typeof useDashboardData>,
  "dailyLog" | "setDailyLog" | "updateDailyNumber" | "submitDailyLog" | "saveDailyLog"
>) {
  return (
    <SectionCard eyebrow="DAILY LOG" title="今日の実績入力">
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitDailyLog}>
        <label className="text-xs font-bold text-stone-600">
          日付
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm"
            onChange={(e) => setDailyLog({ ...dailyLog, date: e.target.value })}
            required
            type="date"
            value={dailyLog.date}
          />
        </label>
        <label className="text-xs font-bold text-stone-600">
          今日のフォロワー数
          <input
            className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm"
            min="0"
            onChange={(e) => updateDailyNumber("followers", e.target.value)}
            required
            type="number"
            value={dailyLog.followers}
          />
        </label>
        {(
          [
            ["articles", "今日の記事投稿数"],
            ["shortPosts", "今日のつぶやき投稿数"],
            ["reads", "今日読んだ記事数"],
            ["comments", "今日コメントした数"],
          ] as const
        ).map(([key, label]) => (
          <label className="text-xs font-bold text-stone-600" key={key}>
            {label}
            <input
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm"
              min="0"
              onChange={(e) => updateDailyNumber(key, e.target.value)}
              type="number"
              value={dailyLog[key]}
            />
          </label>
        ))}
        <label className="text-xs font-bold text-stone-600 sm:col-span-2">
          メモ
          <textarea
            className="mt-1 min-h-24 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm"
            onChange={(e) => setDailyLog({ ...dailyLog, memo: e.target.value })}
            placeholder="今日の気づきや、次に試したいこと"
            value={dailyLog.memo}
          />
        </label>
        <button
          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 sm:col-span-2"
          onClick={saveDailyLog}
          type="button"
        >
          実績を保存する
        </button>
      </form>
    </SectionCard>
  );
}

export function RecentLogs({
  logs,
  deleteDailyLog,
  limit = 10,
}: {
  logs: DailyLog[];
  deleteDailyLog: (id: string) => void;
  limit?: number;
}) {
  const recentLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);

  return (
    <SectionCard eyebrow="HISTORY" title="直近の進捗サマリー">
      <div className="space-y-3">
        {recentLogs.map((log) => (
          <article className="rounded-2xl border border-stone-100 bg-stone-50 p-4" key={log.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-stone-800">{formatDate(log.date)}</p>
                <p className="mt-1 text-xs text-stone-500">
                  フォロワー {log.followers}人 ・ 記事 {log.articles}本 ・ つぶやき {log.shortPosts}件
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  読んだ記事 {log.reads}本 ・ コメント {log.comments}件
                </p>
                {log.memo && <p className="mt-2 text-sm text-stone-600">{log.memo}</p>}
              </div>
              <button
                className="shrink-0 text-xs font-bold text-rose-500"
                onClick={() => deleteDailyLog(log.id)}
                type="button"
              >
                削除
              </button>
            </div>
          </article>
        ))}
        {recentLogs.length === 0 && (
          <p className="rounded-2xl bg-stone-50 px-4 py-5 text-center text-sm text-stone-400">
            まだ実績ログはありません。
          </p>
        )}
      </div>
    </SectionCard>
  );
}

export function GrowthModelChart({ values }: { values: FormValues }) {
  const data = buildGrowthModelData(values);
  return (
    <SectionCard
      description="現在値から目標値までの進み方を、3つの仮説で比較します。"
      eyebrow="GROWTH MODELS"
      title="成長モデル比較グラフ"
    >
      <div className="overflow-x-auto">
        <LineChart data={data} height={320} margin={{ bottom: 8, left: -8, right: 24, top: 8 }} width={720}>
          <CartesianGrid stroke="#e7e5e4" strokeDasharray="4 4" />
          <XAxis dataKey="progress" stroke="#78716c" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis stroke="#78716c" tick={{ fontSize: 12 }} tickLine={false} width={58} />
          <Tooltip
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                linear: "線形成長",
                sns: "SNS型成長",
                exponential: "指数型成長",
              };
              return [`${value}人`, labels[String(name)] ?? String(name)];
            }}
            labelFormatter={(label) => `進捗 ${label}`}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Line dataKey="linear" dot={{ r: 3 }} name="線形成長" stroke="#059669" strokeWidth={3} type="monotone" />
          <Line dataKey="sns" dot={{ r: 3 }} name="SNS型成長" stroke="#2563eb" strokeWidth={3} type="monotone" />
          <Line
            dataKey="exponential"
            dot={{ r: 3 }}
            name="指数型成長"
            stroke="#e11d48"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </div>
    </SectionCard>
  );
}

export function ModelDescriptions() {
  return (
    <div className="grid gap-3 text-sm leading-relaxed text-stone-600 md:grid-cols-3">
      <p className="rounded-2xl bg-emerald-50 p-4">
        <span className="font-black text-emerald-700">線形成長:</span> 毎期間ほぼ同じペースで増える想定です。
      </p>
      <p className="rounded-2xl bg-blue-50 p-4">
        <span className="font-black text-blue-700">SNS型成長:</span> 序盤はゆっくり、後半に反応が伸びる想定です。
      </p>
      <p className="rounded-2xl bg-rose-50 p-4">
        <span className="font-black text-rose-700">指数型成長:</span> 序盤はかなり遅く、終盤に強く伸びる想定です。
      </p>
    </div>
  );
}

export function ActualProgressChart({ logs, values }: { logs: DailyLog[]; values: FormValues }) {
  const data = buildActualProgressData(logs, values);
  return (
    <SectionCard eyebrow="ACTUALS" title="実績グラフ" description="直近の記録からフォロワー推移を表示します。">
      <div className="overflow-x-auto">
        <LineChart data={data} height={280} margin={{ bottom: 8, left: -8, right: 24, top: 8 }} width={680}>
          <CartesianGrid stroke="#e7e5e4" strokeDasharray="4 4" />
          <XAxis dataKey="date" stroke="#78716c" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis stroke="#78716c" tick={{ fontSize: 12 }} tickLine={false} width={58} />
          <Tooltip formatter={(value) => [`${value}人`, "フォロワー"]} />
          <Line dataKey="followers" dot={{ r: 3 }} name="フォロワー" stroke="#059669" strokeWidth={3} type="monotone" />
        </LineChart>
      </div>
    </SectionCard>
  );
}

export function PlannedVsActualChart({
  logs,
  progressDelta,
  values,
}: {
  logs: DailyLog[];
  progressDelta: number;
  values: FormValues;
}) {
  const data = buildPlannedVsActualData(logs, values);
  const isBehind = progressDelta < 0;

  return (
    <SectionCard
      description="日次ログの実績値と、開始日から目標日までの予定値を同じグラフで比較します。"
      eyebrow="PLAN VS ACTUAL"
      title="予定 vs 実績グラフ"
    >
      <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-black ${isBehind ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
        予定より{Math.abs(progressDelta)}人{isBehind ? "遅れ" : "先行"}
      </div>
      <div className="overflow-x-auto">
        <LineChart data={data} height={320} margin={{ bottom: 8, left: -8, right: 24, top: 8 }} width={760}>
          <CartesianGrid stroke="#e7e5e4" strokeDasharray="4 4" />
          <XAxis dataKey="date" stroke="#78716c" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis stroke="#78716c" tick={{ fontSize: 12 }} tickLine={false} width={58} />
          <Tooltip
            formatter={(value, name, item) => {
              const dataKey = "dataKey" in item ? item.dataKey : name;
              return [`${value}人`, dataKey === "planned" ? "予定値" : "実績値"];
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Line dataKey="planned" dot={{ r: 3 }} name="予定値" stroke="#94a3b8" strokeDasharray="6 4" strokeWidth={3} type="monotone" />
          <Line dataKey="actual" dot={{ r: 3 }} name="実績値" stroke="#059669" strokeWidth={3} type="monotone" />
        </LineChart>
      </div>
    </SectionCard>
  );
}

export function HistoryTimeline({ logs }: { logs: DailyLog[] }) {
  const timeline = buildTimeline(logs);

  return (
    <SectionCard
      description="最新だけでなく、保存済みの日次ログを時系列で振り返れます。"
      eyebrow="TIMELINE"
      title="履歴タイムライン"
    >
      <div className="space-y-3">
        {timeline.map((log) => (
          <details className="rounded-2xl border border-stone-200 bg-stone-50 p-4" key={log.id} open={timeline.length <= 4}>
            <summary className="cursor-pointer list-none">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-stone-800">{formatDate(log.date)}</p>
                  <p className="text-xs text-stone-500">フォロワー {log.followers}人</p>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${log.delta >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  前回比 {log.delta >= 0 ? "+" : ""}
                  {log.delta}人
                </span>
              </div>
            </summary>
            <div className="mt-4 grid gap-2 text-sm text-stone-600 sm:grid-cols-2 lg:grid-cols-4">
              <p>記事: <span className="font-black">{log.articles}本</span></p>
              <p>つぶやき: <span className="font-black">{log.shortPosts}件</span></p>
              <p>読んだ記事: <span className="font-black">{log.reads}本</span></p>
              <p>コメント: <span className="font-black">{log.comments}件</span></p>
            </div>
            {log.memo && <p className="mt-3 rounded-xl bg-white p-3 text-sm text-stone-600">{log.memo}</p>}
          </details>
        ))}
        {timeline.length === 0 && (
          <p className="rounded-2xl bg-stone-50 px-4 py-5 text-center text-sm text-stone-400">
            まだ実績ログはありません。
          </p>
        )}
      </div>
    </SectionCard>
  );
}

export function CorrelationAnalysis({ logs }: { logs: DailyLog[] }) {
  const correlation = buildCorrelationAnalysis(logs);

  if (!correlation.hasEnoughData) {
    return (
      <SectionCard eyebrow="CORRELATION" title="行動と成果の相関分析">
        <p className="rounded-2xl bg-stone-50 px-4 py-5 text-center text-sm font-bold text-stone-500">
          まだ分析にはデータが足りません。4件以上の実績ログがあると傾向を見やすくなります。
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      description={correlation.bestLabel ? `${correlation.bestLabel}が伸びに効いていそうです。` : "平均との差を見ながら、効いている行動を探します。"}
      eyebrow="CORRELATION"
      title="行動と成果の相関分析"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {correlation.cards.map((card) => (
          <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4" key={card.label}>
            <p className="text-xs font-bold text-stone-500">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-stone-800">
              {card.sampleCount > 0 ? `${decimal(card.value)}` : "-"}
              <span className="ml-1 text-xs text-stone-400">人 / 日</span>
            </p>
            <p className="mt-1 text-xs text-stone-400">対象ログ {card.sampleCount}件</p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

export function ActualForecastPanel({
  logs,
  requiredFollowersPerDay,
  values,
}: {
  logs: DailyLog[];
  requiredFollowersPerDay: number;
  values: FormValues;
}) {
  const forecast = buildForecastAnalysis(logs, values, requiredFollowersPerDay);

  return (
    <SectionCard
      description="直近7日と全期間の実績ペースから、目標日までに届きそうかを判定します。"
      eyebrow="FORECAST"
      title="実績ベースの達成予測"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="直近7日平均" value={decimal(forecast.lastSevenAverage)} unit="人 / 日" />
        <MetricCard label="全期間平均" value={decimal(forecast.allAverage)} unit="人 / 日" />
        <MetricCard label="実績ペースの予測日" value={forecast.predictedDate ? formatDate(forecast.predictedDate) : "未算出"} unit="" accent />
        <MetricCard label="必要ペースとの差" value={`${forecast.paceDelta >= 0 ? "+" : ""}${decimal(forecast.paceDelta)}`} unit="人 / 日" />
      </div>
      <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-black ${forecast.canReachByTarget ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
        {forecast.predictedDate
          ? forecast.canReachByTarget
            ? "今の実績ペースなら目標日までに達成できそうです。"
            : "今の実績ペースでは目標日までに届かない可能性があります。"
          : "実績ログが増えると達成予測を計算できます。"}
      </p>
    </SectionCard>
  );
}

export function RoadmapTable({ title, description, items }: { title: string; description: string; items: ReturnType<typeof buildRoadmap> }) {
  return (
    <SectionCard description={description} eyebrow="ROADMAP" title={title}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs text-stone-400">
              <th className="pb-3 font-bold">期間</th>
              <th className="pb-3 font-bold">期限</th>
              <th className="pb-3 text-right font-bold">到達目標</th>
              <th className="pb-3 text-right font-bold">増加</th>
              <th className="pb-3 text-right font-bold">記事</th>
              <th className="pb-3 text-right font-bold">つぶやき</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-b border-stone-100 last:border-0" key={`${title}-${item.label}`}>
                <td className="py-3 font-bold text-stone-700">{item.label}</td>
                <td className="py-3 text-stone-500">{formatDate(item.date)}</td>
                <td className="py-3 text-right font-black text-emerald-700">{item.followerTarget}人</td>
                <td className="py-3 text-right text-stone-500">+{item.followerIncrease}</td>
                <td className="py-3 text-right text-stone-500">{item.articleGoal}本</td>
                <td className="py-3 text-right text-stone-500">{item.shortPostGoal}件</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export function SettingsForm({
  values,
  setValues,
  updateNumber,
}: Pick<ReturnType<typeof useDashboardData>, "values" | "setValues" | "updateNumber">) {
  return (
    <SectionCard eyebrow="SETTINGS" title="目標設定" description="保存先は既存と同じlocalStorageです。">
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["accountStartDate", "アカウント開始日", "date"],
            ["currentDate", "現在日付", "date"],
            ["currentFollowers", "現在値（フォロワー）", "number"],
            ["targetDate", "期限", "date"],
            ["targetFollowers", "目標値（フォロワー）", "number"],
            ["articlesPerWeek", "記事投稿 / 週", "number"],
            ["shortPostsPerWeek", "つぶやき投稿 / 週", "number"],
            ["readsPerDay", "読む記事 / 日", "number"],
            ["commentsPerDay", "コメント / 日", "number"],
          ] as const
        ).map(([key, label, type]) => (
          <label className="text-xs font-bold text-stone-600" key={key}>
            {label}
            <input
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              min={type === "number" ? 0 : undefined}
              onChange={(event) =>
                type === "date"
                  ? setValues((current) => ({ ...current, [key]: event.target.value }))
                  : updateNumber(key, event.target.value)
              }
              type={type}
              value={values[key]}
            />
          </label>
        ))}
      </div>
      <button
        className="mt-5 rounded-xl bg-stone-900 px-4 py-3 text-sm font-black text-white"
        onClick={() => setValues(sampleValues)}
        type="button"
      >
        サンプル値に戻す
      </button>
    </SectionCard>
  );
}
