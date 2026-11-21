"use client";

import { useEffect, useState } from "react";
import { Activity, Crown, Medal, Radio, Trophy } from "lucide-react";

export interface LeaderboardScore {
  id: string;
  player_name: string;
  score: number;
  accuracy_pct: number;
  ghosts_spotted: number;
  created_at?: string;
}

const STORAGE_KEY = "phantom-tide.challenge.leaderboard.v1";
const UPDATE_EVENT = "phantom-tide:leaderboard-updated";

const DEMO_SCORES: LeaderboardScore[] = [
  { id: "demo-1", player_name: "Aarav K.", score: 1840, accuracy_pct: 100, ghosts_spotted: 5 },
  { id: "demo-2", player_name: "Mira S.", score: 1515, accuracy_pct: 80, ghosts_spotted: 4 },
  { id: "demo-3", player_name: "Dev P.", score: 1260, accuracy_pct: 80, ghosts_spotted: 4 },
  { id: "demo-4", player_name: "Isha R.", score: 970, accuracy_pct: 60, ghosts_spotted: 3 },
];

function sortScores(scores: LeaderboardScore[]) {
  return [...scores].sort(
    (left, right) =>
      right.score - left.score ||
      right.accuracy_pct - left.accuracy_pct ||
      right.ghosts_spotted - left.ghosts_spotted,
  );
}

function readLocalScores(): LeaderboardScore[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const value: unknown = JSON.parse(saved);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (entry): entry is LeaderboardScore =>
        typeof entry?.id === "string" &&
        typeof entry?.player_name === "string" &&
        typeof entry?.score === "number" &&
        typeof entry?.accuracy_pct === "number" &&
        typeof entry?.ghosts_spotted === "number",
    );
  } catch {
    return [];
  }
}

export function saveLocalLeaderboardScore(
  score: Omit<LeaderboardScore, "id" | "created_at">,
) {
  const entry: LeaderboardScore = {
    ...score,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
  };

  try {
    const updated = sortScores([...readLocalScores(), entry]).slice(0, 10);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(UPDATE_EVENT));
  } catch {
    // The current session still reports the saved score when storage is unavailable.
  }
  return entry;
}

function mergeAndSort(primary: LeaderboardScore[], local: LeaderboardScore[]) {
  const unique = new Map<string, LeaderboardScore>();
  for (const score of [...primary, ...local]) unique.set(score.id, score);
  return sortScores([...unique.values()]).slice(0, 8);
}

function normalizeApiScores(value: unknown): LeaderboardScore[] | null {
  if (!value || typeof value !== "object" || !Array.isArray((value as { scores?: unknown }).scores)) {
    return null;
  }
  return ((value as { scores: unknown[] }).scores).flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const score = Number(row.score);
    const accuracy = Number(row.accuracy_pct);
    const ghosts = Number(row.ghosts_spotted);
    if (
      typeof row.player_name !== "string" ||
      !Number.isFinite(score) ||
      !Number.isFinite(accuracy) ||
      !Number.isFinite(ghosts)
    ) {
      return [];
    }
    return [
      {
        id: typeof row.id === "string" ? row.id : `server-${index}-${score}`,
        player_name: row.player_name,
        score,
        accuracy_pct: accuracy,
        ghosts_spotted: ghosts,
        created_at: typeof row.created_at === "string" ? row.created_at : undefined,
      },
    ];
  });
}

