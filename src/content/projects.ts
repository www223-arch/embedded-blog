import { projectSchema, type ProjectItem } from "./schema";

const projectsRaw = [
  {
    id: "edge-gateway",
    title: "Industrial Edge Gateway",
    summary: "ESP32 + FreeRTOS based industrial edge gateway with MQTT/Modbus support, featuring auto-reconnect, offline cache, and remote logging.",
    stack: ["ESP-IDF", "FreeRTOS", "MQTT", "Modbus"],
    highlights: ["Smart auto-reconnect mechanism for network stability", "Local data cache, no data loss on power failure", "Remote logging service for easy debugging", "Modbus RTU/TCP dual protocol support", "Low power design for industrial fields"],
    gallery: ["/Snipaste_2026-04-01_05-22-07.png"],
    links: [{ label: "View Details", href: "#" }],
    markdown: "# Industrial Edge Gateway\n\n## 项目概述\n\nESP32 + FreeRTOS based industrial edge gateway with MQTT/Modbus support, featuring auto-reconnect, offline cache, and remote logging.\n\n## 技术栈\n\n- ESP-IDF\n- FreeRTOS\n- MQTT\n- Modbus\n\n## 项目亮点\n\n- Smart auto-reconnect mechanism for network stability\n- Local data cache, no data loss on power failure\n- Remote logging service for easy debugging\n- Modbus RTU/TCP dual protocol support\n- Low power design for industrial fields\n\n## 项目截图\n\n![项目截图](/Snipaste_2026-04-01_05-22-07.png)\n"
  },
  {
    id: "motor-control",
    title: "STM32 PID Motor Controller",
    summary: "High-performance closed-loop motor control system based on STM32 HAL library, supporting online parameter tuning and real-time monitoring.",
    stack: ["STM32 HAL", "C++", "PID", "CAN Bus"],
    highlights: ["Speed/position dual-loop PID control", "UART real-time parameter adjustment", "Over-current/over-temperature protection", "CAN bus multi-machine communication", "Graphical debugging interface"],
    gallery: ["/iss064e041512~orig.jpg"],
    links: [{ label: "Technical Docs", href: "#" }],
    markdown: "# STM32 PID Motor Controller\n\n## 项目概述\n\nHigh-performance closed-loop motor control system based on STM32 HAL library, supporting online parameter tuning and real-time monitoring.\n\n## 技术栈\n\n- STM32 HAL\n- C++\n- PID\n- CAN Bus\n\n## 项目亮点\n\n- Speed/position dual-loop PID control\n- UART real-time parameter adjustment\n- Over-current/over-temperature protection\n- CAN bus multi-machine communication\n- Graphical debugging interface\n"
  },
] as const;

export const projectItems: ProjectItem[] = projectsRaw.map((item) => projectSchema.parse(item));
