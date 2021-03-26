<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="primary" id="main-navigation">
      <button v-b-toggle.sidebar variant="outline-light" id="dataset-selector" class="mr-3 navbar-toggler collapsed"><span class="navbar-toggler-icon" /></button>
      <b-navbar-brand :to="{ name: 'home' }" class="d-flex align-items-center">
        <img src="img/gridscore2.svg" height="40px" class="d-inline-block align-top mr-3" alt="GridScore">
        GridScore
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item :to="{ name: 'home' }"><BIconUiChecksGrid /> {{ $t('menuHome') }}</b-nav-item>
          <b-nav-item :to="{ name: 'timeline' }"><BIconGraphUp /> {{ $t('menuTimeSeries') }}</b-nav-item>
          <b-nav-item :to="{ name: 'heatmap' }"><BIconGridFill /> {{ $t('menuHeatmap') }}</b-nav-item>
          <b-nav-item :to="{ name: 'stats' }"><BIconBarChartSteps /> {{ $t('menuStats') }}</b-nav-item>
          <b-nav-item :to="{ name: 'location-map' }"><BIconMap /> {{ $t('menuLocationMap') }}</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-item-dropdown right>
            <template #button-content>
              <BIconFlag /><span> {{ $t('menuLocale') }}</span>
            </template>
            <b-dropdown-item v-for="language in languages" :key="`locale-${language.locale}`" @click="onLocaleChanged(language)">
              <span class="mr-2">{{ language.icon }}</span>
              <span>{{ language.name }}</span>
            </b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item :to="{ name: 'about' }"><BIconInfoCircle /> About</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>

    <b-sidebar id="sidebar" title="GridScore" shadow backdrop v-model="sidebarShown" @shown="notifyCaller" @hidden="notifyCaller">
      <b-img fluid class="py-4 mx-auto d-block" src="img/gridscore2.svg" />

      <template>
        <h2 class="px-3">{{ $t('widgetSidebarTitle') }}</h2>
        <b-list-group class="rounded-0">
          <b-list-group-item :variant="dataset.id === storeDatasetId ? 'primary' : 'null'" button class="d-flex justify-content-between align-items-center" v-for="dataset in datasets" :key="`dataset-${dataset.id}`" @click="onDatasetSelected(dataset.id)">
            {{ dataset.id }} - {{ dataset.name }}<b-badge variant="danger" v-b-tooltip="$t('buttonDelete')" pill @click.prevent.stop="onDatasetDeleteClicked(dataset.id)">&times;</b-badge></b-list-group-item>
          <b-list-group-item variant="info" button @click="$router.push({ name: 'setup' })"><BIconPlus /> {{ $t('buttonAdd') }}</b-list-group-item>
        </b-list-group>
      </template>
    </b-sidebar>

    <!-- The main content -->
    <b-container fluid class="mt-3">
      <router-view :key="$route.path" />
    </b-container>

    <Tour :steps="tourSteps" :resetOnRouterNav="false" :hideBackButton="true" ref="tour" />
  </div>
</template>

<script>
import Tour from '@/components/Tour'

import { loadLanguageAsync } from '@/plugins/i18n'

import { BIconMap, BIconUiChecksGrid, BIconGraphUp, BIconBarChartSteps, BIconGridFill, BIconInfoCircle, BIconFlag, BIconPlus } from 'bootstrap-vue'

import { EventBus } from '@/plugins/event-bus'

import idb from '@/plugins/idb'

