<template>
  <div class="file-manager">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="logo">
        <div class="logo-text">
          <span class="pdf">PDF</span>
          <span class="note">Note</span>
        </div>
      </div>
      <div class="header-center">
        <el-button type="primary" @click="uploadDialogVisible = true">
          <el-icon><Upload /></el-icon>
          上传文件
        </el-button>
      </div>
      <el-dropdown @command="handleCommand" trigger="click">
        <div class="user-info">
          <el-avatar size="small">{{ username.charAt(0) }}</el-avatar>
          <span>{{ username }}</span>
          <el-icon><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 主体内容 -->
    <div class="main-content">
      <!-- 左侧文件树 -->
      <div class="file-tree">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文件..."
          prefix-icon="Search"
          clearable
        />
        <el-tree
          v-loading="loading"
          :data="fileList"
          :props="defaultProps"
          @node-click="handleNodeClick"
          :highlight-current="true"
          node-key="id"
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <el-icon><component :is="getNodeIcon(data)" /></el-icon>
              <span>{{ node.label }}</span>
            </div>
          </template>
        </el-tree>
      </div>

      <!-- 中间预览区 -->
      <div class="preview-area">
        <div class="preview-header">
          <div class="page-control">
            <el-button-group>
              <el-button 
                :disabled="currentPage === 1"
                @click="handlePageChange('prev')"
              >
                <el-icon><ArrowLeft /></el-icon>
              </el-button>
              <el-button>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</el-button>
              <el-button 
                :disabled="currentPage === totalPages"
                @click="handlePageChange('next')"
              >
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </el-button-group>
            <div class="zoom-control">
              <el-button-group>
                <el-button @click="handleZoom('out')">
                  <el-icon><ZoomOut /></el-icon>
                </el-button>
                <el-button @click="zoom = 100">{{ zoom }}%</el-button>
                <el-button @click="handleZoom('in')">
                  <el-icon><ZoomIn /></el-icon>
                </el-button>
              </el-button-group>
            </div>
          </div>
        </div>
        <div class="pdf-container" ref="pdfContainerRef">
          <div v-if="!currentFile" class="empty-state">
            请选择 PDF 文件进行预览
          </div>
          <div v-else class="pdf-wrapper">
            <vue-pdf-embed
              :source="currentFile"
              :page="currentPage"
              @loaded="handlePdfLoaded"
              @error="handlePdfError"
              :style="{
                width: '100%',
                transform: `scale(${zoom / 100})`
              }"
            />
          </div>
        </div>
      </div>

      <!-- 右侧标注区 -->
      <div class="annotation-area">
        <!-- 标签页移到顶部 -->
        <div class="tabs-header">
          <el-tabs 
            v-model="activeTab" 
            class="annotation-tabs"
            @tab-change="handleTabChange"
          >
            <el-tab-pane label="标注" name="annotation" />
            <el-tab-pane label="History" name="history" />
          </el-tabs>
        </div>

        <!-- 标签页内容区域 -->
        <div class="tabs-content">
          <!-- 标注内容 -->
          <div v-if="activeTab === 'annotation'" class="annotation-content">
            <div class="annotation-header">
              <div class="progress-info">
                <span>标注进度</span>
                <el-progress :percentage="annotationProgress" />
                <div class="save-actions">
                  <el-button type="primary" @click="saveChanges">保存修改</el-button>
                </div>
              </div>
            </div>
            
            <div class="annotation-scroll">
              <div class="json-content">
                <div class="json-header">
                  <div class="json-actions">
                    <el-button-group>
                      <el-button 
                        type="primary" 
                        link 
                        size="small"
                        @click="addField"
                      >
                        <el-icon><Plus /></el-icon>
                        添加字段
                      </el-button>
                      <el-button 
                        type="primary" 
                        link 
                        size="small"
                        @click="expandAll"
                      >
                        展开全部
                      </el-button>
                    </el-button-group>
                  </div>
                </div>
                <el-tree
                  ref="jsonTreeRef"
                  :data="jsonTreeData"
                  :props="treeProps"
                  node-key="id"
                  :expand-on-click-node="false"
                  :default-expanded-keys="expandedKeys"
                  @node-expand="handleNodeExpand"
                  @node-collapse="handleNodeCollapse"
                  @node-click="handleFieldClick"
                >
                  <template #default="{ node, data }">
                    <div class="json-node">
                      <span class="json-key">{{ data.key }}</span>
                      <span class="json-separator">: </span>
                      <span class="json-value" v-if="!data.children">
                        <el-input
                          :model-value="getDisplayValue(data.value)"
                          @update:model-value="val => data.value = val"
                          @change="val => handleInputChange(data, val)"
                          size="small"
                        >
                          <template #prefix v-if="data.type === 'string'">
                            <span class="json-quote">"</span>
                          </template>
                          <template #suffix v-if="data.type === 'string'">
                            <span class="json-quote">"</span>
                          </template>
                        </el-input>
                      </span>
                      <span v-else class="json-object">
                        {{ data.type === 'array' ? '[]' : '{ ... }' }}
                      </span>
                      
                      <div class="annotation-info" v-if="!data.children">
                        <el-tag 
                          :type="getVerificationStatus(data.path).type"
                          size="small"
                          @click="toggleVerification(data)"
                          class="verification-tag"
                        >
                          <el-icon v-if="getVerificationStatus(data.path).verified">
                            <Check />
                          </el-icon>
                          {{ getVerificationStatus(data.path).text }}
                        </el-tag>
                      </div>
                    </div>
                  </template>
                </el-tree>
              </div>
            </div>
          </div>

          <!-- History 内容 -->
          <div v-else class="history-content">
            <div class="history-timeline">
              <el-timeline v-loading="historyLoading">
                <el-timeline-item
                  v-for="item in historyList"
                  :key="item.id"
                  :type="item.type"
                  :timestamp="item.time"
                  :hollow="!item.current"
                >
                  <div class="version-item">
                    <div class="version-info">
                      <span class="version-number">版本 {{ item.version }}</span>
                      <span class="version-desc">{{ item.description }}</span>
                      <span class="version-author">修改人：{{ item.author }}</span>
                    </div>
                    <div class="version-actions">
                      <el-button 
                        type="primary" 
                        link 
                        @click="restoreVersion(item)"
                        v-if="!item.current"
                      >
                        恢复此版本
                      </el-button>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="status-bar">
      <el-icon color="#67C23A"><CircleCheck /></el-icon>
      <span>系统运行正常</span>
      <span class="status-right">正在处理: 2 个文件</span>
    </div>

    <!-- 添加上传文件弹窗 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传文件"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="upload-container">
        <el-form :model="uploadForm" label-width="80px">
          <el-form-item label="文件名" required>
            <el-input v-model="uploadForm.name" placeholder="请输入文件名" />
          </el-form-item>
          <el-form-item label="文件类型" required>
            <el-select v-model="uploadForm.file_type" style="width: 100%">
              <el-option label="简历" value="cv" />
              <el-option label="论文" value="paper" />
              <el-option label="报告" value="report" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
        </el-form>
        
        <div class="upload-section">
          <div class="upload-title">PDF 文件</div>
          <el-upload
            class="upload-area"
            action="#"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".pdf"
            :on-change="handlePdfChange"
            :on-remove="() => selectedPdfFile = null"
          >
            <template #trigger>
              <div class="upload-trigger">
                <el-icon><Document /></el-icon>
                <span>点击或拖拽上传 PDF 文件</span>
              </div>
            </template>
          </el-upload>
        </div>
        
        <div class="upload-section">
          <div class="upload-title">JSON 文件</div>
          <el-upload
            class="upload-area"
            action="#"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".json"
            :on-change="handleJsonChange"
            :on-remove="() => selectedJsonFile = null"
          >
            <template #trigger>
              <div class="upload-trigger">
                <el-icon><Document /></el-icon>
                <span>点击或拖拽上传 JSON 文件</span>
              </div>
            </template>
          </el-upload>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleUploadSubmit" 
            :disabled="!canSubmit"
          >
            确认上传
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, shallowRef } from 'vue'
import { 
  Upload, 
  Document, 
  Folder, 
  Search,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  CircleCheck,
  CaretBottom,
  SwitchButton,
  Plus,
  Delete,
  InfoFilled,
  Check
} from '@element-plus/icons-vue'
import VuePdfEmbed from 'vue-pdf-embed'
import VueJsonPretty from 'vue-json-pretty'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { files, annotations as annotationsApi } from '@/api'

