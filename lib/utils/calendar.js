import dateFormat from 'date-fns/format';
import parseDate from 'date-fns/parse';
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
import isToday from 'date-fns/is_today';
import isYesterday from 'date-fns/is_yesterday';
import isTomorrow from 'date-fns/is_tomorrow';
import addWeeks from 'date-fns/add_weeks';
import subWeeks from 'date-fns/sub_weeks';
import isThisWeek from 'date-fns/is_this_week';

export function getTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return `(${ _.startCase(_.last(tz.split('/'))) } time)`;
  } catch (e) {
    return '(Local time)';
  }
}

/**
 * determine if date and time values from the schedule form are in the past
 * @param  {Date}  dateValue
 * @param  {sttring}  timeValue
 * @return {boolean}
 */
export function isInThePast(dateValue, timeValue) {
  const date = dateFormat(dateValue, 'YYYY-MM-DD'),
    time = timeValue,
    datetime = parseDate(date + ' ' + time);

  return isPast(datetime);
}

export function calendar(date) {
  const tz = getTimezone();

  if (isToday(date)) {
    // today
    return distanceInWordsToNow(date, { includeSeconds: true, addSuffix: true });
  } else if (isYesterday(date)) {
    // yesterday
    return `Yesterday at ${dateFormat(date, 'h:mm A')} ${tz}`;
  } else if (isTomorrow(date)) {
    // tomorrow
    return `Tomorrow at ${dateFormat(date, 'h:mm A')} ${tz}`;
  } else if (isThisWeek(addWeeks(date, 1))) {
    // last week
    return `Last ${dateFormat(date, 'dddd [at] h:mm A')} ${tz}`;
  } else if (isThisWeek(subWeeks(date, 1))) {
    // next week
    return `${dateFormat(date, 'dddd [at] h:mm A')} ${tz}`;
  } else {
    return `${dateFormat(date, 'M/D/YYYY [at] h:mm A')} ${tz}`;
  }
}
