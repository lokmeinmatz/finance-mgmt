<script lang="ts">
import { defineComponent, ref, watch } from '@vue/runtime-core';
import { BankId } from '../../../src/util'
import { ImportService } from '../import.service';

export default defineComponent({

  setup() {
    const importModes = ref<BankId[]>([])

    ImportService.getCsvBankIds().then(ids => importModes.value = ids)

    const importMode = ref(undefined)

    watch(importModes, (modes) => importMode.value = modes[0])

    const importFileRef = ref<HTMLInputElement>()

    const startImport = async () => {
      if (importFileRef.value?.files?.length !== 1) return alert('please select an csv file')

      const importId = ImportService.startImport(importFileRef.value.files[0], importMode.value)
      console.log('started new import ' + importId)
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
    <button class="pure-button" @click="startImport">Start Import</button>
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
