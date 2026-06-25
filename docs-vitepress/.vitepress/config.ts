import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Embedded Engineer Blog',
  description: '嵌入式工程师的个人博客与技术文档',
  base: '/',
  vite: {
    publicDir: '../public'
  },
  
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '项目', link: '/projects/' },
      { text: '生活', link: '/life/' },
      { text: '文档', link: '/docs/' }
    ],
    
    sidebar: {
      '/projects/': [
        {
          text: '项目列表',
          items: [
            { text: '工业边缘网关', link: '/projects/edge-gateway' },
            { text: 'STM32 PID 电机控制器', link: '/projects/motor-control' }
          ]
        }
      ],
      '/life/': [
        {
          text: '生活记录',
          items: [
            { text: '桌面升级', link: '/life/desk-upgrade' },
            { text: '山间周末', link: '/life/mountain-weekend' },
            { text: '街灯', link: '/life/street-light' }
          ]
        }
      ],
      '/docs/': [
        {
          text: '技术文档',
          items: [
            { text: '架构概述', link: '/docs/architecture-overview' },
            { text: '内容系统与维护工作流', link: '/docs/content-workflow' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ],
    
    footer: {
      message: '基于 VitePress 构建',
      copyright: 'Copyright © 2026'
    }
  }
})
