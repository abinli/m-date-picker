import React from 'react';
// import ReactDOM from 'react-dom';
import classNames from 'classnames';
import Picker, { PickerItem } from 'rmc-picker';
import GregorianCalendar from 'gregorian-calendar';
import GregorianCalendarFormat from 'gregorian-calendar-format';
// import GregorianCalendarFormatCn from 'gregorian-calendar/lib/locale/zh_CN';
import zhCN from './locale/zh_CN';
import { getMaxDay } from './util';

const mode = {
  datetime: 'datetime',
  date: 'date',
  time: 'time',
};

function invalidDate(date) {
  if (isNaN(date)) {
    throw new Error('Invalid Date');
  }
  return date;
}

const MDatePicker = React.createClass({
  propTypes: {
    minDate: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.object]),
    maxDate: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.object]),
    mode: React.PropTypes.string,
    locale: React.PropTypes.object,
    timeZoneOffset: React.PropTypes.number,
    onDateChange: React.PropTypes.func,
  },
  getDefaultProps() {
    return {
      prefixCls: 'rmc-date-picker',
      minDate: new Date('2000'),
      maxDate: new Date('2030'),
      date: new Date(),
      mode: mode.date,
      locale: zhCN,
    };
  },
  getInitialState() {
    return {
      indexOfScrollers: 0,
    };
  },
  onValueChange(index, selectNameValue) {
    // console.log(index, selectNameValue);
    function formatDate(date, format) {
      const df = new GregorianCalendarFormat(format);
      return df.format(date);
    }
    const props = this.props;
    const newVal = [...this.value];
    newVal[index] = selectNameValue.value;
    let returnVal;
    const dFormat = `yyyy'${props.locale.year}'MM'${props.locale.month}'dd'${props.locale.day}'`;
    const tFormat = `HH'${props.locale.hour}'mm'${props.locale.minute}'`;
    const info = {changeIndex: index};
    if (props.mode === mode.datetime || props.mode === mode.date) {
      newVal[1] -= 1; // month decrease 1
      returnVal = this.newGregorianCalendar(new Date(...newVal));
      let format = dFormat;
      if (props.mode === mode.datetime) {
        format += ' ' + tFormat;
      }
      info.formatDate = formatDate(returnVal, format);
    } else {
      this.defaultDate.setHourOfDay(newVal[0]);
      this.defaultDate.setMinutes(newVal[1]);
      returnVal = this.defaultDate;
      info.formatDate = formatDate(this.defaultDate, tFormat);
    }

    if (this.props.onDateChange) {
      this.props.onDateChange(returnVal.time, info);
    }
  },
  getDateData(selYear, selMonth) {
    const locale = this.props.locale;
    const years = [];
    for (let i = this.minDateYear; i <= this.maxDateYear; i++) {
      years.push({value: i, name: i + locale.year});
    }

    const months = [];
    let minMonth = 1;
    let maxMonth = 12;
    if (this.minDateYear === selYear) {
      minMonth = this.minDateMonth;
    }
    if (this.maxDateYear === selYear) {
      maxMonth = this.maxDateMonth;
    }
    for (let i = minMonth; i <= maxMonth; i++) {
      months.push({value: i, name: i + locale.month});
    }

    const days = [];
    let minDay = 1;
    let maxDay = getMaxDay(selYear, selMonth);
    if (this.minDateYear === selYear && this.minDateMonth === selMonth) {
      minDay = this.minDateDay;
    }
    if (this.maxDateYear === selYear && this.maxDateMonth === selMonth) {
      maxDay = this.maxDateDay;
    }
    for (let i = minDay; i <= maxDay; i++) {
      days.push({value: i, name: i + locale.day});
    }
    return [years, months, days];
  },
  getTimeData(type, sel) {
    let minHour = 0;
    let maxHour = 23;
    let minMinute = 0;
    let maxMinute = 59;
    if (type === mode.datetime) {
      if (this.minDateYear === sel[0] && this.minDateMonth === sel[1] && this.minDateDay === sel[2]) {
        minHour = this.minDateHour;
        if (this.minDateHour === sel[3]) {
          minMinute = this.minDateMinute;
        }
      }
      if (this.maxDateYear === sel[0] && this.maxDateMonth === sel[1] && this.maxDateDay === sel[2]) {
        maxHour = this.maxDateHour;
        if (this.maxDateHour === sel[3]) {
          maxMinute = this.maxDateMinute;
        }
      }
    } else {
      if (this.minDateHour === sel[0]) {
        minHour = this.minDateHour;
        if (this.minDateHour === sel[1]) {
          minMinute = this.minDateMinute;
        }
      }
      if (this.maxDateHour === sel[0]) {
        maxHour = this.maxDateHour;
        if (this.maxDateHour === sel[1]) {
          maxMinute = this.maxDateMinute;
        }
      }
    }

    const hours = [];
    for (let i = minHour; i <= maxHour; i++) {
      hours.push({value: i, name: i + this.props.locale.hour});
    }

    const minutes = [];
    for (let i = minMinute; i <= maxMinute; i++) {
      minutes.push({value: i, name: i + this.props.locale.minute});
    }
    return [hours, minutes];
  },
  newGregorianCalendar(d) {
    const date = new GregorianCalendar(this.props.locale.format);
    // date.setTime(invalidDate(+new Date(d)));
    date.setTime(invalidDate(new Date(d).getTime())); // e.g +new Date('2003-23') is invalid Date
    if (('timeZoneOffset' in this.props) && typeof this.props.timeZoneOffset === 'number') {
      date.setTimezoneOffset(this.props.timeZoneOffset);
    }
    return date;
  },
  validDate(defaultDate, minDate, maxDate) {
    const defDateTime = defaultDate.getTime();
    const maxDateTime = maxDate.getTime();
    const minDateTime = minDate.getTime();
    if (defDateTime > maxDateTime || defDateTime < minDateTime || maxDateTime < minDateTime) {
      console.error('maxDate should great than minDate, defaultDate should be in middle of them');
      return false;
    }
    return true;
  },
  render() {
    const props = this.props;
    const defaultDate = this.newGregorianCalendar(props.date);
    this.defaultDate = defaultDate;
    let maxDate = this.newGregorianCalendar(props.maxDate);
    const minDate = this.newGregorianCalendar(props.minDate);
    this.validDate(defaultDate, minDate, maxDate);

    // console.log(maxDate.time, maxDate.getHourOfDay(), maxDate.getMinutes());
    if (!maxDate.getHourOfDay() && !maxDate.getMinutes()) {
      // max 为 00:00 取上一天 23:59
      maxDate = this.newGregorianCalendar(maxDate.time - 1000 * 60);
    }
    // console.log(maxDate.time, maxDate.getHourOfDay(), maxDate.getMinutes());

    this.minDateYear = minDate.getYear();
    this.maxDateYear = maxDate.getYear();
    this.minDateMonth = minDate.getMonth() + 1;
    this.maxDateMonth = maxDate.getMonth() + 1;
    this.minDateDay = minDate.getDayOfMonth();
    this.maxDateDay = maxDate.getDayOfMonth();
    this.minDateHour = minDate.getHourOfDay();
    this.maxDateHour = maxDate.getHourOfDay();
    this.minDateMinute = minDate.getMinutes();
    this.maxDateMinute = maxDate.getMinutes();

    let newVal = [
      defaultDate.getYear(),
      defaultDate.getMonth() + 1,
      defaultDate.getDayOfMonth(),
      defaultDate.getHourOfDay(),
      defaultDate.getMinutes(),
    ];
    let dataSource = [];
    if (props.mode === mode.datetime || props.mode === mode.date) {
      dataSource = [...this.getDateData(newVal[0], newVal[1])];
      if (props.mode === mode.datetime) {
        dataSource = dataSource.concat(this.getTimeData(mode.datetime, newVal));
      }
    } else {
      newVal = [defaultDate.getHourOfDay(), defaultDate.getMinutes()];
      dataSource = this.getTimeData(mode.time, newVal);
    }

    // make value array lenth equal with data array length
    dataSource.forEach((item, i) => {
      newVal[i] = newVal[i] === undefined ? '' : newVal[i];
    });

    this.value = newVal;

    return (<div className={classNames(props.className)}>
      {dataSource.map((item, i) => {
        return (<div key={i} className={`${props.prefixCls}-item`}>
          <Picker selectedValue={newVal[i]} onValueChange={this.onValueChange.bind(this, i)}>
            {item.map((it, ii) => {
              return <PickerItem key={ii} value={it.value} name={it.name} />;
            })}
          </Picker>
        </div>);
      })}
    </div>);
  },
});

export default MDatePicker;