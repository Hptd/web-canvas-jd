<template>
  <div id="toolbar">
    <!-- 选择/平移 组合按钮 -->
    <div class="tool-group">
      <button
        :class="['tool-btn', 'main-btn', { active: mode === 'select' || mode === 'pan' }]"
        @click="handleMainToolClick"
        title="选择"
      >
        <svg v-if="mode === 'pan'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
        </svg>
      </button>
      <button
        class="tool-btn dropdown-btn"
        @click.stop="toggleDropdown('select')"
        title="更多选项"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <!-- 二级菜单 -->
      <div v-if="showDropdown === 'select'" class="dropdown-menu">
        <div
          :class="['dropdown-item', { active: mode === 'select' }]"
          @click="selectMode('select')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
          </svg>
          <span>选择</span>
        </div>
        <div
          :class="['dropdown-item', { active: mode === 'pan' }]"
          @click="selectMode('pan')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
          </svg>
          <span>平移</span>
        </div>
      </div>
    </div>

    <!-- 载入模块 组合按钮 -->
    <div class="tool-group">
      <button
        class="tool-btn main-btn"
        @click="showImportMenu"
        title="载入"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </button>
      <button
        class="tool-btn dropdown-btn"
        @click.stop="toggleDropdown('import')"
        title="更多导入选项"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <!-- 载入二级菜单 -->
      <div v-if="showDropdown === 'import'" class="dropdown-menu">
        <div class="dropdown-item" @click="uploadImage">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>上传图片</span>
        </div>
        <div class="dropdown-item" @click="uploadVideo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
            <line x1="7" y1="2" x2="7" y2="22"/>
            <line x1="17" y1="2" x2="17" y2="22"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <line x1="2" y1="7" x2="7" y2="7"/>
            <line x1="2" y1="17" x2="7" y2="17"/>
            <line x1="17" y1="17" x2="22" y2="17"/>
            <line x1="17" y1="7" x2="22" y2="7"/>
          </svg>
          <span>上传视频</span>
        </div>
        <div class="dropdown-item" @click="createArtboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <span>创建画板</span>
        </div>
      </div>
    </div>

    <!-- 形状生成按钮 -->
    <div class="tool-group">
      <button
        :class="['tool-btn', 'main-btn', { active: isShapeMode }]"
        @click="showShapeMenu"
        title="形状"
      >
        <svg v-if="currentShape" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="currentShape === 'rect'" d="M3 3h18v18H3z"/>
          <circle v-else-if="currentShape === 'circle'" cx="12" cy="12" r="9"/>
          <path v-else-if="currentShape === 'triangle'" d="M12 3l9 18H3z"/>
          <path v-else-if="currentShape === 'star'" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
        </svg>
      </button>
      <button
        class="tool-btn dropdown-btn"
        @click.stop="toggleDropdown('shape')"
        title="更多形状"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <!-- 形状二级菜单 -->
      <div v-if="showDropdown === 'shape'" class="dropdown-menu shape-menu">
        <div class="shape-menu-title">形状</div>
        <div class="shape-grid">
          <div
            v-for="shape in shapeList"
            :key="shape.type"
            :class="['shape-item', { active: currentShape === shape.type }]"
            @click.stop="selectShape(shape.type)"
            :title="shape.name"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path v-if="shape.type === 'rect'" d="M3 3h18v18H3z"/>
              <circle v-else-if="shape.type === 'circle'" cx="12" cy="12" r="9"/>
              <path v-else-if="shape.type === 'triangle'" d="M12 3l9 18H3z"/>
              <path v-else-if="shape.type === 'star'" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="imageInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleImageSelected"
    />
    <input
      ref="videoInput"
      type="file"
      accept="video/*"
      style="display: none"
      @change="handleVideoSelected"
    />

    <!-- 画笔/钢笔 组合按钮 -->
    <div class="tool-group">
      <button
        :class="['tool-btn', 'main-btn', { active: isDrawingMode }]"
        @click="handleDrawingToolClick"
        :title="currentDrawingTool === 'brush' ? '画笔' : '钢笔'"
      >
        <!-- 画笔图标 -->
        <svg v-if="currentDrawingTool === 'brush'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 12l-8.5 8.5a2.121 2.121 0 0 1-3 0l-2-2a2.121 2.121 0 0 1 0-3L13 7"/>
          <path d="M15 9l5-5"/>
          <path d="M19 5l2 2"/>
          <path d="M12 14l2 2"/>
          <path d="M9 17l2 2"/>
        </svg>
        <!-- 钢笔图标 -->
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
          <path d="M2 2l7.586 7.586"/>
          <circle cx="11" cy="11" r="2"/>
        </svg>
      </button>
      <button
        class="tool-btn dropdown-btn"
        @click.stop="toggleDropdown('drawing')"
        title="更多绘图工具"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <!-- 绘图工具二级菜单 -->
      <div v-if="showDropdown === 'drawing'" class="dropdown-menu">
        <div
          :class="['dropdown-item', { active: currentDrawingTool === 'brush' }]"
          @click="selectDrawingTool('brush')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 12l-8.5 8.5a2.121 2.121 0 0 1-3 0l-2-2a2.121 2.121 0 0 1 0-3L13 7"/>
            <path d="M15 9l5-5"/>
            <path d="M19 5l2 2"/>
            <path d="M12 14l2 2"/>
            <path d="M9 17l2 2"/>
          </svg>
          <span>画笔</span>
        </div>
        <div
          :class="['dropdown-item', { active: currentDrawingTool === 'pen' }]"
          @click="selectDrawingTool('pen')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            <path d="M2 2l7.586 7.586"/>
            <circle cx="11" cy="11" r="2"/>
          </svg>
          <span>钢笔</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';

