<template>
  <b-container>
    <h1><b-button :to="{ name: 'home' }"><BIconArrowLeft /></b-button> {{ $t('modalTitleSetup') }} <small><a href="#" class="text-secondary" @click="$refs.helpModal.show()"><BIconQuestionCircleFill /></a></small></h1>
    <hr />

    <b-form @submit.prevent="onSubmit" id="settings-form">
      <b-row>
        <b-col cols=12 lg=6>
          <!-- Dataset name -->
          <b-form-group label-for="dataset-name" :description="$t('formDescriptionSettingsDatasetName')">
            <template v-slot:label>
              <BIconTextareaT /><span> {{ $t('formLabelSettingsDatasetName') }}</span>
            </template>
            <b-form-input id="dataset-name" :state="state.datasetName" required autofocus v-model="datasetName" />
          </b-form-group>
          <!-- Field layout rows -->
          <b-form-group label-for="rows" :description="$t('formDescriptionSettingsRow')" >
            <template v-slot:label>
              <BIconLayoutThreeColumns rotate="90" /><span> {{ $t('formLabelSettingsRows') }}</span>
            </template>
            <b-form-input id="rows" :state="state.rows" number type="number" :min="1" required v-model.number="rows" />
          </b-form-group>
          <!-- Field layout cols -->
          <b-form-group label-for="cols" :description="$t('formDescriptionSettingsCol')">
            <template v-slot:label>
              <BIconLayoutThreeColumns /><span> {{ $t('formLabelSettingsCols') }}</span>
            </template>
            <b-form-input id="cols" :state="state.cols" number type="number" :min="1" required v-model.number="cols" />
          </b-form-group>
          <!-- Field layout varieties -->

          <b-form-group label-for="germplasm"
                        :label="$t('formLabelGermplasm')"
                        :state="state.germplasm"
                        :description="$t('formDescriptionGermplasm')"
                        :invalid-feedback="$t('formFeedbackGermplasmMissing')">
            <b-button :variant="state.germplasm === false ? 'danger' : (germplasmDataValid ? 'success' : 'primary')" id="germplasm" @click="germplasmGridVisible = true">
              <BIconCheck v-if="germplasmDataValid" />
              <BIconPencilSquare v-else />
              {{ germplasmDataValid ? $t('buttonChange') : $t('buttonDefine') }}
            </b-button>
          </b-form-group>
          <hr />
        </b-col>
        <b-col cols=12 lg=6>
          <!-- Trait definitions -->
          <TraitDefinitions ref="traitDefinitions" :state="state" @brapi-config-changed="onBrapiConfigChanged" />
        </b-col>
      </b-row>
      <!-- Map used for defining the field's corner points -->
      <b-button v-b-toggle.collapse-fieldmap id="map-toggle-button"><BIconBoundingBox /> {{ $t('buttonShowFieldMap') }}</b-button>
      <b-button class="mx-2" v-b-toggle.collapse-markers id="marker-toggle-button"><BIconSignpost2 /> {{ $t('buttonShowMarkerSetup') }}</b-button>
      <b-collapse accordion="option-accordion" id="collapse-fieldmap" class="mt-2" v-model="mapVisible" @shown="invalidateMap">
        <b-card>
          <FieldMap :rows="rows" :cols="cols" :useCurrentDataset="false" ref="map" />
        </b-card>
      </b-collapse>
      <b-collapse accordion="option-accordion" id="collapse-markers" class="mt-2" @shown="$refs.markerSetup.reset()">
        <b-card>
          <MarkerSetup :rows="rows" :cols="cols" :useCurrentDataset="false" ref="markerSetup" />
        </b-card>
      </b-collapse>
    </b-form>

    <b-button @click="onSubmit" variant="primary" class="mt-3"><BIconJournalPlus /> {{ $t('buttonCreateTrial') }}</b-button>

    <HelpModal url="https://cropgeeks.github.io/gridscore/trial-setup.html" ref="helpModal" />

    <b-sidebar
      id="germplasm-grid-sidebar"
      backdrop
      shadow
      no-close-on-esc
      width="100%"
      @shown="() => $refs.spreadsheetModal.show()"
      @hidden="() => $refs.spreadsheetModal.hide()"
      bg-variant="white"
      v-model="germplasmGridVisible">
      <template #header="{ hide }">
        <div class="d-flex flex-wrap align-items-start">
          <strong>{{ $t('pageSetupGermplasmGridSidebarTitle') }}</strong>
          <b-button class="ml-auto mr-2" @click="hide">
            <BIconX /> {{ $t('buttonCancel') }}
          </b-button>
          <b-button :variant="germplasmGridFeedback ? 'danger' : 'primary'" class="mx-2" @click="$refs.spreadsheetModal.emitResult()">
            <BIconSave /> {{ $t('buttonSave') }}
          </b-button>
        </div>
        <small v-if="germplasmGridFeedback" class="text-danger text-center">{{ germplasmGridFeedback }}</small>
      </template>
      <div class="px-3 py-2">
        <TrialSetupSpreadsheet :rows="rows" :cols="cols" :prevGermplasm="germplasmGrid" ref="spreadsheetModal" @grid-updated="germplasmUpdated" @grid-error="setGermplasmGridError" />
      </div>
    </b-sidebar>
  </b-container>
