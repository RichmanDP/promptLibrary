# 🔧 Bug修复说明

## 问题描述
在设置页面新增分类后，返回画廊页面点击"上传作品"，分类下拉框中看不到新添加的分类。

## 问题原因
1. `UploadModal` 组件在初始化时使用 `categories[0]` 作为默认值
2. 如果当时 `categories` 还是空数组或旧数据，就会使用过时的分类列表
3. 从设置页面返回画廊页面时，分类列表没有主动刷新

## 解决方案

### 1. UploadModal组件优化
- ✅ 添加 `useEffect` 监听 `categories` 变化
- ✅ 当分类列表更新时自动更新表单默认分类
- ✅ 当分类列表为空时显示警告提示
- ✅ 添加"未分类"作为后备选项

### 2. Gallery页面优化
- ✅ 添加窗口焦点事件监听，从设置页面返回时自动刷新分类
- ✅ 点击"上传作品"按钮时主动刷新分类列表
- ✅ 确保打开上传对话框时使用最新的分类数据

## 代码修改

### UploadModal.tsx
```typescript
// 添加useEffect监听分类变化
useEffect(() => {
  if (categories.length > 0 && !formData.category) {
    setFormData(prev => ({ ...prev, category: categories[0] }))
  }
}, [categories])

// 分类下拉框添加空列表处理
{categories.length === 0 && (
  <option value="未分类">未分类</option>
)}
{categories.map(cat => (
  <option key={cat} value={cat}>{cat}</option>
))}
```

### Gallery.tsx
```typescript
// 添加焦点事件监听
useEffect(() => {
  const handleFocus = () => {
    api.getCategories().then(res => {
      if (res.success) {
        setCategories(res.categories)
      }
    })
  }
  window.addEventListener('focus', handleFocus)
  return () => window.removeEventListener('focus', handleFocus)
}, [setCategories])

// 打开上传对话框前刷新分类
const handleOpenUpload = async () => {
  try {
    const categoriesRes = await api.getCategories()
    if (categoriesRes.success) {
      setCategories(categoriesRes.categories)
    }
  } catch (error) {
    console.error('刷新分类失败:', error)
  }
  setShowUploadModal(true)
}
```

## 测试步骤

1. **启动服务器**
   ```bash
   npm run dev
   ```

2. **添加新分类**
   - 切换到管理模式
   - 进入设置页面
   - 在"分类管理"区域添加新分类（如：测试分类）
   - 点击"保存并返回"

3. **验证修复**
   - 返回画廊页面
   - 点击"上传作品"按钮
   - 查看分类下拉框
   - ✅ 应该能看到刚刚添加的"测试分类"

## 预期结果

- ✅ 新添加的分类立即在上传对话框中可用
- ✅ 不需要刷新页面
- ✅ 分类列表实时同步
- ✅ 空分类列表有友好提示

## 其他改进

- 页面获得焦点时自动刷新分类（用户可能在其他标签页操作）
- 上传成功后会自动刷新所有数据（包括分类）
- 更好的用户体验和错误提示

---

**修复完成时间**: 2025-12-25  
**影响范围**: UploadModal.tsx, Gallery.tsx  
**向后兼容**: ✅ 完全兼容
