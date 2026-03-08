import mock from './mockStore'

export const seriesApi = {
  getAll:  ()         => Promise.resolve(mock.listSeries()),
  getById: (id)       => Promise.resolve(mock.listSeries().find(s => s.id === id)),
  create:  (body)     => Promise.resolve(mock.createSeries(body)),
  update:  (id, body) => Promise.resolve(mock.updateSeries(id, body)),
  delete:  (id)       => Promise.resolve(mock.deleteSeries(id)),
  clone:   (id)       => Promise.resolve(mock.cloneSeries(id)),
}
