<script lang="ts">
import { defineComponent, cloneVNode, type VNode } from 'vue';

export default defineComponent({
    name: 'VNodeRenderer',
    props: {
        VNode: {
            type: Object as () => VNode,
            required: true,
        },
    },
    setup(props) {
        // 返回一个渲染函数，直接返回克隆后的 VNode
        return () => {
            // 克隆以保证当前应用的组件解析上下文正确
            return cloneVNode(props.VNode);
        };
    },
});
</script>
