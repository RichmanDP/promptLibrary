import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ChevronRight } from 'lucide-react'
import { useGalleryStore } from '../store/galleryStore'

const ModelSidebar = () => {
  const { images, selectedModel, setSelectedModel, isPrivateMode } = useGalleryStore()
  const [models, setModels] = useState<Array<{ name: string; count: number }>>([])

  // 统计每个模型的图片数量
  useEffect(() => {
    // 根据私密模式过滤图片
    const filteredImages = images.filter(img => {
      if (isPrivateMode) {
        return img.isPrivate === true
      } else {
        return img.isPrivate !== true
      }
    })

    const modelCount: Record<string, number> = {}
    
    filteredImages.forEach(img => {
      const model = img.model || '未知模型'
      modelCount[model] = (modelCount[model] || 0) + 1
    })

    const modelList = Object.entries(modelCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count) // 按数量降序排序

    setModels(modelList)
  }, [images, isPrivateMode])

  const totalCount = models.reduce((sum, model) => sum + model.count, 0)

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 glass rounded-2xl p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
    >
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-bold">模型走廊</h2>
      </div>

      {/* 全部模型 */}
      <button
        onClick={() => setSelectedModel('all')}
        className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-all ${
          selectedModel === 'all'
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
            : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">全部模型</span>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-75">{totalCount}</span>
            {selectedModel === 'all' && <ChevronRight size={16} />}
          </div>
        </div>
      </button>

      {/* 模型列表 */}
      <div className="space-y-1">
        {models.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            暂无模型数据
          </div>
        ) : (
          models.map((model) => (
            <button
              key={model.name}
              onClick={() => setSelectedModel(model.name)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all group ${
                selectedModel === model.name
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-800/30 hover:bg-gray-700/50 text-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1 mr-2">
                  {model.name}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      selectedModel === model.name
                        ? 'bg-white/20'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {model.count}
                  </span>
                  {selectedModel === model.name && <ChevronRight size={14} />}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* 底部提示 */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          按模型分类展示作品
        </p>
      </div>
    </motion.div>
  )
}

export default ModelSidebar
