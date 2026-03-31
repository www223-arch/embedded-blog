export type Message = {
  id: string;
  name: string;
  content: string;
  createdAt: string;
};

export interface MessageRepository {
  list(): Message[];
  add(input: Omit<Message, "id" | "createdAt">): Message;
}

const STORAGE_KEY = "embedded-blog-board";

export class LocalMessageRepository implements MessageRepository {
  list(): Message[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Message[];
    } catch {
      return [];
    }
  }

  add(input: Omit<Message, "id" | "createdAt">): Message {
    const next: Message = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      content: input.content.trim(),
      createdAt: new Date().toISOString()
    };
    const items = this.list();
    items.unshift(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
    return next;
  }
}

// FutureCloudMessageRepository 可在后续接入 Supabase/Firebase 并实现同样接口。