</template>

<script>
import FieldMap from '@/components/FieldMap'
import HelpModal from '@/components/modals/HelpModal'
import MarkerSetup from '@/components/MarkerSetup'
import TrialSetupSpreadsheet from '@/components/TrialSetupSpreadsheet'
import TraitDefinitions from '@/components/TraitDefinitions'

import { mapGetters } from 'vuex'
import { BIconArrowLeft, BIconCheck, BIconPencilSquare, BIconX, BIconSignpost2, BIconSave, BIconLayoutThreeColumns, BIconQuestionCircleFill, BIconJournalPlus, BIconBoundingBox, BIconTextareaT } from 'bootstrap-vue'

/**
 * Settings modal used to set up trials. Define varieties, traits, field corner points, etc.
 */
export default {
  data: function () {
    return {
      datasetName: null,
      rows: 1,
      cols: 1,
      markers: null,
      brapiConfig: null,
      formValidated: false,
      mapVisible: false,
      varietyFormat: 'tab',
      state: {
        datasetName: null,
        rows: null,
        cols: null,
        traits: null,
        germplasm: null
      },
      germplasmGrid: [[]],
      germplasmGridVisible: false,
      germplasmGridFeedback: null
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDatasetId',
      'storeDatasetName'
    ]),
    germplasmDataValid: function () {
      return this.germplasmGrid && this.germplasmGrid.length === this.rows && this.germplasmGrid.reduce((a, b) => a && (b.length === this.cols), true)
    }
  },
  watch: {
    storeDatasetId: function () {
      this.reset()
    },
    storeDatasetName: function () {
      this.reset()
    }
  },
  components: {
    BIconSave,
    BIconArrowLeft,
    BIconLayoutThreeColumns,
    BIconSignpost2,
    BIconQuestionCircleFill,
    BIconBoundingBox,
    BIconJournalPlus,
    BIconTextareaT,
    BIconCheck,
    BIconPencilSquare,
    BIconX,
    FieldMap,
    MarkerSetup,
    HelpModal,
    TrialSetupSpreadsheet,
    TraitDefinitions
  },
  methods: {
    onBrapiConfigChanged: function (brapiConfig) {
      this.brapiConfig = brapiConfig
    },
    setGermplasmGridError: function (feedback) {
      this.germplasmGridFeedback = feedback
    },
    germplasmUpdated: function (newData) {
      this.rows = newData.rows
      this.cols = newData.cols
      this.germplasmGrid = newData.data

      this.germplasmGridVisible = false
      this.germplasmGridFeedback = null
    },
    /**
     * Invalidates the map's size to make sure it's showing all its tiles properly
     */
    invalidateMap: function () {
      this.$nextTick(() => this.$refs.map.invalidateSize())
    },
    /**
     * Resets the modal state based on the current configuration of the dataset
     */
    reset: function () {
      if (this.$refs.traitDefinitions) {
        this.$refs.traitDefinitions.reset()
      }
      this.datasetName = null
      this.rows = 1
      this.cols = 1
      this.markers = null
      this.germplasmGrid = null
      this.brapiConfig = null
      this.formValidated = false
      this.state = {
        datasetName: null,
        rows: null,
        cols: null,
        traits: null,
        germplasm: null
      }
      this.mapVisible = false
    },
    /**
     * Submit the result and re-create the current dataset with the new configuration.
     */
    onSubmit: function () {
      const newTraits = this.$refs.traitDefinitions.getTraits()

      // Validate the form
      this.formValidated = true
      this.state = {
        datasetName: this.datasetName !== undefined && this.datasetName !== null && this.datasetName.length > 0,
        rows: this.rows > 0,
        cols: this.cols > 0,
        traits: (newTraits !== null) && (newTraits.length > 0),
        germplasm: this.germplasmGrid !== null && this.germplasmGrid.length === this.rows && this.germplasmGrid.reduce((a, b) => a && (b.length === this.cols), true)
      }

      // If a trait is missing it's configuration, return
      if (newTraits.filter(t => t.type === 'categorical' && (!t.restrictions || !t.restrictions.categories || t.restrictions.categories.length < 1)).length > 0) {
        return
      }

      // If everything is set, continue
      if (this.state.rows && this.state.cols && this.state.traits && this.state.germplasm) {
        // Ask for confirmation
        this.$bvModal.msgBoxConfirm(this.$t('modalTextSetupWarning'), {
          title: this.$t('modalTitleSetupWarning'),
          okTitle: this.$t('buttonOk'),
          cancelTitle: this.$t('buttonCancel')
        }).then(value => {
          if (value === true) {
            const dataset = {
              name: this.datasetName,
              rows: parseInt(this.rows),
              cols: parseInt(this.cols),
              traits: newTraits,
              brapiConfig: this.brapiConfig,
              varieties: null, // TODO: User germplasmGrid to set this here
              cornerPoints: this.$refs.map.getCornerPoints(),
              markers: this.$refs.markerSetup ? this.$refs.markerSetup.getMarkerConfig() : null,
              datasetType: 'TRIAL',
              lastUpdatedOn: new Date().toISOString()
            }

            const data = []
            for (let y = 0; y < dataset.rows; y++) {
              const rowData = []
              for (let x = 0; x < dataset.cols; x++) {
                const rep = (this.germplasmGrid[y][x].rep !== null && this.germplasmGrid[y][x].rep.length > 0) ? this.germplasmGrid[y][x].rep : null

                rowData.push({
                  name: this.germplasmGrid[y][x].name,
                  rep: rep,
                  dates: new Array(dataset.traits.length).fill(null),
                  values: new Array(dataset.traits.length).fill(null),
                  geolocation: null,
                  comment: null
                })
              }
              data.push(rowData)
            }
            dataset.data = data
            this.$store.dispatch('addDataset', dataset)

            this.plausibleEvent('dataset-setup', {
              rows: dataset.rows,
              cols: dataset.cols,
              traits: dataset.traits.length,
              markers: dataset.markers !== null,
              cornerPoints: dataset.cornerPoints !== null
            })
          }
        })
      }
    }
  },
  mounted: function () {
    this.reset()
  }
}
</script>

<style>
#settings-form .form-group textarea {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
#settings-form .form-group textarea + .b-form-file * {
  border-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
#germplasm-grid-sidebar .b-sidebar-header {
  flex-direction: column;
  align-items: stretch;
}
</style>
