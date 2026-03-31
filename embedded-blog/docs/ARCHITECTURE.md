# 架构说明

## 分层

- `src/app`：应用壳、hash 路由、模块注册中心。
- `src/features`：业务模块（home/docs/projects/life/board/playground/pet）。
- `src/content`：内容层（文档、项目、生活分享数据）。
- `src/shared`：通用动画与交互工具。
- `src/store`：游戏积分和成绩状态。

## 扩展机制

通过 `src/app/moduleRegistry.ts` 的 `register()` 注册新页面模块：

1. 实现 `render()`
2. 可选实现 `afterMount()`
3. 配置 `visibleInNav` 控制是否在主导航出现
4. 在 `bootstrap.ts` 中注册

## 路由与导航原则

- 主导航仅放核心信息页：`docs/projects/life/board`。
- `playground` 为隐藏路由，仅通过彩蛋入口触发。
- `home` 作为品牌入口，不与业务页平级竞争注意力。
