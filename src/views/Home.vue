<template>
  <div>
    <div class="d-flex flex-row align-items-center">
      <b-button @click="$refs.settingsModal.show()">{{ $t('buttonSettingsModal') }}</b-button>

      <b-form-checkbox :checked="useGps" switch @change="setUseGps" class="mx-3">Use GPS?</b-form-checkbox>

      <span v-for="(trait, index) in dataset.traits" :key="`trait-${index}`">
        <span class="mx-1" :style="{ color: colors[index % colors.length] }">⬤ {{ trait }}</span>
      </span>

      <b-button @click="onExportClicked" class="ml-auto">{{ $t('buttonExport') }}</b-button>
    </div>

    <GridTable v-on:cell-clicked="onCellClicked" v-if="dataset && dataset.traits && dataset.traits.length > 0"/>
    <ExportModal ref="exportModal" :text="exportText" />
    <SettingsModal ref="settingsModal" v-on:settings-changed="onSettingsChanged" />
    <DataPointModal ref="dataPointModal" :row="cell.row" :col="cell.col" />
  </div>
</template>

<script>
import GridTable from '@/components/tables/GridTable'
import DataPointModal from '@/components/modals/DataPointModal'
import SettingsModal from '@/components/modals/SettingsModal'
import ExportModal from '@/components/modals/ExportModal'

export default {
  data: function () {
    return {
      cell: {
        row: null,
        col: null
      },
      exportText: null
    }
  },
  components: {
    GridTable,
    DataPointModal,
    SettingsModal,
    ExportModal
  },
  methods: {
    onSettingsChanged: function (settings) {
      // TODO: Ask for confirmation
      this.$store.dispatch('setRows', settings.rows)
      this.$store.dispatch('setCols', settings.cols)
      this.$store.dispatch('setTraits', settings.traits)
      let data = []
      let counter = 0
      for (let y = 0; y < settings.rows; y++) {
        let rowData = {}
        for (let x = 0; x < settings.cols; x++) {
          rowData[x + 1] = {
            name: settings.varieties.length > counter ? settings.varieties[counter++] : null,
            dates: [],
            geolocation: null
          }
          for (let t = 0; t < settings.traits.length; t++) {
            rowData[x + 1].dates[t] = null
          }
        }
        data.push(rowData)
      }
      this.$store.dispatch('setData', data)
    },
    onCellClicked: function (cell) {
      this.cell = cell
      this.$nextTick(() => this.$refs.dataPointModal.show())
    },
    onExportClicked: function () {
      let result = 'Variety\tLat\tLng\tElv\t' + this.dataset.traits.join('\t')

      for (let y = 0; y < this.dataset.rows; y++) {
        for (let x = 0; x < this.dataset.cols; x++) {
          const cell = this.dataset.data[y][x + 1]
          if (cell && cell.dates && cell.dates.length > 0 && !cell.dates.every(c => c === null || c.length < 1)) {
            result += '\n'
            result += cell.name

            if (cell.geolocation) {
              result += '\t' + (cell.geolocation.lat ? cell.geolocation.lat : '')
              result += '\t' + (cell.geolocation.lng ? cell.geolocation.lng : '')
              result += '\t' + (cell.geolocation.elv ? cell.geolocation.elv : '')
            } else {
              result += '\t\t\t'
            }

            result += '\t' + cell.dates.join('\t')
          }
        }
      }

      this.exportText = result
      this.$refs.exportModal.show()
    },
    setUseGps: function (value) {
      this.$store.dispatch('setUseGps', value)
    }
  }
}
</script>

<style>

</style>
