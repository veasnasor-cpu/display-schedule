<template>
  <div class="serc-display-page">
    <!-- Header Section -->
    <header class="serc-header">
      <div class="header-content">
        <!-- Brand & Seal -->
        <div class="brand-section">
          <div class="brand-logo-container">
            <img :src="logoUrl" alt="និយ័តករមូលបត្រកម្ពុជា" class="brand-logo" />
          </div>
          <div class="brand-text">
            <h1 class="brand-title font-moul">
              និយ័តករមូលបត្រកម្ពុជា
            </h1>
            <p class="brand-subtitle">
              Securities and Exchange Regulator of Cambodia
            </p>
          </div>
        </div>

        <!-- Center Title and Real-time Badge -->
        <div class="center-section">
          <div class="title-wrapper">
            <h2 class="main-title font-moul kbach-icon">
              កាលវិភាគប្រជុំរួម
            </h2>
          </div>

          <div class="badges-row">
            <!-- Pulsing Live Indicator -->
            <div class="live-badge">
              <span class="pulse-dot"></span>
              <span>ការផ្សាយផ្ទាល់កាលវិភាគ</span>
            </div>

            <!-- Active meeting highlight badge if any -->
            <div v-if="ongoingMeetingCount > 0" class="active-count-badge">
              <span class="active-dot"></span>
              <span>កំពុងប្រជុំ៖ {{ toKhmer(ongoingMeetingCount) }}</span>
            </div>
          </div>
        </div>

        <!-- Digital Clock & Date Display -->
        <div class="clock-section">
          <div class="clock-display">
            <v-icon icon="mdi-clock-outline" size="20" class="clock-icon" />
            <span class="clock-time">{{ khmerTimeFormatted }}</span>
          </div>

          <div class="date-display">
            <v-icon icon="mdi-calendar-today" size="16" class="calendar-icon" />
            <span>{{ khmerDateFormatted }}</span>
          </div>

          <div class="lunar-display">
            <span class="lunar-tag">ចន្ទគតិ</span>
            <span>{{ khmerLunarFormatted }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Action Bar (Filter & Controls) -->
      <div class="control-bar">
        <div class="filter-chips">
          <button
            class="filter-btn"
            :class="{ active: selectedFilter === 'all' }"
            @click="selectedFilter = 'all'"
          >
            ទាំងអស់ ({{ toKhmer(schedules.length) }})
          </button>
          <button
            class="filter-btn"
            :class="{ active: selectedFilter === 'ongoing' }"
            @click="selectedFilter = 'ongoing'"
          >
            <span class="status-indicator indicator-ongoing"></span>
            កំពុងប្រជុំ ({{ toKhmer(ongoingCount) }})
          </button>
          <button
            class="filter-btn"
            :class="{ active: selectedFilter === 'morning' }"
            @click="selectedFilter = 'morning'"
          >
            វេនព្រឹក ({{ toKhmer(morningCount) }})
          </button>
          <button
            class="filter-btn"
            :class="{ active: selectedFilter === 'afternoon' }"
            @click="selectedFilter = 'afternoon'"
          >
            វេនរសៀល ({{ toKhmer(afternoonCount) }})
          </button>
          <button
            class="filter-btn"
            :class="{ active: selectedFilter === 'upcoming' }"
            @click="selectedFilter = 'upcoming'"
          >
            មិនទាន់ប្រជុំ ({{ toKhmer(upcomingCount) }})
          </button>
          <button
            v-if="postponedCount > 0"
            class="filter-btn"
            :class="{ active: selectedFilter === 'postponed' }"
            @click="selectedFilter = 'postponed'"
          >
            <span class="status-indicator indicator-postponed"></span>
            លើកពេល ({{ toKhmer(postponedCount) }})
          </button>
        </div>

        <div class="action-buttons">
          <button
            class="action-icon-btn"
            title="ទាញយកទិន្នន័យឡើងវិញ (Refresh)"
            :disabled="loading"
            @click="refreshData"
          >
            <v-icon
              icon="mdi-refresh"
              size="18"
              :class="{ 'spin-animation': loading }"
            />
          </button>
          <button
            class="action-icon-btn"
            title="ពង្រីកពេញអេក្រង់ (Fullscreen)"
            @click="toggleFullscreen"
          >
            <v-icon
              :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
              size="18"
            />
          </button>
        </div>
      </div>
    </header>

    <!-- Error notice if offline -->
    <div v-if="error && !isLive" class="notice-banner">
      <v-icon icon="mdi-cloud-off-outline" size="18" class="mr-2" />
      <span>{{ error }}</span>
    </div>

    <!-- Main Schedule Table Container -->
    <main class="serc-main-container">
      <div class="table-responsive">
        <table class="serc-schedule-table">
          <thead>
            <tr>
              <th class="col-datetime text-center">
                <span class="header-th-content">❖ កាលបរិច្ឆេទ</span>
              </th>
              <th class="col-title text-left">
                <span class="header-th-content">❖ ខ្លឹមសារ</span>
              </th>
              <th class="col-leader text-center">
                <span class="header-th-content">❖ ដឹកនាំដោយ</span>
              </th>
              <th class="col-room text-center">
                <span class="header-th-content">❖ បន្ទប់</span>
              </th>
              <th class="col-location text-center">
                <span class="header-th-content">❖ ទីតាំង</span>
              </th>
              <th class="col-status text-center">
                <span class="header-th-content">❖ ស្ថានភាព</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading Skeleton rows -->
            <template v-if="loading && schedules.length === 0">
              <tr v-for="n in 5" :key="'skeleton-' + n" class="skeleton-row">
                <td colspan="6" class="text-center py-6">
                  <div class="loading-placeholder">
                    <v-progress-circular indeterminate color="primary" size="24" class="mr-3" />
                    <span>កំពុងទាញយកកាលវិភាគប្រជុំ...</span>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else-if="filteredSchedules.length === 0">
              <td colspan="6" class="text-center py-12 empty-state-cell">
                <v-icon icon="mdi-calendar-blank-outline" size="48" class="text-slate-500 mb-2" />
                <div class="text-base text-slate-300">ពុំមានកាលវិភាគប្រជុំនៅក្នុងប្រភេទនេះទេ</div>
              </td>
            </tr>

            <!-- Actual Schedule Rows -->
            <tr
              v-for="item in filteredSchedules"
              :key="item.id"
              :class="[
                getStatus(item).code === 'ongoing' ? 'row-active' : getStatus(item).code === 'postponed' ? 'row-postponed' : 'row-default',
                'schedule-row'
              ]"
            >
              <!-- 1. DateTime Badge -->
              <td class="col-datetime text-center">
                <div
                  class="datetime-card"
                  :class="{ 'card-active-neon': getStatus(item).code === 'ongoing' }"
                >
                  <!-- Time Range -->
                  <div class="time-range-text">
                    <v-icon
                      icon="mdi-clock-time-four-outline"
                      size="14"
                      :class="getStatus(item).code === 'ongoing' ? 'text-rose-400' : 'text-slate-400'"
                    />
                    <span>{{ formatTimeRange(item.schedule_time, item.end_time) }}</span>
                  </div>

                  <!-- Shift & Date Row -->
                  <div class="datetime-sub">
                    <span
                      class="shift-badge"
                      :class="getShiftBadgeClass(item.shiff_session, getStatus(item).code)"
                    >
                      {{ item.shiff_session === 1 ? 'វេន ព្រឹក' : 'វេន រសៀល' }}
                    </span>
                    <span class="date-text">
                      <v-icon icon="mdi-calendar-range" size="12" class="mr-1 text-slate-400" />
                      {{ formatScheduleDate(item.schedule_date) }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- 2. Meeting Title / Topic -->
              <td class="col-title">
                <div
                  class="meeting-title"
                  :class="{
                    'title-ongoing': getStatus(item).code === 'ongoing',
                    'title-postponed': getStatus(item).code === 'postponed'
                  }"
                >
                  <span v-if="getStatus(item).code === 'postponed'" class="postpone-tag">លើកពេល</span>
                  <span>{{ item.title }}</span>
                </div>
              </td>

              <!-- 3. Leader / Chaired by -->
              <td class="col-leader text-center">
                <div
                  class="leader-name font-bold"
                  :class="{ 'leader-ongoing': getStatus(item).code === 'ongoing' }"
                >
                  {{ item.leader_by || 'មិនបានបញ្ជាក់' }}
                </div>
              </td>

              <!-- 4. Room -->
              <td class="col-room text-center">
                <span
                  class="info-pill"
                  :class="{ 'pill-active': getStatus(item).code === 'ongoing' }"
                >
                  <v-icon icon="mdi-door-open" size="15" class="pill-icon" style="color: #FFD200;" />
                  <span>{{ item.room || (item.get_room && item.get_room.name) || '-' }}</span>
                </span>
              </td>

              <!-- 5. Location -->
              <td class="col-location text-center">
                <span
                  class="info-pill"
                  :class="{ 'pill-active': getStatus(item).code === 'ongoing' }"
                >
                  <v-icon icon="mdi-map-marker" size="15" class="pill-icon" style="color: #8c8eff;" />
                  <span>{{ item.location || '-' }}</span>
                </span>
              </td>

              <!-- 6. Status Pill -->
              <td class="col-status text-center">
                <!-- Postponed Status Pill -->
                <span
                  v-if="getStatus(item).code === 'postponed'"
                  class="status-pill status-postponed"
                >
                  <v-icon icon="mdi-calendar-clock" size="14" class="mr-1 text-orange-300" />
                  <span>{{ getStatus(item).text }}</span>
                </span>

                <!-- Ongoing Status Pill -->
                <span
                  v-else-if="getStatus(item).code === 'ongoing'"
                  class="status-pill status-ongoing shimmer-badge"
                >
                  <span class="live-white-dot"></span>
                  <span>{{ getStatus(item).text }}</span>
                </span>

                <!-- Completed Status Pill -->
                <span
                  v-else-if="getStatus(item).code === 'completed'"
                  class="status-pill status-completed"
                >
                  <v-icon icon="mdi-check" size="14" class="mr-1 text-slate-400" />
                  <span>{{ getStatus(item).text }}</span>
                </span>

                <!-- Upcoming Status Pill -->
                <span
                  v-else
                  class="status-pill status-upcoming"
                >
                  <v-icon icon="mdi-clock-outline" size="14" class="mr-1 text-amber-400" />
                  <span>{{ getStatus(item).text }}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Footer Section -->
    <footer class="serc-footer">
      <div class="footer-left">
        <span class="pulse-dot mr-2"></span>
        <span>ប្រព័ន្ធតភ្ជាប់ទិន្នន័យស្វ័យប្រវត្តិពី SERC Central Gateway</span>
      </div>

      <div class="footer-center">
        <span>កិច្ចប្រជុំសរុប៖ {{ toKhmer(schedules.length) }}</span>
        <span class="divider-dot">•</span>
        <span>កំពុងប្រជុំ៖ {{ toKhmer(ongoingCount) }}</span>
        <span class="divider-dot">•</span>
        <span>មិនទាន់ប្រជុំ៖ {{ toKhmer(upcomingCount) }}</span>
        <template v-if="postponedCount > 0">
          <span class="divider-dot">•</span>
          <span class="text-orange-300 font-semibold">លើកពេល៖ {{ toKhmer(postponedCount) }}</span>
        </template>
      </div>

      <div class="footer-right">
        <span>ទំព័រ ១/១</span>
        <span class="divider-dot">•</span>
        <span>បច្ចុប្បន្នភាពចុងក្រោយ៖ {{ lastUpdatedKhmer || khmerTimeFormatted }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import logoUrl from '@/assets/logo.png'
  import { toKhmerNumber, useScheduleStore } from '@/stores/schedule'

  const scheduleStore = useScheduleStore()

  // Reactive properties from store
  const schedules = computed(() => scheduleStore.schedules)
  const loading = computed(() => scheduleStore.loading)
  const error = computed(() => scheduleStore.error)
  const isLive = computed(() => scheduleStore.isLive)
  const khmerTimeFormatted = computed(() => scheduleStore.khmerTimeFormatted)
  const khmerDateFormatted = computed(() => scheduleStore.khmerDateFormatted)
  const khmerLunarFormatted = computed(() => scheduleStore.khmerLunarFormatted)
  const lastUpdatedKhmer = computed(() => scheduleStore.lastUpdatedKhmer)
  const ongoingMeetingCount = computed(() => scheduleStore.ongoingMeetingCount)

  // Filter state
  const selectedFilter = ref('all')
  const isFullscreen = ref(false)

  // Status helper
  const getStatus = (item) => scheduleStore.calculateMeetingStatus(item)
  const formatTimeRange = (start, end) => scheduleStore.formatTimeRange(start, end)
  const formatScheduleDate = (date) => scheduleStore.formatScheduleDate(date)
  const toKhmer = (num) => toKhmerNumber(num)

  // Filtered schedules
  const filteredSchedules = computed(() => {
    if (selectedFilter.value === 'all') return schedules.value
    if (selectedFilter.value === 'ongoing') {
      return schedules.value.filter(item => getStatus(item).code === 'ongoing')
    }
    if (selectedFilter.value === 'morning') {
      return schedules.value.filter(item => item.shiff_session === 1)
    }
    if (selectedFilter.value === 'afternoon') {
      return schedules.value.filter(item => item.shiff_session === 2)
    }
    if (selectedFilter.value === 'upcoming') {
      return schedules.value.filter(item => getStatus(item).code === 'upcoming')
    }
    if (selectedFilter.value === 'postponed') {
      return schedules.value.filter(item => getStatus(item).code === 'postponed')
    }
    return schedules.value
  })

  // Counters
  const ongoingCount = computed(() => {
    return schedules.value.filter(item => getStatus(item).code === 'ongoing').length
  })

  const upcomingCount = computed(() => {
    return schedules.value.filter(item => getStatus(item).code === 'upcoming').length
  })

  const postponedCount = computed(() => {
    return schedules.value.filter(item => getStatus(item).code === 'postponed').length
  })

  const morningCount = computed(() => {
    return schedules.value.filter(item => item.shiff_session === 1).length
  })

  const afternoonCount = computed(() => {
    return schedules.value.filter(item => item.shiff_session === 2).length
  })

  // Badge class helper
  const getShiftBadgeClass = (session, statusCode) => {
    if (statusCode === 'ongoing') {
      return 'badge-shift-active'
    }
    if (statusCode === 'postponed') {
      return 'badge-shift-postponed'
    }
    return session === 1 ? 'badge-shift-morning' : 'badge-shift-afternoon'
  }

  // Refresh
  const refreshData = () => {
    scheduleStore.fetchSchedules()
  }

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        isFullscreen.value = true
      }).catch(err => console.error(err))
    } else {
      document.exitFullscreen().then(() => {
        isFullscreen.value = false
      }).catch(err => console.error(err))
    }
  }

  // Fullscreen change listener
  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement
  }

  onMounted(() => {
    scheduleStore.initClock()
    scheduleStore.initAutoRefresh()
    document.addEventListener('fullscreenchange', handleFullscreenChange)
  })

  onBeforeUnmount(() => {
    scheduleStore.cleanup()
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  })
</script>

