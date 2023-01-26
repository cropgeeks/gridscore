<template>
  <BrapiModal ref="brapiTraitImportModal"
              :title="'modalTitleBrapiTraitImport'"
              :okTitle="'buttonOk'"
              :cancelTitle="'buttonCancel'"
              :okDisabled="!selectedTraits || selectedTraits.length < 1"
              @submit="onSubmit"
              no-fade
              @brapi-url-changed="getTraits">
    <!-- Fill the slot with the content, assuming the loading state is set -->
    <template v-slot:content v-if="loading !== null">
      <p class="text-danger" v-if="errorMessage">{{ errorMessage }}</p>
      <!-- If it is loading, show the indicator -->
      <div class="text-center" v-if="loading === true">
        <b-spinner type="grow" variant="primary" />
      </div>
      <!-- Else, show the selection -->
      <b-form @submit.prevent="onSubmit" v-else>
        <p v-if="formState === false" class="text-danger">{{ $t('modalTextWarningBrapiTraitImport') }}</p>
        <b-button-group>
          <b-button @click="onSelectTraits(true)"><BIconListCheck /> {{ $t('buttonSelectAll') }}</b-button>
          <b-button @click="onSelectTraits(false)"><BIconListUl /> {{ $t('buttonSelectNone') }}</b-button>
        </b-button-group>
        <!-- Checkbox group representing the list of traits -->
        <b-form-checkbox-group v-model="selectedTraits"
                              :options="traitOptions"
                              required
                              stacked>
        </b-form-checkbox-group>
      </b-form>
    </template>
  </BrapiModal>
</template>

<script>
import BrapiModal from '@/components/modals/BrapiModal'

import brapi from '@/mixin/brapi'

import { BIconListCheck, BIconListUl } from 'bootstrap-vue'

/**
 * Modal used to import trait information from a BrAPI source.
 * @emits `traits-selected` List of traits to add
 */
export default {
  components: {
    BIconListCheck,
    BIconListUl,
    BrapiModal
  },
  data: function () {
    return {
      traits: null,
      selectedTraits: [],
      errorMessage: null,
      formState: true,
      loading: null,
      brapiConfig: null
    }
  },
  computed: {
    /** The trait options for the checkbox component */
    traitOptions: function () {
      if (this.traits && this.traits.length > 0) {
        return this.traits.concat().sort((a, b) => {
          // Sort by name
          if (a.observationVariableName < b.observationVariableName) {
            return -1
          }
          if (a.observationVariableName > b.observationVariableName) {
            return 1
          }
          return 0
        }).map(t => {
          // Then map to HTML showing the name, type as well as the restrictions.
          const name = t.observationVariableName
          let type = ''
          let restrictions = ''

          if (t.scale) {
            switch (t.scale.dataType) {
              case 'Date':
                type = this.$t('traitTypeDate')
                break
              case 'Text':
                type = this.$t('traitTypeText')
                break
              case 'Numeric':
                type = this.$t('traitTypeFloat')
                break
              case 'Duration':
                type = this.$t('traitTypeInt')
                break
              case 'Ordinal':
                type = this.$t('traitTypeCategorical')
                break
              default:
                type = ''
                break
            }

            if (type && type.length > 0) {
              type = `<span class="badge badge-primary ml-2">${type}</span>`
            }

            if (t.scale.validValues) {
              if (t.scale.validValues.min !== undefined && t.scale.validValues.min !== null) {
                restrictions += `<span class="badge badge-secondary ml-2">&ge;${t.scale.validValues.min}</span>`
              }
              if (t.scale.validValues.max !== undefined && t.scale.validValues.max !== null) {
                restrictions += `<span class="badge badge-secondary ml-2">&le;${t.scale.validValues.max}</span>`
              }
              if (t.scale.validValues.categories) {
                restrictions += `<span class="badge badge-secondary ml-2">${t.scale.validValues.categories.map(tr => tr.value).join(', ')}</span>`
              }
            }
          }

          return {
            html: `<span>${name}</span>${type}${restrictions}`,
            value: t
          }
        })
      } else {
        return []
      }
    }
  },
  mixins: [brapi],
  methods: {
    /**
     * Shows the modal and resets it to its default values
     */
    show: function () {
      this.formState = true
      this.selectedTraits = []
      this.traits = []
      this.errorMessage = null

      this.$nextTick(() => this.$refs.brapiTraitImportModal.show())
    },
    /**
     * Hides the modal
     */
    hide: function () {
      this.$nextTick(() => this.$refs.brapiTraitImportModal.hide())
    },
    /**
     * Handles the submit button
     */
    onSubmit: function () {
      this.formState = this.selectedTraits && this.selectedTraits.length > 0

      if (this.formState === false) {
        return
      }

      this.$emit('traits-selected', {
        brapiConfig: this.brapiConfig,
        traits: this.selectedTraits
      })

      this.hide()
    },
    /**
     * Gets the traits from the BrAPI URL provided by the wrapped component
     */
    getTraits: function (config) {
      this.loading = true
      this.brapiConfig = config
      this.brapiGetVariables()
        .then(variables => {
          this.traits = variables
          this.loading = false
          this.errorMessage = null
        })
        .catch(error => {
          this.errorMessage = error
          this.traits = []
          this.loading = false
        })
    },
    onSelectTraits: function (selectAll) {
      if (selectAll) {
        this.selectedTraits = this.traits.concat()
      } else {
        this.selectedTraits = []
      }
    }
  }
}
</script>

<style>

</style>
