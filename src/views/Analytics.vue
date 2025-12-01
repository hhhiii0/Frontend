<template>
  <div class="analytics-container">
    <el-card class="page-title">
      <h2>问答数据分析</h2>
    </el-card>

    <el-row :gutter="20" class="charts-row">
      <!-- 每日提问次数 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>每日提问次数趋势</span>
          </template>
          <div class="chart-container">
            <div ref="questionTrendRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>

      <!-- AI响应时间 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>AI平均响应时间(ms)</span>
          </template>
          <div class="chart-container">
            <div ref="responseTimeRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 会话数量统计 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>累计会话数量</span>
          </template>
          <div class="chart-container">
            <div ref="sessionCountRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 问答类型占比 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>问答类型分布</span>
          </template>
          <div class="chart-container">
            <div ref="questionTypeRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getAnalyticsData } from '@/api/analytics' // 需新增的API

// 图表容器引用
const questionTrendRef = ref(null)
const responseTimeRef = ref(null)
const sessionCountRef = ref(null)
const questionTypeRef = ref(null)

// 初始化图表
const initCharts = (data) => {
  // 1. 每日提问次数折线图
  const questionTrendChart = echarts.init(questionTrendRef.value)
  questionTrendChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.dateRange },
    yAxis: { type: 'value' },
    series: [{
      data: data.dailyQuestions,
      type: 'line',
      smooth: true,
      areaStyle: {}
    }]
  })

  // 2. 响应时间折线图
  const responseTimeChart = echarts.init(responseTimeRef.value)
  responseTimeChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.dateRange },
    yAxis: { type: 'value' },
    series: [{
      data: data.responseTimes,
      type: 'line',
      symbol: 'circle'
    }]
  })

  // 3. 累计会话数量折线图
  const sessionCountChart = echarts.init(sessionCountRef.value)
  sessionCountChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.dateRange },
    yAxis: { type: 'value' },
    series: [{
      data: data.sessionCounts,
      type: 'line',
      step: 'end'
    }]
  })

  // 4. 问答类型饼图
  const questionTypeChart = echarts.init(questionTypeRef.value)
  questionTypeChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [{
      name: '问答类型',
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: data.textQuestionCount, name: '纯文字' },
        { value: data.imageQuestionCount, name: '图片+文字' }
      ]
    }]
  })

  // 监听窗口大小变化，重绘图表
  window.addEventListener('resize', () => {
    questionTrendChart.resize()
    responseTimeChart.resize()
    sessionCountChart.resize()
    questionTypeChart.resize()
  })
}

// 获取数据并初始化图表
const loadData = async () => {
  try {
    // 实际项目中替换为后端接口数据
    const data = await getAnalyticsData()
    // 模拟数据（测试用）
    // const data = {
    //   dateRange: ['1月1日', '1月2日', '1月3日', '1月4日', '1月5日', '1月6日', '1月7日'],
    //   dailyQuestions: [12, 25, 18, 30, 22, 35, 40],
    //   responseTimes: [800, 750, 900, 650, 700, 850, 780],
    //   sessionCounts: [10, 22, 30, 45, 55, 70, 85],
    //   textQuestionCount: 120,
    //   imageQuestionCount: 45
    // }
    await nextTick()
    initCharts(data)
  } catch (error) {
    console.error('加载分析数据失败:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.analytics-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.chart-container {
  width: 100%;
  height: calc(100% - 56px); /* 减去卡片头部高度 */
  padding: 10px;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>