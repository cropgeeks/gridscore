<template>
  <b-container>
    <h1><b-button :to="{ name: 'home' }"><BIconArrowLeft /></b-button> {{ $t('modalTitleExport') }}</h1>
    <hr />

    <!-- Show a loading indicator while the export is generated -->
    <b-progress :value="100" height="5px" variant="info" animated v-if="!text" />
    <b-tabs content-class="mt-3" v-else>
      <!-- Tab for the data -->
      <b-tab :title="$t('tabTitleExportData')" active>
        <p>{{ $t('modalTextExportData') }}</p>
        <b-form-group :label="$t('formLabelExportText')"
                        label-for="exportText">
          <!-- The data is shown here, non-wrapped. On focus, select everything -->
          <b-form-textarea rows="8" readonly :value="text" id="exportText" :placeholder="$t('formPlaceholderExportLoading')" wrap="off" @focus="$event.target.select()"/>
        </b-form-group>
        <!-- Link to actually download the data -->
        <div v-if="text && (text !== $t('labelNoData'))">
          <BIconDownload /> <a :href="getHrefData" :download="getFilenameData"> {{ $t('linkExport') }}</a>
        </div>

        <hr />

        <b-form-group :label="$t('formLabelExportDatesText')"
                        label-for="exportDatesText">
          <!-- The data is shown here, non-wrapped. On focus, select everything -->
          <b-form-textarea rows="8" readonly :value="datesText" id="exportDatesText" :placeholder="$t('formPlaceholderExportLoading')" wrap="off" @focus="$event.target.select()"/>
        </b-form-group>
        <!-- Link to actually download the data -->
        <div v-if="datesText && (datesText !== $t('labelNoData'))">
          <BIconDownload /> <a :href="getHrefDates" :download="getFilenameDates"> {{ $t('linkExport') }}</a>
        </div>
      </b-tab>
      <!-- Tab for the trait definitions -->
      <b-tab :title="$t('tabTitleExportTraits')">
        <p v-html="$t('modalTextExportTraits')" />
        <b-form-group :label="$t('formLabelExportTraits')"
                        label-for="exportTraits">
          <!-- The data is shown here, non-wrapped. On focus, select everything -->
          <b-form-textarea rows="8" readonly :value="traits" id="exportTraits" :placeholder="$t('formPlaceholderExportLoading')" wrap="off" @focus="$event.target.select()"/>
        </b-form-group>
        <!-- Link to actually download the data -->
        <div v-if="traits && (traits !== $t('labelNoData'))">
          <BIconDownload /> <a :href="getHrefTraits" :download="getFilenameTraits"> {{ $t('linkExport') }}</a>
        </div>
      </b-tab>
    </b-tabs>
  </b-container>
</template>

<script>
import { BIconDownload, BIconArrowLeft } from 'bootstrap-vue'

import { mapGetters } from 'vuex'

