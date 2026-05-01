<template>
  <div class="node-list">
    <!-- 按group_id的第一个元素分组显示节点 -->
    <div v-for="(group, groupId) in groupedNodes" :key="groupId" class="node-group">
      <h3 class="group-title">{{ getGroupName(groupId) }}</h3>
      <div class="node-items">
        <NodeItem
          v-for="node in group.nodes"
          :key="node.id"
          :node="node"
          :show-node-details="showNodeDetails"
          :show-node-rate="showNodeRate"
          :allow-view-node-info="allowViewNodeInfo"
          @show-detail="showNodeDetail"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import NodeItem from './NodeItem.vue';

// 定义组件属性
const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  },
  showNodeDetails: {
    type: Boolean,
    default: false
  },
  showNodeRate: {
    type: Boolean,
    default: false
  },
  allowViewNodeInfo: {
    type: Boolean,
    default: false
  }
});

// 定义事件发射
const emit = defineEmits(['showDetail']);

const names = [
  {
    id: '1',
    name: ''
  },
  {
    id: '2',
    name: ''
  },
  {
    id: '3',
    name: ''
  },
]

const getGroupName = (id) => {
  let name = '';
  const group = names.find((v) => v.id == id);
  if (group) {
    name = group.name;
  }
  return name;
}

// 按group_id的第一个元素分组节点
const groupedNodes = computed(() => {
  const groups = {};

  // 按照group_id的第一个元素进行分组
  props.nodes.forEach(node => {
    if (node.group_id && Array.isArray(node.group_id) && node.group_id.length > 0) {
      const primaryGroupId = node.group_id[0]; // 使用第一个group_id作为主分组

      if (!groups[primaryGroupId]) {
        groups[primaryGroupId] = {
          id: primaryGroupId,
          nodes: []
        };
      }
      groups[primaryGroupId].nodes.push(node);
    } else {
      // 如果没有group_id，放入默认分组
      if (!groups['default']) {
        groups['default'] = {
          id: 'default',
          nodes: []
        };
      }
      groups['default'].nodes.push(node);
    }
  });

  return groups;
});

// 显示节点详情
const showNodeDetail = (node) => {
  emit('showDetail', node);
};
</script>

<style lang="scss" scoped>
.node-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.node-group {
  .group-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--border-color);
  }
}

.node-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .node-items {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .node-items {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
