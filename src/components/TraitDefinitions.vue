<template>
  <div>
    <!-- Trait definitions -->
    <b-list-group v-if="newTraits && newTraits.length > 0" class="mb-3 trait-list">
      <b-list-group-item v-for="(trait, index) in newTraits" :key="`trait-${index}`" :variant="getTraitVariant(trait)">
        <p>
          <span>{{ trait.name }}</span> <BIconCardText v-b-tooltip="trait.description" v-if="trait.description" />
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
        </p>

        <!-- Trait data type selection -->
        <b-input-group>
          <b-form-select v-model="trait.type" :options="traitTypes" />
          <b-form-select v-model="trait.mType" :options="traitMTypes" v-b-tooltip="{ title: $t('tooltipTraitMType'), boundary: 'window' }" />

          <template v-slot:append>
            <b-button-group>
              <!-- Configuration button for numeric and categorical traits -->
              <b-button variant="info" :title="$t('buttonConfigure')" @click="configureTrait(index)"><BIconGear /></b-button>
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
          <b-button variant="success" :title="$t('buttonAdd')" @click="addTrait" :disabled="!trait || trait.length < 1"><BIconPlus /></b-button>
        </template>
      </b-input-group>
    </b-form-group>

    <!-- Trait BrAPI import -->
    <b-button @click="$refs.brapiTraitImportModal.show()" class="mb-3"><IconBrapi /> {{ $t('buttonBrapiTraitImport') }}</b-button>

    <!-- Modal to show configuration options for a selected trait -->
    <TraitConfigurationModal :trait="traitToConfigure" v-on:config-changed="updateTraitConfig" ref="traitConfigModal" />
    <!-- Modal for trait import via BrAPI -->
    <BrapiTraitImportModal ref="brapiTraitImportModal" @traits-selected="loadBrapiTraits" />
  </div>
</template>

<script>
import BrapiTraitImportModal from '@/components/modals/BrapiTraitImportModal'
import TraitConfigurationModal from '@/components/modals/TraitConfigurationModal'
import IconBrapi from '@/components/IconBrapi'

import { BIconGear, BIconPlus, BIconX, BIconTags, BIconCardText } from 'bootstrap-vue'

export default {
  components: {
    BIconGear,
    BIconPlus,
    BIconX,
    BIconTags,
    BIconCardText,
    IconBrapi,
    BrapiTraitImportModal,
    TraitConfigurationModal
  },
  props: {
    state: {
      type: Object,
      default: () => {
        return {
          traits: null
        }
      }
    }
  },
  data: function () {
    return {
      newTraits: [],
      traitToConfigure: null,
      trait: null
    }
  },
  computed: {
    traitTypes: function () {
      return [{
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
      }]
    },
    traitMTypes: function () {
      return [{
        value: 'single',
        text: this.$t('traitMTypeSingle')
      }, {
        value: 'multi',
        text: this.$t('traitMTypeMulti')
      }]
    }
  },
  methods: {
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
     * Opens the trait configuration modal and sets the trait at the given index as the selected trait
     * @param index The index of the trait to configure
     */
    configureTrait: function (index) {
      this.traitToConfigure = this.newTraits[index]

      this.$nextTick(() => this.$refs.traitConfigModal.show())
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

      this.traitToConfigure.description = newConfig.description
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
            description: null,
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
     * Loads the given selected BrAPI traits into the list of new traits for this dataset
     * @param brapiTraits The traits selected in the BrAPI modal dialog
     */
    loadBrapiTraits: function (brapiTraits) {
      if (brapiTraits && brapiTraits.traits && brapiTraits.traits.length > 0) {
        this.$emit('brapi-config-changed', brapiTraits.brapiConfig)
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
            description: null,
            type: type,
            mType: 'single',
            restrictions: Object.keys(restrictions).length < 1 ? null : restrictions
          })
        })
      }
    },
    reset: function () {
      this.newTraits = []
      this.trait = null
    },
    getTraits: function () {
      return this.newTraits
    }
  }
}
</script>

<style scoped>
.trait-list {
  max-height: 50vh;
  overflow-y: auto;
}
</style>
