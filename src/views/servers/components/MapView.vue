<script setup>
import {ref, onMounted, onBeforeUnmount, watch, computed} from "vue";
import * as echarts from "echarts";
import worldJson from "./json/world.json";
import locationsData from "./json/locations.json";
import { useStore } from "vuex"; // 导入地理位置数据

// 定义emit事件
const emit = defineEmits(['show-detail']);

// 定义props
const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  }
});

const store = useStore();

// 节点选择器相关状态
const showNodeSelector = ref(false);
const selectedLocationNodes = ref([]);
const selectedLocationName = ref('');

// 分组名称映射
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
  }
];

const getGroupName = (id) => {
  // 确保id是字符串类型
  const strId = String(id);
  const group = names.find((v) => v.id === strId);
  return group ? group.name : '其它';
};

// 计算属性：按分组组织选中的节点
const groupedSelectedNodes = computed(() => {
  // 按group_id对节点进行分组
  const groupedNodes = {};
  selectedLocationNodes.value.forEach(node => {
    if (node.group_id && Array.isArray(node.group_id) && node.group_id.length > 0) {
      const primaryGroupId = node.group_id[0]; // 使用第一个group_id作为主分组
      if (!groupedNodes[primaryGroupId]) {
        groupedNodes[primaryGroupId] = [];
      }
      groupedNodes[primaryGroupId].push(node);
    } else {
      // 如果没有group_id，放入默认分组
      if (!groupedNodes['default']) {
        groupedNodes['default'] = [];
      }
      groupedNodes['default'].push(node);
    }
  });

  // 转换为数组格式并排序
  const groupedNodesArray = [];
  Object.keys(groupedNodes).forEach(groupId => {
    const groupNodes = groupedNodes[groupId];
    const groupName = getGroupName(groupId);

    if (groupNodes.length > 0) {
      groupedNodesArray.push({
        groupId: groupId,
        groupName: groupName,
        nodes: groupNodes
      });
    }
  });

  // 按groupId排序，default放在最后
  groupedNodesArray.sort((a, b) => {
    if (a.groupId === 'default') return 1;
    if (b.groupId === 'default') return -1;
    return a.groupId.localeCompare(b.groupId);
  });

  return groupedNodesArray;
});

const chartRef = ref(null);
let chartInstance = null;

const isMobile = computed(() => window.innerWidth < 768);
const isDarkTheme = computed(() => store.getters.currentTheme === 'dark');

// 节点地理位置映射
const nodeLocations = locationsData.locations;

// 关闭节点选择器
const closeNodeSelector = () => {
  showNodeSelector.value = false;
  selectedLocationNodes.value = [];
  selectedLocationName.value = '';
};

// 选择节点
const selectNode = (node) => {
  emit('show-detail', node);
  closeNodeSelector();
};

