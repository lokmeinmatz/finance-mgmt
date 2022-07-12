<script lang="ts">
import { defineComponent, ref } from 'vue';
import RelativeChart from '../components/RelativeChart.vue';
import SnapshotList from '../components/SnapshotList.vue';
import Popup from '../components/Popup.vue';
import AddSnapshot from '../components/AddSnapshot.vue';
import { fetchParse200JSON } from '../util';
import { IAccountSnapshot } from 'shared';
import dayjs from 'dayjs';
import { AccumulatedChartDataResponse, RelativeChartDataResponse } from 'shared';
import AccumulatedChart from '../components/AccumulatedChart.vue';

type ChartState = {
	mode: 'accumulated',
	chartData?: AccumulatedChartDataResponse
} | {
	mode: 'relative',
	chartData?: RelativeChartDataResponse
}

export default defineComponent({
	setup() {

		const chartState = ref<ChartState>({ mode: 'relative' })
		const snapshots = ref<IAccountSnapshot[]>()
		const showAddSnapshotPopup = ref(false)

		async function loadChartData() {
			try {
				let res: AccumulatedChartDataResponse | RelativeChartDataResponse
				switch (chartState.value.mode) {
					case 'accumulated':
						const now = dayjs()
						const from = now.subtract(6, 'months')

						res = await fetch(`/api/charts/accumulated?from=${from.toISOString()}&to=${now.toISOString()}`).then(fetchParse200JSON) as AccumulatedChartDataResponse
						break;
					case 'relative':
						res = await fetch('/api/charts/relative?count=12&unit=M').then(fetchParse200JSON) as RelativeChartDataResponse
						break;
				}
				chartState.value.chartData = res
			} catch (error) {
				alert(JSON.stringify(error))
			}
		}

		async function loadSnapshots() {
			try {
				const res = await fetch('/api/snapshots', { method: 'POST' }).then(r => r.json())
				snapshots.value = res
			} catch (error) {
				alert(JSON.stringify(error))
			}
		}

		loadChartData()
		loadSnapshots()

		function setChartMode(mode: ChartState['mode']) {
			//resets
			chartState.value = { mode }
			loadChartData()
		}

		function addedSnapshot(data: any) {
			showAddSnapshotPopup.value = false
			alert(data)
			loadSnapshots()
		}

		return {
			setChartMode,
			chartState,
			snapshots,
			showAddSnapshotPopup,
			loadChartData,
			addedSnapshot,
			loadSnapshots
		};
	},
	components: { RelativeChart, SnapshotList, Popup, AddSnapshot, AccumulatedChart }
})
</script>

<template>
	<main>
		<h1>Snapshots overview</h1>
		<div class="button-group">
			<button 
				:class="{ outline: chartState.mode !== 'accumulated' }"
				@click="setChartMode('accumulated')">Accumulated</button>
			<button
				:class="{ outline: chartState.mode !== 'relative' }"
				@click="setChartMode('relative')">Relative</button>
		</div>
		<RelativeChart v-if="chartState.mode === 'relative' && chartState.chartData" :chartData="chartState.chartData" />
		<AccumulatedChart v-else-if="chartState.mode === 'accumulated' && chartState.chartData" :chartData="chartState.chartData" />
		<p v-else>Loading chart data</p>
		<SnapshotList v-if="snapshots" :snapshots="snapshots"></SnapshotList>
		<p v-else>Loading snapshots</p>
		<footer>
			<button @click="showAddSnapshotPopup = true">Manual Snapshot</button>
		</footer>
	</main>
	<Popup v-model:open="showAddSnapshotPopup">
		<AddSnapshot @finished="addedSnapshot"></AddSnapshot>
	</Popup>
</template>

<style lang="scss">
.button-group {
	display: grid;
	grid-template-columns: 1fr 1fr;

	& > button:first-child {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	& > button:not(:first-child, :last-child) {
		border-radius: 0;
	}

	& > button:last-child {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}

}
</style>
