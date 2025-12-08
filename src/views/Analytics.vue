<template>
  <div class="brain-tumor-container">
    <el-card class="page-title">
      <h2>脑肿瘤知识图谱</h2>
    </el-card>

    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="18">
          <el-input
              v-model="searchName"
              placeholder="请输入脑肿瘤中文名称搜索（如：星形细胞瘤）"
              clearable
              @keyup.enter="searchTumor"
          ></el-input>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="searchTumor">搜索</el-button>
          <el-button style="margin-left: 10px" @click="loadAllTumors">显示全部</el-button>
          <el-button style="margin-left: 10px" @click="showAllGraph" type="success">显示完整图谱</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 图谱可视化区域 -->
    <el-card class="graph-card">
      <template #header>
        <span>知识图谱可视化</span>
      </template>
      <div class="graph-container" ref="graphContainer"></div>
    </el-card>

    <!-- 脑肿瘤列表 -->
    <el-card class="list-card">
      <template #header>
        <span>脑肿瘤类型列表</span>
        <span style="float: right; color: #999">
          共 {{ totalCount }} 条数据 | 当前搜索关键词：{{ searchName || '无' }}
        </span>
      </template>
      <el-table
          :data="paginationTumorList"
          border
          style="width: 100%"
          @row-click="handleTumorClick"
          v-loading="listLoading"
      >
        <el-table-column prop="name" label="中文名称" width="200"></el-table-column>
        <el-table-column prop="englishName" label="英文名称" width="200"></el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="showTumorDetail(scope.row)">查看详情</el-button>
            <el-button size="small" style="margin-left: 5px" @click="showTumorInGraph(scope.row.name)">
              图谱中显示
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空数据提示 -->
      <div v-if="tumorList.length === 0 && !listLoading" style="text-align: center; padding: 50px; color: #999">
        <el-empty description="暂无相关脑肿瘤数据"></el-empty>
      </div>

      <!-- 分页组件 -->
      <div class="pagination-container" style="margin-top: 20px; text-align: right" v-if="totalCount > 0">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[1, 10, 50, 100]"
            :total="totalCount"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        >
        </el-pagination>
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog
        v-model="detailVisible"
        :title="currentTumor?.name || '脑肿瘤详情'"
        width="70%"
    >
      <el-tabs v-if="currentTumor" type="border-card">
        <el-tab-pane label="基本信息">
          <el-descriptions column="1">
            <el-descriptions-item label="中文名称">{{ currentTumor.name }}</el-descriptions-item>
            <el-descriptions-item label="英文名称">{{ currentTumor.englishName }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="病理特征">
          <el-tag v-for="item in (currentTumor.pathologicalFeatures || [])" :key="item.id || item.content" style="margin: 5px">
            {{ item.content }}
          </el-tag>
          <p v-if="!(currentTumor.pathologicalFeatures && currentTumor.pathologicalFeatures.length)">暂无相关数据</p>
        </el-tab-pane>

        <el-tab-pane label="临床症状">
          <el-tag v-for="item in (currentTumor.clinicalSymptoms || [])" :key="item.id || item.content" style="margin: 5px">
            {{ item.content }}
          </el-tag>
          <p v-if="!(currentTumor.clinicalSymptoms && currentTumor.clinicalSymptoms.length)">暂无相关数据</p>
        </el-tab-pane>

        <el-tab-pane label="解剖位置">
          <el-tag v-for="item in (currentTumor.anatomicalLocations || [])" :key="item.id || item.content" style="margin: 5px">
            {{ item.content }}
          </el-tag>
          <p v-if="!(currentTumor.anatomicalLocations && currentTumor.anatomicalLocations.length)">暂无相关数据</p>
        </el-tab-pane>

        <el-tab-pane label="诊断手段">
          <el-tag v-for="item in (currentTumor.diagnosticMethods || [])" :key="item.id || item.content" style="margin: 5px">
            {{ item.content }}
          </el-tag>
          <p v-if="!(currentTumor.diagnosticMethods && currentTumor.diagnosticMethods.length)">暂无相关数据</p>
        </el-tab-pane>

        <el-tab-pane label="治疗方案">
          <el-tag v-for="item in (currentTumor.treatmentPlans || [])" :key="item.id || item.content" style="margin: 5px">
            {{ item.content }}
          </el-tag>
          <p v-if="!(currentTumor.treatmentPlans && currentTumor.treatmentPlans.length)">暂无相关数据</p>
        </el-tab-pane>

        <el-tab-pane label="风险因素">
          <el-tag v-for="item in (currentTumor.riskFactors || [])" :key="item.id || item.content" style="margin: 5px">
            {{ item.content }}
          </el-tag>
          <p v-if="!(currentTumor.riskFactors && currentTumor.riskFactors.length)">暂无相关数据</p>
        </el-tab-pane>

        <el-tab-pane label="预后指标">
          <el-tag v-for="item in (currentTumor.prognosisIndicators || [])" :key="item.id || item.content" style="margin: 5px">
            {{ item.content }}
          </el-tag>
          <p v-if="!(currentTumor.prognosisIndicators && currentTumor.prognosisIndicators.length)">暂无相关数据</p>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Network } from 'vis-network'