const username = ref(localStorage.getItem('username'))
const searchQuery = ref('')
const currentFile = ref(null)
const currentPage = ref(1)
const zoom = ref(100)
const pdfContainerRef = ref(null)

const fileList = ref([])
const loading = ref(false)

const fetchFileList = async () => {
  loading.value = true
  try {
    const data = await files.getList()
    
    // 按日期分组
    const groupedFiles = {}
    data.forEach(file => {
      // 默认使用当前日期
      let formattedDate = '未分类'
      
      try {
        if (file.uploaded_at) {  // 使用 uploaded_at 而不是 created_at
          const date = new Date(file.uploaded_at)
          // 检查日期是否有效
          if (!isNaN(date.getTime())) {
            formattedDate = date.toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\//g, '-')
          }
        }
      } catch (error) {
        console.error('日期格式化错误:', error)
      }
      
      if (!groupedFiles[formattedDate]) {
        groupedFiles[formattedDate] = []
      }
      groupedFiles[formattedDate].push(file)
    })
    
    // 转换为树形结构，并按日期倒序排序
    fileList.value = Object.entries(groupedFiles)
      .sort((a, b) => {
        if (a[0] === '未分类') return 1
        if (b[0] === '未分类') return -1
        return new Date(b[0]) - new Date(a[0])
      })
      .map(([date, files]) => ({
        id: `date-${date}`,
        label: date,
        type: 'date',
        children: files.map(file => ({
          id: file.id,
          label: file.name,
          type: 'folder',
          children: [
            { 
              id: `${file.id}-pdf`,
              label: `${file.name}.pdf`,
              type: 'pdf',
              pdfUrl: file.pdf_file,
              pageCount: file.page_count
            },
            { 
              id: `${file.id}-json`,
              label: `${file.name}.json`,
              type: 'json',
              jsonUrl: file.json_file
            }
          ]
        }))
      }))
  } catch (error) {
    console.error('获取文件列表失败:', error)
    ElMessage.error('获取文件列表失败')
  } finally {
    loading.value = false
  }
}