/**
 * 形状配置接口 - 可扩展更多形状
 * 要添加新形状，只需在此数组中添加配置项
 */
const SHAPE_CONFIGS = [
  {
    type: 'rect',
    name: '矩形',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/>',
    defaultSize: { w: 100, h: 100 }
  },
  {
    type: 'circle',
    name: '圆形',
    icon: '<circle cx="12" cy="12" r="9"/>',
    defaultSize: { w: 100, h: 100 }
  },
  {
    type: 'triangle',
    name: '三角形',
    icon: '<path d="M12 3l9 18H3z"/>',
    defaultSize: { w: 100, h: 87 }
  },
  {
    type: 'star',
    name: '星形',
    icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    defaultSize: { w: 100, h: 100 }
  }
];

export default {
  name: 'CanvasToolbar',
  props: {
    mode: {
      type: String,
      default: 'select'
    },
    selectedId: {
      type: String,
      default: null
    }
  },
  emits: ['mode-change', 'add-element', 'export'],
  setup(props, { emit }) {
    const showDropdown = ref(null);
    const imageInput = ref(null);
    const videoInput = ref(null);
    const currentShape = ref('rect');
    const currentDrawingTool = ref('brush'); // brush | pen

    // 形状列表 - 从配置中读取，方便后期扩展
    const shapeList = computed(() => SHAPE_CONFIGS);

    // 判断是否处于形状模式
    const isShapeMode = computed(() => {
      return SHAPE_CONFIGS.some(s => s.type === props.mode);
    });

    // 判断是否处于绘图模式
    const isDrawingMode = computed(() => {
      return props.mode === 'draw' || props.mode === 'pen';
    });

    const toggleDropdown = (menu) => {
      showDropdown.value = showDropdown.value === menu ? null : menu;
    };

    const selectMode = (mode) => {
      emit('mode-change', mode);
      showDropdown.value = null;
    };

    const switchMode = (mode) => {
      emit('mode-change', mode);
    };

    const handleMainToolClick = () => {
      if (props.mode === 'pan') {
        emit('mode-change', 'select');
      } else if (props.mode !== 'select') {
        emit('mode-change', 'select');
      }
    };

    const getCenter = () => {
      return { x: 400, y: 300 };
    };

    // 载入模块功能
    const showImportMenu = () => {
      showDropdown.value = 'import';
    };

    const uploadImage = () => {
      imageInput.value?.click();
      showDropdown.value = null;
    };

    const uploadVideo = () => {
      videoInput.value?.click();
      showDropdown.value = null;
    };

    const handleImageSelected = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const c = getCenter();
            // 使用图片原始宽高像素尺寸
            const originalWidth = img.naturalWidth || img.width;
            const originalHeight = img.naturalHeight || img.height;
            emit('add-element', {
              type: 'image',
              name: file.name.replace(/\.[^/.]+$/, ''),
              content: event.target.result,
              x: c.x - originalWidth / 2,
              y: c.y - originalHeight / 2,
              w: originalWidth,
              h: originalHeight,
              parentId: props.selectedId
            });
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    };

    const handleVideoSelected = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const video = document.createElement('video');
          video.onloadedmetadata = () => {
            const c = getCenter();
            // 使用视频原始宽高像素尺寸
            const originalWidth = video.videoWidth;
            const originalHeight = video.videoHeight;
            emit('add-element', {
              type: 'video',
              name: file.name.replace(/\.[^/.]+$/, ''),
              content: event.target.result,
              x: c.x - originalWidth / 2,
              y: c.y - originalHeight / 2,
              w: originalWidth,
              h: originalHeight,
              parentId: props.selectedId
            });
          };
          video.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    };

    const createArtboard = () => {
      const c = getCenter();
      emit('add-element', {
        type: 'artboard',
        name: '新画板',
        x: c.x - 200,
        y: c.y - 150,
        w: 400,
        h: 300
      });
      showDropdown.value = null;
    };

    // 形状功能
    const showShapeMenu = () => {
      showDropdown.value = 'shape';
    };

    const selectShape = (shapeType) => {
      currentShape.value = shapeType;
      const shapeConfig = SHAPE_CONFIGS.find(s => s.type === shapeType);
      
      if (shapeConfig) {
        const c = getCenter();
        emit('add-element', {
          type: shapeType,
          name: shapeConfig.name,
          x: c.x - shapeConfig.defaultSize.w / 2,
          y: c.y - shapeConfig.defaultSize.h / 2,
          w: shapeConfig.defaultSize.w,
          h: shapeConfig.defaultSize.h,
          parentId: null
        });
      }
      
      showDropdown.value = null;
    };

    // 点击外部关闭下拉菜单
    const handleClickOutside = (e) => {
      const toolbar = document.getElementById('toolbar');
      if (toolbar && !toolbar.contains(e.target)) {
        showDropdown.value = null;
      }
    };

    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    // 绘图工具功能
    const handleDrawingToolClick = () => {
      if (currentDrawingTool.value === 'brush') {
        emit('mode-change', 'draw');
      } else {
        emit('mode-change', 'pen');
      }
    };

    const selectDrawingTool = (tool) => {
      currentDrawingTool.value = tool;
      const mode = tool === 'brush' ? 'draw' : 'pen';
      emit('mode-change', mode);
      showDropdown.value = null;
    };

    const addText = () => {
      const c = getCenter();
      emit('add-element', {
        type: 'text',
        name: '文本',
        content: '双击图层编辑',
        x: c.x,
        y: c.y,
        w: 150,
        h: 40,
        parentId: props.selectedId
      });
    };

    return {
      showDropdown,
      imageInput,
      videoInput,
      currentShape,
      currentDrawingTool,
      shapeList,
      isShapeMode,
      isDrawingMode,
      toggleDropdown,
      selectMode,
      switchMode,
      handleMainToolClick,
      handleDrawingToolClick,
      selectDrawingTool,
      addText,
      showImportMenu,
      uploadImage,
      uploadVideo,
      handleImageSelected,
      handleVideoSelected,
      createArtboard,
      showShapeMenu,
      selectShape
    };
  }
};
</script>

