<template>
  <b-container class="py-3">
    <div class="text-center">
      <img src="img/gridscore2.svg" fluid  class="about-header-logo" alt="GridScore logo">
      <h1 class="py-3">{{ $t('appTitle') }}</h1>
    </div>
    <h2>{{ $t('pageHomeWelcome') }}</h2>
    <p v-html="$t('pageHomeInstructions')" />

    <div class="text-center">
      <b-button class="mx-2 mb-3" :to="{ name: 'setup' }"><BIconJournalPlus /> {{ $t('buttonSetupTrial') }}</b-button>
      <b-button class="mx-2 mb-3" :to="{ name: 'import' }"><BIconCloudDownloadFill /> {{ $t('buttonImportTrial') }}</b-button>
      <b-button class="mx-2 mb-3" @click="loadExampleData"><BIconFileSpreadsheet /> {{ $t('buttonLoadExampleData') }}</b-button>
      <b-button class="mx-2 mb-3" @click="startTour"><BIconPlayFill /> {{ $t('buttonStartIntroductionTour') }}</b-button>
      <b-button class="mx-2 mb-3" @click="$refs.helpModal.show()"><BIconQuestionCircleFill /> {{ $t('buttonHelp') }}</b-button>
    </div>

    <div v-if="datasets && datasets.length > 0" class="mt-3">
      <h2>{{ $t('pageHomeDatasetsTitle') }} - <small>{{ $t('pageHomeDatasetsSubtitle') }}</small></h2>
      <b-row>
        <b-col cols=12 sm=6 lg=3 v-for="dataset in datasets" :key="`dataset-${dataset.id}`" class="mb-3">
          <b-card :title="`${dataset.id} - ${dataset.name}`" class="h-100" :bg-variant="dataset.id === storeDatasetId ? 'light' : null">
            <a href="#" @click.prevent="onLoad(dataset)" v-if="datasetsWithUpdates.includes(dataset.id)">
              <div class="card-corner" v-b-tooltip="$t('tooltipDatasetUpdateAvailable')" />
              <BIconArrowRepeat class="card-corner-icon" />
            </a>

            <b-card-text><BIconLayoutThreeColumns rotate="90" /> {{ $tc('formLabelRowCount', dataset.rows) }}</b-card-text>
            <b-card-text><BIconLayoutThreeColumns /> {{ $tc('formLabelColCount', dataset.cols) }}</b-card-text>
            <b-card-text><BIconTags /> {{ $tc('formLabelTraits', dataset.traits.length) }}</b-card-text>
            <b-card-text v-if="dataset.lastUpdatedOn"><BIconCalendarDate /> {{ new Date(dataset.lastUpdatedOn).toLocaleString() }}</b-card-text>

            <template #footer>
              <div class="d-flex justify-content-between">
                <b-button variant="primary" @click="onDatasetSelected(dataset.id)">{{ $t('buttonSelect') }}</b-button>

                <b-dropdown variant="outline-secondary" right>
                  <template #button-content>
                    <BIconGear />
                  </template>
                  <b-dropdown-item @click="onAddTraitClicked(dataset)"><BIconTags /> {{ $t('buttonAddTrait') }}</b-dropdown-item>
                  <template v-if="dataset.uuid">
                    <b-dropdown-item-button @click="onLoad(dataset)"><BIconCloudDownloadFill /> {{ $t('tooltipLoad') }}</b-dropdown-item-button>
                    <b-dropdown-item-button @click="onSave(dataset)"><BIconCloudUploadFill /> {{ $t('tooltipSave') }}</b-dropdown-item-button>
                    <b-dropdown-item-button @click="onShowQRCodeClicked(dataset)" class="mr-1">
                      <!-- TODO: Replace with bootstrap-vue icon once new version is released -->
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code" viewBox="0 0 16 16">
                        <path d="M2 2h2v2H2V2Z"/>
                        <path d="M6 0v6H0V0h6ZM5 1H1v4h4V1ZM4 12H2v2h2v-2Z"/>
                        <path d="M6 10v6H0v-6h6Zm-5 1v4h4v-4H1Zm11-9h2v2h-2V2Z"/>
                        <path d="M10 0v6h6V0h-6Zm5 1v4h-4V1h4ZM8 1V0h1v2H8v2H7V1h1Zm0 5V4h1v2H8ZM6 8V7h1V6h1v2h1V7h5v1h-4v1H7V8H6Zm0 0v1H2V8H1v1H0V7h3v1h3Zm10 1h-1V7h1v2Zm-1 0h-1v2h2v-1h-1V9Zm-4 0h2v1h-1v1h-1V9Zm2 3v-1h-1v1h-1v1H9v1h3v-2h1Zm0 0h3v1h-2v1h-1v-2Zm-4-1v1h1v-2H7v1h2Z"/>
                        <path d="M7 12h1v3h4v1H7v-4Zm9 2v2h-3v-1h2v-1h1Z"/>
                      </svg> {{ $t('tooltipShowSharingCode') }}
                    </b-dropdown-item-button>
                  </template>
                  <b-dropdown-divider />
                  <b-dropdown-item @click="onResetClicked(dataset)"><BIconArrowCounterclockwise /> {{ $t('buttonResetDataset') }}</b-dropdown-item>
                  <b-dropdown-item @click="onDeleteClicked(dataset)" variant="danger"><BIconTrash /> {{ $t('buttonDeleteDataset') }}</b-dropdown-item>
                </b-dropdown>
              </div>
            </template>
          </b-card>
        </b-col>
      </b-row>
    </div>
    <b-card bg-variant="light" class="my-3" v-if="!storeHideCitationMessage" no-body>
      <b-card-body>
        <b-row>
          <b-col cols=12 sm=3 md=2 class="d-flex align-items-center justify-content-center">
            <BIconNewspaper class="display-1 p-2" />
          </b-col>
          <b-col cols=12 sm=9 md=10>
            <b-card-title><span>{{ $t('modalTitleCitation') }}</span><button type="button" @click.prevent="hideCitation" v-b-tooltip="$t('tooltipDontShowAgain')" aria-label="Close" class="close">×</button></b-card-title>
            <div v-html="$t('modalTextCitation')" />
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>
    <AddTraitModal :dataset="selectedDataset" ref="addTraitModal" />
    <BarcodeViewerModal ref="barcodeViewModal" :text="selectedDataset.uuid" :title="selectedDataset.name" v-if="selectedDataset && selectedDataset.uuid" />

    <HelpModal url="https://cropgeeks.github.io/gridscore/" ref="helpModal" />
  </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
