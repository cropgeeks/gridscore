<template>
  <b-container>
    <b-jumbotron :header="$t('pageUuidImportTitle')" :lead="$t('pageUuidImportText')" bg-variant="info" text-variant="white" border-variant="dark">
      <b-input-group>
        <!-- A UUID input field -->
        <b-input v-model="uuid" v-if="uuid" />
        <b-input-group-append>
          <!-- Button to load the config based on the UUID -->
          <b-btn @click="getConfig" variant="primary">{{ $t('buttonUuidImport') }}</b-btn>
        </b-input-group-append>
      </b-input-group>
    </b-jumbotron>
    <!-- Error messages -->
    <h4 class="text-danger font-weight-bold mt-3" v-if="serverError">{{ serverError }}</h4>

    <YesNoCancelModal :title="$t('modalTitleReplaceDatasets')" :message="$t('modalTextReplaceDatasets')" :yesTitle="$t('buttonReplace')" :noTitle="$t('buttonImportAsNew')" :cancelTitle="$t('buttonCancel')" ref="yesNoCancelModal" @yes="yes" @no="no" />
  </b-container>
</template>

<script>
import YesNoCancelModal from '@/components/modals/YesNoCancelModal'
import idb from '@/plugins/idb'

/**
 * Component that handles data configuration sharing via a UUID QR code
 */
export default {
  components: {
    YesNoCancelModal
  },
  data: function () {
    return {
      uuid: null,
      serverError: null
    }
  },
  methods: {
    getConfig: function () {
      this.getConfigFromSharing(this.uuid)
        .then(result => {
          if (result) {
            this.config = result
            this.importData()
          }
        })
        .catch(err => {
          if (err && err.response && err.response.status) {
            switch (err.response.status) {
              case 404:
                this.serverError = this.$t('axiosErrorConfigNotFound')
                break
              case 500:
                this.serverError = this.$t('axiosErrorGeneric500')
                break
              default:
                this.serverError = err
                break
            }
          } else {
            this.serverError = this.$t('axiosErrorNoInternet')
          }
        })
    },
    importData: async function () {
      if (this.config) {
        // If the dataset has a name
        if (this.config.name) {
          // Get all existing datasets
          const datasets = await idb.getDatasets()

          // If there are any
          if (datasets) {
            // Check if one exists that matches
            const match = datasets.filter(d => d.name === this.config.name && d.rows === this.config.rows && d.cols === this.config.cols) ||
              datasets.filter(d => d.uuid === this.config.uuid)

            // If so, ask if user wants to overwrite it
            if (match && match.length > 0) {
              this.config = this.config
              this.config.id = match[0].id
              this.$refs.yesNoCancelModal.show()
              return
            }
          }
        } else {
          this.config.name = `Imported data: ${new Date().toISOString().split('T')[0]}`
        }
      }

      this.$store.dispatch('addDataset', this.config)
    },
    yes: function () {
      this.$store.dispatch('updateDataset', this.config)
    },
    no: function () {
      delete this.config.id
      this.$store.dispatch('addDataset', this.config)
    }
  },
  mounted: function () {
    // Get the UUID from the URL if available

    if (this.$route.params) {
      this.uuid = this.$route.params.uuid
    }
  }
}
</script>

<style>
.jumbotron > h1 {
  word-wrap: break-word;
}
</style>
