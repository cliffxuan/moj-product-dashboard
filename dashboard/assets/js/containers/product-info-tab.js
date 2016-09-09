import moment from 'moment';
import React, { Component } from 'react';
import { Project, statusMapping } from '../libs/models';
import { numberWithCommas } from '../libs/utils';


export class ProductInfo extends Component {

  dateInEnglish(date) {
    return moment(date, 'YYYY-MM-DD').format('Do MMM YYYY');
  }

  dateInNum(date) {
    if (date === null) {
      return '-';
    }
    return moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY');
  }

  Status() {
    const status = this.props.project.status;
    let className = 'bold-xlarge status-text';
    if (status in statusMapping) {
      className = `${className} ${statusMapping[status]}`;
    }
    return (
      <div className="status-header">
        <span className={ className }>{ status || '-' }</span>
        <p className="bold-medium">Product status</p>
      </div>
    );
  }

  PhaseDates() {
    const { discoveryStart, alphaStart,
            betaStart, liveStart, endDate } = this.props.project;
    return (
      <div>
        <div className="grid-row">
          <div className="column-one-quarter">
            <p className="heading-small">Discovery started</p>
            <p>{ discoveryStart ? this.dateInEnglish(discoveryStart) : '-' }</p>
          </div>
          <div className="column-one-quarter">
            <p className="heading-small">Alpha started</p>
            <p>{ alphaStart ? this.dateInEnglish(alphaStart) : '-' }</p>
          </div>
          <div className="column-one-quarter">
            <p className="heading-small">Beta started</p>
            <p>{ betaStart ? this.dateInEnglish(betaStart) : '-' }</p>
          </div>
          <div className="column-one-quarter">
            <p className="heading-small">Live started</p>
            <p>{ liveStart? this.dateInEnglish(liveStart) : '-' }</p>
          </div>
        </div>
        <div className="grid-row">
          <div className="column-one-quarter">
            <p className="heading-small">Estimated end date</p>
            <p>{ endDate ? this.dateInEnglish(endDate) : '-' }</p>
          </div>
        </div>
      </div>
    );
  }

  Recurring(costs) {
    const sortedCosts = costs.sort(Project.compareDate('start_date', 'desc'));
    const Rows = () => {
      if (sortedCosts.length == 0) {
        return (
          <tr>
            <td>-</td>
            <td className="numeric">-</td>
            <td className="numeric">-</td>
            <td className="numeric">-</td>
          </tr>
        );
      }
      return (
        sortedCosts.map(cost => {
          const unit = {'Monthly' : 'month', 'Annually': 'year'}[cost.freq];
          return (
           <tr key={cost.id}>
             <td>{ cost.name || '' }</td>
             <td className="numeric">{ `\u00a3${numberWithCommas(cost.cost | 0)}/${unit}` }</td>
             <td className="numeric">{ this.dateInNum(cost['start_date']) }</td>
             <td className="numeric">{ this.dateInNum(cost['end_date']) }</td>
           </tr>
          )
        }
        )
      );
    }

    return (
      <table>
        <thead>
          <tr>
            <th scope="col">Recurring</th>
            <th className="numeric" scope="col">Amount</th>
            <th className="numeric" scope="col">Start Date</th>
            <th className="numeric" scope="col">End Date</th>
          </tr>
        </thead>
        <tbody>
          { Rows() }
        </tbody>
      </table>
    );
  }

  OneOff(costs) {
    const sortedCosts = costs.sort(Project.compareDate('start_date', 'desc'));
    const Rows = () => {
      if (sortedCosts.length == 0) {
        return (
          <tr>
            <td>-</td>
            <td className="numeric">-</td>
            <td className="numeric">-</td>
          </tr>
        );
      }
      return (
        sortedCosts.map(cost => (
          <tr key={cost.id}>
            <td>{ cost.name || '' }</td>
            <td className="numeric">{ `\u00a3${numberWithCommas(cost.cost | 0)}` }</td>
            <td className="numeric">{ this.dateInNum(cost['start_date']) }</td>
          </tr>
          )
        )
      );
    }

    return (
      <table>
        <thead>
          <tr>
            <th scope="col">One off</th>
            <th className="numeric" scope="col">Amount</th>
            <th className="numeric" scope="col">Date</th>
          </tr>
        </thead>
        <tbody>
          { Rows() }
        </tbody>
      </table>
    );
  }

  Budgets() {
    const budgets = this.props.project.budgets
      .sort(Project.compareDate('date', 'desc'));
    if (budgets.length == 0) {
      return (<p>-</p>);
    }
    return (
      <ul style={{marginTop: '20px'}}>
      {
        budgets.map(budget => (
          <li key={budget.date}>
            <span className="heading-small">
              { `Set on ${ this.dateInEnglish(budget.date) }` }
            </span>
            <br/>
            <span>
              {`\u00a3${numberWithCommas(budget.budget | 0)}`}
            </span>
          </li>
          )
        )
      }
      </ul>
    );
  }

  Team() {
    const { serviceManager, productManager, deliveryManager, serviceArea } = this.props.project;
    return (
      <div className="grid-row">
        <div className="column-one-quarter">
            <p className="heading-small">Service manager</p>
            <p>{ serviceManager || '-' }</p>
        </div>
        <div className="column-one-quarter">
            <p className="heading-small">Product manager</p>
            <p>{ productManager || '-' }</p>
        </div>
        <div className="column-one-quarter">
            <p className="heading-small">Delivery manager</p>
            <p>{ deliveryManager || '-' }</p>
        </div>
        <div className="column-one-quarter">
            <p className="heading-small">Service area</p>
            <p>{ serviceArea || '-' }</p>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div id="product-info">
        { this.Status() }
        <h3 className="heading-small">Product description</h3>
        <p>{ this.props.project.description || '-' }</p>
        <h3 className="heading-small">Phase dates</h3>
        { this.PhaseDates() }
        <h3 className="heading-small">Costs</h3>
        { this.Recurring(this.props.project.recurringCosts) }
        { this.OneOff(this.props.project.oneOffCosts) }
        <h3 className="heading-small">Budget</h3>
        { this.Budgets() }
        <h3 className="heading-small">Savings enabled</h3>
        { this.Recurring(this.props.project.recurringSavings) }
        { this.OneOff(this.props.project.oneOffSavings) }
        <h3 className="heading-small">Team description</h3>
        { this.Team() }
      </div>
    );
  }
}
