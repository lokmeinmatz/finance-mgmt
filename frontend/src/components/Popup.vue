<script lang="ts">
import { Subject } from "rxjs";
import { Subscription } from "rxjs";
import {  defineComponent, markRaw, onBeforeUpdate, onMounted, onUnmounted, PropType, ref, shallowRef, toRaw } from "vue";

export default defineComponent({
  props: {
    open: Boolean as PropType<boolean>
  },
  emits: ['update:open'],
  setup(props, ctx) {

    const closeModal = () => {
      ctx.emit('update:open')
    }

    return {
      closeModal
    }
  }
})
</script>

<template>
  <teleport to="body">
    <div class="popup-root" v-if="open" @click.self="closeModal">
      <article>
        <slot></slot>
      </article>
    </div>
  </teleport>
</template>

<style lang="scss" scoped>
@keyframes fade-in-popup-root {
  from {
    background-color: rgba(0, 0, 0, 0.0);
  }
  to {
    background-color: rgba(0, 0, 0, 0.3);
  }
}
.popup-root {
  position: fixed;
  inset: 0 0 0 0;
  background-color: rgba(0, 0, 0, 0.3);
  animation: fade-in-popup-root 0.3s ease-in-out forwards;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
