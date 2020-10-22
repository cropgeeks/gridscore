<template>
  <b-container>
    <b-jumbotron :header="$t('pageUuidImportTitle')" :lead="$t('pageUuidImportText')" bg-variant="info" text-variant="white" border-variant="dark">
      <b-input-group>
        <b-input v-model="uuid" v-if="uuid" />
        <b-input-group-append>
          <b-btn @click="getConfig" variant="primary">{{ $t('buttonUuidImport') }}</b-btn>
        </b-input-group-append>
      </b-input-group>
    </b-jumbotron>
    <h4 class="text-danger font-weight-bold mt-3" v-if="serverError">{{ serverError }}</h4>
  </b-container>
</template>

<script>
export default {
  data: function () {
    return {
      uuid: null,
      serverError: null
    }
  },
  methods: {
    getConfig: function () {
      // Ask for confirmation
      this.$bvModal.msgBoxConfirm(this.$t('modalTextSetupWarning'), {
        title: this.$t('modalTitleSetupWarning')
      }).then(value => {
        if (value === true) {
          this.getConfigFromSharing(this.uuid)
            .then(result => {
              if (result && result.data) {
                const config = result.data

                if (config && !config.data) {
                  config.data = []
                }

                this.$store.commit('ON_DATASET_CHANGED', config)
                this.$router.push({ name: 'home' })
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
        }
      })
    }
  },
  mounted: function () {
    this.uuid = this.$route.params.uuid
  }
}
</script>

<style>
.jumbotron > h1 {
  word-wrap: break-word;
}
</style>
