<template>
  <b-modal :title="name"
           :ok-title="$t('buttonSave')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="downloadImage"
           ref="imageModal"
           content-class="image-modal">
    <b-img fluid rounded :src="imageData" class="image" v-if="imageData" />
    <b-form-file v-model="imageFile" accept="image/*" capture class="form" />

    <b-badge v-if="imageDate">&#128197; {{ imageDate.toLocaleString() }}</b-badge><br/>
    <b-badge target="_blank" :href="`https://www.google.com/maps/place/${imageGps.latitude},${imageGps.longitude}/@${imageGps.latitude},${imageGps.longitude},9z`" v-if="imageGps">&#x1F4CD; {{ imageGps.latitude }}; {{ imageGps.longitude }}</b-badge>
  </b-modal>
</template>

<script>
import exifr from 'exifr/dist/lite.umd.js'

export default {
  data: function () {
    return {
      imageFile: null,
      imageData: null,
      imageDate: null,
      imageGps: null
    }
  },
  props: {
    name: {
      type: String,
      default: null
    }
  },
  watch: {
    imageFile: async function (newValue) {
      if (newValue) {
        this.imageGps = null
        this.imageDate = null
        this.imageData = await this.toBase64(newValue)

        if (newValue.lastModified) {
          this.imageDate = new Date(newValue.lastModified)
        } else {
          this.imageDate = new Date()
        }

        exifr.parse(newValue)
          .then(exif => {
            if (exif.DateTimeOriginal) {
              this.imageDate = exif.DateTimeOriginal
            } else if (exif.CreateTime) {
              this.imageDate = exif.CreateTime
            }
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
    toBase64: function (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error)
      })
    },
    getDateTime: function (date) {
      const dateString = date.toISOString()
      return `${dateString.split('T')[0]}_${dateString.split('T')[1].split('.')[0].replace(/:/g, '-')}`
    },
    downloadImage: function () {
      if (this.imageFile) {
        let dl = document.createElement('a')
        dl.setAttribute('href', this.imageData)
        dl.setAttribute('download', `${this.getDateTime(this.imageDate)}_${this.name}.${this.imageFile.name.split('.').pop()}`)
        dl.click()
      }

      this.$nextTick(() => this.hide())
    },
    show: function () {
      this.imageFile = null
      this.imageData = null
      this.imageDate = null
      this.imageGps = null
      this.$nextTick(() => this.$refs.imageModal.show())
    },
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
.image-modal .form:nth-child(2) label {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
