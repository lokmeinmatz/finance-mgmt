<script lang="ts">
import { defineComponent, onMounted, PropType, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
import { AccumulatedChartDataResponse } from '@shared/chart-data';
import 'chartjs-adapter-dayjs-3'


export default defineComponent({
  props: {
    chartData: { type: Object as PropType<AccumulatedChartDataResponse>, required: true }
  },
  setup(props) {

    const chartRootRef = ref<HTMLCanvasElement>()
    let chart: Chart | undefined;

    watch( [chartRootRef, () => props.chartData], ([root, chartData]) => {
      if (!!chart) {
        chart.destroy()
      }
      if (!root || !chartData) return

      const datasets = new Map<string, { x: Date, y: number }[]>()

      for (let ddata of chartData.data) {
        for (const [acc, balance] of Object.entries(ddata.balances)) {
          let accData = datasets.get(acc)
          if (!accData) {
            datasets.set(acc, [])
            accData = datasets.get(acc)
          }
          accData!.push({ x: new Date(ddata.label), y: balance })
        }
      }

      // create new chart
      chart = new Chart(root, {
        type: 'line',
        data: {
          labels: chartData.data.map(e => e.label),
          datasets: [...datasets.entries()].map(([label, data]) => ({ 
            label,
            data,
            borderColor: chartData.colors[label]
          }))
        },
        options: {
          scales: {
            xAxes: {
              type: 'time'
            }
          },
          elements: {
            point: { radius: 0 }
          }
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
