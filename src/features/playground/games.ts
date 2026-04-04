import { commitMemoryResult, commitReactionResult, getGameState } from "../../store/engagementStore";

export function mountGames(): void {
  mountMemoryGame();
  mountReactionGame();
  refreshBoard();
}

function refreshBoard(): void {
  const board = document.getElementById("scoreBoard");
  if (!board) return;
  const state = getGameState();
  board.textContent = `points: ${state.points} | best memory: ${state.memoryBest || "-"} | best reaction: ${state.reactionBest === 9999 ? "-" : `${state.reactionBest}ms`}`;
}

function mountMemoryGame(): void {
  const wrap = document.getElementById("memoryGame");
  const status = document.getElementById("memoryStatus");
  if (!wrap || !status) return;
  const values = ["A", "A", "B", "B", "C", "C"];
  const shuffled = [...values].sort(() => Math.random() - 0.5);
  let open: HTMLElement[] = [];
  let lock = false;
  let moves = 0;

  wrap.innerHTML = shuffled
    .map((v, idx) => `<button class="memory-card" data-value="${v}" data-index="${idx}">?</button>`)
    .join("");

  wrap.querySelectorAll<HTMLElement>(".memory-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (lock || card.textContent !== "?") return;
      card.textContent = card.dataset.value || "?";
      open.push(card);
      if (open.length < 2) return;
      lock = true;
      moves += 1;
      status.textContent = `moves: ${moves}`;
      const [a, b] = open;
      if (a.dataset.value === b.dataset.value) {
        open = [];
        lock = false;
        const remaining = [...wrap.querySelectorAll(".memory-card")].filter((c) => c.textContent === "?");
        if (!remaining.length) {
          commitMemoryResult(moves);
          refreshBoard();
        }
      } else {
        window.setTimeout(() => {
          a.textContent = "?";
          b.textContent = "?";
          open = [];
          lock = false;
        }, 500);
      }
    });
  });
}

function mountReactionGame(): void {
  const btn = document.getElementById("reactionBtn") as HTMLButtonElement | null;
  const status = document.getElementById("reactionStatus");
  if (!btn || !status) return;
  let startTime = 0;
  let ready = false;

  btn.onclick = () => {
    if (!ready) {
      status.textContent = "wait for green...";
      btn.style.background = "#e4e9f3";
      const delay = 900 + Math.random() * 1400;
      window.setTimeout(() => {
        ready = true;
        startTime = performance.now();
        btn.style.background = "#30c26f";
        status.textContent = "click now!";
      }, delay);
      return;
    }
    const reaction = Math.round(performance.now() - startTime);
    status.textContent = `your reaction: ${reaction}ms`;
    btn.style.background = "";
    ready = false;
    commitReactionResult(reaction);
    refreshBoard();
  };
}
