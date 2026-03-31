import { docSchema, type TechDoc } from "./schema";

const docsRaw = [
  {
    id: "cpp-threading",
    title: "C++ 多线程任务模型",
    category: "编程语言",
    tags: ["C++", "thread", "queue"],
    level: "advanced",
    updatedAt: "2026-03-20",
    summary: "在采集网关中构建高稳定的线程池和任务调度策略。",
    markdown: "## 核心要点\n- 线程池\n- 无锁队列\n- 超时回收"
  },
  {
    id: "freertos-scheduling",
    title: "FreeRTOS 调度实战",
    category: "操作系统",
    tags: ["FreeRTOS", "task", "priority"],
    level: "intermediate",
    updatedAt: "2026-03-12",
    summary: "任务优先级、消息队列与中断协作实践。",
    markdown: "## 关键实践\n- 任务拆分\n- 优先级倒置规避\n- Tick 负载观测"
  },
  {
    id: "stm32-hal-drivers",
    title: "STM32 HAL 驱动模板",
    category: "MCU 与平台",
    tags: ["STM32", "HAL", "driver"],
    level: "beginner",
    updatedAt: "2026-03-02",
    summary: "统一 GPIO/UART/SPI 驱动层写法与错误码约定。",
    markdown: "## 内容概览\n- 驱动初始化\n- 错误传播\n- Mock 测试"
  }
] as const;

export const techDocs: TechDoc[] = docsRaw.map((item) => docSchema.parse(item));
