<template>
  <b-modal :ok-title="$t('buttonCancel')"
           ok-variant="secondary"
           ok-only
           no-fade
           ref="barcodeScannerModal">
    <QrcodeStream @decode="onDecode" @init="scrollToCamera" ref="cameraInput">
      <div class="loading-indicator text-center" v-if="loading">
        <b-spinner style="width: 3rem; height: 3rem;" variant="primary" type="grow" />
      </div>
    </QrcodeStream>
    <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
  </b-modal>
</template>

<script>
import { QrcodeStream } from 'vue-qrcode-reader'

export default {
  components: {
    QrcodeStream
  },
  data: function () {
    return {
      loading: false,
      errorMessage: null
    }
  },
  methods: {
    scrollToCamera: async function (promise) {
      try {
        this.loading = true
        await promise

        this.cameraInitialized = true
        this.$nextTick(() => this.$refs.cameraInput.$el.scrollIntoView())
      } catch (error) {
        this.errorMessage = error.name
      } finally {
        this.loading = false
      }
    },
    onDecode: function (data) {
      this.$emit('code-scanned', data)
      this.hide()
    },
    /**
     * Shows the modal dialog and resets it to its initial state
     */
    show: function () {
      this.errorMessage = null
      this.cameraInitialized = false
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
