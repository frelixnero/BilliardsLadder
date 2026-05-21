import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Users, Camera, Download, Shuffle, Trash2, Plus, Crown, Target } from "lucide-react";

// -------------------- Types --------------------
interface Player {
  id: string;
  name: string;
}

interface Match {
  id: string;
  round: number; // 1-indexed
  a: Player | null; // left/top
  b: Player | null; // right/bottom
  scoreA?: number;
  scoreB?: number;
  winnerId?: string; // a.id or b.id
  nextMatchId?: string; // winner link forward
  nextSlot?: "a" | "b"; // where the winner goes next
  // Double-elim extras
  bracket?: "W" | "L" | "GF"; // Winners, Losers, Grand Final
  loserNextMatchId?: string; // where the loser goes (only for W bracket)
  loserNextSlot?: "a" | "b";
}

interface BracketState {
  id: string;
  name: string;
  format: "single" | "double"; // double is stubbed below
  players: Player[];
  matches: Match[];
  createdAt: number;
}

// Fargo reporting row (simple CSV-ready)
interface ReportRow {
  tournament: string;
  dateISO: string;
  round: number;
  playerA: string;
  playerB: string;
  scoreA: number | "";
  scoreB: number | "";
  winner: string;
}

// -------------------- Utils --------------------
const uid = () => Math.random().toString(36).slice(2, 10);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextPowerOfTwo(n: number) {
  if (n < 1) return 1;
  return 1 << (32 - Math.clz32(n - 1));
}

function saveLocal(key: string, value: any) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// -------------------- OCR --------------------
async function ocrImage(file: File): Promise<string> {
  // Dynamic import to keep initial bundle small
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(file);
    await worker.terminate();
    return data.text || "";
  } catch (e) {
    try { await worker.terminate(); } catch {}
    return "";
  }
}

// -------------------- Bracket Generation --------------------
function buildSingleElim(playersIn: Player[]): Match[] {
  const players = [...playersIn];
  const n = players.length;
  const size = nextPowerOfTwo(n);
  // Add BYEs (null means empty; we'll treat BYE as auto-advance)
  while (players.length < size) players.push({ id: `bye-${uid()}`, name: "BYE" });

  const shuffled = shuffle(players);

  const matches: Match[] = [];
  const rounds = Math.log2(size);

  // create all matches structure up-front
  const matchMatrix: Match[][] = [];
  for (let r = 1; r <= rounds; r++) {
    const numMatches = size / Math.pow(2, r);
    const roundMatches: Match[] = new Array(numMatches).fill(null).map(() => ({
      id: `m-${r}-${uid()}`,
      round: r,
      a: null,
      b: null,
      bracket: "W",
    } as Match));
    matchMatrix.push(roundMatches);
  }

  // link forward
  for (let r = 0; r < matchMatrix.length - 1; r++) {
    const cur = matchMatrix[r];
    const nxt = matchMatrix[r + 1];
    cur.forEach((m, i) => {
      const target = nxt[Math.floor(i / 2)];
      m.nextMatchId = target.id;
      m.nextSlot = i % 2 === 0 ? "a" : "b";
    });
  }

  // seed round 1
  for (let i = 0; i < size; i += 2) {
    const m = matchMatrix[0][i / 2];
    m.a = shuffled[i] || null;
    m.b = shuffled[i + 1] || null;
  }

  // flatten
  matchMatrix.forEach(r => matches.push(...r));

  // auto-advance any BYE
  autoAdvanceByes(matches);
  return matches;
}

