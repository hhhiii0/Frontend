<template>
  <div class="brain-tumor-container">
    <el-card class="analysis-card">
      <template #header>
        <span>脑肿瘤图像分析</span>
      </template>

      <div class="content-wrapper">
        <!-- 上传区域 -->
        <div class="upload-area">
          <el-upload
              :show-file-list="false"
              :before-upload="handleBeforeUpload"
              :http-request="handleUpload"
              accept="image/*"
              :disabled="loading"
          >
            <!-- 未上传时的提示 -->
            <div class="upload-box" v-if="!originalImageUrl">
              <el-icon class="upload-icon"><Picture /></el-icon>
              <div class="upload-text">点击或拖拽图片到此处上传</div>
              <div class="upload-hint">支持 JPG、PNG 等格式，文件大小不超过 10MB</div>
            </div>
          </el-upload>

          <!-- 上传后的图片预览 -->
          <div class="image-preview" v-if="originalImageUrl">
            <h3>原始图像</h3>
            <!-- 图片预览（支持放大查看） -->
            <el-image
                :src="originalImageUrl"
                fit="contain"
                class="preview-img"
                :preview-src-list="[originalImageUrl]"
                placeholder="图片加载中..."
            />
            <!-- 重新上传按钮（悬浮在图片右上角） -->
            <el-button
                type="danger"
                icon="el-icon-close"
                size="small"
                class="remove-btn"
                @click="resetUpload"
                circle
            />
            <!-- 开始分析按钮（加载时禁用） -->
            <el-button
                type="primary"
                icon="el-icon-s-data"
                class="analyze-btn"
                @click="startAnalysis"
                :loading="loading"
            >
              开始分析
            </el-button>
          </div>
        </div>

        <!-- 分析结果区域 -->
        <div class="result-area" v-if="resultImageUrl || loading || tumorResult">
          <h3>分析结果</h3>
          <!-- 加载状态（覆盖整个结果区域） -->
          <el-loading
              v-if="loading"
              text="正在进行肿瘤检测与标注..."
              :fullscreen="false"
              class="loading-wrapper"
          />

          <!-- 分析结果图片 -->
          <div v-if="resultImageUrl && !loading" class="result-image">
            <el-image
                :src="resultImageUrl"
                fit="contain"
                class="preview-img"
                :preview-src-list="[resultImageUrl]"
                placeholder="分析结果加载中..."
            />
          </div>

          <!-- 分析结果信息（肿瘤检测结果 + 分析时间） -->
          <div v-if="tumorResult && !loading" class="result-info">
            <el-descriptions column="1" border>
              <el-descriptions-item label="肿瘤检测结果">{{ tumorResult }}</el-descriptions-item>
              <el-descriptions-item label="分析时间">{{ formatTime(analysisTime) }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
// 替换为 Element Plus 实际存在的图标（Data 图标对应分析功能）
import { Picture } from '@element-plus/icons-vue'

// 导入 API 函数（确保路径正确）
import { uploadImage } from '@/api/upload'
import request from '@/api/request'

// 状态管理
const originalImageUrl = ref('') // 原始图片 URL（本地预览）
const resultImageUrl = ref('')  // 分析结果图片 URL
const uploadedImageUrl = ref('') // 服务器存储的图片 URL（用于后端分析）
const loading = ref(false)       // 加载状态
const tumorResult = ref('')      // 肿瘤分析结果文本
const analysisTime = ref(null)   // 分析完成时间

// 上传前验证（图片格式 + 大小）
const handleBeforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件（JPG/PNG 等）')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB')
    return false
  }
  return true
}

// 处理图片上传（自定义上传逻辑）
const handleUpload = async ({ file }) => {
  try {
    // 上传图片到服务器（调用后端上传接口）
    const result = await uploadImage(file)
    // 保存服务器返回的图片 URL（用于后续分析）
    uploadedImageUrl.value = result.url
    // 生成本地预览 URL（无需等待服务器返回，即时显示）
    originalImageUrl.value = URL.createObjectURL(file)
    ElMessage.success('图片上传成功！')
  } catch (error) {
    ElMessage.error('图片上传失败，请重试！')
    console.error('上传失败原因：', error)
  }
}

// 重置上传状态（释放内存 + 清空数据）
const resetUpload = () => {
  // 释放本地预览图片的内存（避免内存泄漏）
  if (originalImageUrl.value) {
    URL.revokeObjectURL(originalImageUrl.value)
  }
  // 清空所有状态
  originalImageUrl.value = ''
  uploadedImageUrl.value = ''
  resultImageUrl.value = ''
  tumorResult.value = ''
  analysisTime.value = null
}

// 开始分析（调用后端分析接口）
const startAnalysis = async () => {
  // 校验：是否已上传图片
  if (!uploadedImageUrl.value) {
    ElMessage.warning('请先上传图片再进行分析！')
    return
  }

  // 开始加载（禁用按钮 + 显示加载提示）
  loading.value = true
  try {
    // 关键修改：通过 params 传递 imageUrl（作为查询参数）
    const response = await request.post(
        '/analyze/brain-tumor',
        {}, // POST请求体为空（如果后端不需要请求体数据）
        {
          params: {
            imageUrl: uploadedImageUrl.value  // 这里是正确的参数传递方式
          }
        }
    )

    // 注意：根据后端实际返回格式调整（通常后端会用 { code, msg, data } 包装）
    const responseData = response.data.data || response.data

    // 保存分析结果
    resultImageUrl.value = responseData.annotatedImageUrl // 分析后的标注图片
    tumorResult.value = responseData.result || '检测到肿瘤区域，请结合临床诊断' // 分析文本结果
    analysisTime.value = new Date().toISOString() // 分析完成时间
    ElMessage.success('分析完成！')
  } catch (error) {
    ElMessage.error('分析失败，请检查网络或图片质量！')
    console.error('分析失败原因：', error)
  } finally {
    // 结束加载（恢复按钮状态）
    loading.value = false
  }
}

// 格式化时间（转为本地时间格式）
const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 组件销毁时，释放本地图片内存（避免内存泄漏）
onUnmounted(() => {
  if (originalImageUrl.value) {
    URL.revokeObjectURL(originalImageUrl.value)
  }
})
</script>

<style scoped>
.brain-tumor-container {
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.analysis-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 卡片内容区占满高度，支持滚动 */
:deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 上传提示框样式 */
.upload-box {
  width: 100%;
  max-width: 500px;
  height: 300px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.upload-box:hover {
  border-color: #409eff;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

/* 图片预览区域样式 */
.image-preview {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
}

/* 预览图片样式 */
.preview-img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 重新上传按钮定位（图片右上角） */
.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  transition: background 0.3s ease;
}

.remove-btn:hover {
  background: rgba(255, 0, 0, 0.7);
}

/* 开始分析按钮样式 */
.analyze-btn {
  margin-top: 10px;
  padding: 10px 24px;
  font-size: 14px;
}

/* 分析结果区域样式 */
.result-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

/* 加载状态样式 */
.loading-wrapper {
  width: 100%;
  max-width: 500px;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

/* 分析结果信息样式 */
.result-info {
  width: 100%;
  margin-top: 10px;
  border-radius: 8px;
  overflow: hidden;
}

/* 响应式调整（小屏幕适配） */
@media (max-width: 768px) {
  .brain-tumor-container {
    padding: 10px;
  }

  .upload-box {
    height: 250px;
  }

  .preview-img {
    max-height: 300px;
  }
}
</style>