// 标注数据
const annotationList = ref([])

// 将后端返回的 JSON 转换为树形结构
const convertToTreeData = (data, parentKey = '') => {
  if (!data || typeof data !== 'object') return []
  
  if (Array.isArray(data)) {
    // 处理数组
    return data.map((item, index) => {
      const currentPath = parentKey ? `${parentKey}[${index}]` : `[${index}]`
      
      if (item && typeof item === 'object') {
        // 如果数组元素是对象，递归处理
        return {
          id: currentPath,
          key: `[${index}]`,
          path: currentPath,
          type: 'object',
          children: convertToTreeData(item, currentPath)
        }
      } else {
        // 如果数组元素是基本类型，也需要支持验证
        return {
          id: currentPath,
          key: `[${index}]`,
          path: currentPath,
          type: typeof item,
          value: item,
          verified: false
        }
      }
    })
  }
  
  // 处理对象
  return Object.entries(data).map(([key, value]) => {
    const currentPath = parentKey ? `${parentKey}.${key}` : key
    const isVerified = key.endsWith(VERIFY_SUFFIX)
    const displayKey = isVerified ? getOriginalKey(key) : key
    
    if (value && typeof value === 'object') {
      return {
        id: currentPath,
        key: displayKey,
        path: currentPath,
        type: Array.isArray(value) ? 'array' : 'object',
        children: convertToTreeData(value, currentPath)
      }
    }
    
    return {
      id: currentPath,
      key: displayKey,
      path: currentPath,
      type: typeof value,
      value: value,
      verified: isVerified
    }
  })
}

