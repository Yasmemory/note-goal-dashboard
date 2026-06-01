"use client";

import { useEffect, useMemo, useState } from "react";

type FormValues = {
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

type NumberKey = Exclude<
  keyof FormValues,
  "accountStartDate" | "currentDate" | "targetDate"
>;

type RoadmapItem = {
  label: string;
  date: string;
  followerTarget: number;
  followerIncrease: number;
  articleGoal: number;
  shortPostGoal: number;
};

const STORAGE_KEY = "note-follower-roadmap-inputs";
const DAY_MS = 24 * 60 * 60 * 1000;

const sampleValues: FormValues = {
  accountStartDate: "2026-05-01",
  currentDate: "2026-06-01",
  currentFollowers: 42,
  targetDate: "2026-09-30",
  targetFollowers: 500,
  articlesPerWeek: 2,
  shortPostsPerWeek: 5,
  readsPerDay: 5,
  commentsPerDay: 2,
};

const inputSections = [
  {
    title: "期間とフォロワー",
    fields: [
      ["accountStartDate", "noteを始めた日", "date"],
      ["currentDate", "現在の日付", "date"],
      ["currentFollowers", "現在のフォロワー", "number"],
      ["targetDate", "目標の日付", "date"],
      ["targetFollowers", "目標フォロワー", "number"],
    ],
  },
  {
    title: "行動ペース",
    fields: [
      ["articlesPerWeek", "記事投稿 / 週", "number"],
      ["shortPostsPerWeek", "つぶやき投稿 / 週", "number"],
      ["readsPerDay", "読む記事 / 日", "number"],
      ["commentsPerDay", "コメント / 日", "number"],
    ],
  },
] as const;

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function diffDays(from: string, to: string) {
  return Math.floor((parseDate(to).getTime() - parseDate(from).getTime()) / DAY_MS);
}

function addDays(date: string, days: number) {
  const next = new Date(parseDate(date).getTime() + days * DAY_MS);
  return next.toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
  }).format(parseDate(date));
}

function decimal(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 1,
  }).format(value);
}

function buildRoadmap(
  values: FormValues,
  remainingDays: number,
  followerGap: number,
  intervalDays: number,
): RoadmapItem[] {
  const itemCount = Math.ceil(remainingDays / intervalDays);

  return Array.from({ length: itemCount }, (_, index) => {
    const elapsedDays = Math.min((index + 1) * intervalDays, remainingDays);
    const periodDays = Math.min(intervalDays, remainingDays - index * intervalDays);
    const ratio = elapsedDays / remainingDays;

    return {
      label: intervalDays === 7 ? `Week ${index + 1}` : `${index + 1}か月目`,
      date: addDays(values.currentDate, elapsedDays),
      followerTarget: Math.round(values.currentFollowers + followerGap * ratio),
      followerIncrease: Math.round((followerGap * periodDays) / remainingDays),
      articleGoal: Math.ceil((values.articlesPerWeek * periodDays) / 7),
      shortPostGoal: Math.ceil((values.shortPostsPerWeek * periodDays) / 7),
    };
  });
}

