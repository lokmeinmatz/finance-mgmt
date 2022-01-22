<script lang="ts">
import { defineComponent, ref } from '@vue/runtime-core';
import { ChartDataResponse } from '../../../src/api';
import { IAccountSnapshot } from '../../../src/model';
import SnapshotChart from '../components/SnapshotChart.vue';
import SnapshotList from '../components/SnapshotList.vue';
import Popup from '../components/Popup.vue';
import AddSnapshot from '../components/AddSnapshot.vue';

type ChartState = {
	mode: 'accumulated',
	chartData?: any
} | {
	mode: 'monthly',
	chartData?: any
}

export default defineComponent({
	setup() {

		const chartState = ref<ChartState>({ mode: 'monthly' })
		const snapshots = ref<IAccountSnapshot[]>()
		const showAddSnapshotPopup = ref(false)

		async function loadChartData() {
			try {
				const res = await fetch('/api/charts/monthly?count=12&unit=M').then(r => r.json())
				chartState.value.chartData = res
			} catch (error) {
				alert(error)
			}
		}

		async function loadSnapshots() {
			try {
				const res = await fetch('/api/snapshots', { method: 'POST' }).then(r => r.json())
				snapshots.value = res
			} catch (error) {
				alert(error)
			}
		}

		loadChartData()
		loadSnapshots()

		return {
			chartState,
			snapshots,
			showAddSnapshotPopup
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
				@click="chartState.mode = 'accumulated'">Accumulated</button>
			<button
				:class="{ outline: chartState.mode !== 'monthly' }"
				@click="chartState.mode = 'monthly'">Monthly</button>
		</div>
		<SnapshotChart v-if="chartState.mode === 'monthly' && chartState.chartData" :chartData="chartState.chartData" />
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
