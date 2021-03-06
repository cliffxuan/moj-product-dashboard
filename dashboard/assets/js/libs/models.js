import 'whatwg-fetch';
import moment from 'moment';

import { startOfMonth, endOfMonth, thisCalendarYear,
         thisFinancialYear, thisQuarter, lastCalendarYear,
         lastFinancialYear, lastQuarter, oneDayBefore,
         values, max, min } from './utils';


export const statusMapping = {
  'OK': 'status-green',
  'At risk': 'status-amber',
  'In trouble': 'status-red',
  'Paused': 'status-grey'
};

/**
 * send a POST request to the backend to retrieve product profile
 */
export function getProductData(type, id) {
  const urls = {
    'product': `/api/products/${id}`,
    'product-group': `/api/product-groups/${id}`
  };
  const init = {
    credentials: 'same-origin',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  return fetch(urls[type], init)
    .then(response => response.json());
}

/**
 * send a POST request to the backend to retrieve service area profile
 */
export function getServiceData(id) {
  const init = {
    credentials: 'same-origin',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  };
  return fetch(`/api/services/${id}`, init)
    .then(response => response.json());
}


/**
 * send a POST request to the backend to retrieve products profile
 */
export function getPortfolioData() {
  const init = {
    credentials: 'same-origin',
    method: 'GET',
  };
  return fetch('/api/services', init)
    .then(response => response.json());
}

/**
 * parse the financial infomation about the product
 */
export function parseProductFinancials(financial) {
  const result = {};
  let spendCumulative = 0;
  let savingsCumulative = 0;

  Object.keys(financial).sort().map(month => {
    const mf = financial[month];
    const budget = parseFloat(mf['budget']);
    const total = parseFloat(mf['contractor']) +
                  parseFloat(mf['non-contractor']) +
                  parseFloat(mf['additional']);
    const savings = parseFloat(mf['savings']);

    spendCumulative += total;
    savingsCumulative += savings;
    const remaining = budget - spendCumulative;
    const ms = moment(month, 'YYYY-MM').format('YYYY-MM');
    result[ms] = { total, spendCumulative, budget, remaining, savings, savingsCumulative };
  });

  return result;
}


export class Product {
  constructor(productJSON) {
    Object.assign(this, productJSON);
  }

  get rag() {
    return this['financial_rag'];
  }

  get firstDate() {
    const firstDate = this['first_date'];
    return firstDate ? startOfMonth(firstDate) : null;
  }

  get lastDate() {
    const lastDate = this['last_date'];
    return lastDate? endOfMonth(lastDate) : null;
  }

  get discoveryStart() {
    return this['discovery_date'];
  }

  get alphaStart() {
    return this['alpha_date'];
  }

  get betaStart() {
    return this['beta_date'];
  }

  get liveStart() {
    return this['live_date'];
  }

  get endDate() {
    return this['end_date'];
  }

  get serviceArea() {
    return this['service_area'].name;
  }

  get productManager() {
    return this.managers['product_manager'];
  }

  get deliveryManager() {
    return this.managers['delivery_manager'];
  }

  get serviceManager() {
    return this.managers['service_manager'];
  }

  get lastUpdated() {
    if (this['last_updated']) {
      return moment(this['last_updated']).format('DD/MM/YYYY H:mm');
    }
  }

  get monthlyFinancials() {
    return parseProductFinancials(this.financial['time_frames']);
  }

  get keyDatesFinancials() {
    const result = {};
    values(this.financial['key_dates'])
      .map(val => result[val.date] = val.stats);
    return result;
  }

  get phases() {
    return {
      'discovery': {
        start: this.discoveryStart,
        end: this.alphaStart,
        name: 'Discovery',
        color: '#972c86'
      },
      'alpha': {
        start: this.alphaStart,
        end: this.betaStart,
        name: 'Alpha',
        color: '#d53880'
      },
      'beta': {
        start: this.betaStart,
        end: this.liveStart,
        name: 'Beta',
        color: '#fd7743'
      },
      'live': {
        start: this.liveStart,
        name: 'Live',
        color: '#839951'
      }
    }
  };

  get oneOffCosts() {
    return values(this.costs).filter(cost => cost.freq == 'One off');
  };

  get recurringCosts() {
    return values(this.costs)
      .filter(cost => cost.freq == 'Monthly' || cost.freq == 'Annually');
  };

  get oneOffSavings() {
    return values(this.savings).filter(cost => cost.freq == 'One off');
  };

  get recurringSavings() {
    return values(this.savings)
      .filter(cost => cost.freq == 'Monthly' || cost.freq == 'Annually');
  };

  get budgets() {
    const returned = values(this.financial['key_dates'])
      .filter(data => data.type == 'new budget set')
      .map(data => ({
        name: data.name,
        date: data.date,
        budget: data.stats.budget
      }));
    return returned;
  }

  get timeFrames() {
    const now = moment();
    const result = {
      'entire-time-span': {
        name: 'Entire product life time',
        startDate: this.firstDate,
        endDate: this.lastDate,
        isPhase: false
      },
      'this-year': {
        name: 'This calendar year',
        startDate: thisCalendarYear(now).startDate,
        endDate: thisCalendarYear(now).endDate,
        isPhase: false
      },
      'this-financial-year': {
        name: 'This financial year',
        startDate: thisFinancialYear(now).startDate,
        endDate: thisFinancialYear(now).endDate,
        isPhase: false
      },
      'this-quarter': {
        name: 'This quarter',
        startDate: thisQuarter(now).startDate,
        endDate: thisQuarter(now).endDate,
        isPhase: false
      },
      'last-year': {
        name: 'Last calendar year',
        startDate: lastCalendarYear(now).startDate,
        endDate: lastCalendarYear(now).endDate,
        isPhase: false
      },
      'last-financial-year': {
        name: 'Last financial year',
        startDate: lastFinancialYear(now).startDate,
        endDate: lastFinancialYear(now).endDate,
        isPhase: false
      },
      'last-quarter': {
        name: 'Last quarter',
        startDate: lastQuarter(now).startDate,
        endDate: lastQuarter(now).endDate,
        isPhase: false
      },
    };
    const phases = this.phases;
    Object.keys(phases).map(id => {
      const {start, end, name} = phases[id];
      const formatDate = (date) => moment(date).format('D MMM YY');
      if (start && end ) {
        result[id] = {
          name: `${name} (${formatDate(start)} - ${formatDate(end)})`,
          startDate: startOfMonth(start),
          endDate: endOfMonth(oneDayBefore(end)),
          isPhase: true
        }
      }
    });
    result['custom-range'] = {
      name: 'Custom date range',
      startDate: null,
      endDate: null
    };
    return result;
  }

  matchTimeFrame(startDate, endDate) {
    const timeFrames = this.timeFrames;
    const matched = Object.keys(timeFrames).filter(
        key => {
          const val = timeFrames[key];
          // do not match time frame for phases because they are mostly
          // often not whole months
          return (!val.isPhase && val.startDate == startDate && val.endDate == endDate);
        });
    if (matched.length > 0) {
      return matched[0];
    }
    return 'custom-range';
  }

  statsInPhase(phase) {
    const { start, end } = this.phases[phase];
    const startFinancials = this.keyDatesFinancials[start];
    const endFinancials = this.keyDatesFinancials[end];
    return {
      budget: endFinancials.budget,
      spend: endFinancials.total - startFinancials.total,
      savings: endFinancials.savings - startFinancials.savings
    }
  }

  statsBetween(startMonth, endMonth) {
    const monthly = this.monthlyFinancials;
    const months = Object.keys(monthly).sort();
    if (months.length == 0) {
      return {budget: 0, spend: 0, savngs: 0};
    }

    // find the closest month with data for both startMonth and endMonth
    const lower = min([max([startMonth, months[0]]), months.slice(-1)[0]]);
    const upper = min([max([endMonth, months[0]]), months.slice(-1)[0]]);

    const budget = monthly[upper].budget;
    const spend = monthly[upper].spendCumulative
      - monthly[lower].spendCumulative
      + monthly[lower].total;
    const savings = monthly[upper].savingsCumulative
      - monthly[lower].savingsCumulative
      + monthly[lower].savings;
    return {budget, spend, savings};
  }

  static compareDate(key, order) {
    return function(obj1, obj2) {
      const v1 = obj1[key];
      const v2 = obj2[key];
      if (v1 > v2) {
        return order == 'desc' ? -1 : 1;
      };
      if (v1 < v2) {
        return order == 'desc' ? 1 : -1;
      };
      return 0;
    }
  };
}
