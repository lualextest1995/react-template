import dayjs from 'dayjs'
import isLeapYear from 'dayjs/plugin/isLeapYear'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'

// 啟用 dayjs 插件
dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(weekOfYear)
dayjs.extend(isLeapYear)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

// 類型定義
type DateInput = Date | string | number
type DateRange = { start: Date; end: Date }

// =============================================================================
// 格式化功能
// =============================================================================

/**
 * 格式化日期
 * @param date - 要格式化的日期
 * @param format - 格式字符串，預設為 'YYYY-MM-DD'
 * @returns 格式化後的日期字符串
 */
export const formatDate = (date: DateInput, format = 'YYYY-MM-DD'): string =>
    dayjs(date).format(format)

/**
 * 格式化日期時間
 * @param date - 要格式化的日期
 * @param format - 格式字符串，預設為 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化後的日期時間字符串
 */
export const formatDateTime = (date: DateInput, format = 'YYYY-MM-DD HH:mm:ss'): string =>
    dayjs(date).format(format)

/**
 * 格式化時間
 * @param date - 要格式化的日期
 * @param format - 格式字符串，預設為 'HH:mm:ss'
 * @returns 格式化後的時間字符串
 */
export const formatTime = (date: DateInput, format = 'HH:mm:ss'): string =>
    dayjs(date).format(format)

/**
 * 格式化相對時間
 * @param date - 要格式化的日期
 * @returns 相對時間字符串（如：2小時前）
 */
export const formatRelativeTime = (date: DateInput): string => dayjs(date).fromNow()

// =============================================================================
// 日期計算功能
// =============================================================================

/**
 * 增加天數
 * @param date - 基準日期
 * @param days - 要增加的天數
 * @returns 新的日期物件
 */
export const addDays = (date: DateInput, days: number): Date =>
    dayjs(date).add(days, 'day').toDate()

/**
 * 減少天數
 * @param date - 基準日期
 * @param days - 要減少的天數
 * @returns 新的日期物件
 */
export const subtractDays = (date: DateInput, days: number): Date =>
    dayjs(date).subtract(days, 'day').toDate()

/**
 * 計算兩個日期之間的天數差
 * @param date1 - 第一個日期
 * @param date2 - 第二個日期
 * @returns 天數差（正數表示 date2 在 date1 之後）
 */
export const diffDays = (date1: DateInput, date2: DateInput): number =>
    dayjs(date2).diff(dayjs(date1), 'day')

/**
 * 計算兩個日期之間的小時差
 * @param date1 - 第一個日期
 * @param date2 - 第二個日期
 * @returns 小時差（正數表示 date2 在 date1 之後）
 */
export const diffHours = (date1: DateInput, date2: DateInput): number =>
    dayjs(date2).diff(dayjs(date1), 'hour')

/**
 * 取得一天的開始時間
 * @param date - 日期
 * @returns 該日期當天 00:00:00 的日期物件
 */
export const getStartOfDay = (date: DateInput): Date => dayjs(date).startOf('day').toDate()

/**
 * 取得一天的結束時間
 * @param date - 日期
 * @returns 該日期當天 23:59:59 的日期物件
 */
export const getEndOfDay = (date: DateInput): Date => dayjs(date).endOf('day').toDate()

// =============================================================================
// 日期驗證功能
// =============================================================================

/**
 * 檢查是否為今天
 * @param date - 要檢查的日期
 * @returns 是否為今天
 */
export const isToday = (date: DateInput): boolean => dayjs(date).isSame(dayjs(), 'day')

/**
 * 檢查是否為昨天
 * @param date - 要檢查的日期
 * @returns 是否為昨天
 */
export const isYesterday = (date: DateInput): boolean =>
    dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day')

/**
 * 檢查是否為明天
 * @param date - 要檢查的日期
 * @returns 是否為明天
 */
export const isTomorrow = (date: DateInput): boolean =>
    dayjs(date).isSame(dayjs().add(1, 'day'), 'day')

/**
 * 檢查是否為週末
 * @param date - 要檢查的日期
 * @returns 是否為週末（週六或週日）
 */
export const isWeekend = (date: DateInput): boolean => {
    const day = dayjs(date).day()
    return day === 0 || day === 6 // 0 = Sunday, 6 = Saturday
}

