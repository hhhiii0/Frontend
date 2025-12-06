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
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getAnalyticsData } from '@/api/analytics'
const questionTrendRef = ref(null)
const responseTimeRef = ref(null)
const sessionCountRef = ref(null)
const questionTypeRef = ref(null)
const chartInstances = ref([])
const initCharts = (data) => {
  chartInstances.value.forEach(chart => chart.dispose())
  chartInstances.value = []
  if (questionTrendRef.value) {
    const questionTrendChart = echarts.init(questionTrendRef.value)
    chartInstances.value.push(questionTrendChart)
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
  }
  if (responseTimeRef.value) {
    const responseTimeChart = echarts.init(responseTimeRef.value)
    chartInstances.value.push(responseTimeChart)
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
  }
  if (sessionCountRef.value) {
    const sessionCountChart = echarts.init(sessionCountRef.value)
    chartInstances.value.push(sessionCountChart)
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
  }
  if (questionTypeRef.value) {
    const questionTypeChart = echarts.init(questionTypeRef.value)
    chartInstances.value.push(questionTypeChart)
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
  }
}
const handleResize = () => {
  chartInstances.value.forEach(chart => chart.resize())
}
const loadData = async () => {
  try {
    const data = await getAnalyticsData()
    await nextTick()
    const checkSize = () => {
      const container = questionTrendRef.value
      return container && container.clientWidth > 0 && container.clientHeight > 0
    }
    if (!checkSize()) {
      setTimeout(() => {
        nextTick().then(() => initCharts(data))
      }, 100)
    } else {
      initCharts(data)
    }
  } catch (error) {
    console.error('加载分析数据失败:', error)
  }
}
onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.value.forEach(chart => chart.dispose())
  chartInstances.value = []
})
</script>
<style scoped>
.analytics-container {
  padding: 20px;
  min-height: calc(100vh - 40px);
  box-sizing: border-box;
  background-color: #f8f9fa;
}
.page-title {
  margin-bottom: 20px;
  background-color: #fff;
}
.charts-row {
  margin-bottom: 20px;
}
/* 图表卡片添加背景图5（社交图标人物）- 淡化不影响图表 */
.chart-card {
  height: 400px;
  box-sizing: border-box;
  background-color: #fff;
  background-image: url('@/assets/5.png'); /* 社交图标人物 */
  background-size: 150px;
  background-position: right bottom -10px;
  background-repeat: no-repeat;
  background-opacity: 0.08;
}
.chart-container {
  width: 100%;
  height: calc(100% - 56px);
  padding: 10px;
  box-sizing: border-box;
  position: relative;
  z-index: 1; /* 确保图表在背景之上 */
}
.chart {
  width: 100%;
  height: 100%;
  min-width: 300px;
  min-height: 200px;
  z-index: 2; /* 确保图表在背景之上 */
}
</style>