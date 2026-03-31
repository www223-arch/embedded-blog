import { projectSchema, type ProjectItem } from "./schema";

const projectsRaw = [
  {
    id: "edge-gateway",
    title: "Industrial Edge Gateway",
    summary: "ESP32 + FreeRTOS 的边缘网关，支持 MQTT/Modbus。",
    stack: ["ESP-IDF", "FreeRTOS", "MQTT"],
    highlights: ["断线重连", "离线缓存", "远程日志"],
    gallery: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
    ],
    links: [{ label: "案例详情", href: "#" }]
  },
  {
    id: "motor-control",
    title: "STM32 PID Motor Controller",
    summary: "闭环电机控制系统，支持在线参数调整。",
    stack: ["STM32 HAL", "C++", "PID"],
    highlights: ["双环控制", "串口调参", "异常保护"],
    gallery: [
      "https://images.unsplash.com/photo-1581092921461-eab10380cb2e?auto=format&fit=crop&w=1200&q=80"
    ],
    links: [{ label: "案例详情", href: "#" }]
  }
] as const;

export const projectItems: ProjectItem[] = projectsRaw.map((item) => projectSchema.parse(item));
