<template>
  <div id="sidebar" @contextmenu.prevent>
    <!-- 顶部下拉 -->
    <div class="sidebar-header">
      <div class="dropdown">
        <span>未命名文件</span>
        <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
    </div>

    <!-- 图层标题 -->
    <div class="layer-title">图层</div>

    <!-- 图层列表 -->
    <div id="layer-list">
      <template v-for="item in layerTree" :key="item.id">
        <div
          :class="['layer-item', { active: isItemSelected(item.id), group: item.isGroup }]"
          :style="{ paddingLeft: 12 + item.depth * 16 + 'px' }"
          @click.stop="handleItemClick(item.id, $event)"
          @dblclick="handleDoubleClick(item)"
          @contextmenu.stop.prevent="handleContextMenu(item.id, $event)"
        >
          <!-- 展开/折叠图标 -->
          <span v-if="item.isGroup" class="expand-icon" @click.stop="toggleExpand(item)">
            <svg v-if="item.expanded !== false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <path d="M6 9l6 6 6-6"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <path d="M9 6l6 6-6 6"/>
            </svg>
          </span>
          <span v-else class="expand-placeholder"></span>

          <!-- 图层图标/预览 -->
          <div class="layer-thumb">
            <template v-if="item.type === 'image' && item.content">
              <img :src="item.content" alt="" />
            </template>
            <template v-else-if="item.type === 'artboard'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
            </template>
            <template v-else-if="item.type === 'group'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </template>
            <template v-else-if="item.type === 'text'">
              <span class="type-icon">T</span>
            </template>
            <template v-else-if="item.type === 'video'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </template>
            <template v-else-if="item.type === 'path'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                <path d="M2 2l7.586 7.586"/>
                <circle cx="11" cy="11" r="2"/>
              </svg>
            </template>
            <template v-else-if="item.type === 'rect'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
            </template>
            <template v-else-if="item.type === 'circle'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9"/>
              </svg>
            </template>
            <template v-else-if="item.type === 'triangle'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3l9 18H3z"/>
              </svg>
            </template>
            <template v-else-if="item.type === 'star'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
              </svg>
            </template>
            <template v-else-if="item.type === 'penPath'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                <circle cx="11" cy="11" r="2"/>
              </svg>
            </template>
            <template v-else>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </template>
          </div>

          <!-- 图层名称 -->
          <span class="layer-name">{{ item.name }}</span>

          <!-- 可见性图标 -->
          <div class="layer-visibility">
            <svg v-if="item.visible !== false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
        </div>
      </template>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.show"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div class="context-menu-item" @click="handleGroupFromMenu">
        <span>创建编组</span>
        <span class="shortcut">Ctrl + G</span>
      </div>
      <div class="context-menu-item" @click="handleUngroupFromMenu">
        <span>解散编组</span>
        <span class="shortcut">Ctrl + Shift + G</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleDeleteFromMenu">
        <span>删除</span>
        <span class="shortcut">Delete</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue';