import {
  getAllTumors,
  getTumorByName,
  getTumorGraphData,
  getAllTumorGraphNodes,
  getRelatedTumorGraphData,
  getAllTumorGraphEdges
} from "@/api/analytics.js";

// 状态定义
const searchName = ref('')
const tumorList = ref([]) // 原始完整数据
const allTumorList = ref([]) // 备份全部肿瘤数据，用于搜索还原
const currentTumor = ref(null)
const detailVisible = ref(false)
const graphContainer = ref(null)
let network = null // vis-network实例
const listLoading = ref(false) // 列表加载状态

// 分页相关状态
const currentPage = ref(1)    // 当前页码
const pageSize = ref(1)      // 每页条数
const totalCount = ref(0)     // 总数据条数

// 计算属性：分页后的数据列表
const paginationTumorList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tumorList.value.slice(start, end)
})

// 分页事件处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // 切换页大小时重置页码为1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 【核心：字段映射配置 - 解决未知名称问题】
const mapTumorFields = (tumorData) => {
  if (!tumorData) return null

  // 打印原始数据到控制台，方便调试字段名
  console.log('📌 后端原始肿瘤数据：', tumorData)

  // 适配各种可能的后端字段名，优先级从高到低
  return {
    id: tumorData.id || tumorData.ID || '',
    // 中文名称：适配后端可能的字段名
    name:
        tumorData.name ||
        tumorData.chineseName ||
        tumorData.ChineseName ||
        tumorData.zhongwenName ||
        tumorData.title ||
        tumorData.label ||
        '未知名称',
    // 英文名称：适配后端可能的字段名
    englishName:
        tumorData.englishName ||
        tumorData.english_name ||
        tumorData.EnglishName ||
        tumorData.yingwenName ||
        '未知英文名称',
    // 其他字段原样保留
    pathologicalFeatures: tumorData.pathologicalFeatures || [],
    clinicalSymptoms: tumorData.clinicalSymptoms || [],
    anatomicalLocations: tumorData.anatomicalLocations || [],
    diagnosticMethods: tumorData.diagnosticMethods || [],
    treatmentPlans: tumorData.treatmentPlans || [],
    riskFactors: tumorData.riskFactors || [],
    prognosisIndicators: tumorData.prognosisIndicators || [],
    ...tumorData
  }
}

