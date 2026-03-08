import mock from './mockStore'

export const webinarsApi = {
  getAll:       (params)       => Promise.resolve(mock.listWebinars(params?.series_id)),
  getBySeries:  (seriesId)     => Promise.resolve(mock.listWebinars(seriesId)),
  getById:      (id)           => Promise.resolve(mock.getWebinar(id)),
  create:       (body)         => Promise.resolve(mock.createWebinar(body)),
  update:       (id, body)     => Promise.resolve(mock.updateWebinar(id, body)),
  delete:       (id)           => Promise.resolve(mock.deleteWebinar(id)),
  getUpcoming:  (id, limit=10) => Promise.resolve(mock.getUpcoming(id, limit)),
  getAnalytics: (id)           => Promise.resolve(mock.getAnalytics(id)),
}
