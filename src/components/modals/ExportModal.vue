<template>
  <b-modal :title="$t('modalTitleExport')"
           :ok-title="$t('buttonClose')"
           content-class="export-modal"
           size="lg"
           ok-only
           ref="exportModal">
    <b-progress :value="100" height="5px" variant="info" animated v-if="!text" />
    <template v-else>
      <b-tabs content-class="mt-3">
        <b-tab :title="$t('tabTitleExportData')" active>
          <b-form-group :label="$t('formLabelExportText')"
                         label-for="exportText">
            <b-form-textarea rows="8" readonly :value="text" id="exportText" :placeholder="$t('formPlaceholderExportLoading')" wrap="off" @focus="$event.target.select()"/>
          </b-form-group>
          <b-form-checkbox class="mb-2" switch v-model="showDates">{{ $t('labelCheckboxExportUseDates') }}</b-form-checkbox>
          <a :href="getHref" :download="getFilenameData" v-if="text && (text !== $t('labelNoData'))">&#128190; {{ $t('linkExport') }}</a>
        </b-tab>
        <b-tab :title="$t('tabTitleExportTraits')">
          <b-form-group :label="$t('formLabelExportTraits')"
                         label-for="exportTraits">
            <b-form-textarea rows="8" readonly :value="traits" id="exportTraits" :placeholder="$t('formPlaceholderExportLoading')" wrap="off" @focus="$event.target.select()"/>
          </b-form-group>
          <a :href="getHref" :download="getFilenameTraits" v-if="traits && (traits !== $t('labelNoData'))">&#128190; {{ $t('linkExport') }}</a>
        </b-tab>
      </b-tabs>
    </template>
  </b-modal>
</template>

<script>
export default {
  data: function () {
    return {
      showDates: 0
    }
  },
  computed: {
    getFilenameData: function () {
      return `data-${new Date().toISOString().split('T')[0]}.txt`
    },
    getFilenameTraits: function () {
      return `traits-${new Date().toISOString().split('T')[0]}.txt`
    },
    getHref: function () {
      return 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.text)
    },
    traits: function () {
      if (!this.dataset || !this.dataset.traits || this.dataset.traits.length < 1) {
        return
      }

      let result = 'Name\tShort Name\tDescription\tData Type\tUnit Name\tUnit Abbreviation\tUnit Descriptions\tTrait categories (comma separated)\tMin (only for numeric traits)\tMax (only for numeric traits)\n'

      result += this.dataset.traits.map(t => {
        let type
        switch (t.type) {
          case 'int':
          case 'float':
          case 'categorical':
            type = t.type
            break
          case 'date':
          case 'text':
          default:
            type = 'char'
            break
        }

        const categories = (t.type === 'categorical' && t.restrictions && t.restrictions.categories) ? `[[${t.restrictions.categories.join(',')}]]` : ''
        const min = ((t.type === 'int' || t.type === 'float') && t.restrictions && t.restrictions.min !== undefined && t.restrictions.min !== null) ? t.restrictions.min : ''
        const max = ((t.type === 'int' || t.type === 'float') && t.restrictions && t.restrictions.max !== undefined && t.restrictions.max !== null) ? t.restrictions.max : ''

        return `${t.name}\t${t.name.substring(0, 10)}\t${t.name}\t${type}\t\t\t\t${categories}\t${min}\t${max}`
      }).join('\n')

      return result
    },
    text: function () {
      if (!this.dataset || !this.dataset.data || this.dataset.data.length < 1 || !this.dataset.traits || this.dataset.traits.length < 1) {
        return this.$t('labelNoData')
      }

      let result = `Line/Trait\t${this.dataset.traits.map(t => t.name).join('\t')}\tLat\tLng\tElv\tComment`

      for (let y = 0; y < this.dataset.rows; y++) {
        for (let x = 0; x < this.dataset.cols; x++) {
          const cell = this.dataset.data[y][x + 1]
          if (cell) {
            const data = this.showDates ? cell.dates : cell.values
            if (data && data.length > 0 && !data.every(c => c === null || c.length < 1)) {
              result += '\n'
              result += cell.name

              result += '\t' + data.join('\t')

              if (cell.geolocation) {
                result += '\t' + (cell.geolocation.lat ? cell.geolocation.lat : '')
                result += '\t' + (cell.geolocation.lng ? cell.geolocation.lng : '')
                result += '\t' + (cell.geolocation.elv ? cell.geolocation.elv : '')
              } else {
                result += '\t\t\t'
              }

              result += '\t' + (cell.comment ? cell.comment : '')
            }
          }
        }
      }

      return result
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
.export-modal .progress {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.export-modal .progress + .input-group .form-control {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