// 处理节点数据，转换为地图需要的格式
const processNodesData = () => {
  // 按地区分组节点
  const nodesByLocation = {};

  props.nodes.forEach(node => {
    // 从节点名称中提取地理位置关键词
    // 先尝试匹配常用地名
    let locationName = "未知";
    const locationKeywords = ["香港", "美国", "新加坡", "俄罗斯", "日本", "韩国", "台湾", "英国", "德国", "法国"];

    for (const keyword of locationKeywords) {
      if (node.name.includes(keyword)) {
        locationName = keyword;
        break;
      }
    }

    // 如果没有匹配到常用地名，使用原来的逻辑
    if (locationName === "未知") {
      locationName = node.name.replace(/\d+/g, '').trim();
    }

    if (!nodesByLocation[locationName]) {
      nodesByLocation[locationName] = [];
    }
    nodesByLocation[locationName].push(node);
  });

  // 生成节点数据
  const result = [];

  // 遍历每个地区
  Object.keys(nodesByLocation).forEach(locationName => {
    const nodesInLocation = nodesByLocation[locationName];

    // 获取节点地理位置
    let coordinates = [0, 0];
    if (nodeLocations[locationName]) {
      coordinates = nodeLocations[locationName];
    } else {
      // 如果找不到精确匹配，尝试模糊匹配
      const matchedLocation = Object.keys(nodeLocations).find(location =>
        locationName.includes(location) || location.includes(locationName)
      );
      if (matchedLocation) {
        coordinates = nodeLocations[matchedLocation];
      }
    }

    // 如果还是没有找到坐标，使用默认坐标
    if (coordinates[0] === 0 && coordinates[1] === 0) {
      coordinates = [Math.random() * 360 - 180, Math.random() * 170 - 85];
    }

    // 按group_id对节点进行分组
    const groupedNodes = {};
    nodesInLocation.forEach(node => {
      if (node.group_id && Array.isArray(node.group_id) && node.group_id.length > 0) {
        const primaryGroupId = node.group_id[0]; // 使用第一个group_id作为主分组
        if (!groupedNodes[primaryGroupId]) {
          groupedNodes[primaryGroupId] = [];
        }
        groupedNodes[primaryGroupId].push(node);
      } else {
        // 如果没有group_id，放入默认分组
        if (!groupedNodes['default']) {
          groupedNodes['default'] = [];
        }
        groupedNodes['default'].push(node);
      }
    });

    // 为该地区创建一个聚合节点，包含所有子节点信息
    result.push({
      name: locationName,
      value: [...coordinates, nodesInLocation.length], // [经度, 纬度, 节点数量]
      status: nodesInLocation.some(node => node.is_online === 1), // 只要有任何一个在线就是true
      locationNodes: nodesInLocation, // 保存该地区所有节点信息
      groupedNodes: groupedNodes, // 保存按group_id分组的节点信息
      locationName: locationName, // 保存地区名称
      symbolSize: 12, // 固定大小，比之前稍大一点
      isNodeSeries: true // 自定义标识字段
    });
  });

  return result;
};

// 初始化地图
const initChart = () => {
  if (!chartRef.value) return;

  // 注册地图
  echarts.registerMap("world", worldJson);

  // 如果已有实例，先销毁
  if (chartInstance) {
    chartInstance.dispose();
  }

  chartInstance = echarts.init(chartRef.value);

  // 处理节点数据
  const processedData = processNodesData();

  const option = {
    title: {
      text: "全球节点分布图",
      left: "center",
      textStyle: {
        color: isDarkTheme.value ? 'rgba(255,255,255,.9)' : '#333' // 使用CSS变量适配主题
      }
    },
    tooltip: {
      trigger: "item",
      backgroundColor: 'rgba(var(--card-background-rgb), 0.9)',
      borderColor: 'var(--border-color)',
      textStyle: {
        color: 'var(--text-color)'
      },
      formatter: (params) => {
        // 检查是否是我们节点系列的数据
        if (params.seriesName === '节点' && params.data && params.data.isNodeSeries) {
          let tooltipContent = `<strong>${params.data.locationName}地区 (${params.data.locationNodes.length}个节点):</strong><br/>`;

          // 按分组显示节点
          Object.keys(params.data.groupedNodes).forEach(groupId => {
            const groupNodes = params.data.groupedNodes[groupId];
            const groupName = getGroupName(groupId);

            // 只有当分组有节点时才显示
            if (groupNodes.length > 0) {
              tooltipContent += `<br/><strong>${groupName}组:</strong><br/>`;
              groupNodes.forEach(node => {
                const nodeStatus = node.is_online === 1 ? "在线" : "离线";
                const nodeStyle = node.is_online === 1 ? "color: #4caf50;" : "color: #ccc;";
                tooltipContent += `<span style="${nodeStyle}">● ${node.name}: ${nodeStatus}</span><br/>`;
              });
            }
          });

          return tooltipContent;
        }
        return params.name;
      },
    },
    geo: {
      map: "world",
      roam: true, // 支持缩放、拖动
      itemStyle: {
        areaColor: "#e0e0e0",
        borderColor: "#999",
      },
      emphasis: {
        itemStyle: {
          areaColor: "#d1e6fa",
        },
      },
    },
    series: [
      {
        name: "节点", // 系列名称
        type: "effectScatter", // 涟漪效果
        coordinateSystem: "geo",
        data: processedData,
        symbolSize: 12, // 固定大小
        showEffectOn: "render",
        rippleEffect: {
          brushType: "stroke",
        },
        zlevel: 1,
        itemStyle: {
          color: function(params) {
            // 根据节点状态设置颜色
            return params.data.status ? "#4caf50" : "red";
          }
        }
      },
    ],
  };

  chartInstance.setOption(option);

  // 添加点击事件监听器
  chartInstance.on('click', (params) => {
    // 检查是否是我们节点系列的数据
    if (params.seriesName === '节点' && params.data && params.data.isNodeSeries) {
      // 如果该地区只有一个节点，直接显示该节点详情
      if (params.data.locationNodes.length === 1) {
        emit('show-detail', params.data.locationNodes[0]);
      } else {
        // 如果该地区有多个节点，显示节点选择器
        // 创建按分组排序的节点列表
        const groupedNodesArray = [];
        Object.keys(params.data.groupedNodes).forEach(groupId => {
          const groupNodes = params.data.groupedNodes[groupId];
          const groupName = getGroupName(groupId);

          if (groupNodes.length > 0) {
            groupedNodesArray.push({
              groupId: groupId,
              groupName: groupName,
              nodes: groupNodes
            });
          }
        });

        // 按groupId排序，default放在最后
        groupedNodesArray.sort((a, b) => {
          if (a.groupId === 'default') return 1;
          if (b.groupId === 'default') return -1;
          return a.groupId.localeCompare(b.groupId);
        });

        // 展平节点数组用于显示
        const sortedNodes = [];
        groupedNodesArray.forEach(group => {
          sortedNodes.push(...group.nodes);
        });

        selectedLocationNodes.value = sortedNodes;
        selectedLocationName.value = params.data.locationName;
        showNodeSelector.value = true;
      }
    }
  });

  // 自适应
  const handleResize = () => chartInstance.resize();
  window.addEventListener("resize", handleResize);

  // 清理函数
  return () => {
    window.removeEventListener("resize", handleResize);
    // 移除事件监听器
    if (chartInstance) {
      chartInstance.off('click');
    }
  };
};

