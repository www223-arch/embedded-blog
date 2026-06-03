import deskUpgradeMarkdown from "../../docs-vitepress/life/desk-upgrade.md?raw";
import mountainWeekendMarkdown from "../../docs-vitepress/life/mountain-weekend.md?raw";
import streetLightMarkdown from "../../docs-vitepress/life/street-light.md?raw";

export type LifePost = {
  id: string;
  title: string;
  date: string;
  tag: string;
  summary: string;
  cover: string;
  markdown?: string;
};

export const lifePosts: LifePost[] = [
  {
    id: "desk-upgrade",
    title: "Workstation Upgrade Log",
    date: "2026-02-27",
    tag: "Life",
    summary: "Reorganized the workstation, optimized the layout of soldering station, oscilloscope, and power supply - work efficiency improved significantly!",
    cover: "",
    markdown: deskUpgradeMarkdown
  },
  {
    id: "mountain-weekend",
    title: "Weekend Mountain Hike & Photography",
    date: "2026-03-16",
    tag: "Outdoor",
    summary: "Went hiking with friends on the weekend, shot some ridge backlighting photos, and documented a complete time-lapse workflow.",
    cover: "",
    markdown: mountainWeekendMarkdown
  },
  {
    id: "street-light",
    title: "Night Street Photography Practice",
    date: "2026-02-01",
    tag: "Photography",
    summary: "Went to the city streets at night to practice low-light photography, tried handheld long exposure and dynamic composition - results were much better than expected!",
    cover: "",
    markdown: streetLightMarkdown
  }
];