export default {
  components: {
    BIconDownload,
    BIconArrowLeft
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeData'
    ]),
    safeFilename: function () {
      if (this.storeDatasetName) {
        return this.storeDatasetName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      } else {
        return ''
      }
    },
    getFilenameData: function () {
      return `data-${this.safeFilename}-${new Date().toISOString().split('T')[0]}.txt`
    },
    getFilenameDates: function () {
      return `dates-${this.safeFilename}-${new Date().toISOString().split('T')[0]}.txt`
    },
    getFilenameTraits: function () {
      return `traits-${this.safeFilename}-${new Date().toISOString().split('T')[0]}.txt`
    },
    getHrefDates: function () {
      return 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.datesText)
    },
    getHrefData: function () {
      return 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.text)
    },
    getHrefTraits: function () {
      return 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.storeTraits)
    },
    traits: function () {
      if (!this.storeTraits || this.storeTraits.length < 1) {
        return this.$t('labelNoData')
      }

      // Header row
      let result = 'Name\tShort Name\tDescription\tData Type\tUnit Name\tUnit Abbreviation\tUnit Descriptions\tTrait categories (comma separated)\tMin (only for numeric traits)\tMax (only for numeric traits)\n'

      // Map traits to row data
      result += this.storeTraits.map(t => {
        // Get the type (Germinate specific)
        let type
        switch (t.type) {
          case 'int':
          case 'float':
            type = 'numeric'
            break
          case 'date':
          case 'text':
          case 'categorical':
            type = t.type
            break
          default:
            type = 'text'
            break
        }

        // Set restrictions
        const categories = (t.type === 'categorical' && t.restrictions && t.restrictions.categories) ? `[[${t.restrictions.categories.join(',')}]]` : ''
        const min = ((t.type === 'int' || t.type === 'float') && t.restrictions && t.restrictions.min !== undefined && t.restrictions.min !== null) ? t.restrictions.min : ''
        const max = ((t.type === 'int' || t.type === 'float') && t.restrictions && t.restrictions.max !== undefined && t.restrictions.max !== null) ? t.restrictions.max : ''

        // Return formatted data
        return `${t.name}\t${t.name.substring(0, 10)}\t${t.name}\t${type}\t\t\t\t${categories}\t${min}\t${max}`
      }).join('\n')

      return result
    },
    datesText: function () {
      if (!this.storeData || this.storeData.length < 1 || !this.storeTraits || this.storeTraits.length < 1) {
        return this.$t('labelNoData')
      }

      // Header row
      let result = `Line/Trait\t${this.storeTraits.map(t => t.name).join('\t')}\tLat\tLng\tElv\tComment`

      // For each field row
      for (let y = 0; y < this.storeRows; y++) {
        // And each field column
        for (let x = 0; x < this.storeCols; x++) {
          // Get the data cell
          const cell = this.storeData[y][x]
          // If there is data
          if (cell) {
            // Get it
            const data = cell.dates
            // If there is a value and they aren't all empty
            if (cell.comment || (data && data.length > 0 && !data.every(c => c === null || c.length < 1))) {
              result += '\n'
              // Variety name
              result += cell.name

              // Values joined
              result += '\t' + data.join('\t')

              // Geolocation if available
              if (cell.geolocation) {
                result += '\t' + (cell.geolocation.lat ? cell.geolocation.lat : '')
                result += '\t' + (cell.geolocation.lng ? cell.geolocation.lng : '')
                result += '\t' + (cell.geolocation.elv ? cell.geolocation.elv : '')
              } else {
                result += '\t\t\t'
              }

              // Comments
              result += '\t' + (cell.comment ? cell.comment : '')
            }
          }
        }
      }

      return result
    },
    text: function () {
      if (!this.storeData || this.storeData.length < 1 || !this.storeTraits || this.storeTraits.length < 1) {
        return this.$t('labelNoData')
      }

      // Header row
      let result = `Line/Trait\t${this.storeTraits.map(t => t.name).join('\t')}\tLat\tLng\tElv\tComment`

      // For each field row
      for (let y = 0; y < this.storeRows; y++) {
        // And each field column
        for (let x = 0; x < this.storeCols; x++) {
          // Get the data cell
          const cell = this.storeData[y][x]
          // If there is data
          if (cell) {
            // Get it
            const data = cell.values
            // If there is a value and they aren't all empty
            if (cell.comment || (data && data.length > 0 && !data.every(c => c === null || c.length < 1))) {
              result += '\n'
              // Variety name
              result += cell.name

              // Values joined
              result += '\t' + data.join('\t')

              // Geolocation if available
              if (cell.geolocation) {
                result += '\t' + (cell.geolocation.lat ? cell.geolocation.lat : '')
                result += '\t' + (cell.geolocation.lng ? cell.geolocation.lng : '')
                result += '\t' + (cell.geolocation.elv ? cell.geolocation.elv : '')
              } else {
                result += '\t\t\t'
              }

              // Comments
              result += '\t' + (cell.comment ? cell.comment : '')
            }
          }
        }
      }

      return result
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
