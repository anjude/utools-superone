<script lang="ts" setup>
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CuModuleNav, MarkdownEditor, MarkdownViewer } from '@/components'
import { useStockStore } from '@/stores/stock'
import { useStockManagement } from '@/composables/useStockManagement'
import { timestampToChineseDateTime } from '@/utils/time'
import { StockEnums } from '@/constants/enums'

const { t } = useI18n()

// 初始化 store 和 composable
const stockStore = useStockStore()
const {
  // 编辑标的弹窗状态
  showAddStockDialog,
  isEditMode,
  stockForm,
  creatingStock,
  stockFormError,
  // 编辑器状态
  editorContent,
  saving,
  canSave,
  selectedStock,
  // 编辑日志弹窗状态
  showEditLogDialog,
  editLogContent,
  updatingLog,
  editLogError,
  // 右键菜单状态
  contextMenuVisible,
  contextMenuPosition,
  contextMenuStock,
  // 工具方法
  stockTypeOptions,
  getStockTypeText,
  // 编辑标的弹窗方法
  handleOpenAddStockDialog,
  handleOpenEditStockDialogFromMenu,
  handleCloseAddStockDialog,
  handleSubmitStock,
  // 标的选择
  handleStockSelect,
  // 编辑器方法
  handleSaveLog,
  // 编辑日志弹窗方法
  handleOpenEditLogDialog,
  handleCloseEditLogDialog,
  handleUpdateLog,
  // 日志操作
  handleCopyLog,
  handleDeleteLog,
  // 右键菜单方法
  handleContextMenu,
  handleDeleteStock,
  handlePinStock,
  handleUnpinStock,
  // 刷新
  handleRefresh,
} = useStockManagement(stockStore)

// 从 store 获取状态
const stocks = computed(() => stockStore.stocks)
const loading = computed(() => stockStore.loading)
const error = computed(() => stockStore.error)
const selectedStockId = computed(() => stockStore.selectedStockId)
const logs = computed(() => stockStore.logs)
const logsLoading = computed(() => stockStore.logsLoading)
const logsError = computed(() => stockStore.logsError)

// 编辑器容器引用
const editorSectionRef = ref<HTMLElement | null>(null)

// 处理键盘快捷键
const handleEditorKeydown = (event: KeyboardEvent) => {
  // 检查是否是 Ctrl/Cmd + Enter
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    // 检查焦点是否在编辑器区域内
    const activeElement = document.activeElement
    if (editorSectionRef.value && activeElement && editorSectionRef.value.contains(activeElement)) {
      event.preventDefault()
      if (canSave.value) {
        handleSaveLog()
      }
    }
  }
}

onMounted(() => {
  stockStore.loadStocks()
  // 添加全局键盘事件监听
  document.addEventListener('keydown', handleEditorKeydown)
})

onUnmounted(() => {
  // 移除全局键盘事件监听
  document.removeEventListener('keydown', handleEditorKeydown)
})
</script>