/**
 * 驗證日期是否有效
 * @param date - 要驗證的日期
 * @returns 是否為有效日期
 */
export const isValidDate = (date: unknown): boolean => {
    if (date === null || date === undefined) {
        return false
    }
    return dayjs(date as DateInput).isValid()
}

// =============================================================================
// 時間範圍功能
// =============================================================================

/**
 * 檢查日期是否在指定範圍內
 * @param date - 要檢查的日期
 * @param startDate - 範圍開始日期
 * @param endDate - 範圍結束日期
 * @returns 是否在範圍內
 */
export const isInRange = (date: DateInput, startDate: DateInput, endDate: DateInput): boolean => {
    const target = dayjs(date)
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    return target.isSameOrAfter(start) && target.isSameOrBefore(end)
}

/**
 * 取得指定日期所在週的範圍
 * @param date - 指定日期
 * @returns 該週的開始和結束日期
 */
export const getWeekRange = (date: DateInput): DateRange => {
    const target = dayjs(date)
    const start = target.startOf('week').add(1, 'day') // 週一開始
    const end = target.endOf('week').add(1, 'day') // 週日結束
    return {
        start: start.toDate(),
        end: end.toDate(),
    }
}

/**
 * 取得指定日期所在月份的範圍
 * @param date - 指定日期
 * @returns 該月的開始和結束日期
 */
export const getMonthRange = (date: DateInput): DateRange => {
    const target = dayjs(date)
    return {
        start: target.startOf('month').toDate(),
        end: target.endOf('month').toDate(),
    }
}

// =============================================================================
// 快捷訪問功能
// =============================================================================

/**
 * 取得當前時間
 * @returns 當前日期時間物件
 */
export const now = (): Date => dayjs().toDate()

/**
 * 取得今天日期
 * @returns 今天的日期物件
 */
export const today = (): Date => dayjs().startOf('day').toDate()

/**
 * 取得明天日期
 * @returns 明天的日期物件
 */
export const tomorrow = (): Date => dayjs().add(1, 'day').startOf('day').toDate()

/**
 * 取得昨天日期
 * @returns 昨天的日期物件
 */
export const yesterday = (): Date => dayjs().subtract(1, 'day').startOf('day').toDate()

// =============================================================================
// 時區處理功能
// =============================================================================

/**
 * 轉換為 UTC 時間
 * @param date - 要轉換的日期
 * @returns UTC 時間的日期物件
 */
export const toUTC = (date: DateInput): Date => dayjs(date).utc().toDate()

/**
 * 從 UTC 轉換為本地時間
 * @param date - UTC 時間
 * @param timezone - 目標時區（可選，預設為本地時區）
 * @returns 本地時間的日期物件
 */
export const fromUTC = (date: DateInput, timezone?: string): Date => {
    const utcDate = dayjs.utc(date)
    return timezone ? utcDate.tz(timezone).toDate() : utcDate.local().toDate()
}

/**
 * 取得當前時區
 * @returns 時區字符串
 */
export const getTimezone = (): string => dayjs.tz.guess()

// =============================================================================
// 業務邏輯功能
// =============================================================================

/**
 * 計算年齡
 * @param birthDate - 出生日期
 * @param referenceDate - 參考日期（可選，預設為今天）
 * @returns 年齡
 */
export const getAge = (birthDate: DateInput, referenceDate: DateInput = new Date()): number =>
    dayjs(referenceDate).diff(dayjs(birthDate), 'year')

/**
 * 計算工作日數量（排除週末）
 * @param startDate - 開始日期
 * @param endDate - 結束日期
 * @returns 工作日數量
 */
export const getWorkingDays = (startDate: DateInput, endDate: DateInput): number => {
    let count = 0
    let current = dayjs(startDate)
    const end = dayjs(endDate)

    while (current.isSameOrBefore(end)) {
        if (!isWeekend(current.toDate())) {
            count++
        }
        current = current.add(1, 'day')
    }

    return count
}

/**
 * 檢查是否為工作日
 * @param date - 要檢查的日期
 * @returns 是否為工作日（週一到週五）
 */
export const isBusinessDay = (date: DateInput): boolean => !isWeekend(date)
