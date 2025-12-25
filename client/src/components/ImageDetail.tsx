import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Copy, Edit2, Trash2, Check, Download, Sparkles, Tag, ChevronLeft, ChevronRight, Plus, Upload } from 'lucide-react'
import { Image } from '../store/galleryStore'
import { useGalleryStore } from '../store/galleryStore'
import { api } from '../utils/api'
import { copyToClipboard, getThumbnailUrl, formatDate } from '../utils/helpers'

interface ImageDetailProps {
  image: Image
  onClose: () => void
  onUpdate: () => void
}

const ImageDetail = ({ image, onClose, onUpdate }: ImageDetailProps) => {
  const { isAdminMode, updateImage, deleteImage, categories } = useGalleryStore()
  const [models, setModels] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [isGeneratingTags, setIsGeneratingTags] = useState(false)
  const [isUploadingMore, setIsUploadingMore] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editForm, setEditForm] = useState({
    prompt: image.prompt,
    negativePrompt: image.negativePrompt,
    model: image.model,
    category: image.category
  })

  // 获取图片列表
  const imageList = image.images && image.images.length > 0 ? image.images : [{ path: image.path, filename: image.filename, originalName: image.originalName }]
  const hasMultipleImages = imageList.length > 1
  const currentImage = imageList[currentImageIndex]

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1))
  }

  // 加载模型列表
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch('/api/models')
        const data = await response.json()
        setModels(data.models || [])
      } catch (error) {
        console.error('加载模型列表失败:', error)
      }
    }
    loadModels()
  }, [])

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSave = async () => {
    try {
      const result = await api.updateImage(image.id, editForm)
      if (result.success) {
        updateImage(image.id, editForm)
        setIsEditing(false)
        onUpdate()
      }
    } catch (error) {
      console.error('更新失败:', error)
      alert('更新失败，请重试')
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这张图片吗？')) return

    try {
      const result = await api.deleteImage(image.id)
      if (result.success) {
        deleteImage(image.id)
        onClose()
        onUpdate()
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = getThumbnailUrl(image.path)
    link.download = image.originalName
    link.click()
  }

  // AI反推提示词
  const handleReversePrompt = async () => {
    if (!confirm('确定要使用AI分析这张图片并生成提示词吗？')) return
    
    setIsGeneratingPrompt(true)
    try {
      const response = await fetch(`/api/images/${image.id}/reverse-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()
      
      if (result.success && result.prompt) {
        // 更新编辑表单
        setEditForm(prev => ({
          ...prev,
          prompt: result.prompt
        }))
        // 自动保存
        await api.updateImage(image.id, { ...editForm, prompt: result.prompt })
        updateImage(image.id, { prompt: result.prompt })
        onUpdate()
        alert('AI反推提示词成功！')
      } else {
        alert('AI反推失败: ' + (result.error || '未知错误'))
      }
    } catch (error) {
      console.error('AI反推失败:', error)
      alert('AI反推失败，请检查网络连接和AI服务配置')
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  // AI自动打标签
  const handleAutoTag = async () => {
    if (!confirm('确定要使用AI为这张图片生成标签吗？')) return
    
    setIsGeneratingTags(true)
    try {
      const response = await fetch(`/api/images/${image.id}/retag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()
      
      if (result.success && result.tags) {
        // 更新图片数据
        updateImage(image.id, { tags: result.tags })
        onUpdate()
        alert(`AI打标签成功！生成了 ${result.tags.length} 个标签`)
      } else {
        alert('AI打标签失败: ' + (result.error || '未知错误'))
      }
    } catch (error) {
      console.error('AI打标签失败:', error)
      alert('AI打标签失败，请检查网络连接和AI服务配置')
    } finally {
      setIsGeneratingTags(false)
    }
  }

  // 补传图片
  const handleAddMoreImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingMore(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('images', file)
      })

      const result = await api.addMoreImages(image.id, formData)
      
      if (result.success) {
        alert(`成功添加 ${files.length} 张图片！`)
        onUpdate()
        // 刷新页面或重新加载数据
        window.location.reload()
      } else {
        alert('补传图片失败: ' + (result.error || '未知错误'))
      }
    } catch (error) {
      console.error('补传图片失败:', error)
      alert('补传图片失败，请重试')
    } finally {
      setIsUploadingMore(false)
      // 清空 input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Side */}
        <div className="md:w-1/2 bg-black flex items-center justify-center p-4 relative">
          <img
            src={getThumbnailUrl(currentImage.path)}
            alt={currentImage.originalName}
            className="max-w-full max-h-[80vh] object-contain"
          />
          
          {/* 多图切换按钮 */}
          {hasMultipleImages && (
            <>
              <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded text-sm">
                {currentImageIndex + 1} / {imageList.length}
              </div>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-3 rounded-full transition-colors"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-3 rounded-full transition-colors"
              >
                <ChevronRight size={32} />
              </button>
              {/* 底部缩略图导航 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/70 p-2 rounded-lg max-w-full overflow-x-auto">
                {imageList.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-primary-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={getThumbnailUrl(img.path)} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info Side */}
        <div className="md:w-1/2 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{image.originalName}</h2>
              <p className="text-sm text-gray-500">{formatDate(image.uploadDate)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleCopy(image.prompt)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? '已复制' : '复制提示词'}
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Download size={18} />
              下载
            </button>

            {isAdminMode && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                  {isEditing ? '取消编辑' : '编辑'}
                </button>

                {/* AI反推提示词按钮 */}
                <button
                  onClick={handleReversePrompt}
                  disabled={isGeneratingPrompt}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Sparkles size={18} className={isGeneratingPrompt ? 'animate-spin' : ''} />
                  {isGeneratingPrompt ? 'AI生成中...' : 'AI反推提示词'}
                </button>

                {/* AI打标签按钮 */}
                <button
                  onClick={handleAutoTag}
                  disabled={isGeneratingTags}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Tag size={18} className={isGeneratingTags ? 'animate-spin' : ''} />
                  {isGeneratingTags ? 'AI打标中...' : 'AI打标签'}
                </button>

                {/* 补充图片按钮 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingMore}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isUploadingMore ? (
                    <>
                      <Upload size={18} className="animate-pulse" />
                      上传中...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      补充图片
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddMoreImages}
                  className="hidden"
                />

                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                  删除
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                提示词 (Prompt)
              </label>
              {isEditing ? (
                <textarea
                  value={editForm.prompt}
                  onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-200 whitespace-pre-wrap">
                  {image.prompt || '暂无提示词'}
                </p>
              )}
            </div>

            {/* Negative Prompt */}
            {(image.negativePrompt || isEditing) && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  负向提示词 (Negative Prompt)
                </label>
                {isEditing ? (
                  <textarea
                    value={editForm.negativePrompt}
                    onChange={(e) => setEditForm({ ...editForm, negativePrompt: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary-500"
                  />
                ) : (
                  <p className="text-gray-200 whitespace-pre-wrap">
                    {image.negativePrompt}
                  </p>
                )}
              </div>
            )}

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                模型
              </label>
              {isEditing ? (
                <select
                  value={editForm.model}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="">请选择模型</option>
                  {models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-200">{image.model || '未知'}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                分类
              </label>
              {isEditing ? (
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              ) : (
                <span className="inline-block px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg">
                  {image.category}
                </span>
              )}
            </div>

            {/* Parameters */}
            {Object.keys(image.parameters).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  生成参数
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(image.parameters).map(([key, value]) => (
                    <div key={key} className="px-3 py-2 bg-gray-800 rounded-lg">
                      <span className="text-xs text-gray-500">{key}</span>
                      <p className="text-sm text-gray-200">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {image.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {image.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          {isEditing && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleSave}
              className="w-full mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
            >
              保存更改
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ImageDetail
