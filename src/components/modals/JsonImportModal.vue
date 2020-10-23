<template>
  <b-modal :title="$t('modalTitleImportConfig')"
           :ok-title="$t('buttonImport')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="importData"
           ref="importModal">
    <b-form @submit.prevent="importData" id="import-export-form">
      <b-form-group :label="$t('formLabelImportExportData')"
                    label-for="data">
        <b-form-textarea :rows="5" :readonly="false" id="data" v-model="config" />
        <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="application/json" v-model="dataFile" />
        <template v-slot:description>
          <b-form-text text-variant="warning">{{ $t('formDescriptionImportExportData') }}</b-form-text>
        </template>
      </b-form-group>

      <p class="font-weight-bold">{{ $t('modalTextImportOr') }}</p>
      <b-button @click="() => {showCamera = true}">{{ $t('formLabelImportDataServerUuid') }}</b-button>
      <template v-if="showCamera">
        <p class="text-muted mt-3">{{ $t('formDescriptionImportDataServerUuid') }}</p>
        <QrcodeStream @decode="onDecode" @init="scrollToCamera" ref="cameraInput" />
        <p class="text-danger mt-3" v-if="serverError">{{ serverError }}</p>
      </template>
    </b-form>
  </b-modal>
</template>

<script>
import { QrcodeStream } from 'vue-qrcode-reader'

/**
 * Import modal handling configuration import using a pastable input field as well as scanning a shared configuration via the GridScore server using a QR code.
 */
export default {
  data: function () {
    return {
      config: null,
      dataFile: null,
      serverError: null,
      showCamera: false
    }
  },
  watch: {
    dataFile: function (newValue) {
      if (newValue) {
        this.loadDataFile()
      }
    }
  },
  components: {
    QrcodeStream
  },
  methods: {
    scrollToCamera: async function (promise) {
      try {
        await promise

        this.$nextTick(() => this.$refs.cameraInput.$el.scrollIntoView())
      } catch (error) {
        console.error(error)
        this.serverError = error.name
      }
    },
    onDecode: function (uuid) {
      if (uuid.indexOf('/') !== -1) {
        uuid = uuid.substring(uuid.lastIndexOf('/') + 1)
      }
      this.getConfigFromSharing(uuid)
        .then(result => {
          if (result && result.data) {
            this.config = JSON.stringify(result.data)
            this.importExport()
          }
        })
        .catch(err => {
          if (err && err.response && err.response.status) {
            switch (err.response.status) {
              case 404:
                this.serverError = this.$t('axiosErrorConfigNotFound')
                break
              case 500:
                this.serverError = this.$t('axiosErrorGeneric500')
                break
              default:
                this.serverError = err
                break
            }
          } else {
            this.serverError = this.$t('axiosErrorNoInternet')
          }
        })
    },
    loadDataFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.config = event.target.result.replace(/\r/g, '')
        this.dataFile = null
      }
      reader.readAsText(this.varietiesFile)
    },
    show: function () {
      this.dataFile = null
      this.serverError = null
      this.showCamera = false
      this.$nextTick(() => this.$refs.importModal.show())
    },
    hide: function () {
      this.$nextTick(() => this.$refs.importModal.hide())
    },
    importExport: function () {
      let newData = JSON.parse(this.config)

      if (newData && !newData.data) {
        newData.data = []
      }

      this.$store.commit('ON_DATASET_CHANGED', newData)
      this.$emit('dataset-changed')
      this.hide()
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
