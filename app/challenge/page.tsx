"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Activity,
  Check,
  CheckCircle2,
  Clock3,
  Crosshair,
  Download,
  Flame,
  MapPin,
  Radio,
  RotateCcw,
  Satellite,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Waves,
  X,
} from "lucide-react";
import { CHALLENGE_ROUNDS } from "../../lib/challenge/rounds";
import SarCanvas from "../../components/challenge/SarCanvas";
import Leaderboard, { saveLocalLeaderboardScore } from "../../components/challenge/Leaderboard";

type RoundResult = "IDLE" | "HIT" | "MISS" | "TIMEOUT";
type SaveState = "idle" | "saving" | "saved" | "local";

const ROUND_SECONDS = 20;

function getRank(accuracy: number) {
  if (accuracy >= 80) return "EEZ Commander";
  if (accuracy >= 60) return "SAR Specialist";
  return "Radar Cadet";
}

function downloadGuardianCard(name: string, rank: string, score: number, accuracy: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  if (!context) return;

  const backdrop = context.createLinearGradient(0, 0, 1200, 720);
  backdrop.addColorStop(0, "#071a27");
  backdrop.addColorStop(0.55, "#0d2033");
  backdrop.addColorStop(1, "#10162b");
  context.fillStyle = backdrop;
  context.fillRect(0, 0, 1200, 720);

  context.save();
  context.strokeStyle = "rgba(112, 221, 224, .09)";
  context.lineWidth = 1;
  for (let x = 48; x < 1200; x += 48) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 720); context.stroke();
  }
  for (let y = 48; y < 720; y += 48) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(1200, y); context.stroke();
  }
  context.restore();

  context.strokeStyle = "rgba(112, 229, 220, .65)";
  context.lineWidth = 2;
  context.strokeRect(28, 28, 1144, 664);
  context.fillStyle = "#70e4d5";
  context.font = "700 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText("PHANTOM TIDE  /  OCEAN GUARDIAN", 78, 96);

  context.strokeStyle = "rgba(93, 227, 219, .5)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(600, 270, 112, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = "rgba(93, 227, 219, .2)";
  context.beginPath();
  context.arc(600, 270, 136, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#8ffff0";
  context.shadowColor = "#5ee8d5";
  context.shadowBlur = 26;
  context.beginPath();
  context.arc(600, 270, 7, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  context.textAlign = "center";
  context.fillStyle = "#f3f8ff";
  context.font = "600 58px system-ui, sans-serif";
  context.fillText(name || "Ocean Guardian", 600, 465, 980);
  context.fillStyle = "#8ce8d1";
  context.font = "700 24px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText(rank.toUpperCase(), 600, 515);

  context.fillStyle = "#d9e6f1";
  context.font = "700 26px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText(`${score.toLocaleString("en-IN")} POINTS   ·   ${accuracy}% ACCURACY`, 600, 600);
  context.fillStyle = "rgba(199, 218, 231, .52)";
  context.font = "15px system-ui, sans-serif";
  context.fillText("INDIAN EXCLUSIVE ECONOMIC ZONE  /  SAR ANALYST SERIES", 600, 650);
  context.textAlign = "start";

  const anchor = document.createElement("a");
  const safeName = (name || "ocean-guardian").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  anchor.download = `${safeName || "ocean-guardian"}-card.png`;
  anchor.href = canvas.toDataURL("image/png");
  anchor.click();
}

function ChallengeStyles() {
  return (
    <style>{`
      .challenge-page { --ink:#edf4ff; --muted:#91a0b8; --faint:#65728a; --line:rgba(142,161,195,.15); --mint:#77e6c5; --cyan:#72dbea; min-height:100vh; position:relative; overflow:hidden; color:var(--ink); background:#050816; font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .challenge-page * { box-sizing:border-box; }
      .challenge-page button,.challenge-page input { font:inherit; }
      .challenge-page a { color:inherit; text-decoration:none; }
      .challenge-page .ambient { position:absolute; inset:0 0 auto; height:560px; pointer-events:none; background:radial-gradient(ellipse at 52% -10%,rgba(28,110,139,.24),transparent 55%),radial-gradient(ellipse at 88% 28%,rgba(31,83,139,.13),transparent 32%); }
      .challenge-page .topbar { position:relative; z-index:2; height:72px; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; padding:0 clamp(20px,5vw,76px); border-bottom:1px solid rgba(148,168,204,.1); background:rgba(5,8,22,.72); backdrop-filter:blur(16px); }
      .challenge-page .back-link { width:max-content; display:flex; align-items:center; gap:9px; color:#b5c1d3; font-size:12px; font-weight:600; transition:color .2s ease; }
      .challenge-page .back-link:hover { color:#fff; }
      .challenge-page .brand { display:flex; align-items:center; gap:9px; color:#e6f1ff; font-size:12px; font-weight:800; letter-spacing:.18em; white-space:nowrap; }
      .challenge-page .brand svg { color:#73e4d2; }
      .challenge-page .brand small { margin-left:3px; color:#73849c; font:700 8px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.12em; }
      .challenge-page .network-status { justify-self:end; display:flex; align-items:center; gap:8px; color:#87a09f; font:700 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.1em; }
      .challenge-page .network-status span { width:6px; height:6px; border-radius:50%; background:#52dfb4; box-shadow:0 0 10px rgba(82,223,180,.8); }
      .challenge-page .content { position:relative; z-index:1; width:min(1250px,calc(100% - 48px)); margin:0 auto; padding:44px 0 80px; }
      .challenge-page .intro { display:flex; justify-content:space-between; align-items:flex-end; gap:28px; margin-bottom:29px; }
      .challenge-page .eyebrow { display:flex; align-items:center; gap:10px; margin-bottom:13px; color:#82b8b5; font:700 10px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.16em; text-transform:uppercase; }
      .challenge-page .eyebrow .dot { width:4px; height:4px; border-radius:50%; background:#57e5ca; }
      .challenge-page h1 { margin:0; color:#f2f6ff; font-size:clamp(32px,4vw,48px); line-height:1.02; font-weight:650; letter-spacing:-.055em; }
      .challenge-page .intro-copy { max-width:570px; margin:12px 0 0; color:#8795ab; font-size:13px; line-height:1.65; }
      .challenge-page .stat-cluster { display:flex; gap:9px; padding-bottom:3px; }
      .challenge-page .stat-card { min-width:100px; display:grid; gap:5px; padding:12px 15px; border:1px solid var(--line); border-radius:12px; background:rgba(14,20,39,.75); }
      .challenge-page .stat-label { display:flex; align-items:center; gap:6px; color:#77869e; font:700 8px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.1em; text-transform:uppercase; }
      .challenge-page .stat-value { display:flex; align-items:baseline; gap:4px; color:#eaf3ff; font:700 18px ui-monospace, SFMono-Regular, Menlo, monospace; }
      .challenge-page .stat-value small { color:#8392a8; font-size:10px; font-weight:500; }
      .challenge-page .stat-card.timer .stat-value { color:#94f1d1; }
      .challenge-page .stat-card.timer.urgent .stat-value { color:#ff9a8e; }
      .challenge-page .stat-card.streak .stat-value { color:#f5c775; }
      .challenge-page .progress-row { display:flex; gap:7px; margin-bottom:14px; }
      .challenge-page .progress-segment { height:3px; flex:1; overflow:hidden; border-radius:8px; background:rgba(132,150,180,.16); }
      .challenge-page .progress-segment.done { background:linear-gradient(90deg,#40cfc0,#83e8c5); box-shadow:0 0 12px rgba(69,223,191,.22); }
      .challenge-page .progress-segment.current { background:linear-gradient(90deg,rgba(64,207,192,.36),rgba(131,232,197,.55)); }
      .challenge-page .mission-bar { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-bottom:16px; padding:15px 18px; border:1px solid rgba(113,157,184,.17); border-radius:14px; background:linear-gradient(100deg,rgba(16,28,48,.84),rgba(10,17,33,.8)); }
      .challenge-page .mission-ident { display:flex; align-items:center; gap:13px; min-width:0; }
      .challenge-page .mission-number { width:38px; height:38px; flex:0 0 38px; display:grid; place-items:center; color:#7be5ce; border:1px solid rgba(102,226,206,.24); border-radius:11px; background:rgba(57,191,171,.08); font:700 12px ui-monospace, SFMono-Regular, Menlo, monospace; }
      .challenge-page .mission-title-block { min-width:0; }
      .challenge-page .mission-title-block h2 { overflow:hidden; margin:0 0 5px; color:#ecf3fd; font-size:14px; font-weight:650; text-overflow:ellipsis; white-space:nowrap; }
      .challenge-page .location { display:flex; align-items:center; gap:5px; color:#7f8fa7; font-size:10px; }
      .challenge-page .mission-type { display:flex; align-items:center; gap:7px; padding:8px 11px; border:1px solid rgba(151,164,185,.14); border-radius:8px; color:#aebdd0; background:rgba(6,12,25,.45); font:700 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.05em; white-space:nowrap; }
      .challenge-page .mission-type.ghost svg { color:#79e6d8; }
      .challenge-page .mission-type.oil svg { color:#f3c273; }
      .challenge-page .game-grid { display:grid; grid-template-columns:minmax(0,1fr) 270px; gap:16px; align-items:start; }
      .challenge-page .radar-panel { min-width:0; padding:14px; border:1px solid rgba(130,155,192,.14); border-radius:19px; background:linear-gradient(145deg,rgba(12,18,35,.95),rgba(8,13,27,.95)); box-shadow:0 24px 80px rgba(0,0,0,.19); }
      .challenge-page .radar-panel-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:2px 3px 13px; }
      .challenge-page .sensor-name { display:flex; align-items:center; gap:8px; color:#c1cfdf; font:700 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.08em; }
      .challenge-page .sensor-name svg { color:#6dd8d0; }
      .challenge-page .scan-status { display:flex; align-items:center; gap:6px; color:#678c91; font:700 8px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.1em; }
      .challenge-page .scan-status svg { color:#65c7c1; }
      .challenge-page .canvas-instruction { display:flex; justify-content:center; align-items:center; gap:7px; padding:11px 4px 2px; color:#78879d; font-size:10px; }
      .challenge-page .canvas-instruction svg { color:#68d5cd; }
      .challenge-page .side-rail { display:grid; gap:12px; }
      .challenge-page .intel-card { padding:17px; border:1px solid rgba(129,153,190,.14); border-radius:15px; background:linear-gradient(145deg,rgba(17,25,46,.87),rgba(9,15,31,.93)); }
      .challenge-page .intel-label { display:flex; align-items:center; gap:7px; margin-bottom:12px; color:#7e91aa; font:700 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.12em; text-transform:uppercase; }
      .challenge-page .intel-label svg { color:#77dbce; }
      .challenge-page .intel-card p { margin:0; color:#c4d0df; font-size:12px; line-height:1.7; }
      .challenge-page .signature-chip { display:inline-flex; align-items:center; gap:6px; margin-top:13px; padding:7px 9px; border:1px solid rgba(123,203,198,.17); border-radius:8px; color:#9cd8d0; background:rgba(56,154,148,.08); font:700 8px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.05em; }
      .challenge-page .sensor-row { display:flex; align-items:flex-start; gap:11px; }
      .challenge-page .sensor-icon { width:31px; height:31px; flex:0 0 31px; display:grid; place-items:center; color:#8adcd8; border-radius:9px; background:rgba(69,194,183,.1); }
      .challenge-page .sensor-row strong { display:block; margin:2px 0 5px; color:#dce7f3; font-size:11px; font-weight:650; }
      .challenge-page .sensor-row span { display:block; color:#8292a9; font-size:10px; line-height:1.45; }
      .challenge-page .science-card { border-color:rgba(101,199,187,.16); background:linear-gradient(145deg,rgba(12,35,42,.55),rgba(9,16,31,.88)); }
      .challenge-page .legend { display:grid; gap:9px; }
      .challenge-page .legend-item { display:flex; align-items:center; gap:8px; color:#9caabc; font-size:10px; }
      .challenge-page .legend-dot { width:7px; height:7px; border-radius:50%; }
      .challenge-page .legend-dot.vessel { background:#efffff; box-shadow:0 0 9px #a1fbff; }
      .challenge-page .legend-dot.slick { background:#293b50; border:1px solid #5d758a; }
      .challenge-page .legend-dot.weather { background:#909dab; opacity:.55; }
      .challenge-page .feedback { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:14px; margin-top:12px; padding:13px 14px; border:1px solid rgba(119,231,196,.19); border-radius:13px; background:linear-gradient(95deg,rgba(38,120,100,.14),rgba(19,35,45,.63)); animation:feedback-in .25s ease-out; }
      .challenge-page .feedback.miss,.challenge-page .feedback.timeout { border-color:rgba(241,187,105,.2); background:linear-gradient(95deg,rgba(128,91,40,.14),rgba(24,31,44,.68)); }
      @keyframes feedback-in { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
      .challenge-page .result-badge { display:flex; align-items:center; gap:6px; padding:7px 9px; border:1px solid rgba(105,230,184,.25); border-radius:8px; color:#83f0c5; background:rgba(51,185,135,.1); font:800 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.08em; }
      .challenge-page .feedback.miss .result-badge,.challenge-page .feedback.timeout .result-badge { color:#f0c27a; border-color:rgba(241,187,105,.25); background:rgba(171,125,55,.09); }
      .challenge-page .feedback-note { color:#aab8ca; font-size:10px; line-height:1.5; }
      .challenge-page .next-button,.challenge-page .primary-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:1px solid rgba(109,229,199,.36); border-radius:9px; color:#07141a; background:linear-gradient(135deg,#77e7c9,#6bd6ce); box-shadow:0 6px 24px rgba(75,213,185,.12); font-size:10px; font-weight:800; cursor:pointer; transition:filter .18s ease,transform .18s ease; white-space:nowrap; }
      .challenge-page .next-button { padding:10px 12px; }
      .challenge-page .primary-button { min-height:42px; padding:0 16px; }
      .challenge-page .next-button:hover,.challenge-page .primary-button:hover { filter:brightness(1.08); transform:translateY(-1px); }
      .challenge-page .next-button:focus-visible,.challenge-page .primary-button:focus-visible,.challenge-page .secondary-button:focus-visible,.challenge-page .back-link:focus-visible { outline:2px solid #9af4df; outline-offset:3px; }
      .challenge-page .bottom-note { display:flex; align-items:center; justify-content:center; gap:8px; margin-top:19px; color:#596981; font-size:9px; }
      .challenge-page .bottom-note svg { color:#6a9f9e; }
      .challenge-page .complete-header { max-width:760px; margin:0 auto 30px; text-align:center; }
      .challenge-page .complete-header .eyebrow { justify-content:center; }
      .challenge-page .complete-header h1 { font-size:clamp(34px,5vw,54px); }
      .challenge-page .complete-header p { max-width:580px; margin:13px auto 0; color:#8f9eb4; font-size:13px; line-height:1.65; }
      .challenge-page .complete-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(320px,.9fr); gap:17px; align-items:start; }
      .challenge-page .debrief-card { overflow:hidden; border:1px solid rgba(129,153,190,.16); border-radius:19px; background:linear-gradient(145deg,rgba(17,27,48,.96),rgba(8,14,28,.98)); box-shadow:0 24px 80px rgba(0,0,0,.2); }
      .challenge-page .debrief-banner { position:relative; padding:24px 25px 20px; border-bottom:1px solid rgba(142,161,195,.12); background:radial-gradient(ellipse at 84% 0%,rgba(50,155,151,.17),transparent 47%); }
      .challenge-page .rank-symbol { width:42px; height:42px; display:grid; place-items:center; margin-bottom:17px; border:1px solid rgba(118,230,197,.23); border-radius:13px; color:#85e8cd; background:rgba(52,177,152,.1); }
      .challenge-page .debrief-banner h2 { margin:0 0 7px; color:#edf5ff; font-size:24px; letter-spacing:-.04em; }
      .challenge-page .debrief-banner p { margin:0; color:#8c9ab0; font-size:11px; line-height:1.55; }
      .challenge-page .result-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:16px 20px; }
      .challenge-page .result-stat { padding:12px 11px; border:1px solid rgba(140,159,191,.12); border-radius:11px; background:rgba(5,10,22,.32); }
      .challenge-page .result-stat span { display:block; margin-bottom:7px; color:#72829a; font:700 8px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.09em; text-transform:uppercase; }
      .challenge-page .result-stat strong { color:#dbe8f7; font:700 17px ui-monospace, SFMono-Regular, Menlo, monospace; }
      .challenge-page .result-stat strong.mint { color:#8be9ce; }
      .challenge-page .save-form { display:grid; gap:10px; padding:0 20px 18px; }
      .challenge-page .save-form label { color:#8493aa; font:700 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.1em; text-transform:uppercase; }
      .challenge-page .save-row { display:flex; gap:8px; }
      .challenge-page .save-row input { min-width:0; flex:1; height:42px; padding:0 12px; border:1px solid rgba(143,166,197,.2); border-radius:9px; outline:none; color:#e4edf8; background:rgba(4,9,20,.55); font-size:12px; }
      .challenge-page .save-row input::placeholder { color:#63718a; }
      .challenge-page .save-row input:focus { border-color:rgba(117,225,200,.56); box-shadow:0 0 0 3px rgba(100,220,192,.08); }
      .challenge-page .save-row button:disabled { cursor:wait; opacity:.72; }
      .challenge-page .save-state { min-height:14px; color:#8294a9; font-size:10px; }
      .challenge-page .save-state.success { color:#7be2bd; }
      .challenge-page .save-state.local { color:#edc47f; }
      .challenge-page .debrief-actions { display:flex; flex-wrap:wrap; gap:8px; padding:0 20px 20px; }
      .challenge-page .secondary-button { min-height:40px; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:0 13px; border:1px solid rgba(145,164,196,.18); border-radius:9px; color:#b8c7d9; background:rgba(255,255,255,.025); font-size:10px; font-weight:700; cursor:pointer; transition:border-color .18s ease,color .18s ease; }
      .challenge-page .secondary-button:hover { border-color:rgba(125,224,207,.35); color:#e8f4ff; }
      .challenge-page .debrief-foot { display:flex; justify-content:center; align-items:center; gap:6px; padding:12px; border-top:1px solid rgba(143,161,194,.1); color:#697a92; font-size:9px; }
      .challenge-page .debrief-foot svg { color:#7bb1ad; }
      @media (max-width: 900px) { .challenge-page .game-grid { grid-template-columns:minmax(0,1fr) 230px; } .challenge-page .stat-card { min-width:82px; padding:11px; } .challenge-page .complete-grid { grid-template-columns:1fr; } }
      @media (max-width: 700px) { .challenge-page .topbar { height:64px; grid-template-columns:1fr auto; padding:0 18px; } .challenge-page .brand { justify-self:end; font-size:10px; } .challenge-page .brand small,.challenge-page .network-status { display:none; } .challenge-page .content { width:min(100% - 28px,580px); padding-top:29px; } .challenge-page .intro { display:block; } .challenge-page .stat-cluster { margin-top:18px; } .challenge-page .stat-card { min-width:0; flex:1; } .challenge-page .game-grid { grid-template-columns:1fr; } .challenge-page .side-rail { grid-template-columns:repeat(2,minmax(0,1fr)); } .challenge-page .side-rail .intel-card:first-child { grid-column:1/-1; } .challenge-page .feedback { grid-template-columns:auto minmax(0,1fr); } .challenge-page .next-button { grid-column:1/-1; justify-self:stretch; } .challenge-page .mission-bar { align-items:flex-start; } }
      @media (max-width: 480px) { .challenge-page .content { width:calc(100% - 22px); padding-top:24px; } .challenge-page .mission-bar { padding:12px; } .challenge-page .mission-type { max-width:116px; align-items:flex-start; white-space:normal; line-height:1.35; } .challenge-page .radar-panel { padding:9px; } .challenge-page .side-rail { grid-template-columns:1fr; } .challenge-page .side-rail .intel-card:first-child { grid-column:auto; } .challenge-page .result-stats { padding:13px; } .challenge-page .result-stat { padding:10px 8px; } .challenge-page .result-stat strong { font-size:14px; } .challenge-page .save-form,.challenge-page .debrief-actions { padding-left:13px; padding-right:13px; } .challenge-page .save-row { flex-direction:column; } .challenge-page .save-row button { width:100%; } }
      @media (prefers-reduced-motion: reduce) { .challenge-page *, .challenge-page *::before, .challenge-page *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; scroll-behavior:auto !important; transition-duration:.01ms !important; } }
    `}</style>
  );
}

export default function ChallengePage() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [roundResult, setRoundResult] = useState<RoundResult>("IDLE");
  const [playerName, setPlayerName] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const complete = roundIndex >= CHALLENGE_ROUNDS.length;
  const round = CHALLENGE_ROUNDS[Math.min(roundIndex, CHALLENGE_ROUNDS.length - 1)];

  useEffect(() => {
    if (complete || roundResult !== "IDLE") return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRoundResult("TIMEOUT");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [complete, roundIndex, roundResult]);

  function handleGuess(hit: boolean) {
    if (roundResult !== "IDLE") return;
    if (hit) {
      setHits((value) => value + 1);
      setScore((value) => value + 100 + timeLeft * 10 + streak * 25);
      setStreak((value) => value + 1);
      setRoundResult("HIT");
    } else {
      setStreak(0);
      setRoundResult("MISS");
    }
  }

  function nextRound() {
    if (roundIndex >= CHALLENGE_ROUNDS.length - 1) {
      setRoundIndex(CHALLENGE_ROUNDS.length);
      return;
    }
    setRoundIndex((value) => value + 1);
    setTimeLeft(ROUND_SECONDS);
    setRoundResult("IDLE");
  }

  function playAgain() {
    setRoundIndex(0);
    setTimeLeft(ROUND_SECONDS);
    setScore(0);
    setStreak(0);
    setHits(0);
    setRoundResult("IDLE");
    setSaveState("idle");
    setPlayerName("");
  }

  async function submitScore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = playerName.trim().slice(0, 32);
    if (!trimmedName || saveState === "saving") return;

    const accuracyPct = Math.round((hits / CHALLENGE_ROUNDS.length) * 100);
    const payload = {
      player_name: trimmedName,
      score,
      accuracy_pct: accuracyPct,
      ghosts_spotted: hits,
    };
    setSaveState("saving");

    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Leaderboard returned ${response.status}`);
      setSaveState("saved");
      window.dispatchEvent(new Event("phantom-tide:leaderboard-updated"));
    } catch {
      saveLocalLeaderboardScore(payload);
      setSaveState("local");
    }
  }

  const accuracyPct = Math.round((hits / CHALLENGE_ROUNDS.length) * 100);
  const rank = getRank(accuracyPct);

  return (
    <main className="challenge-page">
      <ChallengeStyles />
      <div className="ambient" aria-hidden="true" />
      <header className="topbar">
        <a className="back-link" href="/">
          <ArrowLeft size={15} strokeWidth={1.8} /> Back to Live Radar
        </a>
        <div className="brand"><Waves size={16} /> PHANTOM TIDE <small>ANALYST ACADEMY</small></div>
        <div className="network-status"><span /> SIMULATION ACTIVE</div>
      </header>

      {complete ? (
        <div className="content">
          <section className="complete-header">
            <div className="eyebrow"><span className="dot" /> ANALYST SERIES COMPLETE <span className="dot" /></div>
            <h1>Mission debrief.</h1>
            <p>You have finished all five SAR passes across the Indian EEZ. Review your performance, save your call sign, and take your Ocean Guardian card with you.</p>
          </section>

          <div className="complete-grid">
            <section className="debrief-card" aria-labelledby="debrief-title">
              <div className="debrief-banner">
                <div className="rank-symbol"><ShieldCheck size={22} /></div>
                <h2 id="debrief-title">{rank}</h2>
                <p>Your radar analysis is complete. Every correctly identified target adds to the maritime picture.</p>
              </div>
              <div className="result-stats">
                <div className="result-stat"><span>Total score</span><strong className="mint">{score.toLocaleString("en-IN")}</strong></div>
                <div className="result-stat"><span>Accuracy</span><strong>{accuracyPct}%</strong></div>
                <div className="result-stat"><span>Targets locked</span><strong>{hits}<small style={{ color: "#7889a0", fontSize: 10 }}> / 5</small></strong></div>
              </div>
              <form className="save-form" onSubmit={submitScore}>
                <label htmlFor="player-name">Save your score to the leaderboard</label>
                <div className="save-row">
                  <input
                    id="player-name"
                    name="player_name"
                    maxLength={32}
                    placeholder="Enter analyst call sign"
                    value={playerName}
                    onChange={(event) => { setPlayerName(event.target.value); setSaveState("idle"); }}
                    autoComplete="nickname"
                  />
                  <button className="primary-button" type="submit" disabled={!playerName.trim() || saveState === "saving" || saveState === "saved"}>
                    {saveState === "saving" ? <Activity size={14} /> : saveState === "saved" || saveState === "local" ? <Check size={14} /> : <Trophy size={14} />}
                    {saveState === "saving" ? "Saving…" : saveState === "saved" || saveState === "local" ? "Saved" : "Submit score"}
                  </button>
                </div>
                <div className={`save-state ${saveState === "saved" ? "success" : saveState === "local" ? "local" : ""}`} aria-live="polite">
                  {saveState === "saved" && "Score synced to the leaderboard."}
                  {saveState === "local" && "Leaderboard API unavailable; score saved on this device."}
                </div>
              </form>
              <div className="debrief-actions">
                <button className="secondary-button" type="button" onClick={() => downloadGuardianCard(playerName.trim() || "Ocean Guardian", rank, score, accuracyPct)}>
                  <Download size={14} /> Download Ocean Guardian Card
                </button>
                <button className="secondary-button" type="button" onClick={playAgain}>
                  <RotateCcw size={14} /> Play again
                </button>
              </div>
              <div className="debrief-foot"><Sparkles size={12} /> Protecting the ocean starts with seeing what others miss.</div>
            </section>
            <Leaderboard />
          </div>
        </div>
      ) : (
        <div className="content">
          <section className="intro">
            <div>
              <div className="eyebrow"><span className="dot" /> ANALYST CHALLENGE <span> / </span> ROUND {roundIndex + 1} OF 5</div>
              <h1>Read the sea.<br />Find the signal.</h1>
              <p className="intro-copy">Interpret synthetic aperture radar passes and classify suspicious activity in India's Exclusive Economic Zone. You have 20 seconds per pass.</p>
            </div>
            <div className="stat-cluster" aria-label="Game statistics">
              <div className={`stat-card timer ${timeLeft <= 5 ? "urgent" : ""}`}>
                <div className="stat-label"><Clock3 size={12} /> Time</div>
                <div className="stat-value">{timeLeft}<small>sec</small></div>
              </div>
              <div className="stat-card">
                <div className="stat-label"><Trophy size={12} /> Score</div>
                <div className="stat-value">{score.toLocaleString("en-IN")}</div>
              </div>
              <div className="stat-card streak">
                <div className="stat-label"><Flame size={12} /> Streak</div>
                <div className="stat-value">{streak}<small>{streak === 1 ? "hit" : "hits"}</small></div>
              </div>
            </div>
          </section>

          <div className="progress-row" aria-label={`Round ${roundIndex + 1} of 5`}>
            {CHALLENGE_ROUNDS.map((item, index) => (
              <div className={`progress-segment ${index < roundIndex ? "done" : index === roundIndex ? "current" : ""}`} key={item.id} />
            ))}
          </div>

          <section className="mission-bar" aria-label="Current mission">
            <div className="mission-ident">
              <div className="mission-number">0{round.number}</div>
              <div className="mission-title-block">
                <h2>{round.title}</h2>
                <div className="location"><MapPin size={11} /> {round.location}</div>
              </div>
            </div>
            <div className={`mission-type ${round.targetType === "GHOST_VESSEL" ? "ghost" : "oil"}`}>
              <Target size={13} /> {round.targetType === "GHOST_VESSEL" ? "GHOST VESSEL" : "OIL SLICK"}
            </div>
          </section>

          <div className="game-grid">
            <section className="radar-panel" aria-label="SAR target analysis">
              <div className="radar-panel-head">
                <div className="sensor-name"><Satellite size={14} /> {round.sensor.toUpperCase()}</div>
                <div className="scan-status"><ScanLine size={13} /> PASS {String(round.number).padStart(2, "0")} · 640 × 400</div>
              </div>
              <SarCanvas key={round.id} round={round} disabled={roundResult !== "IDLE"} onGuess={(hit) => handleGuess(hit)} />
              {roundResult === "IDLE" ? (
                <div className="canvas-instruction"><Crosshair size={13} /> Click the suspected target to submit your classification</div>
              ) : (
                <div className={`feedback ${roundResult === "MISS" ? "miss" : roundResult === "TIMEOUT" ? "timeout" : ""}`} role="status">
                  <div className="result-badge">
                    {roundResult === "HIT" ? <CheckCircle2 size={13} /> : roundResult === "TIMEOUT" ? <Clock3 size={13} /> : <X size={13} />}
                    {roundResult}
                  </div>
                  <div className="feedback-note">{round.scientificNote}</div>
                  <button className="next-button" type="button" onClick={nextRound}>Next SAR Pass <ArrowRight size={13} /></button>
                </div>
              )}
            </section>

            <aside className="side-rail" aria-label="Mission intelligence">
              <section className="intel-card">
                <div className="intel-label"><Activity size={13} /> Mission briefing</div>
                <p>{round.briefing}</p>
                <div className="signature-chip"><Crosshair size={12} /> TARGET RADIUS · {round.target.radius}%</div>
              </section>
              <section className="intel-card">
                <div className="intel-label"><Satellite size={13} /> Sensor package</div>
                <div className="sensor-row">
                  <div className="sensor-icon"><Radio size={16} /></div>
                  <div><strong>{round.sensor}</strong><span>Monochrome SAR backscatter · Indian EEZ</span></div>
                </div>
              </section>
              <section className="intel-card science-card">
                <div className="intel-label"><Sparkles size={13} /> Analyst cues</div>
                <div className="legend">
                  <div className="legend-item"><span className="legend-dot vessel" /> Bright point + V-wake · vessel</div>
                  <div className="legend-item"><span className="legend-dot slick" /> Dark smooth patch · oil slick</div>
                  <div className="legend-item"><span className="legend-dot weather" /> Diffuse grey smear · weather clutter</div>
                </div>
              </section>
            </aside>
          </div>
          <div className="bottom-note"><ShieldCheck size={12} /> Training simulation · all targets and radar imagery are procedurally generated</div>
        </div>
      )}
    </main>
  );
}
