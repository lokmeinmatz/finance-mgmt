<script lang="ts">
import { defineComponent, ref } from 'vue';
import TransactionList from '../components/TransactionList.vue';
import { concatAll, from, mergeScan, Observable, of, tap } from 'rxjs'
import { ITransaction } from 'shared';

function scanFunc(acc: ITransaction[], val: any): Observable<ITransaction[]> {
 return from(fetch('/api/transactions', {
          method: 'POST',
          body: JSON.stringify({})
        })
        .then(res => res.json() as Promise<ITransaction[]>)
        .then(newTransactions => [...acc, ...newTransactions]))
}

export default defineComponent({
  components: {
    TransactionList
  },
  setup() {
    const transactions = ref([])

    const loadMore$ = of([1]);

    loadMore$.pipe(
      tap(d => console.log('loadMore', d)),
      mergeScan(scanFunc, []),
      tap(console.log)
    ).subscribe(nTs => {
      transactions.value = nTs
    })

    return {
      transactions
    }
  }
})
</script>

<template>
  <main>
  <h1>Home view</h1>
  <TransactionList :transactions="transactions"></TransactionList>
  </main>
</template>

<style>
</style>