<style scoped>
.serc-display-page {
  padding: 1.25rem 1.75rem;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-sizing: border-box;
}

/* Header - SERC Royal Blue & Gold Palette */
.serc-header {
  background: rgba(20, 23, 76, 0.92);
  border: 1.5px solid rgba(47, 49, 145, 0.75);
  border-radius: 1.25rem;
  padding: 1.25rem 1.75rem 0.85rem;
  box-shadow: 0 16px 36px -8px rgba(8, 9, 36, 0.8), inset 0 1px 0 rgba(255, 210, 0, 0.2);
  backdrop-filter: blur(14px);
  margin-bottom: 1.25rem;
}

.header-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

/* Brand */
.brand-section {
  display: flex;
  align-items: center;
  gap: 1.15rem;
  flex: 1;
}

.brand-logo-container {
  width: 76px;
  height: 76px;
  min-width: 76px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  padding: 5px;
  border: 2px solid #FFD200;
  box-shadow: 0 0 20px rgba(255, 210, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.brand-logo-container:hover {
  transform: scale(1.06);
  box-shadow: 0 0 24px rgba(255, 210, 0, 0.65);
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.4rem;
  color: #ffffff;
  letter-spacing: 0.02em;
  line-height: 1.25;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.brand-subtitle {
  font-size: 0.82rem;
  color: #c2c5ec;
  margin-top: 0.25rem;
  font-weight: 500;
  letter-spacing: 0.03em;
}

/* Center - SERC Gold Title & Green Live Badge */
.center-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1.2;
}

.main-title {
  font-size: 2.15rem;
  color: #FFD200;
  letter-spacing: 0.06em;
  font-weight: 400;
  margin: 0;
  text-shadow: 0 2px 14px rgba(255, 210, 0, 0.5), 0 0 2px rgba(255, 210, 0, 0.8);
}

.badges-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.65rem;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.38rem 1rem;
  border-radius: 9999px;
  background: rgba(0, 166, 81, 0.16);
  border: 1.5px solid rgba(0, 166, 81, 0.65);
  color: #00e676;
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: 0 0 16px rgba(0, 166, 81, 0.3);
}

.active-count-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.38rem 0.95rem;
  border-radius: 9999px;
  background: rgba(225, 29, 72, 0.28);
  border: 1.5px solid rgba(244, 63, 94, 0.7);
  color: #ffe4e6;
  font-size: 0.82rem;
  font-weight: 700;
  box-shadow: 0 0 14px rgba(225, 29, 72, 0.45);
  animation: pulse-badge 2s infinite ease-in-out;
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.active-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f43f5e;
  box-shadow: 0 0 8px #f43f5e;
}

