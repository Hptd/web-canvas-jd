import { ref, onMounted, onUnmounted } from 'vue';
import { resizeCanvas } from '@/utils/canvas.js';

/**
 * Canvas 渲染引擎 Composable
 * @param {Object} canvasRef - Canvas 元素引用
 * @param {Object} state - 画布状态
 * @param {Function} getAbsoluteBounds - 获取元素绝对边界函数
 */
export function useRenderer(canvasRef, state, getAbsoluteBounds) {
  const ctx = ref(null);
  let animationId = null;
  let resizeHandler = null;

  // 初始化 Canvas
  const initCanvas = () => {
    if (!canvasRef.value) return;
    
    const canvas = canvasRef.value;
    ctx.value = canvas.getContext('2d');
    
    // 初始调整大小
    resizeCanvas(canvas, ctx.value);
    
    // 监听窗口大小变化
    resizeHandler = () => resizeCanvas(canvas, ctx.value);
    window.addEventListener('resize', resizeHandler);
    
    // 启动渲染循环
    startRenderLoop();
  };

  // 绘制网格背景
  const drawGrid = (ctx, canvas, camera) => {
    ctx.fillStyle = '#d9d9d9';
    const dotSize = 2;
    const gap = 20;
    
    // 计算可视区域
    const startX = -camera.x / camera.scale;
    const startY = -camera.y / camera.scale;
    const endX = startX + canvas.width / camera.scale;
    const endY = startY + canvas.height / camera.scale;
    
    for (let i = Math.floor(startX / gap) * gap; i < endX; i += gap) {
      for (let j = Math.floor(startY / gap) * gap; j < endY; j += gap) {
        ctx.fillRect(
          i,
          j,
          dotSize / camera.scale,
          dotSize / camera.scale
        );
      }
    }
  };

  // 绘制星形辅助函数
  const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // 绘制元素
  const drawElement = (ctx, el, bounds, assets) => {
    ctx.save();
    ctx.translate(bounds.x, bounds.y);
    ctx.beginPath();

    switch (el.type) {
      case 'artboard':
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.fillRect(0, 0, bounds.w, bounds.h);
        ctx.strokeStyle = '#dddddd';
        ctx.strokeRect(0, 0, bounds.w, bounds.h);
        break;

      case 'group':
        ctx.strokeStyle = '#aaaaaa';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(0, 0, bounds.w, bounds.h);
        break;

      case 'text':
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#333';
        ctx.textBaseline = 'top';
        ctx.fillText(el.content, 0, 0);
        break;

      case 'image':
      case 'video':
      case 'svg':
        (() => {
          const media = assets[el.id];
          if (media && media.complete) {
            ctx.drawImage(media, 0, 0, bounds.w, bounds.h);
          } else {
            ctx.fillStyle = '#eee';
            ctx.fillRect(0, 0, bounds.w, bounds.h);
            ctx.fillStyle = '#999';
            ctx.fillText('Loading...', 10, 20);
          }
        })();
        break;

      case 'path':
        (() => {
          ctx.strokeStyle = '#1890ff';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const points = el.content;
          if (points && points.length > 0) {
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
          }
        })();
        break;

      // 形状渲染
      case 'rect':
        ctx.fillStyle = el.style?.fill || '#e6f7ff';
        ctx.strokeStyle = el.style?.stroke || '#1890ff';
        ctx.lineWidth = el.style?.strokeWidth || 2;
        ctx.fillRect(0, 0, bounds.w, bounds.h);
        ctx.strokeRect(0, 0, bounds.w, bounds.h);
        break;

      case 'circle':
        ctx.fillStyle = el.style?.fill || '#e6f7ff';
        ctx.strokeStyle = el.style?.stroke || '#1890ff';
        ctx.lineWidth = el.style?.strokeWidth || 2;
        ctx.beginPath();
        ctx.arc(bounds.w / 2, bounds.h / 2, Math.min(bounds.w, bounds.h) / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'triangle':
        ctx.fillStyle = el.style?.fill || '#e6f7ff';
        ctx.strokeStyle = el.style?.stroke || '#1890ff';
        ctx.lineWidth = el.style?.strokeWidth || 2;
        ctx.beginPath();
        ctx.moveTo(bounds.w / 2, 0);
        ctx.lineTo(bounds.w, bounds.h);
        ctx.lineTo(0, bounds.h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'star':
        ctx.fillStyle = el.style?.fill || '#e6f7ff';
        ctx.strokeStyle = el.style?.stroke || '#1890ff';
        ctx.lineWidth = el.style?.strokeWidth || 2;
        drawStar(ctx, bounds.w / 2, bounds.h / 2, 5, Math.min(bounds.w, bounds.h) / 2, Math.min(bounds.w, bounds.h) / 4);
        break;

      case 'penPath':
        (() => {
          const points = el.content;
          if (!points || points.length < 2) return;

          ctx.strokeStyle = el.style?.stroke || '#1890ff';
          ctx.fillStyle = el.style?.fill || 'transparent';
          ctx.lineWidth = el.style?.strokeWidth || 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);

          for (let i = 1; i < points.length; i++) {
            const p = points[i];
            const prev = points[i - 1];

            if (p.cp1x !== undefined && p.cp1y !== undefined) {
              // 使用贝塞尔曲线
              ctx.bezierCurveTo(
                prev.cp2x !== undefined ? prev.cp2x : prev.x,
                prev.cp2y !== undefined ? prev.cp2y : prev.y,
                p.cp1x,
                p.cp1y,
                p.x,
                p.y
              );
            } else if (prev.cp2x !== undefined && prev.cp2y !== undefined) {
              // 只使用前一个点的控制点2
              ctx.quadraticCurveTo(prev.cp2x, prev.cp2y, p.x, p.y);
            } else {
              // 直线
              ctx.lineTo(p.x, p.y);
            }
          }

          // 如果是闭合路径
          if (el.style?.closed) {
            ctx.closePath();
            ctx.fill();
          }
          ctx.stroke();
        })();
        break;
    }

    ctx.restore();
  };

  // 绘制选中框
  const drawSelection = (ctx, state) => {
    if (!state.selectedId) return;
    
    const selEl = state.elements.find(e => e.id === state.selectedId);
    if (!selEl || !selEl.visible) return;

    const bounds = getAbsoluteBounds(selEl);
    ctx.save();
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2 / state.camera.scale;
    ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);

    // 绘制控制点
    ctx.fillStyle = '#fff';
    const handleSize = 6 / state.camera.scale;
    ctx.fillRect(
      bounds.x - handleSize / 2,
      bounds.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      bounds.x - handleSize / 2,
      bounds.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.restore();
  };

  // 绘制当前画笔路径
  const drawCurrentPath = (ctx, state) => {
    if (!state.isDrawing || !state.currentPath || state.currentPath.length === 0) return;

    ctx.save();
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const p = state.currentPath;
    ctx.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length; i++) {
      ctx.lineTo(p[i].x, p[i].y);
    }
    ctx.stroke();
    ctx.restore();
  };

  // 绘制钢笔路径预览
  const drawPenPreview = (ctx, state) => {
    if (!state.isPenDrawing || !state.penPath || state.penPath.length === 0) return;

    ctx.save();

    // 绘制已完成的贝塞尔曲线
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const points = state.penPath;
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const prev = points[i - 1];

      if (p.cp1x !== undefined && p.cp1y !== undefined) {
        ctx.bezierCurveTo(
          prev.cp2x !== undefined ? prev.cp2x : prev.x,
          prev.cp2y !== undefined ? prev.cp2y : prev.y,
          p.cp1x,
          p.cp1y,
          p.x,
          p.y
        );
      } else if (prev.cp2x !== undefined && prev.cp2y !== undefined) {
        ctx.quadraticCurveTo(prev.cp2x, prev.cp2y, p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();

    // 绘制预览线（从最后一个点到鼠标位置）
    if (state.penPreviewPoint && points.length > 0) {
      const lastPoint = points[points.length - 1];
      ctx.strokeStyle = '#1890ff';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(state.penPreviewPoint.x, state.penPreviewPoint.y);
      ctx.stroke();
    }

    // 绘制锚点
    ctx.fillStyle = '#1890ff';
    points.forEach((p, i) => {
      // 锚点
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // 第一个点特殊标记（用于闭合路径）
      if (i === 0 && points.length > 2) {
        ctx.strokeStyle = '#52c41a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 控制点
      if (p.cp1x !== undefined) {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.cp1x, p.cp1y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 控制线
        ctx.strokeStyle = '#1890ff';
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.cp1x, p.cp1y);
        ctx.stroke();
      }

      if (p.cp2x !== undefined) {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.cp2x, p.cp2y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 控制线
        ctx.strokeStyle = '#1890ff';
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.cp2x, p.cp2y);
        ctx.stroke();
      }
    });

    ctx.restore();
  };

  // 渲染帧
  const drawFrame = () => {
    if (!canvasRef.value || !ctx.value) return;

    const canvas = canvasRef.value;
    const context = ctx.value;
    const { camera, elements, assets, currentPath, isDrawing } = state;

    // 1. 清空画布
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();
    // 应用相机矩阵
    context.translate(camera.x, camera.y);
    context.scale(camera.scale, camera.scale);

    // 2. 绘制网格
    drawGrid(context, canvas, camera);

    // 3. 按 Z-index 排序绘制元素
    const sorted = [...elements]
      .filter(e => e.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    sorted.forEach(el => {
      const bounds = getAbsoluteBounds(el);
      drawElement(context, el, bounds, assets);
    });

    // 4. 绘制当前画笔轨迹
    if (isDrawing && currentPath) {
      drawCurrentPath(context, state);
    }

    // 5. 绘制钢笔路径预览
    if (state.isPenDrawing) {
      drawPenPreview(context, state);
    }

    // 6. 绘制选中框
    drawSelection(context, state);

    context.restore();

    // 继续下一帧
    animationId = requestAnimationFrame(drawFrame);
  };

  // 启动渲染循环
  const startRenderLoop = () => {
    if (animationId) return;
    drawFrame();
  };

  // 停止渲染循环
  const stopRenderLoop = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };

  // 清理
  const cleanup = () => {
    stopRenderLoop();
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }
  };

  onMounted(initCanvas);
  onUnmounted(cleanup);

  return {
    ctx,
    startRenderLoop,
    stopRenderLoop,
    cleanup
  };
}
