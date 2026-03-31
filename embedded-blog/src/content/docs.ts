import { docSchema, type TechDoc } from "./schema";

const docsRaw = [
  {
    id: "cpp-threading",
    title: "C++ Multithreading Task Model",
    category: "Programming",
    tags: ["C++", "thread", "queue", "mutex"],
    level: "advanced",
    updatedAt: "2026-03-20",
    summary: "Deep dive into building stable thread pool and task scheduling strategies in industrial data gateways.",
    markdown: "## Key Points\n\nThis article explains how to implement an efficient multithreading task model in C++ for industrial data collection scenarios.\n\n### 1. Thread Pool Design\n\nThread pool is the foundation of multithreaded programming. We use a fixed-size thread pool to avoid overhead from frequent thread creation/destruction.\n\n- Core thread count: determined by CPU cores\n- Task queue: lock-free queue for better performance\n- Thread synchronization: condition variables + mutex\n\n### 2. Lock-free Queue Implementation\n\nUse CAS operations for lock-free queue, excellent performance in high-concurrency scenarios.\n\n- Producer-consumer pattern\n- Memory barriers for ordering\n- Batch operations reduce atomic instruction overhead\n\n### 3. Timeout Recovery Mechanism\n\nTo prevent infinite task waiting, implement timeout recovery:\n\n- Task timeout detection\n- Automatic resource release\n- Alert notification mechanism\n\n## Best Practices\n\n1. Avoid holding locks too long in tasks\n2. Use RAII for resource management\n3. Set thread priorities reasonably\n4. Proper exception handling"
  },
  {
    id: "freertos-scheduling",
    title: "FreeRTOS Scheduling in Practice",
    category: "OS",
    tags: ["FreeRTOS", "task", "priority", "queue"],
    level: "intermediate",
    updatedAt: "2026-03-12",
    summary: "Practical experience with task priority design, message queue communication, and interrupt collaboration.",
    markdown: "## Key Practices\n\nThis article shares FreeRTOS scheduling strategies and considerations in real projects.\n\n### Task Split Principles\n\nProper task splitting is the foundation of stable system operation:\n\n- Split by functional modules\n- Consider real-time requirements\n- Avoid tight coupling between tasks\n\n### Priority Inversion Avoidance\n\nPriority inversion is a common problem in real-time systems:\n\n- Use priority inheritance protocol\n- Set task priorities reasonably\n- Reduce lock holding time\n\n### Tick Load Observation\n\nImportant means to monitor system operation:\n\n- Statistics CPU usage\n- Monitor task stack usage\n- Record task switch frequency\n\n## Debugging Tips\n\n1. Use Tracealyzer for visual analysis\n2. Add performance monitoring points\n3. Regular stress testing"
  },
  {
    id: "stm32-hal-drivers",
    title: "STM32 HAL Driver Templates",
    category: "MCU & Platforms",
    tags: ["STM32", "HAL", "driver", "GPIO", "UART"],
    level: "beginner",
    updatedAt: "2026-03-02",
    summary: "Unified GPIO/UART/SPI driver layer writing style and error code conventions for better maintainability.",
    markdown: "## Overview\n\nThis document defines standard writing style and best practices for STM32 HAL library drivers.\n\n### Driver Initialization\n\nStandard driver initialization flow:\n\n- Clock enable\n- GPIO configuration\n- Peripheral parameter setup\n- Interrupt configuration (if needed)\n\n### Error Propagation\n\nUnified error handling mechanism:\n\n- Error code definition\n- Error propagation chain\n- Recovery strategy\n\n### Mock Testing\n\nDesign for easier unit testing:\n\n- Hardware abstraction layer\n- Mock interfaces\n- Test case writing\n\n## Code Examples\n\nProvides complete GPIO, UART, SPI driver template code."
  },
] as const;

export const techDocs: TechDoc[] = docsRaw.map((item) => docSchema.parse(item));
