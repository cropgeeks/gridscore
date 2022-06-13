<template>
  <b-modal :title="$t('modalTitleCitation')"
           :ok-title="okButtonTitle"
           :ok-disabled="okDisabled"
           ok-only
           scrollable
           no-close-on-backdrop
           no-close-on-esc
           hide-header-close
           no-fade
           @ok="onSubmit"
           @shown="startCountdown"
           ref="citationModal">
    <div v-html="$t('modalTextCitation')" />
  </b-modal>
</template>

<script>
export default {
  data: function () {
    return {
      secondsLeft: 10
    }
  },
  computed: {
    okButtonTitle: function () {
      return this.$tc('modalButtonCloseIn', this.secondsLeft)
    },
    okDisabled: function () {
      return this.secondsLeft > 0
    }
  },
  methods: {
    /**
     * Shows the modal and gets the current BrAPI URL from the configuration
     */
    show: function () {
      this.secondsLeft = 10
      this.$nextTick(() => this.$refs.citationModal.show())
    },
    /**
     * Hides the modal
     */
    hide: function () {
      this.$nextTick(() => this.$refs.citationModal.hide())
    },
    onSubmit: function () {
      this.$store.dispatch('setCitationModalShownLast', new Date())
    },
    startCountdown: function () {
      if (this.secondsLeft > 0) {
        setTimeout(() => {
          this.secondsLeft -= 1
          this.startCountdown()
        }, 1000)
      }
    }
  }
}
</script>

<style>

</style>