/* Clock & Date Widget */
.clock-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  flex: 1;
  text-align: right;
}

.clock-display {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  background: rgba(14, 16, 56, 0.95);
  border: 1.5px solid rgba(47, 49, 145, 0.85);
  padding: 0.45rem 1.15rem;
  border-radius: 0.85rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 12px rgba(47, 49, 145, 0.3);
  margin-bottom: 0.35rem;
}

.clock-icon {
  color: #FFD200;
}

.clock-time {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.date-display {
  font-size: 0.9rem;
  font-weight: 500;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.calendar-icon {
  color: #FFD200;
}

.lunar-display {
  font-size: 0.9rem;
  color: #c4c7ee;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.lunar-tag {
  background: rgba(255, 210, 0, 0.2);
  color: #FFE266;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.12rem 0.45rem;
  border-radius: 0.3rem;
  border: 1px solid rgba(255, 210, 0, 0.45);
}

/* Controls / Filter Bar */
.control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.15rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba(47, 49, 145, 0.6);
}

.filter-chips {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.filter-btn {
  background: rgba(22, 25, 82, 0.75);
  border: 1px solid rgba(47, 49, 145, 0.75);
  color: #c4c7ee;
  font-size: 0.82rem;
  font-weight: 500;
  padding: 0.32rem 0.95rem;
  border-radius: 0.55rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: rgba(47, 49, 145, 0.55);
  color: #ffffff;
  border-color: rgba(255, 210, 0, 0.4);
}

.filter-btn.active {
  background: #2F3191;
  color: #FFD200;
  border-color: #FFD200;
  box-shadow: 0 0 14px rgba(255, 210, 0, 0.35);
  font-weight: 600;
}

.status-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.indicator-ongoing {
  background-color: #f43f5e;
}

.indicator-postponed {
  background-color: #f97316;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-icon-btn {
  background: rgba(22, 25, 82, 0.85);
  border: 1px solid rgba(47, 49, 145, 0.85);
  color: #c4c7ee;
  width: 36px;
  height: 36px;
  border-radius: 0.55rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-icon-btn:hover:not(:disabled) {
  background: #2F3191;
  color: #FFD200;
  border-color: #FFD200;
}

.spin-animation {
  animation: spin 1s infinite linear;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Offline Notice */
.notice-banner {
  background: rgba(239, 68, 68, 0.18);
  border: 1px solid rgba(239, 68, 68, 0.45);
  color: #fca5a5;
  border-radius: 0.75rem;
  padding: 0.65rem 1.1rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

/* Main Table Container */
.serc-main-container {
  flex: 1;
  background: rgba(16, 18, 62, 0.96);
  border: 1.5px solid rgba(47, 49, 145, 0.75);
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: 0 20px 42px -10px rgba(7, 8, 30, 0.85), inset 0 1px 0 rgba(255, 210, 0, 0.2);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
}

.table-responsive {
  overflow-x: auto;
  width: 100%;
  height: 100%;
}

.header-th-content {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.95rem;
}

/* Column widths */
.col-datetime { width: 17%; }
.col-title { width: 34%; }
.col-leader { width: 16%; }
.col-room { width: 12%; }
.col-location { width: 11%; }
.col-status { width: 10%; }

/* Datetime card */
.datetime-card {
  background: rgba(14, 16, 52, 0.95);
  border: 1px solid rgba(47, 49, 145, 0.65);
  border-radius: 0.75rem;
  padding: 0.55rem 0.75rem;
  max-width: 195px;
  margin: 0 auto;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.card-active-neon {
  background: #280812 !important;
  border: 1.5px solid rgba(244, 63, 94, 0.85) !important;
  box-shadow: 0 0 14px rgba(225, 29, 72, 0.45) !important;
}

.time-range-text {
  font-size: 0.78rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.datetime-sub {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.38rem;
  font-size: 0.72rem;
  font-weight: 500;
}

.shift-badge {
  padding: 0.12rem 0.48rem;
  border-radius: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.badge-shift-morning {
  background: rgba(255, 210, 0, 0.2);
  color: #FFD200;
  border: 1px solid rgba(255, 210, 0, 0.5);
}

.badge-shift-afternoon {
  background: rgba(47, 49, 145, 0.45);
  color: #c1c3ff;
  border: 1px solid rgba(90, 93, 195, 0.6);
}

.badge-shift-active {
  background: rgba(225, 29, 72, 0.45);
  color: #ffe4e6;
  border: 1px solid rgba(251, 113, 133, 0.6);
  font-weight: 700;
}

.badge-shift-postponed {
  background: rgba(249, 115, 22, 0.22);
  color: #fdba74;
  border: 1px solid rgba(249, 115, 22, 0.5);
  font-weight: 600;
}

.date-text {
  color: #cbd5e1;
  display: flex;
  align-items: center;
}

/* Meeting Title */
.meeting-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.45;
}

.title-ongoing {
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.title-postponed {
  color: #cbd5e1;
}

.postpone-tag {
  display: inline-block;
  background: rgba(249, 115, 22, 0.22);
  color: #fdba74;
  border: 1px solid rgba(249, 115, 22, 0.55);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.08rem 0.45rem;
  border-radius: 0.3rem;
  margin-right: 0.45rem;
  vertical-align: middle;
}

.row-postponed {
  background: rgba(38, 24, 30, 0.5) !important;
  border-bottom: 1px dashed rgba(249, 115, 22, 0.45) !important;
}

.row-postponed:hover {
  background: rgba(52, 32, 40, 0.65) !important;
}

/* Leader - SERC Green Accent */
.leader-name {
  font-size: 0.98rem;
  letter-spacing: 0.02em;
  color: #00A651;
  text-shadow: 0 0 10px rgba(0, 166, 81, 0.35);
}

.leader-ongoing {
  color: #00e676 !important;
  text-shadow: 0 0 12px rgba(0, 230, 118, 0.6) !important;
}

/* Info pill (Room & Location) */
.info-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.42rem 0.85rem;
  border-radius: 0.55rem;
  background: rgba(18, 20, 68, 0.85);
  border: 1px solid rgba(47, 49, 145, 0.65);
  font-size: 0.82rem;
  color: #e2e8f0;
}

.pill-active {
  background: #300a14 !important;
  border-color: rgba(244, 63, 94, 0.7) !important;
  color: #ffe4e6 !important;
}

/* Status Pills */
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.38rem 0.98rem;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.status-ongoing {
  background: #e11d48;
  color: #ffffff;
  box-shadow: 0 0 18px rgba(225, 29, 72, 0.85);
  animation: pulse-btn 1.8s infinite ease-in-out;
}

@keyframes pulse-btn {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.live-white-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ffffff;
  margin-right: 0.45rem;
  display: inline-block;
  animation: ping-dot 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes ping-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}

.status-completed {
  background: rgba(28, 31, 88, 0.75);
  border: 1px solid rgba(55, 58, 130, 0.8);
  color: #cbd5e1;
}

.status-upcoming {
  background: rgba(255, 210, 0, 0.15);
  border: 1px solid rgba(255, 210, 0, 0.65);
  color: #FFD200;
}

.status-postponed {
  background: rgba(249, 115, 22, 0.18);
  border: 1.5px solid rgba(249, 115, 22, 0.75);
  color: #fdba74;
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.25);
}

/* Footer */
.serc-footer {
  margin-top: 1rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #c4c7ee;
  padding: 0.25rem 0.75rem;
  gap: 1rem;
}

.footer-left {
  display: flex;
  align-items: center;
}

.footer-center {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #e2e8f0;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.divider-dot {
  color: rgba(47, 49, 145, 0.9);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  .brand-section, .clock-section {
    align-items: center;
    text-align: center;
  }
  .serc-footer {
    flex-direction: column;
    text-align: center;
  }
}
</style>
