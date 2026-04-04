import { projectSchema, type ProjectItem } from "./schema";

const projectsRaw = [
  {
    id: "edge-gateway",
    title: "Industrial Edge Gateway",
    summary: "ESP32 + FreeRTOS based industrial edge gateway with MQTT/Modbus support, featuring auto-reconnect, offline cache, and remote logging.",
    stack: ["ESP-IDF", "FreeRTOS", "MQTT", "Modbus"],
    highlights: ["Smart auto-reconnect mechanism for network stability", "Local data cache, no data loss on power failure", "Remote logging service for easy debugging", "Modbus RTU/TCP dual protocol support", "Low power design for industrial fields"],
    gallery: ["/Snipaste_2026-04-01_05-22-07.png"],
    links: [{ label: "View Details", href: "#" }]
  },
  {
    id: "motor-control",
    title: "STM32 PID Motor Controller",
    summary: "High-performance closed-loop motor control system based on STM32 HAL library, supporting online parameter tuning and real-time monitoring.",
    stack: ["STM32 HAL", "C++", "PID", "CAN Bus"],
    highlights: ["Speed/position dual-loop PID control", "UART real-time parameter adjustment", "Over-current/over-temperature protection", "CAN bus multi-machine communication", "Graphical debugging interface"],
    gallery: ["/iss064e041512~orig.jpg"],
    links: [{ label: "Technical Docs", href: "#" }]
  },
] as const;

export const projectItems: ProjectItem[] = projectsRaw.map((item) => projectSchema.parse(item));
