<template>
  <div>
    <b-modal :ok-title="$t('buttonOk')"
            :cancel-title="$t('buttonCancel')"
            size="xl"
            @ok.prevent="onSubmit"
            ref="settingsModal">
      <template v-slot:modal-header="{ close }">
        <h5 class="modal-title">{{ $t('modalTitleSettings') }}</h5>

        <b-button-group>
          <b-button variant="light" size="sm" @click="showImportExportModal(true)">{{ $t('buttonImport') }}</b-button>
          <b-button variant="light" size="sm" @click="showImportExportModal(false)">{{ $t('buttonExport') }}</b-button>
        </b-button-group>

        <button class="close ml-0" @click="close()">×</button>
      </template>
      <b-form @submit.prevent="onSubmit" id="settings-form">
        <b-row>
          <b-col cols=12 md=6>
            <b-form-group :label="$t('formLabelSettingsRows')" label-for="rows">
              <b-form-input id="rows" :state="state.rows" number type="number" :min="1" required autofocus v-model.number="rows" />
            </b-form-group>
            <b-form-group :label="$t('formLabelSettingsCols')" label-for="cols">
              <b-form-input id="cols" :state="state.cols" number type="number" :min="1" required v-model.number="cols" />
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
                    <b-button variant="danger" :title="$t('buttonDelete')" @click="removeTrait(index)">×</b-button>
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
                <b-form-input id="trait" :state="state.traits" ref="traitName" required v-model="trait" v-on:keyup.enter="addTrait" />
              </b-input-group>
            </b-form-group>
          </b-col>
        </b-row>
        <!-- Map used for defining the field's corner points -->
        <b-button v-b-toggle.collapse-1 variant="primary">{{ $t('buttonShowFieldMap') }}</b-button>
        <b-collapse id="collapse-1" class="mt-2" @shown="invalidateMap">
          <FieldMap :geolocation="geolocation" :rows="rows" :cols="cols" ref="map" />
        </b-collapse>
      </b-form>
    </b-modal>
    <ImportExportModal :isImport="isImport" v-on:dataset-changed="reset" ref="importExportModal" />
  </div>
</template>

<script>
import FieldMap from '@/components/FieldMap'
import ImportExportModal from '@/components/modals/ImportExportModal'

export default {
  props: {
    geolocation: {
      type: Object,
      default: null
    }
  },
  data: function () {
    return {
      rows: 1,
      cols: 1,
      isImport: true,
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
  components: {
    FieldMap,
    ImportExportModal
  },
  methods: {
    showImportExportModal: function (isImportNew) {
      this.isImport = isImportNew
      this.$refs.importExportModal.show()
    },
    invalidateMap: function () {
      this.$nextTick(() => this.$refs.map.invalidateSize())
    },
    removeTrait: function (index) {
      this.newTraits.splice(index, 1)
    },
    addTrait: function () {
      if (this.trait && this.trait.length > 0) {
        this.newTraits.push({
          name: this.trait,
          type: 'date'
        })
        this.trait = null
        this.$refs.traitName.focus()
      }
    },
    loadVarietiesFile: function () {
      const reader = new FileReader()
      reader.onload = event => {
        this.varieties = event.target.result.replace(/\r/g, '')
        this.varietiesFile = null
      }
      reader.readAsText(this.varietiesFile)
    },
    reset: function () {
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
    },
    show: function () {
      this.reset()
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
              varieties: this.varieties.split('\n'),
              cornerPoints: this.$refs.map.getCornerPoints()
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
