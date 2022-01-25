<template>
  <b-modal :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           ref="barcodeViewerModal">
    <StyledQRCode :text="text" />
  </b-modal>
</template>

<script>
import StyledQRCode from '@/components/StyledQRCode'

export default {
  components: {
    StyledQRCode
  },
  props: {
    text: {
      type: String,
      default: null
    }
  },
  methods: {
    /**
     * Shows the modal dialog and resets it to its initial state
     */
    show: function () {
      this.$nextTick(() => this.$refs.barcodeViewerModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.barcodeViewerModal.hide())
    }
  }
}
</script>

<style>
</style>
