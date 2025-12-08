// src/api/analytics.js
import axios from 'axios'

// 创建axios实例
const request = axios.create({
    baseURL: '/api',
    timeout: 5000
})

// 请求拦截器：自动添加Token
request.interceptors.request.use(
    (config) => {
        // 从本地存储获取Token（根据项目实际存储方式调整）
        const token = localStorage.getItem('token')
        // 如果Token存在，添加到请求头
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

/**
 * 获取所有脑肿瘤列表（核心信息）
 * @returns {Promise} 包含响应数据的Promise对象
 */
export const getAllTumors = () => {
    return request({
        method: 'GET',
        url: '/analytics/all'
    })
}

/**
 * 按中文名称查询脑肿瘤详情
 * @param {string} name - 脑肿瘤中文名称
 * @returns {Promise} 包含响应数据的Promise对象
 */
export const getTumorByName = (name) => {
    return request({
        method: 'GET',
        url: `/analytics/name/${name}`
    })
}

/**
 * 按英文名称查询脑肿瘤详情
 * @param {string} englishName - 脑肿瘤英文名称
 * @returns {Promise} 包含响应数据的Promise对象
 */
export const getTumorByEnglishName = (englishName) => {
    return request({
        method: 'GET',
        url: `/analytics/english-name/${englishName}`
    })
}

/**
 * 新增脑肿瘤信息
 * @param {Object} tumor - 脑肿瘤完整信息对象
 * @returns {Promise} 包含响应数据的Promise对象
 */
export const addBrainTumor = (tumor) => {
    return request({
        method: 'POST',
        url: '/analytics/add',
        data: tumor
    })
}

/**
 * 删除指定ID的脑肿瘤
 * @param {number} id - 脑肿瘤ID
 * @returns {Promise} 包含响应数据的Promise对象
 */
export const deleteBrainTumor = (id) => {
    return request({
        method: 'DELETE',
        url: `/analytics/delete/${id}`
    })
}

/**
 * 按名称模糊查询肿瘤及关联关系
 * @param {string} tumorName - 肿瘤名称
 * @returns {Promise} 包含图谱数据的Promise对象
 */
export const getTumorGraphData = (tumorName) => {
    return request({
        method: 'GET',
        url: '/graph',
        params: { tumorName }
    })
}

/**
 * 获取所有肿瘤节点基础信息
 * @returns {Promise} 包含所有节点数据的Promise对象
 */
export const getAllTumorGraphNodes = () => {
    return request({
        method: 'GET',
        url: '/graph/all-nodes'
    })
}

/**
 * 获取肿瘤间的关联关系
 * @param {string} tumorName - 肿瘤名称
 * @returns {Promise} 包含关联关系数据的Promise对象
 */
export const getRelatedTumorGraphData = (tumorName) => {
    return request({
        method: 'GET',
        url: '/graph/related',
        params: { tumorName }
    })
}

/**
 * 新增：获取所有肿瘤图谱关系（全量edges）
 * @returns {Promise} 包含全量关系数据的Promise对象
 */
export const getAllTumorGraphEdges = () => {
    return request({
        method: 'GET',
        url: '/graph/all-edges'
    })
}

export default {
    getAllTumors,
    getTumorByName,
    getTumorByEnglishName,
    addBrainTumor,
    deleteBrainTumor,
    // 新增的图谱相关方法
    getTumorGraphData,
    getAllTumorGraphNodes,
    getRelatedTumorGraphData,
    getAllTumorGraphEdges // 新增：导出该方法
}