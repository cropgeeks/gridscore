<template>
  <div>
    <p>{{ $t('widgetImportDataText') }}</p>
    <b-form @submit.prevent="importExport" id="import-export-form">
      <b-input class="mb-3" v-model="uuid" :placeholder="$t('formPlaceholderUuid')" />
      <b-button @click="onImportClicked">{{ $t('formLabelImportDataServerUuid') }}</b-button>
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

import api from '@/mixin/api'

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
      serverError: null,
      showCamera: false,
      uuid: null
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDatasetUuid'
    ])
  },
  watch: {
    storeDatasetUuid: function () {
      this.reset()
    }
  },
  components: {
    QrcodeStream,
    YesNoCancelModal
  },
  mixins: [api],
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
          if (result) {
            this.config = result
            this.importExport()

            this.plausibleEvent('dataset-load', { format: 'qr' })
          }
        })
        .catch(err => {
          this.serverError = this.getErrorMessage(err)
        })
    },
    reset: function () {
      this.serverError = null
      this.showCamera = false

      if (this.useDatasetUuid && this.storeDatasetUuid) {
        this.uuid = this.storeDatasetUuid
      }
    },
    importExport: async function () {
      if (this.config) {
        // If the dataset has a name
        if (this.config.name) {
          // Get all existing datasets
          const datasets = await idb.getDatasets()

          // If there are any
          if (datasets) {
            // Check if one exists that matches
            const match = datasets.filter(d => d.name === this.config.name && d.rows === this.config.rows && d.cols === this.config.cols) ||
              datasets.filter(d => d.uuid === this.config.uuid)

            // If so, ask if user wants to overwrite it
            if (match && match.length > 0) {
              this.config.id = match[0].id
              this.$refs.yesNoCancelModal.show()
              return
            }
          }
        } else {
          this.config.name = `Imported data: ${new Date().toISOString().split('T')[0]}`
        }
      }

      this.$store.dispatch('addDataset', this.config)
    },
    yes: function () {
      this.$store.dispatch('updateDataset', { dataset: this.config, redirect: true })
      // this.$router.push({ name: 'home' })
    },
    no: function () {
      delete this.config.id
      this.$store.dispatch('addDataset', this.config)
    }
  },
  mounted: function () {
    this.reset()
  }
}
</script>

<style>
</style>
