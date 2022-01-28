<script lang="ts">
import { StagedImport } from '@shared/model';
import { defineComponent, onUnmounted, ref } from '@vue/runtime-core';
import { inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ImportServiceKey, ImportState } from '../../import.service';
import { formatDate } from '../../util';


export default defineComponent({
  methods: {
    formatDate
  },
  setup() {
    const router = useRouter()
    const importService = inject(ImportServiceKey)!
    const id = useRoute().params.id

    const data = ref<StagedImport>()
    const obs = importService.getImportState(typeof id === 'string' ? id : '')

    function onUpdate(s: ImportState) {
      console.log(s)
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
    }
  }
})
</script>

<template>
  <main v-if="data">
    <h1>staged import {{id}}</h1>
    <p>{{formatDate(data.importDate)}}</p>
    <table>
      <tr>
        <td>Account</td>
        <td>{{ data.snapshot.account }}</td>
      </tr>
      <tr>
        <td>Snapshot Date</td>
        <td>{{ formatDate(data.snapshot.date) }}</td>
      </tr>
      <tr>
        <td>Final balance</td>
        <td>{{ data.snapshot.balance.toFixed(2) }}€</td>
      </tr>
      <tr>
        <td>New Transactions</td>
        <td>{{ data.newTransactions.length }}</td>
      </tr>
      <tr>
        <td>Duplicate Transactions</td>
        <td>{{ data.duplicateTransactions.length }}</td>
      </tr>
    </table>
    <div class="actions">
      <button class="outline">Cancel Import</button>
      <button style="background-color: greenyellow; color: black;">Finish Import</button>
    </div>
    <details>
      <summary>new transactions</summary>
      <div class="transactions">
        
      </div>
    </details>
  </main>
  <main v-else>
    <h1>Unknown Import Id</h1>
  </main>
</template>

<style scoped lang="scss">
.actions {
  display: flex;
  gap: 1em;
}
</style>
