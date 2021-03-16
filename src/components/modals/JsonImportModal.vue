<template>
  <b-modal :title="$t('modalTitleImportConfig')"
           :ok-title="$t('buttonImport')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="importExport"
           @shown="$refs.importView.reset()"
           no-fade
           ref="importModal">
    <Import ref="importView" />
  </b-modal>
</template>

<script>
import Import from '@/components/Import'

/**
 * Import modal handling configuration import using a pastable input field as well as scanning a shared configuration via the GridScore server using a QR code.
 */
export default {
  components: {
    Import
  },
  methods: {
    show: function () {
      this.$nextTick(() => this.$refs.importModal.show())
    },
    hide: function () {
      this.$nextTick(() => this.$refs.importModal.hide())
    }
  }
}
</script>

<style>
</style>
