<template>
  <div>
    <b-button class="mb-3" @click="showBrapiSettings"><BIconGearFill /> {{ $t('buttonBrapiSettings') }}</b-button>

    <b-form @submit.prevent="onSubmit">
      <b-row>
        <b-col cols=12 md=6 class="mb-3 d-flex flex-column align-items-start justify-content-between">
          <div>
            <h3>{{ $t('pageBrapiExportBrapiGermplasmIdTitle') }}</h3>
            <p :class="allGermplasmValidDbId ? 'text-success' : 'text-danger'">{{ $t('pageBrapiExportBrapiGermplasmIdText', germplasmWithBrapiDbIds) }}</p>
          </div>

          <b-button :variant="allGermplasmValidDbId ? null : 'primary'" :disabled="allGermplasmValidDbId" @click="searchBrapiGermplasmMatches"><BIconSearch /> {{ $t('buttonUpdate') }}</b-button>
        </b-col>
        <b-col cols=12 md=6 class="mb-3 d-flex flex-column align-items-start justify-content-between">
          <div>
            <h3>{{ $t('pageBrapiExportBrapiTraitIdTitle') }}</h3>
            <p :class="allTraitsValidDbId ? 'text-success' : 'text-danger'">{{ $t('pageBrapiExportBrapiTraitIdText', traitsWithBrapiDbIds) }}</p>
          </div>

          <div>
            <b-button class="mr-2" :variant="allTraitsValidDbId ? null : 'primary'" :disabled="allTraitsValidDbId" @click="searchBrapiTraitMatches"><BIconSearch /> {{ $t('buttonUpdate') }}</b-button>
            <span v-b-tooltip="allTraitsValidDbId || traitLookupRanAtLeastOnce ? '' : $t('tooltipBrapiExportBrapiTraitRunSearch')">
              <b-button :disabled="allTraitsValidDbId || !traitLookupRanAtLeastOnce" @click="writeTraitsWithoutBrapiId"><BIconCloudPlus /> {{ $t('buttonUpload') }}</b-button>
            </span>
          </div>
        </b-col>
      </b-row>

      <div class="mt-3" v-if="allGermplasmValidDbId && allTraitsValidDbId">
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

        <b-button @click="sendData" variant="primary" :disabled="!canProceed"><BIconCloudUpload /> {{ $t('buttonSendData') }}</b-button>
      </div>
    </b-form>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { BIconGearFill, BIconSearch, BIconCloudUpload, BIconCloudPlus } from 'bootstrap-vue'

