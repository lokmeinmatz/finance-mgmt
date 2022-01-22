<script lang="ts">
import { defineComponent, ref, watch } from '@vue/runtime-core';
import { useRouter } from 'vue-router';
import { BankId } from '../../../src/util'
import { ImportService, ImportState } from '../import.service';

export default defineComponent({

  setup() {
    const importModes = ref<BankId[]>([])
    const router = useRouter()

    ImportService.getCsvBankIds().then(ids => importModes.value = ids)

    const importMode = ref<BankId | undefined>(undefined)
    const importStatus = ref<ImportState>()

    watch(importModes, (modes) => importMode.value = modes[0])

    const importFileRef = ref<HTMLInputElement>()

    const startImport = async () => {
      if (importFileRef.value?.files?.length !== 1) return alert('please select an csv file')

      if (!importMode.value) return alert('select import mode')

      const importId = ImportService.startImport(importFileRef.value.files[0], importMode.value)
      console.log('started new import ' + importId)

      const sub = ImportService.getImportState(importId)?.subscribe(state => {
        importStatus.value = state
        if (state.type === 'finished') {
          router.push(`/import/staged/${importId}`)
          sub?.unsubscribe()
        }
      })
    }

    return {
      importStatus,
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
    <p v-if="importStatus">{{ importStatus.type }}</p>
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
