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
        "summary": "ESP32 + FreeRTOS Edge Gateway with MQTT/Modbus support.",
        "stack": ["ESP-IDF", "FreeRTOS", "MQTT"],
        "highlights": ["Auto Reconnect", "Offline Cache", "Remote Logging"],
        "gallery": ["/Snipaste_2026-04-01_05-22-07.png"],
        "links": [{"label": "Details", "href": "#"}]
    })
    
    create_yaml_file(projects_dir / "motor-control.yaml", {
        "id": "motor-control",
        "title": "STM32 PID Motor Controller",
        "summary": "Closed-loop motor control with online parameter tuning.",
        "stack": ["STM32 HAL", "C++", "PID"],
        "highlights": ["Dual-loop Control", "UART Tuning", "Exception Protection"],
        "gallery": ["https://images.unsplash.com/photo-1581092921461-eab10380cb2e?auto=format&fit=crop&w=1200&q=80"],
        "links": [{"label": "Details", "href": "#"}]
    })
    
    # Docs
    docs_dir = content_dir / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)
    
    create_yaml_file(docs_dir / "cpp-threading.yaml", {
        "id": "cpp-threading",
        "title": "C++ Multithreading Task Model",
        "category": "Programming",
        "tags": ["C++", "thread", "queue"],
        "level": "advanced",
        "updatedAt": "2026-03-20",
        "summary": "Build stable thread pool and task scheduling in data gateways.",
        "markdown": "## Key Points\n- Thread Pool\n- Lock-free Queue\n- Timeout Recovery"
    })
    
    create_yaml_file(docs_dir / "freertos-scheduling.yaml", {
        "id": "freertos-scheduling",
        "title": "FreeRTOS Scheduling in Practice",
        "category": "OS",
        "tags": ["FreeRTOS", "task", "priority"],
        "level": "intermediate",
        "updatedAt": "2026-03-12",
        "summary": "Task priority, message queues and interrupt collaboration.",
        "markdown": "## Practices\n- Task Split\n- Priority Inversion Avoidance\n- Tick Load Observation"
    })
    
    create_yaml_file(docs_dir / "stm32-hal-drivers.yaml", {
        "id": "stm32-hal-drivers",
        "title": "STM32 HAL Driver Templates",
        "category": "MCU & Platforms",
        "tags": ["STM32", "HAL", "driver"],
        "level": "beginner",
        "updatedAt": "2026-03-02",
        "summary": "Unified GPIO/UART/SPI driver layer and error code conventions.",
        "markdown": "## Overview\n- Driver Init\n- Error Propagation\n- Mock Testing"
    })
    
    # Life posts
    life_dir = content_dir / "life"
    life_dir.mkdir(parents=True, exist_ok=True)
    
    create_yaml_file(life_dir / "mountain-weekend.yaml", {
        "id": "mountain-weekend",
        "title": "Weekend Mountain Hike & Photography",
        "date": "2026-03-16",
        "tag": "Outdoor",
        "summary": "Shot some ridge backlighting on the hike, documented a time-lapse workflow.",
        "cover": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
    })
    
    create_yaml_file(life_dir / "desk-upgrade.yaml", {
        "id": "desk-upgrade",
        "title": "Workstation Upgrade Log",
        "date": "2026-02-27",
        "tag": "Life",
        "summary": "Organized new soldering station & oscilloscope layout, efficiency improved.",
        "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80"
    })
    
    create_yaml_file(life_dir / "street-light.yaml", {
        "id": "street-light",
        "title": "Night Street Photography Practice",
        "date": "2026-02-01",
        "tag": "Photography",
        "summary": "Tried handheld long exposure and dynamic composition in low light, surprisingly good.",
        "cover": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
    })
    
    print("\nAll sample content files created!")


if __name__ == "__main__":
    main()
