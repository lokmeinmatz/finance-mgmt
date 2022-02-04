<script lang="ts">
import { ITransaction } from '@shared/model';
import { defineComponent, PropType, ref } from 'vue'
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
  <table class="transactions-table">
      <tr>
          <th>Date</th>
          <th>Account</th>
          <th>Amount</th>
          <th>Sender/Receiver</th>
          <th>Message</th>
          <th>Account</th>
          <th>Imported</th>
      </tr>
      <tr v-for="transaction of transactions" :key="transaction._id.toString()">
          <td>{{formatDate(transaction.date)}}</td>
          <td>{{transaction.account?.substring(0, 10) ?? '-'}}</td>
          <td :class="{amount: true, pos: transaction.amount >= 0, neg: transaction.amount < 0}"><p class="wrapper">{{transaction.amount}}€</p></td>
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
    & > .wrapper {
      display: grid;
      grid-template-columns: 1.5em auto;
      margin: 0;
      align-items: center;
    }
    & > .wrapper::before {
      content: '';
      display: block;
      width: 1em;
      height: 1em;
      border-radius: 50%;
    }
    &.pos > .wrapper::before {
      background-color: aquamarine;
    }
    &.neg > .wrapper::before {
      background-color: lightcoral;
    }
  }
}
</style>
