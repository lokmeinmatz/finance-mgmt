<script lang="ts">
import { defineComponent, PropType, ref } from 'vue'
import { ITransaction } from '../../../src/model';
import { formatDate } from '../util';

export default defineComponent({
  methods: {
    formatDate,
    shorten(text: string | undefined, maxLength: number): string {
      if (!text) return ''
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }
  },
  props: {
    transactions: { type: Array as PropType<ITransaction[]>, required: true }
  }
})
</script>

<template>
  <table class="pure-table transactions-table">
      <tr>
          <th>Date</th>
          <th>Bank</th>
          <th>Amount</th>
          <th>Sender/Receiver</th>
          <th>Message</th>
          <th>Account</th>
          <th>Imported</th>
      </tr>
      <tr v-for="transaction of transactions" :key="transaction._id.toString()">
          <td>{{formatDate(transaction.date)}}</td>
          <td>{{transaction.bank}}</td>
          <td :class="{amount: true, pos: transaction.amount >= 0, neg: transaction.amount < 0}">{{transaction.amount}}€</td>
          <td :title="transaction.receiverOrSender">{{shorten(transaction.receiverOrSender, 20)}}...</td>
          <td :title="transaction.transactionMessage">{{shorten(transaction.transactionMessage, 100)}}</td>
          <td>{{transaction.account}}</td>
          <td>{{formatDate(transaction.imported)}}</td>
      </tr>
  </table>
</template>

<style scoped lang="scss">
table {
  & .amount {
    &.pos { background-color: aquamarine; }
    &.neg { background-color: lightcoral; color: black; }
  }
}
</style>
