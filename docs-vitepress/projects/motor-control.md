---
id: motor-control
title: FOC 电机控制研究
summary: 从可复现实验出发，逐步沉淀为可扩展电机控制库的一条进行中工程轨迹。
stack:
  - STM32
  - C/C++
  - Motor Control
  - Encoder Calibration
highlights:
  - 从现成步进电机与驱动代码建立第一条可复现实验链路
  - 用频域方法整理调参与问题定位 SOP
  - 持续优化速度波动并校准编码器
  - 向 FOC 抽象电机库、SMC 与无感控制扩展
gallery:
  - /images/projects/motor-control/cover.svg
links: []
status: published
projectStage: building
presentation: immersive
narrative: chronicle
visualPreset: motor-lab
updatedAt: 2026-07-29
currentFocus: 速度波动优化与编码器校准
---

# FOC 电机控制研究

这不是一个已经结题的展示，而是一条正在推进的电机控制工程记录。每次实验、一次校准和一个尚未解决的问题，都会留在项目轨迹里。

```milestone
date: 2026-05-12
title: 从步进电机开始建立可复现实验
status: past
media: ""
```
先使用现成步进电机、驱动器和基础代码跑通闭环。这个阶段的目标不是追求性能，而是确认电气连接、控制调用和实验记录都能稳定复现。

```milestone
date: 2026-06-03
title: 用频域方法把调参经验写成 SOP
status: past
media: ""
```
把理论学习和实际观察连接起来：记录频域判断方式、关键参数的影响，以及一次实验应当如何被复查。后续会补充频谱、推导笔记和对照结论。

```milestone
date: 2026-07-29
title: 速度波动优化与编码器校准
status: current
media: ""
```
当前正在定位低速速度波动与编码器零位、速度估算之间的耦合。这里将持续补充校准步骤、速度曲线、实验条件与尚未被证实的假设。

```question
title: 哪一类校准误差主导了低速速度波动？
state: open
```
下一轮实验需要把编码器偏置、采样周期和控制参数的影响分开观察，而不是只继续微调一个参数。

```milestone
date: Next
title: FOC 抽象电机库、SMC 与无感控制
status: future
media: ""
```
先沉淀可复用的控制接口，再向三相无刷关节电机、滑模控制和无感方案扩展。这个阶段保留为明确的前方轨道，而不是提前宣称完成。
