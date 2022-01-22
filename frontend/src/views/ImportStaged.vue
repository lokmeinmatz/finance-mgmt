<script lang="ts">
import { defineComponent, onUnmounted, ref } from '@vue/runtime-core';
import { useRoute } from 'vue-router';
import { CsvParseResponse } from '../../../src/server';
import { ImportService, ImportState } from '../import.service';
import { formatDate } from '../util';


export default defineComponent({
  methods: {
    formatDate
  },
  setup() {
    
    const id = useRoute().params.id

    const importState = ref<ImportState>()
    const data = ref<CsvParseResponse>()
    const obs = ImportService.getImportState(typeof id === 'string' ? id : '')
    console.log(obs)

    function onUpdate(s: ImportState) {
      console.log(s)
      importState.value = s
      if (s.type === 'finished') {
        data.value = s.staged
      }
    }

    const sub = obs?.subscribe({
      next: onUpdate,
      complete: () => {
        onUpdate(obs.value)
      }
    })

    if (obs?.isStopped) {
      console.log('already closed')
      const s = obs.value
      importState.value = s
      if (s.type === 'finished') {
        data.value = s.staged
      }
    }

    onUnmounted(() => {
      sub?.unsubscribe()
    })

    return {
      id,
      data,
      importState
    }
  }
})
</script>

<template>
  <main v-if="importState?.type === 'finished' && data">
    <h1>staged import {{id}}</h1>
    <p>{{formatDate(data.importDate)}}</p>
  </main>
  <main v-else-if="importState?.type === 'error'">
    <h1>Import Error</h1>
    <p>{{importState.error}}</p>
  </main>
  <main v-else-if="importState">
    <h1>Loading Import</h1>
  </main>
  <main v-else>
    <h1>Unknown Import Id</h1>
  </main>
</template>

<style>
</style>
