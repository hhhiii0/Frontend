# AI Chat Frontend

基于 Vue 3 + Vite + Element Plus 的 AI 问答前端应用。

## 技术栈

- Vue 3.4.0
- Vite 5.0.0
- Vue Router 4.2.5
- Pinia 2.1.7
- Element Plus 2.5.0
- Axios 1.6.2

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 运行开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产版本

```bash
npm run preview
```

## 功能特性

### 用户系统

- 用户注册
- 用户登录
- 个人信息管理
- 头像上传
- 密码修改

### AI对话

- 纯文字问答
- 图片+文字多模态问答
- 实时消息展示
- 会话自动保存

### 历史记录

- 会话列表查看
- 历史消息查看
- 会话删除

### 个人设置

- API密钥配置
- 模型选择

## 项目结构

```
frontend/
├── src/
│   ├── api/              # API接口
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia状态管理
│   ├── views/            # 页面组件
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── index.html
├── package.json
└── vite.config.js
```

## 注意事项

1. 确保后端服务已启动（默认 http://localhost:8080）
2. 首次使用需要注册账号
3. 使用图片问答功能前需要配置通义千问API密钥
4. 图片上传大小限制为10MB

