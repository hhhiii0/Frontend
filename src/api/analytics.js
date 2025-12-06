import request from './request'

// 获取分析数据（临时使用静态数据）
export const getAnalyticsData = () => {
    // 模拟后端返回的静态数据
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                dateRange: ['1月1日', '1月2日', '1月3日', '1月4日', '1月5日', '1月6日', '1月7日'],
                dailyQuestions: [12, 25, 18, 30, 22, 35, 40],
                responseTimes: [800, 750, 900, 650, 700, 850, 780],
                sessionCounts: [10, 22, 30, 45, 55, 70, 85],
                textQuestionCount: 120,
                imageQuestionCount: 45
            })
        }, 500) // 模拟网络延迟
    })

    // 实际后端接口（后续替换）
    // return request.get('/analytics/data')
}