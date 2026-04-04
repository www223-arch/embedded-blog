# -*- coding: utf-8 -*-
#!/usr/bin/env python3

import yaml
from pathlib import Path


def create_yaml_file(path, data):
    with open(path, "w", encoding="utf-8") as f:
        yaml.dump(data, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
    print(f"Created: {path}")


def main():
    base_dir = Path(__file__).parent
    content_dir = base_dir / "content"
    
    # Projects
    projects_dir = content_dir / "projects"
    projects_dir.mkdir(parents=True, exist_ok=True)
    
    create_yaml_file(projects_dir / "edge-gateway.yaml", {
        "id": "edge-gateway",
        "title": "Industrial Edge Gateway",
        "summary": "ESP32 + FreeRTOS based industrial edge gateway with MQTT/Modbus support, featuring auto-reconnect, offline cache, and remote logging.",
        "stack": ["ESP-IDF", "FreeRTOS", "MQTT", "Modbus"],
        "highlights": [
            "Smart auto-reconnect mechanism for network stability",
            "Local data cache, no data loss on power failure",
            "Remote logging service for easy debugging",
            "Modbus RTU/TCP dual protocol support",
            "Low power design for industrial fields"
        ],
        "gallery": ["/Snipaste_2026-04-01_05-22-07.png"],
        "links": [{"label": "View Details", "href": "#"}]
    })
    
    create_yaml_file(projects_dir / "motor-control.yaml", {
        "id": "motor-control",
        "title": "STM32 PID Motor Controller",
        "summary": "High-performance closed-loop motor control system based on STM32 HAL library, supporting online parameter tuning and real-time monitoring.",
        "stack": ["STM32 HAL", "C++", "PID", "CAN Bus"],
        "highlights": [
            "Speed/position dual-loop PID control",
            "UART real-time parameter adjustment",
            "Over-current/over-temperature protection",
            "CAN bus multi-machine communication",
            "Graphical debugging interface"
        ],
        "gallery": ["https://images.unsplash.com/photo-1581092921461-eab10380cb2e?auto=format&fit=crop&w=1200&q=80"],
        "links": [{"label": "Technical Docs", "href": "#"}]
    })
    
    # Docs
    docs_dir = content_dir / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)
    
    create_yaml_file(docs_dir / "cpp-threading.yaml", {
        "id": "cpp-threading",
        "title": "C++ Multithreading Task Model",
        "category": "Programming",
        "tags": ["C++", "thread", "queue", "mutex"],
        "level": "advanced",
        "updatedAt": "2026-03-20",
        "summary": "Deep dive into building stable thread pool and task scheduling strategies in industrial data gateways.",
        "markdown": "## Key Points\n\nThis article explains how to implement an efficient multithreading task model in C++ for industrial data collection scenarios.\n\n### 1. Thread Pool Design\n\nThread pool is the foundation of multithreaded programming. We use a fixed-size thread pool to avoid overhead from frequent thread creation/destruction.\n\n- Core thread count: determined by CPU cores\n- Task queue: lock-free queue for better performance\n- Thread synchronization: condition variables + mutex\n\n### 2. Lock-free Queue Implementation\n\nUse CAS operations for lock-free queue, excellent performance in high-concurrency scenarios.\n\n- Producer-consumer pattern\n- Memory barriers for ordering\n- Batch operations reduce atomic instruction overhead\n\n### 3. Timeout Recovery Mechanism\n\nTo prevent infinite task waiting, implement timeout recovery:\n\n- Task timeout detection\n- Automatic resource release\n- Alert notification mechanism\n\n## Best Practices\n\n1. Avoid holding locks too long in tasks\n2. Use RAII for resource management\n3. Set thread priorities reasonably\n4. Proper exception handling"
    })
    
    create_yaml_file(docs_dir / "freertos-scheduling.yaml", {
        "id": "freertos-scheduling",
        "title": "FreeRTOS Scheduling in Practice",
        "category": "OS",
        "tags": ["FreeRTOS", "task", "priority", "queue"],
        "level": "intermediate",
        "updatedAt": "2026-03-12",
        "summary": "Practical experience with task priority design, message queue communication, and interrupt collaboration.",
        "markdown": "## Key Practices\n\nThis article shares FreeRTOS scheduling strategies and considerations in real projects.\n\n### Task Split Principles\n\nProper task splitting is the foundation of stable system operation:\n\n- Split by functional modules\n- Consider real-time requirements\n- Avoid tight coupling between tasks\n\n### Priority Inversion Avoidance\n\nPriority inversion is a common problem in real-time systems:\n\n- Use priority inheritance protocol\n- Set task priorities reasonably\n- Reduce lock holding time\n\n### Tick Load Observation\n\nImportant means to monitor system operation:\n\n- Statistics CPU usage\n- Monitor task stack usage\n- Record task switch frequency\n\n## Debugging Tips\n\n1. Use Tracealyzer for visual analysis\n2. Add performance monitoring points\n3. Regular stress testing"
    })
    
    create_yaml_file(docs_dir / "stm32-hal-drivers.yaml", {
        "id": "stm32-hal-drivers",
        "title": "STM32 HAL Driver Templates",
        "category": "MCU & Platforms",
        "tags": ["STM32", "HAL", "driver", "GPIO", "UART"],
        "level": "beginner",
        "updatedAt": "2026-03-02",
        "summary": "Unified GPIO/UART/SPI driver layer writing style and error code conventions for better maintainability.",
        "markdown": "## Overview\n\nThis document defines standard writing style and best practices for STM32 HAL library drivers.\n\n### Driver Initialization\n\nStandard driver initialization flow:\n\n- Clock enable\n- GPIO configuration\n- Peripheral parameter setup\n- Interrupt configuration (if needed)\n\n### Error Propagation\n\nUnified error handling mechanism:\n\n- Error code definition\n- Error propagation chain\n- Recovery strategy\n\n### Mock Testing\n\nDesign for easier unit testing:\n\n- Hardware abstraction layer\n- Mock interfaces\n- Test case writing\n\n## Code Examples\n\nProvides complete GPIO, UART, SPI driver template code."
    })
    
    # Life posts
    life_dir = content_dir / "life"
    life_dir.mkdir(parents=True, exist_ok=True)
    
    create_yaml_file(life_dir / "mountain-weekend.yaml", {
        "id": "mountain-weekend",
        "title": "Weekend Mountain Hike & Photography",
        "date": "2026-03-16",
        "tag": "Outdoor",
        "summary": "Went hiking with friends on the weekend, shot some ridge backlighting photos, and documented a complete time-lapse workflow."
    })
    
    create_yaml_file(life_dir / "desk-upgrade.yaml", {
        "id": "desk-upgrade",
        "title": "Workstation Upgrade Log",
        "date": "2026-02-27",
        "tag": "Life",
        "summary": "Reorganized the workstation, optimized the layout of soldering station, oscilloscope, and power supply - work efficiency improved significantly!"
    })
    
    create_yaml_file(life_dir / "street-light.yaml", {
        "id": "street-light",
        "title": "Night Street Photography Practice",
        "date": "2026-02-01",
        "tag": "Photography",
        "summary": "Went to the city streets at night to practice low-light photography, tried handheld long exposure and dynamic composition - results were much better than expected!"
    })
    
    print("\nAll content files updated!")


if __name__ == "__main__":
    main()
