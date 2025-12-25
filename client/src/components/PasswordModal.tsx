import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface PasswordModalProps {
  onVerify: (password: string) => Promise<boolean>;
  onClose: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onVerify, onClose }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isValid = await onVerify(password);
      if (isValid) {
        onClose();
      } else {
        setError('密码错误，请重试');
        setPassword('');
      }
    } catch (err) {
      setError('验证失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">私密画廊</h2>
        <p className="text-gray-400 text-center mb-6">
          此图片已设为私密，请输入密码查看
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-yellow-500 focus:outline-none pr-12"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '验证中...' : '确认'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PasswordModal;