export default {
  name: 'App',
  components: {
    BIconMap,
    BIconUiChecksGrid,
    BIconGraphUp,
    BIconGridFill,
    BIconInfoCircle,
    BIconFlag,
    BIconBarChartSteps,
    BIconPlus,
    Tour
  },
  data: function () {
    return {
      tourSteps: [{
        title: () => this.$t('tourTitleWelcome'),
        text: () => this.$t('tourTextWelcome'),
        target: () => '#main-navigation',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleMenu'),
        text: () => this.$t('tourTextMenu'),
        target: () => '#main-navigation',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleSidebar'),
        text: () => this.$t('tourTextSidebar'),
        target: () => '#sidebar',
        position: 'right',
        beforeShow: () => new Promise(resolve => this.toggleSidebar({ show: true, done: () => resolve() })),
        afterShow: () => new Promise(resolve => this.toggleSidebar({ show: false, done: () => resolve() }))
      }, {
        title: () => this.$t('tourTitleSetup'),
        text: () => this.$t('tourTextSetup'),
        target: () => '#settings-form',
        position: 'top',
        beforeShow: () => new Promise(resolve => this.$router.push({ name: 'setup' }).then(() => resolve()))
      }, {
        title: () => this.$t('tourTitleSetupDatasetName'),
        text: () => this.$t('tourTextSetupDatasetName'),
        target: () => '#settings-form #dataset-name',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleSetupRows'),
        text: () => this.$t('tourTextSetupRows'),
        target: () => '#settings-form #rows',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleSetupCols'),
        text: () => this.$t('tourTextSetupCols'),
        target: () => '#settings-form #cols',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleSetupGermplasm'),
        text: () => this.$t('tourTextSetupGermplasm'),
        target: () => '#settings-form #varieties',
        position: 'top'
      }, {
        title: () => this.$t('tourTitleSetupTraits'),
        text: () => this.$t('tourTextSetupTraits'),
        target: () => '#settings-form #trait',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleSetupMap'),
        text: () => this.$t('tourTextSetupMap'),
        target: () => '#settings-form #map-toggle-button',
        position: 'top',
        afterShow: () => new Promise(resolve => this.$router.push({ name: 'home' }).then(() => resolve()))
      }, {
        title: () => this.$t('tourTitleConclusion'),
        text: () => this.$t('tourTextConclusion'),
        target: () => '#main-navigation',
        position: 'bottom'
      }],
      languages: [{
        locale: 'en_GB',
        name: 'British English',
        icon: '🇬🇧'
      }, {
        locale: 'de_DE',
        name: 'Deutsch - Deutschland',
        icon: '🇩🇪'
      }],
      geolocationWatchId: null,
      datasets: [],
      sidebarShown: false,
      sidebarCaller: null
    }
  },
  methods: {
    onDatasetSelected: function (datasetId) {
      if (datasetId !== this.storeDatasetId) {
        this.$store.dispatch('loadDataset', datasetId)
        this.$router.push({ name: 'dataset', params: { datasetId: datasetId } })
      }
    },
    onDatasetDeleteClicked: function (datasetId) {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextDeleteDataset'), {
          title: this.$t('modalTitleDeleteDataset'),
          okTitle: this.$t('buttonYes'),
          okVariant: 'danger',
          cancelTitle: this.$t('buttonNo')
        })
          .then(value => {
            if (value) {
              this.$store.dispatch('deleteDataset', datasetId)
            }
          })
    },
    /**
     * When the locale is changed, update the i18n settings
     * @param language The newly selected locale
     */
    onLocaleChanged: function (language) {
      loadLanguageAsync(language.locale).then(() => {
        this.$i18n.locale = language.locale
        this.$store.dispatch('setLocale', language.locale)
      })
    },
    startGeoTracking: function () {
      if (this.geolocationWatchId === null) {
        if (navigator.geolocation) {
          const options = { enableHighAccuracy: true, maximumAge: 100, timeout: 20000 }
          this.geolocationWatchId = navigator.geolocation.watchPosition(position => {
            if (position && position.coords) {
              this.$store.dispatch('setGeolocation', {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                elv: position.coords.altitude,
                heading: position.coords.heading
              })
            }
          }, null, options)
        }
      }
    },
    fakeGpsMovement: function () {
      const points = [
        {
          lat: 56.481678,
          lng: -3.107542,
          steps: 200,
          heading: 270
        }, {
          lat: 56.481585,
          lng: -3.110989,
          steps: 20,
          heading: 0
        }, {
          lat: 56.481776,
          lng: -3.111069,
          steps: 200,
          heading: 90
        }, {
          lat: 56.481824,
          lng: -3.107601,
          steps: 20,
          heading: 180
        }
      ]

      let counter = 0
      let steps = points[0].steps
      let heading = points[0].heading
      let pointIndex = 0
      setTimeout(() => {
        const wrapper = document.querySelector('#grid-table')
        const table = document.querySelector('#grid-table .table')
        if (wrapper && table) {
          wrapper.scrollTop = table.offsetHeight
          wrapper.scrollLeft = table.offsetWidth * 0.25
        }

        const id = setInterval(() => {
          counter++
          if (counter === steps) {
            counter = 0
            pointIndex = (pointIndex + 1) % points.length
            steps = points[pointIndex].steps
            heading = points[pointIndex].heading
            if (pointIndex === 0) {
              clearInterval(id)
            }
          } else {
            const start = points[pointIndex]
            const end = points[(pointIndex + 1) % points.length]
            const dLat = start.lat + ((end.lat - start.lat) / steps) * counter
            const dLng = start.lng + ((end.lng - start.lng) / steps) * counter

            console.log(pointIndex, dLat, dLng)

            this.$store.dispatch('setGeolocation', {
              lat: dLat,
              lng: dLng,
              elv: 100,
              heading: heading
            })

            if (wrapper && (heading === 270 || heading === 90)) {
              const bottom = table.offsetHeight
              const wrapperHeight = wrapper.offsetHeight
              let scrollTop

              if (heading === 270) {
                scrollTop = bottom - (counter / steps) * bottom - wrapperHeight / 2
              } else if (heading === 90) {
                scrollTop = bottom - ((steps - counter) / steps) * bottom - wrapperHeight / 2
              }

              wrapper.scroll({
                top: scrollTop,
                behavior: 'smooth'
              })
            }
          }
        }, 100)
      }, 20001)
    },
    updateDatasets: function () {
      idb.getDatasets().then(datasets => {
        this.datasets = datasets
      })
    },
    loadDataset: function () {
      if (this.storeDatasetId !== undefined && this.storeDatasetId !== null) {
        this.$store.dispatch('loadDataset', this.storeDatasetId)
        this.$router.push({ name: 'dataset', params: { datasetId: this.storeDatasetId } })
      }
    },
    navigateToDataset: function () {
      const route = this.$router.currentRoute
      if (route.name !== 'dataset' || (route.params && (route.params.datasetId !== this.storeDatasetId))) {
        this.$router.push({ name: 'dataset', params: { datasetId: this.storeDatasetId } })
      }
    },
    navigateHome: function () {
      const route = this.$router.currentRoute
      if (route.name !== 'home') {
        this.$router.push({ name: 'home' })
      }
    },
    toggleSidebar: function (data) {
      this.sidebarShown = data.show

      if (data && data.done) {
        this.sidebarCaller = data.done
      }
    },
    notifyCaller: function () {
      if (this.sidebarCaller) {
        this.sidebarCaller()
        this.sidebarCaller = null
      }
    },
    showIntroductionTour: function () {
      this.$refs.tour.start()
    }
  },
  mounted: function () {
    loadLanguageAsync(this.storeLocale)
    this.startGeoTracking()
    // this.fakeGpsMovement()

    EventBus.$on('datasets-changed', this.updateDatasets)
    EventBus.$on('dataset-changed', this.navigateToDataset)
    EventBus.$on('dataset-deleted', this.navigateHome)
    EventBus.$on('show-introduction-tour', this.showIntroductionTour)
    this.updateDatasets()

    this.loadDataset()
  },
  destroyed: function () {
    if (this.geolocationWatchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geolocationWatchId)
    }

    EventBus.$off('datasets-changed', this.updateDatasets)
    EventBus.$off('dataset-changed', this.navigateToDataset)
    EventBus.$off('dataset-deleted', this.navigateHome)
    EventBus.$off('show-introduction-tour', this.showIntroductionTour)
  }
}
</script>

