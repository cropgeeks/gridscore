<template>
  <div>
    <b-modal :ok-title="$t('buttonOk')"
            :cancel-title="$t('buttonCancel')"
            :title="$t('modalTitleSettings')"
            scrollable
            @ok.prevent="onSubmit"
            ref="settingsModal">
      <b-form @submit.prevent="onSubmit">
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
      this.shouldUseGps = this.useGps
    },
    onSubmit: function () {
      // Dispatch to the store
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
