<template>
  <b-modal :title="$t('modalTitleImportExport')"
           :ok-title="isImport === true ? $t('buttonImport') : $t('buttonClose')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="importExport"
           ref="importExportModal">
    <b-form @submit.prevent="importExport" id="import-export-form" v-if="isImport === true">
      <b-form-group :label="$t('formLabelImportExportData')"
                    label-for="data">
        <b-form-textarea :rows="5" :readonly="false" id="data" v-model="config" />
        <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="application/json" v-model="dataFile" />
        <template v-slot:description>
          <b-form-text text-variant="warning">{{ $t('formDescriptionImportExportData') }}</b-form-text>
        </template>
      </b-form-group>

      <p class="font-weight-bold">{{ $t('modalTextImportExportOr') }}</p>
      <b-button @click="() => {showCamera = true}">{{ $t('formLabelImportDataServerUuid') }}</b-button>
      <template v-if="showCamera">
        <p class="text-muted mt-3">{{ $t('formDescriptionImportDataServerUuid') }}</p>
        <QrcodeStream @decode="onDecode" @init="scrollToCamera" ref="cameraInput" />
        <p class="text-danger mt-3" v-if="serverError">{{ serverError }}</p>
      </template>
    </b-form>
    <b-form @submit.prevent="importExport" id="import-export-form" v-else>
      <b-form-group :label="$t('formLabelImportExportData')"
                    label-for="data">
        <b-form-textarea :rows="5" :readonly="true" id="data" v-model="config" />
      </b-form-group>
      <b-button @click="exportJson">{{ $t('buttonImportExportShare') }}</b-button>

      <div v-show="serverUuid !== null">
        <p class="text-info mt-3">{{ $t('modalTextImportExportQR') }}</p>
        <div ref="svg" class="text-center" />
        <p class="text-center">{{ serverUuid }}</p>
        <p class="text-danger" v-if="serverError">{{ serverError }}</p>
      </div>
    </b-form>
  </b-modal>
</template>

<script>
import { BrowserQRCodeSvgWriter } from '@zxing/library'
import { QrcodeStream } from 'vue-qrcode-reader'

const codeWriter = new BrowserQRCodeSvgWriter()

export default {
  data: function () {
    return {
      config: null,
      dataFile: null,
      svg: null,
      serverUuid: null,
      serverError: null,
      showCamera: false
    }
  },
  props: {
    isImport: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    shareUrl: function () {
      const uuidPart = this.$router.resolve({ name: 'uuid-import', params: { uuid: this.serverUuid } }).resolved.path
      let url = window.location.href
      if (!url.lastIndexOf('/') !== url.length + 1) {
        url = url.substring(0, url.length - 1)
      }

      return `${url}${uuidPart}`
    }
  },
  watch: {
    isImport: function (newValue) {
      this.updateConfig()
    },
    dataFile: function (newValue) {
      if (newValue) {
        this.loadDataFile()
      }
    },
    shareUrl: function (newValue) {
      if (newValue) {
        this.$nextTick(() => codeWriter.writeToDom(this.$refs.svg, newValue, 300, 300))
      } else {
        // TODO
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
    loadDataFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.config = event.target.result.replace(/\r/g, '')
        this.dataFile = null
      }
      reader.readAsText(this.varietiesFile)
    },
    updateConfig: async function () {
      if (this.isImport === false) {
        const dataCopy = JSON.parse(JSON.stringify(this.dataset))
        // delete dataCopy.data
        this.config = JSON.stringify(dataCopy, undefined, 2)
      } else {
        this.config = null
      }
    },
    show: function () {
      this.dataFile = null
      this.svg = null
      this.serverUuid = null
      this.serverError = null
      this.showCamera = false
      this.updateConfig()
      this.$nextTick(() => this.$refs.importExportModal.show())
    },
    hide: function () {
      this.$nextTick(() => this.$refs.importExportModal.hide())
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