function buildDoubleElim(playersIn: Player[]): Match[] {
  // Winners bracket identical to single-elim
  const wb = buildSingleElim(playersIn);
  const byId = new Map(wb.map(m => [m.id, m] as const));

  // Count rounds in WB
  const wbRounds = Math.max(...wb.map(m => m.round));
  const size = Math.pow(2, wbRounds);

  // Build Losers Bracket rounds (simplified chain)
  const losers: Match[] = [];
  const lbRoundsArr: Match[][] = [];
  for (let r = 1; r <= wbRounds - 1; r++) {
    const numMatches = size / Math.pow(2, r + 1); // half of WB round r
    const roundMatches: Match[] = new Array(numMatches).fill(null).map(() => ({
      id: `L-${r}-${uid()}`,
      round: r,
      a: null,
      b: null,
      bracket: "L",
    } as Match));
    lbRoundsArr.push(roundMatches);
  }

  // Link LB winners forward within LB
  for (let r = 0; r < lbRoundsArr.length - 1; r++) {
    const cur = lbRoundsArr[r];
    const nxt = lbRoundsArr[r + 1];
    cur.forEach((m, i) => {
      const target = nxt[Math.floor(i / 2)];
      m.nextMatchId = target.id;
      m.nextSlot = i % 2 === 0 ? "a" : "b";
    });
  }

  // Map WB losers → LB entries (pair WB matches 0&1 → LB r match 0, 2&3 → LB r match 1, etc.)
  for (let r = 1; r <= wbRounds - 1; r++) {
    const wbMatches = wb.filter(m => m.round === r);
    const lbMatches = lbRoundsArr[r - 1];
    wbMatches.forEach((m, i) => {
      const target = lbMatches[Math.floor(i / 2)];
      if (i % 2 === 0) {
        m.loserNextMatchId = target.id;
        m.loserNextSlot = "a";
      } else {
        m.loserNextMatchId = target.id;
        m.loserNextSlot = "b";
      }
    });
  }

  // Grand Final: LB winner vs WB champion
  const gf: Match = {
    id: `GF-${uid()}`,
    round: wbRounds + 1,
    a: null,
    b: null,
    bracket: "GF",
  };

  // Link WB final winner → GF.a
  const wbFinalRound = wb.filter(m => m.round === wbRounds);
  const wbFinal = wbFinalRound[0];
  if (wbFinal) {
    wbFinal.nextMatchId = gf.id;
    wbFinal.nextSlot = "a";
  }

  // Link LB final winner → GF.b
  const lbFinalArr = lbRoundsArr[lbRoundsArr.length - 1] || [];
  const lbFinal = lbFinalArr[0];
  if (lbFinal) {
    lbFinal.nextMatchId = gf.id;
    lbFinal.nextSlot = "b";
  }

  // Flatten LB
  lbRoundsArr.forEach(r => losers.push(...r));

  return [...wb, ...losers, gf];
}

function autoAdvanceByes(matches: Match[]) {
  const byId = new Map(matches.map(m => [m.id, m] as const));
  for (const m of matches) {
    const isABye = m.a?.name === "BYE";
    const isBBye = m.b?.name === "BYE";
    if ((isABye || isBBye) && !(m.winnerId)) {
      const winner = isABye ? m.b : m.a;
      if (winner) {
        m.winnerId = winner.id;
        if (m.nextMatchId && m.nextSlot) {
          const next = byId.get(m.nextMatchId);
          if (next) {
            if (m.nextSlot === "a") next.a = winner;
            else next.b = winner;
          }
        }
      }
    }
  }
}

