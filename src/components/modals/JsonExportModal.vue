<template>
  <b-modal :title="$t('modalTitleExportConfig')"
           :ok-title="$t('buttonClose')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent
           @shown="$refs.exportView.reset()"
           no-fade
           ref="exportModal">
    <Export ref="exportView" />
  </b-modal>
</template>

<script>
import Export from '@/components/Export'

/**
 * Export modal that handles showing the current configuration in a copyable text field as well as sharing the configuration via the GridScore server using a QR code.
 */
export default {
  components: {
    Export
  },
  methods: {
    show: function () {
      this.$nextTick(() => this.$refs.exportModal.show())
    },
    hide: function () {
      this.$nextTick(() => this.$refs.exportModal.hide())
    }
  }
}
</script>

<style>
</style>
