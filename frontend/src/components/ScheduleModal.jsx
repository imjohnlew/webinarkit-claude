import { useState } from 'react'
import { Clock, Search } from 'lucide-react'
import { Modal, ModalBody, ModalFooter } from './ui/Modal'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { Input } from './ui/Input'
import { clsx } from 'clsx'

const DAYS = ['Every day', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris / Berlin (CET)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Karachi', label: 'Pakistan (PKT)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dhaka', label: 'Bangladesh (BST)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
  { value: 'America/Sao_Paulo', label: 'Sao Paulo (BRT)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
  { value: 'UTC', label: 'UTC' },
]

// Generate time options in 15-min intervals
function generateTimeOptions() {
  const options = []
  for (let h = 1; h <= 12; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = h.toString().padStart(2, '0')
      const minute = m.toString().padStart(2, '0')
      options.push({ value: `${hour}:${minute}`, label: `${hour}:${minute}` })
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

export function ScheduleModal({ isOpen, onClose, onSave, initial }) {
  const [type, setType] = useState(initial?.type || 'ongoing')
  const [day, setDay] = useState(initial?.day || 'Every day')
  const [specificDate, setSpecificDate] = useState(initial?.specificDate || '')
  const [time, setTime] = useState(initial?.time || '09:00')
  const [ampm, setAmpm] = useState(initial?.ampm || 'AM')
  const [timezone, setTimezone] = useState(initial?.timezone || 'America/New_York')
  const [tzSearch, setTzSearch] = useState('')

  const filteredTimezones = tzSearch
    ? TIMEZONES.filter(
        (tz) =>
          tz.label.toLowerCase().includes(tzSearch.toLowerCase()) ||
          tz.value.toLowerCase().includes(tzSearch.toLowerCase())
      )
    : TIMEZONES

  const handleSave = () => {
    const schedule = {
      type,
      day: type === 'ongoing' ? day : null,
      specificDate: type === 'specific' ? specificDate : null,
      time,
      ampm,
      timezone,
    }
    onSave(schedule)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Schedule" description="Configure when this webinar runs" size="md">
      <ModalBody className="space-y-5">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Schedule Type</label>
          <div className="grid grid-cols-2 gap-2">
            {['ongoing', 'specific'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={clsx(
                  'flex flex-col items-start px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-150',
                  type === t
                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span className="font-semibold capitalize">{t === 'ongoing' ? 'Ongoing' : 'Specific Date'}</span>
                <span className="text-xs mt-0.5 opacity-70">
                  {t === 'ongoing' ? 'Repeats on a schedule' : 'One-time specific date'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Day / Date */}
        {type === 'ongoing' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Day</label>
            <div className="grid grid-cols-4 gap-1.5">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDay(d)}
                  className={clsx(
                    'px-2 py-1.5 rounded-lg text-xs font-medium text-center transition-all duration-150',
                    day === d
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {d === 'Every day' ? 'Every day' : d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Input
            label="Date"
            type="date"
            value={specificDate}
            onChange={(e) => setSpecificDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        )}

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                options={TIME_OPTIONS}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="w-24">
              <Select
                options={[
                  { value: 'AM', label: 'AM' },
                  { value: 'PM', label: 'PM' },
                ]}
                value={ampm}
                onChange={(e) => setAmpm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={tzSearch}
                onChange={(e) => setTzSearch(e.target.value)}
                placeholder="Search timezone..."
                className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="h-40 overflow-y-auto border border-slate-200 rounded-lg">
              {filteredTimezones.map((tz) => (
                <button
                  key={tz.value}
                  type="button"
                  onClick={() => setTimezone(tz.value)}
                  className={clsx(
                    'w-full text-left px-3 py-2 text-sm transition-colors',
                    timezone === tz.value
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {tz.label}
                </button>
              ))}
              {filteredTimezones.length === 0 && (
                <p className="px-3 py-4 text-sm text-slate-400 text-center">No timezones found</p>
              )}
            </div>
          </div>
        </div>

        {/* Summary preview */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-lg">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-sm text-slate-600">
            {type === 'ongoing' ? (
              <>Runs every <strong>{day}</strong> at <strong>{time} {ampm}</strong> ({TIMEZONES.find(t => t.value === timezone)?.label || timezone})</>
            ) : (
              <>Runs on <strong>{specificDate || '(no date set)'}</strong> at <strong>{time} {ampm}</strong> ({TIMEZONES.find(t => t.value === timezone)?.label || timezone})</>
            )}
          </p>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={type === 'specific' && !specificDate}
        >
          Add Schedule
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ScheduleModal