<style lang="scss">
// Import the bootswatch theme
@import '~bootswatch/dist/sandstone/variables';
@import '~bootstrap/scss/bootstrap';
@import '~bootstrap-vue/src/index.scss';
@import '~bootswatch/dist/sandstone/bootswatch';

@each $breakpoint in map-keys($grid-breakpoints) {
  @include media-breakpoint-up($breakpoint) {
    $infix: breakpoint-infix($breakpoint, $grid-breakpoints);

    .border#{$infix}-top {      border-top: $border-width solid $border-color !important; }
    .border#{$infix}-right {    border-right: $border-width solid $border-color !important; }
    .border#{$infix}-bottom {   border-bottom: $border-width solid $border-color !important; }
    .border#{$infix}-left {     border-left: $border-width solid $border-color !important; }

    .border#{$infix}-top-0 {    border-top: 0 !important; }
    .border#{$infix}-right-0 {  border-right: 0 !important; }
    .border#{$infix}-bottom-0 { border-bottom: 0 !important; }
    .border#{$infix}-left-0 {   border-left: 0 !important; }

    .border#{$infix}-x {
      border-left: $border-width solid $border-color !important;
      border-right: $border-width solid $border-color !important;
    }

    .border#{$infix}-y {
      border-top: $border-width solid $border-color !important;
      border-bottom: $border-width solid $border-color !important;
    }
  }
}

html {
  position: relative;
  min-height: 100%;
}

.tooltip {
  text-transform: initial !important;
}
.input-group .btn {
  line-height: 21px;
}

#sidebar img {
  max-width: 50%;
}
#sidebar .badge:hover {
  cursor: pointer;
}
#dataset-selector {
  display: block;
}
</style>
