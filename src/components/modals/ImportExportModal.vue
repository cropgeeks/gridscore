<template>
  <b-modal :title="$t('modalTitleImportExport')"
           :ok-title="isImport === true ? $t('buttonImport') : $t('buttonClose')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="importExport"
           ref="importExportModal">
    <b-form @submit.prevent="importExport" id="import-export-form">
      <b-form-group :label="$t('formLabelImportExportData')"
                    label-for="data">
        <b-form-textarea :rows="10" :readonly="isImport === false" id="data" v-model="config" />
        <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="application/json" v-model="dataFile" v-if="isImport === true" />
        <template v-slot:description>
          <b-form-text text-variant="warning">{{ isImport === true ? $t('formDescriptionImportExportData') : null }}</b-form-text>
        </template>
      </b-form-group>
    </b-form>
  </b-modal>
</template>

<script>
export default {
  data: function () {
    return {
      config: null,
      dataFile: null
    }
  },
  props: {
    isImport: {
      type: Boolean,
      default: true
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
    }
  },
  methods: {
    loadDataFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.config = event.target.result.replace(/\r/g, '')
        this.dataFile = null
      }
      reader.readAsText(this.varietiesFile)
    },
    updateConfig: function () {
      if (this.isImport === false) {
        const dataCopy = JSON.parse(JSON.stringify(this.dataset))
        // delete dataCopy.data
        this.config = JSON.stringify(dataCopy, undefined, 2)
      } else {
        this.config = null
      }
    },
    show: function () {
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
