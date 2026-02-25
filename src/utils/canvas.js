/**
 * Canvas 工具函数
 */

// 自适应 Canvas 分辨率 (处理高清屏 Retina 模糊问题)
export function resizeCanvas(canvas, ctx) {
  const parent = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = parent.clientWidth * dpr;
  canvas.height = parent.clientHeight * dpr;
  ctx.scale(dpr, dpr);
}

// 生成唯一 ID
export function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// 检测点是否在矩形内
export function hitTest(x, y, elements, getAbsoluteBounds) {
  // 倒序遍历 (从最上层往下找)
  const sorted = [...elements]
    .filter(e => e.visible)
    .sort((a, b) => b.zIndex - a.zIndex);
  
  for (let el of sorted) {
    const b = getAbsoluteBounds(el);
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      return el;
    }
  }
  return null;
}

// 获取元素类型图标
export function getElementIcon(type) {
  const icons = {
    artboard: '🔲',
    group: '📁',
    text: 'T',
    image: '🖼',
    video: '🎬',
    path: '🖌',
    penPath: '✒️',
    svg: '⭐',
    rect: '⬜',
    circle: '⭕',
    triangle: '🔺',
    star: '⭐'
  };
  return icons[type] || '🔹';
}

// 计算路径边界框
export function calculatePathBounds(points) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY
  };
}

// 将绝对坐标转为相对坐标
export function toRelativePath(points, offsetX, offsetY) {
  return points.map(p => ({
    x: p.x - offsetX,
    y: p.y - offsetY
  }));
}

// 计算贝塞尔路径边界框（支持控制点）
export function calculatePenPathBounds(points) {
  const allX = [];
  const allY = [];

  points.forEach(p => {
    allX.push(p.x);
    allY.push(p.y);
    // 控制点也加入边界计算
    if (p.cp1x !== undefined) {
      allX.push(p.cp1x);
      allY.push(p.cp1y);
    }
    if (p.cp2x !== undefined) {
      allX.push(p.cp2x);
      allY.push(p.cp2y);
    }
  });

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY
  };
}

// 将贝塞尔路径转为相对坐标
export function toRelativePenPath(points, offsetX, offsetY) {
  return points.map(p => {
    const result = {
      x: p.x - offsetX,
      y: p.y - offsetY
    };
    if (p.cp1x !== undefined) {
      result.cp1x = p.cp1x - offsetX;
      result.cp1y = p.cp1y - offsetY;
    }
    if (p.cp2x !== undefined) {
      result.cp2x = p.cp2x - offsetX;
      result.cp2y = p.cp2y - offsetY;
    }
    return result;
  });
}
