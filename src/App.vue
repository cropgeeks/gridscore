<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="primary">
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

    <!-- The main content -->
    <b-container fluid class="mt-3">
      <router-view :key="$route.path" />
    </b-container>
  </div>
</template>

<script>
import { loadLanguageAsync } from '@/plugins/i18n'

import { BIconMap, BIconUiChecksGrid, BIconGraphUp, BIconGridFill, BIconInfoCircle, BIconFlag } from 'bootstrap-vue'

export default {
  name: 'App',
  components: {
    BIconMap,
    BIconUiChecksGrid,
    BIconGraphUp,
    BIconGridFill,
    BIconInfoCircle,
    BIconFlag
  },
  data: function () {
    return {
      languages: [{
        locale: 'en_GB',
        name: 'British English',
        icon: '🇬🇧'
      }, {
        locale: 'de_DE',
        name: 'Deutsch - Deutschland',
        icon: '🇩🇪'
      }],
      geolocationWatchId: null
    }
  },
  methods: {
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
    }
  },
  mounted: function () {
    loadLanguageAsync(this.locale)
    this.startGeoTracking()
  },
  destroyed: function () {
    if (this.geolocationWatchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geolocationWatchId)
    }
  }
}
</script>

<style lang="scss">
// Import the bootswatch theme
@import '~bootswatch/dist/sandstone/variables';
@import '~bootstrap/scss/bootstrap';
@import '~bootstrap-vue/src/index.scss';
@import '~bootswatch/dist/sandstone/bootswatch';

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
</style>