// 【核心：将后端数据转换为vis-network格式】
const transformToVisData = (graphData) => {
  const nodes = []
  const edges = []
  const nodeMap = new Map()

  // 定义节点颜色（匹配Neo4j）
  const labelColors = {
    'BrainTumor': '#2B7CE9',
    'AnatomicalLocation': '#4CAF50',
    'PathologicalFeature': '#E91E63',
    'ClinicalSymptom': '#FF9800',
    'DiagnosticMethod': '#9C27B0',
    'TreatmentPlan': '#03A9F4',
    'RiskFactor': '#FFC107',
    'PrognosisIndicator': '#F06292'
  }

  // 处理节点
  graphData.forEach(item => {
    // 处理source节点
    if (item.sourceId && !nodeMap.has(item.sourceId)) {
      nodeMap.set(item.sourceId, true)
      nodes.push({
        id: item.sourceId,
        label: item.sourceName || '未知',
        group: item.sourceLabel || 'Unknown',
        color: {
          border: labelColors[item.sourceLabel] || '#888',
          background: labelColors[item.sourceLabel] ? `${labelColors[item.sourceLabel]}33` : '#f0f0f0'
        },
        shape: 'box',
        font: { size: 12 }
      })
    }
    // 处理target节点
    if (item.targetId && !nodeMap.has(item.targetId)) {
      nodeMap.set(item.targetId, true)
      nodes.push({
        id: item.targetId,
        label: item.targetName || '未知',
        group: item.targetLabel || 'Unknown',
        color: {
          border: labelColors[item.targetLabel] || '#888',
          background: labelColors[item.targetLabel] ? `${labelColors[item.targetLabel]}33` : '#f0f0f0'
        },
        shape: 'box',
        font: { size: 12 }
      })
    }
  })

  // 处理边
  graphData.forEach((item, index) => {
    if (item.sourceId && item.targetId && item.sourceId !== item.targetId) {
      edges.push({
        id: `edge-${index}`,
        from: item.sourceId,
        to: item.targetId,
        label: item.relationshipType || '关联',
        font: { size: 10 },
        arrows: 'to'
      })
    }
  })

  return { nodes, edges }
}

// 【核心：初始化vis-network】
const initVisNetwork = (nodes, edges) => {
  if (network) network.destroy() // 销毁旧实例

  const data = { nodes, edges }
  const options = {
    layout: {
      hierarchical: false,
      randomSeed: 42,
      improvedLayout: true
    },
    physics: {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -50,
        centralGravity: 0.01,
        springLength: 150,
        springConstant: 0.08,
        damping: 0.4,
        avoidOverlap: 1
      },
      minVelocity: 0.75,
      maxVelocity: 50
    },
    interaction: {
      dragNodes: true,
      dragView: true,
      zoomView: true,
      selectable: true
    },
    nodes: {
      borderWidth: 2,
      shapeProperties: {
        borderRadius: 6
      },
      margin: 8
    },
    edges: {
      smooth: {
        type: 'curvedCW',
        roundness: 0.1
      },
      width: 2
    }
  }

  // 创建新实例
  if (graphContainer.value) {
    network = new Network(graphContainer.value, data, options)
    // 节点点击事件
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0]
        const node = nodes.find(n => n.id === nodeId)
        if (node.group === 'BrainTumor') {
          getTumorByName(node.label).then(response => {
            const tumorData = response?.data?.code === 200 ? response.data.data : null
            currentTumor.value = mapTumorFields(tumorData)
            detailVisible.value = !!currentTumor.value
          }).catch(() => ElMessage.error('获取详情失败'))
        }
      }
    })
  }
}

