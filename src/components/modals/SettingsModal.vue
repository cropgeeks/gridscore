<template>
  <b-modal :title="$t('modalTitleSettings')"
           :ok-title="$t('buttonOk')"
           :cancel-title="$t('buttonCancel')"
           size="xl"
           @ok.prevent="onSubmit"
           ref="settingsModal">
    <b-form @submit.prevent="onSubmit" id="settings-form">
      <b-row>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelSettingsRows')" label-for="rows">
            <b-form-input id="rows" :state="state.rows" type="number" min="1" required autofocus v-model="rows" />
          </b-form-group>
          <b-form-group :label="$t('formLabelSettingsCols')" label-for="cols">
            <b-form-input id="cols" :state="state.cols" type="number" min="1" required v-model="cols" />
          </b-form-group>
          <b-form-group :label="$t('formLabelSettingsVarieties')" label-for="varieties">
            <b-form-textarea id="varieties" :state="state.varieties" rows=6 required v-model="varieties" />
            <b-form-file type="file" :placeholder="$t('buttonOpenFile')" accept="text/plain" v-model="varietiesFile" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6>
          <b-list-group v-if="newTraits && newTraits.length > 0" class="mb-3 trait-list">
            <b-list-group-item v-for="(trait, index) in newTraits" :key="`trait-${index}`" class="d-flex justify-content-between align-items-center">
              <span>{{ trait.name }}</span>

              <b-input-group class="trait-type-select">
                <template v-slot:append>
                  <b-button variant="danger" :title="$t('buttonDelete')" @click="removeTrait(index)">🗙</b-button>
                </template>
                <b-form-select v-model="trait.type" :options="traitTypes" />
              </b-input-group>
            </b-list-group-item>
          </b-list-group>
          <b-form-group :label="$t('formLabelSettingsTraits')" label-for="trait">
            <b-input-group>
              <template v-slot:append>
                <b-button variant="success" :title="$t('buttonAdd')" @click="addTrait">＋</b-button>
              </template>
              <b-form-input id="trait" :state="state.traits" required v-model="trait" />
            </b-input-group>
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>
  </b-modal>
</template>

<script>
export default {
  data: function () {
    return {
      rows: 1,
      cols: 1,
      newTraits: null,
      trait: null,
      varieties: null,
      formValidated: false,
      traitTypes: [{
        value: 'date',
        text: this.$t('traitTypeDate')
      }, {
        value: 'int',
        text: this.$t('traitTypeInt')
      }, {
        value: 'float',
        text: this.$t('traitTypeFloat')
      }, {
        value: 'text',
        text: this.$t('traitTypeText')
      }],
      state: {
        rows: null,
        cols: null,
        traits: null,
        varieties: null
      },
      varietiesFile: null
    }
  },
  watch: {
    varietiesFile: function (newValue) {
      if (newValue) {
        this.loadVarietiesFile()
      }
    }
  },
  methods: {
    removeTrait: function (index) {
      this.newTraits.splice(index, 1)
    },
    addTrait: function () {
      if (this.trait && this.trait.length > 0) {
        this.newTraits.push({
          name: this.trait,
          type: 'date'
        })
      }
    },
    loadVarietiesFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.varieties = event.target.result
        this.varietiesFile = null
      }
      reader.readAsText(this.varietiesFile)
    },
    show: function () {
      this.rows = this.dataset.rows
      this.cols = this.dataset.cols
      this.newTraits = JSON.parse(JSON.stringify(this.dataset.traits))
      let varieties = []
      this.dataset.data.forEach(r => {
        for (let c = 1; c <= this.cols; c++) {
          varieties.push(r[c].name)
        }
      })
      this.varieties = varieties.join('\n')
      this.formValidated = false
      this.state = {
        rows: null,
        cols: null,
        traits: null,
        varieties: null
      }
      this.trait = null
      this.varietiesFile = null
      this.$refs.settingsModal.show()
    },
    hide: function () {
      this.$refs.settingsModal.hide()
    },
    onSubmit: function (e) {
      this.formValidated = true
      this.state = {
        rows: this.rows > 0,
        cols: this.cols > 0,
        traits: (this.newTraits !== null) && (this.newTraits.length > 0),
        varieties: (this.varieties !== null) && (this.varieties.length > 0)
      }

      if (this.state.rows && this.state.cols && this.state.traits && this.state.varieties) {
        this.$bvModal.msgBoxConfirm(this.$t('modalTextSetupWarning'), {
          title: this.$t('modalTitleSetupWarning')
        }).then(value => {
          if (value === true) {
            this.$emit('settings-changed', {
              rows: parseInt(this.rows),
              cols: parseInt(this.cols),
              traits: this.newTraits,
              varieties: this.varieties.split('\n')
            })
            this.hide()
          }
        })
      }
    }
  }
}
</script>

<style>
#settings-form .form-group textarea {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
#settings-form .form-group textarea + .b-form-file * {
  border-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
.trait-type-select {
  max-width: 50%;
}
.trait-list {
  max-height: 30vh;
  overflow-y: auto;
}
</style>
