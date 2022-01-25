<template>
  <b-modal :title="$t('modalTitleAddTrait')"
           :ok-title="$t('buttonAdd')"
           :cancel-title="$t('buttonCancel')"
           no-fade
           @ok.prevent="onSubmit"
           @shown="$refs.traitName.focus()"
           ref="addTraitModal">
    <p>{{ $t('modalTextAddTrait') }}</p>
    <b-form @submit.prevent="onSubmit">
      <!-- Trait name -->
      <b-form-group :label="$t('formLabelAddTraitName')" label-for="trait-name" :description="$t('formDescriptionSettingsTraits')">
        <b-form-input id="trait-name" v-model="trait.name" required :state="state.name" ref="traitName" />
      </b-form-group>

      <!-- Trait data type selection -->
      <b-form-group :label="$t('formLabelAddTraitType')" label-for="trait-type">
        <b-input-group class="trait-type-select">
          <b-form-select id="trait-type" v-model="trait.type" :options="traitTypes" required :state="state.restrictions" />

          <template v-slot:append v-if="trait.type === 'int' || trait.type === 'float' || trait.type === 'categorical'">
            <b-button-group>
              <!-- Configuration button for numeric and categorical traits -->
              <b-button variant="info" :title="$t('buttonConfigure')" @click="$refs.traitConfigModal.show()"><BIconGear /></b-button>
            </b-button-group>
          </template>
        </b-input-group>
      </b-form-group>

      <b-form-group :label="$t('formLabelAddTraitMType')" :description="$t('tooltipTraitMType')" label-for="trait-mtype">
        <b-form-select id="trait-mtype" v-model="trait.mType" :options="traitMTypes" required />
      </b-form-group>
    </b-form>

    <!-- Modal to show configuration options for a selected trait -->
    <TraitConfigurationModal :trait="trait" v-on:config-changed="updateTraitConfig" ref="traitConfigModal" />
  </b-modal>
</template>

<script>
import TraitConfigurationModal from '@/components/modals/TraitConfigurationModal'

import { BIconGear } from 'bootstrap-vue'

export default {
  components: {
    BIconGear,
    TraitConfigurationModal
  },
  props: {
    dataset: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      trait: {
        name: null,
        type: 'date',
        mType: 'single',
        restrictions: null
      },
      state: {
        name: null,
        restrictions: null
      },
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
      }]
    }
  },
  methods: {
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.trait = {
        name: null,
        type: 'date',
        mType: 'single',
        restrictions: null
      }
      this.state = {
        name: null,
        restrictions: null
      }

      this.$refs.addTraitModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.addTraitModal.hide())
    },
    /**
     * Sets the trait configuration (restrictions) on the currently selected trait based on the provided new configuration
     * @param newConfig The new configuration
     */
    updateTraitConfig: function (newConfig) {
      switch (this.trait.type) {
        case 'int':
        case 'float':
          this.trait.restrictions = {
            min: newConfig.min,
            max: newConfig.max
          }
          break
        case 'categorical':
          this.trait.restrictions = {
            categories: newConfig.categories
          }
          break
      }
    },
    onSubmit: function () {
      this.state.name = this.trait.name !== null
      this.state.restrictions = null

      if (this.trait.type === 'categorical' && (!this.trait.restrictions || !this.trait.restrictions.categories || this.trait.restrictions.categories.length < 1)) {
        this.state.restrictions = false
      }

      if (this.state.name === false || this.state.restrictions === false) {
        return
      }

      this.$store.dispatch('addTraitToDataset', { datasetId: this.dataset.id, trait: JSON.parse(JSON.stringify(this.trait)) })

      this.hide()
    }
  }
}
</script>

<style>

</style>
