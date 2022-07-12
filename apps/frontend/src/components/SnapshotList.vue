<script lang="ts">
import { defineComponent, PropType, ref } from 'vue'
import { IAccountSnapshot } from 'shared';
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
    snapshots: { type: Array as PropType<IAccountSnapshot[]>, required: true }
  }
})
</script>

<template>
  <table class="snapshots-table">
      <tr>
          <th>Bank</th>
          <th>Date</th>
          <th>Balance</th>
          <th>Imported</th>
          <th>ImportID</th>
      </tr>
      <tr v-for="snapshot of snapshots" :key="snapshot._id.toString()">
          <td>{{snapshot.account}}</td>
          <td>{{formatDate(snapshot.date)}}</td>
          <td>{{snapshot.balance}}€</td>
          <td>{{formatDate(snapshot.imported)}}</td>
          <td>{{snapshot.importId}}</td>
      </tr>
  </table>
</template>
