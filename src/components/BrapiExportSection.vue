<template>
  <div>
    <b-button class="mb-3" @click="showBrapiSettings"><BIconGearFill /> {{ $t('buttonBrapiSettings') }}</b-button>

    <b-form @submit.prevent="onSubmit">
      <h3>{{ $t('pageBrapiExportBrapiIdTitle') }}</h3>
      <p :class="allGermplasmValidDbId ? 'text-success' : 'text-danger'">{{ $t('pageBrapiExportBrapiIdText', germplasmWithBrapiDbIds) }}</p>

      <b-button :disabled="allGermplasmValidDbId" @click="searchBrapiGermplasmMatches"><BIconSearch /> {{ $t('buttonUpdate') }}</b-button>

      <div class="mt-3" v-if="allGermplasmValidDbId">
        <h3>{{ $t('pageBrapiExportFilterTitle') }}</h3>
        <b-row>
          <b-col cols=12 md=4 lg=3>
            <b-form-group :label="$t('formLabelExportBrapiProgram')" label-for="program">
              <b-form-select id="program" :options="programOptions" v-model="selectedProgram" />
            </b-form-group>
          </b-col>
          <b-col cols=12 md=4 lg=3>
            <b-form-group :label="$t('formLabelExportBrapiTrial')" label-for="trial">
              <b-form-select id="trial" :options="trialOptions" v-model="selectedTrial" />
            </b-form-group>
          </b-col>
          <b-col cols=12 md=4 lg=3>
            <b-form-group :label="$t('formLabelExportBrapiStudyType')" label-for="studyType">
              <b-form-select id="studyType" :options="studyTypeOptions" v-model="selectedStudyType" />
            </b-form-group>
          </b-col>
          <b-col cols=12 md=4 lg=3>
            <b-form-group :label="$t('formLabelExportBrapiStudy')" label-for="study">
              <b-form-select id="study" :options="studyOptions" v-model="selectedStudy" />
            </b-form-group>
          </b-col>
        </b-row>

        <b-button variant="primary" :disabled="!canProceed">{{ $t('buttonSendData') }}</b-button>
      </div>
    </b-form>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { BIconGearFill, BIconSearch } from 'bootstrap-vue'

