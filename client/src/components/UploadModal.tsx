import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Image as ImageIcon, Check } from 'lucide-react'
import { useGalleryStore } from '../store/galleryStore'
import { api } from '../utils/api'

interface UploadModalProps {
  onClose: () => void
  onSuccess: () => void
}

const UploadModal = ({ onClose, onSuccess }: UploadModalProps) => {
  const { categories } = useGalleryStore()
  const [models, setModels] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    prompt: '',
    negativePrompt: '',
    model: '',
    category: categories[0] || '未分类',
    tags: '',
    isPrivate: false,
    enableAutoTag: false,
    enableReversePrompt: false,
    reversePromptText: ''
  })

  // 加载模型列表
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch('/api/models')
        const data = await response.json()
        setModels(data.models || [])
        // 如果有模型且当前未选择，设置第一个为默认值
        if (data.models?.length > 0 && !formData.model) {
          setFormData(prev => ({ ...prev, model: data.models[0] }))
        }
      } catch (error) {
        console.error('加载模型列表失败:', error)
      }
    }
    loadModels()
  }, [])

  // 当分类列表更新时，更新默认分类
  useEffect(() => {
    console.log('UploadModal - categories updated:', categories)
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: categories[0] }))
    }
  }, [categories])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles)
      // 为每个文件创建预览
      const newPreviews: string[] = []
      selectedFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          newPreviews.push(reader.result as string)
          if (newPreviews.length === selectedFiles.length) {
            setPreviews(newPreviews)
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles)
      // 为每个文件创建预览
      const newPreviews: string[] = []
      droppedFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          newPreviews.push(reader.result as string)
          if (newPreviews.length === droppedFiles.length) {
            setPreviews(newPreviews)
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      // 添加所有图片文件
      files.forEach(file => {
        uploadFormData.append('images', file)
      })
      uploadFormData.append('prompt', formData.prompt)
      uploadFormData.append('negativePrompt', formData.negativePrompt)
      uploadFormData.append('model', formData.model)
      uploadFormData.append('category', formData.category)
      uploadFormData.append('tags', formData.tags)
      uploadFormData.append('isPrivate', formData.isPrivate.toString())
      uploadFormData.append('enableAutoTag', formData.enableAutoTag.toString())
      uploadFormData.append('enableReversePrompt', formData.enableReversePrompt.toString())
      uploadFormData.append('reversePromptText', formData.reversePromptText)

      const result = await api.uploadImage(uploadFormData)

      if (result.success) {
        // 如果提取到了元数据，显示给用户
        if (result.metadata) {
          setExtractedData(result.metadata)
          // 自动填充提取的数据
          setFormData(prev => ({
            ...prev,
            prompt: result.metadata.prompt || prev.prompt,
            negativePrompt: result.metadata.negativePrompt || prev.negativePrompt,
            model: result.metadata.model || prev.model
          }))
        }
        
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1000)
      }
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">上传作品</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              图片文件 {files.length > 0 && `(${files.length} 张)`}
            </label>
            {previews.length === 0 ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center cursor-pointer hover:border-primary-500 transition-colors"
              >
                <ImageIcon size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-2">拖拽图片到这里或点击选择</p>
                <p className="text-sm text-gray-600">支持多张图片上传 (JPG, PNG, WebP)</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden group">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover" />
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            const newFiles = files.filter((_, i) => i !== index)
                            const newPreviews = previews.filter((_, i) => i !== index)
                            setFiles(newFiles)
                            setPreviews(newPreviews)
                            if (newFiles.length === 0) {
                              setExtractedData(null)
                            }
                          }}
                          className="p-1 bg-red-500 hover:bg-red-600 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black/50 px-2 py-0.5 rounded text-xs">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setFiles([])
                    setPreviews([])
                    setExtractedData(null)
                  }}
                  className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  清空所有图片
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {extractedData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
              >
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Check size={18} />
                  <span className="font-medium">已提取元数据</span>
                </div>
                <p className="text-sm text-gray-400">
                  系统已从图片中自动提取AI生成参数
                </p>
              </motion.div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">提示词 (Prompt)</label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                placeholder="正向提示词..."
                rows={4}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">负向提示词 (Negative Prompt)</label>
              <textarea
                value={formData.negativePrompt}
                onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
                placeholder="负向提示词..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">模型</label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary-500"
              >
                {models.length === 0 && (
                  <option value="">请选择模型</option>
                )}
                {models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              {models.length === 0 && (
                <p className="text-xs text-yellow-500 mt-1">
                  ⚠️ 模型列表为空，请在设置中添加模型
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">分类</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary-500"
              >
                {categories.length === 0 && (
                  <option value="未分类">未分类</option>
                )}
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-yellow-500 mt-1">
                  ⚠️ 分类列表为空，请在设置中添加分类
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">标签 (用逗号分隔)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="例如: 人物, 写实, 女性"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="w-4 h-4 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm">标记为私密（需要密码访问）</span>
              </label>
            </div>

            {/* AI功能选项 */}
            <div className="border-t border-gray-800 pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-400">AI 辅助功能</h3>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableAutoTag}
                  onChange={(e) => setFormData({ ...formData, enableAutoTag: e.target.checked })}
                  className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm">🏷️ AI自动打标签</span>
              </label>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={formData.enableReversePrompt}
                    onChange={(e) => setFormData({ ...formData, enableReversePrompt: e.target.checked })}
                    className="w-4 h-4 text-purple-500 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm">🔮 AI反推提示词（当提示词为空时）</span>
                </label>
                
                {formData.enableReversePrompt && (
                  <textarea
                    value={formData.reversePromptText}
                    onChange={(e) => setFormData({ ...formData, reversePromptText: e.target.value })}
                    placeholder="自定义反推提示词（可选）&#10;留空使用默认: 请详细分析这张AI生成的图片，反推出可能的生成提示词..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  />
                )}
              </div>

              <p className="text-xs text-gray-500">
                💡 提示: 需要在设置页面启用并配置AI功能
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {uploading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                上传中...
              </>
            ) : (
              <>
                <Upload size={18} />
                上传
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default UploadModal
