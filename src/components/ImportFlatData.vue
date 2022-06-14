<template>
  <div>
    <p>{{ $t('widgetImportFlatDataText') }}</p>
    <b-form @submit.prevent="importData" id="import-data-form">
      <b-form-group :label="$t('formLabelImportFlatData')"
                    label-for="import-data">
        <b-form-textarea @keydown.tab.prevent="tabber($event)" :rows="5" :readonly="false" id="import-data" v-model="flatData" :placeholder="$t('formPlaceholderFlatDataImport')" />
        <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="text/plain" v-model="dataFile" />
      </b-form-group>

      <b-form-group :label="$t('formLabelImportFlatDataset')"
                    label-for="import-dataset">
        <b-form-select :options="datasetOptions" v-model="selectedDataset" id="import-dataset" />
      </b-form-group>

      <b-button type="submit" @click.prevent="importData" :disabled="!selectedDataset || !parsedData || parsedData.length < 1">{{ $t('buttonImport') }}</b-button>

      <p class="text-danger" v-if="importError">{{ importError }}</p>
    </b-form>
  </div>
</template>

<script>
import idb from '@/plugins/idb'

export default {
  data: function () {
    return {
      flatData: null,
      parsedData: null,
      dataFile: null,
      datasets: [],
      selectedDataset: null,
      importError: null
    }
  },
  computed: {
    datasetOptions: function () {
      return this.datasets.map(d => {
        return {
          value: d,
          text: `${d.id} - ${d.name}`
        }
      })
    }
  },
  watch: {
    dataFile: function (newValue) {
      this.importError = null
      if (newValue) {
        this.loadDataFile()
      }
    },
    flatData: function (newValue) {
      this.importError = null
      if (newValue) {
        this.parseData()
      } else {
        this.parsedData = null
      }
    }
  },
  methods: {
    tabber: function (event) {
      const text = this.flatData
      const originalSelectionStart = event.target.selectionStart
      const textStart = text.slice(0, originalSelectionStart)
      const textEnd = text.slice(originalSelectionStart)

      this.flatData = `${textStart}\t${textEnd}`
      event.target.value = this.flatData // required to make the cursor stay in place.
      event.target.selectionEnd = event.target.selectionStart = originalSelectionStart + 1
    },
    parseData: function () {
      const data = {
        traits: null,
        varietyData: {}
      }
      this.flatData.split('\n').forEach((r, i) => {
        if (!r) {
          return
        }

        const split = r.split('\t').map(c => c.trim())

        if (r.trim().length > 0 && split.length > 0) {
          if (i === 0) {
            // Get traits
            split.shift()
            data.traits = split
          } else {
            // Get data
            const variety = split.shift()
            data.varietyData[variety] = split
          }
        }
      })

      this.parsedData = data
    },
    loadDataFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.flatData = event.target.result.replace(/\r/g, '')
        this.dataFile = null
      }
      reader.readAsText(this.dataFile)
    },
    updateDatasets: function () {
      idb.getDatasets().then(datasets => {
        const ds = JSON.parse(JSON.stringify(datasets))
        if (ds) {
          ds.sort((a, b) => {
            if (a.lastUpdatedOn && b.lastUpdatedOn) {
              return (new Date(b.lastUpdatedOn)) - (new Date(a.lastUpdatedOn))
            } else if (a.lastUpdatedOn) {
              return -1
            } else if (b.lastUpdatedOn) {
              return 1
            } else {
              return a.name - b.name
            }
          })
        }
        this.datasets = ds
      })
    },
    importData: async function () {
      // Check if the input data is correctly formatted
      if (!this.parsedData.traits) {
        this.importError = this.$t('widgetImportFlatDataErrorNoTraits')
        return
      }
      if (!this.parsedData.varietyData) {
        this.importError = this.$t('widgetImportFlatDataErrorNoVarieties')
        return
      }

      const missingTraits = this.parsedData.traits.filter(t => !this.selectedDataset.traits.some(ot => ot.name === t))
      if (missingTraits.length > 0) {
        this.importError = this.$t('widgetImportFlatDataErrorTraitNotFound', { traits: missingTraits.join(', ') })
        return
      }

      const datasetData = await idb.getDatasetData(this.selectedDataset.id)

      const varieties = new Set()
      datasetData.forEach(d => varieties.add(d.name))

      const missingVarieties = Object.keys(this.parsedData.varietyData).filter(v => !varieties.has(v))
      if (missingVarieties.length > 0) {
        this.importError = this.$t('widgetImportFlatDataErrorVarietyNotFound', { varieties: missingVarieties.join(', ') })
        return
      }

      // Check data types
      for (let t = 0; t < this.parsedData.traits.length; t++) {
        const oldTrait = this.selectedDataset.traits.find(ot => ot.name === this.parsedData.traits[t])

        const wrongType = Object.keys(this.parsedData.varietyData).filter(v => {
          const value = this.parsedData.varietyData[v][t]

          if (value === undefined || value === null || value === '') {
            return false
          }

          if (oldTrait.type === 'int' || oldTrait.type === 'float') {
            if (isNaN(value)) {
              return true
            } else if (oldTrait.restrictions) {
              const numericValue = +value

              return numericValue < oldTrait.restrictions.min || numericValue > oldTrait.restrictions.max
            } else {
              return false
            }
          } else if (oldTrait.type === 'date') {
            return !this.isValidDate(value)
          } else if (oldTrait.type === 'categorical') {
            // If it's not a valid category, remember this variety
            return !oldTrait.restrictions.categories.includes(value)
          }

          return false
        })

        if (wrongType.length > 0) {
          // There's a data point that has the wrong type for a trait
          this.importError = this.$t('widgetImportFlatDataErrorWrongDataType', { trait: oldTrait.name, varieties: wrongType.join(', ') })
          return
        }
      }

      // Take a copy of the dataset
      const reformatted = JSON.parse(JSON.stringify(this.selectedDataset))
      // Store the data
      const mapping = new Map()

      // Iterate through the database data
      datasetData.forEach(d => {
        // Get the new data for this variety name
        const newData = this.parsedData.varietyData[d.name]

        if (newData) {
          for (let t = 0; t < this.selectedDataset.traits.length; t++) {
            // Get the index of the existing trait in the new data
            const newTraitIndex = this.parsedData.traits.indexOf(this.selectedDataset.traits[t].name)

            // If it exists
            if (newTraitIndex >= 0 && newTraitIndex < newData.length) {
              // Check if there is a value for this trait
              if (newData[newTraitIndex] !== undefined && newData[newTraitIndex] !== null && newData[newTraitIndex] !== '') {
                // If so, set it and the date
                d.values[t] = newData[newTraitIndex]
                d.dates[t] = this.getTodayString()
              }
            }
          }
        }

        mapping.set(`${d.row}-${d.col}`, d)
      })

      // Now we need to convert the data into a 2d array
      const arrayData = []
      for (let row = 0; row < this.selectedDataset.rows; row++) {
        const rowData = []
        for (let col = 0; col < this.selectedDataset.cols; col++) {
          rowData.push(mapping.get(`${row}-${col}`))
        }
        arrayData.push(rowData)
      }
      delete reformatted.data
      reformatted.data = arrayData

      // Store the data in the database
      this.$store.dispatch('updateDataset', reformatted)

      this.plausibleEvent('dataset-load', { format: 'file' })
    },
    isValidDate: function (s) {
      // Assumes s is "yyyy-mm-dd"
      if (!/^\d\d\d\d-\d\d-\d\d$/.test(s)) {
          return false
      }
      const parts = s.split('-').map((p) => parseInt(p, 10))
      parts[1] -= 1
      const d = new Date(parts[0], parts[1], parts[2])
      return d.getMonth() === parts[1] && d.getDate() === parts[2] && d.getFullYear() === parts[0]
    },
    getToday: function () {
      const today = new Date()
      const offset = today.getTimezoneOffset()
      return new Date(today.getTime() + (offset * 60 * 1000))
    },
    getTodayString: function () {
      return this.getToday().toISOString().split('T')[0]
    }
  },
  mounted: function () {
    this.updateDatasets()
  }
}
</script>

<style>
#import-data-form .form-group textarea {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
#import-data-form .form-group textarea + .b-form-file * {
  border-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
