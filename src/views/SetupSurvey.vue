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
          <!-- Field layout varieties -->
          <b-form-group label-for="varieties">
            <!-- Variety label -->
            <template v-slot:label>
              <div><BIconTextLeft /><span> {{ $t('formLabelSettingsVarieties') }} </span><span id="variety-label"> <BIconInfoCircle /></span></div>
              <!-- Tooltip for the variety label info icon -->
              <b-tooltip target="variety-label">
                <div>{{ $t('tooltipSettingsSurveyVarieties') }}</div>
              </b-tooltip>
            </template>
            <!-- Variety names input -->
            <b-form-textarea id="varieties" :state="state.varieties" rows=6 wrap="off" required :placeholder="$t('formPlaceholderVarietiesSurvey')" v-model="varieties" />
            <!-- Variety names file loading -->
            <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="text/plain" v-model="varietiesFile" />
            <b-form-invalid-feedback :state="state.varieties">
              {{ $t('formFeedbackSetupSurveyVarietyDuplicates') }}
            </b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col cols=12 lg=6>
          <!-- Trait definitions -->
          <TraitDefinitions ref="traitDefinitions" :state="state" @brapi-config-changed="onBrapiConfigChanged" />
        </b-col>
      </b-row>
    </b-form>

    <b-button @click="onSubmit" variant="primary" class="mt-3"><BIconJournalPlus /> {{ $t('buttonCreateSurvey') }}</b-button>

    <HelpModal url="https://cropgeeks.github.io/gridscore/survey-setup.html" ref="helpModal" />
  </b-container>
</template>

<script>
import HelpModal from '@/components/modals/HelpModal'
import TraitDefinitions from '@/components/TraitDefinitions'

import { mapGetters } from 'vuex'
import { BIconArrowLeft, BIconQuestionCircleFill, BIconTextLeft, BIconJournalPlus, BIconInfoCircle, BIconTextareaT } from 'bootstrap-vue'

/**
 * Settings modal used to set up trials. Define varieties, traits, field corner points, etc.
 */
export default {
  data: function () {
    return {
      datasetName: null,
      brapiConfig: null,
      varieties: null,
      formValidated: false,
      state: {
        datasetName: null,
        rows: null,
        cols: null,
        traits: null,
        varieties: null
      },
      varietiesFile: null
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDatasetId',
      'storeDatasetName'
    ])
  },
  watch: {
    varietiesFile: function (newValue) {
      if (newValue) {
        this.loadVarietiesFile()
      }
    },
    storeDatasetId: function () {
      this.reset()
    },
    storeDatasetName: function () {
      this.reset()
    }
  },
  components: {
    BIconArrowLeft,
    BIconQuestionCircleFill,
    BIconTextLeft,
    BIconInfoCircle,
    BIconJournalPlus,
    BIconTextareaT,
    HelpModal,
    TraitDefinitions
  },
  methods: {
    /**
     * Loads the variety list from the file selected by the file input.
     */
    loadVarietiesFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.varieties = event.target.result.replace(/\r/g, '')
        this.varietiesFile = null
      }
      reader.readAsText(this.varietiesFile)
    },
    /**
     * Resets the modal state based on the current configuration of the dataset
     */
    reset: function () {
      if (this.$refs.traitDefinitions) {
        this.$refs.traitDefinitions.reset()
      }
      this.datasetName = null
      this.cols = 1
      this.brapiConfig = null
      this.varieties = null
      this.formValidated = false
      this.state = {
        datasetName: null,
        rows: null,
        cols: null,
        traits: null,
        varieties: null
      }
      this.varietiesFile = null
    },
    hasDuplicates: function (varieties) {
      return varieties.length !== (new Set(varieties)).size
    },
    /**
     * Submit the result and re-create the current dataset with the new configuration.
     */
    onSubmit: function () {
      // Validate the form
      const newTraits = this.$refs.traitDefinitions.getTraits()
      this.formValidated = true
      this.state = {
        datasetName: this.datasetName !== undefined && this.datasetName !== null && this.datasetName.length > 0,
        rows: true,
        cols: true,
        traits: (newTraits !== null) && (newTraits.length > 0),
        varieties: (this.varieties !== null) && (this.varieties.length > 0) && (!this.hasDuplicates(this.varieties.split('\n').map(v => v.trim())))
      }

      // If a trait is missing it's configuration, return
      if (newTraits.filter(t => t.type === 'categorical' && (!t.restrictions || !t.restrictions.categories || t.restrictions.categories.length < 1)).length > 0) {
        return
      }

      // If everything is set, continue
      if (this.state.rows && this.state.cols && this.state.traits && this.state.varieties) {
        // Ask for confirmation
        this.$bvModal.msgBoxConfirm(this.$t('modalTextSetupWarning'), {
          title: this.$t('modalTitleSetupWarning'),
          okTitle: this.$t('buttonOk'),
          cancelTitle: this.$t('buttonCancel')
        }).then(value => {
          if (value === true) {
            const dataset = {
              name: this.datasetName,
              rows: this.varieties.split('\n').map(v => v.trim()).length,
              cols: 1,
              traits: newTraits,
              brapiConfig: this.brapiConfig,
              varieties: this.varieties.split('\n').map(v => v.trim()),
              cornerPoints: null,
              markers: null,
              datasetType: 'SURVEY',
              lastUpdatedOn: new Date().toISOString()
            }

            const data = []
            let counter = 0
            for (let y = 0; y < dataset.rows; y++) {
              const rowData = []
              for (let x = 0; x < dataset.cols; x++) {
                rowData.push({
                  name: dataset.varieties.length > counter ? dataset.varieties[counter++] : null,
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
              markers: false,
              cornerPoints: false
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
</style>
