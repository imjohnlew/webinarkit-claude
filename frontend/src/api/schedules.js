import mock from './mockStore'

export const schedulesApi = {
  getByWebinar: (webinarId)                   => Promise.resolve(mock.listSchedules(webinarId)),
  create:       (webinarId, body)             => Promise.resolve(mock.createSchedule(webinarId, body)),
  update:       (webinarId, scheduleId, body) => Promise.resolve(mock.updateSchedule(webinarId, scheduleId, body)),
  delete:       (webinarId, scheduleId)       => Promise.resolve(mock.deleteSchedule(webinarId, scheduleId)),

  // Blockout dates
  getBlockouts:   (webinarId)            => Promise.resolve(mock.listBlockouts(webinarId)),
  addBlockout:    (webinarId, date)      => Promise.resolve(mock.addBlockout(webinarId, date)),
  deleteBlockout: (webinarId, id)        => Promise.resolve(mock.deleteBlockout(webinarId, id)),

  // Toggles
  setInstantWatch: (webinarId, enabled)          => Promise.resolve(mock.setInstantWatch(webinarId, enabled)),
  setJustInTime:   (webinarId, enabled, minutes) => Promise.resolve(mock.setJustInTime(webinarId, enabled, minutes)),
}
