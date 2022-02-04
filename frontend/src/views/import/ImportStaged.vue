<script lang="ts">
import { StagedImport } from '@shared/model';
import { defineComponent, onUnmounted, ref } from '@vue/runtime-core';
import { inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ImportServiceKey, ImportState } from '../../import.service';
import { formatDate } from '../../util';
import TransactionList from '../../components/TransactionList.vue';


export default defineComponent({
    methods: {
        formatDate
    },
    setup() {
        const router = useRouter();
        const importService = inject(ImportServiceKey)!;
        const id = useRoute().params.id as string;
        const loading = ref(true)
        const data = ref<StagedImport>();
        const obs = importService.getImportState(typeof id === "string" ? id : "");
        function onUpdate(s: ImportState) {
            console.log(s);
            switch (s.state) {
                case "loading":
                    break;
                case "staged":
                    loading.value = false
                    data.value = s.stagedImport;
                    break;
                case 'finished':
                    router.push(`/import/finished/${id}`)
                    break
                case 'saving':
                  loading.value = true
                  break
                default:
                    router.push("/import");
                    break;
            }
        }
        const sub = obs?.subscribe({
            next: onUpdate
        });
        onUnmounted(() => {
            sub?.unsubscribe();
        });

        function cancel() {
          importService.cancelImport(id)
          router.replace('/import')
        }

        function finish() {
          try {
            importService.finishImport(id)
          } catch (error) {
            alert(error)
            loading.value = false
          }
        }

        return {
            id,
            finish,
            cancel,
            data,
            loading
        };
    },
    components: { TransactionList }
})
</script>

<template>
  <main v-if="data">
    <h1>staged import {{id}}</h1>
    <p>{{formatDate(data.snapshot.imported)}}</p>
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
      <button class="outline" @click="cancel">Cancel Import</button>
      <button :aria-busy="loading" style="background-color: greenyellow; color: black;" @click="finish">Finish Import</button>
    </div>
    <details>
      <summary>new transactions ({{ data.newTransactions.length }})</summary>
      <div class="transactions">
        <TransactionList :transactions="data.newTransactions"></TransactionList>
      </div>
    </details>
    <details>
      <summary>duplicate transactions ({{ data.duplicateTransactions.length }})</summary>
      <div class="transactions">
        <TransactionList :transactions="data.newTransactions"></TransactionList>
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

.transactions > * {
  width: 100%;
}
</style>
