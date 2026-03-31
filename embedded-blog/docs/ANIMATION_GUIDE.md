# 动效规范

## 节奏

- 入场：`0.45s ~ 0.6s`
- hover：`0.2s ~ 0.28s`
- 内容筛选切换：`0.2s ~ 0.24s`
- 过渡 easing：`power2.out`

## 使用方式

统一走 `src/shared/motion.ts`：

- `animateViewEnter(container)`
- `bindHoverLift(selector)`
- `animateSwapOutIn(target, beforeIn)`

## 约束

- 单屏并行动画不超过 3 组
- 阅读型页面避免高频循环动画
- 宠物与小游戏动画可随时关闭，不影响主内容
- 彩蛋入口需要“可发现但不打扰”，默认固定在右下角纸角形态
