import { reactive, readonly } from 'vue';
import { calculatePenPathBounds, toRelativePenPath } from '@/utils/canvas.js';

// 生成唯一 ID
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// 获取下一个 Z-Index
const getNextZIndex = (elements) => {
  return elements.length > 0 ? Math.max(...elements.map(e => e.zIndex)) + 1 : 1;
};

// 核心状态
const state = reactive({
  elements: [],
  selectedId: null,
  mode: 'select', // select | pan | draw
  camera: { x: 0, y: 0, scale: 1 },
  assets: {}, // 缓存加载的 Image/Video 对象
  
  // 交互临时状态
  isDragging: false,
  dragOffset: { x: 0, y: 0 },
  isPanning: false,
  isDrawing: false,
  currentPath: null,
  
  // 钢笔工具状态
  isPenDrawing: false,
  penPath: [], // 存储贝塞尔曲线点 [{x, y, cp1x, cp1y, cp2x, cp2y}, ...]
  penCurrentPoint: null, // 当前正在拖拽的控制点
  penPreviewPoint: null // 预览点
});

// 获取元素的绝对坐标
const getAbsoluteBounds = (el) => {
  let absX = el.x, absY = el.y;
  if (el.parentId) {
    const parent = state.elements.find(p => p.id === el.parentId);
    if (parent) {
      const pBounds = getAbsoluteBounds(parent);
      absX += pBounds.x;
      absY += pBounds.y;
    }
  }
  return { x: absX, y: absY, w: el.w, h: el.h };
};

// 屏幕坐标 -> 画布世界坐标转换
const screenToWorld = (clientX, clientY, canvas) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left - state.camera.x) / state.camera.scale,
    y: (clientY - rect.top - state.camera.y) / state.camera.scale
  };
};