export default {
  name: 'CanvasSidebar',
  props: {
    elements: {
      type: Array,
      required: true
    },
    selectedId: {
      type: String,
      default: null
    },
    selectedIds: {
      type: Array,
      default: () => []
    }
  },
  emits: ['select', 'toggle-selection', 'select-range', 'delete', 'toggle-hide', 'group', 'ungroup', 'update-element', 'keydown-g', 'keydown-shift-g'],
  setup(props, { emit }) {
    const expandedGroups = ref(new Set());
    
    // 右键菜单状态
    const contextMenu = ref({
      show: false,
      x: 0,
      y: 0,
      targetId: null
    });

    // 构建图层树
    const layerTree = computed(() => {
      const buildTree = (parentId, depth) => {
        const children = props.elements
          .filter(e => e.parentId === parentId)
          .sort((a, b) => b.zIndex - a.zIndex);
        
        let result = [];
        children.forEach(el => {
          const expanded = expandedGroups.value.has(el.id);
          result.push({ ...el, depth, expanded });
          if (el.isGroup && expanded !== false) {
            result = result.concat(buildTree(el.id, depth + 1));
          }
        });
        return result;
      };
      
      return buildTree(null, 0);
    });

    // 检查元素是否被选中
    const isItemSelected = (id) => {
      return props.selectedIds.includes(id);
    };

    // 处理图层项点击事件
    const handleItemClick = (id, event) => {
      // 隐藏右键菜单
      contextMenu.value.show = false;
      
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+点击：切换选中状态
        emit('toggle-selection', id);
      } else if (event.shiftKey) {
        // Shift+点击：范围选择
        emit('select-range', id);
      } else {
        // 普通点击：单选
        emit('select', id);
      }
    };

    // 处理右键菜单
    const handleContextMenu = (id, event) => {
      // 如果右键点击的元素未被选中，则先选中它
      if (!props.selectedIds.includes(id)) {
        emit('select', id);
      }
      
      // 显示右键菜单
      contextMenu.value = {
        show: true,
        x: event.clientX,
        y: event.clientY,
        targetId: id
      };
    };

    // 从菜单执行打组
    const handleGroupFromMenu = () => {
      contextMenu.value.show = false;
      emit('group');
    };

    // 从菜单执行解散组
    const handleUngroupFromMenu = () => {
      contextMenu.value.show = false;
      emit('ungroup');
    };

    // 从菜单执行删除
    const handleDeleteFromMenu = () => {
      contextMenu.value.show = false;
      // 删除所有选中的元素
      props.selectedIds.forEach(id => {
        emit('delete', id);
      });
    };

    // 点击外部关闭右键菜单
    const closeContextMenu = () => {
      contextMenu.value.show = false;
    };

    // 键盘事件处理
    const handleKeyDown = (event) => {
      // 只在侧边栏有焦点时处理
      if (!document.getElementById('sidebar')?.contains(document.activeElement)) {
        return;
      }
      
      // Ctrl + G: 打组
      if (event.ctrlKey && !event.shiftKey && event.key === 'g') {
        event.preventDefault();
        emit('group');
      }
      
      // Ctrl + Shift + G: 解散组
      if (event.ctrlKey && event.shiftKey && event.key === 'g') {
        event.preventDefault();
        emit('ungroup');
      }
    };

    const setSelectedId = (id) => {
      emit('select', id);
    };

    const toggleExpand = (item) => {
      if (expandedGroups.value.has(item.id)) {
        expandedGroups.value.delete(item.id);
      } else {
        expandedGroups.value.add(item.id);
      }
    };

    const handleDoubleClick = (item) => {
      if (item.type === 'text') {
        const txt = prompt('编辑文本:', item.content);
        if (txt !== null) {
          emit('update-element', item.id, { content: txt });
        }
      } else {
        const nm = prompt('重命名:', item.name);
        if (nm !== null) {
          emit('update-element', item.id, { name: nm });
        }
      }
    };

    // 全局点击事件监听（关闭右键菜单）
    const handleGlobalClick = () => {
      closeContextMenu();
    };

    // 组件挂载时添加全局事件监听
    onMounted(() => {
      document.addEventListener('click', handleGlobalClick);
      document.addEventListener('keydown', handleKeyDown);
    });

    // 组件卸载时移除全局事件监听
    onUnmounted(() => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
    });

    return {
      layerTree,
      contextMenu,
      isItemSelected,
      handleItemClick,
      handleContextMenu,
      handleGroupFromMenu,
      handleUngroupFromMenu,
      handleDeleteFromMenu,
      setSelectedId,
      toggleExpand,
      handleDoubleClick
    };
  }
};
</script>

<style scoped>
#sidebar {
  width: 240px;
  background: #ffffff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.sidebar-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
}

.dropdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.dropdown-icon {
  width: 16px;
  height: 16px;
  color: #999;
}

.layer-title {
  padding: 12px 16px 8px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

#layer-list {
  flex: 1;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
  gap: 8px;
}

.layer-item:hover {
  background: #f5f5f5;
}

.layer-item.active {
  background: #e6f7ff;
}

.expand-icon {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  cursor: pointer;
}

.expand-placeholder {
  width: 12px;
}

.layer-thumb {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.layer-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.layer-thumb svg {
  width: 16px;
  height: 16px;
  color: #666;
}

.layer-thumb .type-icon {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.layer-name {
  flex: 1;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-visibility {
  width: 14px;
  height: 14px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layer-visibility svg {
  width: 14px;
  height: 14px;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 180px;
  z-index: 1000;
}

.context-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 13px;
  color: #333;
}

.context-menu-item:hover {
  background: #f5f5f5;
}

.context-menu-item .shortcut {
  font-size: 11px;
  color: #999;
  margin-left: 16px;
}

.context-menu-divider {
  height: 1px;
  background: #e8e8e8;
  margin: 4px 0;
}
</style>