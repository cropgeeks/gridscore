<template>
  <BrapiModal ref="brapiTraitImportModal"
              :title="$t('modalTitleBrapiTraitImport')"
              :okTitle="$t('buttonOk')"
              :cancelTitle="$t('buttonCancel')"
              @submit="onSubmit"
              @brapi-url-changed="getTraits">
    <template v-slot:content v-if="loading !== null">
      <b-form @submit.prevent="onSubmit" v-if="loading === false">
        <p v-if="formState === false" class="text-danger">{{ $t('modalTextWarningBrapiTraitImport') }}</p>
        <b-form-checkbox-group v-model="selectedTraits"
                              :options="traitOptions"
                              required
                              stacked>
        </b-form-checkbox-group>
      </b-form>
      <div class="text-center" v-else>
        <b-spinner type="grow" variant="primary" />
      </div>
    </template>
  </BrapiModal>
</template>

<script>
import BrapiModal from '@/components/modals/BrapiModal'

import brapi from '@/mixin/brapi'

export default {
  data: function () {
    return {
      traits: null,
      selectedTraits: [],
      formState: true,
      loading: null
    }
  },
  computed: {
    traitOptions: function () {
      if (this.traits && this.traits.length > 0) {
        return this.traits.concat().sort((a, b) => {
          if (a.observationVariableName < b.observationVariableName) {
            return -1
          }
          if (a.observationVariableName > b.observationVariableName) {
            return 1
          }
          return 0
        }).map(t => {
          let html = `<span>${t.observationVariableName}</span>`

          if (t.scale && t.scale.validValues) {
            if (t.scale.validValues.min !== undefined && t.scale.validValues.min !== null) {
              html += `<span class="badge badge-secondary ml-2">&ge;${t.scale.validValues.min}</span>`
            }
            if (t.scale.validValues.max !== undefined && t.scale.validValues.max !== null) {
              html += `<span class="badge badge-secondary ml-2">&le;${t.scale.validValues.max}</span>`
            }
            if (t.scale.validValues.categories) {
              html += `<span class="badge badge-secondary ml-2">${t.scale.validValues.categories.map(tr => tr.value).join(', ')}</span>`
            }
          }

          return {
            html: html,
            value: t
          }
        })
      } else {
        return []
      }
    }
  },
  components: {
    BrapiModal
  },
  mixins: [ brapi ],
  methods: {
    show: function () {
      this.formState = true
      this.selectedTraits = []
      this.traits = []

      // this.getTraits()

      this.$nextTick(() => this.$refs.brapiTraitImportModal.show())
    },
    hide: function () {
      this.$nextTick(() => this.$refs.brapiTraitImportModal.hide())
    },
    onSubmit: function () {
      this.formState = this.selectedTraits && this.selectedTraits.length > 0

      if (this.formState === false) {
        return
      }

      this.$emit('traits-selected', this.selectedTraits)

      this.hide()
    },
    getTraits: function () {
      this.loading = true
      this.brapiGetVariables()
        .then(response => {
          if (response && response.data && response.data.result && response.data.result.data) {
            this.traits = response.data.result.data
          } else {
            this.traits = []
          }
          this.loading = false
        })
        .catch(err => {
          console.error(err)
          this.traits = []
          this.loading = false
        })
    }
  }
}
</script>

<style>

</style>