// -------------------- Winner Poster --------------------
function drawWinnerPoster(canvas: HTMLCanvasElement, tournamentName: string, winnerName: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = 1200, H = 675;
  canvas.width = W; canvas.height = H;

  // Dark background matching the theme
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0a0a0a");
  g.addColorStop(1, "#1a1a1a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // Green glow ring
  ctx.beginPath();
  ctx.arc(W/2, H/2, 260, 0, Math.PI*2);
  const g2 = ctx.createRadialGradient(W/2, H/2, 100, W/2, H/2, 300);
  g2.addColorStop(0, "rgba(0,255,0,0.35)");
  g2.addColorStop(1, "rgba(0,255,0,0)");
  ctx.fillStyle = g2; ctx.fill();

  // Text
  ctx.fillStyle = "#00ff00";
  ctx.font = "700 64px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textAlign = "center";
  ctx.fillText("TOURNAMENT CHAMPION", W/2, 140);

  ctx.fillStyle = "white";
  ctx.font = "800 96px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText(winnerName.toUpperCase(), W/2, H/2 + 20);

  ctx.fillStyle = "#666";
  ctx.font = "600 40px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText(tournamentName, W/2, H - 80);

  // Add slogan
  ctx.fillStyle = "#00ff00";
  ctx.font = "400 24px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText("In here, respect is earned in racks, not words", W/2, H - 30);
}

// -------------------- Component --------------------
export default function TournamentBrackets() {
  const { toast } = useToast();
  
  // Tournament state
  const [name, setName] = useState("Action Ladder Tournament");
  const [format, setFormat] = useState<"single" | "double">("single");
  const [players, setPlayers] = useState<Player[]>(loadLocal("tournament_players", []));
  const [pName, setPName] = useState("");
  const [matches, setMatches] = useState<Match[]>(loadLocal("tournament_matches", []));
  const [reportFargo, setReportFargo] = useState<boolean>(loadLocal("tournament_report_toggle", false));
  const [reportRows, setReportRows] = useState<ReportRow[]>(loadLocal("tournament_report_rows", []));

  const [ocrBusy, setOcrBusy] = useState<string | null>(null); // matchId in progress

  const winner = useMemo(() => {
    if (!matches.length) return null;
    const lastRound = Math.max(...matches.map(m => m.round));
    const finals = matches.filter(m => m.round === lastRound);
    const fm = finals[0];
    if (fm && fm.winnerId) {
      const w = fm.a?.id === fm.winnerId ? fm.a : fm.b?.id === fm.winnerId ? fm.b : null;
      return w || null;
    }
    return null;
  }, [matches]);

  useEffect(() => { saveLocal("tournament_players", players); }, [players]);
  useEffect(() => { saveLocal("tournament_matches", matches); }, [matches]);
  useEffect(() => { saveLocal("tournament_report_toggle", reportFargo); }, [reportFargo]);
  useEffect(() => { saveLocal("tournament_report_rows", reportRows); }, [reportRows]);

  function addPlayer() {
    const n = pName.trim();
    if (!n) {
      toast({
        title: "Player Name Required",
        description: "Enter a player name before adding.",
        variant: "destructive",
      });
      return;
    }
    if (players.some(p => p.name.toLowerCase() === n.toLowerCase())) {
      toast({
        title: "Player Already Added",
        description: "This player is already in the tournament",
        variant: "destructive",
      });
      return;
    }
    setPlayers(p => [...p, { id: uid(), name: n }]);
    setPName("");
    toast({
      title: "Player Added",
      description: `${n} has been added to the tournament`,
    });
  }

  function removePlayer(id: string) {
    const player = players.find(p => p.id === id);
    setPlayers(p => p.filter(x => x.id !== id));
    toast({
      title: "Player Removed",
      description: `${player?.name} has been removed from the tournament`,
    });
  }

  function randomizeAndBuild() {
    if (players.length < 2) {
      toast({
        title: "Not Enough Players",
        description: "Add at least 2 players to start the tournament",
        variant: "destructive",
      });
      return;
    }
    if (format === "single") {
      const m = buildSingleElim(players);
      setMatches(m);
      toast({
        title: "Tournament Started",
        description: `Single elimination bracket created with ${players.length} players`,
      });
    } else {
      const m = buildDoubleElim(players);
      setMatches(m);
      toast({
        title: "Tournament Started",
        description: `Double elimination bracket created with ${players.length} players`,
      });
    }
  }

  function resetTournament() {
    setMatches([]);
    setReportRows([]);
    toast({
      title: "Tournament Reset",
      description: "Bracket cleared, players kept",
    });
  }

  function clearAll() {
    setPlayers([]);
    setMatches([]);
    setReportRows([]);
    toast({
      title: "Tournament Cleared",
      description: "All players and matches removed",
    });
  }

  function setWinner(m: Match, winner: "a" | "b") {
    const w = winner === "a" ? m.a : m.b;
    const l = winner === "a" ? m.b : m.a;
    if (!w || w.name === "BYE") return;
    
    const updated = matches.map(x => ({ ...x }));
    const byId = new Map(updated.map(mm => [mm.id, mm] as const));
    const cur = byId.get(m.id);
    if (!cur) return;

    cur.winnerId = w.id;

    // Winner propagation
    if (cur.nextMatchId && cur.nextSlot) {
      const nxt = byId.get(cur.nextMatchId);
      if (nxt) {
        if (cur.nextSlot === "a") nxt.a = w;
        else nxt.b = w;
      }
    }

    // Loser propagation (double-elim only)
    if (l && cur.loserNextMatchId && cur.loserNextSlot && l.name !== "BYE") {
      const loserNext = byId.get(cur.loserNextMatchId);
      if (loserNext) {
        if (cur.loserNextSlot === "a") loserNext.a = l;
        else loserNext.b = l;
      }
    }

    setMatches(updated);

    toast({
      title: "Winner Set",
      description: `${w.name} advances${cur.bracket === "W" && l && l.name !== "BYE" ? ", " + l.name + " drops to losers bracket" : ""}`,
    });

    // if reporting is on, append a CSV-ready row
    if (reportFargo && cur.a && cur.b && cur.winnerId) {
      const playerA = cur.a;
      const playerB = cur.b;
      setReportRows(rows => ([
        ...rows,
        {
          tournament: name,
          dateISO: new Date().toISOString(),
          round: cur.round,
          playerA: playerA.name || "",
          playerB: playerB.name || "",
          scoreA: typeof cur.scoreA === "number" ? cur.scoreA : "",
          scoreB: typeof cur.scoreB === "number" ? cur.scoreB : "",
          winner: cur.winnerId === playerA.id ? (playerA.name || "") : (playerB.name || ""),
        }
      ]));
    }
  }

  async function handleOCR(m: Match, file: File) {
    setOcrBusy(m.id);
    
    try {
      const text = await ocrImage(file);

      // Detect simple score like 5-3 or 7–4
      const scoreMatch = text.match(/(\d+)\s*[-–]\s*(\d+)/);
      if (scoreMatch) {
        const a = Number(scoreMatch[1]);
        const b = Number(scoreMatch[2]);
        m.scoreA = a; 
        m.scoreB = b;
      }

      const names = [m.a?.name, m.b?.name].filter(Boolean) as string[];
      const lower = text.toLowerCase();

      let detected: "a" | "b" | null = null;
      if (m.a && lower.includes(m.a.name.toLowerCase())) detected = "a";
      if (m.b && lower.includes(m.b.name.toLowerCase())) detected = detected ? detected : "b";

      if (detected && names.every(n => lower.includes(n.toLowerCase()))) {
        if (/winner:\s*([\w\s]+)/i.test(text)) {
          const [, who] = text.match(/winner:\s*([\w\s]+)/i) || [];
          if (who && m.a && who.toLowerCase().includes(m.a.name.toLowerCase())) detected = "a";
          if (who && m.b && who.toLowerCase().includes(m.b.name.toLowerCase())) detected = "b";
        } else if (/defeats|defeated|beat|winner/i.test(text)) {
          const aOverB = new RegExp(`${m.a?.name}.*(defeats|defeated|beat)`, "i");
          const bOverA = new RegExp(`${m.b?.name}.*(defeats|defeated|beat)`, "i");
          if (aOverB.test(text)) detected = "a";
          if (bOverA.test(text)) detected = "b";
        }
      }

      if (detected) {
        setWinner(m, detected);
        toast({
          title: "Winner Detected",
          description: "OCR successfully read the match result",
        });
      } else {
        toast({
          title: "OCR Result",
          description: "Couldn't confidently read the photo. Tap a winner manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "OCR Error",
        description: "Failed to process the image",
        variant: "destructive",
      });
    }

    setOcrBusy(null);
  }

  // Poster download
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  function downloadPoster() {
    if (!winner || !canvasRef.current) return;
    drawWinnerPoster(canvasRef.current, name, winner.name);
    const link = document.createElement("a");
    link.download = `${winner.name.replace(/\s+/g, "_")}_champion.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    
    toast({
      title: "Poster Downloaded",
      description: `Champion poster for ${winner.name} has been downloaded`,
    });
  }

  function exportFargoCSV() {
    if (!reportRows.length) {
      toast({
        title: "No Data",
        description: "No matches to export yet",
        variant: "destructive",
      });
      return;
    }

    const headers = ["tournament", "dateISO", "round", "playerA", "playerB", "scoreA", "scoreB", "winner"];
    const csvContent = [
      headers.join(","),
      ...reportRows.map(row => [
        `"${row.tournament}"`,
        `"${row.dateISO}"`,
        row.round,
        `"${row.playerA}"`,
        `"${row.playerB}"`,
        row.scoreA,
        row.scoreB,
        `"${row.winner}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/\s+/g, "_")}_fargo_report.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "CSV Exported",
      description: "Fargo report has been downloaded",
    });
  }

  const matchesByBracketAndRound = useMemo(() => {
    const byBracket = new Map<string, Map<number, Match[]>>();
    matches.forEach(m => {
      const bracket = m.bracket || "W";
      if (!byBracket.has(bracket)) byBracket.set(bracket, new Map());
      const byRound = byBracket.get(bracket)!;
      if (!byRound.has(m.round)) byRound.set(m.round, []);
      byRound.get(m.round)!.push(m);
    });
    return byBracket;
  }, [matches]);

  const maxRound = matches.length ? Math.max(...matches.map(m => m.round)) : 0;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neon-green mb-2">Tournament Brackets</h1>
          <p className="text-gray-400">Single elimination tournaments with OCR photo scanning</p>
          <div className="mt-3 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg inline-block">
            <p className="text-sm text-green-400">✓ No membership required to create or participate in tournaments</p>
          </div>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-felt-darker">
            <TabsTrigger value="setup" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
              <Users className="w-4 h-4 mr-2" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="bracket" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
              <Trophy className="w-4 h-4 mr-2" />
              Bracket
            </TabsTrigger>
            <TabsTrigger value="winner" className="data-[state=active]:bg-neon-green data-[state=active]:text-black" disabled={!winner}>
              <Crown className="w-4 h-4 mr-2" />
              Winner
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
              <Target className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            {/* Tournament Settings */}
            <Card className="bg-felt-darker border border-neon-green/30">
              <CardHeader>
                <CardTitle className="text-neon-green">Tournament Settings</CardTitle>
                <CardDescription>Configure your tournament details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tournament-name" className="text-gray-300">Tournament Name</Label>
                  <Input
                    id="tournament-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-black/20 border-neon-green/30 text-white"
                    data-testid="input-tournament-name"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-300">Format</Label>
                  <div className="flex space-x-4 mt-2">
                    <Button
                      type="button"
                      variant={format === "single" ? "default" : "outline"}
                      onClick={() => setFormat("single")}
                      className={format === "single"
                        ? "bg-neon-green text-black border border-neon-green"
                        : "bg-transparent border-neon-green/50 text-neon-green hover:bg-neon-green/10"}
                      data-testid="button-format-single"
                    >
                      Single Elimination
                    </Button>
                    <Button
                      type="button"
                      variant={format === "double" ? "default" : "outline"}
                      onClick={() => setFormat("double")}
                      className={format === "double"
                        ? "bg-neon-green text-black border border-neon-green"
                        : "bg-transparent border-neon-green/50 text-neon-green hover:bg-neon-green/10"}
                      data-testid="button-format-double"
                    >
                      Double Elimination
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Player Management */}
            <Card className="bg-felt-darker border border-neon-green/30">
              <CardHeader>
                <CardTitle className="text-neon-green flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Players ({players.length})
                </CardTitle>
                <CardDescription>Add players to the tournament</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    placeholder="Enter player name"
                    className="bg-black/20 border-neon-green/30 text-white flex-1"
                    onKeyPress={(e) => e.key === "Enter" && addPlayer()}
                    data-testid="input-player-name"
                  />
                  <Button
                    type="button"
                    onClick={addPlayer}
                    className="bg-neon-green text-black hover:bg-neon-green/80"
                    data-testid="button-add-player"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {players.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between bg-black/20 p-3 rounded border border-neon-green/20"
                        data-testid={`player-${player.id}`}
                      >
                        <span className="text-white">{player.name}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePlayer(player.id)}
                          className="text-red-400 border-red-400/50 hover:bg-red-400/20"
                          data-testid={`button-remove-${player.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <Button
                    onClick={randomizeAndBuild}
                    disabled={players.length < 2 || matches.length > 0}
                    className="bg-neon-green text-black hover:bg-neon-green/80"
                    data-testid="button-start-tournament"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Start Tournament
                  </Button>
                  
                  {matches.length > 0 && (
                    <>
                      <Button
                        onClick={resetTournament}
                        variant="outline"
                        className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                        data-testid="button-reset-tournament"
                      >
                        Reset Bracket
                      </Button>
                      <Button
                        onClick={clearAll}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        data-testid="button-clear-all"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bracket" className="space-y-6">
            {matches.length === 0 ? (
              <Card className="bg-felt-darker border border-neon-green/30">
                <CardContent className="text-center py-16">
                  <Trophy className="w-16 h-16 mx-auto text-neon-green/50 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Tournament Started</h3>
                  <p className="text-gray-500">Add players and start a tournament to see the bracket</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-12">
                {/* Winners Bracket */}
                {matchesByBracketAndRound.has("W") && (
                  <div>
                    <h2 className="text-3xl font-bold text-neon-green mb-6 text-center">Winners Bracket</h2>
                    <div className="space-y-8">
                      {Array.from(matchesByBracketAndRound.get("W")!.keys()).sort((a, b) => a - b).map(round => {
                        const roundMatches = matchesByBracketAndRound.get("W")!.get(round) || [];
                        const wbMaxRound = Math.max(...Array.from(matchesByBracketAndRound.get("W")!.keys()));
                        const roundName = round === wbMaxRound ? "WB Finals" : 
                                        round === wbMaxRound - 1 ? "WB Semi-Finals" :
                                        round === wbMaxRound - 2 ? "WB Quarter-Finals" :
                                        `WB Round ${round}`;
                        
                        return (
                          <div key={`W-${round}`}>
                            <h3 className="text-xl font-bold text-neon-green mb-4 text-center">{roundName}</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {roundMatches.map(match => (
                                <MatchCard 
                                  key={match.id} 
                                  match={match} 
                                  onSetWinner={setWinner}
                                  onOCR={handleOCR}
                                  ocrBusy={ocrBusy === match.id}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Losers Bracket */}
                {matchesByBracketAndRound.has("L") && (
                  <div>
                    <h2 className="text-3xl font-bold text-red-400 mb-6 text-center">Losers Bracket</h2>
                    <div className="space-y-8">
                      {Array.from(matchesByBracketAndRound.get("L")!.keys()).sort((a, b) => a - b).map(round => {
                        const roundMatches = matchesByBracketAndRound.get("L")!.get(round) || [];
                        const lbMaxRound = Math.max(...Array.from(matchesByBracketAndRound.get("L")!.keys()));
                        const roundName = round === lbMaxRound ? "LB Finals" : 
                                        round === lbMaxRound - 1 ? "LB Semi-Finals" :
                                        `LB Round ${round}`;
                        
                        return (
                          <div key={`L-${round}`}>
                            <h3 className="text-xl font-bold text-red-400 mb-4 text-center">{roundName}</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {roundMatches.map(match => (
                                <MatchCard 
                                  key={match.id} 
                                  match={match} 
                                  onSetWinner={setWinner}
                                  onOCR={handleOCR}
                                  ocrBusy={ocrBusy === match.id}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grand Final */}
                {matchesByBracketAndRound.has("GF") && (
                  <div>
                    <h2 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Grand Final</h2>
                    <div className="flex justify-center">
                      {Array.from(matchesByBracketAndRound.get("GF")!.values()).flat().map(match => (
                        <MatchCard 
                          key={match.id} 
                          match={match} 
                          onSetWinner={setWinner}
                          onOCR={handleOCR}
                          ocrBusy={ocrBusy === match.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="winner" className="space-y-6">
            {winner && (
              <div className="text-center space-y-6">
                <Card className="bg-felt-darker border border-neon-green/30 max-w-2xl mx-auto">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <Crown className="w-16 h-16 mx-auto text-neon-green mb-4" />
                      <h2 className="text-3xl font-bold text-neon-green mb-2">TOURNAMENT CHAMPION</h2>
                      <h3 className="text-4xl font-bold text-white">{winner.name.toUpperCase()}</h3>
                      <p className="text-gray-400 mt-2">{name}</p>
                    </div>
                    
                    <Button
                      onClick={downloadPoster}
                      className="bg-neon-green text-black hover:bg-neon-green/80"
                      data-testid="button-download-poster"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Champion Poster
                    </Button>
                  </CardContent>
                </Card>
                
                <canvas 
                  ref={canvasRef} 
                  style={{ display: "none" }}
                  width={1200} 
                  height={675}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="bg-felt-darker border border-neon-green/30">
              <CardHeader>
                <CardTitle className="text-neon-green">Fargo Reporting</CardTitle>
                <CardDescription>Export tournament data for Fargo rating system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="fargo-toggle"
                    checked={reportFargo}
                    onChange={(e) => setReportFargo(e.target.checked)}
                    className="rounded border-neon-green/30"
                    data-testid="checkbox-fargo-reporting"
                  />
                  <Label htmlFor="fargo-toggle" className="text-gray-300">
                    Enable Fargo reporting (beta)
                  </Label>
                </div>
                
                {reportRows.length > 0 && (
                  <div>
                    <p className="text-gray-400 mb-2">{reportRows.length} matches recorded</p>
                    <Button
                      onClick={exportFargoCSV}
                      className="bg-neon-green text-black hover:bg-neon-green/80"
                      data-testid="button-export-csv"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// -------------------- Match Card Component --------------------
interface MatchCardProps {
  match: Match;
  onSetWinner: (match: Match, winner: "a" | "b") => void;
  onOCR: (match: Match, file: File) => void;
  ocrBusy: boolean;
}

function MatchCard({ match, onSetWinner, onOCR, ocrBusy }: MatchCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onOCR(match, file);
  };

  const playerA = match.a;
  const playerB = match.b;
  const hasWinner = !!match.winnerId;
  const winner = hasWinner ? (match.winnerId === playerA?.id ? playerA : playerB) : null;

  if (!playerA || !playerB || playerA.name === "BYE" || playerB.name === "BYE") {
    return null; // Skip BYE matches or incomplete matches
  }

  return (
    <Card className="bg-felt-darker border border-neon-green/30" data-testid={`match-${match.id}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Players */}
          <div className="space-y-2">
            <div 
              className={`flex items-center justify-between p-3 rounded border ${
                hasWinner && winner?.id === playerA?.id 
                  ? 'bg-neon-green/20 border-neon-green text-neon-green' 
                  : 'bg-black/20 border-gray-600 text-white'
              }`}
            >
              <span className="font-medium">{playerA?.name}</span>
              {match.scoreA !== undefined && (
                <Badge variant="outline" className="text-xs">
                  {match.scoreA}
                </Badge>
              )}
            </div>
            
            <div className="text-center text-gray-400 text-sm">VS</div>
            
            <div 
              className={`flex items-center justify-between p-3 rounded border ${
                hasWinner && winner?.id === playerB?.id 
                  ? 'bg-neon-green/20 border-neon-green text-neon-green' 
                  : 'bg-black/20 border-gray-600 text-white'
              }`}
            >
              <span className="font-medium">{playerB?.name}</span>
              {match.scoreB !== undefined && (
                <Badge variant="outline" className="text-xs">
                  {match.scoreB}
                </Badge>
              )}
            </div>
          </div>

          {/* Winner Selection */}
          {!hasWinner && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  onClick={() => onSetWinner(match, "a")}
                  className="bg-neon-green text-black hover:bg-neon-green/80"
                  data-testid={`button-winner-a-${match.id}`}
                >
                  {playerA?.name} Wins
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSetWinner(match, "b")}
                  className="bg-neon-green text-black hover:bg-neon-green/80"
                  data-testid={`button-winner-b-${match.id}`}
                >
                  {playerB?.name} Wins
                </Button>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrBusy}
                className="w-full border-gray-500/50 text-gray-300 hover:bg-gray-500/20"
                data-testid={`button-ocr-${match.id}`}
              >
                <Camera className="w-4 h-4 mr-2" />
                {ocrBusy ? "Reading Photo..." : "Photo → Auto Fill"}
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: "none" }}
                data-testid={`input-photo-${match.id}`}
              />
            </div>
          )}

          {hasWinner && (
            <div className="text-center">
              <Badge className="bg-neon-green text-black">
                Winner: {winner?.name}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}