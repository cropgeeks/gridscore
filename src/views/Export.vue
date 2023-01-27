<template>
  <b-container>
    <h1><b-button :to="{ name: 'data' }"><BIconArrowLeft /></b-button> {{ $t('modalTitleExport') }} <small><a href="#" class="text-secondary" @click="$refs.helpModal.show()"><BIconQuestionCircleFill /></a></small></h1>
    <hr />

    <!-- Show a loading indicator while the export is generated -->
    <b-progress :value="100" height="5px" variant="info" animated v-if="!text" />
    <b-tabs content-class="mt-3" v-else>
      <!-- Tab for the data -->
      <b-tab active>
        <template #title>
          <BIconFileEarmarkSpreadsheet /> {{ $t('tabTitleExportData') }}
        </template>
        <p>{{ $t('modalTextExportData') }}</p>
        <b-form @submit.prevent>
          <b-form-group :label="$t('formLabelExportText')"
                          label-for="exportText">
            <!-- The data is shown here, non-wrapped. On focus, select everything -->
            <b-form-textarea rows="8" readonly :value="text" id="exportText" :placeholder="$t('formPlaceholderExportLoading')" wrap="off" @focus="$event.target.select()"/>
          </b-form-group>
        </b-form>
        <!-- Link to actually download the data -->
        <div v-if="text && (text !== $t('labelNoData'))">
          <BIconDownload /> <a :href="getHrefData" :download="getFilenameData" @click="plausibleEvent('dataset-export', { format: 'data' })"> {{ $t('linkExport') }}</a>
        </div>

        <hr />

        <b-form @submit.prevent>
          <b-form-group :label="$t('formLabelExportDatesText')"
                          label-for="exportDatesText">
            <!-- The data is shown here, non-wrapped. On focus, select everything -->
            <b-form-textarea rows="8" readonly :value="datesText" id="exportDatesText" :placeholder="$t('formPlaceholderExportLoading')" wrap="off" @focus="$event.target.select()"/>
          </b-form-group>
        </b-form>
        <!-- Link to actually download the data -->
        <div v-if="datesText && (datesText !== $t('labelNoData'))">
          <BIconDownload /> <a :href="getHrefDates" :download="getFilenameDates" @click="plausibleEvent('dataset-export', { format: 'dates' })"> {{ $t('linkExport') }}</a>
        </div>
      </b-tab>
      <!-- Tab for the trait definitions -->
      <b-tab>
        <template #title>
          <BIconTags /> {{ $t('tabTitleExportTraits') }}
        </template>
        <p v-html="$t('modalTextExportTraits')" />
        <b-form @submit.prevent>
          <b-form-group :label="$t('formLabelExportTraits')"
                          label-for="exportTraits">
            <!-- The data is shown here, non-wrapped. On focus, select everything -->
            <b-form-textarea rows="8" readonly :value="traits" id="exportTraits" :placeholder="$t('formPlaceholderExportLoading')" wrap="off" @focus="$event.target.select()"/>
          </b-form-group>
        </b-form>
        <!-- Link to actually download the data -->
        <div v-if="traits && (traits !== $t('labelNoData'))">
          <BIconDownload /> <a :href="getHrefTraits" :download="getFilenameTraits" @click="plausibleEvent('dataset-export', { format: 'traits' })"> {{ $t('linkExport') }}</a>
        </div>
      </b-tab>
      <b-tab>
        <template #title>
          <BIconGrid3x3 /> {{ $t('tabTitleExportFieldPlan') }}
        </template>
        <p v-html="$t('modalTextExportFieldPlan')" />

        <b-form @submit.prevent>
          <b-form-group :label="$t('formLabelExportFieldPlanTrait')" label-for="exportFieldPlanTrait">
            <b-form-select :options="traitOptions" v-model="selectedTrait" id="exportFieldPlanTrait" />
          </b-form-group>
          <b-form-group :label="$t('formLabelExportFieldPlan')"
                          label-for="exportFieldPlan">
            <!-- The data is shown here, non-wrapped. On focus, select everything -->
            <b-form-textarea rows="8" readonly :value="fieldPlan" id="exportFieldPlan" :placeholder="$t('formPlaceholderExportLoading')" wrap="off" @focus="$event.target.select()"/>
          </b-form-group>
        </b-form>
        <!-- Link to actually download the data -->
        <div v-if="fieldPlan && (fieldPlan !== $t('labelNoData'))">
          <BIconDownload /> <a :href="getHrefFieldPlant" :download="getFilenameFieldPlan" @click="plausibleEvent('dataset-export', { format: 'field-plan' })"> {{ $t('linkExport') }}</a>
        </div>
      </b-tab>
      <b-tab>
        <template #title>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="b-icon bi">
            <path d="M 11.999836,0 C 5.384778,0 -3.9999998e-7,5.38515 0,12.00026 -3.9999998e-7,18.61531 5.384778,24.00011 11.999836,24.00011 18.614894,24.00011 24,18.61531 24,12.00026 24,5.38515 18.614894,0 11.999836,0 Z m 0,2.09227 c 5.484271,0 9.907984,4.42367 9.907984,9.90799 0,5.48425 -4.423713,9.90754 -9.907984,9.90754 -5.4842703,0 -9.9076558,-4.42329 -9.9076558,-9.90754 0,-5.48432 4.4233855,-9.90799 9.9076558,-9.90799 z M 9.5003025,5.50579 c -2.4997191,0 -2.4997043,0 -3.7494633,2.16472 L 4.500991,9.83539 c -1.2498943,2.16476 -1.2498943,2.16487 0,4.32945 l 1.2498482,2.16476 c 1.261759,2.16476 1.2617442,2.16476 3.7494633,2.16476 2.4996545,0 2.4997185,0 3.7495455,-2.16476 h -8.1e-5 c 1.249812,-2.16476 1.249787,-2.16469 0,-4.32934 v -1.1e-4 H 10.750152 8.2505363 l 1.2497662,2.16469 H 12 L 10.750152,16.3296 H 8.2505363 L 7.0006881,14.16484 5.7508392,12.00015 7.0006881,9.83539 8.2505363,7.67051 h 2.4996157 2.499696 L 12,5.50579 Z m 4.9993125,0 1.249849,2.16472 1.249848,2.16488 h -2.499697 l -1.249767,2.16476 h 2.499616 l 1.249848,2.16469 -1.249848,2.16476 -1.249849,2.16476 h 2.499697 l 1.249849,-2.16476 1.249766,-2.16476 c 1.249826,-2.16476 1.249826,-2.16469 0,-4.32945 L 18.249161,7.67051 16.999312,5.50579 Z"/>
          </svg> Germinate
        </template>
        <p v-html="$t('modalTextExportGerminate')" />
        <div>
          <div v-if="hasMultiTrait && storeTraits && storeTraits.length > 0">
            <b-form @submit.prevent>

              <b-form-group :label="$t('formLabelExportGerminateAggregation')" label-for="aggregation" :description="$t('formDescriptionExportGerminateAggregation')">
                <b-form-checkbox id="aggregation" switch v-model="multiTraitAggregation">{{ $t(multiTraitAggregation ? 'buttonYes' : 'buttonNo') }}</b-form-checkbox>
              </b-form-group>

              <div v-if="multiTraitAggregation">
                <p>{{ $t('modalTextExportGerminateMultiSelection') }}</p>

                <template v-for="(trait, index) in storeTraits">
                  <b-form-group :label="trait.name"
                                :label-for="`trait-select-${trait.name}`"
                                :key="`trait-select-${trait.name}`"
                                :content-cols="12"
                                :label-cols="12"
                                :content-cols-lg="10"
                                :label-cols-lg="2"
                                class="align-items-center"
                                v-if="trait.mType === 'multi'">
                    <template #label>
                      <TraitHeading :trait="trait" mode="full" />
                    </template>
                    <b-form-radio-group
                      :id="`trait-select-${trait.name}`"
                      v-model="multiTraitSelection[index]"
                      :options="multiTraitOptions[index]" />
                  </b-form-group>
                </template>
              </div>
            </b-form>
          </div>

          <b-button @click="exportToGerminateFormat"><BIconFileEarmarkSpreadsheet /> {{ $t('buttonExportGerminateFormat') }}</b-button>

          <div v-if="germinateTemplateFile" class="my-3">
            <BIconDownload /> <a :href="germinateTemplateFile" @click="() => { germinateTemplateFile = null }"> {{ $t('linkExport') }}</a>
          </div>
        </div>
        <div class="mt-3" v-if="canExportShapefile">
          <b-button @click="exportShapefile"><BIconGrid3x2Gap /> {{ $t('buttonExportGerminateShapefile') }}</b-button>
          <div v-if="shapeFile" class="my-3">
            <BIconDownload /> <a :href="shapeFile" @click="() => { shapeFile = null }"> {{ $t('linkExport') }}</a>
          </div>
        </div>
      </b-tab>
      <b-tab lazy>
        <template #title>
          <IconBrapi /> {{ $t('tabTitleExportBrAPI') }}
        </template>
        <p v-html="$t('modalTextExportBrAPI')" />

        <BrapiExportSection />
      </b-tab>
    </b-tabs>

    <HelpModal url="https://cropgeeks.github.io/gridscore/exporting-data.html" ref="helpModal" />
  </b-container>
