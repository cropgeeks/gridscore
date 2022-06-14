<template>
  <b-form @submit.prevent id="import-export-form">
    <b-button @click="exportJson">{{ storeDatasetUuid ? $t('buttonImportExportSave') : $t('buttonImportExportShare') }}</b-button>

    <div v-show="storeDatasetUuid">
      <p class="text-info mt-3">{{ $t('modalTextExportQR') }}</p>
      <StyledQRCode :text="storeDatasetUuid" />
    </div>
    <p class="text-danger" v-if="serverError">{{ serverError }}</p>
  </b-form>
</template>

<script>
import StyledQRCode from '@/components/StyledQRCode'

import { mapGetters } from 'vuex'

import api from '@/mixin/api'

export default {
  components: {
    StyledQRCode
  },
  data: function () {
    return {
      serverError: null
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDatasetId',
      'storeDatasetUuid',
      'storeRows',
      'storeCols'
    ])
  },
  mixins: [api],
  methods: {
    reset: function () {
      this.serverUuid = null
      this.serverError = null
    },
    exportJson: function () {
      const storeData = this.$store.state.dataset ? this.$store.state.dataset.data : null
      if (!storeData || storeData.length < 1) {
        return
      }

      if (this.storeDatasetUuid) {
        this.onSave(this.storeDatasetId)
      } else {
        this.sendData(this.$store.state.dataset, uuid => {
          this.$store.dispatch('setDatasetUuid', uuid)

          this.plausibleEvent('dataset-share')
        })
      }
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
