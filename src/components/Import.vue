<template>
  <div>
    <b-form @submit.prevent="importExport" id="import-export-form">
      <b-form-group :label="$t('formLabelImportExportData')"
                    label-for="import-data">
        <b-form-textarea :rows="5" :readonly="false" id="import-data" v-model="config" />
        <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="application/json" v-model="dataFile" />
        <template v-slot:description>
          <b-form-text text-variant="warning">{{ $t('formDescriptionImportExportData') }}</b-form-text>
        </template>
      </b-form-group>

      <p class="font-weight-bold">{{ $t('modalTextImportOr') }}</p>
      <b-input class="mb-3" v-model="uuid" :placeholder="$t('formPlaceholderUuid')" />
      <b-button @click="onImportClicked">{{ uuid === storeDataset.uuid ? $t('buttonImportLoadDataset') : $t('formLabelImportDataServerUuid') }}</b-button>
      <template v-if="showCamera">
        <p class="text-muted mt-3">{{ $t('formDescriptionImportDataServerUuid') }}</p>
        <QrcodeStream @decode="onDecode" @init="scrollToCamera" ref="cameraInput" />
      </template>
      <p class="text-danger mt-3" v-if="serverError">{{ serverError }}</p>
    </b-form>
    <YesNoCancelModal :title="$t('modalTitleReplaceDatasets')" :message="$t('modalTextReplaceDatasets')" :yesTitle="$t('buttonReplace')" :noTitle="$t('buttonImportAsNew')" :cancelTitle="$t('buttonCancel')" ref="yesNoCancelModal" @yes="yes" @no="no" />
  </div>
</template>

<script>
import YesNoCancelModal from '@/components/modals/YesNoCancelModal'
import { QrcodeStream } from 'vue-qrcode-reader'
import idb from '@/plugins/idb'

import { mapGetters } from 'vuex'

export default {
  props: {
    useDatasetUuid: {
      type: Boolean,
      default: true
    }
  },
  data: function () {
    return {
      config: null,
      dataFile: null,
      serverError: null,
      showCamera: false,
      uuid: null
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDataset'
    ])
  },
  watch: {
    dataFile: function (newValue) {
      if (newValue) {
        this.loadDataFile()
      }
    },
    'storeDataset.uuid': function () {
      this.reset()
    }
  },
  components: {
    QrcodeStream,
    YesNoCancelModal
  },
  methods: {
    onImportClicked: function () {
      if (this.uuid) {
        this.onDecode(this.uuid)
      } else {
        this.showCamera = true
      }
    },
    scrollToCamera: async function (promise) {
      try {
        await promise

        this.$nextTick(() => this.$refs.cameraInput.$el.scrollIntoView())
      } catch (error) {
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
      reader.readAsText(this.dataFile)
    },
    reset: function () {
      this.dataFile = null
      this.serverError = null
      this.showCamera = false

      if (this.useDatasetUuid && this.storeDataset && this.storeDataset.uuid) {
        this.uuid = this.storeDataset.uuid
      }
    },
    importExport: async function () {
      let newData = JSON.parse(this.config)

      if (newData) {
        if (!newData.data) {
          newData.data = []
        }

        // If the dataset has a name
        if (newData.name) {
          // Get all existing datasets
          const datasets = await idb.getDatasets()

          // If there are any
          if (datasets) {
            // Check if one exists that matches
            const match = datasets.filter(d => d.name === newData.name && d.rows === newData.rows && d.cols === newData.cols) ||
              datasets.filter(d => d.uuid === newData.uuid)

            // If so, ask if user wants to overwrite it
            if (match && match.length > 0) {
              this.newData = newData
              newData.id = match[0].id
              this.$refs.yesNoCancelModal.show()
              return
            }
          }
        } else {
          newData.name = `Imported data: ${new Date().toISOString().split('T')[0]}`
        }
      }

      this.$store.dispatch('addDataset', newData)
    },
    yes: function () {
      this.$store.dispatch('updateDataset', this.newData)
      // this.$router.push({ name: 'home' })
    },
    no: function () {
      delete this.newData.id
      this.$store.dispatch('addDataset', this.newData)
    }
  },
  mounted: function () {
    this.reset()
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
