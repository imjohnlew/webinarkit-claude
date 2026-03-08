import mock from './mockStore'

export const notificationsApi = {
  getAll:  (webinarId)             => Promise.resolve(mock.listNotifications(webinarId)),
  upsert:  (webinarId, type, body) => Promise.resolve(mock.upsertNotification(webinarId, type, body)),
}
