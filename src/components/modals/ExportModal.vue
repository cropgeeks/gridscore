<template>
  <b-modal :title="$t('modalTitleExport')"
           :ok-title="$t('buttonClose')"
           content-class="export-modal"
           size="lg"
           ok-only
           ref="exportModal">
    <b-progress :value="100" height="5px" variant="info" animated v-if="!text" />
    <b-input-group :label="$t('formLabelExportText')"
                   label-for="exportText">
      <b-form-textarea rows="8" readonly :value="text" id="exportText" :placeholder="$t('formPlaceholderExportLoading')" />
    </b-input-group>
    <a :href="getHref" :download="getFilename" v-if="text && (text !== $t('labelNoData'))">{{ $t('linkExport') }}</a>
  </b-modal>
</template>

<script>
export default {
  data: function () {
    return {
      text: null
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
      this.updateText()
    },
    hide: function () {
      this.$nextTick(() => this.$refs.exportModal.hide())
    },
    updateText: function () {
      this.text = null

      if (!this.dataset || !this.dataset.data || this.dataset.data.length < 1 || !this.dataset.traits || this.dataset.traits.length < 1) {
        this.text = this.$t('labelNoData')
      }

      let result = 'Variety\tLat\tLng\tElv\tComment\t' + this.dataset.traits.join('\t')

      for (let y = 0; y < this.dataset.rows; y++) {
        for (let x = 0; x < this.dataset.cols; x++) {
          const cell = this.dataset.data[y][x + 1]
          if (cell && cell.dates && cell.dates.length > 0 && !cell.dates.every(c => c === null || c.length < 1)) {
            result += '\n'
            result += cell.name

            if (cell.geolocation) {
              result += '\t' + (cell.geolocation.lat ? cell.geolocation.lat : '')
              result += '\t' + (cell.geolocation.lng ? cell.geolocation.lng : '')
              result += '\t' + (cell.geolocation.elv ? cell.geolocation.elv : '')
            } else {
              result += '\t\t\t'
            }

            result += '\t' + (cell.comment ? cell.comment : '')

            result += '\t' + cell.dates.join('\t')
          }
        }
      }

      this.text = result
    }
  }
}
</script>

<style>
.export-modal .progress {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.export-modal .progress + .input-group .form-control {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
