/**
 * 恢复历史版本
 * @param {number} fileId - 文件ID
 * @param {number} version - 目标版本号
 * @param {number} historyId - 历史记录ID
 * @returns {Promise}
 */
export const rollback = (fileId, version, historyId) => {
  console.log('回滚参数:', { fileId, version, historyId }) // 添加日志检查参数
  
  return request({
    url: `/api/annotations/${fileId}/rollback/`,
    method: 'post',
    data: JSON.stringify({  // 确保数据被正确序列化
      version: version,
      historyId: historyId
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
} 