<template>
  <div class="p-stock-list-wrap">
    <!-- 顶部：标的列表 -->
    <div class="p-stock-list-header">
      <div class="p-header-left">
        <CuModuleNav>
          <h2 class="p-page-title">投资标的</h2>
        </CuModuleNav>
      </div>
      <div class="p-header-actions">
        <el-button 
          type="primary" 
          size="small"
          @click="handleOpenAddStockDialog"
        >
          添加标的
        </el-button>
        <button 
          class="cu-button cu-button--text cu-button--small" 
          @click="handleRefresh" 
          :disabled="loading || logsLoading"
        >
          {{ loading || logsLoading ? '加载中' : '刷新' }}
        </button>
      </div>
    </div>

    <!-- 标的选择区域 -->
    <div v-if="loading && stocks.length === 0" class="p-loading">
      加载中...
    </div>

    <div v-else-if="error" class="p-error">
      <p>{{ error }}</p>
      <button 
        class="cu-button cu-button--primary cu-button--small" 
        @click="() => stockStore.loadStocks()"
      >
        重试
      </button>
    </div>

    <div v-else-if="stocks.length === 0" class="p-empty">
      暂无标的
    </div>

    <div v-else class="p-stocks-selector-wrapper">
      <div class="p-stocks-selector">
        <div 
          v-for="stock in stocks" 
          :key="stock.id" 
          class="p-stock-tag"
          :class="{ 'p-stock-tag--active': selectedStockId === stock.id }"
          @click="handleStockSelect(stock)"
          @contextmenu.prevent="handleContextMenu($event, stock)"
        >
          <span v-if="stock.top > 0" class="p-stock-tag-top-icon">🔝</span>
          <span class="p-stock-tag-name">{{ stock.name }}</span>
          <span class="p-stock-tag-code">{{ stock.code }}</span>
        </div>
      </div>
      <div class="p-stocks-selector-actions">
        <button 
          class="cu-button cu-button--primary cu-button--small"
          @click="handleSaveLog"
          :disabled="!canSave"
        >
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <!-- 中间：固定编辑器 -->
    <div ref="editorSectionRef" class="p-editor-section">
      <MarkdownEditor
        v-model="editorContent"
        :placeholder="selectedStock ? `记录到「${selectedStock.name}」...（Ctrl/Cmd + Enter 保存）` : '请先选择一个标的'"
        height="auto"
        :min-height="120"
        :max-height="300"
        :disabled="!selectedStockId"
      />
    </div>

    <!-- 底部：日志列表 -->
    <div class="p-logs-section">
      <h3 class="p-logs-title">
        {{ selectedStock ? `${selectedStock.name} 的思考记录` : '思考记录列表' }}
      </h3>
      <div v-if="logsLoading" class="p-logs-loading">加载中...</div>
      <div v-else-if="logsError" class="p-logs-error">{{ logsError }}</div>
      <div v-else-if="!selectedStockId" class="p-logs-empty">请先选择一个标的</div>
      <div v-else-if="logs.length === 0" class="p-logs-empty">暂无思考记录</div>
      <ul v-else class="p-logs-list">
        <li v-for="log in logs" :key="log.id" class="cu-card cu-card--small p-log-item">
          <MarkdownViewer :content="log.content" class="p-log-content" />
          <div class="p-log-meta">
            <span class="p-log-time">{{ timestampToChineseDateTime(log.createTime) }}</span>
            <div class="p-log-actions">
              <button 
                class="p-log-action-btn" 
                @click="handleCopyLog(log)"
                title="复制"
              >
                复制
              </button>
              <button 
                class="p-log-action-btn" 
                @click="handleOpenEditLogDialog(log)"
                title="编辑"
              >
                编辑
              </button>
              <button 
                class="p-log-action-btn p-log-action-btn--danger" 
                @click="handleDeleteLog(log)"
                title="删除"
              >
                删除
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- 添加/编辑标的弹窗 -->
    <el-dialog
      v-model="showAddStockDialog"
      :title="isEditMode ? '编辑标的' : '添加标的'"
      width="600px"
      @close="handleCloseAddStockDialog"
    >
      <el-form :model="stockForm" label-width="80px">
        <el-form-item label="标的名称" required>
          <el-input
            v-model="stockForm.name"
            placeholder="请输入标的名称"
            :maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标的代码" required>
          <el-input
            v-model="stockForm.code"
            placeholder="请输入标的代码"
            :maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标的类型" required>
          <el-select
            v-model="stockForm.type"
            placeholder="请选择标的类型"
            style="width: 100%"
          >
            <el-option
              v-for="option in stockTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="当前价格">
          <el-input-number
            v-model="stockForm.currentPrice"
            placeholder="请输入当前价格（可选）"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="关注价格">
          <el-input-number
            v-model="stockForm.watchPrice"
            placeholder="请输入关注价格（可选）"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="市盈率(PE)">
          <el-input-number
            v-model="stockForm.pe"
            placeholder="请输入市盈率（可选）"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="市净率(PB)">
          <el-input-number
            v-model="stockForm.pb"
            placeholder="请输入市净率（可选）"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="股息率(%)">
          <el-input-number
            v-model="stockForm.dividendYield"
            placeholder="请输入股息率（可选）"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-if="stockFormError">
          <el-alert
            :title="stockFormError"
            type="error"
            :closable="false"
            show-icon
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseAddStockDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleSubmitStock"
            :loading="creatingStock"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑日志弹窗 -->
    <el-dialog
      v-model="showEditLogDialog"
      title="编辑思考记录"
      width="600px"
      @close="handleCloseEditLogDialog"
    >
      <el-form :model="{ content: editLogContent }" label-width="80px">
        <el-form-item label="记录内容" required>
          <MarkdownEditor
            v-model="editLogContent"
            placeholder="请输入思考记录内容（支持 Markdown 格式）"
            :height="200"
          />
        </el-form-item>
        <el-form-item v-if="editLogError">
          <el-alert
            :title="editLogError"
            type="error"
            :closable="false"
            show-icon
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseEditLogDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleUpdateLog"
            :loading="updatingLog"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="p-context-menu"
      :style="{ left: `${contextMenuPosition.x}px`, top: `${contextMenuPosition.y}px` }"
      @click.stop
    >
      <div 
        v-if="contextMenuStock && contextMenuStock.top > 0"
        class="p-context-menu-item" 
        @click="handleUnpinStock"
      >
        <span>取消置顶</span>
      </div>
      <div 
        v-else
        class="p-context-menu-item" 
        @click="handlePinStock"
      >
        <span>置顶</span>
      </div>
      <div 
        v-if="contextMenuStock"
        class="p-context-menu-item" 
        @click="handleOpenEditStockDialogFromMenu"
      >
        <span>编辑</span>
      </div>
      <div class="p-context-menu-item p-context-menu-item--danger" @click="handleDeleteStock">
        <span>删除</span>
      </div>
    </div>
  </div>
</template>

