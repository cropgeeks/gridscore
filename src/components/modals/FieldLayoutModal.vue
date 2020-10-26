<template>
  <b-modal :title="$t('buttonShowFieldMap')"
           :ok-title="$t('buttonOk')"
           :cancel-title="$t('buttonCancel')"
           size="xl"
           @shown="invalidateSize"
           @ok.prevent="onSubmit"
           ref="fieldLayoutModal">
    <FieldMap :geolocation="geolocation" :rows="dataset.rows" :cols="dataset.cols" ref="map" />
  </b-modal>
</template>

<script>
import FieldMap from '@/components/FieldMap'

export default {
  props: {
    geolocation: {
      type: Object,
      default: null
    }
  },
  components: {
    FieldMap
  },
  methods: {
    /**
     * Fixes map layout issues on modal show event
     */
    invalidateSize: function () {
      this.$nextTick(() => this.$refs.map.invalidateSize())
    },
    onSubmit: function () {
      const cornerPoints = this.$refs.map.getCornerPoints()
      if (cornerPoints && cornerPoints.length === 4) {
        this.$store.dispatch('setCornerPoints', cornerPoints)
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
