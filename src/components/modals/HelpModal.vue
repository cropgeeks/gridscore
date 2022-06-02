<template>
  <b-modal :title="$t('modalTitleHelp')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           size="xl"
           ref="helpModal">
    <b-embed aspect="1by1" :src="url" />
  </b-modal>
</template>

<script>
export default {
  props: {
    url: {
      type: String,
      default: 'https://cropgeeks.github.io/gridscore'
    }
  },
  methods: {
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.helpModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.helpModal.hide())
    }
  }
}
</script>

<style>

</style>