// 加载所有肿瘤数据（增加备份）
const loadAllTumors = async () => {
  listLoading.value = true
  try {
    ElMessage.info('正在加载肿瘤列表...')
    const response = await getAllTumors()
    console.log('📋 加载全部肿瘤数据响应：', response)

    // 兼容不同的返回格式
    let rawData = []
    if (response?.data?.code === 200) {
      rawData = response.data.data || []
    } else if (Array.isArray(response.data)) {
      rawData = response.data
    }

    if (!Array.isArray(rawData)) throw new Error('返回数据不是数组格式')

    // 格式化所有数据（解决未知名称问题）
    const formattedData = rawData.map(item => mapTumorFields(item))

    // 更新列表数据（主列表 + 备份）
    tumorList.value = formattedData
    allTumorList.value = [...formattedData] // 备份全部数据
    totalCount.value = tumorList.value.length

    ElMessage.success(`成功加载${tumorList.value.length}条肿瘤数据`)
  } catch (error) {
    tumorList.value = []
    allTumorList.value = []
    totalCount.value = 0
    ElMessage.error(`加载肿瘤列表失败：${error.message}`)
    console.error('❌ 列表加载失败详情：', error)
  } finally {
    listLoading.value = false
  }
}

// 【核心修复：搜索逻辑对齐 - 列表和图谱结果一致】
const searchTumor = async () => {
  const keyword = searchName.value.trim()
  if (!keyword) {
    ElMessage.warning('请输入搜索名称')
    // 如果清空搜索框，恢复显示全部数据
    tumorList.value = [...allTumorList.value]
    totalCount.value = tumorList.value.length
    currentPage.value = 1
    return
  }

  listLoading.value = true
  try {
    ElMessage.info(`正在搜索“${keyword}”相关数据...`)

    // ========== 核心修改：先查图谱数据，再同步列表 ==========
    // 1. 先加载图谱数据（能搜到结果的接口）
    const graphResponse = await getTumorGraphData(keyword)
    let graphData = []
    if (graphResponse?.data?.code === 200) {
      graphData = graphResponse.data.data || []
    } else if (Array.isArray(graphResponse.data)) {
      graphData = graphResponse.data
    }

    // 2. 从图谱数据中提取所有脑肿瘤名称（用于列表匹配）
    const tumorNamesFromGraph = new Set()
    graphData.forEach(item => {
      // 只提取BrainTumor类型的节点名称
      if (item.sourceLabel === 'BrainTumor' && item.sourceName) {
        tumorNamesFromGraph.add(item.sourceName)
      }
      if (item.targetLabel === 'BrainTumor' && item.targetName) {
        tumorNamesFromGraph.add(item.targetName)
      }
    })

    // 3. 本地模糊匹配：确保列表和图谱结果一致
    let searchResult = []
    if (tumorNamesFromGraph.size > 0) {
      // 优先匹配图谱中出现的肿瘤名称
      searchResult = allTumorList.value.filter(item =>
          tumorNamesFromGraph.has(item.name) ||
          item.name.includes(keyword) ||
          item.englishName.includes(keyword)
      )
    } else {
      // 兜底：直接本地模糊搜索
      searchResult = allTumorList.value.filter(item =>
          item.name.includes(keyword) || item.englishName.includes(keyword)
      )
    }

    // 4. 更新列表数据
    tumorList.value = searchResult
    totalCount.value = tumorList.value.length
    currentPage.value = 1 // 重置页码

    // 5. 更新图谱
    const { nodes, edges } = transformToVisData(graphData)
    initVisNetwork(nodes, edges)

    // 6. 提示结果
    if (searchResult.length > 0) {
      ElMessage.success(`搜索到“${keyword}”相关数据共 ${searchResult.length} 条`)
    } else {
      ElMessage.info(`未找到“${keyword}”相关数据`)
    }

    console.log('🔍 搜索结果汇总：', {
      keyword,
      listCount: searchResult.length,
      graphNodeCount: nodes.length,
      graphEdgeCount: edges.length,
      tumorNamesFromGraph: Array.from(tumorNamesFromGraph)
    })

  } catch (error) {
    // 兼容接口报错的情况，本地模糊搜索兜底
    console.error('❌ 搜索接口异常，使用本地模糊搜索：', error)

    const localResult = allTumorList.value.filter(item =>
        item.name.includes(keyword) || item.englishName.includes(keyword)
    )
    tumorList.value = localResult
    totalCount.value = localResult.length
    currentPage.value = 1

    // 更新图谱（空数据）
    initVisNetwork([], [])

    ElMessage.warning(`接口搜索失败，已显示本地匹配的${localResult.length}条数据`)
  } finally {
    listLoading.value = false
  }
}

