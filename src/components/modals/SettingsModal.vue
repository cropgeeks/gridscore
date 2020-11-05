<template>
  <div>
    <b-modal :ok-title="$t('buttonOk')"
            :cancel-title="$t('buttonCancel')"
            :title="$t('modalTitleSettings')"
            scrollable
            @ok.prevent="onSubmit"
            ref="settingsModal">
      <b-form @submit.prevent="onSubmit" :validated="formValidated">
        <b-form-group :label="$t('formLabelSettingsTruncate')" label-for="truncate">
          <!-- Input for truncation length value -->
          <b-form-input :min="1" type="number" v-model.number="truncate" :state="formState.truncate" required />
        </b-form-group>

        <b-form-checkbox v-model="shouldUseGps" switch>{{ $t('buttonToggleGps') }}</b-form-checkbox>
      </b-form>
    </b-modal>
  </div>
</template>

<script>
/**
 * Modal to let the user change some basic settings like truncation of variety names.
 */
export default {
  data: function () {
    return {
      formValidated: false,
      formState: {
        truncate: null
      },
      truncate: 4,
      shouldUseGps: true
    }
  },
  methods: {
    /**
     * Shows the resets modal dialog
     */
    show: function () {
      this.reset()
      this.$nextTick(() => this.$refs.settingsModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.settingsModal.hide())
    },
    /**
     * Resets the dialog to its initial state
     */
    reset: function () {
      this.formValidated = false
      this.formState = {
        truncate: null
      }

      this.truncate = this.dataset.truncateNames
      this.shouldUseGps = this.useGps
    },
    onSubmit: function () {
      // Set the form to validated
      this.formValidated = true
      // Check all fields
      this.formState.truncate = this.truncate !== undefined && this.truncate !== null && this.truncate !== '' && this.truncate > 0

      // If a field is not valid, return
      if (this.formState.truncate === false) {
        return
      }

      // Otherwise, dispatch to the store
      this.$store.dispatch('setTruncateNames', this.truncate)
      this.$store.dispatch('setUseGps', this.shouldUseGps)
      this.hide()
    }
  },
  mounted: function () {
    this.reset()
  }
}
</script>

<style>

</style>
