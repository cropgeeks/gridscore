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
          <b-nav-item active-class="active" :to="{ name: 'data' }" v-if="storeDatasetId"><BIconUiChecksGrid /> {{ $t('menuHome') }}</b-nav-item>
          <b-nav-item active-class="active" :to="{ name: 'home' }" v-else><BIconUiChecksGrid /> {{ $t('menuHome') }}</b-nav-item>
          <b-nav-item active-class="active" :to="{ name: 'timeline' }"><BIconGraphUp /> {{ $t('menuTimeSeries') }}</b-nav-item>
          <b-nav-item active-class="active" :to="{ name: 'heatmap' }"><BIconGridFill /> {{ $t('menuHeatmap') }}</b-nav-item>
          <b-nav-item active-class="active" :to="{ name: 'scatter' }"><BIconDice3 flip-h /> {{ $t('menuScatter') }}</b-nav-item>
          <b-nav-item active-class="active" :to="{ name: 'stats' }"><BIconBarChartSteps /> {{ $t('menuStats') }}</b-nav-item>
          <b-nav-item active-class="active" :to="{ name: 'location-map' }"><BIconMap /> {{ $t('menuLocationMap') }}</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-item active-class="active" href="#" @click.prevent="darkMode = !darkMode" v-b-tooltip="$t('tooltipToggleDarkMode')">
            <BIconMoon v-if="storeDarkMode" />
            <BIconSun v-else />
            <span class="d-lg-none">{{ $t('tooltipToggleDarkMode') }}</span>
          </b-nav-item>
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

    <b-sidebar id="sidebar" title="GridScore" shadow backdrop v-model="sidebarShown" :bg-variant="storeDarkMode ? 'primary' : 'light'" @shown="notifyCaller" @hidden="notifyCaller">
      <b-img fluid class="py-4 mx-auto d-block" src="img/gridscore2.svg" />

      <template>
        <h2 class="px-3">{{ $t('modalTitleSettings') }}</h2>
        <b-list-group class="rounded-0">
          <b-list-group-item button @click="$router.push({ name: 'settings' })">
            <BIconGearFill /> {{ $t('modalTitleSettings') }}
          </b-list-group-item>
        </b-list-group>

        <h2 class="px-3 mt-3">{{ $t('widgetSidebarTitle') }}</h2>
        <b-list-group class="rounded-0">
          <b-list-group-item :variant="dataset.id === storeDatasetId ? 'primary' : 'null'" button v-for="dataset in datasets" :key="`dataset-${dataset.id}`" @click="onDatasetSelected(dataset.id)">
            <div class="d-flex w-100 justify-content-between align-items-start">
              <h5>{{ dataset.id }} - {{ dataset.name }}</h5>
              <b-btn variant="outline-danger" v-b-tooltip="$t('buttonDelete')" @click.prevent.stop="onDatasetDeleteClicked(dataset.id)"><BIconTrash /></b-btn>
            </div>
            <p v-if="dataset.lastUpdatedOn" class="text-muted">
              <BIconCalendarDate /> {{ new Date(dataset.lastUpdatedOn).toLocaleString() }}
            </p>
          </b-list-group-item>
          <b-list-group-item variant="info" button @click="$router.push({ name: 'setup' })"><BIconPlus /> {{ $t('buttonAdd') }}</b-list-group-item>
        </b-list-group>
      </template>
    </b-sidebar>

    <!-- The main content -->
    <b-container fluid :class="$route.name === 'about' ? '' : 'mt-3'">
      <router-view :key="$route.path" />
    </b-container>

    <Tour :steps="tourSteps" :resetOnRouterNav="false" :hideBackButton="true" ref="tour" />

    <b-modal ref="loadingModal" hide-header hide-footer no-close-on-backdrop no-close-on-esc hide-header-close>
      <div class="text-center">
        <b-spinner style="width: 3rem; height: 3rem;" variant="primary" type="grow" />
        <p class="text-muted mt-3" v-if="$t('modalTextLoading')">{{ $t('modalTextLoading') }}</p>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Tour from '@/components/Tour'
import { loadLanguageAsync } from '@/plugins/i18n'
import { BIconMap, BIconUiChecksGrid, BIconGraphUp, BIconMoon, BIconSun, BIconDice3, BIconBarChartSteps, BIconGearFill, BIconCalendarDate, BIconGridFill, BIconTrash, BIconInfoCircle, BIconFlag, BIconPlus } from 'bootstrap-vue'
import { EventBus } from '@/plugins/event-bus'
import idb from '@/plugins/idb'
import { Detector } from '@/plugins/browser-detect.js'

