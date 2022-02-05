<script lang="ts">
import { defineComponent, onMounted, PropType, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
import { RelativeChartDataResponse } from '@shared/chart-data';

export default defineComponent({
  props: {
    chartData: { type: Object as PropType<RelativeChartDataResponse>, required: true }
  },
  setup(props) {

    const chartRootRef = ref<HTMLCanvasElement>()
    let chart: Chart | undefined;

    watch( [chartRootRef, () => props.chartData], ([root, chartData]) => {
      if (!!chart) {
        chart.destroy()
      }
      if (!root || !chartData) return

      const labels = chartData.data.map(d => d.label)

      // create new chart
      chart = new Chart(root, {
        type: 'bar',
        data: {
          datasets: [{
            type: 'bar',
            label: 'Income',
            data: chartData.data.map(d => d.income),
            backgroundColor: 'green',
            order: 3,
            stack: 'Stack 0'
          }, {
            type: 'bar',
            label: 'Expenses',
            data: chartData.data.map(d => d.expenses),
            backgroundColor: 'red',
            order: 3,
            stack: 'Stack 0'
          }, {
            type: 'line',
            label: 'Total profit',
            order: 1,
            borderColor: 'blue',
            data: chartData.data.map(d => d.profit)
          }],
          labels
        }
      })
      console.log('created new chart')
    });


    return { chartRootRef }
  }
})
</script>
<template>
  <canvas ref="chartRootRef"></canvas>
</template>
<style scoped lang="scss">
table {
  & .amount {
    &.pos { background-color: aquamarine; }
    &.neg { background-color: lightcoral; color: black; }
  }
}
</style>