// 使用 shallowRef 存储原始数据
const rawJsonData = shallowRef({})

// 获取标注数据
const fetchAnnotations = async (fileId) => {
  try {
    // 并行请求标注数据和进度
    const [annotationsData, progressData] = await Promise.all([
      annotationsApi.getList(fileId),
      files.getProgress(fileId)
    ])
    
    if (annotationsData && annotationsData.length > 0) {
      const latestAnnotation = annotationsData[0]
      annotationList.value = annotationsData
      rawJsonData.value = latestAnnotation.data
    }
    
    // 更新进度
    if (progressData) {
      annotationProgress.value = progressData.progress
      console.log('进度信息:', {
        total: progressData.total_fields,
        verified: progressData.verified_fields,
        progress: progressData.progress
      })
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取标注数据失败')
  }
}

const defaultProps = {
  children: 'children',
  label: 'label'
}

const router = useRouter()

const currentFileId = ref(null)
const versionHistory = ref([])

const fetchHistory = async (fileId) => {
  if (!fileId) return
  
  historyLoading.value = true
  try {
    const data = await files.getHistory(fileId)
    historyList.value = data.map(item => ({
      id: item.id,
      version: item.version,
      type: item.change_type === 'create' ? 'success' : 'primary',
      description: item.change_description,
      time: new Date(item.modified_at).toLocaleString(),
      author: item.modified_by_name,
      current: item.version === data[0].version // 最新版本标记为当前版本
    }))
  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败')
  } finally {
    historyLoading.value = false
  }
}

const handleNodeClick = async (data) => {
  if (data.type === 'pdf') {
    const fileId = data.id.split('-')[0]
    currentFileId.value = fileId
    try {
      const info = await files.getPdfInfo(fileId)
      const pdfUrl = new URL(info.pdf_url)
      currentFile.value = import.meta.env.PROD 
        ? info.pdf_url  // 生产环境使用完整 URL
        : `${pdfUrl.pathname}${pdfUrl.search}`  // 开发环境使用相对路径
      
      totalPages.value = info.total_pages
      currentPage.value = 1
      
      // 只获取标注数据和历史记录
      await Promise.all([
        fetchAnnotations(fileId),  // 这里会同时获取标注数据和进度
        fetchHistory(fileId)
      ])
    } catch (error) {
      ElMessage.error('加载 PDF 文件失败')
      console.error('PDF 加载错误:', error)
    }
  }
}

const handleUploadSuccess = (response) => {
  // TODO: 处理上传成功
}

const handleUploadError = (error) => {
  // TODO: 处理上传失败
}

const handleJsonClick = (field) => {
  // TODO: 处理 JSON 字段点击
}

const uploadDialogVisible = ref(false)
const activeTab = ref('annotation')
const selectedPdfFile = ref(null)
const selectedJsonFile = ref(null)
const uploadForm = reactive({
  name: '',
  file_type: 'cv'
})

const canSubmit = computed(() => {
  return uploadForm.name && selectedPdfFile.value && selectedJsonFile.value
})

const handlePdfChange = (file) => {
  selectedPdfFile.value = file.raw
}

const handleJsonChange = (file) => {
  selectedJsonFile.value = file.raw
}

const handleUploadSubmit = async () => {
  if (!canSubmit.value) return
  
  const formData = new FormData()
  formData.append('name', uploadForm.name)
  formData.append('file_type', uploadForm.file_type)
  formData.append('pdf_file', selectedPdfFile.value)
  formData.append('json_file', selectedJsonFile.value)
  
  try {
    await files.upload(formData)
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    uploadForm.name = ''
    uploadForm.file_type = 'cv'
    selectedPdfFile.value = null
    selectedJsonFile.value = null
    fetchFileList()
  } catch (error) {
    ElMessage.error('上传失败')
  }
}

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    router.push('/login')
  }
}

