<script lang="ts">
import { defineComponent, ref, watch } from '@vue/runtime-core';
import { inject } from 'vue';
import { useRouter } from 'vue-router';
import { ImportServiceKey, ImportState } from '../../import.service';

export default defineComponent({

  setup() {
    const importService = inject(ImportServiceKey)!
    const importModes = importService.getSupportedBanks()
    const router = useRouter()

    const importMode = ref<string | undefined>(undefined)

    watch(importModes, (modes) => importMode.value = modes[0])

    const importFileRef = ref<HTMLInputElement>()

    const startImport = async () => {
      if (importFileRef.value?.files?.length !== 1) return alert('please select an csv file')

      if (!importMode.value) return alert('select import mode')

      const { id: importId, state } = importService.startParsing(importMode.value, 'csv', importFileRef.value.files[0])
      console.log('started new import ' + importId)

      const sub = state.subscribe(state => {
        if (state.state === 'staged') {
          router.push(`/import/staged/${importId}`)
          sub?.unsubscribe()
        }
      })
    }

    return {
      startImport,
      importFileRef,
      importMode,
      importModes
    }
  }
})
</script>

<template>
  <main>
    <h1>CSV Import</h1>
    <select v-model="importMode">
      <option v-for="mode of importModes" :key="mode">{{ mode }}</option>
    </select>
    <input ref="importFileRef" type="file" accept=".csv">
    <button @click="startImport">Start Import</button>
  </main>
</template>

<style scoped lang="scss">
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
}
</style>
