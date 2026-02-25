import { onMounted, onUnmounted } from 'vue';
import { hitTest, calculatePathBounds, toRelativePath } from '@/utils/canvas.js';

/**
 * Canvas 交互系统 Composable
 * @param {Object} canvasRef - Canvas 元素引用
 * @param {Object} viewportRef - 视口容器引用
 * @param {Object} canvasStore - 画布状态管理
 */
export function useInteraction(canvasRef, viewportRef, canvasStore) {
  const { state, setSelectedId, setDragging, setPanning, setDrawing, setCamera, updateElementPosition, addElement, screenToWorld, getAbsoluteBounds, startPenDrawing, addPenPoint, setPenPreviewPoint, finishPenDrawing, cancelPenDrawing } = canvasStore;

  // 钢笔工具临时状态
  let isPenDraggingControlPoint = false;
  let currentControlPointIndex = -1;
  let isControlPoint2 = false; // true 表示控制点2，false 表示控制点1

  // 处理鼠标按下
  const handleMouseDown = (e) => {
    const canvas = canvasRef.value;
    const worldPos = screenToWorld(e.clientX, e.clientY, canvas);

    if (state.mode === 'select') {
      const clickedEl = hitTest(worldPos.x, worldPos.y, state.elements, getAbsoluteBounds);

      if (clickedEl) {
        setSelectedId(clickedEl.id);
        setDragging(true);

        // 记录鼠标与元素左上角的相对偏移量
        const bounds = getAbsoluteBounds(clickedEl);
        const offset = {
          x: worldPos.x - bounds.x,
          y: worldPos.y - bounds.y
        };
        setDragging(true, offset);
      } else {
        setSelectedId(null);
      }
    } else if (state.mode === 'pan' || e.button === 1 || (e.code === 'Space')) {
      setPanning(true, {
        x: e.clientX - state.camera.x,
        y: e.clientY - state.camera.y
      });
    } else if (state.mode === 'draw') {
      // 画笔模式
      setDrawing(true, [{ x: worldPos.x, y: worldPos.y }]);
    } else if (state.mode === 'pen') {
      // 钢笔模式
      handlePenMouseDown(e, worldPos);
    }
  };

  // 钢笔工具 - 鼠标按下处理
  const handlePenMouseDown = (e, worldPos) => {
    // 检查是否点击了现有锚点（用于结束绘制）
    if (state.penPath.length > 2) {
      const firstPoint = state.penPath[0];
      const distToFirst = Math.sqrt(
        Math.pow(worldPos.x - firstPoint.x, 2) +
        Math.pow(worldPos.y - firstPoint.y, 2)
      );
      if (distToFirst < 10) {
        // 点击第一个点，闭合路径并结束绘制
        const element = finishPenDrawing();
        if (element) {
          addElement(element);
        }
        return;
      }
    }

    // 检查是否点击了控制点
    for (let i = 0; i < state.penPath.length; i++) {
      const point = state.penPath[i];
      if (point.cp1x !== undefined) {
        const dist1 = Math.sqrt(
          Math.pow(worldPos.x - point.cp1x, 2) +
          Math.pow(worldPos.y - point.cp1y, 2)
        );
        if (dist1 < 8) {
          isPenDraggingControlPoint = true;
          currentControlPointIndex = i;
          isControlPoint2 = false;
          return;
        }
      }
      if (point.cp2x !== undefined) {
        const dist2 = Math.sqrt(
          Math.pow(worldPos.x - point.cp2x, 2) +
          Math.pow(worldPos.y - point.cp2y, 2)
        );
        if (dist2 < 8) {
          isPenDraggingControlPoint = true;
          currentControlPointIndex = i;
          isControlPoint2 = true;
          return;
        }
      }
    }

    // 添加新锚点
    if (!state.isPenDrawing) {
      startPenDrawing();
    }

    // 添加锚点（初始时没有控制点）
    addPenPoint(worldPos.x, worldPos.y);

    // 设置预览点
    setPenPreviewPoint({ x: worldPos.x, y: worldPos.y });
  };

  // 处理鼠标移动
  const handleMouseMove = (e) => {
    const canvas = canvasRef.value;
    const worldPos = screenToWorld(e.clientX, e.clientY, canvas);

    if (state.isDragging && state.selectedId) {
      const el = state.elements.find(e => e.id === state.selectedId);
      if (!el) return;

      // 如果有父级，拖拽时需要减去父级的坐标影响
      let parentOffsetX = 0, parentOffsetY = 0;
      if (el.parentId) {
        const parent = state.elements.find(p => p.id === el.parentId);
        if (parent) {
          const pBounds = getAbsoluteBounds(parent);
          parentOffsetX = pBounds.x;
          parentOffsetY = pBounds.y;
        }
      }

      const newX = worldPos.x - state.dragOffset.x - parentOffsetX;
      const newY = worldPos.y - state.dragOffset.y - parentOffsetY;
      updateElementPosition(el.id, newX, newY);
    } else if (state.isPanning) {
      setCamera({
        x: e.clientX - state.dragOffset.x,
        y: e.clientY - state.dragOffset.y
      });
    } else if (state.isDrawing && state.currentPath) {
      // 画笔模式 - 添加点（使用数组方法触发响应式更新）
      const newPath = [...state.currentPath, { x: worldPos.x, y: worldPos.y }];
      setDrawing(true, newPath);
    } else if (state.mode === 'pen' && state.isPenDrawing) {
      // 钢笔模式
      handlePenMouseMove(e, worldPos);
    }
  };

  // 钢笔工具 - 鼠标移动处理
  const handlePenMouseMove = (e, worldPos) => {
    if (isPenDraggingControlPoint && currentControlPointIndex >= 0) {
      // 拖拽控制点 - 创建新的点对象以触发响应式更新
      const point = state.penPath[currentControlPointIndex];
      const updatedPoint = { ...point };
      if (isControlPoint2) {
        updatedPoint.cp2x = worldPos.x;
        updatedPoint.cp2y = worldPos.y;
      } else {
        updatedPoint.cp1x = worldPos.x;
        updatedPoint.cp1y = worldPos.y;
      }
      // 使用 splice 替换数组元素以触发响应式更新
      state.penPath.splice(currentControlPointIndex, 1, updatedPoint);
    } else if (state.penPath.length > 0) {
      // 更新预览点
      setPenPreviewPoint({ x: worldPos.x, y: worldPos.y });

      // 自动计算控制点（对称控制点）
      const lastIndex = state.penPath.length - 1;
      const lastPoint = state.penPath[lastIndex];
      
      // 计算控制点，使曲线平滑
      const prevPoint = state.penPath.length > 1 ? state.penPath[lastIndex - 1] : null;
      if (prevPoint) {
        // 计算切线方向
        const dx = lastPoint.x - prevPoint.x;
        const dy = lastPoint.y - prevPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          // 控制点距离基于相邻点距离的 1/3（贝塞尔曲线最佳实践）
          const controlDist = dist * 0.3;
          const cp1x = lastPoint.x - (dx / dist) * controlDist;
          const cp1y = lastPoint.y - (dy / dist) * controlDist;
          const cp2x = lastPoint.x + (worldPos.x - lastPoint.x) * 0.5;
          const cp2y = lastPoint.y + (worldPos.y - lastPoint.y) * 0.5;
          
          // 更新最后一个点，添加控制点
          const updatedPoint = { 
            ...lastPoint, 
            cp1x: cp1x, 
            cp1y: cp1y,
            cp2x: cp2x,
            cp2y: cp2y
          };
          state.penPath.splice(lastIndex, 1, updatedPoint);
        }
      }
    }
  };

  // 处理鼠标释放
  const handleMouseUp = () => {
    if (state.isDrawing && state.currentPath && state.currentPath.length > 0) {
      // 画笔模式 - 结束绘制
      const bounds = calculatePathBounds(state.currentPath);
      const relPath = toRelativePath(state.currentPath, bounds.x, bounds.y);

      addElement({
        type: 'path',
        name: '涂鸦',
        content: relPath,
        x: bounds.x,
        y: bounds.y,
        w: bounds.w,
        h: bounds.h,
        parentId: state.selectedId
      });
    }

    if (isPenDraggingControlPoint) {
      isPenDraggingControlPoint = false;
      currentControlPointIndex = -1;
    }

    setDragging(false);
    setPanning(false);
    setDrawing(false, null);
  };

  // 处理双击（钢笔工具结束绘制）
  const handleDoubleClick = () => {
    if (state.mode === 'pen' && state.isPenDrawing) {
      const element = finishPenDrawing();
      if (element) {
        addElement(element);
      }
    }
  };

  // 处理键盘事件（ESC取消钢笔绘制）
  const handleKeyDown = (e) => {
    if (e.code === 'Escape' && state.mode === 'pen' && state.isPenDrawing) {
      cancelPenDrawing();
    }
  };

  // 处理滚轮缩放
  const handleWheel = (e) => {
    e.preventDefault();

    const canvas = canvasRef.value;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      // 缩放
      const zoomDelta = e.deltaY * -0.005;
      const newScale = Math.min(Math.max(0.1, state.camera.scale + zoomDelta), 5);

      // 以鼠标位置为中心缩放
      const newCameraX = mouseX - (mouseX - state.camera.x) * (newScale / state.camera.scale);
      const newCameraY = mouseY - (mouseY - state.camera.y) * (newScale / state.camera.scale);

      setCamera({
        x: newCameraX,
        y: newCameraY,
        scale: newScale
      });
    } else {
      // 平移
      setCamera({
        x: state.camera.x - e.deltaX,
        y: state.camera.y - e.deltaY
      });
    }
  };

  // 绑定事件
  const bindEvents = () => {
    const viewport = viewportRef.value;
    if (!viewport) return;

    viewport.addEventListener('mousedown', handleMouseDown);
    viewport.addEventListener('dblclick', handleDoubleClick);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    viewport.addEventListener('wheel', handleWheel, { passive: false });
  };

  // 解绑事件
  const unbindEvents = () => {
    const viewport = viewportRef.value;
    if (!viewport) return;

    viewport.removeEventListener('mousedown', handleMouseDown);
    viewport.removeEventListener('dblclick', handleDoubleClick);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('keydown', handleKeyDown);
    viewport.removeEventListener('wheel', handleWheel);
  };

  onMounted(bindEvents);
  onUnmounted(unbindEvents);

  return {
    bindEvents,
    unbindEvents
  };
}