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
          <b-list-group v-if="newTraits && newTraits.length > 0" class="mb-3 trait-list">
            <b-list-group-item v-for="(trait, index) in newTraits" :key="`trait-${index}`" class="d-flex justify-content-between align-items-center" :variant="getTraitVariant(trait)">
              <span>
                <span>{{ trait.name }}</span>
                <template v-if="trait.type === 'categorical'">
                  <small class="form-text text-muted" v-if="trait.restrictions && trait.restrictions.categories && trait.restrictions.categories.length > 0">{{ trait.restrictions.categories.join(', ') }}</small>
                  <small class="form-text text-danger" v-else>{{ $t('formDescriptionTraitCategoryMissing') }}</small>
                </template>
                <template v-if="trait.type === 'int' || trait.type === 'float'">
                  <small class="form-text text-muted" v-if="trait.restrictions && ((trait.restrictions.min !== undefined && trait.restrictions.min !== null) || (trait.restrictions.max !== undefined && trait.restrictions.max !== null))">
                    <b-badge v-if="trait.restrictions.min !== null && trait.restrictions.min !== undefined">&ge; {{ trait.restrictions.min }}</b-badge>
                    <b-badge class="ml-1" v-if="trait.restrictions.max !== null && trait.restrictions.max !== undefined">&le; {{ trait.restrictions.max }}</b-badge>
                  </small>
                </template>
              </span>

              <!-- Trait data type selection -->
              <b-input-group class="trait-type-select">
                <b-form-select v-model="trait.type" :options="traitTypes" />
                <b-form-select v-model="trait.mType" :options="traitMTypes" v-b-tooltip="{ title: $t('tooltipTraitMType'), boundary: 'window' }" />

                <template v-slot:append>
                  <b-button-group>
                    <!-- Configuration button for numeric and categorical traits -->
                    <b-button variant="info" :title="$t('buttonConfigure')" @click="configureTrait(index)" v-if="trait.type === 'int' || trait.type === 'float' || trait.type === 'categorical'"><BIconGear /></b-button>
                    <!-- Delete trait -->
                    <b-button variant="danger" :title="$t('buttonDelete')" @click="newTraits.splice(index, 1)"><BIconX /></b-button>
                  </b-button-group>
                </template>
              </b-input-group>
            </b-list-group-item>
          </b-list-group>
          <b-form-group label-for="trait" :description="$t('formDescriptionSettingsTraits')">
            <template v-slot:label>
              <BIconTags /><span> {{ $t('formLabelSettingsTraits') }}</span>
            </template>
            <b-input-group>
              <!-- New trait name -->
              <b-form-input id="trait" :state="state.traits" ref="traitName" required v-model="trait" v-on:keyup.enter="addTrait" />
              <template v-slot:append>
                <b-button variant="success" :title="$t('buttonAdd')" @click="addTrait"><BIconPlus /></b-button>
              </template>
            </b-input-group>
          </b-form-group>

          <!-- Trait BrAPI import -->
          <b-button @click="$refs.brapiTraitImportModal.show()" class="mb-3"><IconBrapi /> {{ $t('buttonBrapiTraitImport') }}</b-button>
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

    <!-- Modal to show configuration options for a selected trait -->
    <TraitConfigurationModal :trait="traitToConfigure" v-on:config-changed="updateTraitConfig" ref="traitConfigModal" />
    <!-- Modal for trait import via BrAPI -->
    <BrapiTraitImportModal ref="brapiTraitImportModal" @traits-selected="loadBrapiTraits" />

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
import BrapiTraitImportModal from '@/components/modals/BrapiTraitImportModal'
import TraitConfigurationModal from '@/components/modals/TraitConfigurationModal'
import HelpModal from '@/components/modals/HelpModal'
import IconBrapi from '@/components/IconBrapi'
import MarkerSetup from '@/components/MarkerSetup'
import TrialSetupSpreadsheet from '@/components/TrialSetupSpreadsheet'

