<template>
  <b-modal :title="name"
           :ok-title="$t('buttonSave')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="downloadImage"
           no-fade
           ref="imageModal"
           content-class="image-modal">
    <!-- Preview the image -->
    <b-img fluid rounded :src="imageData" class="image" v-if="imageData" />
    <!-- Input for selecting (or taking) the image -->
    <b-form-file v-model="imageFile" accept="image/*" capture class="file-selector" />

    <b-form-group class="mt-2" label-for="trait-selector" :label="$t('formLabelImageTagTraitSelector')">
      <b-form-select :options="traitOptions" multiple v-model="traitIds" id="trait-selector" />
    </b-form-group>

    <!-- Show image date if available -->
    <b-badge v-if="imageDate"><BIconCalendar3 /> {{ imageDate.toLocaleString() }}</b-badge><br/>
    <!-- Show geolocation if available -->
    <b-badge target="_blank" rel="noopener noreferrer" :href="`https://www.google.com/maps/place/${imageGps.latitude},${imageGps.longitude}/@${imageGps.latitude},${imageGps.longitude},9z`" v-if="imageGps && imageGps.latitude && imageGps.longitude">📍 {{ imageGps.latitude.toFixed(4) }}; {{ imageGps.longitude.toFixed(4) }}</b-badge>
  </b-modal>
</template>

<script>
import { mapGetters } from 'vuex'

import exifr from 'exifr/dist/lite.umd.js'
import { BIconCalendar3 } from 'bootstrap-vue'

export default {
  components: {
    BIconCalendar3
  },
  data: function () {
    return {
      imageFile: null,
      imageData: null,
      imageDate: null,
      imageGps: null,
      supportsSaving: false,
      traitIds: null
    }
  },
  computed: {
    ...mapGetters([
      'storeTraits'
    ]),
    traitOptions: function () {
      if (this.storeTraits) {
        return this.storeTraits.map((t, i) => {
          return {
            value: i,
            text: t.name
          }
        })
      } else {
        return []
      }
    }
  },
  props: {
    /** The variety name to use as the title */
    name: {
      type: String,
      default: null
    },
    row: {
      type: Number,
      default: 0
    },
    col: {
      type: Number,
      default: 0
    },
    preferredTrait: {
      type: Number,
      default: null
    }
  },
  watch: {
    imageFile: async function (newValue) {
      if (newValue) {
        // If there is a new image file, reset data
        this.imageGps = null
        this.imageDate = null
        // Convert to base64 for displaying
        this.imageData = await this.toBase64(newValue)

        if (newValue.lastModified) {
          // If there is a last modified date, use it
          this.imageDate = new Date(newValue.lastModified)
        } else {
          // Use current date as fallback as this is required for the filename
          this.imageDate = new Date()
        }

        // Extract exif data
        exifr.parse(newValue)
          .then(exif => {
            // Try and extract the exact date
            if (exif.DateTimeOriginal) {
              this.imageDate = exif.DateTimeOriginal
            } else if (exif.CreateTime) {
              this.imageDate = exif.CreateTime
            }
            // Get the georeference information
            if (exif.latitude && exif.longitude) {
              this.imageGps = {
                latitude: exif.latitude,
                longitude: exif.longitude
              }
            }
          })
      }
    }
  },
  methods: {
    /**
     * Converts the user selected file into base64
     * @param file The image file
     */
    toBase64: function (file) {
      // Return a promise as we can't wait for this
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error)
      })
    },
    /**
     * Returns the datetime string based on the given date
     * @param date The date to convert
     */
    getDateTime: function (date) {
      const dateString = date.toISOString()
      return `${dateString.split('T')[0]}_${dateString.split('T')[1].split('.')[0].replace(/:/g, '-')}`
    },
    /**
     * Downloads the image as a file attachment
     */
    downloadImage: async function () {
      if (this.imageFile) {
        if (this.supportsSaving) {
          // create a new handle
          const newHandle = await window.showSaveFilePicker({
            suggestedName: `${this.getDateTime(this.imageDate)}_${this.name}_${this.row + 1}_${this.col + 1}_${this.traitIds !== null ? this.traitIds.map(t => this.storeTraits[t].name).join('-') : ''}.${this.imageFile.name.split('.').pop()}`,
            excludeAcceptAllOption: true,
            types: [{
              description: 'Image file',
              accept: {
                'image/*': ['.jpg']
              }
            }]
          })
          // create a FileSystemWritableFileStream to write to
          const writableStream = await newHandle.createWritable()
          // write our file
          await writableStream.write(this.imageFile)
          // close the file and write the contents to disk.
          await writableStream.close()
        } else {
          const dl = document.createElement('a')
          dl.setAttribute('href', this.imageData)
          dl.setAttribute('download', `${this.getDateTime(this.imageDate)}_${this.name}_${this.row + 1}_${this.col + 1}_${this.traitIds !== null ? this.traitIds.map(t => this.storeTraits[t].name).join('-') : ''}.${this.imageFile.name.split('.').pop()}`)
          dl.click()
        }
      }

      this.$nextTick(() => this.hide())
    },
    /**
     * Shows the modal dialog and resets it to its initial state
     */
    show: function () {
      this.imageFile = null
      this.imageData = null
      this.imageDate = null
      this.imageGps = null
      this.supportsSaving = window.showSaveFilePicker !== undefined

      if (this.preferredTrait !== null) {
        this.traitIds = [this.preferredTrait]
      } else {
        this.traitIds = []
      }

      this.$nextTick(() => this.$refs.imageModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.imageModal.hide())
    }
  }
}
</script>

<style>
.image-modal img.image {
  border-bottom-right-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}
.image-modal .file-selector:nth-child(2) label {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