export default {
  name: 'App',
  components: {
    BIconTrash,
    BIconMap,
    BIconUiChecksGrid,
    BIconGraphUp,
    BIconGridFill,
    BIconGearFill,
    BIconDice3,
    BIconCalendarDate,
    BIconInfoCircle,
    BIconFlag,
    BIconBarChartSteps,
    BIconPlus,
    BIconMoon,
    BIconSun,
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
        target: () => '#settings-buttons',
        position: 'bottom',
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
      sidebarCaller: null,
      darkMode: false
    }
  },
  watch: {
    darkMode: function (newValue) {
      this.$store.dispatch('setDarkMode', newValue)
    },
    storeDarkMode: function (newValue) {
      document.documentElement.className = newValue ? 'dark-mode' : 'light-mode'
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeDarkMode',
      'storeDatasetId',
      'storeLocale',
      'storeUniqueClientId',
      'storeRunCount'
    ])
  },
  methods: {
    isLocalhost: function () {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === ''
    },
    onDatasetSelected: function (datasetId) {
      this.$store.dispatch('loadDataset', datasetId)
      this.sidebarShown = false
      // this.$router.push({ name: 'data', params: { datasetId: datasetId } })
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
          const options = { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
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
          heading: 360
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
      }, 1000)
    },
    updateDatasets: function () {
      idb.getDatasets().then(datasets => {
        const ds = JSON.parse(JSON.stringify(datasets))
        if (ds) {
          ds.sort((a, b) => {
            if (a.lastUpdatedOn && b.lastUpdatedOn) {
              return (new Date(b.lastUpdatedOn)) - (new Date(a.lastUpdatedOn))
            } else if (a.lastUpdatedOn) {
              return -1
            } else if (b.lastUpdatedOn) {
              return 1
            } else {
              return a.name - b.name
            }
          })
        }
        this.datasets = ds
      })
    },
    navigateToDataset: function () {
      this.$store.dispatch('setVisibleTraits', null)
      const route = this.$router.currentRoute
      if (route.name !== 'dataset' || (route.params && (route.params.datasetId !== this.storeDatasetId))) {
        this.$router.push({ name: 'data' })
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
    },
    setLoading: function (visible) {
      if (visible) {
        this.$refs.loadingModal.show()
      } else {
        this.$refs.loadingModal.hide()
      }
    },
    /**
     * Generates a v4 UUID
     */
    uuidv4: function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    },
    toggleWakeLock: async function (acquire) {
      if (this.wakeLock === null && acquire) {
        try {
          // Get the lock
          this.wakeLock = await navigator.wakeLock.request()
          // Listen for changes to it
          this.wakeLock.addEventListener('release', () => {
            this.wakeLock = null
          })
        } catch (err) {
          this.wakeLock = null
        }
      } else if (this.wakeLock !== null && !acquire) {
        // Release it
        this.wakeLock.release()
        this.wakeLock = null
      }
    },
    handleVisibilityChange: async function () {
      // If the apps visibility changed (tab changed or window minimized), reaquire the lock after return
      if (this.wakeLock !== null && document.visibilityState === 'visible') {
        await this.toggleWakeLock(true)
      }
    }
  },
  mounted: function () {
    loadLanguageAsync(this.storeLocale)
    this.startGeoTracking()
    // this.fakeGpsMovement()

    this.darkMode = this.storeDarkMode

    document.documentElement.className = this.darkMode ? 'dark-mode' : 'light-mode'

    EventBus.$on('datasets-changed', this.updateDatasets)
    EventBus.$on('dataset-changed', this.navigateToDataset)
    EventBus.$on('dataset-deleted', this.navigateHome)
    EventBus.$on('set-loading', this.setLoading)
    EventBus.$on('show-introduction-tour', this.showIntroductionTour)
    this.updateDatasets()

    if ('wakeLock' in navigator) {
      this.toggleWakeLock(true)
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }

    // Log the run
    if (!this.isLocalhost()) {
      let id = this.storeUniqueClientId
      if (!id) {
        id = this.uuidv4()

        this.$store.dispatch('setUniqueClientId', id)
      }

      const config = new Detector().detect()
      const data = {
        application: 'GridScore',
        runCount: this.storeRunCount + 1,
        id: id,
        version: `${this.gridScoreVersion}`,
        locale: this.storeLocale,
        os: `${config.os} ${config.osVersion}`
      }
      this.axios('https://ics.hutton.ac.uk/app-logger/log', data, 'get')
        .then(() => {
          // If the call succeeds, reset the run count
          this.$store.dispatch('setRunCount', 0)
        })
        .catch(() => {
          // If this call fails (e.g. no internet), remember the run
          this.$store.dispatch('setRunCount', this.storeRunCount + 1)
        })
    }
  },
  destroyed: function () {
    if (this.geolocationWatchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geolocationWatchId)
    }

    EventBus.$off('datasets-changed', this.updateDatasets)
    EventBus.$off('dataset-changed', this.navigateToDataset)
    EventBus.$off('dataset-deleted', this.navigateHome)
    EventBus.$off('set-loading', this.setLoading)
    EventBus.$off('show-introduction-tour', this.showIntroductionTour)

    if ('wakeLock' in navigator) {
      this.toggleWakeLock(false)
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    }
  }
}
</script>

