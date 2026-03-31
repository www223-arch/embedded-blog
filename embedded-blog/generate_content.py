# -*- coding: utf-8 -*-
#!/usr/bin/env python3

import yaml
from pathlib import Path


def load_yaml_files(directory: Path):
    items = []
    if not directory.exists():
        return items
    
    for yaml_file in sorted(directory.glob("*.yaml")) + sorted(directory.glob("*.yml")):
        try:
            with open(yaml_file, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                items.append(data)
        except Exception as e:
            print(f"Warning: Cannot load {yaml_file}: {e}")
    return items


def escape_string(s: str) -> str:
    if not s:
        return '""'
    s = s.replace("\\", "\\\\")
    s = s.replace('"', '\\"')
    s = s.replace("\n", "\\n")
    s = s.replace("\r", "\\r")
    s = s.replace("\t", "\\t")
    return f'"{s}"'


def generate_projects_ts(projects, output_path: Path):
    lines = []
    lines.append('import { projectSchema, type ProjectItem } from "./schema";')
    lines.append('')
    lines.append('const projectsRaw = [')
    
    for p in projects:
        lines.append('  {')
        lines.append(f'    id: {escape_string(p.get("id", ""))},')
        lines.append(f'    title: {escape_string(p.get("title", ""))},')
        lines.append(f'    summary: {escape_string(p.get("summary", ""))},')
        
        stack = p.get("stack", [])
        lines.append(f'    stack: [{", ".join(escape_string(s) for s in stack)}],')
        
        highlights = p.get("highlights", [])
        lines.append(f'    highlights: [{", ".join(escape_string(h) for h in highlights)}],')
        
        gallery = p.get("gallery", [])
        lines.append(f'    gallery: [{", ".join(escape_string(g) for g in gallery)}],')
        
        links = p.get("links", [])
        links_str = ", ".join(f'{{ label: {escape_string(l.get("label", ""))}, href: {escape_string(l.get("href", ""))} }}' for l in links)
        lines.append(f'    links: [{links_str}]')
        lines.append('  },')
    
    lines.append('] as const;')
    lines.append('')
    lines.append('export const projectItems: ProjectItem[] = projectsRaw.map((item) => projectSchema.parse(item));')
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"OK: Generated {output_path}")


def generate_docs_ts(docs, output_path: Path):
    lines = []
    lines.append('import { docSchema, type TechDoc } from "./schema";')
    lines.append('')
    lines.append('const docsRaw = [')
    
    for d in docs:
        lines.append('  {')
        lines.append(f'    id: {escape_string(d.get("id", ""))},')
        lines.append(f'    title: {escape_string(d.get("title", ""))},')
        lines.append(f'    category: {escape_string(d.get("category", ""))},')
        
        tags = d.get("tags", [])
        lines.append(f'    tags: [{", ".join(escape_string(t) for t in tags)}],')
        
        lines.append(f'    level: {escape_string(d.get("level", "beginner"))},')
        lines.append(f'    updatedAt: {escape_string(d.get("updatedAt", ""))},')
        lines.append(f'    summary: {escape_string(d.get("summary", ""))},')
        lines.append(f'    markdown: {escape_string(d.get("markdown", ""))}')
        lines.append('  },')
    
    lines.append('] as const;')
    lines.append('')
    lines.append('export const techDocs: TechDoc[] = docsRaw.map((item) => docSchema.parse(item));')
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"OK: Generated {output_path}")


def generate_life_posts_ts(life_posts, output_path: Path):
    lines = []
    lines.append('export type LifePost = {')
    lines.append('  id: string;')
    lines.append('  title: string;')
    lines.append('  date: string;')
    lines.append('  tag: string;')
    lines.append('  summary: string;')
    lines.append('  cover: string;')
    lines.append('};')
    lines.append('')
    lines.append('export const lifePosts: LifePost[] = [')
    
    for lp in life_posts:
        lines.append('  {')
        lines.append(f'    id: {escape_string(lp.get("id", ""))},')
        lines.append(f'    title: {escape_string(lp.get("title", ""))},')
        lines.append(f'    date: {escape_string(lp.get("date", ""))},')
        lines.append(f'    tag: {escape_string(lp.get("tag", ""))},')
        lines.append(f'    summary: {escape_string(lp.get("summary", ""))},')
        lines.append(f'    cover: {escape_string(lp.get("cover", ""))}')
        lines.append('  },')
    
    lines.append('];')
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"OK: Generated {output_path}")


def main():
    base_dir = Path(__file__).parent
    content_dir = base_dir / "content"
    src_content_dir = base_dir / "src" / "content"
    
    print("=" * 60)
    print("Blog Content Generator")
    print("=" * 60)
    print()
    
    projects = load_yaml_files(content_dir / "projects")
    print(f"Found {len(projects)} projects")
    
    docs = load_yaml_files(content_dir / "docs")
    print(f"Found {len(docs)} docs")
    
    life_posts = load_yaml_files(content_dir / "life")
    print(f"Found {len(life_posts)} life posts")
    print()
    
    src_content_dir.mkdir(parents=True, exist_ok=True)
    
    generate_projects_ts(projects, src_content_dir / "projects.ts")
    generate_docs_ts(docs, src_content_dir / "docs.ts")
    generate_life_posts_ts(life_posts, src_content_dir / "lifePosts.ts")
    
    print()
    print("=" * 60)
    print("Content generation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
