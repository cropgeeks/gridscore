<template>
  <b-modal :title="$t('modalTitleExportConfig')"
           :ok-title="$t('buttonClose')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="exportData"
           ref="exportModal">
    <b-form @submit.prevent="exportData" id="import-export-form">
      <b-form-group :label="$t('formLabelImportExportData')"
                    label-for="data">
        <b-form-textarea :rows="5" :readonly="true" id="data" :value="config" />
      </b-form-group>
      <b-button @click="exportJson">{{ $t('buttonImportExportShare') }}</b-button>

      <div v-show="serverUuid !== null">
        <p class="text-info mt-3">{{ $t('modalTextExportQR') }}</p>
        <div ref="svg" class="text-center" />
        <p class="text-center">{{ serverUuid }}</p>
        <p class="text-danger" v-if="serverError">{{ serverError }}</p>
      </div>
    </b-form>
  </b-modal>
</template>

<script>
import { BrowserQRCodeSvgWriter } from '@zxing/library'

const codeWriter = new BrowserQRCodeSvgWriter()

/**
 * Export modal that handles showing the current configuration in a copyable text field as well as sharing the configuration via the GridScore server using a QR code.
 */
export default {
  data: function () {
    return {
      svg: null,
      serverUuid: null,
      serverError: null
    }
  },
  computed: {
    config: function () {
      const dataCopy = JSON.parse(JSON.stringify(this.dataset))
      // delete dataCopy.data
      return JSON.stringify(dataCopy, undefined, 2)
    },
    shareUrl: function () {
      if (this.serverUuid) {
        const uuidPart = this.$router.resolve({ name: 'uuid-import', params: { uuid: this.serverUuid } }).resolved.path
        let url = window.location.href
        if (!url.lastIndexOf('/') !== url.length + 1) {
          url = url.substring(0, url.length - 1)
        }

        return `${url}${uuidPart}`
      } else {
        return null
      }
    }
  },
  watch: {
    shareUrl: function (newValue) {
      if (newValue) {
        this.$nextTick(() => codeWriter.writeToDom(this.$refs.svg, newValue, 300, 300))
      } else {
        // TODO
      }
    }
  },
  methods: {
    exportJson: function () {
      this.postConfigForSharing()
        .then(result => {
          if (result && result.data) {
            this.serverUuid = result.data
          } else {
            this.serverUuid = null
          }
        })
        .catch(err => { this.serverError = err })
    },
    show: function () {
      this.svg = null
      this.serverUuid = null
      this.serverError = null
      this.$nextTick(() => this.$refs.exportModal.show())
    },
    hide: function () {
      this.$nextTick(() => this.$refs.exportModal.hide())
    }
  }
}
</script>

<style>
#import-export-form .form-group textarea {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
#import-export-form .form-group textarea + .b-form-file * {
  border-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