<style lang="scss">
// .light-mode {
//   @import '@/assets/css/light-mode.scss';
//   @import '~bootstrap/scss/bootstrap';
//   @import '~bootstrap-vue/src/index.scss';
//   @import '~bootswatch/dist/sandstone/bootswatch';

//   @each $breakpoint in map-keys($grid-breakpoints) {
//     @include media-breakpoint-up($breakpoint) {
//       $infix: breakpoint-infix($breakpoint, $grid-breakpoints);

//       .border#{$infix}-top {      border-top: $border-width solid $border-color !important; }
//       .border#{$infix}-right {    border-right: $border-width solid $border-color !important; }
//       .border#{$infix}-bottom {   border-bottom: $border-width solid $border-color !important; }
//       .border#{$infix}-left {     border-left: $border-width solid $border-color !important; }

//       .border#{$infix}-top-0 {    border-top: 0 !important; }
//       .border#{$infix}-right-0 {  border-right: 0 !important; }
//       .border#{$infix}-bottom-0 { border-bottom: 0 !important; }
//       .border#{$infix}-left-0 {   border-left: 0 !important; }

//       .border#{$infix}-x {
//         border-left: $border-width solid $border-color !important;
//         border-right: $border-width solid $border-color !important;
//       }

//       .border#{$infix}-y {
//         border-top: $border-width solid $border-color !important;
//         border-bottom: $border-width solid $border-color !important;
//       }
//     }
//   }
// }

// .dark-mode {
//   @import '@/assets/css/dark-mode-ol.scss';
//   @import '~bootstrap/scss/bootstrap';
//   @import '~bootstrap-vue/src/index.scss';
//   @import '~bootswatch/dist/sandstone/bootswatch';

//   @each $breakpoint in map-keys($grid-breakpoints) {
//     @include media-breakpoint-up($breakpoint) {
//       $infix: breakpoint-infix($breakpoint, $grid-breakpoints);

//       .border#{$infix}-top {      border-top: $border-width solid $border-color !important; }
//       .border#{$infix}-right {    border-right: $border-width solid $border-color !important; }
//       .border#{$infix}-bottom {   border-bottom: $border-width solid $border-color !important; }
//       .border#{$infix}-left {     border-left: $border-width solid $border-color !important; }

//       .border#{$infix}-top-0 {    border-top: 0 !important; }
//       .border#{$infix}-right-0 {  border-right: 0 !important; }
//       .border#{$infix}-bottom-0 { border-bottom: 0 !important; }
//       .border#{$infix}-left-0 {   border-left: 0 !important; }

//       .border#{$infix}-x {
//         border-left: $border-width solid $border-color !important;
//         border-right: $border-width solid $border-color !important;
//       }

//       .border#{$infix}-y {
//         border-top: $border-width solid $border-color !important;
//         border-bottom: $border-width solid $border-color !important;
//       }
//     }
//   }
// }

@import '@/assets/css/light-mode.scss';
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

@import './assets/css/dark-mode';

html {
  position: relative !important;
  min-height: 100vh !important;
}

body {
  overflow-y: scroll !important; /* Show vertical scrollbar */
  min-height: 100vh !important;
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

form input.form-control,
form input[type="radio"],
form textarea.form-control,
form select.custom-select {
  font-size: 16px;
}
</style>