import AddTraitModal from '@/components/modals/AddTraitModal'
import BarcodeViewerModal from '@/components/modals/BarcodeViewerModal'
import HelpModal from '@/components/modals/HelpModal'
import idb from '@/plugins/idb'
import api from '@/mixin/api'
import { BIconJournalPlus, BIconFileSpreadsheet, BIconNewspaper, BIconArrowRepeat, BIconQuestionCircleFill, BIconCloudDownloadFill, BIconCloudUploadFill, BIconPlayFill, BIconGear, BIconTags, BIconArrowCounterclockwise, BIconTrash, BIconLayoutThreeColumns, BIconCalendarDate } from 'bootstrap-vue'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    AddTraitModal,
    BarcodeViewerModal,
    HelpModal,
    BIconNewspaper,
    BIconArrowRepeat,
    BIconJournalPlus,
    BIconFileSpreadsheet,
    BIconPlayFill,
    BIconQuestionCircleFill,
    BIconCloudDownloadFill,
    BIconCloudUploadFill,
    BIconCalendarDate,
    BIconGear,
    BIconTrash,
    BIconTags,
    BIconArrowCounterclockwise,
    BIconLayoutThreeColumns
  },
  data: function () {
    return {
      selectedDataset: null,
      datasets: [],
      datasetsWithUpdates: []
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDatasetId',
      'storeHideCitationMessage'
    ])
  },
  mixins: [api],
  methods: {
    hideCitation: function () {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextHideCitation'), {
          title: this.$t('modalTitleHideCitation'),
          okTitle: this.$t('buttonYes'),
          okVariant: 'danger',
          cancelTitle: this.$t('buttonNo')
        })
          .then(value => {
            if (value) {
              this.$store.dispatch('setHideCitationMessage', true)

              this.plausibleEvent('citation-hide')
            }
          })
    },
    startTour: function () {
      emitter.emit('show-introduction-tour')
    },
    loadExampleData: function () {
      this.$store.dispatch('addDataset', require('@/example-data.json'))

      this.plausibleEvent('example-load')
    },
    redirect: function () {
      this.$router.push({ name: 'data' })
    },
    loadDataset: function () {
      if (this.storeDatasetId !== undefined && this.storeDatasetId !== null) {
        this.$store.dispatch('loadDataset', { datasetId: this.storeDatasetId, redirect: true })
      }
    },
    updateDatasets: function () {
      idb.getDatasets().then(datasets => {
        const ds = JSON.parse(JSON.stringify(datasets))
        if (ds) {
          ds.sort((a, b) => {
            try {
              if (a.lastUpdatedOn && b.lastUpdatedOn) {
                return (new Date(b.lastUpdatedOn)) - (new Date(a.lastUpdatedOn))
              } else if (a.lastUpdatedOn) {
                return -1
              } else if (b.lastUpdatedOn) {
                return 1
              } else {
                return a.name - b.name
              }
            } catch (e) {
              return a.name - b.name
            }
          })
        }
        this.datasets = ds
      })
    },
    onDatasetSelected: function (datasetId) {
      this.$store.dispatch('loadDataset', { datasetId: datasetId, redirect: true })
    },
    onResetClicked: function (dataset) {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextResetDataset'), {
          title: this.$t('modalTitleResetDataset'),
          okTitle: this.$t('buttonYes'),
          okVariant: 'danger',
          cancelTitle: this.$t('buttonNo')
        })
          .then(value => {
            if (value) {
              this.$store.dispatch('resetDataset', dataset.id)

              this.plausibleEvent('dataset-reset')
            }
          })
    },
    onDeleteClicked: function (dataset) {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextDeleteDataset'), {
          title: this.$t('modalTitleDeleteDataset'),
          okTitle: this.$t('buttonYes'),
          okVariant: 'danger',
          cancelTitle: this.$t('buttonNo')
        })
          .then(value => {
            if (value) {
              this.$store.dispatch('deleteDataset', dataset.id)

              this.plausibleEvent('dataset-delete')
            }
          })
    },
    onShowQRCodeClicked: function (dataset) {
      this.selectedDataset = dataset

      this.$nextTick(() => this.$refs.barcodeViewModal.show())

      this.plausibleEvent('qr-code-show')
    },
    onAddTraitClicked: function (dataset) {
      this.selectedDataset = dataset

      this.$nextTick(() => this.$refs.addTraitModal.show())

      this.plausibleEvent('dataset-update', { type: 'trait' })
    },
    checkDatasetsForUpdates: function () {
      idb.getAllDatasetsWithUuid()
        .then(datasets => {
          this.getDatasetUpdatesAvailable(datasets)
            .then(result => {
              if (result && result.data) {
                const updatesAvailable = datasets.filter((u, i) => result.data[i])

                if (updatesAvailable) {
                  this.updateDatasetsWithUpdates(updatesAvailable.map(ds => ds.id))
                } else {
                  this.updateDatasetsWithUpdates([])
                }
              }
            })
        })
        .catch(() => {
          this.updateDatasetsWithUpdates([])
        })
    },
    updateDatasetsWithUpdates: function (datasetIds) {
      this.datasetsWithUpdates = datasetIds

      if (datasetIds && datasetIds.length > 0) {
        this.$bvToast.toast(this.$tc('toastTextUpdatesAvailable', datasetIds.length), {
          title: this.$t('toastTitleUpdatesAvailable'),
          variant: 'info',
          toaster: 'b-toaster-bottom-center'
        })
      }
    }
  },
  created: function () {
    this.updateDatasets()

    this.checkDatasetsForUpdates()

    emitter.on('datasets-changed', this.updateDatasets)
    emitter.on('datasets-have-updates', this.updateDatasetsWithUpdates)
    emitter.on('dataset-loaded-remotely', this.checkDatasetsForUpdates)
  },
  destroyed: function () {
    emitter.off('datasets-changed', this.updateDatasets)
    emitter.off('datasets-have-updates', this.updateDatasetsWithUpdates)
    emitter.off('dataset-loaded-remotely', this.checkDatasetsForUpdates)
  }
}
</script>

<style scoped>
.about-header-logo {
  max-height: 200px;
}

.card-corner {
  position: absolute;
  top: 0;
  right: 0;
  width: 50px;
  height: 50px;
  border-top: 50px solid #888;
  border-top-color: var(--info);
  border-left: 50px solid transparent;
}
.card-corner-icon {
  position: absolute;
  top: 7px;
  right: 7px;
  color: white;
  pointer-events: none;
}
</style>
