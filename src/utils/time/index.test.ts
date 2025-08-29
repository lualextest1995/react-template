import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    addDays,
    diffDays,
    diffHours,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    formatTime,
    fromUTC,
    getAge,
    getEndOfDay,
    getMonthRange,
    getStartOfDay,
    getTimezone,
    getWeekRange,
    getWorkingDays,
    isBusinessDay,
    isInRange,
    isToday,
    isTomorrow,
    isValidDate,
    isWeekend,
    isYesterday,
    now,
    subtractDays,
    today,
    tomorrow,
    toUTC,
    yesterday,
} from './index'

describe('Time Utils - Format Functions', () => {
    const testDate = new Date('2023-12-25T14:30:00')

    describe('formatDate', () => {
        it('should format date with default format', () => {
            expect(formatDate(testDate)).toBe('2023-12-25')
        })

        it('should format date with custom format', () => {
            expect(formatDate(testDate, 'DD/MM/YYYY')).toBe('25/12/2023')
        })

        it('should handle string input', () => {
            expect(formatDate('2023-12-25')).toBe('2023-12-25')
        })
    })

    describe('formatDateTime', () => {
        it('should format date and time', () => {
            expect(formatDateTime(testDate)).toBe('2023-12-25 14:30:00')
        })
    })

    describe('formatTime', () => {
        it('should format only time', () => {
            expect(formatTime(testDate)).toBe('14:30:00')
        })

        it('should format time with custom format', () => {
            expect(formatTime(testDate, 'HH:mm')).toBe('14:30')
        })
    })

    describe('formatRelativeTime', () => {
        beforeEach(() => {
            vi.useFakeTimers()
            vi.setSystemTime(new Date('2023-12-25T16:30:00'))
        })

        it('should return relative time for past dates', () => {
            const pastDate = new Date('2023-12-25T14:30:00')
            expect(formatRelativeTime(pastDate)).toBe('2 hours ago')
        })

        it('should return relative time for future dates', () => {
            const futureDate = new Date('2023-12-25T18:30:00')
            expect(formatRelativeTime(futureDate)).toBe('in 2 hours')
        })
    })
})

describe('Time Utils - Date Calculation Functions', () => {
    const baseDate = new Date('2023-12-25')

    describe('addDays', () => {
        it('should add days to date', () => {
            const result = addDays(baseDate, 5)
            expect(formatDate(result)).toBe('2023-12-30')
        })

        it('should handle negative days', () => {
            const result = addDays(baseDate, -5)
            expect(formatDate(result)).toBe('2023-12-20')
        })
    })

    describe('subtractDays', () => {
        it('should subtract days from date', () => {
            const result = subtractDays(baseDate, 5)
            expect(formatDate(result)).toBe('2023-12-20')
        })
    })

    describe('diffDays', () => {
        it('should calculate difference in days', () => {
            const date1 = new Date('2023-12-25')
            const date2 = new Date('2023-12-30')
            expect(diffDays(date1, date2)).toBe(5)
        })

        it('should return negative for past dates', () => {
            const date1 = new Date('2023-12-30')
            const date2 = new Date('2023-12-25')
            expect(diffDays(date1, date2)).toBe(-5)
        })
    })

    describe('diffHours', () => {
        it('should calculate difference in hours', () => {
            const date1 = new Date('2023-12-25T10:00:00')
            const date2 = new Date('2023-12-25T15:00:00')
            expect(diffHours(date1, date2)).toBe(5)
        })
    })

    describe('getStartOfDay', () => {
        it('should return start of day', () => {
            const date = new Date('2023-12-25T14:30:00')
            const result = getStartOfDay(date)
            expect(formatDateTime(result)).toBe('2023-12-25 00:00:00')
        })
    })

    describe('getEndOfDay', () => {
        it('should return end of day', () => {
            const date = new Date('2023-12-25T14:30:00')
            const result = getEndOfDay(date)
            expect(formatDateTime(result)).toBe('2023-12-25 23:59:59')
        })
    })
})

describe('Time Utils - Date Validation Functions', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2023-12-25T12:00:00'))
    })

    describe('isToday', () => {
        it('should return true for today', () => {
            const todayDate = new Date('2023-12-25T10:00:00')
            expect(isToday(todayDate)).toBe(true)
        })

        it('should return false for other days', () => {
            const otherDate = new Date('2023-12-24T10:00:00')
            expect(isToday(otherDate)).toBe(false)
        })
    })

    describe('isYesterday', () => {
        it('should return true for yesterday', () => {
            const yesterdayDate = new Date('2023-12-24T10:00:00')
            expect(isYesterday(yesterdayDate)).toBe(true)
        })
    })

    describe('isTomorrow', () => {
        it('should return true for tomorrow', () => {
            const tomorrowDate = new Date('2023-12-26T10:00:00')
            expect(isTomorrow(tomorrowDate)).toBe(true)
        })
    })

    describe('isWeekend', () => {
        it('should return true for Saturday', () => {
            const saturday = new Date('2023-12-23') // Saturday
            expect(isWeekend(saturday)).toBe(true)
        })

        it('should return true for Sunday', () => {
            const sunday = new Date('2023-12-24') // Sunday
            expect(isWeekend(sunday)).toBe(true)
        })

        it('should return false for weekdays', () => {
            const monday = new Date('2023-12-25') // Monday
            expect(isWeekend(monday)).toBe(false)
        })
    })

    describe('isValidDate', () => {
        it('should return true for valid date', () => {
            expect(isValidDate(new Date('2023-12-25'))).toBe(true)
        })

        it('should return false for invalid date', () => {
            expect(isValidDate(new Date('invalid'))).toBe(false)
        })

        it('should return false for null', () => {
            expect(isValidDate(null)).toBe(false)
        })
    })
})

