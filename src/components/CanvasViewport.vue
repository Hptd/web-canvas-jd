<template>
  <div
    id="viewport"
    ref="viewportRef"
    :class="`mode-${canvasStore.state.mode}`"
  >
    <!-- 画布区域 -->
    <div class="canvas-container">
      <canvas ref="canvasRef" id="app-canvas"></canvas>
    </div>

    <!-- 右上角缩放控制 -->
    <div class="zoom-controls">
      <button class="zoom-btn" @click="zoomOut">−</button>
      <span class="zoom-value">{{ Math.round(scale * 100) }}%</span>
      <button class="zoom-btn" @click="zoomIn">+</button>
    </div>

    <!-- 右上角星形按钮 -->
    <button class="star-btn" title="收藏">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRenderer } from '@/composables/useRenderer.js';
import { useInteraction } from '@/composables/useInteraction.js';

export default {
  name: 'CanvasViewport',
  props: {
    canvasStore: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const canvasRef = ref(null);
    const viewportRef = ref(null);

    // 缩放比例
    const scale = computed(() => props.canvasStore.state.camera.scale);

    // 初始化渲染引擎
    const { startRenderLoop, stopRenderLoop } = useRenderer(
      canvasRef,
      props.canvasStore.state,
      props.canvasStore.getAbsoluteBounds
    );

    // 初始化交互系统
    const { bindEvents, unbindEvents } = useInteraction(
      canvasRef,
      viewportRef,
      props.canvasStore
    );

    const zoomIn = () => {
      const newScale = Math.min(scale.value * 1.1, 3);
      props.canvasStore.setCamera({ scale: newScale });
    };

    const zoomOut = () => {
      const newScale = Math.max(scale.value * 0.9, 0.1);
      props.canvasStore.setCamera({ scale: newScale });
    };

    onMounted(() => {
      startRenderLoop();
      bindEvents();
    });

    onUnmounted(() => {
      stopRenderLoop();
      unbindEvents();
    });

    return {
      canvasRef,
      viewportRef,
      scale,
      zoomIn,
      zoomOut
    };
  }
};
</script>

<style scoped>
#viewport {
  flex: 1;
  position: relative;
  background: #f5f5f5;
  overflow: hidden;
  cursor: default;
}

#viewport.mode-pan {
  cursor: grab;
}

#viewport.mode-pan:active {
  cursor: grabbing;
}

#viewport.mode-draw {
  cursor: crosshair;
}

#viewport.mode-pen {
  cursor: crosshair;
}

.canvas-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

#app-canvas {
  display: block;
  background: #ffffff;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
}

/* 缩放控制 */
.zoom-controls {
  position: absolute;
  top: 16px;
  right: 56px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #ffffff;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.zoom-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.zoom-value {
  font-size: 13px;
  color: #333;
  min-width: 40px;
  text-align: center;
  font-weight: 500;
}

/* 星形按钮 */
.star-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  background: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #666;
  transition: all 0.2s;
}

.star-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.star-btn svg {
  width: 18px;
  height: 18px;
}
</style>