export default function Leaderboard() {
  const [scores, setScores] = useState<LeaderboardScore[]>(DEMO_SCORES);
  const [source, setSource] = useState<"demo" | "live">("demo");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const showFallback = () => {
      if (!active) return;
      setScores(mergeAndSort(DEMO_SCORES, readLocalScores()));
      setSource("demo");
    };

    const refresh = async () => {
      showFallback();
      try {
        const response = await fetch("/api/leaderboard", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          showFallback();
          return;
        }
        const apiScores = normalizeApiScores(await response.json());
        if (!active || !apiScores) return;
        setScores(mergeAndSort(apiScores.length > 0 ? apiScores : DEMO_SCORES, readLocalScores()));
        setSource(apiScores.length > 0 ? "live" : "demo");
      } catch {
        showFallback();
      }
    };

    const handleUpdate = () => void refresh();
    window.addEventListener(UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    void refresh();

    return () => {
      active = false;
      controller.abort();
      window.removeEventListener(UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return (
    <section className="leaderboard-panel" aria-labelledby="leaderboard-title">
      <div className="leaderboard-heading">
        <div className="leaderboard-icon"><Trophy size={17} /></div>
        <div>
          <div className="leaderboard-kicker"><Activity size={11} /> ANALYST NETWORK</div>
          <h2 id="leaderboard-title">Leaderboard</h2>
        </div>
        <span className={`leaderboard-source ${source}`}>
          <span /> {source === "live" ? "LIVE" : "LOCAL DEMO"}
        </span>
      </div>

      <div className="leaderboard-labels" aria-hidden="true">
        <span>RANK / ANALYST</span><span>PTS</span>
      </div>
      <ol className="leaderboard-list">
        {scores.slice(0, 5).map((entry, index) => (
          <li className={`leaderboard-row ${index === 0 ? "top" : ""}`} key={entry.id}>
            <span className={`leaderboard-rank rank-${index + 1}`}>
              {index === 0 ? <Crown size={14} /> : index < 3 ? <Medal size={14} /> : String(index + 1).padStart(2, "0")}
            </span>
            <span className="leaderboard-person">
              <strong>{entry.player_name}</strong>
              <small>{entry.accuracy_pct}% accuracy <span>·</span> {entry.ghosts_spotted} targets</small>
            </span>
            <strong className="leaderboard-score">{entry.score.toLocaleString("en-IN")}</strong>
          </li>
        ))}
      </ol>

      <div className="leaderboard-footer">
        <Radio size={13} />
        <span>{source === "live" ? "Scores synced with the EEZ network" : "Scores saved locally if the network is offline"}</span>
      </div>

      <style>{`
        .leaderboard-panel { min-width: 0; padding: 21px 22px 16px; border: 1px solid rgba(123, 151, 184, .15); border-radius: 18px; background: linear-gradient(150deg, rgba(16, 26, 44, .94), rgba(8, 14, 28, .96)); box-shadow: 0 18px 55px rgba(0,0,0,.22); }
        .leaderboard-heading { display: flex; align-items: center; gap: 12px; padding-bottom: 20px; }
        .leaderboard-icon { width: 37px; height: 37px; display: grid; place-items: center; color: #9ae8d3; border: 1px solid rgba(104, 222, 197, .24); border-radius: 12px; background: rgba(46, 185, 153, .09); }
        .leaderboard-kicker { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; color: #79a89f; font: 700 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; }
        .leaderboard-heading h2 { margin: 0; color: #ecf4ff; font-size: 19px; letter-spacing: -.035em; }
        .leaderboard-source { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; color: #8898ad; font: 700 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .07em; white-space: nowrap; }
        .leaderboard-source span { width: 6px; height: 6px; border-radius: 50%; background: #91a0b3; }
        .leaderboard-source.live { color: #7fe7c5; }
        .leaderboard-source.live span { background: #53e0ae; box-shadow: 0 0 9px #53e0ae; }
        .leaderboard-labels { display: flex; justify-content: space-between; padding: 0 3px 9px; color: #63718a; font: 700 8px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .11em; }
        .leaderboard-list { display: grid; gap: 5px; padding: 0; margin: 0; list-style: none; }
        .leaderboard-row { min-width: 0; display: flex; align-items: center; gap: 10px; padding: 11px 9px; border: 1px solid transparent; border-radius: 11px; background: rgba(255,255,255,.022); }
        .leaderboard-row.top { border-color: rgba(243, 195, 108, .16); background: linear-gradient(90deg, rgba(241, 183, 83, .08), rgba(255,255,255,.018)); }
        .leaderboard-rank { flex: 0 0 22px; width: 22px; display: grid; place-items: center; color: #77869c; font: 700 10px ui-monospace, SFMono-Regular, Menlo, monospace; }
        .leaderboard-rank.rank-1 { color: #f5c56c; }
        .leaderboard-rank.rank-2 { color: #b8d3e4; }
        .leaderboard-rank.rank-3 { color: #cd9a76; }
        .leaderboard-person { display: grid; gap: 4px; min-width: 0; }
        .leaderboard-person strong { overflow: hidden; color: #dbe7f4; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
        .leaderboard-person small { color: #738198; font-size: 9px; white-space: nowrap; }
        .leaderboard-person small span { color: #435169; padding: 0 3px; }
        .leaderboard-score { margin-left: auto; color: #a9f3db; font: 700 12px ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap; }
        .leaderboard-footer { display: flex; align-items: center; gap: 7px; padding: 15px 2px 0; color: #68788f; font-size: 10px; }
        .leaderboard-footer svg { color: #6caea5; }
        @media (max-width: 420px) { .leaderboard-panel { padding: 18px 14px 14px; } .leaderboard-source { font-size: 8px; } }
      `}</style>
    </section>
  );
}
