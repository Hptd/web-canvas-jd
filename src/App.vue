<template>
  <div id="app">
    <!-- 左侧边栏 -->
    <CanvasSidebar
      :elements="canvasStore.state.elements"
      :selected-id="canvasStore.state.selectedId"
      :selected-ids="canvasStore.state.selectedIds"
      @select="canvasStore.setSelectedId"
      @toggle-selection="canvasStore.toggleSelection"
      @select-range="canvasStore.selectRange"
      @delete="canvasStore.deleteElement"
      @toggle-hide="canvasStore.toggleHide"
      @group="canvasStore.groupElements"
      @ungroup="canvasStore.ungroupElements"
      @update-element="canvasStore.updateElement"
    />
    
    <!-- 主内容区 -->
    <div id="main">
      <!-- 悬浮工具栏 -->
      <CanvasToolbar
        :mode="canvasStore.state.mode"
        :selected-id="canvasStore.state.selectedId"
        @mode-change="canvasStore.setMode"
        @add-element="canvasStore.addElement"
        @export="handleExport"
      />
      
      <!-- 画布视口 -->
      <CanvasViewport :canvas-store="canvasStore" />
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue';
import canvasStore from '@/store/canvas.js';
import CanvasSidebar from '@/components/Sidebar.vue';
import CanvasToolbar from '@/components/Toolbar.vue';
import CanvasViewport from '@/components/CanvasViewport.vue';

export default {
  name: 'App',
  components: {
    CanvasSidebar,
    CanvasToolbar,
    CanvasViewport
  },
  setup() {
    const handleExport = () => {
      canvasStore.exportArtboard(canvasStore.state.selectedId);
    };

    // 全局键盘事件处理
    const handleGlobalKeyDown = (event) => {
      // 禁用默认的 Ctrl+G 行为
      if (event.ctrlKey && event.key === 'g') {
        event.preventDefault();
        
        if (event.shiftKey) {
          // Ctrl + Shift + G: 解散组
          canvasStore.ungroupElements();
        } else {
          // Ctrl + G: 打组
          canvasStore.groupElements();
        }
      }
    };

    onMounted(() => {
      canvasStore.initDefaultData();
      // 添加全局键盘事件监听
      document.addEventListener('keydown', handleGlobalKeyDown);
    });

    onUnmounted(() => {
      // 移除全局键盘事件监听
      document.removeEventListener('keydown', handleGlobalKeyDown);
    });

    return {
      canvasStore,
      handleExport
    };
  }
};
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
  background: #f5f5f5;
}

#app {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

#main {
  flex: 1;
  position: relative;
  display: flex;
  overflow: hidden;
}
</style>
