<template>
  <div>
    <b-modal :ok-title="$t('buttonOk')"
            :cancel-title="$t('buttonCancel')"
            :title="$t('modalTitleSettings')"
            scrollable
            @ok.prevent="onSubmit"
            ref="settingsModal">
      <b-form @submit.prevent="onSubmit">
        <b-form-group :label="$t('formLabelSettingsGps')" label-for="use-gps">
          <b-form-checkbox v-model="tempUseGps" switch id="use-gps">{{ $t('buttonToggleGps') }}</b-form-checkbox>
        </b-form-group>
        <b-form-group :label="$t('formLabelSettingsContinuousInput')" label-for="continuous-input">
          <b-form-checkbox v-model="tempContinuousInput" switch id="continuous-input">{{ $t('buttonToggleContinuousInput') }}</b-form-checkbox>
        </b-form-group>
        <b-form-group :label="$t('formLabelSettingsGridLinesEvery')" label-for="grid-lines-every">
          <b-form-select :options="validGridLines" v-model="tempGridLinesEvery" id="grid-lines-every" />
        </b-form-group>
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
      tempUseGps: true,
      tempContinuousInput: false,
      tempGridLinesEvery: 5,
      validGridLines: [2, 3, 4, 5]
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
      this.tempUseGps = this.useGps
      this.tempContinuousInput = this.continuousInput
      this.tempGridLinesEvery = this.gridLinesEvery
    },
    onSubmit: function () {
      // Dispatch to the store
      if (this.tempUseGps !== this.useGps) {
        this.$store.dispatch('setUseGps', this.tempUseGps)
      }
      if (this.tempContinuousInput !== this.continuousInput) {
        this.$store.dispatch('setContinuousInput', this.tempContinuousInput)
      }
      if (this.tempGridLinesEvery !== this.gridLinesEvery) {
        this.$store.dispatch('setGridLinesEvery', this.tempGridLinesEvery)
      }
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
