<script lang="ts">
import { defineComponent, ref } from 'vue'
import { DataService } from '../data.service'
import { IAccount, IAccountSnapshot } from 'shared'
import { genImportId } from 'shared'

export default defineComponent({
  emits: [ 'finished' ],
  setup(props, { emit }) {
    const accounts = ref<IAccount[]>([])
    const selectedAccount = ref<IAccount>()
    const balance = ref(0)
    const date = ref(new Date())

    async function init() {
      DataService.getAccounts().then(accs => accounts.value = accs)
    }

    async function saveSnapshot() {

      if (!selectedAccount.value || !date.value) return alert('missing required inputs')

      const snapshot: Omit<IAccountSnapshot, '_id'> = {
        account: selectedAccount.value._id,
        balance: balance.value,
        date: date.value,
        importId: genImportId(selectedAccount.value.bank),
        imported: new Date(),
        source: 'manual'
      }

      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(snapshot)
      })

      if (res.status !== 200) {
        return alert(await res.text())
      }
      console.log(await res.json())
      emit('finished')
    }

    init()

    return {
      accounts,
      balance,
      date,
      saveSnapshot,
      selectedAccount
    }
  }
})
</script>

<template>
  <h1>Add Snapshot</h1>
  <label for="account">Account</label>
  <select id="account" required v-model="selectedAccount">
    <option v-for="acc of accounts" :key="acc._id" :value="acc">{{ acc.name }}</option>
  </select>
  <label for="balance">
    Balance
    <input id="balance" type="number" v-model="balance">
  </label>
  <label for="date">Date of snapshot
    <input type="date" id="date" v-model="date">
  </label>
</template>

<style scoped lang="scss">
</style>
