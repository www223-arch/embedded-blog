type PetState = "idle" | "follow" | "react" | "sleep";

let currentState: PetState = "idle";
let enabled = true;

function setState(next: PetState, node: HTMLElement): void {
  currentState = next;
  node.setAttribute("data-state", currentState);
  node.querySelector(".pet-status")!.textContent = `pet: ${currentState}`;
}

export function mountPet(): void {
  if (!enabled || document.getElementById("petWidget")) return;
  const host = document.getElementById("petDock");
  if (!host) return;
  const pet = document.createElement("div");
  pet.id = "petWidget";
  pet.className = "pet-widget embedded";
  pet.innerHTML = `
    <div class="pet-face">◕‿◕</div>
    <small class="pet-status">pet: idle</small>
    <small class="pet-hint">hover me</small>
    <button id="petClose" aria-label="关闭宠物">×</button>
  `;
  host.appendChild(pet);
  setState("idle", pet);

  pet.addEventListener("mouseenter", () => setState("react", pet));
  pet.addEventListener("mouseleave", () => setState("idle", pet));
  pet.addEventListener("click", () => setState("follow", pet));
  document.getElementById("petClose")?.addEventListener("click", () => {
    enabled = false;
    pet.remove();
  });

  window.setInterval(() => {
    if (!document.getElementById("petWidget")) return;
    if (currentState === "idle") setState("sleep", pet);
    else if (currentState === "sleep") setState("idle", pet);
  }, 6000);
}