// 添加元素
const addElement = (config) => {
  const el = {
    id: generateId(),
    type: config.type,
    name: config.name || `未命名 ${config.type}`,
    content: config.content || '',
    x: config.x || 0,
    y: config.y || 0,
    w: config.w || 100,
    h: config.h || 100,
    visible: true,
    parentId: config.parentId || null,
    zIndex: getNextZIndex(state.elements),
    isGroup: config.type === 'group' || config.type === 'artboard',
    style: config.style || {}
  };

  if (['image', 'video'].includes(el.type)) {
    loadAsset(el.id, el.type, el.content);
  }

  // 如果是 SVG 代码，转换为 Blob URL
  if (el.type === 'svg') {
    const blob = new Blob([el.content], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    loadAsset(el.id, 'svg', url);
  }

  state.elements.push(el);
  state.selectedId = el.id;
};

// 删除元素
const deleteElement = (id) => {
  const children = state.elements.filter(e => e.parentId === id);
  children.forEach(c => deleteElement(c.id));
  state.elements = state.elements.filter(e => e.id !== id);
  if (state.assets[id]) delete state.assets[id];
  if (state.selectedId === id) state.selectedId = null;
};

// 加载资源
const loadAsset = (id, type, url) => {
  if (state.assets[id]) return;
  
  if (type === 'image' || type === 'svg') {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    state.assets[id] = img;
  } else if (type === 'video') {
    const video = document.createElement('video');
    video.crossOrigin = 'Anonymous';
    video.src = url;
    video.loop = true;
    video.muted = true;
    video.play().catch(e => console.log('浏览器自动播放限制', e));
    state.assets[id] = video;
  }
};

// 切换元素可见性
const toggleHide = (id) => {
  const el = state.elements.find(e => e.id === id);
  if (el) el.visible = !el.visible;
};

// 设置模式
const setMode = (mode) => {
  state.mode = mode;
};

// 设置选中元素
const setSelectedId = (id) => {
  state.selectedId = id;
};

// 更新相机位置
const setCamera = (camera) => {
  Object.assign(state.camera, camera);
};

// 更新拖拽状态
const setDragging = (isDragging, offset = { x: 0, y: 0 }) => {
  state.isDragging = isDragging;
  if (offset) state.dragOffset = offset;
};

// 更新平移状态
const setPanning = (isPanning, offset = { x: 0, y: 0 }) => {
  state.isPanning = isPanning;
  if (offset) state.dragOffset = offset;
};

// 更新绘制状态
const setDrawing = (isDrawing, path = null) => {
  state.isDrawing = isDrawing;
  state.currentPath = path;
};

// 钢笔工具 - 开始绘制
const startPenDrawing = () => {
  state.isPenDrawing = true;
  state.penPath = [];
  state.penPreviewPoint = null;
};

// 钢笔工具 - 添加锚点
const addPenPoint = (x, y, cp1x, cp1y, cp2x, cp2y) => {
  state.penPath.push({ x, y, cp1x, cp1y, cp2x, cp2y });
};

// 钢笔工具 - 更新预览点
const setPenPreviewPoint = (point) => {
  state.penPreviewPoint = point;
};

// 钢笔工具 - 更新当前控制点
const setPenCurrentPoint = (point) => {
  state.penCurrentPoint = point;
};

// 钢笔工具 - 结束绘制并创建路径元素
const finishPenDrawing = () => {
  if (state.penPath.length < 2) {
    // 点数不足，取消绘制
    state.isPenDrawing = false;
    state.penPath = [];
    state.penPreviewPoint = null;
    return null;
  }

  // 使用工具函数计算边界框
  const bounds = calculatePenPathBounds(state.penPath);

  // 转换为相对坐标
  const relPath = toRelativePenPath(state.penPath, bounds.x, bounds.y);

  const element = {
    type: 'penPath',
    name: '钢笔路径',
    content: relPath,
    x: bounds.x,
    y: bounds.y,
    w: bounds.w,
    h: bounds.h,
    parentId: state.selectedId,
    style: { stroke: '#1890ff', strokeWidth: 2, fill: 'transparent' }
  };

  // 重置钢笔状态
  state.isPenDrawing = false;
  state.penPath = [];
  state.penPreviewPoint = null;
  state.penCurrentPoint = null;

  return element;
};

// 钢笔工具 - 取消绘制
const cancelPenDrawing = () => {
  state.isPenDrawing = false;
  state.penPath = [];
  state.penPreviewPoint = null;
  state.penCurrentPoint = null;
};

// 更新元素位置
const updateElementPosition = (id, x, y) => {
  const el = state.elements.find(e => e.id === id);
  if (el) {
    el.x = x;
    el.y = y;
  }
};

// 更新元素属性
const updateElement = (id, updates) => {
  const el = state.elements.find(e => e.id === id);
  if (el) {
    Object.assign(el, updates);
  }
};

// 打组
const groupElements = () => {
  // TODO: 实现打组逻辑
  console.log('打组功能待实现');
};

// 解散组
const ungroupElements = () => {
  // TODO: 实现解散组逻辑
  console.log('解散组功能待实现');
};

// 导出画板
const exportArtboard = (artboardId) => {
  const artboard = state.elements.find(e => e.id === artboardId);
  if (!artboard || artboard.type !== 'artboard') {
    alert('请先在左侧选中一个【画板】');
    return;
  }

  // 创建离屏 Canvas
  const offCanvas = document.createElement('canvas');
  offCanvas.width = artboard.w;
  offCanvas.height = artboard.h;
  const offCtx = offCanvas.getContext('2d');

  // 找到画板及其所有子元素
  const children = state.elements
    .filter(e => e.parentId === artboard.id || e.id === artboard.id)
    .sort((a, b) => a.zIndex - b.zIndex);

  // 相对坐标渲染
  children.forEach(el => {
    if (!el.visible) return;
    offCtx.save();
    
    const localX = el.id === artboard.id ? 0 : el.x;
    const localY = el.id === artboard.id ? 0 : el.y;
    offCtx.translate(localX, localY);

    switch (el.type) {
      case 'artboard':
        // 透明底，不填充白色背景
        break;
      case 'text':
        offCtx.font = '24px sans-serif';
        offCtx.fillStyle = '#333';
        offCtx.textBaseline = 'top';
        offCtx.fillText(el.content, 0, 0);
        break;
      case 'image':
      case 'video':
      case 'svg':
        if (state.assets[el.id]) {
          offCtx.drawImage(state.assets[el.id], 0, 0, el.w, el.h);
        }
        break;
      case 'path':
        offCtx.strokeStyle = '#1890ff';
        offCtx.lineWidth = 3;
        offCtx.beginPath();
        if (el.content.length > 0) {
          offCtx.moveTo(el.content[0].x, el.content[0].y);
          for (let i = 1; i < el.content.length; i++) {
            offCtx.lineTo(el.content[i].x, el.content[i].y);
          }
          offCtx.stroke();
        }
        break;
    }
    offCtx.restore();
  });

  // 触发下载
  try {
    const link = document.createElement('a');
    link.download = `${artboard.name}_${Date.now()}.png`;
    link.href = offCanvas.toDataURL('image/png');
    link.click();
  } catch (e) {
    alert('导出失败：请检查图片或视频源是否允许跨域 (CORS)。报错信息：' + e.message);
  }
};

// 初始化默认数据
const initDefaultData = () => {
  if (state.elements.length === 0) {
    addElement({ type: 'artboard', name: '主画板', x: 200, y: 100, w: 600, h: 400 });
    addElement({
      type: 'text',
      name: '标题文本',
      content: '这是一段 Canvas 渲染的文字',
      x: 250,
      y: 150,
      w: 200,
      h: 40,
      parentId: state.elements[0]?.id
    });
  }
};

export default {
  // 只读状态
  state: readonly(state),

  // 方法
  addElement,
  deleteElement,
  toggleHide,
  setMode,
  setSelectedId,
  setCamera,
  setDragging,
  setPanning,
  setDrawing,
  updateElementPosition,
  updateElement,
  groupElements,
  ungroupElements,
  exportArtboard,
  getAbsoluteBounds,
  screenToWorld,
  initDefaultData,
  loadAsset,
  // 钢笔工具方法
  startPenDrawing,
  addPenPoint,
  setPenPreviewPoint,
  setPenCurrentPoint,
  finishPenDrawing,
  cancelPenDrawing
};
