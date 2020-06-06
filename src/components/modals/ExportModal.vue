<template>
  <b-modal :title="$t('modalTitleExport')"
           :ok-title="$t('buttonClose')"
           size="lg"
           ok-only
           ref="exportModal">
    <b-input-group :label="$t('formLabelExportText')"
                   label-for="exportText">
      <b-form-textarea rows="8" readonly :value="text" id="exportText" />
    </b-input-group>
    <a :href="getHref" :download="getFilename">{{ $t('linkExport') }}</a>
  </b-modal>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      default: null
    }
  },
  computed: {
    getFilename: function () {
      return new Date().toISOString().split('T')[0] + '.txt'
    },
    getHref: function () {
      return 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.text)
    }
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
