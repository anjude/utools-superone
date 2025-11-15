# uTools SuperOne

## 环境变量配置

项目使用 Vite 环境变量来管理不同环境的 API 配置。

### 环境变量文件

项目包含以下环境变量配置文件：

- **`.env.example`** - 环境变量示例文件（可提交到 git）
- **`.env.local`** - 本地开发配置（会被 git 忽略，优先级最高）
- **`.env.development`** - 开发环境配置（运行 `npm run dev` 时加载）
- **`.env.production`** - 生产环境配置（运行 `npm run build` 时加载）

### 配置方式

#### 方式 1: 直接指定 baseURL（优先级最高）

在环境变量文件中设置 `VITE_BASE_URL`：

```bash
VITE_BASE_URL=https://api.example.com
```

#### 方式 2: 使用环境类型

在环境变量文件中设置 `VITE_ENV`，系统会自动从 `urlMap` 中选择对应的 URL：

```bash
VITE_ENV=develop
```

### 可用的环境类型

根据 `src/constants/config.ts` 中的配置：

| 环境类型 | API 地址 |
|---------|---------|
| `debug` | `http://so.proxy.beanflow.top:82` |
| `develop` | `https://api.beanflow.top:8080` |
| `trial` | `https://api.beanflow.top:8080` |
| `release` | `https://api.beanflow.top` (默认) |

### 优先级说明

1. **VITE_BASE_URL** - 如果设置，直接使用此值
2. **VITE_ENV** - 从 `urlMap` 中选择对应的 URL
3. **MODE** - 根据 Vite 的 MODE 自动判断（development → develop，其他 → release）

### 使用示例

#### 本地开发

创建 `.env.local` 文件：

```bash
# 使用开发环境
VITE_ENV=develop

# 或直接指定 URL
# VITE_BASE_URL=http://localhost:8080
```

#### 生产构建

`.env.production` 文件已配置为使用 `release` 环境。

### 注意事项

1. 环境变量必须以 `VITE_` 开头，Vite 才会暴露给客户端代码
2. 修改环境变量文件后需要**重启开发服务器**
3. `.env.local` 文件会被 git 忽略，适合存放本地配置
4. 生产环境构建时，环境变量会被编译到代码中

### 验证配置

启动应用后，控制台会输出当前使用的 baseURL 和环境信息：

```
BaseURL: https://api.beanflow.top:8080 Env: develop
```