</template>

<script>
import { BIconDownload, BIconArrowLeft, BIconTags, BIconFileEarmarkSpreadsheet, BIconQuestionCircleFill, BIconGrid3x3, BIconGrid3x2Gap } from 'bootstrap-vue'

import { mapGetters } from 'vuex'

import TraitHeading from '@/components/TraitHeading'
import HelpModal from '@/components/modals/HelpModal'
import IconBrapi from '@/components/IconBrapi'
import BrapiExportSection from '@/components/BrapiExportSection'

import api from '@/mixin/api'

const fixPer = require('fix-perspective')
const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconDownload,
    BIconArrowLeft,
    BIconTags,
    BIconFileEarmarkSpreadsheet,
    BIconQuestionCircleFill,
    BIconGrid3x3,
    BIconGrid3x2Gap,
    BrapiExportSection,
    HelpModal,
    IconBrapi,
    TraitHeading
  },
  data: function () {
    return {
      selectedTrait: null,
      germinateTemplateFile: null,
      multiTraitAggregation: false,
      shapeFile: null,
      multiTraitOptions: [],
      multiTraitSelection: []
    }
  },
  watch: {
    storeTraits: function () {
      this.updateMultiTraitOptions()
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeCols',
      'storeDarkMode',
      'storeDatasetId',
      'storeDatasetUuid',
      'storeDatasetName',
      'storeCornerPoints',
      'storeRows',
      'storeServerUrl',
      'storeTraits',
      'storeTraitColors'
    ]),
    canExportShapefile: function () {
      return this.storeCornerPoints && this.storeCornerPoints.length === 4 && this.storeCornerPoints.every(cp => cp !== null)
    },
    hasMultiTrait: function () {
      if (!this.storeTraits) {
        return false
      } else {
        return this.storeTraits.some(t => t.mType === 'multi')
      }
    },
    traitOptions: function () {
      if (this.storeTraits) {
        const result = this.storeTraits.map((t, index) => {
          return {
            value: index,
            text: t.name
          }
        })
        result.unshift({
          value: 'rep',
          text: this.$t('formLabelSettingsReps')
        })
        result.unshift({
          value: 'name',
          text: this.$t('formLabelSettingsVarieties')
        })
        result.unshift({
          value: null,
          text: this.$t('formSelectOption')
        })
        return result
      } else {
        return []
      }
    },
    safeFilename: function () {
      if (this.storeDatasetName) {
        return this.storeDatasetName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      } else {
        return ''
      }
    },
    safeSelectedTraitName: function () {
      if (this.selectedTrait !== null) {
        if (this.selectedTrait === 'name') {
          return 'name'
        } else if (this.selectedTrait === 'rep') {
          return 'rep'
        } else {
          return this.storeTraits[this.selectedTrait].name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
        }
      } else {
        return ''
      }
    },
    getFilenameData: function () {
      return `data-${this.safeFilename}-${new Date().toISOString().split('T')[0]}.txt`
    },
    getFilenameDates: function () {
      return `dates-${this.safeFilename}-${new Date().toISOString().split('T')[0]}.txt`
    },
    getFilenameTraits: function () {
      return `traits-${this.safeFilename}-${new Date().toISOString().split('T')[0]}.txt`
    },
    getFilenameFieldPlan: function () {
      return `field-plan-${this.safeSelectedTraitName}-${this.safeFilename}-${new Date().toISOString().split('T')[0]}.txt`
    },
    getHrefDates: function () {
      return 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.datesText)
    },
    getHrefData: function () {
      return 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.text)
    },
    getHrefTraits: function () {
      return 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.storeTraits)
    },
    getHrefFieldPlant: function () {
      return 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.fieldPlan)
    },
    traits: function () {
      if (!this.storeTraits || this.storeTraits.length < 1) {
        return this.$t('labelNoData')
      }

      // Header row
      let result = 'Name\tShort Name\tDescription\tData Type\tUnit Name\tUnit Abbreviation\tUnit Descriptions\tTrait categories (comma separated)\tMin (only for numeric traits)\tMax (only for numeric traits)\n'

      // Map traits to row data
      result += this.storeTraits.map(t => {
        // Get the type (Germinate specific)
        let type
        switch (t.type) {
          case 'int':
          case 'float':
            type = 'numeric'
            break
          case 'date':
          case 'text':
          case 'categorical':
            type = t.type
            break
          default:
            type = 'text'
            break
        }

        // Set restrictions
        const categories = (t.type === 'categorical' && t.restrictions && t.restrictions.categories) ? `[[${t.restrictions.categories.join(',')}]]` : ''
        const min = ((t.type === 'int' || t.type === 'float') && t.restrictions && t.restrictions.min !== undefined && t.restrictions.min !== null) ? t.restrictions.min : ''
        const max = ((t.type === 'int' || t.type === 'float') && t.restrictions && t.restrictions.max !== undefined && t.restrictions.max !== null) ? t.restrictions.max : ''

        // Return formatted data
        return `${t.name}\t${t.name.substring(0, 10)}\t${t.name}\t${type}\t\t\t\t${categories}\t${min}\t${max}`
      }).join('\n')

      return result
    },
    datesText: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (!storeData || storeData.size < 1 || !this.storeTraits || this.storeTraits.length < 1) {
        return this.$t('labelNoData')
      }

      // Header row
      let result = `Line/Trait\tRep\t${this.storeTraits.map(t => t.name).join('\t')}\tLat\tLng\tElv\tComment`

      // For each field row
      for (let y = 0; y < this.storeRows; y++) {
        // And each field column
        for (let x = 0; x < this.storeCols; x++) {
          // Get the data cell
          const cell = storeData.get(`${y}-${x}`)
          // If there is data
          if (cell) {
            // Get it
            const data = cell.dates
            // If there is a value and they aren't all empty
            if (cell.comment || (data && data.length > 0 && !data.every(c => c === null || c.length < 1))) {
              result += '\n'
              // Variety name
              result += cell.name
              // Rep
              result += '\t' + (cell.rep || '')

              // Values joined
              result += '\t' + data.join('\t')

              // Geolocation if available
              if (cell.geolocation) {
                result += '\t' + (cell.geolocation.lat ? cell.geolocation.lat : '')
                result += '\t' + (cell.geolocation.lng ? cell.geolocation.lng : '')
                result += '\t' + (cell.geolocation.elv ? cell.geolocation.elv : '')
              } else {
                result += '\t\t\t'
              }

              // Comments
              result += '\t' + (cell.comment ? cell.comment.replace(/\r?\n/, ' ') : '')
            }
          }
        }
      }

      return result
    },
    text: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (!storeData || storeData.length < 1 || !this.storeTraits || this.storeTraits.length < 1) {
        return this.$t('labelNoData')
      }

      // Header row
      let result = `Line/Trait\tRep\t${this.storeTraits.map(t => t.name).join('\t')}\tLat\tLng\tElv\tComment`

      // For each field row
      for (let y = 0; y < this.storeRows; y++) {
        // And each field column
        for (let x = 0; x < this.storeCols; x++) {
          // Get the data cell
          const cell = storeData.get(`${y}-${x}`)
          // If there is data
          if (cell) {
            // Get it
            const data = cell.values
            // If there is a value and they aren't all empty
            if (cell.comment || (data && data.length > 0 && !data.every(c => c === null || c.length < 1))) {
              result += '\n'
              // Variety name
              result += cell.name
              // Rep
              result += '\t' + (cell.rep || '')

              // Values joined
              result += '\t' + data.join('\t')

              // Geolocation if available
              if (cell.geolocation) {
                result += '\t' + (cell.geolocation.lat ? cell.geolocation.lat : '')
                result += '\t' + (cell.geolocation.lng ? cell.geolocation.lng : '')
                result += '\t' + (cell.geolocation.elv ? cell.geolocation.elv : '')
              } else {
                result += '\t\t\t'
              }

              // Comments
              result += '\t' + (cell.comment ? cell.comment.replace(/\r?\n/, ' ') : '')
            }
          }
        }
      }

      return result
    },
    fieldPlan: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (!storeData || storeData.length < 1 || !this.storeTraits || this.storeTraits.length < 1 || this.selectedTrait === null) {
        return this.$t('labelNoData')
      }

      // Header row
      let result = ''

      // For each field row
      for (let y = 0; y < this.storeRows; y++) {
        // And each field column
        for (let x = 0; x < this.storeCols; x++) {
          if (x > 0) {
            result += '\t'
          }

          // Get the data cell
          const cell = storeData.get(`${y}-${x}`)
          // If there is data
          if (cell) {
            if (this.selectedTrait === 'name') {
              result += cell.name || ''
            } else if (this.selectedTrait === 'rep') {
              result += cell.rep || ''
            } else {
              result += cell.values[this.selectedTrait] || ''
            }
          }
        }
        result += '\n'
      }

      return result
    }
  },
  mixins: [api],
  methods: {
    updateMultiTraitOptions: function () {
      if (this.storeTraits) {
        this.multiTraitOptions = this.storeTraits.map(t => t.mType === 'multi' ? this.getMultiTraitMethods(t) : null)
        this.multiTraitSelection = this.storeTraits.map(t => t.mType === 'multi' ? 'last' : null)
      } else {
        this.multiTraitOptions = []
        this.multiTraitSelection = []
      }
    },
    exportShapefile: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (storeData) {
        this.synchronizeDataset(this.storeDatasetId)
          .then(dataset => {
            emitter.emit('set-loading', true)

            const to = this.storeCornerPoints.filter(l => l !== null).map(l => { return { x: l[0], y: l[1] } })
            const from = [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
              { x: 100, y: 100 },
              { x: 0, y: 100 }
            ]
            const transform = fixPer(from, to)

            const result = {}
            for (let x = 0; x <= this.storeCols; x++) {
              for (let y = 0; y <= this.storeRows; y++) {
                const p = transform((100.0 / this.storeCols) * x, (100.0 / this.storeRows) * y)

                result[`${x}-${this.storeRows - y}`] = [p.x, p.y]
              }
            }

            return this.axios(`config/${dataset.uuid}/export-shapefile`, result, 'post')
          })
          .then(result => {
            emitter.emit('set-loading', true)

            this.shapeFile = `${this.storeServerUrl}config/${this.storeDatasetUuid}/export-shapefile/${result.data}`

            this.plausibleEvent('dataset-export', { format: 'shapefile' })
          })
          .catch(() => {
            // TODO
          })
          .finally(() => emitter.emit('set-loading', false))
      }
    },
    exportToGerminateFormat: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (storeData) {
        this.synchronizeDataset(this.storeDatasetId)
          .then(dataset => {
            emitter.emit('set-loading', true)
            return this.axios(`config/${dataset.uuid}/export-g8`, this.multiTraitAggregation ? this.multiTraitSelection : [], 'post')
          })
          .then(result => {
            emitter.emit('set-loading', true)
            if (result && result.data) {
              this.germinateTemplateFile = `${this.storeServerUrl}config/${this.storeDatasetUuid}/export-g8/${result.data}`
            } else {
              this.germinateTemplateFile = null
            }

            this.plausibleEvent('dataset-export', { format: 'germinate' })
          })
          .catch(() => {
            // TODO
          })
          .finally(() => emitter.emit('set-loading', false))
      }
    }
  },
  mounted: function () {
    if (this.storeDatasetId !== undefined && this.storeDatasetId !== null && (!this.$store.state.dataset.data || this.$store.state.dataset.data.length < 1)) {
      this.$store.dispatch('loadDataset', { datasetId: this.storeDatasetId, redirect: false })
    } else {
      this.updateMultiTraitOptions()
    }
  }
}
</script>

<style>
.export-modal .progress {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.export-modal .progress + .input-group .form-control {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
