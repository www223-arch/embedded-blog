window.PORTFOLIO_DATA = {
  projects: [
    {
      id: "motor-control",
      title: "STM32 电机控制系统",
      summary: "基于 STM32 HAL + PID 的闭环控制，支持参数在线整定。",
      cover:
        "https://images.unsplash.com/photo-1581092921461-eab10380cb2e?auto=format&fit=crop&w=1200&q=80",
      description:
        "项目面向小型伺服场景，包含编码器采样、PWM 输出、速度环与位置环控制。通过串口命令配置 PID 参数，支持实时曲线回传，便于调试。",
      highlights: [
        "C++ 封装驱动层与控制层，降低模块耦合",
        "定时器中断 + DMA 优化采样与执行时序",
        "提供故障检测策略：堵转、过流、编码器异常"
      ],
      stack: ["C++", "STM32 HAL", "PID", "定时器中断"]
    },
    {
      id: "rtos-gateway",
      title: "FreeRTOS 工业网关",
      summary: "多任务通信网关，整合 Modbus、MQTT 与本地日志模块。",
      cover:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
      description:
        "在 ESP32 平台上构建轻量工业网关，完成串口采集、边缘计算与云端上报。通过任务优先级规划与消息队列设计，保证高负载下系统稳定。",
      highlights: [
        "FreeRTOS 任务拆分与同步机制优化",
        "ESP-IDF 网络组件封装，支持断线重连",
        "本地异常日志持久化，便于现场追溯"
      ],
      stack: ["FreeRTOS", "ESP-IDF", "MQTT", "Modbus"]
    },
    {
      id: "linux-data-acq",
      title: "Linux 数据采集终端",
      summary: "Linux + C++ 多线程采集与处理框架，支持高并发数据流。",
      cover:
        "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80",
      description:
        "实现多路传感器数据接入、实时滤波、规则告警与远程上传。通过线程池与无锁队列优化吞吐，在 ARM Linux 平台满足实时性与资源平衡。",
      highlights: [
        "C++11 线程池与生产者消费者模型",
        "分层架构设计：驱动适配、数据处理、服务接口",
        "支持在线配置热更新与状态监控"
      ],
      stack: ["Linux", "C++11", "多线程", "数据结构与算法"]
    }
  ],
  techDocs: [
    {
      category: "编程语言",
      description: "面向底层与工程化开发的核心语言能力。",
      tags: ["C", "C++", "面向对象", "模板编程", "C++ 多线程"],
      docs: [
        {
          title: "C/C++ 工程规范",
          summary: "命名、模块划分、错误处理与性能边界的实践文档。",
          level: "基础核心",
          link: "#"
        },
        {
          title: "模板编程实战",
          summary: "使用模板提升驱动复用性并减少重复代码。",
          level: "进阶",
          link: "#"
        },
        {
          title: "多线程并发模型",
          summary: "线程池、锁策略与无锁队列在采集系统中的应用。",
          level: "高级",
          link: "#"
        }
      ]
    },
    {
      category: "操作系统",
      description: "从实时系统到 Linux 用户态服务的一体化开发。",
      tags: ["FreeRTOS", "Linux"],
      docs: [
        {
          title: "FreeRTOS 任务设计",
          summary: "任务拆分、优先级规划、队列通信与内存策略。",
          level: "核心",
          link: "#"
        },
        {
          title: "Linux 设备通信",
          summary: "串口、网络与守护进程架构的稳定性优化方案。",
          level: "进阶",
          link: "#"
        }
      ]
    },
    {
      category: "MCU 与平台",
      description: "多 MCU 平台开发与快速移植能力。",
      tags: ["GD32", "STM32 HAL", "ESP32", "ESP-IDF"],
      docs: [
        {
          title: "STM32 HAL 驱动框架",
          summary: "基于 HAL 的外设抽象层封装与模块化实践。",
          level: "核心",
          link: "#"
        },
        {
          title: "ESP-IDF 通信栈",
          summary: "Wi-Fi/MQTT 连接管理、重连机制与日志追踪。",
          level: "进阶",
          link: "#"
        }
      ]
    },
    {
      category: "控制原理",
      description: "控制算法设计与参数整定方法论。",
      tags: ["控制基础", "PID", "系统调参与稳定性"],
      docs: [
        {
          title: "PID 调参与抗扰设计",
          summary: "从模型认知到参数整定，提升动态响应与稳定性。",
          level: "核心",
          link: "#"
        }
      ]
    },
    {
      category: "工程能力",
      description: "软硬协同与工程交付能力。",
      tags: ["数据结构与算法", "硬件 PCB 协同开发"],
      docs: [
        {
          title: "数据结构在嵌入式中的应用",
          summary: "环形缓冲区、状态机、优先队列等典型场景实践。",
          level: "进阶",
          link: "#"
        },
        {
          title: "PCB 协同开发流程",
          summary: "接口定义、时序约束与联调 Checklist 经验沉淀。",
          level: "工程化",
          link: "#"
        }
      ]
    }
  ],
  timeline: [
    {
      type: "education",
      title: "XX 大学 · 自动化专业",
      time: "2017 - 2021",
      detail: "主修嵌入式系统、数字电路、自动控制原理。"
    },
    {
      type: "work",
      title: "XX 科技 · 嵌入式软件工程师",
      time: "2021 - 2023",
      detail: "负责 STM32/ESP32 项目开发，完成驱动、协议与上位机联调。"
    },
    {
      type: "work",
      title: "XX 智能制造 · 高级嵌入式工程师",
      time: "2023 - 至今",
      detail: "主导网关与控制器软件架构设计，推动规范化研发流程。"
    }
  ]
};