import { mapGetters } from 'vuex'
import { BIconGear, BIconArrowLeft, BIconCheck, BIconPencilSquare, BIconPlus, BIconSignpost2, BIconSave, BIconX, BIconLayoutThreeColumns, BIconQuestionCircleFill, BIconJournalPlus, BIconTags, BIconBoundingBox, BIconTextareaT } from 'bootstrap-vue'

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
      newTraits: null,
      brapiConfig: null,
      trait: null,
      traitToConfigure: null,
      formValidated: false,
      mapVisible: false,
      varietyFormat: 'tab',
      traitTypes: [{
        value: 'date',
        text: this.$t('traitTypeDate')
      }, {
        value: 'int',
        text: this.$t('traitTypeInt')
      }, {
        value: 'float',
        text: this.$t('traitTypeFloat')
      }, {
        value: 'text',
        text: this.$t('traitTypeText')
      }, {
        value: 'categorical',
        text: this.$t('traitTypeCategorical')
      }],
      traitMTypes: [{
        value: 'single',
        text: this.$t('traitMTypeSingle')
      }, {
        value: 'multi',
        text: this.$t('traitMTypeMulti')
      }],
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
    BIconGear,
    BIconPlus,
    BIconSave,
    BIconArrowLeft,
    BIconX,
    BIconLayoutThreeColumns,
    BIconSignpost2,
    BIconQuestionCircleFill,
    BIconBoundingBox,
    BIconTags,
    BIconJournalPlus,
    BIconTextareaT,
    BIconCheck,
    BIconPencilSquare,
    IconBrapi,
    FieldMap,
    BrapiTraitImportModal,
    TraitConfigurationModal,
    MarkerSetup,
    HelpModal,
    TrialSetupSpreadsheet
  },
  methods: {
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
     * Loads the given selected BrAPI traits into the list of new traits for this dataset
     * @param brapiTraits The traits selected in the BrAPI modal dialog
     */
    loadBrapiTraits: function (brapiTraits) {
      if (brapiTraits && brapiTraits.traits && brapiTraits.traits.length > 0) {
        this.brapiConfig = brapiTraits.brapiConfig
        brapiTraits.traits.forEach(t => {
          let type = 'text'
          const restrictions = {}

          // Map the BrAPI data type to the internal data type
          if (t.scale && t.scale.dataType) {
            switch (t.scale.dataType) {
              case 'Date':
                type = 'date'
                break
              case 'Text':
                type = 'text'
                break
              case 'Numeric':
                type = 'float'
                break
              case 'Duration':
                type = 'int'
                break
              case 'Ordinal':
                type = 'categorical'
                break
              default:
                type = 'text'
                break
            }
          }

          // Check if there are any value restrictions on the trait
          if (t.scale && t.scale.validValues) {
            if (t.scale.validValues.min !== undefined && t.scale.validValues.min !== null) {
              restrictions.min = t.scale.validValues.min
            }
            if (t.scale.validValues.max !== undefined && t.scale.validValues.max !== null) {
              restrictions.max = t.scale.validValues.max
            }
            if (t.scale.validValues.categories && t.scale.validValues.categories.length > 0) {
              restrictions.categories = t.scale.validValues.categories.map(c => c.value)
            }
          }

          this.newTraits.push({
            brapiId: t.observationVariableDbId,
            name: t.observationVariableName,
            type: type,
            mType: 'single',
            restrictions: Object.keys(restrictions).length < 1 ? null : restrictions
          })
        })
      }
    },
    /**
     * Returns the bootstrap variant given a trait based on whether its required restrictions are set
     * @param trait The trait in question
     */
    getTraitVariant: function (trait) {
      if (trait.type === 'categorical' && (!trait.restrictions || trait.restrictions.length < 0)) {
        return 'danger'
      } else {
        return null
      }
    },
    /**
     * Sets the trait configuration (restrictions) on the currently selected trait based on the provided new configuration
     * @param newConfig The new configuration
     */
    updateTraitConfig: function (newConfig) {
      switch (this.traitToConfigure.type) {
        case 'int':
        case 'float':
          this.traitToConfigure.restrictions = {
            min: newConfig.min,
            max: newConfig.max
          }
          break
        case 'categorical':
          this.traitToConfigure.restrictions = {
            categories: newConfig.categories
          }
          break
      }
    },
    /**
     * Invalidates the map's size to make sure it's showing all its tiles properly
     */
    invalidateMap: function () {
      this.$nextTick(() => this.$refs.map.invalidateSize())
    },
    /**
     * Opens the trait configuration modal and sets the trait at the given index as the selected trait
     * @param index The index of the trait to configure
     */
    configureTrait: function (index) {
      this.traitToConfigure = this.newTraits[index]

      this.$nextTick(() => this.$refs.traitConfigModal.show())
    },
    /**
     * Adds a new trait to the list based on the content of the trait name input field. Empties and re-focusses the input field after the operation.
     */
    addTrait: function () {
      if (this.trait && this.trait.length > 0) {
        if (this.newTraits.some(nt => nt.name.toLowerCase() === this.trait.toLowerCase())) {
          this.$bvToast.toast(this.$t('toastTextTraitDuplicate'), {
            title: this.$t('toastTitleTraitDuplicate'),
            variant: 'danger',
            toaster: 'b-toaster-top-right'
          })
        } else {
          this.newTraits.push({
            name: this.trait,
            type: 'date',
            mType: 'single',
            restrictions: null
          })
          this.trait = null
          this.$refs.traitName.focus()
        }
      }
    },
    /**
     * Resets the modal state based on the current configuration of the dataset
     */
    reset: function () {
      this.datasetName = null
      this.rows = 1
      this.cols = 1
      this.markers = null
      this.newTraits = []
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
      this.trait = null
      this.mapVisible = false
    },
    /**
     * Submit the result and re-create the current dataset with the new configuration.
     */
    onSubmit: function () {
      // Validate the form
      this.formValidated = true
      this.state = {
        datasetName: this.datasetName !== undefined && this.datasetName !== null && this.datasetName.length > 0,
        rows: this.rows > 0,
        cols: this.cols > 0,
        traits: (this.newTraits !== null) && (this.newTraits.length > 0),
        germplasm: this.germplasmGrid !== null && this.germplasmGrid.length === this.rows && this.germplasmGrid.reduce((a, b) => a && (b.length === this.cols), true)
      }

      // If a trait is missing it's configuration, return
      if (this.newTraits.filter(t => t.type === 'categorical' && (!t.restrictions || !t.restrictions.categories || t.restrictions.categories.length < 1)).length > 0) {
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
              traits: this.newTraits,
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
.trait-type-select {
  max-width: 50%;
}
.trait-list {
  max-height: 50vh;
  overflow-y: auto;
}
#germplasm-grid-sidebar .b-sidebar-header {
  flex-direction: column;
  align-items: stretch;
}
</style>