const jsonTreeRef = ref(null)
const expandedKeys = ref([])

// 计算属性：转换为树形结构
const jsonTreeData = computed(() => {
  return convertToTreeData(rawJsonData.value)
})

const expandAll = () => {
  // 获取所有可展开节点的 id
  const allKeys = []
  const collectKeys = (data) => {
    data.forEach(item => {
      if (item.type === 'object') {
        allKeys.push(item.id)
        if (item.children) {
          collectKeys(item.children)
        }
      }
    })
  }
  collectKeys(jsonTreeData.value)
  expandedKeys.value = allKeys
}

const startEdit = (data) => {
  data.editable = true
  nextTick(() => {
    editInputRef.value?.focus()
  })
}

const finishEdit = (data) => {
  data.editable = false
  // TODO: 更新 JSON 数据
}

const addField = async () => {
  if (!currentFileId.value) return
  
  try {
    const response = await annotationsApi.add({
      file: currentFileId.value,
      field_path: 'newField',
      json_content: ''
    })
    
    await fetchAnnotations(currentFileId.value)
    ElMessage.success('添加成功')
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const addChild = (data) => {
  if (!data.children) {
    data.children = []
  }
  data.children.push({
    key: 'newField',
    value: '',
    type: 'string',
    editable: true,
    path: `${data.path}.newField`
  })
}

const removeField = async (node, data) => {
  if (!currentFileId.value) return
  
  try {
    await ElMessageBox.confirm('确定要删除这个字段吗？', '警告', {
      type: 'warning'
    })
    
    await annotationsApi.delete(data.id)
    await fetchAnnotations(currentFileId.value)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleValueChange = async (data) => {
  if (!currentFileId.value) return
  
  try {
    const currentAnnotation = annotationList.value[0]
    const updatedData = { ...currentAnnotation.data }
    
    // 根据路径更新值
    const paths = data.path.split('.')
    let current = updatedData
    paths.slice(0, -1).forEach(path => {
      if (!current[path]) current[path] = {}
      current = current[path]
    })
    
    const lastPath = paths[paths.length - 1]
    if (typeof current[lastPath] === 'object') {
      current[lastPath].value = data.value
    } else {
      current[lastPath] = {
        value: data.value,
        verified: false
      }
    }
    
    // 发送更新请求
    await annotationsApi.update(currentAnnotation.id, {
      data: updatedData
    })
    
    ElMessage.success('更新成功')
    await fetchAnnotations(currentFileId.value)
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const saveChanges = async () => {
  if (!currentFileId.value) return
  
  try {
    const currentAnnotation = annotationList.value[0]
    
    // 发送更新请求
    await annotationsApi.updateContent(currentAnnotation.id, {
      json_content: currentAnnotation.data
    })
    
    ElMessage.success('保存成功')
    await fetchAnnotations(currentFileId.value)
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const totalPages = ref(0)
const handlePageChange = (direction) => {
  if (direction === 'prev' && currentPage.value > 1) {
    currentPage.value--
  } else if (direction === 'next' && currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const annotationProgress = ref(0)

const restoreVersion = async (item) => {
  try {
    console.log('回滚项:', item) // 添加日志检查 item 数据
    
    // 确保传递了所有必要参数
    await annotationsApi.rollback(
      currentFileId.value,
      item.version,
      item.id  // 确保这是历史记录的 ID
    )
    
    ElMessage.success('恢复成功')
    // 刷新当前数据和历史记录
    await Promise.all([
      fetchAnnotations(currentFileId.value),
      fetchHistory(currentFileId.value)
    ])
  } catch (error) {
    console.error('恢复历史版本失败:', error)
    ElMessage.error('恢复失败')
  }
}

// 处理缩放
const handleZoom = (type) => {
  if (type === 'in' && zoom.value < 200) {
    zoom.value += 25
  } else if (type === 'out' && zoom.value > 25) {
    zoom.value -= 25
  }
}

// PDF 加载完成后的处理
const handlePdfLoaded = () => {
  if (pdfContainerRef.value) {
    const container = pdfContainerRef.value
    const pdfElement = container.querySelector('.vue-pdf-embed')
    if (pdfElement) {
      // 计算合适的缩放比例，使 PDF 填满容器宽度
      const containerWidth = container.clientWidth - 80 // 减去内边距
      const pdfWidth = pdfElement.clientWidth
      zoom.value = (containerWidth / pdfWidth) * 100
    }
  }
}

const handlePdfError = (error) => {
  console.error('PDF 加载错误:', error)
  ElMessage.error('PDF 加载失败，请检查网络连接')
}

// 处理字段点击，高亮 PDF 对应区域
const handleFieldClick = (field) => {
  const annotation = annotationList.value.find(a => a.field_path === field.path)
  if (annotation?.position) {
    currentPage.value = annotation.position.page
    // TODO: 高亮显示对应区域
  }
}

// 处理字段验证状态
const VERIFY_SUFFIX = '-comlhj'

// 判断字段是否已验证
const isFieldVerified = (key) => {
  return key.endsWith(VERIFY_SUFFIX)
}

// 获取原始字段名（去掉验证后缀）
const getOriginalKey = (key) => {
  return key.replace(VERIFY_SUFFIX, '')
}

// 获取带验证后缀的字段名
const getVerifiedKey = (key) => {
  return `${key}${VERIFY_SUFFIX}`
}

// 修改验证状态切换函数
const toggleVerification = async (data) => {
  if (!currentFileId.value) return
  
  try {
    // 保存当前展开状态
    const currentExpandedKeys = expandedKeys.value
    
    // 更新数据
    const paths = data.path.split('.')
    let current = rawJsonData.value
    
    // 处理数组路径
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i]
      if (path.includes('[') && path.includes(']')) {
        // 处理数组索引
        const arrayPath = path.substring(0, path.indexOf('['))
        const index = parseInt(path.match(/\[(\d+)\]/)[1])
        if (arrayPath) {
          current = current[arrayPath]
        }
        if (i === paths.length - 1) {
          // 如果是最后一个路径（数组元素），处理验证状态
          const value = current[index]
          const isVerified = typeof value === 'string' && value.endsWith(VERIFY_SUFFIX)
          current[index] = isVerified ? value.replace(VERIFY_SUFFIX, '') : value + VERIFY_SUFFIX
        } else {
          current = current[index]
        }
      } else {
        // 处理普通对象路径
        if (i === paths.length - 1) {
          const isVerified = isFieldVerified(path)
          const originalKey = getOriginalKey(path)
          const value = current[path]
          delete current[path]
          current[isVerified ? originalKey : getVerifiedKey(originalKey)] = value
        } else {
          if (!current[path]) current[path] = {}
          current = current[path]
        }
      }
    }
    
    // 发送验证请求
    await annotationsApi.verify(annotationList.value[0].id, {
      json_content: rawJsonData.value
    })
    
    // 更新进度
    const { progress } = await files.getProgress(currentFileId.value)
    annotationProgress.value = progress
    
    // 强制更新一次数据，但保持展开状态
    rawJsonData.value = { ...rawJsonData.value }
    await nextTick()
    expandedKeys.value = currentExpandedKeys
    
    ElMessage.success('验证状态已更新')
  } catch (error) {
    console.error('验证状态更新失败:', error)
    ElMessage.error('更新状态失败')
  }
}

// 添加展开节点的监听
const handleNodeExpand = (data) => {
  if (!expandedKeys.value.includes(data.id)) {
    expandedKeys.value.push(data.id)
  }
}

const handleNodeCollapse = (data) => {
  const index = expandedKeys.value.indexOf(data.id)
  if (index > -1) {
    expandedKeys.value.splice(index, 1)
  }
}

// 获取标注注释
const getAnnotationComment = (path) => {
  const currentAnnotation = annotationList.value[0]
  return currentAnnotation?.comment
}

// 修改 el-tree 的配置
const treeProps = {
  children: 'children',
  label: (data) => {
    if (data.type === 'array') {
      return `${data.key}: []`
    }
    if (data.type === 'object') {
      return `${data.key}: { ... }`
    }
    return data.key
  },
  isLeaf: (data) => !data.children
}

// 修改验证状态获取函数
const getVerificationStatus = (path) => {
  const currentAnnotation = annotationList.value[0]
  if (currentAnnotation) {
    const paths = path.split('.')
    const lastPath = paths[paths.length - 1]
    
    // 处理数组元素
    if (lastPath.includes('[') && lastPath.includes(']')) {
      const arrayPath = lastPath.substring(0, lastPath.indexOf('['))
      const index = parseInt(lastPath.match(/\[(\d+)\]/)[1])
      let current = currentAnnotation.data
      
      // 遍历到数组
      for (const p of arrayPath.split('.')) {
        if (!current[p]) return { type: 'warning', text: '待验证', verified: false }
        current = current[p]
      }
      
      // 检查数组元素的值
      if (Array.isArray(current) && current[index] !== undefined) {
        const value = current[index]
        // 只要值不为空且是字符串类型，就检查是否有后缀
        const isVerified = typeof value === 'string' && value.endsWith(VERIFY_SUFFIX)
        return {
          type: isVerified ? 'success' : 'warning',
          text: isVerified ? '已验证' : '待验证',
          verified: isVerified
        }
      }
    } else {
      // 处理普通字段
      const isVerified = isFieldVerified(lastPath)
      return {
        type: isVerified ? 'success' : 'warning',
        text: isVerified ? '已验证' : '待验证',
        verified: isVerified
      }
    }
  }
  return { type: 'warning', text: '待验证', verified: false }
}

// 修改显示值处理函数
const getDisplayValue = (value) => {
  if (typeof value === 'string' && value.endsWith(VERIFY_SUFFIX)) {
    return value.replace(VERIFY_SUFFIX, '')
  }
  return value
}

// 处理输入值变化
const handleInputChange = async (data, value) => {
  if (!currentFileId.value || !annotationList.value.length) return
  
  try {
    // 更新本地数据
    const paths = data.path.split('.')
    let current = rawJsonData.value
    
    // 处理数组路径
    for (let i = 0; i < paths.length - 1; i++) {
      const path = paths[i]
      if (path.includes('[') && path.includes(']')) {
        const arrayPath = path.substring(0, path.indexOf('['))
        const index = parseInt(path.match(/\[(\d+)\]/)[1])
        if (arrayPath) {
          current = current[arrayPath]
        }
        current = current[index]
      } else {
        current = current[path]
      }
    }
    
    // 更新最后一个路径的值
    const lastPath = paths[paths.length - 1]
    if (lastPath.includes('[') && lastPath.includes(']')) {
      const index = parseInt(lastPath.match(/\[(\d+)\]/)[1])
      current[index] = value
    } else {
      current[lastPath] = value
    }
    
    // 调用编辑字段接口
    await annotationsApi.editField(annotationList.value[0].id, rawJsonData.value)
    
    ElMessage.success('字段值已更新')
  } catch (error) {
    console.error('更新字段值失败:', error)
    ElMessage.error('更新失败')
  }
}

// 添加历史记录状态
const historyList = ref([])
const historyLoading = ref(false)

// 监听标签页切换
const handleTabChange = async (tab) => {
  if (tab === 'history' && currentFileId.value) {
    // 切换到 History 标签页时重新获取历史记录
    await fetchHistory(currentFileId.value)
  }
}

// 修改文件图标显示
const getNodeIcon = (data) => {
  switch (data.type) {
    case 'date':
      return Folder
    case 'folder':
      return Document
    case 'pdf':
      return Document
    case 'json':
      return Document
    default:
      return Document
  }
}

onMounted(() => {
  fetchFileList()
})
</script>

<style scoped>
.file-manager {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 56px;  /* 减小顶部高度 */
  background-color: white;
  border-bottom: 1px solid #dcdfe6;
}

.logo {
  width: 120px;
}

.logo-text {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: -1px;
}

.pdf {
  color: #409EFF;
}

.note {
  color: #303133;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.upload-btn {
  margin-right: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.main-content {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 420px;  /* 增加右侧面板宽度 */
  gap: 16px;
  padding: 16px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.file-tree {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;  /* 内容过多时可滚动 */
}

.preview-area {
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  padding: 16px;
  border-bottom: 1px solid #dcdfe6;
  background-color: white;
  z-index: 1;  /* 确保控制栏在顶部 */
}

.page-control {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.pdf-container {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background-color: #f0f2f5;
}

.pdf-wrapper {
  transform-origin: top center;
  background-color: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: 100%;  /* 确保 wrapper 占满容器宽度 */
  height: 100%;  /* 确保 wrapper 占满容器高度 */
  display: flex;
  justify-content: center;
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
}

.annotation-area {
  background: white;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs-header {
  flex-shrink: 0;
}

.tabs-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.annotation-tabs {
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0;
}

:deep(.el-tabs__content) {
  display: none;  /* 隐藏默认的内容区域 */
}

.annotation-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.annotation-header {
  flex-shrink: 0;
  background: white;
  z-index: 1;
}

.progress-info {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.save-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

/* 可滚动的内容区域 */
.annotation-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0; /* 关键：允许内容区域收缩 */
  padding: 16px 0;
}

.json-content {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
}

/* 优化滚动条样式 */
.annotation-scroll::-webkit-scrollbar {
  width: 6px;
}

.annotation-scroll::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.annotation-scroll::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

.json-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 12px;
}

.json-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  width: 100%;
}

.json-key {
  color: #881391;
  font-weight: 500;
}

.json-separator {
  color: #999;
}

.json-value {
  flex: 1;
}

.json-quote {
  color: #22a2c9;
}

.json-object {
  color: #999;
  font-style: italic;
}

.json-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.json-node:hover .json-actions {
  opacity: 1;
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 4px 0;
}

:deep(.el-input.el-input--small) {
  font-size: 13px;
}

:deep(.el-tree) {
  background: none;
}

/* 优化树节点样式 */
.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  width: 100%;
}

/* 优化上传对话框 */
.upload-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-section {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
}

/* 确保所有滚动区域的滚动条样式一致 */
:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

/* 优化标签页样式 */
:deep(.el-tabs__header) {
  margin-bottom: 16px;
}

/* 确保 PDF 预览区域不会溢出 */
:deep(.vue-pdf-embed) {
  max-width: 100%;
  height: auto !important;  /* 强制覆盖内联样式 */
  transform-origin: top center;
}

.annotation-info {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.verification-tag {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s;
}

.verification-tag:hover {
  opacity: 0.8;
}

:deep(.el-tag .el-icon) {
  margin-right: 2px;
}

.history-timeline {
  padding: 20px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.version-number {
  font-weight: 500;
}

.version-desc {
  color: #606266;
  font-size: 14px;
}

.version-actions {
  margin-left: 16px;
}

:deep(.el-timeline-item__content) {
  width: 100%;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-dropdown-menu__item i) {
  margin-right: 0;
}

:deep(.el-upload-list) {
  margin-top: 10px;
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
}

.version-author {
  color: #909399;
  font-size: 12px;
}

.ml-2 {
  margin-left: 8px;
}
</style> 