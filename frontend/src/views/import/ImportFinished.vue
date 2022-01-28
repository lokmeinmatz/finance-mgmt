<script lang="ts">
import { StagedImport } from '@shared/model';
import { defineComponent, onUnmounted, ref } from '@vue/runtime-core';
import { inject } from 'vue';
import { useRoute } from 'vue-router';
import { ImportServiceKey, ImportState, } from '../../import.service';
import { router } from '../../router';
import { formatDate } from '../../util';


export default defineComponent({
  methods: {
    formatDate
  },
  setup() {
    const importService = inject(ImportServiceKey)!
    const id = useRoute().params.id

    const importState = ref<ImportState['state']>('saving')
    const data = ref<StagedImport>()
    const obs = importService.getImportState(typeof id === 'string' ? id : '')
    console.log(obs)

    function onUpdate(s: ImportState) {
      console.log(s)
      importState.value = s.state
      switch (s.state) {
        case 'loading':
          break;
        case 'staged':
          data.value = s.stagedImport
          break;
        default:
          router.push('/import')
          break;
      }
    }

    const sub = obs?.subscribe({
      next: onUpdate
    })

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
  <main v-if="importState === 'finished' && data">
    <h1>finished import {{id}}</h1>
    <p>{{formatDate(data.importDate)}}</p>
  </main>
  <main v-else-if="importState === 'saving'">
    <h1>Import storing in database...</h1>
  </main>
  <main v-else>
    <h1>Unknown Import Id</h1>
  </main>
</template>

<style>
</style>
