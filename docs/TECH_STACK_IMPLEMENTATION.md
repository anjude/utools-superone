# 技术栈实施指南

本文档提供分阶段的技术栈实施建议，帮助项目逐步提升扩展性、开发效率、可复用性和可迁移能力。

## 快速开始（最小化方案）

### 第一步：安装核心依赖

```bash
# 状态管理
npm install pinia

# HTTP客户端
npm install axios

# 日期处理
npm install dayjs

# Vue工具库（大量实用composables）
npm install @vueuse/core
```

### 第二步：配置Pinia

创建 `src/plugins/pinia.ts`:

```typescript
import { createPinia } from 'pinia'

export const pinia = createPinia()
```

更新 `src/main.ts`:

```typescript
import { createApp } from 'vue'
import { pinia } from './plugins/pinia'
import App from './App.vue'
import './main.css'

createApp(App)
  .use(pinia)
  .mount('#app')
```

### 第三步：配置Axios

更新 `src/utils/request/index.ts`，使用axios替代现有实现。

### 第四步：使用Day.js

替换现有的时间处理工具，统一使用dayjs。

## 完整实施计划

### 阶段1：核心基础（第1周）

#### 1.1 安装核心依赖
```bash
npm install pinia axios dayjs @vueuse/core
```

#### 1.2 配置Pinia
- 创建 `src/plugins/pinia.ts`
- 在 `main.ts` 中注册
- 迁移现有stores到Pinia

#### 1.3 配置Axios
- 统一HTTP请求工具
- 配置拦截器
- 错误处理

#### 1.4 使用Day.js
- 替换时间处理工具
- 统一时间格式

### 阶段2：开发体验提升（第2-3周）

#### 2.1 代码质量工具
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-vue
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

创建配置文件：
- `.eslintrc.js`
- `.prettierrc`
- `.prettierignore`

#### 2.2 Git Hooks
```bash
npm install -D husky lint-staged
npx husky init
```

配置 `package.json`:
```json
{
  "lint-staged": {
    "*.{js,ts,vue}": ["eslint --fix", "prettier --write"]
  }
}
```

#### 2.3 自动导入
```bash
npm install -D unplugin-auto-import unplugin-vue-components
```

更新 `vite.config.ts`:
```typescript
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'pinia', '@vueuse/core'],
      dts: true
    }),
    Components({
      dts: true
    })
  ]
})
```

#### 2.4 样式预处理
```bash
npm install -D sass
```

### 阶段3：UI增强（按需，第4周+）

#### 3.1 选择UI方案

**方案A：使用Naive UI**
```bash
npm install naive-ui
```

**方案B：自建组件库 + UnoCSS**
```bash
npm install -D unocss @unocss/preset-uno @unocss/preset-icons
```

#### 3.2 表单验证（如需要）
```bash
npm install vee-validate yup
```

### 阶段4：质量保障（未来）

#### 4.1 测试框架
```bash
npm install -D vitest @vue/test-utils happy-dom
```

#### 4.2 状态持久化（如需要）
```bash
npm install pinia-plugin-persistedstate
```

## 配置文件示例

### .eslintrc.js
```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-explicit-any': 'warn'
  }
}
```

### .prettierrc
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

### vite.config.ts（完整版）
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'pinia', '@vueuse/core'],
      dts: true,
      eslintrc: {
        enabled: true
      }
    }),
    Components({
      resolvers: [NaiveUiResolver()],
      dts: true
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'pinia'],
          'ui-vendor': ['naive-ui']
        }
      }
    }
  }
})
```

## 迁移检查清单

### Pinia迁移
- [ ] 安装pinia
- [ ] 创建pinia实例
- [ ] 迁移现有stores
- [ ] 更新组件中的store使用

### Axios迁移
- [ ] 安装axios
- [ ] 更新request工具
- [ ] 配置拦截器
- [ ] 统一错误处理

### Day.js迁移
- [ ] 安装dayjs
- [ ] 替换时间处理函数
- [ ] 统一时间格式

### 开发工具
- [ ] 配置ESLint
- [ ] 配置Prettier
- [ ] 配置Husky
- [ ] 配置自动导入

## 注意事项

1. **逐步迁移**：不要一次性迁移所有内容，分阶段进行
2. **保持兼容**：迁移过程中保持现有功能正常
3. **测试验证**：每个阶段完成后进行充分测试
4. **文档更新**：及时更新相关文档和规范

## 参考资源

- [Pinia文档](https://pinia.vuejs.org/)
- [VueUse文档](https://vueuse.org/)
- [Day.js文档](https://day.js.org/)
- [Naive UI文档](https://www.naiveui.com/)
- [Vite文档](https://vitejs.dev/)

