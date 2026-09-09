import { defineStore } from 'pinia'

// Khmer digits lookup
const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']

// Khmer days and months
const KHMER_DAYS = [
  'អាទិត្យ',
  'ចន្ទ',
  'អង្គារ',
  'ពុធ',
  'ព្រហស្បតិ៍',
  'សុក្រ',
  'សៅរ៍',
]

const KHMER_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
]

export const toKhmerNumber = (num, minDigits = 0) => {
  if (num === null || num === undefined) return ''
  let str = num.toString()
  if (minDigits > 0) {
    str = str.padStart(minDigits, '0')
  }
  return str
    .split('')
    .map(ch => {
      const parsed = parseInt(ch, 10)
      return isNaN(parsed) ? ch : KHMER_DIGITS[parsed]
    })
    .join('')
}

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: [],
    loading: false,
    error: null,
    lastUpdated: null,
    currentTime: new Date(),
    autoRefreshTimer: null,
    clockTimer: null,
    autoRefreshIntervalSeconds: 30,
    isLive: true,
  }),

  getters: {
    // Current time formatted in Khmer numerals
    khmerTimeFormatted: (state) => {
      const date = state.currentTime
      let hours = date.getHours()
      const minutes = date.getMinutes()
      const seconds = date.getSeconds()
      const period = hours >= 12 ? 'រសៀល' : 'ព្រឹក'

      hours = hours % 12
      hours = hours ? hours : 12 // 0 becomes 12

      return `${toKhmerNumber(hours, 2)}:${toKhmerNumber(minutes, 2)}:${toKhmerNumber(seconds, 2)} ${period}`
    },

    // Current date formatted in formal Khmer solar calendar
    khmerDateFormatted: (state) => {
      const date = state.currentTime
      const dayName = KHMER_DAYS[date.getDay()]
      const dayOfMonth = toKhmerNumber(date.getDate(), 2)
      const monthName = KHMER_MONTHS[date.getMonth()]
      const yearKhmer = toKhmerNumber(date.getFullYear())

      return `ថ្ងៃ${dayName} ទី${dayOfMonth} ខែ${monthName} ឆ្នាំ${yearKhmer}`
    },

    // Khmer Buddhist Era / Lunar reference
    khmerLunarFormatted: (state) => {
      const date = state.currentTime
      const buddhistYear = toKhmerNumber(date.getFullYear() + 544)
      return `ត្រូវនឹងថ្ងៃទី ១១រោច ខែស្រាពណ៍ ឆ្នាំម្សាញ់ អដ្ឋស័ក ព.ស. ${buddhistYear}`
    },

    // Last updated formatted in Khmer
    lastUpdatedKhmer: (state) => {
      if (!state.lastUpdated) return ''
      const date = state.lastUpdated
      let hours = date.getHours()
      const minutes = date.getMinutes()
      const period = hours >= 12 ? 'រសៀល' : 'ព្រឹក'
      hours = hours % 12
      hours = hours ? hours : 12
      return `${toKhmerNumber(hours, 2)}:${toKhmerNumber(minutes, 2)} ${period}`
    },

    // Count of currently active ongoing meetings
    ongoingMeetingCount: (state) => {
      return state.schedules.filter(item => {
        return state.calculateMeetingStatus(item).code === 'ongoing'
      }).length
    },

    // Helper getter to calculate meeting status
    calculateMeetingStatus: (state) => (item) => {
      // Check if meeting is postponed
      if (item.is_postpone == 1 || item.is_postpone === true || item.is_postpone === '1') {
        return {
          code: 'postponed',
          text: 'លើកពេលប្រជុំ',
          type: 'postponed',
        }
      }

      if (!item.schedule_date || !item.schedule_time) {
        return {
          code: 'upcoming',
          text: 'មិនទាន់ប្រជុំ',
          type: 'warning',
        }
      }

      try {
        const now = state.currentTime
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

        // Parse start time
        const [startH, startM, startS = 0] = item.schedule_time.split(':').map(Number)
        const startTime = new Date(`${item.schedule_date}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:${String(startS).padStart(2, '0')}`)

        // Parse end time
        let endTime
        if (item.end_time) {
          let [endH, endM, endS = 0] = item.end_time.split(':').map(Number)
          // Handle cases where end time is e.g. "00:08:00" representing 12:08 or midnight
          if (endH < startH && startH >= 10 && endH <= 2) {
            endH += 12
          }
          endTime = new Date(`${item.schedule_date}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:${String(endS).padStart(2, '0')}`)
        } else {
          // Default 1 hour duration
          endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
        }

        // Check if meeting is for today
        const isToday = item.schedule_date === todayStr

        if (!isToday) {
          const itemDate = new Date(item.schedule_date)
          if (itemDate < new Date(todayStr)) {
            return { code: 'completed', text: 'ប្រជុំរួច', type: 'completed' }
          } else {
            return { code: 'upcoming', text: 'មិនទាន់ប្រជុំ', type: 'upcoming' }
          }
        }

        // Compare with current time
        const nowTime = now.getTime()
        const startMillis = startTime.getTime()
        const endMillis = endTime.getTime()

        if (nowTime >= startMillis && nowTime <= endMillis) {
          return { code: 'ongoing', text: 'កំពុងប្រជុំ', type: 'ongoing' }
        } else if (nowTime > endMillis) {
          return { code: 'completed', text: 'ប្រជុំរួច', type: 'completed' }
        } else {
          return { code: 'upcoming', text: 'មិនទាន់ប្រជុំ', type: 'upcoming' }
        }
      } catch {
        return { code: 'upcoming', text: 'មិនទាន់ប្រជុំ', type: 'upcoming' }
      }
    },
  },

  actions: {
    // Format 24h time string (HH:MM:SS) to standard 12-hour AM/PM format
    formatTimeRange(startTime, endTime) {
      const formatSingle = (timeStr) => {
        if (!timeStr) return ''
        const parts = timeStr.split(':').map(Number)
        let h = parts[0]
        const m = parts[1] !== undefined ? String(parts[1]).padStart(2, '0') : '00'
        const isPM = h >= 12
        let displayH = h % 12
        if (displayH === 0) displayH = 12
        const ampm = isPM ? 'PM' : 'AM'
        return `${String(displayH).padStart(2, '0')}:${m} ${ampm}`
      }

      const startFormatted = formatSingle(startTime)
      const endFormatted = formatSingle(endTime)

      if (startFormatted && endFormatted) {
        return `${startFormatted} - ${endFormatted}`
      }
      return startFormatted || endFormatted || ''
    },

    // Format YYYY-MM-DD to DD-MM-YYYY
    formatScheduleDate(dateStr) {
      if (!dateStr) return ''
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`
      }
      return dateStr
    },

    // Fetch schedules from backend API with fallbacks
    async fetchSchedules() {
      this.loading = true
      this.error = null

      const candidateUrls = [
        import.meta.env?.VITE_API_URL
      ].filter(Boolean)

      let success = false
      for (const url of candidateUrls) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 6000)

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            if (data && Array.isArray(data.data)) {
              this.schedules = data.data
            } else if (Array.isArray(data)) {
              this.schedules = data
            }
            this.lastUpdated = new Date()
            this.isLive = true
            success = true
            break
          }
        } catch (err) {
          // Continue to next fallback
          console.warn(`Fetch from ${url} failed:`, err?.message || err)
        }
      }

      if (!success) {
        this.error = 'មិនអាចទាញយកទិន្នន័យពីម៉ាស៊ីនបម្រើបានទេ (កំពុងប្រើទិន្នន័យបម្រុង)'
        this.isLive = false
        // Keep existing schedules or initialize fallback if empty
        if (this.schedules.length === 0) {
          this.schedules = this.getFallbackData()
        }
      }

      this.loading = false
    },

    // Start live clock ticking every second
    initClock() {
      if (this.clockTimer) clearInterval(this.clockTimer)
      this.currentTime = new Date()
      this.clockTimer = setInterval(() => {
        this.currentTime = new Date()
      }, 1000)
    },

    // Start auto-refreshing schedules
    initAutoRefresh() {
      if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer)
      this.fetchSchedules()
      this.autoRefreshTimer = setInterval(() => {
        this.fetchSchedules()
      }, this.autoRefreshIntervalSeconds * 1000)
    },

    cleanup() {
      if (this.clockTimer) clearInterval(this.clockTimer)
      if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer)
    },

    // Built-in fallback data matching SERC schema
    getFallbackData() {
      return []
    },
  },
})
