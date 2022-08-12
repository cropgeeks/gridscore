<template>
  <b-modal :ok-title="$t('buttonCancel')"
           ok-variant="secondary"
           ok-only
           no-fade
           @hide="$refs.scanner.close()"
           @shown="$refs.scanner.start()"
           ref="barcodeScannerModal">
    <BarcodeScanner ref="scanner" @code-scanned="onDecode" :autostart="false" />
    <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
  </b-modal>
</template>

<script>
import BarcodeScanner from '@/components/BarcodeScanner'

export default {
  components: {
    BarcodeScanner
  },
  data: function () {
    return {
      errorMessage: null
    }
  },
  methods: {
    onDecode: function (data) {
      this.$emit('code-scanned', data)
      this.hide()
    },
    /**
     * Shows the modal dialog and resets it to its initial state
     */
    show: function () {
      this.errorMessage = null
      this.$nextTick(() => this.$refs.barcodeScannerModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.barcodeScannerModal.hide())
    }
  }
}
</script>

<style>
</style>