import { brapiGetPrograms, brapiGetTrials, brapiGetStudies, brapiGetStudyTypes, brapiPostGermplasmSearch, brapiDefaultCatchHandler } from '@/mixin/brapi'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconSearch,
    BIconGearFill
  },
  data: function () {
    return {
      selectedProgram: null,
      selectedTrial: null,
      selectedStudyType: null,
      selectedStudy: null,
      programs: [],
      trials: [],
      studyTypes: [],
      studies: [],
      germplasmWithBrapiDbIds: {
        count: 0,
        total: 0,
        germplasmWithoutId: []
      }
    }
  },
  watch: {
    'brapiConfig.url': function () {
      this.updateBrapiGermplasmDbIdCounts()
    },
    'brapiConfig.token': function () {
      this.updateBrapiGermplasmDbIdCounts()
    },
    selectedProgram: function () {
      this.selectedTrial = null

      this.updateTrials()
    },
    selectedTrial: function () {
      this.selectedStudyType = null

      this.updateStudyTypes()
    },
    selectedStudyType: function () {
      this.selectedStudy = null

      this.updateStudies()
    }
  },
  computed: {
    ...mapGetters([
      'storeDatasetId',
      'storeRows',
      'storeCols',
      'storeBrapiConfig',
      'storeTraits'
    ]),
    allGermplasmValidDbId: function () {
      return this.germplasmWithBrapiDbIds.count === this.germplasmWithBrapiDbIds.total
    },
    canProceed: function () {
      return this.selectedProgram && this.selectedTrial && this.selectedStudyType && this.selectedStudy && this.allGermplasmValidDbId
    },
    programOptions: function () {
      if (this.programs) {
        return this.programs.map(t => {
          return {
            value: t,
            text: `${t.programDbId} - ${t.programName}`
          }
        })
      } else {
        return []
      }
    },
    trialOptions: function () {
      if (this.trials) {
        return this.trials.map(t => {
          return {
            value: t,
            text: `${t.trialDbId} - ${t.trialName}`
          }
        })
      } else {
        return []
      }
    },
    studyTypeOptions: function () {
      if (this.studyTypes) {
        return this.studyTypes.map(t => {
          return {
            value: t,
            text: t
          }
        })
      } else {
        return []
      }
    },
    studyOptions: function () {
      if (this.studies) {
        return this.studies.map(t => {
          return {
            value: t,
            text: `${t.studyDbId} - ${t.studyName}`
          }
        })
      } else {
        return []
      }
    }
  },
  methods: {
    updateBrapiGermplasmDbIdsInDatabase: function (map) {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (storeData && storeData.size > 0) {
        emitter.emit('set-loading', true)

        const rows = []
        // For each field row
        for (let y = 0; y < this.storeRows; y++) {
          const rowData = []
          // And each field column
          for (let x = 0; x < this.storeCols; x++) {
            // Get the data cell
            const cell = storeData.get(`${y}-${x}`)
            // If there is data
            if (cell) {
              const id = map.get(cell.name.toLowerCase())

              if (id !== undefined && id !== null) {
                cell.brapiId = id
              }
            }

            rowData.push(cell)
          }
          rows.push(rowData)
        }

        emitter.emit('set-loading', false)

        // Store the data in the database
        this.$store.dispatch('setDatasetData', { data: rows, id: this.storeDatasetId })
      }
    },
    searchBrapiGermplasmMatches: function () {
      brapiPostGermplasmSearch({
        germplasmNames: this.germplasmWithBrapiDbIds.germplasmWithoutId
      }).then(result => {
        const map = new Map()
        if (result) {
          result.forEach(g => {
            map.set(g.germplasmName.toLowerCase(), g.germplasmDbId)
          })

          this.updateBrapiGermplasmDbIdsInDatabase(map)
        }
      }).catch(brapiDefaultCatchHandler)
    },
    showBrapiSettings: function () {
      emitter.emit('show-brapi-settings')
    },
    updatePrograms: function () {
      brapiGetPrograms()
        .then(result => {
          this.programs = result

          if (result && result.length > 0) {
            this.selectedProgram = result[0]
          } else {
            this.selectedProgram = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateTrials: function () {
      brapiGetTrials({
        programDbId: this.selectedProgram.programDbId
      })
        .then(result => {
          this.trials = result

          if (result && result.length > 0) {
            this.selectedTrial = result[0]
          } else {
            this.selectedTrial = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateStudyTypes: function () {
      brapiGetStudyTypes()
        .then(result => {
          this.studyTypes = result

          if (result && result.length > 0) {
            if (result.includes('trials')) {
              this.selectedStudyType = 'trials'
            } else {
              this.selectedStudyType = result[0]
            }
          } else {
            this.selectedStudyType = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateStudies: function () {
      brapiGetStudies({
        studyType: this.selectedStudyType,
        trialDbId: this.selectedTrial.trialDbId
      })
        .then(result => {
          this.studies = result

          if (result && result.length > 0) {
            this.selectedStudy = result[0]
          } else {
            this.selectedStudy = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateBrapiGermplasmDbIdCounts: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (!storeData || storeData.size < 1 || !this.storeTraits || this.storeTraits.length < 1) {
        this.germplasmWithBrapiDbIds = {
          count: 0,
          total: 0,
          germplasmWithoutId: []
        }
      } else {
        let count = 0
        let total = 0
        const germplasmWithoutId = []
        // For each field row
        for (let y = 0; y < this.storeRows; y++) {
          // And each field column
          for (let x = 0; x < this.storeCols; x++) {
            // Get the data cell
            const cell = storeData.get(`${y}-${x}`)
            // If there is data
            if (cell) {
              total++

              if (cell.brapiId) {
                count++
              } else {
                germplasmWithoutId.push(cell.name)
              }
            }
          }
        }

        this.germplasmWithBrapiDbIds = {
          count,
          total,
          germplasmWithoutId
        }
      }
    }
  },
  mounted: function () {
    this.updatePrograms()
    this.updateBrapiGermplasmDbIdCounts()

    emitter.on('brapi-settings-changed', this.updatePrograms)
    emitter.on('dataset-changed', this.updateBrapiGermplasmDbIdCounts)
  },
  beforeDestroy: function () {
    emitter.off('brapi-settings-changed', this.updatePrograms)
    emitter.off('dataset-changed', this.updateBrapiGermplasmDbIdCounts)
  }
}
</script>

<style>

</style>
