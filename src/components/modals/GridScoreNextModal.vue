<template>
  <b-modal :title="$t('modalTitleGridScoreNext')"
           :ok-title="$t('buttonClose')"
           ok-only
           :ok-variant="null"
           no-fade
           size="xl"
           ref="gridScoreNextModal">
    <div class="about-header bg-light p-5 mb-4 border rounded-lg">
      <b-row>
        <b-col cols=12 md=4 class="text-center text-md-right" order="1" order-md="2">
          <b-img fluid src="img/gridscore-next-text.svg" alt="GridScore NEXT logo" />
        </b-col>
        <b-col cols=12 md=8 order="2" order-md="1">
          <h1 class="display-4 text-center text-md-left text-wrap">{{ $t('appTitleGridScoreNext') }}</h1>
          <p class="lead text-center text-md-left">{{ $t('widgetGridScoreNextExplanation') }}</p>
          <p class="text-center text-md-left mb-0">{{ $t('widgetGridScoreNextInstructions') }}</p>
        </b-col>
      </b-row>
    </div>

    <p v-html="$t('modalTextGridScoreNext')" />

    <b-row>
      <b-col cols=12 md=6 class="mb-3">
        <b-card class="h-100" no-body>
          <b-card-body>
            <b-card-img :src="require(`@/assets/gridscore-next-android.svg`)" class="p-3" />
            <b-card-title>{{ $t('widgetGridScoreNextCardTitleAndroid') }}</b-card-title>
            <b-card-sub-title>{{ $t('widgetGridScoreNextCardSubTitleAndroid') }}</b-card-sub-title>
          </b-card-body>
          <b-button variant="primary" class="stretched-link rounded-0 rounded-bottom" target="_blank" href="https://play.google.com/store/apps/details?id=uk.ac.hutton.gridscore"><BIconPlayFill /> {{ $t('buttonGo') }}</b-button>
        </b-card>
      </b-col>
      <b-col cols=12 md=6 class="mb-3">
        <b-card class="h-100" no-body>
          <b-card-body>
            <b-card-img :src="require(`@/assets/gridscore-next-pwa.svg`)" class="p-3" />
            <b-card-title>{{ $t('widgetGridScoreNextCardTitleWeb') }}</b-card-title>
            <b-card-sub-title>{{ $t('widgetGridScoreNextCardSubTitleWeb') }}</b-card-sub-title>
          </b-card-body>
          <b-button variant="primary" class="stretched-link rounded-0 rounded-bottom" target="_blank" href="https://gridscore.hutton.ac.uk"><BIconPlayFill /> {{ $t('buttonGo') }}</b-button>
        </b-card>
      </b-col>
    </b-row>
  </b-modal>
</template>

<script>
import { BIconPlayFill } from 'bootstrap-vue'

export default {
  components: {
    BIconPlayFill
  },
  data: function () {
    return {
    }
  },
  computed: {
  },
  methods: {
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.gridScoreNextModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.gridScoreNextModal.hide())
    }
  }
}
</script>

<style scoped>
.about-header img {
  max-height: 125px;
}

@media (min-width: 768px) {
  .about-header img {
    max-height: 150px;
  }
}
</style>
