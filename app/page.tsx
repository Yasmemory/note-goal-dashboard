"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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

type DailyLog = {
  id: string;
  date: string;
  followers: number;
  articles: number;
  shortPosts: number;
  reads: number;
  comments: number;
  memo: string;
};

type RoadmapItem = {
  label: string;
  date: string;
  followerTarget: number;
  followerIncrease: number;
  articleGoal: number;
  shortPostGoal: number;
};

const INPUT_STORAGE_KEY = "note-follower-roadmap-inputs";
const LOG_STORAGE_KEY = "note-follower-daily-logs";
const DAY_MS = 24 * 60 * 60 * 1000;

function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const sampleValues: FormValues = {
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

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function diffDays(from: string, to: string) {
  return Math.floor((parseDate(to).getTime() - parseDate(from).getTime()) / DAY_MS);
}

function addDays(date: string, days: number) {
  return new Date(parseDate(date).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(
    parseDate(date),
  );
}

function decimal(value: number) {
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(value);
}

function buildRoadmap(
  values: FormValues,
  remainingDays: number,
  followerGap: number,
  intervalDays: number,
): RoadmapItem[] {
  return Array.from({ length: Math.ceil(remainingDays / intervalDays) }, (_, index) => {
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
        accent ? "border-emerald-400 bg-emerald-600 text-white" : "border-stone-200 bg-white"
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

function Roadmap({ title, description, items }: { title: string; description: string; items: RoadmapItem[] }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold tracking-[0.18em] text-emerald-600">ROADMAP</p>
      <h2 className="mt-1 text-xl font-black text-stone-800">{title}</h2>
      <p className="mt-1 text-sm text-stone-500">{description}</p>
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
    </section>
  );
}

export default function Home() {
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
    if (followerGap <= 0) errors.push("目標フォロワー数は、現在のフォロワー数より大きく設定してください。");
    const isValid = errors.length === 0;
    const requiredFollowersPerDay = isValid ? followerGap / remainingDays : 0;
    const planRatio = totalPlanDays > 0 ? Math.min(Math.max(accountAgeDays / totalPlanDays, 0), 1) : 0;
    const plannedFollowers = Math.round(values.targetFollowers * planRatio);
    const progressDelta = values.currentFollowers - plannedFollowers;
    return {
      accountAgeDays,
      remainingDays,
      followerGap,
      requiredFollowersPerDay,
      requiredFollowersPerWeek: requiredFollowersPerDay * 7,
      requiredFollowersPerMonth: requiredFollowersPerDay * 30,
      achievementRate: values.targetFollowers > 0 ? (values.currentFollowers / values.targetFollowers) * 100 : 0,
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

  const weeklyRoadmap = useMemo(
    () => (metrics.isValid ? buildRoadmap(values, metrics.remainingDays, metrics.followerGap, 7) : []),
    [metrics, values],
  );
  const monthlyRoadmap = useMemo(
    () => (metrics.isValid ? buildRoadmap(values, metrics.remainingDays, metrics.followerGap, 30) : []),
    [metrics, values],
  );

  const isBehind = metrics.progressDelta < 0;
  const adjustedReads = values.readsPerDay + (isBehind ? Math.max(2, Math.ceil(Math.abs(metrics.progressDelta) / 10)) : 0);
  const adjustedComments = values.commentsPerDay + (isBehind ? Math.max(1, Math.ceil(Math.abs(metrics.progressDelta) / 20)) : 0);
  const tasks = isBehind
    ? [
        ["01", "他の人の記事を読む", `${adjustedReads}記事を読み、交流の入口を増やす`],
        ["02", "コメントする", `${adjustedComments}件、具体的な感想を届ける`],
        ["03", "つぶやきを投稿する", `週${values.shortPostsPerWeek}件より1件多めを意識する`],
        ["04", "記事テーマを考える", "反応が良かったテーマを1つ深掘りする"],
      ]
    : [
        ["01", "他の人の記事を読む", `${values.readsPerDay}記事を読んで視点を広げる`],
        ["02", "コメントする", `${values.commentsPerDay}件、丁寧な交流を続ける`],
        ["03", "記事を育てる", `週${values.articlesPerWeek}本の投稿ペースを守る`],
        ["04", "継続を記録する", "今日できたことを実績ログに残す"],
      ];

  function updateNumber(key: NumberKey, value: string) {
    setValues((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  }

  function updateDailyNumber(key: keyof Omit<DailyLog, "id" | "date" | "memo">, value: string) {
    setDailyLog((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  }

  function saveDailyLog() {
    const nextLog = { ...dailyLog, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    setLogs((current) => {
      const nextLogs = [...current.filter((log) => log.date !== nextLog.date), nextLog];
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(nextLogs));
      return nextLogs;
    });
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
    setLogs((current) => {
      const nextLogs = current.filter((log) => log.id !== id);
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(nextLogs));
      return nextLogs;
    });
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-emerald-900/10 bg-emerald-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-xs font-bold tracking-[0.2em] text-emerald-200">NOTE GROWTH PLANNER</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">フォロワー目標達成ダッシュボード</h1>
          <p className="mt-2 text-sm text-emerald-100">毎日の実績を残して、次にやることを具体的に。</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr] lg:py-8">
        <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-stone-800">プラン設定</h2>
            <button className="text-xs font-bold text-emerald-700" onClick={() => setValues(sampleValues)} type="button">
              サンプルに戻す
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {([
              ["accountStartDate", "noteを始めた日", "date"],
              ["currentDate", "現在の日付", "date"],
              ["currentFollowers", "現在のフォロワー", "number"],
              ["targetDate", "目標の日付", "date"],
              ["targetFollowers", "目標フォロワー", "number"],
              ["articlesPerWeek", "記事投稿 / 週", "number"],
              ["shortPostsPerWeek", "つぶやき投稿 / 週", "number"],
              ["readsPerDay", "読む記事 / 日", "number"],
              ["commentsPerDay", "コメント / 日", "number"],
            ] as const).map(([key, label, type]) => (
              <label className="block" key={key}>
                <span className="text-xs font-bold text-stone-600">{label}</span>
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
        </aside>

        <div className="min-w-0 space-y-6">
          {metrics.errors.length > 0 && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p className="font-black">入力内容を確認してください</p>
              {metrics.errors.map((error) => <p className="mt-1" key={error}>・{error}</p>)}
            </section>
          )}

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-600">PROGRESS</p>
            <div className="mt-1 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-black text-stone-800">目標への進捗</h2>
                <p className={`mt-2 text-sm font-bold ${isBehind ? "text-rose-600" : "text-emerald-700"}`}>
                  予定より{Math.abs(metrics.progressDelta)}人{isBehind ? "遅れています" : "進んでいます"}
                </p>
                <p className="mt-1 text-xs text-stone-500">今日の予定 {metrics.plannedFollowers}人 ・ 現在 {values.currentFollowers}人</p>
              </div>
              <p className="text-4xl font-black text-emerald-700">{decimal(Math.min(metrics.achievementRate, 100))}<span className="text-lg">%</span></p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(metrics.achievementRate, 100)}%` }} />
            </div>
          </section>

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

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-600">LAST 7 DAYS</p>
            <h2 className="mt-1 text-xl font-black text-stone-800">直近7日の分析</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricCard label="フォロワー増加" value={analysis.followerIncrease} unit="人" />
              <MetricCard label="1日平均増加" value={decimal(analysis.averagePerDay)} unit="人 / 日" />
              <MetricCard label="必要ペースとの差" value={`${analysis.paceDelta >= 0 ? "+" : ""}${decimal(analysis.paceDelta)}`} unit="人 / 日" />
              <MetricCard label="達成予測日" value={analysis.predictionDate ? formatDate(analysis.predictionDate) : "未算出"} unit="" />
            </div>
          </section>

          <section className="rounded-3xl bg-stone-900 p-5 text-white shadow-sm sm:p-6">
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-400">TODAY&apos;S ACTION</p>
            <h2 className="mt-1 text-2xl font-black">今日やること</h2>
            <p className="mt-1 text-xs text-stone-400">{isBehind ? "少し行動量を増やして、交流のきっかけを作りましょう。" : "順調です。記事の質と継続を大切にしましょう。"}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {tasks.map(([icon, title, detail]) => (
                <article className="rounded-2xl bg-white/10 p-4" key={icon}>
                  <div className="flex gap-3">
                    <span className="text-xs font-black text-emerald-400">{icon}</span>
                    <div><h3 className="font-black">{title}</h3><p className="mt-1 text-xs leading-relaxed text-stone-300">{detail}</p></div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-600">DAILY LOG</p>
            <h2 className="mt-1 text-xl font-black text-stone-800">今日の実績を入力</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submitDailyLog}>
              <label className="text-xs font-bold text-stone-600">日付<input className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" onChange={(e) => setDailyLog({ ...dailyLog, date: e.target.value })} required type="date" value={dailyLog.date} /></label>
              <label className="text-xs font-bold text-stone-600">今日のフォロワー数<input className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" min="0" onChange={(e) => updateDailyNumber("followers", e.target.value)} required type="number" value={dailyLog.followers} /></label>
              {([
                ["articles", "今日の記事投稿数"],
                ["shortPosts", "今日のつぶやき投稿数"],
                ["reads", "今日読んだ記事数"],
                ["comments", "今日コメントした数"],
              ] as const).map(([key, label]) => (
                <label className="text-xs font-bold text-stone-600" key={key}>{label}<input className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" min="0" onChange={(e) => updateDailyNumber(key, e.target.value)} type="number" value={dailyLog[key]} /></label>
              ))}
              <label className="text-xs font-bold text-stone-600 sm:col-span-2">メモ<textarea className="mt-1 min-h-24 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm" onChange={(e) => setDailyLog({ ...dailyLog, memo: e.target.value })} placeholder="今日の気づきや、次に試したいこと" value={dailyLog.memo} /></label>
              <button className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 sm:col-span-2" onClick={saveDailyLog} type="button">実績を保存する</button>
            </form>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-600">HISTORY</p>
            <h2 className="mt-1 text-xl font-black text-stone-800">実績ログ</h2>
            <div className="mt-4 space-y-3">
              {[...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((log) => (
                <article className="rounded-2xl border border-stone-100 bg-stone-50 p-4" key={log.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-black text-stone-800">{formatDate(log.date)}</p><p className="mt-1 text-xs text-stone-500">フォロワー {log.followers}人 ・ 記事 {log.articles}本 ・ つぶやき {log.shortPosts}件</p><p className="mt-1 text-xs text-stone-500">読んだ記事 {log.reads}本 ・ コメント {log.comments}件</p>{log.memo && <p className="mt-2 text-sm text-stone-600">{log.memo}</p>}</div>
                    <button className="shrink-0 text-xs font-bold text-rose-500" onClick={() => deleteDailyLog(log.id)} type="button">削除</button>
                  </div>
                </article>
              ))}
              {logs.length === 0 && <p className="rounded-2xl bg-stone-50 px-4 py-5 text-center text-sm text-stone-400">まだ実績ログはありません。</p>}
            </div>
          </section>

          {metrics.isValid && <>
            <Roadmap description={`毎週の記事目標 ${values.articlesPerWeek}本 ・ つぶやき目標 ${values.shortPostsPerWeek}件`} items={weeklyRoadmap} title="週次ロードマップ" />
            <Roadmap description={`毎月の記事目標 ${values.articlesPerWeek * 4}本 ・ つぶやき目標 ${values.shortPostsPerWeek * 4}件`} items={monthlyRoadmap} title="月次ロードマップ" />
          </>}
        </div>
      </div>
    </main>
  );
}
