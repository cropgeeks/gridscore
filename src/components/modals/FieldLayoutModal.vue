<template>
  <b-modal :title="$t('buttonShowFieldMap')"
           :ok-title="$t('buttonOk')"
           :cancel-title="$t('buttonCancel')"
           size="xl"
           no-fade
           @shown="invalidateSize"
           @ok.prevent="onSubmit"
           ref="fieldLayoutModal">
    <FieldMap :rows="storeRows" :cols="storeCols" ref="map" />

    <MarkerSetup :rows="storeRows" :cols="storeCols" ref="markerSetup" />
  </b-modal>
</template>

<script>
import { mapGetters } from 'vuex'
import FieldMap from '@/components/FieldMap'
import MarkerSetup from '@/components/MarkerSetup'

export default {
  components: {
    FieldMap,
    MarkerSetup
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeCols',
      'storeRows'
    ])
  },
  methods: {
    /**
     * Fixes map layout issues on modal show event
     */
    invalidateSize: function () {
      this.$nextTick(() => {
        this.$refs.map.invalidateSize()
        this.$refs.markerSetup.reset()
      })
    },
    onSubmit: function () {
      const cornerPoints = this.$refs.map.getCornerPoints()
      const markers = this.$refs.markerSetup.getMarkerConfig()

      this.$store.dispatch('setCornerPointsAndMarkers', { cornerPoints, markers })

      if (cornerPoints) {
        this.plausibleEvent('dataset-update', { type: 'corners' })
      }
      if (markers) {
        this.plausibleEvent('dataset-update', { type: 'markers' })
      }

      this.hide()
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.fieldLayoutModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.fieldLayoutModal.hide())
    }
  }
}
</script>

<style>

</style>