function MetricCard({
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
        accent
          ? "border-emerald-400 bg-emerald-600 text-white"
          : "border-stone-200 bg-white"
      }`}
    >
      <p className={`text-xs font-bold ${accent ? "text-emerald-100" : "text-stone-500"}`}>
        {label}
      </p>
      <p className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-black tracking-tight">{value}</span>
        <span className={`text-xs font-bold ${accent ? "text-emerald-100" : "text-stone-400"}`}>
          {unit}
        </span>
      </p>
    </article>
  );
}

function Roadmap({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: RoadmapItem[];
}) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-bold tracking-[0.18em] text-emerald-600">ROADMAP</p>
        <h2 className="mt-1 text-xl font-black text-stone-800">{title}</h2>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>
      <div className="mt-5 overflow-x-auto">
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
              <tr key={`${title}-${item.label}`} className="border-b border-stone-100 last:border-0">
                <td className="py-3 font-bold text-stone-700">{item.label}</td>
                <td className="py-3 text-stone-500">{formatDate(item.date)}</td>
                <td className="py-3 text-right font-black text-emerald-700">
                  {item.followerTarget}
                  <span className="ml-1 text-xs font-medium text-stone-400">人</span>
                </td>
                <td className="py-3 text-right text-stone-500">+{item.followerIncrease}</td>
                <td className="py-3 text-right text-stone-500">{item.articleGoal}本</td>
                <td className="py-3 text-right text-stone-500">{item.shortPostGoal}件</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Home() {
  const [values, setValues] = useState<FormValues>(sampleValues);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setValues({ ...sampleValues, ...JSON.parse(stored) });
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    }
  }, [loaded, values]);

  const metrics = useMemo(() => {
    const accountAgeDays = diffDays(values.accountStartDate, values.currentDate);
    const remainingDays = diffDays(values.currentDate, values.targetDate);
    const followerGap = values.targetFollowers - values.currentFollowers;
    const errors: string[] = [];

    if (accountAgeDays < 0) {
      errors.push("noteを始めた日は、現在の日付以前に設定してください。");
    }
    if (remainingDays <= 0) {
      errors.push("目標の日付は、現在の日付より後に設定してください。");
    }
    if (followerGap <= 0) {
      errors.push("目標フォロワー数は、現在のフォロワー数より大きく設定してください。");
    }

    const isValid = errors.length === 0;
    const requiredFollowersPerDay = isValid ? followerGap / remainingDays : 0;

    return {
      accountAgeDays,
      remainingDays,
      followerGap,
      requiredFollowersPerDay,
      requiredFollowersPerWeek: requiredFollowersPerDay * 7,
      requiredFollowersPerMonth: requiredFollowersPerDay * 30,
      errors,
      isValid,
    };
  }, [values]);

  const weeklyRoadmap = useMemo(
    () =>
      metrics.isValid
        ? buildRoadmap(values, metrics.remainingDays, metrics.followerGap, 7)
        : [],
    [metrics, values],
  );
  const monthlyRoadmap = useMemo(
    () =>
      metrics.isValid
        ? buildRoadmap(values, metrics.remainingDays, metrics.followerGap, 30)
        : [],
    [metrics, values],
  );

  function updateDate(key: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateNumber(key: NumberKey, value: string) {
    setValues((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  }

  const tasks = [
    { icon: "01", title: "他の人の記事を読む", detail: `${values.readsPerDay}記事を読んで視点を広げる` },
    { icon: "02", title: "コメントする", detail: `${values.commentsPerDay}件、具体的な感想を届ける` },
    { icon: "03", title: "つぶやきを投稿する", detail: `週${values.shortPostsPerWeek}件のペースを意識する` },
    { icon: "04", title: "記事テーマを考える", detail: `週${values.articlesPerWeek}本の記事につながる種を1つメモ` },
  ];

  return (
    <main className="min-h-screen">
      <header className="border-b border-emerald-900/10 bg-emerald-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-xs font-bold tracking-[0.2em] text-emerald-200">NOTE GROWTH PLANNER</p>
          <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                フォロワー目標達成ダッシュボード
              </h1>
              <p className="mt-2 text-sm text-emerald-100">
                今日の積み重ねを、目標までの具体的なロードマップに。
              </p>
            </div>
            <span className="w-fit rounded-full bg-emerald-800 px-3 py-1 text-xs font-bold text-emerald-100">
              入力内容は自動保存されます
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr] lg:py-8">
        <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-stone-800">プランを入力</h2>
            <button
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
              onClick={() => setValues(sampleValues)}
              type="button"
            >
              サンプルに戻す
            </button>
          </div>
          <div className="mt-5 space-y-6">
            {inputSections.map((section) => (
              <section key={section.title}>
                <h3 className="border-b border-stone-100 pb-2 text-xs font-bold tracking-wider text-stone-400">
                  {section.title}
                </h3>
                <div className="mt-3 space-y-3">
                  {section.fields.map(([key, label, type]) => (
                    <label className="block" key={key}>
                      <span className="text-xs font-bold text-stone-600">{label}</span>
                      <input
                        className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-bold text-stone-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                        min={type === "number" ? 0 : undefined}
                        onChange={(event) =>
                          type === "date"
                            ? updateDate(key, event.target.value)
                            : updateNumber(key, event.target.value)
                        }
                        type={type}
                        value={values[key]}
                      />
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {metrics.errors.length > 0 && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p className="font-black">入力内容を確認してください</p>
              {metrics.errors.map((error) => (
                <p className="mt-1" key={error}>・{error}</p>
              ))}
            </section>
          )}

          <section>
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-700">OVERVIEW</p>
            <h2 className="mt-1 text-2xl font-black text-stone-800">目標までの現在地</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              <MetricCard label="アカウント開始から" value={Math.max(metrics.accountAgeDays, 0)} unit="日" />
              <MetricCard label="目標日まで残り" value={Math.max(metrics.remainingDays, 0)} unit="日" />
              <MetricCard label="目標までの差" value={Math.max(metrics.followerGap, 0)} unit="人" />
              <MetricCard label="1日に必要な増加" value={decimal(metrics.requiredFollowersPerDay)} unit="人 / 日" accent />
              <MetricCard label="今週の増加目標" value={decimal(metrics.requiredFollowersPerWeek)} unit="人 / 週" />
              <MetricCard label="今月の増加目標" value={decimal(metrics.requiredFollowersPerMonth)} unit="人 / 月" />
            </div>
          </section>

          <section className="rounded-3xl bg-stone-900 p-5 text-white shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-emerald-400">TODAY&apos;S ACTION</p>
                <h2 className="mt-1 text-2xl font-black">今日やること</h2>
              </div>
              <p className="text-xs font-bold text-stone-400">
                小さな交流を、毎日の習慣に
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {tasks.map((task) => (
                <article className="rounded-2xl bg-white/10 p-4" key={task.icon}>
                  <div className="flex gap-3">
                    <span className="text-xs font-black text-emerald-400">{task.icon}</span>
                    <div>
                      <h3 className="font-black">{task.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-stone-300">{task.detail}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {metrics.isValid && (
            <>
              <Roadmap
                description={`毎週の記事目標 ${values.articlesPerWeek}本 ・ つぶやき目標 ${values.shortPostsPerWeek}件`}
                items={weeklyRoadmap}
                title="週次ロードマップ"
              />
              <Roadmap
                description={`毎月の記事目標 ${values.articlesPerWeek * 4}本 ・ つぶやき目標 ${values.shortPostsPerWeek * 4}件`}
                items={monthlyRoadmap}
                title="月次ロードマップ"
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