describe('Time Utils - Range Functions', () => {
    describe('isInRange', () => {
        it('should return true if date is in range', () => {
            const date = new Date('2023-12-25')
            const start = new Date('2023-12-20')
            const end = new Date('2023-12-30')
            expect(isInRange(date, start, end)).toBe(true)
        })

        it('should return false if date is out of range', () => {
            const date = new Date('2023-12-15')
            const start = new Date('2023-12-20')
            const end = new Date('2023-12-30')
            expect(isInRange(date, start, end)).toBe(false)
        })
    })

    describe('getWeekRange', () => {
        it('should return week range for given date', () => {
            const date = new Date('2023-12-25') // Monday
            const { start, end } = getWeekRange(date)
            expect(formatDate(start)).toBe('2023-12-25') // Monday
            expect(formatDate(end)).toBe('2023-12-31') // Sunday
        })
    })

    describe('getMonthRange', () => {
        it('should return month range for given date', () => {
            const date = new Date('2023-12-15')
            const { start, end } = getMonthRange(date)
            expect(formatDate(start)).toBe('2023-12-01')
            expect(formatDate(end)).toBe('2023-12-31')
        })
    })
})

describe('Time Utils - Quick Access Functions', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2023-12-25T12:00:00'))
    })

    describe('now', () => {
        it('should return current date and time', () => {
            const result = now()
            expect(result).toBeInstanceOf(Date)
            expect(formatDateTime(result)).toBe('2023-12-25 12:00:00')
        })
    })

    describe('today', () => {
        it('should return today date', () => {
            const result = today()
            expect(formatDate(result)).toBe('2023-12-25')
        })
    })

    describe('tomorrow', () => {
        it('should return tomorrow date', () => {
            const result = tomorrow()
            expect(formatDate(result)).toBe('2023-12-26')
        })
    })

    describe('yesterday', () => {
        it('should return yesterday date', () => {
            const result = yesterday()
            expect(formatDate(result)).toBe('2023-12-24')
        })
    })
})

describe('Time Utils - Timezone Functions', () => {
    describe('toUTC', () => {
        it('should convert date to UTC', () => {
            const date = new Date('2023-12-25T12:00:00')
            const result = toUTC(date)
            expect(result).toBeInstanceOf(Date)
        })
    })

    describe('fromUTC', () => {
        it('should convert UTC to local timezone', () => {
            const utcDate = new Date('2023-12-25T12:00:00Z')
            const result = fromUTC(utcDate)
            expect(result).toBeInstanceOf(Date)
        })
    })

    describe('getTimezone', () => {
        it('should return current timezone', () => {
            const result = getTimezone()
            expect(typeof result).toBe('string')
        })
    })
})

describe('Time Utils - Business Logic Functions', () => {
    describe('getAge', () => {
        beforeEach(() => {
            vi.useFakeTimers()
            vi.setSystemTime(new Date('2023-12-25T12:00:00'))
        })

        it('should calculate age correctly', () => {
            const birthDate = new Date('1990-12-25')
            expect(getAge(birthDate)).toBe(33)
        })

        it('should handle birthday not yet passed this year', () => {
            const birthDate = new Date('1990-12-26')
            expect(getAge(birthDate)).toBe(32)
        })
    })

    describe('getWorkingDays', () => {
        it('should calculate working days excluding weekends', () => {
            const start = new Date('2023-12-25') // Monday
            const end = new Date('2023-12-29') // Friday
            expect(getWorkingDays(start, end)).toBe(5)
        })

        it('should exclude weekends from count', () => {
            const start = new Date('2023-12-23') // Saturday
            const end = new Date('2023-12-26') // Tuesday
            expect(getWorkingDays(start, end)).toBe(2) // Monday, Tuesday
        })
    })

    describe('isBusinessDay', () => {
        it('should return true for weekdays', () => {
            const monday = new Date('2023-12-25')
            expect(isBusinessDay(monday)).toBe(true)
        })

        it('should return false for weekends', () => {
            const saturday = new Date('2023-12-23')
            expect(isBusinessDay(saturday)).toBe(false)
        })
    })
})
