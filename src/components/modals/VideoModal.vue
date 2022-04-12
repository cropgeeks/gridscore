<template>
  <b-modal :title="name"
           :ok-title="$t('buttonSave')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="downloadVideo"
           no-fade
           ref="videoModal"
           content-class="video-modal">
    <!-- Preview the image -->
    <b-embed type="video" class="rounded" controls :src="videoData" v-if="videoData" />
    <!-- Input for selecting (or taking) the image -->
    <b-form-file v-model="videoFile" accept="video/*" capture class="form" />

    <!-- Show image date if available -->
    <b-badge v-if="videoDate"><BIconCalendar3 /> {{ videoDate.toLocaleString() }}</b-badge><br/>
    <!-- Show geolocation if available -->
    <b-badge target="_blank" rel="noopener noreferrer" :href="`https://www.google.com/maps/place/${videoGps.lat},${videoGps.lng}/@${videoGps.lat},${videoGps.lng},9z`" v-if="videoGps && videoGps.lat && videoGps.lng">📍 {{ videoGps.lat.toFixed(4) }}; {{ videoGps.lng.toFixed(4) }}</b-badge>
  </b-modal>
</template>

<script>
import { mapGetters } from 'vuex'
import { BIconCalendar3 } from 'bootstrap-vue'

export default {
  components: {
    BIconCalendar3
  },
  data: function () {
    return {
      videoFile: null,
      videoData: null,
      videoDate: null,
      videoGps: null,
      supportsSaving: false
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeGeolocation'
    ])
  },
  props: {
    /** The variety name to use as the title */
    name: {
      type: String,
      default: null
    }
  },
  watch: {
    videoFile: async function (newValue) {
      if (newValue) {
        // If there is a new image file, reset data
        this.videoGps = null
        this.videoDate = null

        this.videoData = URL.createObjectURL(newValue)
        this.videoGps = this.storeGeolocation

        if (newValue.lastModified) {
          // If there is a last modified date, use it
          this.videoDate = new Date(newValue.lastModified)
        } else {
          // Use current date as fallback as this is required for the filename
          this.videoDate = new Date()
        }
      }
    }
  },
  methods: {
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
    downloadVideo: async function () {
      if (this.videoFile) {
        if (this.supportsSaving) {
          // create a new handle
          const newHandle = await window.showSaveFilePicker({
            suggestedName: `${this.getDateTime(this.videoDate)}_${this.name}.${this.videoFile.name.split('.').pop()}`,
            excludeAcceptAllOption: true,
            types: [{
              description: 'Video file',
              accept: {
                'video/*': ['.mp4']
              }
            }]
          })
          // create a FileSystemWritableFileStream to write to
          const writableStream = await newHandle.createWritable()
          // write our file
          await writableStream.write(this.videoFile)
          // close the file and write the contents to disk.
          await writableStream.close()
        } else {
          const dl = document.createElement('a')
          dl.setAttribute('href', this.videoData)
          dl.setAttribute('download', `${this.getDateTime(this.videoDate)}_${this.name}.${this.videoFile.name.split('.').pop()}`)
          dl.click()
        }
      }

      this.$nextTick(() => this.hide())
    },
    /**
     * Shows the modal dialog and resets it to its initial state
     */
    show: function () {
      this.videoFile = null
      this.videoData = null
      this.videoDate = null
      this.videoGps = null
      this.supportsSaving = window.showSaveFilePicker !== undefined
      this.$nextTick(() => this.$refs.videoModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.videoModal.hide())
    }
  }
}
</script>

<style>
.video-modal video {
  border-bottom-right-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}
.video-modal .form:nth-child(2) label {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