<style scoped>
#toolbar {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 100;
}

.tool-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tool-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #666;
}

.tool-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.tool-btn.active {
  background: #e6f7ff;
  color: #1890ff;
}

.tool-btn svg {
  width: 18px;
  height: 18px;
}

.tool-btn .text-icon {
  font-size: 16px;
  font-weight: 600;
  font-family: system-ui, sans-serif;
}

.main-btn {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.dropdown-btn {
  height: 20px;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.dropdown-btn svg {
  width: 12px;
  height: 12px;
}

/* 二级菜单 */
.dropdown-menu {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 8px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px;
  min-width: 140px;
  z-index: 101;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  color: #333;
  font-size: 13px;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item.active {
  background: #e6f7ff;
  color: #1890ff;
}

.dropdown-item svg {
  width: 16px;
  height: 16px;
}

.dropdown-item span {
  flex: 1;
}

/* 形状菜单特殊样式 */
.shape-menu {
  min-width: 160px;
  padding: 8px;
}

.shape-menu-title {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  padding: 0 4px;
}

.shape-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.shape-item {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  color: #666;
}

.shape-item:hover {
  background: #f5f5f5;
}

.shape-item.active {
  background: #e6f7ff;
  color: #1890ff;
}

.shape-item svg {
  width: 18px;
  height: 18px;
}
</style>