// 监听nodes变化
watch(() => props.nodes, () => {
  if (chartInstance) {
    initChart();
  }
}, { deep: true });

onMounted(() => {
  const cleanup = initChart();

  // 清理函数
  onBeforeUnmount(() => {
    if (cleanup) cleanup();
    if (chartInstance) {
      chartInstance.dispose();
    }
  });
});

// 如果组件已经挂载且nodes发生变化，重新初始化
onMounted(() => {
  // 组件挂载后如果有数据，初始化图表
  if (props.nodes && props.nodes.length > 0) {
    initChart();
  }
});
</script>

<template>
  <div ref="chartRef" style="width: 100%;" :style="{ height: isMobile ? '50vh' : '600px' }"></div>

  <!-- 节点选择弹窗 -->
  <transition name="fade">
    <div v-if="showNodeSelector" class="node-selector-modal" @click.self="closeNodeSelector">
      <div class="node-selector-content">
        <div class="node-selector-header">
          <h3>选择节点</h3>
          <button class="close-btn" @click="closeNodeSelector">×</button>
        </div>
        <div class="node-selector-body">
          <!-- 按分组显示节点 -->
          <div v-for="(group, index) in groupedSelectedNodes" :key="index" class="node-group">
            <h4 class="group-title">{{ group.groupName }}组</h4>
            <div
                v-for="node in group.nodes"
                :key="node.id"
                class="node-item"
                @click="selectNode(node)"
            >
              <div class="node-info">
                <span class="node-name">{{ node.name }}</span>
                <span class="node-status" :class="{ online: node.is_online === 1 }">
                {{ node.is_online === 1 ? '在线' : '离线' }}
              </span>
              </div>
              <div class="node-details">
                <span class="node-rate">倍率: x{{ node.rate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

</template>

<style lang="scss" scoped>
.node-selector-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.node-selector-content {
  background-color: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.node-selector-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--secondary-text-color);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--text-color);
  }
}

.node-selector-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.node-group {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 8px 0;
  padding: 4px 8px;
  background-color: rgba(var(--theme-color-rgb), 0.1);
  border-radius: 4px;
}

.node-item {
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 8px;
  border: 1px solid var(--border-color);

  &:hover {
    background-color: rgba(var(--theme-color-rgb), 0.1);
    border-color: var(--theme-color);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.node-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.node-name {
  font-weight: 500;
  color: var(--text-color);
}

.node-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background-color: #ccc;
  color: white;

  &.online {
    background-color: #4caf50;
  }
}

.node-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-rate {
  font-size: 12px;
  color: var(--secondary-text-color);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
