import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Tag, Lock, Plus, X, Download, TestTube } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface AITaggingConfig {
  enabled: boolean;
  provider: 'ollama' | 'openai' | 'custom';
  ollamaUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
}

interface PrivateGalleryConfig {
  enabled: boolean;
}

interface Config {
  aiTagging: AITaggingConfig;
  privateGallery: PrivateGalleryConfig;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<Config>({
    aiTagging: {
      enabled: false,
      provider: 'ollama',
      ollamaUrl: 'http://localhost:11434',
      apiKey: '',
      model: 'llava',
      prompt: '请分析这张AI生成的图片，提取3-5个关键标签。标签应该简洁准确，用中文逗号分隔。只返回标签，不要其他说明。'
    },
    privateGallery: {
      enabled: false
    }
  });

  const [password, setPassword] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [newModel, setNewModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
    loadCategories();
    loadModels();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadModels = async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('加载模型失败:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    setMessage('');

    try {
      const updateData: any = {
        aiTagging: config.aiTagging,
        privateGallery: {
          enabled: config.privateGallery.enabled
        }
      };

      if (password) {
        updateData.privateGallery.password = password;
      }

      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setMessage('✅ 保存成功！');
        setPassword('');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ 保存失败');
      }
    } catch (error) {
      setMessage('❌ 保存失败');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory })
      });

      const data = await response.json();
      
      if (response.ok) {
        setCategories(data.categories);
        setNewCategory('');
        setMessage('✅ 分类添加成功！');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ 添加分类失败');
    }
  };

  const deleteCategory = async (name: string) => {
    if (!confirm(`确定要删除分类"${name}"吗？`)) return;

    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        setCategories(data.categories);
        setMessage('✅ 分类删除成功！');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ 删除分类失败');
    }
  };

  const addModel = async () => {
    if (!newModel.trim()) return;

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newModel })
      });

      const data = await response.json();
      
      if (response.ok) {
        setModels(data.models);
        setNewModel('');
        setMessage('✅ 模型添加成功！');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ 添加模型失败');
    }
  };

  const deleteModel = async (name: string) => {
    if (!confirm(`确定要删除模型"${name}"吗？`)) return;

    try {
      const response = await fetch(`/api/models/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        setModels(data.models);
        setMessage('✅ 模型删除成功！');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ 删除模型失败');
    }
  };

  const testAIConnection = async () => {
    setLoading(true);
    setMessage('🔄 正在测试AI连接...');

    try {
      const response = await fetch('/api/test-ai-connection', {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(data.message);
      } else {
        setMessage(`❌ ${data.message}`);
      }
      
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage('❌ 测试连接失败');
    } finally {
      setLoading(false);
    }
  };

  const exportPrompts = async () => {
    try {
      const response = await fetch('/api/export/prompts');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompts_${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMessage('✅ 提示词导出成功！');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ 导出失败');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold">系统设置</h1>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            {message}
          </div>
        )}

        {/* 分类管理 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-green-400" />
            分类管理
          </h2>

          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                placeholder="输入新分类名称（支持中文）"
                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={addCategory}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                添加
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div
                key={category}
                className="px-4 py-2 bg-gray-700 rounded-lg flex items-center gap-2 group"
              >
                <span>{category}</span>
                <button
                  onClick={() => deleteCategory(category)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 模型管理 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-400" />
            模型管理
          </h2>

          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addModel()}
                placeholder="输入新模型名称（如 Stable Diffusion XL）"
                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={addModel}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                添加
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {models.map((model) => (
              <div
                key={model}
                className="px-4 py-2 bg-gray-700 rounded-lg flex items-center gap-2 group"
              >
                <span>{model}</span>
                <button
                  onClick={() => deleteModel(model)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* AI自动打标签 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-400" />
            AI 自动打标签
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.aiTagging.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  aiTagging: { ...config.aiTagging, enabled: e.target.checked }
                })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span>启用 AI 自动打标签</span>
            </label>

            {config.aiTagging.enabled && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">AI 服务提供商</label>
                  <select
                    value={config.aiTagging.provider}
                    onChange={(e) => setConfig({
                      ...config,
                      aiTagging: { ...config.aiTagging, provider: e.target.value as any }
                    })}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ollama">Ollama (本地)</option>
                    <option value="openai">OpenAI (GPT-4 Vision)</option>
                  </select>
                </div>

                {config.aiTagging.provider === 'ollama' && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Ollama 地址</label>
                      <input
                        type="text"
                        value={config.aiTagging.ollamaUrl}
                        onChange={(e) => setConfig({
                          ...config,
                          aiTagging: { ...config.aiTagging, ollamaUrl: e.target.value }
                        })}
                        placeholder="http://localhost:11434"
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">模型名称</label>
                      <input
                        type="text"
                        value={config.aiTagging.model}
                        onChange={(e) => setConfig({
                          ...config,
                          aiTagging: { ...config.aiTagging, model: e.target.value }
                        })}
                        placeholder="llava"
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        推荐: llava, llava:13b, bakllava 等支持视觉的模型
                      </p>
                    </div>
                  </>
                )}

                {config.aiTagging.provider === 'openai' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">API Key</label>
                    <input
                      type="password"
                      value={config.aiTagging.apiKey}
                      onChange={(e) => setConfig({
                        ...config,
                        aiTagging: { ...config.aiTagging, apiKey: e.target.value }
                      })}
                      placeholder="sk-..."
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">AI 提示词</label>
                  <textarea
                    value={config.aiTagging.prompt}
                    onChange={(e) => setConfig({
                      ...config,
                      aiTagging: { ...config.aiTagging, prompt: e.target.value }
                    })}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    这个提示词会发送给 AI 来生成标签，你可以自定义标签生成的规则
                  </p>
                </div>

                {/* AI 测试按钮 */}
                <button
                  onClick={testAIConnection}
                  disabled={loading}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <TestTube className="w-4 h-4" />
                  测试 AI 连接
                </button>
              </>
            )}
          </div>
        </div>

        {/* 私密画廊 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-yellow-400" />
            私密画廊
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.privateGallery.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  privateGallery: { ...config.privateGallery, enabled: e.target.checked }
                })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span>启用私密画廊功能</span>
            </label>

            {config.privateGallery.enabled && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  设置访问密码（留空则不修改）
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入新密码"
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  标记为私密的图片需要输入此密码才能查看
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex gap-3">
          <button
            onClick={exportPrompts}
            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-5 h-5" />
            导出提示词 (MD)
          </button>
          
          <button
            onClick={() => {
              saveConfig();
              setTimeout(() => navigate('/'), 1500);
            }}
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? '保存中...' : '保存并返回'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
