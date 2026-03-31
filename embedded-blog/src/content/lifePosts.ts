export type LifePost = {
  id: string;
  title: string;
  date: string;
  tag: string;
  summary: string;
  cover: string;
};

export const lifePosts: LifePost[] = [
  {
    id: "mountain-weekend",
    title: "周末山路徒步与拍摄",
    date: "2026-03-16",
    tag: "户外",
    summary: "爬山途中拍了几组山脊逆光，顺手记录了一个延时摄影流程。",
    cover: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "desk-upgrade",
    title: "工作台升级日志",
    date: "2026-02-27",
    tag: "生活",
    summary: "整理了新的焊台与示波器布局，效率明显提升。",
    cover: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "street-light",
    title: "夜景街拍练习",
    date: "2026-02-01",
    tag: "摄影",
    summary: "低照度下尝试了手持长曝光和动态构图，意外很出片。",
    cover: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
  }
];
