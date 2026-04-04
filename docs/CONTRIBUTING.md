# 贡献指南

## 新增 feature 模块

1. 在 `src/features/<name>/` 下创建 `view.ts`
2. 若需要交互逻辑，新增 `logic.ts` 并在 `afterMount()` 调用
3. 在 `src/app/bootstrap.ts` 中调用 `register()`
4. 明确模块是否需要 `visibleInNav`
5. 复用 `src/shared/motion.ts`，避免重复造动效逻辑

## 代码约束

- 数据必须通过 `src/content/schema.ts` 校验
- Feature 不得直接依赖其他 Feature 的内部实现
- 样式保持 token 化，避免硬编码魔法值
- 彩蛋功能默认低干扰、可关闭、不可抢占主阅读路径

## 留言板接口约束

- 留言存储需走 `MessageRepository` 接口
- 默认实现是 `LocalMessageRepository`
- 后续接云端仅替换 repository，不改页面逻辑
