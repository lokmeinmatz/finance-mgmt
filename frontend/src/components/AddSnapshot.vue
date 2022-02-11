<script lang="ts">
import { computed, defineComponent, reactive, ref } from 'vue'
import { DataService } from '../data.service'
import { IAccount, IAccountSnapshot } from 'shared'
import { genImportId } from 'shared'

export default defineComponent({
  emits: [ 'finished', 'canceled' ],
  setup(props, { emit }) {
    const accounts = ref<IAccount[]>([])
    const selectedAccount = ref<IAccount>()
    let balanceStr = ref('')
    const balance = computed<number | undefined>(() => {
      try {
        let str = balanceStr.value.toString().trim()
        
        str = str.replace('€', '')
        if (str.indexOf('.') < str.length - 3) {
          // is probably of wrong format?
          str = str.replaceAll('.', '')
        }
        
        if (str.includes(',')) {
          str = str.replace(',', '.')
        }
        return parseFloat(str)
      } catch (e) {
        return undefined
      }
    })

    const date = ref(new Date())

    const loadingStates = reactive({
      addingSnapshot: false
    })

    async function init() {
      DataService.getAccounts().then(accs => accounts.value = accs)
    }

    async function saveSnapshot() {
      loadingStates.addingSnapshot = true

      try {
        if (!selectedAccount.value || !date.value || balance.value === undefined) throw new Error() 
  
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
          throw new Error('Error while adding snapshot: ' + await res.text())
        }

        const serverRes = await res.json()
        console.log(serverRes)
        emit('finished', serverRes)
      } catch (error) {
        console.error(error)
        alert('missing required inputs')
      } finally {
        loadingStates.addingSnapshot = false
      }

    }


    init()

    return {
      accounts,
      balance,
      balanceStr,
      date,
      saveSnapshot,
      selectedAccount,
      loadingStates
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
    <input id="balance" type="text" v-model="balanceStr">
  </label>
  <p>Parsed balance: {{ balance }}€</p>
  <label for="date">Date of snapshot
    <input type="date" id="date" v-model="date">
  </label>
  <div class="actions">
    <button class="outline" @click="$emit('canceled')">Cancel</button>
    <button :aria-busy="loadingStates.addingSnapshot" @click="saveSnapshot()">Add</button>
  </div>
</template>

<style scoped lang="scss">
.actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5em;
  @media screen and (min-width: 400px) {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
