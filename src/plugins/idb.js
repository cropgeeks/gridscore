import { openDB, deleteDB } from 'idb'

let db

export default {
  getDb: async function () {
    return new Promise((resolve, reject) => {
      if (db) {
        return resolve(db)
      } else {
        openDB('gridscore-' + window.location.pathname, 7, {
          upgrade: function (db, oldVersion, newVersion, transaction) {
            let datasets
            let data
            if (oldVersion < 1) {
              datasets = db.createObjectStore('datasets', { keyPath: 'id', autoIncrement: true })
              datasets.createIndex('name', 'name', { unique: false })
              datasets.createIndex('rows', 'rows', { unique: false })
              datasets.createIndex('cols', 'cols', { unique: false })
              datasets.createIndex('traits', 'traits', { unique: false })
              datasets.createIndex('cornerPoints', 'cornerPoints', { unique: false })
              datasets.createIndex('brapiConfig', 'brapiConfig', { unique: false })

              data = db.createObjectStore('data', { keyPath: ['dsId', 'row', 'col'] })
              data.createIndex('dsId', 'dsId', { unique: false })
              data.createIndex('row', 'row', { unique: false })
              data.createIndex('col', 'col', { unique: false })
              data.createIndex('name', 'name', { unique: false })
              data.createIndex('dates', 'dates', { unique: false })
              data.createIndex('values', 'values', { unique: false })
              data.createIndex('geolocation', 'geolocation', { unique: false })
              data.createIndex('comment', 'comment', { unique: false })
            }
            if (oldVersion < 2) {
              // Add a last updated on column to the datasets
              datasets = transaction.objectStore('datasets')
              datasets.createIndex('lastUpdatedOn', 'lastUpdatedOn', { unique: false })
            }
            if (oldVersion < 3) {
              // Add a uuid column to the datasets
              datasets = transaction.objectStore('datasets')
              datasets.createIndex('uuid', 'uuid', { unique: false })
            }
            if (oldVersion < 4) {
              // Add a markers column to the datasets
              datasets = transaction.objectStore('datasets')
              datasets.createIndex('markers', 'markers', { unique: false })
            }
            if (oldVersion < 5) {
              // Add a datasetType column to the datasets
              datasets = transaction.objectStore('datasets')
              datasets.createIndex('datasetType', 'datasetType', { unique: false })
            }
            if (oldVersion < 6) {
              // Add a comment column to the datasets
              datasets = transaction.objectStore('datasets')
              datasets.createIndex('comment', 'comment', { unique: false })
            }
            if (oldVersion < 7) {
              data = transaction.objectStore('data')
              data.createIndex('rep', 'rep', { unique: false })
            }
          }
        }).then(db => resolve(db))
      }
    })
  },
  getDatasets: async function () {
    const db = await this.getDb()

    return db.getAll('datasets')
  },
  getDataset: async function (datasetId) {
    const db = await this.getDb()

    return db.get('datasets', datasetId)
  },
  getAllDatasetsWithUuid: async function () {
    const db = await this.getDb()

    return db.getAll('datasets')
      .then(ds => {
        return ds.filter(ds => ds.uuid)
      })
  },
  getDatasetData: async function (datasetId) {
    const db = await this.getDb()

    const dataset = await this.getDataset(datasetId)

    if (dataset) {
      const range = IDBKeyRange.bound([datasetId, 0, 0], [datasetId, dataset.rows, dataset.cols])
      return db.getAll('data', range)
        .then(dp => {
          if (dp) {
            dp.forEach(c => {
              let displayName = c.name

              if (c.rep) {
                displayName += '-' + c.rep
              }

              c.displayName = displayName
            })
          }

          return dp
        })
    } else {
      return new Promise(resolve => resolve([]))
    }
  },
  resetDatasetData: async function (datasetId) {
    const data = await this.getDatasetData(datasetId)

    if (data) {
      data.forEach(d => {
        d.values = d.values.map(_ => null)
        d.dates = d.dates.map(_ => null)
        d.comment = null
        d.geolocation = null
        d.isMarked = false
      })

      const db = await this.getDb()

      return new Promise(resolve => {
        const tx = db.transaction('data', 'readwrite')

        Promise.all(data.map(cell => tx.store.put(cell)))
          .then(() => {
            resolve()
            return tx.done
          })
      })
    } else {
      return new Promise(resolve => resolve())
    }
  },
  addGermplasmToSurveyDataset: async function (datasetId, germplasm) {
    const db = await this.getDb()
    const dataset = await this.getDataset(datasetId)
    const data = await this.getDatasetData(datasetId)

    let counter = dataset.rows
    germplasm.forEach(g => {
      data.push({
        dsId: datasetId,
        row: counter,
        col: 0,
        name: g,
        dates: new Array(dataset.traits.length).fill(null),
        values: new Array(dataset.traits.length).fill(null),
        geolocation: null,
        comment: null
      })

      counter++
    })

    dataset.rows = counter

    return new Promise(resolve => {
      const tx = db.transaction('data', 'readwrite')

      Promise.all(data.map(cell => tx.store.put(cell)))
        .then(() => db.put('datasets', dataset))
        .then(() => {
          resolve()
          return tx.done
        })
    })
  },
  updateTraitBrapiIds: async function (datasetId, traits) {
    const db = await this.getDb()
    const dataset = await this.getDataset(datasetId)

    dataset.traits.forEach(t => {
      const match = traits.find(ot => ot.name === t.name && ot.type === t.type && ot.mType === t.mType)

      if (match && match.brapiId) {
        t.brapiId = match.brapiId
      }
    })

    return db.put('datasets', dataset)
  },
  addTraitToDataset: async function (datasetId, trait) {
    const db = await this.getDb()
    const dataset = await this.getDataset(datasetId)
    const data = await this.getDatasetData(datasetId)

    dataset.traits.push(trait)
    data.forEach(d => {
      d.values.push(null)
      d.dates.push(null)
    })

    return new Promise(resolve => {
      const tx = db.transaction('data', 'readwrite')

      Promise.all(data.map(cell => tx.store.put(cell)))
        .then(() => db.put('datasets', dataset))
        .then(() => {
          resolve()
          return tx.done
        })
    })
  },
  updateDatasetBrapiConfig: async function (datasetId, brapiConfig) {
    const db = await this.getDb()

    const dataset = await this.getDataset(datasetId)
    dataset.brapiConfig = brapiConfig

    return db.put('datasets', dataset)
  },
  updateDatasetComment: async function (datasetId, comment) {
    const db = await this.getDb()

    const dataset = await this.getDataset(datasetId)
    dataset.comment = comment

    return db.put('datasets', dataset)
  },
  updateDatasetUuid: async function (datasetId, uuid) {
    const db = await this.getDb()

    const dataset = await this.getDataset(datasetId)
    dataset.uuid = uuid

    return db.put('datasets', dataset)
  },
  updateDatasetCornerPointsAndMarkers: async function (datasetId, newData) {
    const db = await this.getDb()

    const dataset = await this.getDataset(datasetId)
    dataset.cornerPoints = newData.cornerPoints
    dataset.markers = newData.markers

    return db.put('datasets', dataset)
  },
  updateDatasetAndData: async function (update) {
    const db = await this.getDb()

    await this.deleteDatasetData(update.id)
    await this.setDatasetData(update.id, update.data)

    return db.put('datasets', update)
  },
  addDataset: async function (dataset) {
    const db = await this.getDb()

    // Add to the database
    return db.add('datasets', {
      rows: dataset.rows,
      cols: dataset.cols,
      name: dataset.name || 'newDataset',
      traits: dataset.traits,
      cornerPoints: dataset.cornerPoints,
      brapiConfig: dataset.brapiConfig,
      uuid: dataset.uuid,
      markers: dataset.markers,
      lastUpdatedOn: new Date().toISOString(),
      datasetType: dataset.datasetType || 'TRIAL',
      comment: dataset.comment
    })
  },
  deleteDataset: async function (datasetId) {
    const db = await this.getDb()

    return db.delete('datasets', datasetId)
  },
  deleteDatasetData: async function (datasetId) {
    const db = await this.getDb()

    const dataset = await this.getDataset(datasetId)

    const range = IDBKeyRange.bound([datasetId, 0, 0], [datasetId, dataset.rows, dataset.cols])
    return db.delete('data', range)
  },
  updateDatapoint: async function (datasetId, dataPoint) {
    const db = await this.getDb()

    const dataset = await this.getDataset(datasetId)
    dataset.lastUpdatedOn = new Date().toISOString()
    await db.put('datasets', dataset)

    const copy = JSON.parse(JSON.stringify(dataPoint))
    copy.dsId = datasetId

    const oldDataPoint = await this.getDatapoint(copy)

    if (!copy.geolocation && oldDataPoint.geolocation) {
      copy.geolocation = oldDataPoint.geolocation
    }

    return db.put('data', copy)
  },
  getDatapoint: async function (dataPoint) {
    const db = await this.getDb()

    return db.get('data', [dataPoint.dsId, dataPoint.row, dataPoint.col])
  },
  deleteDatabase: async function () {
    await deleteDB('gridscore-' + window.location.pathname)
  },
  overwriteDatasetData: async function (datasetId, data) {
    await this.deleteDatasetData(datasetId)
    return this.setDatasetData(datasetId, data)
  },
  setDatasetData: async function (datasetId, data) {
    const db = await this.getDb()

    return new Promise(resolve => {
      const tx = db.transaction('data', 'readwrite')

      const allData = []

      for (let y = 0; y < data.length; y++) {
        for (let x = 0; x < data[y].length; x++) {
          const d = data[y][x]
          allData.push({
            dsId: datasetId,
            row: y,
            col: x,
            name: d.name,
            brapiId: d.brapiId,
            rep: d.rep,
            dates: d.dates,
            values: d.values,
            geolocation: d.geolocation,
            comment: d.comment,
            isMarked: d.isMarked
          })
        }
      }

      Promise.all(allData.map(cell => tx.store.add(cell)))
        .then(() => {
          resolve()
          return tx.done
        })
    })
  }
}
