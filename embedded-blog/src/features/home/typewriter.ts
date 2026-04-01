import { profile } from "../../content/profile";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function type(target: HTMLElement, text: string, speed: number): Promise<void> {
  target.textContent = "";
  for (const ch of text) {
    target.textContent += ch;
    await wait(speed);
  }
}

async function erase(target: HTMLElement, speed: number): Promise<void> {
  while (target.textContent && target.textContent.length > 0) {
    target.textContent = target.textContent.slice(0, -1);
    await wait(speed);
  }
}

// Identity styles mapping
const identityStyles: Record<string, string> = {
  "Engineer": "role-engineer",
  "Photog": "role-photographer", 
  "Dreamer": "role-dreamer"
};

export async function runTypewriter(): Promise<void> {
  const hello = document.getElementById("lineHello");
  const iam = document.getElementById("lineIam");
  const role = document.getElementById("lineRole");
  if (!hello || !iam || !role) return;
  await type(hello, "Hello world,", 70);
  await wait(180);
  await type(iam, ` ${profile.name}, I can be`, 55);
  await wait(200);
  while (document.getElementById("lineRole")) {
    for (const item of profile.identities) {
      // Apply style class for this identity
      role.className = identityStyles[item] || "";
      await type(role, item, 70);
      await wait(2000);
      await erase(role, 40);
      await wait(130);
    }
  }
}
