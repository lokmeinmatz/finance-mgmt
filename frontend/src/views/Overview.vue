<script lang="ts">
import { defineComponent, ref } from '@vue/runtime-core';
import { IAccountSnapshot } from '../../../src/model';
import SnapshotChart from '../components/SnapshotChart.vue';
import SnapshotList from '../components/SnapshotList.vue';
import Popup from '../components/Popup.vue';
import AddSnapshot from '../components/AddSnapshot.vue';
import { fetchParse200JSON } from '../util';

type ChartState = {
	mode: 'accumulated',
	chartData?: any
} | {
	mode: 'relative',
	chartData?: any
}

export default defineComponent({
	setup() {

		const chartState = ref<ChartState>({ mode: 'relative' })
		const snapshots = ref<IAccountSnapshot[]>()
		const showAddSnapshotPopup = ref(false)

		async function loadChartData() {
			try {
				let res
				switch (chartState.value.mode) {
					case 'accumulated':
						res = await fetch('/api/charts/accumulated?count=12&unit=M').then(fetchParse200JSON)
						break;
					case 'relative':
						res = await fetch('/api/charts/relative?count=12&unit=M').then(fetchParse200JSON)
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

		return {
			chartState,
			snapshots,
			showAddSnapshotPopup,
			loadChartData
		};
	},
	components: { SnapshotChart, SnapshotList, Popup, AddSnapshot }
})
</script>

<template>
	<main>
		<h1>Snapshots overview</h1>
		<div class="button-group">
			<button 
				:class="{ outline: chartState.mode !== 'accumulated' }"
				@click="chartState.mode = 'accumulated'; loadChartData()">Accumulated</button>
			<button
				:class="{ outline: chartState.mode !== 'relative' }"
				@click="chartState.mode = 'relative'; loadChartData()">Relative</button>
		</div>
		<SnapshotChart v-if="chartState.mode === 'relative' && chartState.chartData" :chartData="chartState.chartData" />
		<p v-else>Loading chart data</p>
		<SnapshotList v-if="snapshots" :snapshots="snapshots"></SnapshotList>
		<p v-else>Loading snapshots</p>
		<footer>
			<button @click="showAddSnapshotPopup = true">Manual Snapshot</button>
		</footer>
	</main>
	<Popup v-model:open="showAddSnapshotPopup">
		<AddSnapshot></AddSnapshot>
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
