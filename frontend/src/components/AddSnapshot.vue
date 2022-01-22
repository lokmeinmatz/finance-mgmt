<script lang="ts">
import { defineComponent, ref } from 'vue'
import { DataService } from '../data.service'
import { IAccount } from '../../../src/model'

export default defineComponent({
  setup() {
    const accounts = ref<IAccount[]>([])
    const selectedAccount = ref()

    async function init() {
      DataService.getAccounts().then(accs => accounts.value = accs)
    }

    init()

    return {
      accounts,
      selectedAccount
    }
  }
})
</script>

<template>
  <h1>Add Snapshot</h1>
  <label for="account">Account</label>
  <select id="account" required v-model="selectedAccount">
    <option v-for="acc of accounts" :key="acc._id" :value="acc" selected>{{ acc.name }}</option>
  </select>
</template>

<style scoped lang="scss">
</style>
