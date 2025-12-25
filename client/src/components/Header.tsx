import { motion } from 'framer-motion'
import { Shield, Upload, Sparkles, Settings as SettingsIcon, Lock } from 'lucide-react'
import { useGalleryStore } from '../store/galleryStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import PasswordModal from './PasswordModal'

interface HeaderProps {
  onUploadClick: () => void
}

const Header = ({ onUploadClick }: HeaderProps) => {
  const { isAdminMode, isPrivateMode, toggleAdminMode, setPrivateMode } = useGalleryStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const handlePrivateModeToggle = () => {
    if (isPrivateMode) {
      // 退出私密模式
      setPrivateMode(false)
    } else {
      // 进入私密模式需要验证密码
      setShowPasswordModal(true)
    }
  }

  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await response.json()
      
      if (data.valid) {
        setPrivateMode(true)
        return true
      }
      return false
    } catch (error) {
      console.error('验证密码失败:', error)
      return false
    }
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="relative">
              <Sparkles className="text-primary-400" size={32} />
              <div className="absolute inset-0 blur-xl bg-primary-400/30" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                AI Art Gallery
              </h1>
              <p className="text-xs text-gray-500">
                AI绘画艺术图书馆 • by <a href="https://github.com/RichmanDP" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">清鹤堂主</a>
              </p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            {isAdminMode && location.pathname === '/' && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={onUploadClick}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                <Upload size={18} />
                <span>上传作品</span>
              </motion.button>
            )}

            {isAdminMode && (
              <button
                onClick={() => navigate(location.pathname === '/settings' ? '/' : '/settings')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                <SettingsIcon size={18} />
                <span>{location.pathname === '/settings' ? '返回画廊' : '设置'}</span>
              </button>
            )}

            {/* 私密模式按钮 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrivateModeToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isPrivateMode
                  ? 'bg-purple-500/20 border-2 border-purple-400/50 text-purple-300'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Lock size={18} />
              <span>{isPrivateMode ? '私密模式' : '进入私密'}</span>
            </motion.button>

            <button
              onClick={toggleAdminMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isAdminMode
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Shield size={18} />
              <span>{isAdminMode ? '管理模式' : '普通模式'}</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* 私密模式密码验证弹窗 */}
      {showPasswordModal && (
        <PasswordModal
          onClose={() => setShowPasswordModal(false)}
          onVerify={handlePasswordVerify}
        />
      )}
    </header>
  )
}

export default Header
