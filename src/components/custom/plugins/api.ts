import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { encryptRequest } from 'hejunjie-encrypted-request'

// ============================
// 配置区（根据项目修改）
// ============================

// 接口基础地址
const BASE_URL = 'https://tools.api.hejunjie.life/blog'

// '/china-division/send'
// '/china-division/upload'
// '/mobile-locator/send'
// '/mobile-locator/upload'
// '/address-parser/send'
// '/address-parser/upload'

let cachedPublicKey: string
export async function loadPublicKey() {
  if (cachedPublicKey) return cachedPublicKey
  const res = await fetch('/public_key.pem')
  if (!res.ok) throw new Error('Failed to load public key')
  const key = await res.text()
  cachedPublicKey = key
  return key
}

// ============================
// 网络请求方法
// ============================
/**
 * 通用请求方法
 * @param endpoint 接口路径（例如 '/user/login'）
 * @param data 请求参数（会自动加密）
 * @returns Promise<any> 后端返回的结果
 */
export async function request<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
  try {
    const encryptedData = encryptRequest(data, {
      rsaPubKey: await loadPublicKey()
    })
    const response = await axios.post(`${BASE_URL}${endpoint}`, encryptedData, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data as T
  } catch (error: unknown) {
    console.error('请求出错:', error)
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error
    }
    throw error
  }
}

/**
 * 上传文件方法
 * @param endpoint 接口路径，例如 '/upload'
 * @param data 普通参数对象，会自动加密
 * @param fileField 文件字段名，对应后台接收字段
 * @param file 文件对象（Blob / File）
 * @param config axios 额外配置
 * @returns 后端返回的数据
 */
export async function uploadFile<T>(
  endpoint: string,
  data: Record<string, unknown>,
  fileField: string,
  file: File | Blob,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const formData = new FormData()
    for (const key in data) {
      const value = data[key]
      formData.append(key, value === undefined || value === null ? '' : String(value))
    }
    formData.append(fileField, file)
    const response = await axios.post<T>(`${BASE_URL}${endpoint}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    })
    return response.data
  } catch (error: unknown) {
    console.error('上传文件出错:', error)
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error
    }
    throw error
  }
}
