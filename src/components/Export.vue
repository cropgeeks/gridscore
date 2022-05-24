<template>
  <b-form @submit.prevent id="import-export-form">
    <b-button @click="exportJson">{{ storeDatasetUuid ? $t('buttonImportExportSave') : $t('buttonImportExportShare') }}</b-button>

    <div v-show="serverUuid !== null">
      <p class="text-info mt-3">{{ $t('modalTextExportQR') }}</p>
      <StyledQRCode :text="serverUuid" />
    </div>
    <p class="text-danger" v-if="serverError">{{ serverError }}</p>
  </b-form>
</template>

<script>
import StyledQRCode from '@/components/StyledQRCode'

import { mapGetters } from 'vuex'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    StyledQRCode
  },
  data: function () {
    return {
      serverUuid: null,
      serverError: null
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDatasetUuid',
      'storeRows',
      'storeCols'
    ])
  },
  methods: {
    reset: function () {
      this.serverUuid = null
      this.serverError = null
    },
    exportJson: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (!this.storeDatasetUuid || !storeData || storeData.length < 1) {
        return
      }

      if (this.storeDatasetUuid) {
        // Ask for confirmation, because this will overwrite what's on the server
        this.$bvModal.msgBoxConfirm(this.$t('modalTextSaveToServerWarning'), {
          title: this.$t('modalTitleSaveToServerWarning'),
          okTitle: this.$t('buttonSave'),
          cancelTitle: this.$t('buttonCancel')
        }).then(value => {
          if (value) {
            this.sendData()
          }
        })
      } else {
        this.sendData()
      }
    },
    sendData: function () {
      emitter.emit('set-loading', true)
      const dataCopy = JSON.parse(JSON.stringify(this.$store.state.dataset))

      this.postConfigForSharing(dataCopy, this.$store.state.dataset.data, this.serverUuid, this.storeRows, this.storeCols)
        .then(result => {
          if (result && result.data) {
            this.serverUuid = result.data

            this.$store.dispatch('setDatasetUuid', result.data)
          } else {
            this.serverUuid = null
          }
        })
        .catch(err => {
          this.serverError = this.getErrorMessage(err)
        })
        .finally(() => emitter.emit('set-loading', false))
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
