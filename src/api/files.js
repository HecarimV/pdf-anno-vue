/**
 * 获取文件的标注历史记录
 * @param {string|number} fileId - 文件ID
 * @returns {Promise<Array>} 历史记录列表
 */
export const getHistory = (fileId) => {
  return request({
    url: `/api/files/${fileId}/history/`,
    method: 'get'
  })
} 