// 显示完整图谱
const showAllGraph = async () => {
  try {
    ElMessage.info('加载完整图谱中...')
    const edgesResponse = await getAllTumorGraphEdges()

    let edgeData = []
    if (edgesResponse?.data?.code === 200) {
      edgeData = edgesResponse.data.data || []
    } else if (Array.isArray(edgesResponse.data)) {
      edgeData = edgesResponse.data
    }

    if (!Array.isArray(edgeData)) throw new Error('边数据格式错误')

    // 转换为vis-network格式并初始化
    const { nodes, edges } = transformToVisData(edgeData)
    initVisNetwork(nodes, edges)
    ElMessage.success('完整图谱加载成功！')
  } catch (error) {
    ElMessage.error('加载图谱失败：' + error.message)
    console.error('❌ 图谱加载失败：', error)
  }
}

// 在图谱中显示特定肿瘤
const showTumorInGraph = async (tumorName) => {
  if (!tumorName) return ElMessage.warning('请选择肿瘤名称')

  try {
    const response = await getTumorGraphData(tumorName)
    let graphData = []

    if (response?.data?.code === 200) {
      graphData = response.data.data || []
    } else if (Array.isArray(response.data)) {
      graphData = response.data
    }

    const { nodes, edges } = transformToVisData(graphData)
    initVisNetwork(nodes, edges)
    ElMessage.success(`已在图谱中显示“${tumorName}”相关数据`)
  } catch (error) {
    ElMessage.error('显示失败：' + error.message)
  }
}

// 显示详情
const showTumorDetail = (tumor) => {
  if (!tumor) return ElMessage.warning('暂无数据')
  // 格式化详情数据（解决未知名称）
  currentTumor.value = mapTumorFields(tumor)
  detailVisible.value = true
}

// 表格行点击事件
const handleTumorClick = (row) => {
  showTumorDetail(row)
}

// 页面加载时自动初始化
onMounted(async () => {
  // 1. 先加载肿瘤列表
  await loadAllTumors()

  nextTick(async () => {
    // 2. 自动加载完整图谱
    if (graphContainer.value) {
      try {
        const edgesResponse = await getAllTumorGraphEdges()

        let edgeData = []
        if (edgesResponse?.data?.code === 200) {
          edgeData = edgesResponse.data.data || []
        } else if (Array.isArray(edgesResponse.data)) {
          edgeData = edgesResponse.data
        }

        // 转换为vis-network格式并初始化图谱
        const { nodes, edges } = transformToVisData(edgeData)
        initVisNetwork(nodes, edges)
      } catch (error) {
        ElMessage.error('加载图谱失败：' + error.message)
        // 兜底：加载失败时显示空图谱
        initVisNetwork([], [])
      }
    }
  })
})

// 清理资源
onUnmounted(() => {
  if (network) network.destroy()
})
</script>

<style scoped>
.brain-tumor-container {
  padding: 20px;
  min-height: calc(100vh - 40px);
  box-sizing: border-box;
  background-color: #f8f9fa;
}
.page-title {
  margin-bottom: 20px;
  background-color: #fff;
}
.search-card {
  margin-bottom: 20px;
  padding: 15px;
}
.graph-card {
  margin-bottom: 20px;
  background-color: #fff;
}
.graph-container {
  width: 100%;
  height: calc(100vh - 350px);
  min-height: 600px;
  border: 1px solid #eee;
  background-color: #2c3e50;
}
.list-card {
  background-color: #fff;
}
.pagination-container {
  padding: 10px 0;
}
</style>