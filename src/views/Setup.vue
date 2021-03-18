<template>
  <b-container>
    <h1><b-button :to="{ name: 'home' }"><BIconArrowLeft /></b-button> {{ $t('modalTitleSetup') }}</h1>
    <hr />
    <!-- Import and export buttons for json -->
    <b-button-group class="mb-3">
      <b-button @click="loadExampleData">{{ $t('buttonLoadExample') }}</b-button>
      <b-button @click="$refs.importModal.show()">{{ $t('buttonImport') }}</b-button>
      <b-button @click="$refs.exportModal.show()">{{ $t('buttonExport') }}</b-button>
    </b-button-group>

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
          <b-form-group label-for="varieties">
            <!-- Variety label -->
            <template v-slot:label>
              <BIconTextLeft /><span> {{ $t('formLabelSettingsVarieties') }} </span><span id="variety-label"> <BIconInfoCircle /></span>
              <!-- Tooltip for the variety label info icon -->
              <b-tooltip target="variety-label">
                <div>{{ $t('tooltipSettingsVarieties') }}</div>
                <div><b-img fluid src="img/variety-order.svg" width=75 height=75 /></div>
              </b-tooltip>
            </template>
            <!-- Variety names input -->
            <b-form-textarea id="varieties" :state="state.varieties" rows=6 required :placeholder="$t('formPlaceholderVarieties')" v-model="varieties" />
            <!-- Variety names file loading -->
            <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="text/plain" v-model="varietiesFile" />
          </b-form-group>
        </b-col>
        <b-col cols=12 lg=6>
          <!-- Trait definitions -->
          <b-list-group v-if="newTraits && newTraits.length > 0" class="mb-3 trait-list">
            <b-list-group-item v-for="(trait, index) in newTraits" :key="`trait-${index}`" class="d-flex justify-content-between align-items-center" :variant="getTraitVariant(trait)">
              <span>{{ trait.name }}</span>

              <!-- Trait data type selection -->
              <b-input-group class="trait-type-select">
                <b-form-select v-model="trait.type" :options="traitTypes" />

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
      <b-button v-b-toggle.collapse-1 id="map-toggle-button"><BIconBoundingBox /> {{ $t('buttonShowFieldMap') }}</b-button>
      <b-collapse id="collapse-1" class="mt-2" v-model="mapVisible" @shown="invalidateMap">
        <FieldMap :rows="rows" :cols="cols" :useCurrentDataset="false" ref="map" />
      </b-collapse>
    </b-form>

    <b-button @click="onSubmit" variant="primary" class="mt-3"><BIconPlus /> {{ $t('buttonAdd') }}</b-button>

    <!-- Modal to show json import/export -->
    <JsonExportModal ref="exportModal" />
    <JsonImportModal ref="importModal" />
    <!-- Modal to show configuration options for a selected trait -->
    <TraitConfigurationModal :trait="traitToConfigure" v-on:config-changed="updateTraitConfig" ref="traitConfigModal" />
    <!-- Modal for trait import via BrAPI -->
    <BrapiTraitImportModal ref="brapiTraitImportModal" @traits-selected="loadBrapiTraits" />
  </b-container>
</template>

<script>
import FieldMap from '@/components/FieldMap'
import BrapiTraitImportModal from '@/components/modals/BrapiTraitImportModal'
import JsonImportModal from '@/components/modals/JsonImportModal'
import JsonExportModal from '@/components/modals/JsonExportModal'
import TraitConfigurationModal from '@/components/modals/TraitConfigurationModal'
import IconBrapi from '@/components/IconBrapi'

import { BIconGear, BIconArrowLeft, BIconPlus, BIconX, BIconLayoutThreeColumns, BIconTextLeft, BIconTags, BIconBoundingBox, BIconInfoCircle, BIconTextareaT } from 'bootstrap-vue'

/**
 * Settings modal used to set up trials. Define varieties, traits, field corner points, etc.
 */
export default {
  data: function () {
    return {
      datasetName: null,
      rows: 1,
      cols: 1,
      newTraits: null,
      trait: null,
      traitToConfigure: null,
      varieties: null,
      formValidated: false,
      mapVisible: false,
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
    BIconGear,
    BIconPlus,
    BIconArrowLeft,
    BIconX,
    BIconLayoutThreeColumns,
    BIconTextLeft,
    BIconBoundingBox,
    BIconTags,
    BIconInfoCircle,
    BIconTextareaT,
    IconBrapi,
    FieldMap,
    BrapiTraitImportModal,
    JsonImportModal,
    JsonExportModal,
    TraitConfigurationModal
  },
  methods: {
    /**
     * Loads the given selected BrAPI traits into the list of new traits for this dataset
     * @param brapiTraits The traits selected in the BrAPI modal dialog
     */
    loadBrapiTraits: function (brapiTraits) {
      if (brapiTraits && brapiTraits.length > 0) {
        brapiTraits.forEach(t => {
          let type = 'text'
          let restrictions = {}

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
        this.newTraits.push({
          name: this.trait,
          type: 'date',
          restrictions: null
        })
        this.trait = null
        this.$refs.traitName.focus()
      }
    },
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
      this.datasetName = null
      this.rows = 1
      this.cols = 1
      this.newTraits = []
      this.varieties = null
      this.formValidated = false
      this.state = {
        datasetName: null,
        rows: null,
        cols: null,
        traits: null,
        varieties: null
      }
      this.trait = null
      this.varietiesFile = null
      this.mapVisible = false
    },
    loadExampleData: function () {
      // Ask for confirmation
      this.$bvModal.msgBoxConfirm(this.$t('modalTextSetupWarning'), {
        title: this.$t('modalTitleSetupWarning'),
        okTitle: this.$t('buttonOk'),
        cancelTitle: this.$t('buttonCancel')
      }).then(value => {
        if (value === true) {
          this.$store.dispatch('addDataset', require('@/example-data.json'))
          // this.$router.push({ name: 'home' })
        }
      })
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
        varieties: (this.varieties !== null) && (this.varieties.length > 0)
      }

      // If a trait is missing it's configuration, return
      if (this.newTraits.filter(t => t.type === 'categorical' && (!t.restrictions || !t.restrictions.categories || t.restrictions.categories.length < 1)).length > 0) {
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
              rows: parseInt(this.rows),
              cols: parseInt(this.cols),
              traits: this.newTraits,
              varieties: this.varieties.split('\n'),
              cornerPoints: this.$refs.map.getCornerPoints()
            }

            let data = []
            let counter = 0
            for (let y = 0; y < dataset.rows; y++) {
              let rowData = []
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
  max-height: 30vh;
  overflow-y: auto;
}
</style>