import { brapiGetPrograms, brapiGetTrials, brapiGetStudies, brapiGetStudyTypes, brapiPostObservationUnits, brapiPostGermplasmSearch, brapiPostObservationVariables, brapiPostObservationVariableSearch, brapiDefaultCatchHandler } from '@/mixin/brapi'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconSearch,
    BIconGearFill,
    BIconCloudUpload,
    BIconCloudPlus
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
      },
      traitsWithBrapiDbIds: {
        count: 0,
        total: 0,
        traitsWithoutId: []
      },
      traitLookupRanAtLeastOnce: false
    }
  },
  watch: {
    'brapiConfig.url': function () {
      this.updateBrapiGermplasmDbIdCounts()
      this.updateBrapiTraitDbIdCounts()
    },
    'brapiConfig.token': function () {
      this.updateBrapiGermplasmDbIdCounts()
      this.updateBrapiTraitDbIdCounts()
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
    },
    storeTraits: function () {
      this.updateBrapiTraitDbIdCounts()
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
    allTraitsValidDbId: function () {
      return this.traitsWithBrapiDbIds.count === this.traitsWithBrapiDbIds.total
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
    pad: function (num) {
      return (num < 10 ? '0' : '') + num
    },
    toIsoString: function (str) {
      const date = new Date(str)
      const tzo = -date.getTimezoneOffset()
      const dif = tzo >= 0 ? '+' : '-'

      return date.getFullYear() +
        '-' + this.pad(date.getMonth() + 1) +
        '-' + this.pad(date.getDate()) +
        'T' + this.pad(date.getHours()) +
        ':' + this.pad(date.getMinutes()) +
        ':' + this.pad(date.getSeconds()) +
        dif + this.pad(Math.floor(Math.abs(tzo) / 60)) + this.pad(Math.abs(tzo) % 60)
    },
    writeTraitsWithoutBrapiId: function () {
      if (this.traitsWithBrapiDbIds && this.traitsWithBrapiDbIds.traitsWithoutId && this.traitsWithBrapiDbIds.traitsWithoutId.length > 0) {
        const newTraits = this.storeTraits.concat().filter(t => this.traitsWithBrapiDbIds.traitsWithoutId.includes(t.name)).map(t => {
          const newT = {
            observationVariableName: t.name
          }

          const scale = {
            dataType: null,
            validValues: null
          }

          switch (t.type) {
            case 'date':
              scale.dataType = 'Date'
              break
            case 'text':
              scale.dataType = 'Text'
              break
            case 'float':
            case 'int':
              scale.dataType = 'Numeric'
              break
            case 'categorical':
              scale.dataType = 'Ordinal'
              break
            default:
              scale.dataType = 'Text'
          }

          if (t.restrictions) {
            scale.validValues = {}
            if (t.restrictions.min !== undefined && t.restrictions.min !== null) {
              scale.validValues.minimumValue = t.restrictions.min
            }
            if (t.restrictions.max !== undefined && t.restrictions.max !== null) {
              scale.validValues.maximumValue = t.restrictions.max
            }
            if (t.restrictions.categories && t.restrictions.categories.length > 0) {
              scale.validValues.categories = t.restrictions.categories.map(c => {
                return {
                  label: c,
                  value: c
                }
              })
            }
          }

          newT.scale = scale

          return newT
        })

        brapiPostObservationVariables(newTraits)
          .then(result => {
            this.searchBrapiTraitMatches()
          })
          .catch(brapiDefaultCatchHandler)
      }
    },
    sendData: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (storeData && storeData.size > 0) {
        emitter.emit('set-loading', true)

        const data = []

        for (let y = 0; y < this.storeRows; y++) {
          // And each field column
          for (let x = 0; x < this.storeCols; x++) {
            // Get the data cell
            const cell = storeData.get(`${y}-${x}`)

            const dp = {
              germplasmDbId: cell.brapiId,
              germplasmName: cell.name,
              observationUnitPosition: {
                positionCoordinateXType: 'GRID_COL',
                positionCoordinateX: x + 1,
                positionCoordinateYType: 'GRID_ROW',
                positionCoordinateY: y + 1,
                observationLevel: (cell.rep !== undefined && cell.rep !== null)
                ? {
                  levelName: 'rep',
                  levelCode: cell.rep
                }
                : null
              },
              programDbId: this.selectedProgram.programDbId,
              trialDbId: this.selectedTrial.trialDbId,
              studyDbId: this.selectedStudy.studyDbId,
              observations: []
            }

            this.storeTraits.forEach((t, i) => {
              const value = cell.values[i]
              const date = cell.dates[i]

              if (value !== undefined && value !== null) {
                if (t.mType === 'multi') {
                  value.forEach((v, vi) => {
                    if (v !== undefined && v !== null) {
                      dp.observations.push({
                        germplasmDbId: cell.brapiId,
                        germplasmName: cell.name,
                        observationVariableDbId: t.brapiId,
                        observationVariableName: t.name,
                        studyDbId: this.selectedStudy.studyDbId,
                        value: v,
                        observationTimeStamp: this.toIsoString(date[vi]),
                        additionalInfo: {
                          traitMType: t.mType
                        }
                      })
                    }
                  })
                } else {
                  dp.observations.push({
                    germplasmDbId: cell.brapiId,
                    germplasmName: cell.name,
                    observationVariableDbId: t.brapiId,
                    observationVariableName: t.name,
                    studyDbId: this.selectedStudy.studyDbId,
                    value: value,
                    observationTimeStamp: this.toIsoString(date),
                    additionalInfo: {
                      traitMType: t.mType
                    }
                  })
                }
              }
            })

            if (dp.observations.length > 0) {
              data.push(dp)
            }
          }
        }

        brapiPostObservationUnits(data)
          .then(result => {
            this.plausibleEvent('dataset-export', { format: 'brapi' })
          })
          .catch(brapiDefaultCatchHandler)
          .finally(() => emitter.emit('set-loading', false))
      }
    },
    updateBrapiTraitDbIdsInDatabase: function (map) {
      const traits = JSON.parse(JSON.stringify(this.storeTraits))

      traits.forEach(t => {
        const brapiMatches = map.get(t.name.toLowerCase())

        if (brapiMatches && brapiMatches.length > 0) {
          brapiMatches.forEach(brapiMatch => {
            if (brapiMatch && brapiMatch.scale) {
              // Check data type
              let matches = false
              switch (brapiMatch.scale.dataType) {
                case 'Date':
                  matches = t.type === 'date'
                  break
                case 'Text':
                  matches = t.type === 'text'
                  break
                case 'Numeric':
                  matches = t.type === 'float' || t.type === 'int'
                  break
                case 'Duration':
                  matches = t.type === 'int'
                  break
                case 'Ordinal':
                  matches = t.type === 'categorical'
                  break
              }

              if (matches) {
                t.brapiId = brapiMatch.observationVariableDbId
              }
            }
          })
        }
      })

      this.$store.dispatch('updateTraitBrapiIds', { datasetId: this.storeDatasetId, traits: traits })
    },
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
    searchBrapiTraitMatches: function () {
      brapiPostObservationVariableSearch({
        observationVariableNames: this.traitsWithBrapiDbIds.traitsWithoutId
      }).then(result => {
        this.traitLookupRanAtLeastOnce = true
        const map = new Map()
        if (result) {
          result.forEach(g => {
            const lower = g.observationVariableName.toLowerCase()
            let match = map.get(lower)
            if (!match) {
              match = []
            }

            match.push(g)

            map.set(lower, match)
          })

          this.updateBrapiTraitDbIdsInDatabase(map)
        }
      }).catch(brapiDefaultCatchHandler)
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
        programDbId: this.selectedProgram ? this.selectedProgram.programDbId : null
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
        trialDbId: this.selectedTrial ? this.selectedTrial.trialDbId : null
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
    updateBrapiTraitDbIdCounts: function () {
      let count = 0
      const total = this.storeTraits.length
      const traitsWithoutId = []

      this.storeTraits.forEach(t => {
        if (t.brapiId !== undefined && t.brapiId !== null) {
          count++
        } else {
          traitsWithoutId.push(t.name)
        }
      })

      this.traitsWithBrapiDbIds = {
        count,
        total,
        traitsWithoutId
      }
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
    this.updateBrapiTraitDbIdCounts()

    emitter.on('brapi-settings-changed', this.updatePrograms)
    emitter.on('dataset-changed', this.updateBrapiGermplasmDbIdCounts)
    emitter.on('traits-updated', this.updateBrapiTraitDbIdCounts)
  },
  beforeDestroy: function () {
    emitter.off('brapi-settings-changed', this.updatePrograms)
    emitter.off('dataset-changed', this.updateBrapiGermplasmDbIdCounts)
    emitter.off('traits-updated', this.updateBrapiTraitDbIdCounts)
  }
}
</script>

<style>

</style>
