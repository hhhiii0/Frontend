import request from './request'

// 获取分析数据
export const getAnalyticsData = () => {
    return request.get('/analytics/data')
}