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
            <!-- 未上传时的上传框 -->
            <div class="upload-box" v-if="!originalImageUrl">
              <el-icon class="upload-icon"><Picture /></el-icon>
              <div class="upload-text">点击或拖拽图片到此处上传</div>
              <div class="upload-hint">支持 JPG、PNG 等格式，文件大小不超过 10MB</div>
            </div>
          </el-upload>

          <!-- 图片组（原图 + 结果图 左右分布） -->
          <div v-if="originalImageUrl" class="image-group">
            <!-- 原图容器 -->
            <div class="image-item">
              <h3>原始图像</h3>
              <el-image
                  :src="originalImageUrl"
                  fit="contain"
                  class="preview-img"
                  :preview-src-list="[originalImageUrl]"
                  placeholder="图片加载中..."
              />
              <!-- 移除按钮（已修复叉号显示） -->
              <el-button
                  type="danger"
                  size="small"
                  class="remove-btn"
                  @click="resetUpload"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>

            <!-- 结果图容器 -->
            <div class="image-item">
              <h3>分析结果</h3>
              <!-- 加载状态 -->
              <el-loading
                  v-if="loading"
                  text="正在进行肿瘤检测与标注..."
                  :fullscreen="false"
                  class="loading-wrapper"
              />
              <!-- 结果图 -->
              <el-image
                  v-if="resultImageUrl && !loading"
                  :src="resultImageUrl"
                  fit="contain"
                  class="preview-img"
                  :preview-src-list="[resultImageUrl]"
                  placeholder="分析结果加载中..."
              />
              <!-- 空结果提示 -->
              <div v-if="!loading && !resultImageUrl" class="result-empty">
                <el-empty description="暂无分析结果" />
              </div>
            </div>
          </div>

          <!-- 开始分析按钮（已实现文字居中） -->
          <div v-if="originalImageUrl && !resultImageUrl" class="analyze-btn-container">
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

        <!-- 结果信息区域（居中显示在图片下方） -->
        <div v-if="tumorResult && !loading" class="result-info-wrapper">
          <el-descriptions :column="2" border class="result-info">
            <el-descriptions-item label="肿瘤检测结果">{{ tumorResult }}</el-descriptions-item>
            <el-descriptions-item label="分析时间">{{ formatTime(analysisTime) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { ElMessage, ElEmpty } from 'element-plus'
// 新增导入Close图标
import { Picture, Close } from '@element-plus/icons-vue'

// 导入与后端匹配的图片上传函数
import { uploadImage } from '@/api/upload'
import request from '@/api/request'

// 状态管理
const originalImageUrl = ref('') // 本地预览URL
const resultImageUrl = ref('')  // 分析结果图片URL
const uploadedImageUrl = ref('') // 服务器存储的图片URL
const loading = ref(false)       // 加载状态
const tumorResult = ref('')      // 分析结果文本
const analysisTime = ref(null)   // 分析时间

// 上传前验证
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

// 处理图片上传
const handleUpload = async ({ file }) => {
  try {
    const result = await uploadImage(file)
    console.log("上传接口返回完整数据：", result)

    let imageUrl = ''
    if (result && result.data && result.data.url) {
      imageUrl = result.data.url
    } else if (result && result.url) {
      imageUrl = result.url
    } else {
      throw new Error("后端返回数据格式不正确，未找到图片URL")
    }

    uploadedImageUrl.value = imageUrl
    originalImageUrl.value = URL.createObjectURL(file)
    ElMessage.success('图片上传成功！')
  } catch (error) {
    ElMessage.error('图片上传失败：' + error.message)
    console.error('上传失败详细原因：', error)
  }
}

// 重置上传状态
const resetUpload = () => {
  if (originalImageUrl.value) {
    URL.revokeObjectURL(originalImageUrl.value)
  }
  originalImageUrl.value = ''
  uploadedImageUrl.value = ''
  resultImageUrl.value = ''
  tumorResult.value = ''
  analysisTime.value = null
}

// 开始分析
const startAnalysis = async () => {
  if (!uploadedImageUrl.value) {
    ElMessage.warning('请先上传图片再进行分析！')
    return
  }

  loading.value = true
  try {
    const responseData = await request.post(
        '/analyze/brain-tumor/url',
        { imageUrl: uploadedImageUrl.value }
    )

    console.log("分析接口返回的真实结果：", responseData)

    resultImageUrl.value = responseData?.resultImageUrl || ''
    tumorResult.value = responseData?.message || responseData?.result || '分析完成'
    analysisTime.value = new Date().toISOString()

    if (!resultImageUrl.value) {
      ElMessage.info('分析已完成，但未返回结果图片')
    } else {
      ElMessage.success('分析完成！')
    }
  } catch (error) {
    resultImageUrl.value = ''
    tumorResult.value = ''
    analysisTime.value = null
    const errorMsg = error?.message || '未知错误'
    ElMessage.error(`分析失败：${errorMsg}，请检查网络或图片质量！`)
    console.error('分析失败原因：', error)
  } finally {
    loading.value = false
  }
}

// 格式化时间
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

// 组件销毁时释放内存
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

:deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.upload-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

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

/* 图片组（原图+结果图 左右分布） */
.image-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 40px;
  width: 100%;
  margin-top: 20px;
}

/* 单个图片项（统一尺寸对齐） */
.image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
  width: 100%;
  max-width: 500px;
}

.image-item h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.preview-img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 移除按钮（修复叉号显示：增加图标样式穿透） */
.remove-btn {
  position: absolute;
  top: 40px;
  right: 10px;
  width: 30px;
  height: 30px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  transition: background 0.3s ease;
  color: #ffffff;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0; /* 清除默认内边距，让叉号居中 */
}

/* 穿透scoped样式，确保图标显示 */
.remove-btn :deep(.el-icon) {
  font-size: 16px;
}

.remove-btn:hover {
  background: rgba(255, 0, 0, 0.7);
}

/* 开始分析按钮容器（居中在图片下方） */
.analyze-btn-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  width: 100%;
}

/* 开始分析按钮（已实现文字+图标居中） */
.analyze-btn {
  padding: 10px 24px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px; /* 图标与文字的间距 */
}

.loading-wrapper {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.result-empty {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

/* 结果信息区域（图片下方居中） */
.result-info-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.result-info {
  max-width: 800px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .brain-tumor-container {
    padding: 10px;
  }

  .upload-box {
    height: 250px;
  }

  .preview-img, .loading-wrapper, .result-empty {
    max-height: 300px;
    height: 300px;
  }

  .remove-btn {
    top: 35px;
  }
}
</style>